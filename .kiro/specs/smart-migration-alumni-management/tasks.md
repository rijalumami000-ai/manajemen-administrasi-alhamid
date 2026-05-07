# Implementation Plan: Smart Migration with Auto-Advance & Alumni Management

## Overview

This implementation plan breaks down the Smart Migration feature into discrete, actionable coding tasks. The feature enhances the existing academic year migration system with intelligent class-level advancement and comprehensive alumni management.

**Implementation Approach:**
1. Database schema enhancement (add `tingkat` column to `kelas` table)
2. Core service layer (Auto-Advance Engine, Alumni Manager, Validation Layer)
3. Enhanced migration endpoint integration
4. Property-based tests for correctness properties (20 properties × 100+ iterations)
5. Integration tests for end-to-end flows
6. Frontend updates for new features

**Language:** JavaScript (Node.js/Express)

**Key Dependencies:**
- Existing migration infrastructure at `src/routes/tahunAjaranRoutes.js`
- PostgreSQL database with existing tables
- Property-based testing with `fast-check` library

---

## Tasks

### 1. Database Schema Enhancement

- [ ] 1.1 Add tingkat column to kelas table
  - Create database migration script to add `tingkat INTEGER` column to `kelas` table
  - Write UPDATE statements to populate tingkat values for existing Diniyah classes (0-6)
  - Write UPDATE statements to populate tingkat values for existing Sekolah classes (7-12)
  - Handle special case: Kelas SP (Special Program) with tingkat 1
  - Add NOT NULL constraint after data migration
  - Create index `idx_kelas_jenis_tingkat` on `(jenis, tingkat)` for performance
  - Add verification query to check all classes have tingkat assigned
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2_

- [ ] 1.2 Test database migration script
  - Create test script to verify tingkat values are correctly assigned
  - Test with sample data covering all class types (Sifir, 1-6, SP, 7-12)
  - Verify index creation and query performance
  - _Requirements: 10.1, 10.2_

### 2. Class Progression Logic

- [ ] 2.1 Create class progression map utility
  - Create `src/utils/classProgressionMap.js` file
  - Define `DINIYAH_PROGRESSION` constant with progression rules (0→1, 1→SP, SP→2, 2→3, etc.)
  - Define `SEKOLAH_PROGRESSION` constant with progression rules (7→8, 8→9, 9→10, etc.)
  - Export progression maps for use in Auto-Advance Engine
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 2.2 Write unit tests for class progression map
  - Test Diniyah progression rules (all transitions from 0 to 6)
  - Test Sekolah progression rules (all transitions from 7 to 12)
  - Test special case: Kelas 1 → SP transition
  - Test graduation points return null (tingkat 6, 12)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

### 3. Auto-Advance Engine Service

- [ ] 3.1 Create Auto-Advance Engine service
  - Create `src/services/autoAdvanceEngine.js` file
  - Implement `advanceSantri(santri, availableClasses)` method
  - Implement `advanceDiniyah(currentKelasId, availableClasses)` method
  - Implement `advanceSekolah(currentKelasId, availableClasses)` method
  - Implement `getNextDiniyahTingkat(currentKelas)` method with special progression logic
  - Implement `findMatchingKelas(availableClasses, jenis, tingkat)` method
  - Implement `getKelasById(kelasId)` method to fetch class details with tingkat
  - Handle dual-track santri (both Diniyah and Sekolah enrollments)
  - Return null for graduation points (tingkat 6 for Diniyah, tingkat 12 for Sekolah)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.10, 5.1_

- [ ]* 3.2 Write unit tests for Auto-Advance Engine
  - Test Sifir → Kelas 1 transition
  - Test Kelas 1 → Kelas SP transition
  - Test Kelas SP → Kelas 2 transition
  - Test standard Diniyah progression (2→3, 3→4, 4→5, 5→6)
  - Test standard Sekolah progression (7→8, 8→9, 9→10, 10→11, 11→12)
  - Test dual-track advancement (both tracks advance independently)
  - Test section preservation (1A→2A, 7B→8B)
  - Test graduation points return null
  - Test missing target class handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.10_

