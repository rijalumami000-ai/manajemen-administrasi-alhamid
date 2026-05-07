# Design Document: Smart Migration with Auto-Advance & Alumni Management

## Overview

This design document specifies the architecture and implementation details for enhancing the existing academic year migration system with intelligent class-level advancement and comprehensive alumni management. The system will automatically advance students through their educational tracks (Diniyah and Sekolah) while correctly identifying graduation points and managing alumni status transitions.

### Key Design Goals

1. **Automated Class Advancement**: Eliminate manual class assignment during migration by implementing rule-based auto-advancement
2. **Intelligent Alumni Detection**: Automatically identify graduation points and create alumni records based on educational track completion
3. **Dual Track Support**: Handle students enrolled in both Diniyah and Sekolah tracks independently
4. **Transaction Safety**: Ensure all migration operations are atomic with full rollback capability
5. **Backward Compatibility**: Integrate seamlessly with existing migration infrastructure

### Current System Context

The existing system provides:
- Manual migration with class selection per student
- Basic rollback functionality
- Status tracking (aktif, lulus, tidak_naik)
- Migration logging for audit trails

This design extends the system with:
- Automatic class level progression based on business rules
- Alumni record creation at graduation points
- Enhanced status transitions for MTs graduates
- Validation of target class availability

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Migration Controller                      │
│  (POST /api/tahun-ajaran/migrate)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──► Validation Layer
                 │    ├─ Target Year Validation
                 │    ├─ Class Availability Check
                 │    └─ Alumni Exclusion Check
                 │
                 ├──► Auto-Advance Engine
                 │    ├─ Class Progression Mapper
                 │    ├─ Diniyah Track Handler
                 │    ├─ Sekolah Track Handler
                 │    └─ Dual Track Coordinator
                 │
                 ├──► Alumni Manager
                 │    ├─ Graduation Point Detector
                 │    ├─ Alumni Record Creator
                 │    └─ Status Transition Handler
                 │
                 └──► Transaction Manager
                      ├─ Database Transaction Control
                      ├─ Migration Log Writer
                      └─ Rollback Handler
```

### Component Responsibilities

#### 1. Migration Controller
- **Purpose**: Orchestrate the entire migration process
- **Responsibilities**:
  - Receive migration requests with excluded santri IDs
  - Coordinate validation, advancement, and alumni management
  - Manage database transactions
  - Return migration summary results

#### 2. Validation Layer
- **Purpose**: Ensure migration preconditions are met
- **Responsibilities**:
  - Verify target year exists or create it
  - Validate all required target classes exist
  - Exclude existing alumni from migration
  - Check source year is active

#### 3. Auto-Advance Engine
- **Purpose**: Automatically determine next class level for each santri
- **Responsibilities**:
  - Map current class to next class based on progression rules
  - Handle special cases (Sifir→1→SP→2)
  - Process Diniyah and Sekolah tracks independently
  - Select appropriate target class with matching jenis and tingkat

#### 4. Alumni Manager
- **Purpose**: Detect graduation and manage alumni records
- **Responsibilities**:
  - Identify santri at graduation points (tingkat 6, 9, 12)
  - Apply graduation rules based on track enrollment
  - Create alumni records with complete educational history
  - Update santri status appropriately

#### 5. Transaction Manager
- **Purpose**: Ensure data consistency and enable rollback
- **Responsibilities**:
  - Begin/commit/rollback database transactions
  - Create migration log entries
  - Update tahun ajaran statuses
  - Handle rollback operations

## Components and Interfaces

### Database Schema

#### Existing Tables (No Changes Required)

**kelas**
```sql
CREATE TABLE kelas (
  id SERIAL PRIMARY KEY,
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('Diniyah', 'Sekolah')),
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (jenis, nama)
);
```

**santri_tahun_ajaran**
```sql
CREATE TABLE santri_tahun_ajaran (
  id SERIAL PRIMARY KEY,
  tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id),
  santri_id INTEGER NOT NULL REFERENCES santri(id),
  kelas_diniyah_id INTEGER REFERENCES kelas(id),
  kelas_sekolah_id INTEGER REFERENCES kelas(id),
  kamar_id INTEGER REFERENCES kamar(id),
  status VARCHAR(30) NOT NULL DEFAULT 'aktif' 
    CHECK (status IN ('aktif', 'draft', 'lulus', 'alumni', 'pindah', 'keluar', 'tidak_naik')),
  catatan TEXT,
  nis VARCHAR(50) NOT NULL,
  -- ... other fields
  UNIQUE (tahun_ajaran_id, santri_id)
);
```

**alumni**
```sql
CREATE TABLE alumni (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER REFERENCES santri(id),
  nis VARCHAR(50) NOT NULL,
  nik VARCHAR(50),
  nama VARCHAR(150) NOT NULL,
  tahun_lulus INTEGER NOT NULL,
  kelas_terakhir VARCHAR(100),
  -- ... other fields
);
```

**migration_log**
```sql
CREATE TABLE migration_log (
  id SERIAL PRIMARY KEY,
  source_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  target_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  migrated_count INTEGER NOT NULL,
  excluded_santri_ids INTEGER[],
  migration_date TIMESTAMP DEFAULT NOW()
);
```

#### Schema Enhancement: Adding tingkat to kelas

To support auto-advancement, we need to add a `tingkat` column to the `kelas` table:

```sql
ALTER TABLE kelas ADD COLUMN tingkat INTEGER;

