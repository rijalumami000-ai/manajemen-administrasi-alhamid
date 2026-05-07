# Requirements Document: Smart Migration with Auto-Advance & Alumni Management

## Introduction

This feature enhances the existing academic year migration system with intelligent class-level advancement and comprehensive alumni management. The system must handle complex graduation rules across two educational tracks (Diniyah and Sekolah) with different graduation points and alumni status transitions.

The feature addresses the business need to automatically advance students to the next grade level during academic year migration while correctly identifying and managing alumni based on their educational track completion status.

## Glossary

- **Migration_System**: The component responsible for transferring student data from one academic year to the next
- **Auto_Advance_Engine**: The component that automatically increments class levels during migration
- **Alumni_Manager**: The component that determines alumni status and manages alumni records
- **Santri**: A student enrolled in the institution
- **Tahun_Ajaran**: Academic year (e.g., "2025-2026")
- **Kelas**: A class with properties `jenis` (type: diniyah/sekolah), `tingkat` (level), and `nama` (name with section/specialization)
- **Diniyah_Track**: Religious education track with levels: Sifir (0), 1, SP (Special Program), 2, 3, 4, 5, 6
- **Diniyah_Sections**: Class sections within same level (e.g., 1A, 1C, 5A, 5B)
- **Sekolah_Track**: Formal education track with two stages: MTs (levels 7-9) and MA (levels 10-12)
- **Sekolah_Sections**: Class sections and specializations (e.g., 7A, 7B, 9A, 11-IPA, 12-IPS)
- **MTs**: Junior high school equivalent (Madrasah Tsanawiyah), levels 7-9
- **MA**: Senior high school equivalent (Madrasah Aliyah), levels 10-12
- **Tingkat**: The numeric level of a class (0 for Sifir, 1-6 for Diniyah, 7-12 for Sekolah)
- **Active_Status**: A santri who is currently enrolled and attending classes
- **Alumni_Status**: A santri who has completed all educational requirements
- **Graduation_Point**: The class level at which a track is completed (tingkat 6 for Diniyah, tingkat 9 for MTs, tingkat 12 for MA)
- **Continuation_Eligible**: A santri who has completed MTs (tingkat 9) but can continue to MA
- **Migration_Transaction**: A single atomic operation that migrates all eligible santri to the next academic year
- **Class_Progression_Map**: The mapping of class advancement paths (e.g., Sifir→1, 1→SP, SP→2, 2→3, etc.)

## Requirements

### Requirement 1: Auto-Advance Class Levels During Migration

**User Story:** As a school administrator, I want students to automatically advance to the next grade level during academic year migration, so that I don't have to manually update each student's class assignment.

#### Diniyah Track Progression Rules

The Diniyah track follows a specific progression path:
- **Sifir (tingkat 0)** → **Kelas 1** (tingkat 1)
- **Kelas 1** → **Kelas SP** (Special Program, tingkat 1.5 or special marker)
- **Kelas SP** → **Kelas 2** (tingkat 2)
- **Kelas 2** → **Kelas 3** (tingkat 3)
- **Kelas 3** → **Kelas 4** (tingkat 4)
- **Kelas 4** → **Kelas 5** (tingkat 5)
- **Kelas 5** → **Kelas 6** (tingkat 6)
- **Kelas 6** → **Graduation** (Alumni if no Sekolah enrollment)

Within each tingkat, sections (A, B, C, etc.) are preserved or reassigned based on institutional policy.

#### Sekolah Track Progression Rules

The Sekolah track follows standard grade progression:
- **Kelas 7** → **Kelas 8** → **Kelas 9** (MTs stage)
- **Kelas 9** → **Kelas 10** (MTs to MA transition)
- **Kelas 10** → **Kelas 11** → **Kelas 12** (MA stage)
- **Kelas 12** → **Graduation** (Alumni)

Sections and specializations (A, B, IPA, IPS, etc.) are preserved or reassigned based on institutional policy.

#### Acceptance Criteria