- [ ]* 3.3 Write property test for Diniyah Track Progression
  - **Property 1: Diniyah Track Progression**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - Generate random santri with Diniyah tingkat 0-5
  - Verify each santri advances according to Diniyah progression rules
  - Run 100+ iterations with fast-check
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 3.4 Write property test for Sekolah Track Progression
  - **Property 2: Sekolah Track Progression**
  - **Validates: Requirements 1.5**
  - Generate random santri with Sekolah tingkat 7-11
  - Verify each santri advances to tingkat N+1
  - Run 100+ iterations with fast-check
  - _Requirements: 1.5_

- [ ]* 3.5 Write property test for Dual Track Independence
  - **Property 3: Dual Track Independence**
  - **Validates: Requirements 1.6, 5.1, 5.6**
  - Generate random dual-track santri with various tingkat combinations
  - Verify Diniyah and Sekolah tracks advance independently
  - Verify advancement of one track doesn't affect the other
  - Run 100+ iterations with fast-check
  - _Requirements: 1.6, 5.1, 5.6_

- [ ]* 3.6 Write property test for Class Assignment Correctness
  - **Property 4: Class Assignment Correctness**
  - **Validates: Requirements 1.7**
  - Generate random santri at various tingkat levels
  - Verify assigned class has correct jenis and tingkat
  - Run 100+ iterations with fast-check
  - _Requirements: 1.7_

- [ ]* 3.7 Write property test for Section Advancement
  - **Property 6: Section Advancement**
  - **Validates: Requirements 1.10**
  - Generate random santri with section-specific classes (1A, 7B, 11-IPA)
  - Verify advancement to next tingkat with valid class assignment
  - Run 100+ iterations with fast-check
  - _Requirements: 1.10_

### 4. Alumni Manager Service

- [x] 4.1 Create Alumni Manager service
  - Create `src/services/alumniManager.js` file
  - Implement `processGraduation(santri, sourceYear, client)` method
  - Implement `detectGraduationPoint(santri)` method
  - Implement `createAlumniRecord(santri, sourceYear, graduationStatus, client)` method
  - Implement `updateSantriStatus(santriId, tahunAjaranId, status, client)` method
  - Implement `markMtsGraduate(santriId, tahunAjaranId, client)` method
  - Handle Diniyah graduation (tingkat 6, no Sekolah enrollment)
  - Handle MTs graduation (tingkat 9, mark as "lulus" but not alumni)
  - Handle MA graduation (tingkat 12, create alumni record)
  - Handle dual-track graduation (Diniyah 6 + MA 12)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.2 Write unit tests for Alumni Manager
  - Test Diniyah-only graduation detection (tingkat 6, no Sekolah)
  - Test MTs graduation detection (tingkat 9)
  - Test MA graduation detection (tingkat 12)
  - Test dual-track graduation (Diniyah 6 + MA 12)
  - Test alumni record creation with complete data
  - Test MTs graduate marking (lulus status, not alumni)
  - Test Diniyah completion with active Sekolah (no alumni record)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.5, 4.6_

- [ ]* 4.3 Write property test for Diniyah-Only Graduation
  - **Property 7: Diniyah-Only Graduation**
  - **Validates: Requirements 2.2, 2.5, 2.6, 5.5**
  - Generate random santri with Diniyah tingkat 6 and no Sekolah enrollment
  - Verify alumni record created with status "Lulus Diniyah Kelas 6"
  - Verify santri status set to "alumni" in source year
  - Verify santri excluded from target year
  - Run 100+ iterations with fast-check
  - _Requirements: 2.2, 2.5, 2.6, 5.5_