-- Update existing records based on nama patterns
UPDATE kelas SET tingkat = 0 WHERE jenis = 'Diniyah' AND nama ILIKE '%sifir%';
UPDATE kelas SET tingkat = 1 WHERE jenis = 'Diniyah' AND nama ~ '^(1|Kelas 1)';
UPDATE kelas SET tingkat = 2 WHERE jenis = 'Diniyah' AND nama ~ '^(2|Kelas 2)';
-- ... continue for all levels

-- For Kelas SP (Special Program), use tingkat 1 with special marker in nama
UPDATE kelas SET tingkat = 1 WHERE jenis = 'Diniyah' AND nama ILIKE '%SP%';

-- Add constraint after data migration
ALTER TABLE kelas ALTER COLUMN tingkat SET NOT NULL;
CREATE INDEX idx_kelas_jenis_tingkat ON kelas(jenis, tingkat);
```

**Alternative Approach (if schema change is not feasible):**
Extract tingkat from `nama` field using regex patterns during runtime:
- Sifir → tingkat 0
- "1", "1A", "1B", "Kelas 1" → tingkat 1
- "SP", "Kelas SP" → tingkat 1 (special marker)
- "2", "2A", "Kelas 2" → tingkat 2
- etc.

### API Endpoints

#### Enhanced Migration Endpoint

**POST /api/tahun-ajaran/migrate**

Request:
```json
{
  "target_kode": "2026-2027",  // Optional, auto-generated if not provided
  "excluded_santri_ids": [123, 456]  // Santri who won't advance
}
```

Response (Success):
```json
{
  "message": "Migrasi ke tahun ajaran 2026-2027 berhasil.",
  "source": {
    "id": 10,
    "kode": "2025-2026"
  },
  "target": {
    "id": 11,
    "kode": "2026-2027"
  },
  "migrated": 450,
  "excluded": 2,
  "alumni_created": 35,
  "mts_graduates": 28
}
```

Response (Validation Error):
```json
{
  "error": "Missing target classes",
  "missing_classes": [
    { "jenis": "Diniyah", "tingkat": 3 },
    { "jenis": "Sekolah", "tingkat": 10 }
  ]
}
```

#### Rollback Endpoint (Enhanced)

**POST /api/tahun-ajaran/rollback**

Response:
```json
{
  "message": "Rollback ke tahun ajaran 2025-2026 berhasil.",
  "sourceYear": { "id": 10, "kode": "2025-2026" },
  "currentYear": { "id": 11, "kode": "2026-2027" },
  "deletedCount": 450,
  "restoredCount": 452,
  "alumni_deleted": 35
}
```

### Service Layer Interfaces

#### Auto-Advance Engine

```javascript
class AutoAdvanceEngine {
  /**
   * Determine next class for a santri based on current enrollment
   * @param {Object} santri - Current santri record
   * @param {Array} availableClasses - All classes in target year
   * @returns {Object} { kelas_diniyah_id, kelas_sekolah_id }
   */
  async advanceSantri(santri, availableClasses) {
    const diniyahNext = santri.kelas_diniyah_id 
      ? await this.advanceDiniyah(santri.kelas_diniyah_id, availableClasses)
      : null;
    
    const sekolahNext = santri.kelas_sekolah_id
      ? await this.advanceSekolah(santri.kelas_sekolah_id, availableClasses)
      : null;
    
    return { kelas_diniyah_id: diniyahNext, kelas_sekolah_id: sekolahNext };
  }