1. WHEN Migration_System processes a santri with Diniyah_Track enrollment at tingkat 0 (Sifir), THE Auto_Advance_Engine SHALL assign the santri to a Kelas 1 (tingkat 1) in the target year
2. WHEN Migration_System processes a santri with Diniyah_Track enrollment at tingkat 1 (Kelas 1), THE Auto_Advance_Engine SHALL assign the santri to Kelas SP in the target year
3. WHEN Migration_System processes a santri with Diniyah_Track enrollment at Kelas SP, THE Auto_Advance_Engine SHALL assign the santri to Kelas 2 (tingkat 2) in the target year
4. WHEN Migration_System processes a santri with Diniyah_Track enrollment at tingkat N (where 2 ≤ N < 6), THE Auto_Advance_Engine SHALL assign the santri to tingkat N+1 in the target year
5. WHEN Migration_System processes a santri with Sekolah_Track enrollment at tingkat N (where 7 ≤ N < 12), THE Auto_Advance_Engine SHALL assign the santri to tingkat N+1 in the target year
6. WHEN Migration_System processes a santri enrolled in both Diniyah_Track and Sekolah_Track, THE Auto_Advance_Engine SHALL advance both track assignments independently according to their respective progression rules
7. WHEN Auto_Advance_Engine advances a santri from one tingkat to the next, THE Auto_Advance_Engine SHALL select an appropriate target class with matching jenis and tingkat (section assignment may vary)
8. WHEN Auto_Advance_Engine cannot find a matching class for the next tingkat level, THE Migration_System SHALL log an error and mark the santri record for manual review
9. FOR ALL santri records processed by Auto_Advance_Engine, the original class assignment in the source Tahun_Ajaran SHALL remain unchanged
10. WHEN Migration_System processes a santri with a section-specific class (e.g., 1A, 7B, 11-IPA), THE Auto_Advance_Engine SHALL advance to the next tingkat while preserving or reassigning the section based on available target classes

### Requirement 2: Diniyah Track Graduation and Alumni Status

**User Story:** As a school administrator, I want students who complete Diniyah level 6 to be marked as Diniyah alumni, so that I can track their educational completion status.

#### Acceptance Criteria

1. WHEN Migration_System processes a santri with `kelas_diniyah_id` tingkat equal to 6, THE Alumni_Manager SHALL identify the santri as reaching a Diniyah Graduation_Point
2. WHEN a santri reaches Diniyah Graduation_Point AND has no `kelas_sekolah_id` enrollment, THE Alumni_Manager SHALL create an alumni record with status "Lulus Diniyah Kelas 6"
3. WHEN a santri reaches Diniyah Graduation_Point AND has Active_Status `kelas_sekolah_id` enrollment, THE Alumni_Manager SHALL NOT create an alumni record
4. WHEN a santri reaches Diniyah Graduation_Point AND has Active_Status `kelas_sekolah_id` enrollment, THE Migration_System SHALL add a note "Lulus Diniyah Kelas 6" to the santri catatan field
5. WHEN Alumni_Manager creates a Diniyah alumni record, THE Migration_System SHALL set the santri status to "alumni" in the source Tahun_Ajaran
6. WHEN Alumni_Manager creates a Diniyah alumni record, THE Migration_System SHALL NOT migrate the santri to the target Tahun_Ajaran
7. WHEN a santri completes Diniyah level 6 AND continues in Sekolah_Track, THE Auto_Advance_Engine SHALL continue advancing the `kelas_sekolah_id` in subsequent migrations
8. WHEN a santri completes Diniyah level 6 AND continues in Sekolah_Track, THE santri's Diniyah enrollment SHALL remain at tingkat 6 (no further Diniyah advancement)

### Requirement 3: MTs Track Graduation Without Alumni Status

**User Story:** As a school administrator, I want students who complete MTs level 9 to be marked as MTs graduates but remain active if they continue to MA, so that I can track their progression through both educational stages.

#### Acceptance Criteria