- [ ]* 4.4 Write property test for Dual Track Diniyah Completion
  - **Property 8: Dual Track Diniyah Completion**
  - **Validates: Requirements 2.3, 2.4, 2.7, 2.8, 5.2**
  - Generate random santri with Diniyah tingkat 6 and active Sekolah (tingkat < 12)
  - Verify NO alumni record created
  - Verify "Lulus Diniyah Kelas 6" added to catatan
  - Verify santri migrated to target year with advanced Sekolah tingkat
  - Verify Diniyah remains at tingkat 6
  - Run 100+ iterations with fast-check
  - _Requirements: 2.3, 2.4, 2.7, 2.8, 5.2_

- [ ]* 4.5 Write property test for MTs Graduation Without Alumni Status
  - **Property 9: MTs Graduation Without Alumni Status**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - Generate random santri with Sekolah tingkat 9
  - Verify marked as "Lulus MTs"
  - Verify NO alumni record created
  - Verify migrated to target year with Sekolah tingkat 10
  - Run 100+ iterations with fast-check
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.6 Write property test for MA Graduation - Sekolah Only
  - **Property 10: MA Graduation - Sekolah Only**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 5.4**
  - Generate random santri with Sekolah tingkat 12 and no Diniyah (or Diniyah < 6)
  - Verify alumni record created with status "Lulus MA"
  - Verify santri status set to "alumni" in source year
  - Verify santri excluded from target year
  - Run 100+ iterations with fast-check
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 5.4_

- [ ]* 4.7 Write property test for MA Graduation - Dual Track Complete
  - **Property 11: MA Graduation - Dual Track Complete**
  - **Validates: Requirements 4.5, 5.3**
  - Generate random santri with Sekolah tingkat 12 and Diniyah tingkat 6
  - Verify alumni record created with status "Lulus Diniyah & MA"
  - Verify santri status set to "alumni" in source year
  - Verify santri excluded from target year
  - Run 100+ iterations with fast-check
  - _Requirements: 4.5, 5.3_

- [ ]* 4.8 Write property test for Alumni Data Completeness
  - **Property 13: Alumni Data Completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.6**
  - Generate random graduating santri
  - Verify alumni record contains NIS, NIK, nama, tempat_lahir, tanggal_lahir
  - Verify santri_id reference is correct
  - Verify tahun_lulus matches source year's tahun_selesai
  - Verify kelas_terakhir reflects final class assignment
  - Run 100+ iterations with fast-check
  - _Requirements: 8.1, 8.2, 8.3, 8.6_

- [ ]* 4.9 Write property test for Diniyah Alumni Labeling
  - **Property 14: Diniyah Alumni Labeling**
  - **Validates: Requirements 8.4**
  - Generate random Diniyah-only graduating santri
  - Verify kelas_terakhir includes "Diniyah Kelas 6"
  - Run 100+ iterations with fast-check
  - _Requirements: 8.4_

- [ ]* 4.10 Write property test for MA Alumni Labeling
  - **Property 15: MA Alumni Labeling**
  - **Validates: Requirements 8.5**
  - Generate random MA graduating santri
  - Verify kelas_terakhir includes "MA Kelas 12" or "SMA Kelas 12"
  - Run 100+ iterations with fast-check
  - _Requirements: 8.5_

### 5. Migration Validation Layer

- [x] 5.1 Create Migration Validator service
  - Create `src/services/migrationValidator.js` file
  - Implement `validateTargetYear(targetKode, client)` method
  - Implement `validateClassAvailability(sourceSantri, client)` method
  - Implement `getExistingAlumni(client)` method
  - Implement `validateSourceYear(client)` method
  - Return validation errors with missing class details
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2_

- [ ]* 5.2 Write unit tests for Migration Validator
  - Test target year validation (exists, status check)
  - Test class availability validation (all required classes exist)
  - Test missing class detection and error reporting
  - Test existing alumni exclusion
  - Test source year validation (is_active check)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2_

### 6. Enhanced Migration Endpoint