  /**
   * Advance Diniyah class level
   * @param {number} currentKelasId - Current kelas ID
   * @param {Array} availableClasses - Available classes
   * @returns {number|null} Next kelas ID or null if graduated
   */
  async advanceDiniyah(currentKelasId, availableClasses) {
    const currentKelas = await this.getKelasById(currentKelasId);
    const nextTingkat = this.getNextDiniyahTingkat(currentKelas);
    
    if (nextTingkat === null) return null; // Graduated
    
    return this.findMatchingKelas(availableClasses, 'Diniyah', nextTingkat);
  }

  /**
   * Advance Sekolah class level
   * @param {number} currentKelasId - Current kelas ID
   * @param {Array} availableClasses - Available classes
   * @returns {number|null} Next kelas ID or null if graduated
   */
  async advanceSekolah(currentKelasId, availableClasses) {
    const currentKelas = await this.getKelasById(currentKelasId);
    const nextTingkat = currentKelas.tingkat + 1;
    
    if (nextTingkat > 12) return null; // Graduated
    
    return this.findMatchingKelas(availableClasses, 'Sekolah', nextTingkat);
  }

  /**
   * Get next Diniyah tingkat based on special progression rules
   * @param {Object} currentKelas - Current kelas object
   * @returns {number|null} Next tingkat or null if graduated
   */
  getNextDiniyahTingkat(currentKelas) {
    const { tingkat, nama } = currentKelas;
    
    // Special cases
    if (tingkat === 0) return 1; // Sifir → Kelas 1
    if (tingkat === 1 && !nama.includes('SP')) return 1; // Kelas 1 → Kelas SP (same tingkat)
    if (tingkat === 1 && nama.includes('SP')) return 2; // Kelas SP → Kelas 2
    if (tingkat === 6) return null; // Graduated
    
    // Standard progression
    return tingkat + 1;
  }
}
```

#### Alumni Manager

```javascript
class AlumniManager {
  /**
   * Check if santri should become alumni and create record if needed
   * @param {Object} santri - Santri record with class assignments
   * @param {Object} sourceYear - Source tahun ajaran
   * @param {Object} client - Database client for transaction
   * @returns {boolean} True if alumni record created
   */
  async processGraduation(santri, sourceYear, client) {
    const graduationStatus = this.detectGraduationPoint(santri);
    
    if (graduationStatus.shouldBecomeAlumni) {
      await this.createAlumniRecord(santri, sourceYear, graduationStatus, client);
      await this.updateSantriStatus(santri.id, sourceYear.id, 'alumni', client);
      return true;
    }
    
    if (graduationStatus.isMtsGraduate) {
      await this.markMtsGraduate(santri.id, sourceYear.id, client);
      return false;
    }
    
    return false;
  }

  /**
   * Detect graduation point and determine alumni eligibility
   * @param {Object} santri - Santri with kelas info
   * @returns {Object} Graduation status
   */
  detectGraduationPoint(santri) {
    const diniyahTingkat = santri.kelas_diniyah_tingkat;
    const sekolahTingkat = santri.kelas_sekolah_tingkat;
    
    // MA Graduation (tingkat 12) - always becomes alumni
    if (sekolahTingkat === 12) {
      return {
        shouldBecomeAlumni: true,
        isMtsGraduate: false,
        status: diniyahTingkat === 6 ? 'Lulus Diniyah & MA' : 'Lulus MA'
      };
    }
    
    // MTs Graduation (tingkat 9) - marked but not alumni
    if (sekolahTingkat === 9) {
      return {
        shouldBecomeAlumni: false,
        isMtsGraduate: true,
        status: 'Lulus MTs'
      };
    }
    
    // Diniyah Graduation (tingkat 6) - only if no Sekolah enrollment
    if (diniyahTingkat === 6 && !sekolahTingkat) {
      return {
        shouldBecomeAlumni: true,
        isMtsGraduate: false,
        status: 'Lulus Diniyah Kelas 6'
      };
    }
    
    return {
      shouldBecomeAlumni: false,
      isMtsGraduate: false,
      status: null
    };
  }