1. WHEN Migration_System processes a santri with `kelas_sekolah_id` tingkat equal to 9, THE Alumni_Manager SHALL identify the santri as reaching an MTs Graduation_Point
2. WHEN a santri reaches MTs Graduation_Point, THE Alumni_Manager SHALL mark the santri as "Lulus MTs" in the source Tahun_Ajaran
3. WHEN a santri reaches MTs Graduation_Point, THE Alumni_Manager SHALL NOT create an alumni record
4. WHEN a santri reaches MTs Graduation_Point, THE Migration_System SHALL migrate the santri to the target Tahun_Ajaran with Continuation_Eligible status
5. WHEN a Continuation_Eligible santri is migrated, THE Auto_Advance_Engine SHALL assign `kelas_sekolah_id` with tingkat 10 (first level of MA)
6. WHEN a Continuation_Eligible santri is manually marked as "pindah" or "keluar", THE Alumni_Manager SHALL create an alumni record with status "Lulus MTs - Tidak Melanjutkan"

### Requirement 4: MA Track Graduation and Final Alumni Status

**User Story:** As a school administrator, I want students who complete MA level 12 to automatically become alumni, so that their educational journey is properly concluded.

#### Acceptance Criteria

1. WHEN Migration_System processes a santri with `kelas_sekolah_id` tingkat equal to 12, THE Alumni_Manager SHALL identify the santri as reaching an MA Graduation_Point
2. WHEN a santri reaches MA Graduation_Point, THE Alumni_Manager SHALL create an alumni record with status "Lulus MA"
3. WHEN Alumni_Manager creates an MA alumni record, THE Migration_System SHALL set the santri status to "alumni" in the source Tahun_Ajaran
4. WHEN Alumni_Manager creates an MA alumni record, THE Migration_System SHALL NOT migrate the santri to the target Tahun_Ajaran
5. WHEN a santri reaches MA Graduation_Point AND has completed Diniyah level 6 previously, THE Alumni_Manager SHALL include "Lulus Diniyah & MA" in the alumni record
6. WHEN a santri reaches MA Graduation_Point AND has NOT completed Diniyah, THE Alumni_Manager SHALL include only "Lulus MA" in the alumni record

### Requirement 5: Dual Track Graduation Handling

**User Story:** As a school administrator, I want the system to correctly handle students enrolled in both Diniyah and Sekolah tracks simultaneously, so that their graduation status reflects completion of both programs.

#### Acceptance Criteria

1. WHEN a santri has both `kelas_diniyah_id` and `kelas_sekolah_id` assignments, THE Auto_Advance_Engine SHALL process both track advancements independently
2. WHEN a santri completes Diniyah level 6 WHILE enrolled in Sekolah tingkat less than 12, THE Alumni_Manager SHALL NOT create an alumni record
3. WHEN a santri completes MA level 12 AND has previously completed Diniyah level 6, THE Alumni_Manager SHALL create a single alumni record reflecting both completions
4. WHEN a santri completes MA level 12 AND has NOT completed Diniyah level 6, THE Alumni_Manager SHALL create an alumni record reflecting only MA completion
5. WHEN a santri completes Diniyah level 6 AND has no Sekolah enrollment, THE Alumni_Manager SHALL create an alumni record reflecting Diniyah completion only
6. FOR ALL dual-track santri, THE Migration_System SHALL maintain separate advancement history for each track

### Requirement 6: Manual Exclusion from Migration

**User Story:** As a school administrator, I want to manually exclude specific students from automatic advancement during migration, so that I can handle special cases like grade retention or transfers.

#### Acceptance Criteria

1. WHEN Migration_System receives a list of excluded santri IDs, THE Auto_Advance_Engine SHALL NOT process advancement for those santri
2. WHEN a santri is excluded from migration, THE Migration_System SHALL set the santri status to "tidak_naik" in the source Tahun_Ajaran
3. WHEN a santri is excluded from migration, THE Migration_System SHALL NOT create a record in the target Tahun_Ajaran
4. WHEN a santri is excluded from migration, THE Migration_System SHALL append "Tidak naik ke [target year]" to the santri catatan field
5. WHEN Migration_System processes exclusions, THE Alumni_Manager SHALL NOT evaluate excluded santri for alumni status
6. FOR ALL excluded santri, THE Migration_System SHALL preserve their current class assignments in the source Tahun_Ajaran