- [x] 6.1 Integrate Auto-Advance Engine into migration endpoint
  - Modify `src/routes/tahunAjaranRoutes.js` POST `/api/tahun-ajaran/migrate` endpoint
  - Import and instantiate Auto-Advance Engine
  - Replace static class assignment with auto-advance logic
  - For each santri, call `autoAdvanceEngine.advanceSantri()` to determine next class
  - Handle santri with no next class (graduation points)
  - Update migration query to use auto-advanced class assignments
  - Preserve existing exclusion logic (excluded_santri_ids)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [x] 6.2 Integrate Alumni Manager into migration endpoint
  - Import and instantiate Alumni Manager
  - For each santri, call `alumniManager.processGraduation()` before migration
  - Handle alumni creation for graduating santri
  - Handle MTs graduates (mark as "lulus", continue to MA)
  - Exclude alumni from migration to target year
  - Update migration statistics to include alumni_created count
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6.3 Integrate Migration Validator into migration endpoint
  - Import and instantiate Migration Validator
  - Call validation before starting transaction
  - Validate target year exists or can be created
  - Validate all required target classes exist
  - Exclude existing alumni from migration
  - Return validation errors with missing class details
  - Prevent migration if validation fails
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 6.4 Update migration response with enhanced statistics
  - Add `alumni_created` count to response
  - Add `mts_graduates` count to response
  - Add `existing_alumni_excluded` count to response
  - Update success message to include all statistics
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ]* 6.5 Write property test for Source Year Immutability
  - **Property 5: Source Year Immutability**
  - **Validates: Requirements 1.9**
  - Generate random santri population
  - Capture source year state before migration
  - Execute migration
  - Verify source year class assignments and personal data unchanged
  - Run 100+ iterations with fast-check
  - _Requirements: 1.9_

- [ ]* 6.6 Write property test for Manual Exclusion
  - **Property 12: Manual Exclusion**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
  - Generate random santri population with excluded IDs
  - Verify excluded santri have status "tidak_naik" in source year
  - Verify excluded santri have catatan updated
  - Verify excluded santri NOT migrated to target year
  - Verify excluded santri NOT evaluated for alumni status
  - Verify excluded santri class assignments preserved
  - Run 100+ iterations with fast-check
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 6.7 Write property test for Existing Alumni Exclusion
  - **Property 18: Existing Alumni Exclusion**
  - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6**
  - Generate random santri population with some existing alumni
  - Verify existing alumni excluded from migration
  - Verify existing alumni NOT migrated to target year
  - Verify existing alumni status NOT modified in source year
  - Verify alumni exclusion count accurate
  - Run 100+ iterations with fast-check
  - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ]* 6.8 Write property test for Migration Count Accuracy
  - **Property 19: Migration Count Accuracy**
  - **Validates: Requirements 12.2, 12.3, 12.4**
  - Generate random santri population
  - Execute migration
  - Verify sum of (migrated + excluded + alumni_created + existing_alumni_excluded) equals total active santri
  - Run 100+ iterations with fast-check
  - _Requirements: 12.2, 12.3, 12.4_

- [ ]* 6.9 Write property test for MTs Graduate Count
  - **Property 20: MTs Graduate Count**
  - **Validates: Requirements 12.6**
  - Generate random santri population with some at Sekolah tingkat 9
  - Execute migration
  - Verify count of "Lulus MTs" equals number of tingkat 9 santri migrated
  - Run 100+ iterations with fast-check
  - _Requirements: 12.6_

### 7. Enhanced Rollback Endpoint