  /**
   * Create alumni record with complete educational history
   * @param {Object} santri - Santri data
   * @param {Object} sourceYear - Source tahun ajaran
   * @param {Object} graduationStatus - Graduation details
   * @param {Object} client - Database client
   */
  async createAlumniRecord(santri, sourceYear, graduationStatus, client) {
    await client.query(`
      INSERT INTO alumni (
        santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
        tahun_lulus, kelas_terakhir, alamat, keterangan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (santri_id) DO NOTHING
    `, [
      santri.santri_id,
      santri.nis,
      santri.nik,
      santri.nama,
      santri.tempat_lahir,
      santri.tanggal_lahir,
      sourceYear.tahun_selesai,
      graduationStatus.status,
      santri.alamat,
      `Lulus pada tahun ajaran ${sourceYear.kode}`
    ]);
  }
}
```

## Data Models

### Class Progression Map

```javascript
const DINIYAH_PROGRESSION = {
  0: { next: 1, name: 'Sifir → Kelas 1' },
  1: { 
    next: (currentNama) => currentNama.includes('SP') ? 2 : 1,
    name: 'Kelas 1 → SP or SP → 2'
  },
  2: { next: 3, name: 'Kelas 2 → 3' },
  3: { next: 4, name: 'Kelas 3 → 4' },
  4: { next: 5, name: 'Kelas 4 → 5' },
  5: { next: 6, name: 'Kelas 5 → 6' },
  6: { next: null, name: 'Graduation' }
};

const SEKOLAH_PROGRESSION = {
  7: { next: 8, stage: 'MTs' },
  8: { next: 9, stage: 'MTs' },
  9: { next: 10, stage: 'MTs → MA', milestone: 'Lulus MTs' },
  10: { next: 11, stage: 'MA' },
  11: { next: 12, stage: 'MA' },
  12: { next: null, stage: 'Graduation', milestone: 'Lulus MA' }
};
```

### Santri Status State Machine

```
┌─────────┐
│  aktif  │ ◄─── Initial state for all migrated santri
└────┬────┘
     │
     ├──► lulus (MTs graduates continuing to MA)
     │
     ├──► alumni (Final graduation: Diniyah 6 only, or MA 12)
     │
     ├──► tidak_naik (Excluded from migration)
     │
     ├──► pindah (Transfer out)
     │
     └──► keluar (Dropped out)