### Requirement 7: Migration Rollback with Status Restoration

**User Story:** As a school administrator, I want to rollback a migration if errors occur, so that I can correct issues and re-run the migration process.

#### Acceptance Criteria

1. WHEN Migration_System receives a rollback command, THE Migration_System SHALL delete all santri records created in the target Tahun_Ajaran by the most recent migration
2. WHEN Migration_System performs rollback, THE Migration_System SHALL restore all "lulus" status records to "aktif" status in the source Tahun_Ajaran
3. WHEN Migration_System performs rollback, THE Migration_System SHALL restore all "tidak_naik" status records to "aktif" status in the source Tahun_Ajaran
4. WHEN Migration_System performs rollback, THE Migration_System SHALL delete all alumni records created during the rolled-back migration
5. WHEN Migration_System performs rollback, THE Migration_System SHALL restore the source Tahun_Ajaran to "berjalan" status
6. WHEN Migration_System performs rollback, THE Migration_System SHALL set the target Tahun_Ajaran to "draft" status
7. WHEN Migration_System completes rollback, THE Migration_System SHALL delete the migration log entry for the rolled-back migration

### Requirement 8: Alumni Record Data Completeness

**User Story:** As a school administrator, I want alumni records to contain complete educational history, so that I can generate accurate alumni reports and certificates.

#### Acceptance Criteria

1. WHEN Alumni_Manager creates an alumni record, THE Alumni_Manager SHALL copy the santri NIS, NIK, nama, tempat_lahir, and tanggal_lahir from the source record
2. WHEN Alumni_Manager creates an alumni record, THE Alumni_Manager SHALL set tahun_lulus to the tahun_selesai value of the source Tahun_Ajaran
3. WHEN Alumni_Manager creates an alumni record, THE Alumni_Manager SHALL set kelas_terakhir to the nama value of the final kelas assignment
4. WHEN Alumni_Manager creates an alumni record for Diniyah completion, THE Alumni_Manager SHALL include "Diniyah Kelas 6" in the kelas_terakhir field
5. WHEN Alumni_Manager creates an alumni record for MA completion, THE Alumni_Manager SHALL include "MA Kelas 12" or "SMA Kelas 12" in the kelas_terakhir field
6. WHEN Alumni_Manager creates an alumni record, THE Alumni_Manager SHALL set the santri_id reference to link back to the original santri record

### Requirement 9: Migration Transaction Atomicity

**User Story:** As a school administrator, I want the entire migration process to succeed or fail as a single operation, so that the database remains in a consistent state.

#### Acceptance Criteria

1. WHEN Migration_System begins processing, THE Migration_System SHALL start a database transaction
2. WHEN any component (Auto_Advance_Engine or Alumni_Manager) encounters an error, THE Migration_System SHALL rollback the entire transaction
3. WHEN Migration_System completes all processing without errors, THE Migration_System SHALL commit the transaction
4. WHEN Migration_System commits a transaction, THE Migration_System SHALL update the source Tahun_Ajaran status to "arsip"
5. WHEN Migration_System commits a transaction, THE Migration_System SHALL update the target Tahun_Ajaran status to "berjalan"
6. WHEN Migration_System commits a transaction, THE Migration_System SHALL create a migration_log entry with source, target, migrated count, and excluded santri IDs
7. IF Migration_System transaction fails, THEN THE Migration_System SHALL return an error message describing the failure reason

### Requirement 10: Class Level Validation

**User Story:** As a school administrator, I want the system to validate that target class levels exist before migration, so that I can identify and fix configuration issues early.

#### Acceptance Criteria

1. WHEN Migration_System begins processing, THE Auto_Advance_Engine SHALL validate that all required target class levels exist in the kelas table
2. WHEN Auto_Advance_Engine finds a santri requiring advancement to tingkat N, THE Auto_Advance_Engine SHALL verify a kelas record exists with matching jenis and tingkat N
3. IF Auto_Advance_Engine cannot find a required kelas record, THEN THE Migration_System SHALL collect all missing class definitions
4. IF Auto_Advance_Engine identifies missing class definitions, THEN THE Migration_System SHALL return an error listing all missing jenis and tingkat combinations
5. WHEN Migration_System returns a class validation error, THE Migration_System SHALL NOT begin the migration transaction
6. FOR ALL class validation checks, THE Auto_Advance_Engine SHALL complete validation before processing any santri records

