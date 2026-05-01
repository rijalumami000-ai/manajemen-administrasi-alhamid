/**
 * Integration Test for Task 14: Pelanggaran & Prestasi Feature
 * 
 * This test verifies:
 * 1. Menu navigation works correctly
 * 2. Tab switching between Pelanggaran and Prestasi
 * 3. CRUD operations for both pelanggaran and prestasi
 * 4. Santri dropdown population
 * 5. Form validation displays appropriate error messages
 * 6. Foreign key constraints prevent santri deletion when records exist
 * 7. API endpoints return correct status codes and data
 * 8. UI consistency (manual verification required)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    console.log(`✓ ${name}`);
  } else {
    results.failed++;
    console.log(`✗ ${name}`);
    if (message) console.log(`  ${message}`);
  }
}

// Test data
let testSantriId = null;
let testPelanggaranId = null;
let testPrestasiId = null;

async function runTests() {
  console.log('='.repeat(70));
  console.log('INTEGRATION TEST: Pelanggaran & Prestasi Feature');
  console.log('='.repeat(70));
  console.log('');

  try {
    // ========================================================================
    // SECTION 1: Setup - Create test santri
    // ========================================================================
    console.log('SECTION 1: Setup - Creating test santri...');
    console.log('-'.repeat(70));

    const santriData = {
      nis: `TEST-${Date.now()}`,
      nama: 'Test Santri Integration',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2005-01-01',
    };

    const createSantriRes = await makeRequest('POST', '/api/santri', santriData);
    logTest(
      '1.1 Create test santri',
      createSantriRes.status === 201 && createSantriRes.data.id,
      createSantriRes.status !== 201 ? `Status: ${createSantriRes.status}` : ''
    );

    if (createSantriRes.status === 201) {
      testSantriId = createSantriRes.data.id;
      console.log(`    Created santri with ID: ${testSantriId}`);
    } else {
      console.log('    Failed to create test santri. Aborting tests.');
      return;
    }

    console.log('');

    // ========================================================================
    // SECTION 2: Pelanggaran CRUD Operations
    // ========================================================================
    console.log('SECTION 2: Pelanggaran CRUD Operations');
    console.log('-'.repeat(70));

    // Test 2.1: GET /api/pelanggaran (should return array)
    const getPelanggaranRes = await makeRequest('GET', '/api/pelanggaran');
    logTest(
      '2.1 GET /api/pelanggaran returns 200 and array',
      getPelanggaranRes.status === 200 && Array.isArray(getPelanggaranRes.data),
      getPelanggaranRes.status !== 200 ? `Status: ${getPelanggaranRes.status}` : ''
    );

    // Test 2.2: POST /api/pelanggaran with valid data
    const pelanggaranData = {
      santri_id: testSantriId,
      jenis: 'Terlambat Sholat',
      tanggal: '2024-01-15',
      deskripsi: 'Terlambat sholat subuh berjamaah',
      sanksi: 'Membersihkan masjid',
    };

    const createPelanggaranRes = await makeRequest('POST', '/api/pelanggaran', pelanggaranData);
    logTest(
      '2.2 POST /api/pelanggaran creates record',
      createPelanggaranRes.status === 201 && createPelanggaranRes.data.id,
      createPelanggaranRes.status !== 201 ? `Status: ${createPelanggaranRes.status}` : ''
    );

    if (createPelanggaranRes.status === 201) {
      testPelanggaranId = createPelanggaranRes.data.id;
      console.log(`    Created pelanggaran with ID: ${testPelanggaranId}`);
    }

    // Test 2.3: POST /api/pelanggaran with missing required fields
    const invalidPelanggaranData = {
      santri_id: testSantriId,
      // Missing jenis and tanggal
    };

    const createInvalidPelanggaranRes = await makeRequest('POST', '/api/pelanggaran', invalidPelanggaranData);
    logTest(
      '2.3 POST /api/pelanggaran validates required fields',
      createInvalidPelanggaranRes.status === 400,
      createInvalidPelanggaranRes.status !== 400 ? `Expected 400, got ${createInvalidPelanggaranRes.status}` : ''
    );

    // Test 2.4: GET /api/pelanggaran/santri/:santriId
    const getPelanggaranBySantriRes = await makeRequest('GET', `/api/pelanggaran/santri/${testSantriId}`);
    logTest(
      '2.4 GET /api/pelanggaran/santri/:santriId returns santri records',
      getPelanggaranBySantriRes.status === 200 && Array.isArray(getPelanggaranBySantriRes.data),
      getPelanggaranBySantriRes.status !== 200 ? `Status: ${getPelanggaranBySantriRes.status}` : ''
    );

    // Test 2.5: PUT /api/pelanggaran/:id with valid data
    if (testPelanggaranId) {
      const updatePelanggaranData = {
        santri_id: testSantriId,
        jenis: 'Terlambat Sholat (Updated)',
        tanggal: '2024-01-16',
        deskripsi: 'Updated description',
        sanksi: 'Updated sanksi',
      };

      const updatePelanggaranRes = await makeRequest('PUT', `/api/pelanggaran/${testPelanggaranId}`, updatePelanggaranData);
      logTest(
        '2.5 PUT /api/pelanggaran/:id updates record',
        updatePelanggaranRes.status === 200 && updatePelanggaranRes.data.jenis === 'Terlambat Sholat (Updated)',
        updatePelanggaranRes.status !== 200 ? `Status: ${updatePelanggaranRes.status}` : ''
      );
    }

    // Test 2.6: PUT /api/pelanggaran/:id with non-existent ID
    const updateNonExistentRes = await makeRequest('PUT', '/api/pelanggaran/999999', pelanggaranData);
    logTest(
      '2.6 PUT /api/pelanggaran/:id returns 404 for non-existent record',
      updateNonExistentRes.status === 404,
      updateNonExistentRes.status !== 404 ? `Expected 404, got ${updateNonExistentRes.status}` : ''
    );

    console.log('');

    // ========================================================================
    // SECTION 3: Prestasi CRUD Operations
    // ========================================================================
    console.log('SECTION 3: Prestasi CRUD Operations');
    console.log('-'.repeat(70));

    // Test 3.1: GET /api/prestasi (should return array)
    const getPrestasiRes = await makeRequest('GET', '/api/prestasi');
    logTest(
      '3.1 GET /api/prestasi returns 200 and array',
      getPrestasiRes.status === 200 && Array.isArray(getPrestasiRes.data),
      getPrestasiRes.status !== 200 ? `Status: ${getPrestasiRes.status}` : ''
    );

    // Test 3.2: POST /api/prestasi with valid data
    const prestasiData = {
      santri_id: testSantriId,
      jenis: 'Juara Lomba Tahfidz',
      tanggal: '2024-01-20',
      deskripsi: 'Juara 1 Lomba Tahfidz Juz 30',
      penghargaan: 'Piala dan Sertifikat',
    };

    const createPrestasiRes = await makeRequest('POST', '/api/prestasi', prestasiData);
    logTest(
      '3.2 POST /api/prestasi creates record',
      createPrestasiRes.status === 201 && createPrestasiRes.data.id,
      createPrestasiRes.status !== 201 ? `Status: ${createPrestasiRes.status}` : ''
    );

    if (createPrestasiRes.status === 201) {
      testPrestasiId = createPrestasiRes.data.id;
      console.log(`    Created prestasi with ID: ${testPrestasiId}`);
    }

    // Test 3.3: POST /api/prestasi with missing required fields
    const invalidPrestasiData = {
      santri_id: testSantriId,
      // Missing jenis and tanggal
    };

    const createInvalidPrestasiRes = await makeRequest('POST', '/api/prestasi', invalidPrestasiData);
    logTest(
      '3.3 POST /api/prestasi validates required fields',
      createInvalidPrestasiRes.status === 400,
      createInvalidPrestasiRes.status !== 400 ? `Expected 400, got ${createInvalidPrestasiRes.status}` : ''
    );

    // Test 3.4: GET /api/prestasi/santri/:santriId
    const getPrestasiBySantriRes = await makeRequest('GET', `/api/prestasi/santri/${testSantriId}`);
    logTest(
      '3.4 GET /api/prestasi/santri/:santriId returns santri records',
      getPrestasiBySantriRes.status === 200 && Array.isArray(getPrestasiBySantriRes.data),
      getPrestasiBySantriRes.status !== 200 ? `Status: ${getPrestasiBySantriRes.status}` : ''
    );

    // Test 3.5: PUT /api/prestasi/:id with valid data
    if (testPrestasiId) {
      const updatePrestasiData = {
        santri_id: testSantriId,
        jenis: 'Juara Lomba Tahfidz (Updated)',
        tanggal: '2024-01-21',
        deskripsi: 'Updated description',
        penghargaan: 'Updated penghargaan',
      };

      const updatePrestasiRes = await makeRequest('PUT', `/api/prestasi/${testPrestasiId}`, updatePrestasiData);
      logTest(
        '3.5 PUT /api/prestasi/:id updates record',
        updatePrestasiRes.status === 200 && updatePrestasiRes.data.jenis === 'Juara Lomba Tahfidz (Updated)',
        updatePrestasiRes.status !== 200 ? `Status: ${updatePrestasiRes.status}` : ''
      );
    }

    // Test 3.6: PUT /api/prestasi/:id with non-existent ID
    const updateNonExistentPrestasiRes = await makeRequest('PUT', '/api/prestasi/999999', prestasiData);
    logTest(
      '3.6 PUT /api/prestasi/:id returns 404 for non-existent record',
      updateNonExistentPrestasiRes.status === 404,
      updateNonExistentPrestasiRes.status !== 404 ? `Expected 404, got ${updateNonExistentPrestasiRes.status}` : ''
    );

    console.log('');

    // ========================================================================
    // SECTION 4: Foreign Key Constraints
    // ========================================================================
    console.log('SECTION 4: Foreign Key Constraints');
    console.log('-'.repeat(70));

    // Test 4.1: Attempt to delete santri with pelanggaran records
    const deleteSantriWithPelanggaranRes = await makeRequest('DELETE', `/api/santri/${testSantriId}`);
    logTest(
      '4.1 DELETE santri with pelanggaran records is prevented',
      deleteSantriWithPelanggaranRes.status === 400 || deleteSantriWithPelanggaranRes.status === 500,
      deleteSantriWithPelanggaranRes.status === 200 ? 'Santri was deleted despite having records!' : ''
    );

    console.log('');

    // ========================================================================
    // SECTION 5: Data Integrity and Joins
    // ========================================================================
    console.log('SECTION 5: Data Integrity and Joins');
    console.log('-'.repeat(70));

    // Test 5.1: Verify pelanggaran includes santri data
    const pelanggaranListRes = await makeRequest('GET', '/api/pelanggaran');
    const hasSantriData = pelanggaranListRes.data.some(
      (p) => p.santri_id === testSantriId && p.nama_santri && p.nis
    );
    logTest(
      '5.1 GET /api/pelanggaran includes santri NIS and nama',
      pelanggaranListRes.status === 200 && hasSantriData,
      !hasSantriData ? 'Santri data not found in pelanggaran records' : ''
    );

    // Test 5.2: Verify prestasi includes santri data
    const prestasiListRes = await makeRequest('GET', '/api/prestasi');
    const prestasiHasSantriData = prestasiListRes.data.some(
      (p) => p.santri_id === testSantriId && p.nama_santri && p.nis
    );
    logTest(
      '5.2 GET /api/prestasi includes santri NIS and nama',
      prestasiListRes.status === 200 && prestasiHasSantriData,
      !prestasiHasSantriData ? 'Santri data not found in prestasi records' : ''
    );

    console.log('');

    // ========================================================================
    // SECTION 6: Santri Dropdown Population
    // ========================================================================
    console.log('SECTION 6: Santri Dropdown Population');
    console.log('-'.repeat(70));

    // Test 6.1: GET /api/santri returns data for dropdown
    const getSantriRes = await makeRequest('GET', '/api/santri');
    logTest(
      '6.1 GET /api/santri returns array for dropdown population',
      getSantriRes.status === 200 && Array.isArray(getSantriRes.data) && getSantriRes.data.length > 0,
      getSantriRes.status !== 200 ? `Status: ${getSantriRes.status}` : ''
    );

    // Test 6.2: Verify santri data includes required fields
    const santriHasRequiredFields = getSantriRes.data.some(
      (s) => s.id && s.nis && s.nama
    );
    logTest(
      '6.2 Santri records include id, nis, and nama for dropdown',
      santriHasRequiredFields,
      !santriHasRequiredFields ? 'Santri records missing required fields' : ''
    );

    console.log('');

    // ========================================================================
    // SECTION 7: Cleanup - Delete test records
    // ========================================================================
    console.log('SECTION 7: Cleanup - Deleting test records...');
    console.log('-'.repeat(70));

    // Delete pelanggaran first
    if (testPelanggaranId) {
      const deletePelanggaranRes = await makeRequest('DELETE', `/api/pelanggaran/${testPelanggaranId}`);
      logTest(
        '7.1 DELETE /api/pelanggaran/:id removes record',
        deletePelanggaranRes.status === 200,
        deletePelanggaranRes.status !== 200 ? `Status: ${deletePelanggaranRes.status}` : ''
      );
    }

    // Delete prestasi
    if (testPrestasiId) {
      const deletePrestasiRes = await makeRequest('DELETE', `/api/prestasi/${testPrestasiId}`);
      logTest(
        '7.2 DELETE /api/prestasi/:id removes record',
        deletePrestasiRes.status === 200,
        deletePrestasiRes.status !== 200 ? `Status: ${deletePrestasiRes.status}` : ''
      );
    }

    // Now delete santri (should succeed after deleting related records)
    if (testSantriId) {
      const deleteSantriRes = await makeRequest('DELETE', `/api/santri/${testSantriId}`);
      logTest(
        '7.3 DELETE santri succeeds after removing related records',
        deleteSantriRes.status === 200,
        deleteSantriRes.status !== 200 ? `Status: ${deleteSantriRes.status}` : ''
      );
    }

    console.log('');

    // ========================================================================
    // SECTION 8: UI Verification (Manual)
    // ========================================================================
    console.log('SECTION 8: Manual UI Verification Required');
    console.log('-'.repeat(70));
    console.log('The following items require manual verification:');
    console.log('  [ ] Menu navigation to "Pelanggaran & Prestasi" works');
    console.log('  [ ] Tab switching between Pelanggaran and Prestasi tabs');
    console.log('  [ ] Modal forms open and close correctly');
    console.log('  [ ] Santri dropdown populates with data');
    console.log('  [ ] Form validation shows error messages for required fields');
    console.log('  [ ] Success messages display after CRUD operations');
    console.log('  [ ] Tables display data correctly with all columns');
    console.log('  [ ] Edit buttons populate form with existing data');
    console.log('  [ ] Delete buttons show confirmation dialog');
    console.log('  [ ] Responsive design works on mobile and desktop');
    console.log('  [ ] UI styling is consistent with existing modules');
    console.log('');

  } catch (error) {
    console.error('Test execution error:', error);
  }

  // ========================================================================
  // Test Summary
  // ========================================================================
  console.log('='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`  - ${t.name}`);
        if (t.message) console.log(`    ${t.message}`);
      });
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