```

### Migration Result Summary

```javascript
{
  success: true,
  message: "Migrasi berhasil",
  source: {
    id: 10,
    kode: "2025-2026",
    status: "arsip"
  },
  target: {
    id: 11,
    kode: "2026-2027",
    status: "berjalan"
  },
  statistics: {
    total_santri: 500,
    migrated: 450,
    excluded: 2,
    alumni_created: 35,
    mts_graduates: 28,
    existing_alumni_excluded: 15
  },
  breakdown: {
    diniyah_only: 120,
    sekolah_only: 280,
    dual_track: 50,
    diniyah_graduates: 10,
    ma_graduates: 25
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing correctness properties, I need to analyze the acceptance criteria to determine which are suitable for property-based testing.



## Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundant Properties:**
- 5.1 duplicates 1.6 (dual track independence)
- 5.2 duplicates 2.3 (no alumni for partial dual-track completion)
- 5.3 duplicates 4.5 (combined graduation status)
- 5.4 duplicates 4.6 (single-track MA graduation)
- 5.5 duplicates 2.2 (Diniyah-only graduation)
- 6.3 duplicates 6.1 (excluded santri don't migrate)
- 10.2 duplicates 10.1 (class validation)
- 11.3 duplicates 11.2 (alumni exclusion)
- 11.4 duplicates 11.2 (alumni exclusion)
- 12.5 duplicates 12.3 (excluded count)

**Properties to Combine:**
- 1.1, 1.2, 1.3, 1.4 can be combined into a single comprehensive Diniyah progression property
- 2.5 and 2.6 can be combined (alumni status and exclusion from migration)
- 4.3 and 4.4 can be combined (alumni status and exclusion from migration)
- 6.1 and 6.2 can be combined (exclusion and status update)
- 8.1, 8.2, 8.3, 8.6 can be combined into a single alumni data completeness property

**Integration vs Property Tests:**
- Requirements 7 (Rollback), 9 (Transaction Atomicity), and 10 (Validation) are primarily integration tests
- These test infrastructure behavior and error handling, not universal properties
- They should be tested with integration tests, not property-based tests

**Final Property Count:** After eliminating redundancy and combining related properties, we have approximately 20 unique properties suitable for property-based testing.

### Property 1: Diniyah Track Progression

*For any* santri with Diniyah enrollment at tingkat N (where 0 ≤ N < 6), the migration SHALL advance them according to the Diniyah progression rules: Sifir (0) → Kelas 1 (1) → Kelas SP (1) → Kelas 2 (2) → ... → Kelas 6 (6), where each advancement increments tingkat by 1 except for the Kelas 1 → SP transition which maintains tingkat 1.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Sekolah Track Progression

*For any* santri with Sekolah enrollment at tingkat N (where 7 ≤ N < 12), the migration SHALL advance them to tingkat N+1.

**Validates: Requirements 1.5**

### Property 3: Dual Track Independence

*For any* santri enrolled in both Diniyah and Sekolah tracks, the migration SHALL advance each track independently according to its respective progression rules, where the advancement of one track does not affect the advancement of the other track.

**Validates: Requirements 1.6, 5.1, 5.6**

### Property 4: Class Assignment Correctness

*For any* santri migrated to the target year, their assigned class SHALL have the correct jenis (Diniyah or Sekolah) and tingkat matching the expected progression level.

**Validates: Requirements 1.7**

### Property 5: Source Year Immutability

*For any* migration operation, the class assignments and personal data of all santri in the source year SHALL remain unchanged after migration completes.

**Validates: Requirements 1.9**

### Property 6: Section Advancement

*For any* santri with a section-specific class (e.g., 1A, 7B, 11-IPA), the migration SHALL advance them to the next tingkat while maintaining a valid class assignment (section may be preserved or reassigned based on availability).

**Validates: Requirements 1.10**

### Property 7: Diniyah-Only Graduation

*For any* santri with Diniyah tingkat 6 AND no Sekolah enrollment, the migration SHALL create an alumni record with status "Lulus Diniyah Kelas 6", set their status to "alumni" in the source year, and exclude them from the target year.

**Validates: Requirements 2.2, 2.5, 2.6, 5.5**

### Property 8: Dual Track Diniyah Completion

*For any* santri with Diniyah tingkat 6 AND active Sekolah enrollment (tingkat < 12), the migration SHALL NOT create an alumni record, SHALL add "Lulus Diniyah Kelas 6" to their catatan, SHALL migrate them to the target year with advanced Sekolah tingkat, and SHALL keep their Diniyah at tingkat 6.

**Validates: Requirements 2.3, 2.4, 2.7, 2.8, 5.2**

### Property 9: MTs Graduation Without Alumni Status

*For any* santri with Sekolah tingkat 9, the migration SHALL mark them as "Lulus MTs", SHALL NOT create an alumni record, SHALL migrate them to the target year with Sekolah tingkat 10, and SHALL maintain their Diniyah enrollment if present.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 10: MA Graduation - Sekolah Only

*For any* santri with Sekolah tingkat 12 AND no Diniyah enrollment (or Diniyah tingkat < 6), the migration SHALL create an alumni record with status "Lulus MA", set their status to "alumni" in the source year, and exclude them from the target year.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 5.4**

### Property 11: MA Graduation - Dual Track Complete

*For any* santri with Sekolah tingkat 12 AND Diniyah tingkat 6, the migration SHALL create an alumni record with status "Lulus Diniyah & MA", set their status to "alumni" in the source year, and exclude them from the target year.

**Validates: Requirements 4.5, 5.3**

### Property 12: Manual Exclusion

*For any* santri ID in the excluded list, the migration SHALL set their status to "tidak_naik" in the source year, append "Tidak naik ke [target year]" to their catatan, NOT migrate them to the target year, NOT evaluate them for alumni status, and preserve their current class assignments.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 13: Alumni Data Completeness

*For any* alumni record created during migration, the record SHALL contain the santri's NIS, NIK, nama, tempat_lahir, tanggal_lahir, the correct santri_id reference, tahun_lulus matching the source year's tahun_selesai, and kelas_terakhir reflecting their final class assignment.

**Validates: Requirements 8.1, 8.2, 8.3, 8.6**

### Property 14: Diniyah Alumni Labeling

*For any* alumni record created for Diniyah-only graduation, the kelas_terakhir field SHALL include "Diniyah Kelas 6" or equivalent designation.

**Validates: Requirements 8.4**

### Property 15: MA Alumni Labeling

*For any* alumni record created for MA graduation, the kelas_terakhir field SHALL include "MA Kelas 12" or "SMA Kelas 12" or equivalent designation.

**Validates: Requirements 8.5**

### Property 16: Year Status Transition

*For any* successful migration, the source year status SHALL become "arsip" and is_active SHALL become FALSE, while the target year status SHALL become "berjalan" and is_active SHALL become TRUE.

**Validates: Requirements 9.4, 9.5**

### Property 17: Migration Log Creation

*For any* successful migration, a migration_log entry SHALL be created containing the source_tahun_ajaran_id, target_tahun_ajaran_id, accurate migrated_count, and the array of excluded_santri_ids.

**Validates: Requirements 9.6**

### Property 18: Existing Alumni Exclusion

*For any* santri whose santri_id exists in the alumni table, the migration SHALL exclude them from processing, NOT migrate them to the target year, NOT modify their status in the source year, and include them in the alumni exclusion count.

**Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6**

### Property 19: Migration Count Accuracy

*For any* migration, the sum of (migrated_count + excluded_count + alumni_created_count + existing_alumni_excluded_count) SHALL equal the total count of santri with status 'aktif' in the source year.

**Validates: Requirements 12.2, 12.3, 12.4**

### Property 20: MTs Graduate Count

*For any* migration, the count of santri marked as "Lulus MTs" SHALL equal the number of santri with Sekolah tingkat 9 who were migrated to the target year.

**Validates: Requirements 12.6**

## Error Handling

### Validation Errors

**Missing Target Classes**
- **Detection**: Before migration begins, validate that all required target classes exist
- **Error Response**:
  ```json
  {
    "error": "Missing target classes",
    "missing_classes": [
      { "jenis": "Diniyah", "tingkat": 3, "required_for": 15 },
      { "jenis": "Sekolah", "tingkat": 10, "required_for": 28 }
    ],
    "message": "Please create the missing classes before migration"
  }
  ```
- **Recovery**: Administrator must create missing classes and retry migration

**Target Year Already Exists**
- **Detection**: Check if target year already has status "berjalan"
- **Error Response**: `{ "error": "Target year already active" }`
- **Recovery**: Use rollback to revert previous migration, or choose different target year

**Source Year Not Active**
- **Detection**: Verify source year has is_active = TRUE
- **Error Response**: `{ "error": "Source year is not active" }`
- **Recovery**: Set correct year as active before migration

### Runtime Errors

**Database Transaction Failure**
- **Detection**: Any database error during migration
- **Handling**: Automatic rollback of entire transaction
- **Error Response**: `{ "error": "Migration failed: [specific error]", "rolled_back": true }`
- **Recovery**: Fix underlying issue (database connection, constraints) and retry

**Class Assignment Failure**
- **Detection**: Cannot find matching class for a santri during advancement
- **Handling**: Collect all failures, rollback transaction
- **Error Response**:
  ```json
  {
    "error": "Class assignment failed",
    "failed_santri": [
      { "santri_id": 123, "nama": "Ahmad", "current_tingkat": 5, "next_tingkat": 6, "jenis": "Diniyah" }
    ]
  }
  ```
- **Recovery**: Create missing classes or manually assign classes

**Alumni Record Creation Failure**
- **Detection**: Duplicate alumni record or constraint violation
- **Handling**: Log warning, continue migration (use ON CONFLICT DO NOTHING)
- **Behavior**: Existing alumni record is preserved, no error thrown

### Edge Case Handling

**Empty Source Year**
- **Behavior**: Migration succeeds with migrated_count = 0
- **Result**: Target year created and set to "berjalan", source year set to "arsip"

**All Santri Excluded**
- **Behavior**: Migration succeeds with migrated_count = 0, all marked as "tidak_naik"
- **Result**: Target year created but empty

**Concurrent Migration Attempts**
- **Prevention**: Database transaction isolation prevents concurrent migrations
- **Behavior**: First migration succeeds, second fails with "Target year already active"

**Santri at Maximum Level Without Graduation**
- **Scenario**: Santri at tingkat 6 or 12 marked as "tidak_naik" (excluded)
- **Behavior**: Remains at same level in source year, no alumni record created

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Class Progression Logic**
   - Test Sifir → Kelas 1 transition
   - Test Kelas 1 → Kelas SP transition
   - Test Kelas SP → Kelas 2 transition
   - Test standard progression (2→3, 3→4, etc.)
   - Test Sekolah progression (7→8, 8→9, etc.)

2. **Graduation Detection**
   - Test Diniyah tingkat 6 detection
   - Test MTs tingkat 9 detection
   - Test MA tingkat 12 detection
   - Test dual-track graduation scenarios

3. **Alumni Record Creation**
   - Test Diniyah-only alumni record
   - Test MA-only alumni record
   - Test combined Diniyah & MA alumni record
   - Test data field population

4. **Status Transitions**
   - Test aktif → lulus (MTs graduates)
   - Test aktif → alumni (final graduates)
   - Test aktif → tidak_naik (excluded)

5. **Error Handling**
   - Test missing class validation
   - Test duplicate alumni handling
   - Test empty source year
   - Test all santri excluded

### Property-Based Tests

Property-based tests will verify universal properties across many generated inputs (minimum 100 iterations per property):

**Test Framework**: Use `fast-check` (JavaScript) for property-based testing

**Property Test Structure**:
```javascript
// Example property test
test('Property 1: Diniyah Track Progression', () => {
  fc.assert(
    fc.property(
      fc.array(generateSantriWithDiniyahTingkat(0, 5)), // Generate santri at various Diniyah levels
      async (santriList) => {
        const result = await migrateTahunAjaran(santriList);
        
        // Verify each santri advanced correctly
        for (const santri of santriList) {
          const migrated = result.find(s => s.santri_id === santri.id);
          const expectedTingkat = getExpectedDiniyahTingkat(santri.kelas_diniyah_tingkat, santri.kelas_diniyah_nama);
          expect(migrated.kelas_diniyah_tingkat).toBe(expectedTingkat);
        }
      }
    ),
    { numRuns: 100 } // Run 100 iterations
  );
});
```

**Property Test Tags**:
Each property test must include a comment tag referencing the design property:
```javascript
// Feature: smart-migration-alumni-management, Property 1: Diniyah Track Progression
```

**Test Data Generators**:
- `generateSantri()`: Generate random santri with various class levels
- `generateDiniyahSantri(tingkat)`: Generate santri at specific Diniyah level
- `generateSekolahSantri(tingkat)`: Generate santri at specific Sekolah level
- `generateDualTrackSantri(diniyahTingkat, sekolahTingkat)`: Generate dual-track santri
- `generateKelas(jenis, tingkat)`: Generate class definitions

**Properties to Test** (see Correctness Properties section above for complete list):
1. Diniyah Track Progression
2. Sekolah Track Progression
3. Dual Track Independence
4. Class Assignment Correctness
5. Source Year Immutability
6. Section Advancement
7. Diniyah-Only Graduation
8. Dual Track Diniyah Completion
9. MTs Graduation Without Alumni Status
10. MA Graduation - Sekolah Only
11. MA Graduation - Dual Track Complete
12. Manual Exclusion
13. Alumni Data Completeness
14. Diniyah Alumni Labeling
15. MA Alumni Labeling
16. Year Status Transition
17. Migration Log Creation
18. Existing Alumni Exclusion
19. Migration Count Accuracy
20. MTs Graduate Count

### Integration Tests

Integration tests will verify end-to-end migration scenarios with real database:

1. **Complete Migration Flow**
   - Create source year with santri at various levels
   - Execute migration
   - Verify target year data
   - Verify source year status updates
   - Verify migration log

2. **Rollback Flow**
   - Execute migration
   - Execute rollback
   - Verify source year restored
   - Verify target year cleaned
   - Verify alumni records deleted

3. **Validation Flow**
   - Attempt migration with missing classes
   - Verify validation error
   - Verify no database changes

4. **Transaction Atomicity**
   - Force error during migration
   - Verify complete rollback
   - Verify no partial changes

5. **Concurrent Migration Prevention**
   - Attempt simultaneous migrations
   - Verify only one succeeds

### Manual Testing Checklist

1. **UI Migration Flow**
   - [ ] Open migration modal
   - [ ] Review santri list
   - [ ] Exclude specific santri
   - [ ] Confirm migration
   - [ ] Verify success message
   - [ ] Verify santri appear in new year
   - [ ] Verify excluded santri marked as "tidak_naik"

2. **Alumni Creation**
   - [ ] Migrate santri at Diniyah tingkat 6 (no Sekolah)
   - [ ] Verify alumni record created
   - [ ] Verify alumni appears in alumni list
   - [ ] Migrate santri at MA tingkat 12
   - [ ] Verify alumni record created with correct status

3. **Rollback**
   - [ ] Execute migration
   - [ ] Click rollback button
   - [ ] Confirm rollback
   - [ ] Verify santri restored to previous year
   - [ ] Verify statuses restored
   - [ ] Verify alumni records deleted

4. **Error Scenarios**
   - [ ] Attempt migration with missing classes
   - [ ] Verify error message displayed
   - [ ] Create missing classes
   - [ ] Retry migration successfully

## Implementation Notes

### Database Migration Script

To add the `tingkat` column to the `kelas` table:

```sql
-- Add tingkat column
ALTER TABLE kelas ADD COLUMN tingkat INTEGER;

-- Update Diniyah classes
UPDATE kelas SET tingkat = 0 WHERE jenis = 'Diniyah' AND nama ILIKE '%sifir%';
UPDATE kelas SET tingkat = 1 WHERE jenis = 'Diniyah' AND (nama ~ '^1[A-Z]?' OR nama ILIKE 'kelas 1%' OR nama ILIKE '%SP%');
UPDATE kelas SET tingkat = 2 WHERE jenis = 'Diniyah' AND (nama ~ '^2[A-Z]?' OR nama ILIKE 'kelas 2%');
UPDATE kelas SET tingkat = 3 WHERE jenis = 'Diniyah' AND (nama ~ '^3[A-Z]?' OR nama ILIKE 'kelas 3%');
UPDATE kelas SET tingkat = 4 WHERE jenis = 'Diniyah' AND (nama ~ '^4[A-Z]?' OR nama ILIKE 'kelas 4%');
UPDATE kelas SET tingkat = 5 WHERE jenis = 'Diniyah' AND (nama ~ '^5[A-Z]?' OR nama ILIKE 'kelas 5%');
UPDATE kelas SET tingkat = 6 WHERE jenis = 'Diniyah' AND (nama ~ '^6[A-Z]?' OR nama ILIKE 'kelas 6%');

-- Update Sekolah classes
UPDATE kelas SET tingkat = 7 WHERE jenis = 'Sekolah' AND (nama ~ '^7[A-Z]?' OR nama ILIKE 'kelas 7%');
UPDATE kelas SET tingkat = 8 WHERE jenis = 'Sekolah' AND (nama ~ '^8[A-Z]?' OR nama ILIKE 'kelas 8%');
UPDATE kelas SET tingkat = 9 WHERE jenis = 'Sekolah' AND (nama ~ '^9[A-Z]?' OR nama ILIKE 'kelas 9%');
UPDATE kelas SET tingkat = 10 WHERE jenis = 'Sekolah' AND (nama ~ '^10' OR nama ILIKE 'kelas 10%');
UPDATE kelas SET tingkat = 11 WHERE jenis = 'Sekolah' AND (nama ~ '^11' OR nama ILIKE 'kelas 11%');
UPDATE kelas SET tingkat = 12 WHERE jenis = 'Sekolah' AND (nama ~ '^12' OR nama ILIKE 'kelas 12%');

-- Make tingkat required
ALTER TABLE kelas ALTER COLUMN tingkat SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_kelas_jenis_tingkat ON kelas(jenis, tingkat);

-- Verify all classes have tingkat assigned
SELECT jenis, nama, tingkat FROM kelas WHERE tingkat IS NULL;
```

### Code Organization

```
src/
├── services/
│   ├── autoAdvanceEngine.js      # Class progression logic
│   ├── alumniManager.js           # Alumni detection and creation
│   ├── migrationValidator.js     # Pre-migration validation
│   └── tahunAjaranService.js     # Existing service (enhanced)
├── routes/
│   └── tahunAjaranRoutes.js      # Existing routes (enhanced)
├── utils/
│   ├── classProgressionMap.js    # Progression rules
│   └── statusTransitions.js      # Status state machine
└── tests/
    ├── unit/
    │   ├── autoAdvanceEngine.test.js
    │   ├── alumniManager.test.js
    │   └── migrationValidator.test.js
    ├── property/
    │   ├── diniyahProgression.property.test.js
    │   ├── sekolahProgression.property.test.js
    │   ├── dualTrack.property.test.js
    │   ├── graduation.property.test.js
    │   └── migration.property.test.js
    └── integration/
        ├── migration.integration.test.js
        └── rollback.integration.test.js
```

### Performance Considerations

1. **Batch Processing**: Process santri in batches of 100 to avoid memory issues with large datasets
2. **Index Usage**: Ensure indexes exist on `kelas(jenis, tingkat)` and `santri_tahun_ajaran(tahun_ajaran_id, santri_id)`
3. **Transaction Size**: Keep transaction size reasonable (< 10,000 records per transaction)
4. **Query Optimization**: Use JOIN instead of N+1 queries when fetching class information

### Backward Compatibility

1. **Existing Migration Endpoint**: The enhanced endpoint maintains the same request/response structure
2. **Manual Class Selection**: If auto-advance fails, system can fall back to manual selection
3. **Gradual Rollout**: Feature can be enabled via feature flag for testing
4. **Data Migration**: Existing data remains valid; only new migrations use auto-advance

---

**Document Version:** 1.0  
**Created:** 2025-01-XX  
**Status:** Draft - Awaiting Review  
**Next Steps:** Review design with stakeholders, implement database schema changes, develop auto-advance engine