### Requirement 11: Alumni Exclusion from Migration

**User Story:** As a school administrator, I want existing alumni to be automatically excluded from migration, so that completed student records are not duplicated.

#### Acceptance Criteria

1. WHEN Migration_System begins processing, THE Migration_System SHALL query all existing alumni records
2. WHEN Migration_System evaluates a santri for migration, THE Migration_System SHALL check if the santri_id exists in the alumni table
3. WHEN a santri_id exists in the alumni table, THE Migration_System SHALL exclude that santri from migration processing
4. WHEN a santri_id exists in the alumni table, THE Auto_Advance_Engine SHALL NOT process class advancement for that santri
5. WHEN Migration_System excludes an alumni santri, THE Migration_System SHALL NOT modify the santri status in the source Tahun_Ajaran
6. FOR ALL alumni exclusions, THE Migration_System SHALL log the exclusion count in the migration result summary

### Requirement 12: Migration Summary Reporting

**User Story:** As a school administrator, I want to see a detailed summary after migration completes, so that I can verify the migration results and identify any issues.

#### Acceptance Criteria

1. WHEN Migration_System completes successfully, THE Migration_System SHALL return a summary containing source and target Tahun_Ajaran details
2. WHEN Migration_System completes successfully, THE Migration_System SHALL return the count of santri migrated to the target year
3. WHEN Migration_System completes successfully, THE Migration_System SHALL return the count of santri excluded from migration
4. WHEN Migration_System completes successfully, THE Migration_System SHALL return the count of alumni records created
5. WHEN Migration_System completes successfully, THE Migration_System SHALL return the count of santri marked as "tidak_naik"
6. WHEN Migration_System completes successfully, THE Migration_System SHALL return the count of santri marked as "lulus" (MTs graduates continuing to MA)
7. WHEN Migration_System encounters errors, THE Migration_System SHALL return an error message with specific details about the failure point

## Correctness Properties

### Property 1: Class Level Advancement Invariant

**Property:** For all santri migrated from year Y to year Y+1, if the santri had class level N in year Y, then the santri has class level N+1 in year Y+1 (unless N is a graduation point).

**Test Strategy:** Property-based test generating random santri with various class levels, verifying advancement increments by exactly 1.

### Property 2: Alumni Creation Idempotence

**Property:** Creating an alumni record for the same santri multiple times produces the same result as creating it once (no duplicate alumni records).

**Test Strategy:** Property-based test attempting to create alumni records multiple times for the same santri, verifying only one record exists.

### Property 3: Migration-Rollback Round Trip

**Property:** For any valid migration M from year Y to year Y+1, performing migration M followed by rollback R returns the system to the exact state before M (excluding timestamps).

**Test Strategy:** Property-based test performing migration with various santri configurations, then rollback, verifying all statuses, class assignments, and record counts match the pre-migration state.

### Property 4: Dual Track Independence

**Property:** For any santri enrolled in both Diniyah and Sekolah tracks, the advancement of one track does not affect the advancement of the other track.

**Test Strategy:** Property-based test with dual-track santri at various level combinations, verifying each track advances independently and correctly.

### Property 5: Alumni Exclusion Completeness

**Property:** For all santri S in the alumni table, S does not appear in any migration to a new academic year.

**Test Strategy:** Property-based test with existing alumni records, verifying none are migrated to the target year.

### Property 6: Graduation Point Detection

**Property:** For all santri at a graduation point (Diniyah level 6, MTs level 9, MA level 12), the system correctly identifies the graduation point and applies the appropriate alumni rules.

**Test Strategy:** Property-based test generating santri at each graduation point with various track combinations, verifying correct alumni status determination.

### Property 7: Transaction Atomicity