- [x] 7.1 Update rollback endpoint to handle alumni records
  - Modify `src/routes/tahunAjaranRoutes.js` POST `/api/tahun-ajaran/rollback` endpoint
  - Query alumni records created during the rolled-back migration
  - Delete alumni records created during migration
  - Restore "alumni" status back to "aktif" in source year
  - Update rollback response to include `alumni_deleted` count
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ]* 7.2 Write property test for Year Status Transition
  - **Property 16: Year Status Transition**
  - **Validates: Requirements 9.4, 9.5**
  - Generate random migration scenario
  - Execute migration
  - Verify source year status becomes "arsip" and is_active becomes FALSE
  - Verify target year status becomes "berjalan" and is_active becomes TRUE
  - Run 100+ iterations with fast-check
  - _Requirements: 9.4, 9.5_

- [ ]* 7.3 Write property test for Migration Log Creation
  - **Property 17: Migration Log Creation**
  - **Validates: Requirements 9.6**
  - Generate random migration scenario
  - Execute migration
  - Verify migration_log entry created with correct data
  - Verify source_tahun_ajaran_id, target_tahun_ajaran_id, migrated_count, excluded_santri_ids
  - Run 100+ iterations with fast-check
  - _Requirements: 9.6_

### 8. Checkpoint - Core Services Complete

- [x] 8. Ensure all core services pass unit tests
  - Ensure all tests pass, ask the user if questions arise.
  - Verify Auto-Advance Engine correctly advances all class levels
  - Verify Alumni Manager correctly detects graduation points
  - Verify Migration Validator correctly validates preconditions
  - Verify enhanced migration endpoint integrates all services
  - Verify rollback endpoint handles alumni records

### 9. Integration Tests

- [ ] 9.1 Write integration test for complete migration flow
  - Create test database with source year and santri at various levels
  - Execute migration endpoint
  - Verify target year created with correct status
  - Verify santri migrated with auto-advanced class levels
  - Verify alumni records created for graduating santri
  - Verify source year status updated to "arsip"
  - Verify migration log created
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 9.2 Write integration test for rollback flow
  - Execute migration
  - Execute rollback endpoint
  - Verify target year santri deleted
  - Verify source year statuses restored ("lulus" → "aktif", "tidak_naik" → "aktif")
  - Verify alumni records deleted
  - Verify source year status restored to "berjalan"
  - Verify target year status set to "draft"
  - Verify migration log deleted
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 9.3 Write integration test for validation errors
  - Create source year with santri requiring non-existent target classes
  - Execute migration endpoint
  - Verify validation error returned with missing class details
  - Verify no database changes occurred
  - Verify transaction rolled back
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 9.4 Write integration test for transaction atomicity
  - Create migration scenario that will fail mid-process
  - Force error during migration (e.g., constraint violation)
  - Verify entire transaction rolled back
  - Verify no partial changes in database
  - Verify source and target years unchanged
  - _Requirements: 9.1, 9.2, 9.3, 9.7_

- [ ] 9.5 Write integration test for edge cases
  - Test empty source year migration (migrated count = 0)
  - Test all santri excluded (migrated count = 0, all marked "tidak_naik")
  - Test santri at maximum level excluded (tingkat 6 or 12 with "tidak_naik")
  - Test concurrent migration attempts (second should fail)
  - _Requirements: Edge Cases 1, 4, 8, 9, 10_

### 10. Property-Based Test Infrastructure

- [ ] 10.1 Install and configure fast-check library
  - Add `fast-check` to package.json devDependencies
  - Create test data generators in `src/tests/generators/`
  - Create `generateSantri()` generator for random santri
  - Create `generateDiniyahSantri(tingkat)` generator
  - Create `generateSekolahSantri(tingkat)` generator
  - Create `generateDualTrackSantri(diniyahTingkat, sekolahTingkat)` generator
  - Create `generateKelas(jenis, tingkat)` generator
  - _Requirements: All property tests_

- [ ] 10.2 Create property test runner script
  - Create `src/tests/property/runAllProperties.js` script
  - Configure to run all 20 property tests with 100+ iterations each
  - Add test result reporting (pass/fail counts, counterexamples)
  - Add script to package.json: `"test:properties": "node src/tests/property/runAllProperties.js"`
  - _Requirements: All property tests_