**Property:** For any migration operation, either all santri are migrated successfully OR no santri are migrated (no partial migrations).

**Test Strategy:** Integration test with forced failures at various points in the migration process, verifying database state is unchanged after rollback.

### Property 8: Status Transition Validity

**Property:** For all santri, status transitions follow valid paths: aktif → lulus (MTs graduates), aktif → alumni (final graduates), aktif → tidak_naik (excluded), with no invalid transitions.

**Test Strategy:** Property-based test tracking status changes through migration, verifying all transitions match the allowed state machine.

### Property 9: Class Assignment Preservation

**Property:** For all santri in the source year, their class assignments remain unchanged after migration (source year is immutable).

**Test Strategy:** Property-based test capturing source year state before migration, verifying it remains identical after migration completes.

### Property 10: Migration Count Conservation

**Property:** The sum of (migrated count + excluded count + alumni created count + existing alumni count) equals the total active santri count in the source year.

**Test Strategy:** Property-based test verifying the migration summary counts add up to the total santri population.

## Edge Cases and Special Scenarios

### Edge Case 1: Santri at Maximum Level Without Graduation
**Scenario:** A santri is at Diniyah level 6 or Sekolah level 12 but marked as "tidak_naik" (excluded from migration).
**Expected Behavior:** The santri remains at the same level in the source year with "tidak_naik" status. No alumni record is created.

### Edge Case 2: Santri Completes Diniyah After Completing MTs
**Scenario:** A santri completed MTs (level 9) in a previous year, is now in MA (level 10+), and simultaneously completes Diniyah level 6.
**Expected Behavior:** The santri continues in MA track. No alumni record is created. Diniyah completion is noted but does not trigger alumni status.

### Edge Case 3: Santri Transfers Out After MTs Graduation
**Scenario:** A santri completes MTs level 9 and is marked as "pindah" (transfer) instead of continuing to MA.
**Expected Behavior:** An alumni record is created with status "Lulus MTs - Pindah". The santri is not migrated to the target year.

### Edge Case 4: Missing Target Class Definition
**Scenario:** A santri needs to advance from Sekolah level 8 to level 9, but no "Sekolah" class with tingkat 9 exists in the kelas table.
**Expected Behavior:** Migration fails with validation error listing the missing class definition. No santri are migrated.

### Edge Case 5: Rollback After Multiple Migrations
**Scenario:** Administrator performs migration from 2024-2025 to 2025-2026, then from 2025-2026 to 2026-2027, then attempts rollback.
**Expected Behavior:** Rollback only affects the most recent migration (2025-2026 to 2026-2027). The previous migration remains intact.

### Edge Case 6: Santri with Only Diniyah Enrollment at Level 6
**Scenario:** A santri is enrolled only in Diniyah (no Sekolah enrollment) and completes level 6.
**Expected Behavior:** An alumni record is created with status "Lulus Diniyah". The santri is not migrated to the target year.

### Edge Case 7: Santri with Only Sekolah Enrollment at Level 12
**Scenario:** A santri is enrolled only in Sekolah (no Diniyah enrollment) and completes level 12.
**Expected Behavior:** An alumni record is created with status "Lulus MA". The santri is not migrated to the target year.

### Edge Case 8: Empty Source Year Migration
**Scenario:** Administrator attempts migration when the source year has zero active santri.
**Expected Behavior:** Migration completes successfully with migrated count = 0. Target year is created and set to "berjalan" status.

### Edge Case 9: All Santri Excluded from Migration
**Scenario:** Administrator excludes all santri from migration (all marked as "tidak_naik").
**Expected Behavior:** Migration completes successfully with migrated count = 0. All santri in source year have "tidak_naik" status. Target year is created but empty.

### Edge Case 10: Concurrent Migration Attempts
**Scenario:** Two administrators attempt to start migration simultaneously.
**Expected Behavior:** The first migration transaction succeeds. The second migration fails with error "Target year already exists" or "Source year is not active".

---

**Document Version:** 1.0  
**Created:** 2025-01-XX  
**Status:** Draft - Awaiting Review