### 11. Frontend Updates

- [x] 11.1 Update MigrationModal to show auto-advance preview
  - Modify `frontend/src/components/features/MigrationModal.jsx`
  - Add preview section showing current class → next class for each santri
  - Display graduation indicators for santri at graduation points
  - Show which santri will become alumni
  - Show which santri will be marked as "Lulus MTs"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 3.2, 4.2_

- [x] 11.2 Update migration success message with enhanced statistics
  - Update success notification to show alumni_created count
  - Update success notification to show mts_graduates count
  - Update success notification to show existing_alumni_excluded count
  - Add breakdown by track (diniyah_only, sekolah_only, dual_track)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 11.3 Update rollback confirmation dialog
  - Update rollback dialog to warn about alumni record deletion
  - Show count of alumni records that will be deleted
  - Update rollback success message to show alumni_deleted count
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 11.4 Write frontend component tests
  - Test MigrationModal renders auto-advance preview correctly
  - Test graduation indicators display correctly
  - Test alumni creation warnings display correctly
  - Test enhanced statistics display correctly
  - _Requirements: 1.1, 2.2, 3.2, 4.2, 12.1, 12.2, 12.3, 12.4_

### 12. Final Checkpoint - End-to-End Verification

- [x] 12. Verify complete feature implementation
  - Ensure all tests pass, ask the user if questions arise.
  - Run all property-based tests (20 properties × 100+ iterations)
  - Run all integration tests (migration, rollback, validation, atomicity, edge cases)
  - Run all unit tests (Auto-Advance Engine, Alumni Manager, Migration Validator)
  - Verify frontend displays auto-advance preview correctly
  - Verify migration endpoint returns enhanced statistics
  - Verify rollback endpoint handles alumni records correctly
  - Test manually with real data in development environment

---

## Notes

- **Tasks marked with `*` are optional** and can be skipped for faster MVP delivery
- **Property-based tests** validate universal correctness properties with 100+ iterations each
- **Unit tests** validate specific examples and edge cases
- **Integration tests** validate end-to-end flows with real database
- **Each task references specific requirements** for traceability
- **Checkpoints ensure incremental validation** before proceeding to next phase
- **Frontend updates are separate** from backend implementation for parallel development

## Test Execution Strategy

**Property-Based Tests:**
- Run with `npm run test:properties`
- Each property test runs 100+ iterations with randomly generated data
- Failures report counterexamples for debugging
- Tag format: `// Feature: smart-migration-alumni-management, Property N: [Property Title]`

**Integration Tests:**
- Run with `npm test` (or specific test runner)
- Use test database with isolated transactions
- Clean up test data after each test
- Test both success and failure scenarios

**Manual Testing:**
- Follow manual testing checklist in design document
- Test with real data in development environment
- Verify UI displays correct information
- Test error scenarios and edge cases

## Implementation Order Rationale

1. **Database First**: Schema changes must be in place before any code can use tingkat
2. **Core Services**: Auto-Advance Engine and Alumni Manager are independent and can be developed in parallel
3. **Integration**: Migration endpoint integrates all services once they're complete
4. **Testing**: Property-based tests validate correctness properties, integration tests validate end-to-end flows
5. **Frontend**: UI updates can be done in parallel with backend development

## Success Criteria

- ✅ All 20 property-based tests pass with 100+ iterations each
- ✅ All integration tests pass (migration, rollback, validation, atomicity, edge cases)
- ✅ All unit tests pass (Auto-Advance Engine, Alumni Manager, Migration Validator)
- ✅ Migration endpoint automatically advances class levels correctly
- ✅ Alumni records created for graduating santri with complete data
- ✅ MTs graduates marked as "lulus" and continue to MA
- ✅ Rollback restores all statuses and deletes alumni records
- ✅ Frontend displays auto-advance preview and enhanced statistics
- ✅ Manual testing confirms feature works with real data
