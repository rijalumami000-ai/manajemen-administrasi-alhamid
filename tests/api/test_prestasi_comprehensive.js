const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testPrestasiAPI() {
  console.log('=== Testing Prestasi API Endpoints ===\n');

  let testSantriId = null;
  let testKelasId = null;
  let createdPrestasiId = null;

  try {
    // Setup: Create test kelas
    console.log('Setup: Creating test kelas...');
    const kelasResponse = await makeRequest('POST', '/api/kelas', {
      jenis: 'Diniyah',
      nama: 'Test Kelas Prestasi'
    });
    testKelasId = kelasResponse.data.id;
    console.log('✓ Created test kelas with id:', testKelasId);
    console.log('');

    // Setup: Create test santri
    console.log('Setup: Creating test santri...');
    const santriResponse = await makeRequest('POST', '/api/santri', {
      nis: 'TEST-PRESTASI-001',
      nama: 'Test Santri Prestasi',
      kelas_diniyah_id: testKelasId
    });
    testSantriId = santriResponse.data.id;
    console.log('✓ Created test santri with id:', testSantriId);
    console.log('');

    // Test 1: GET /api/prestasi (retrieve all)
    console.log('Test 1: GET /api/prestasi');
    const getAllResponse = await makeRequest('GET', '/api/prestasi');
    console.log('✓ Status:', getAllResponse.status);
    console.log('✓ Retrieved', getAllResponse.data.length, 'prestasi records');
    console.log('');

    // Test 2: POST /api/prestasi (create new record)
    console.log('Test 2: POST /api/prestasi');
    const newPrestasi = {
      santri_id: testSantriId,
      jenis: 'Juara Lomba Tahfidz',
      tanggal: '2024-01-20',
      deskripsi: 'Juara 1 Lomba Tahfidz Juz 30 tingkat kabupaten',
      penghargaan: 'Piala dan Sertifikat'
    };
    const createResponse = await makeRequest('POST', '/api/prestasi', newPrestasi);
    console.log('✓ Status:', createResponse.status);
    console.log('✓ Created prestasi with id:', createResponse.data.id);
    console.log('✓ Data:', JSON.stringify(createResponse.data, null, 2));
    createdPrestasiId = createResponse.data.id;
    console.log('');

    // Test 3: GET /api/prestasi (verify creation)
    console.log('Test 3: GET /api/prestasi (verify creation)');
    const getAllAfterCreateResponse = await makeRequest('GET', '/api/prestasi');
    console.log('✓ Status:', getAllAfterCreateResponse.status);
    console.log('✓ Retrieved', getAllAfterCreateResponse.data.length, 'prestasi records');
    const createdRecord = getAllAfterCreateResponse.data.find(p => p.id === createdPrestasiId);
    if (createdRecord) {
      console.log('✓ Found created record with NIS:', createdRecord.nis, 'and nama:', createdRecord.nama_santri);
    }
    console.log('');

    // Test 4: PUT /api/prestasi/:id (update existing record)
    console.log('Test 4: PUT /api/prestasi/:id');
    const updatedPrestasi = {
      santri_id: testSantriId,
      jenis: 'Juara Lomba Tahfidz (Updated)',
      tanggal: '2024-01-21',
      deskripsi: 'Juara 1 Lomba Tahfidz Juz 30 tingkat provinsi',
      penghargaan: 'Piala, Sertifikat, dan Uang Pembinaan'
    };
    const updateResponse = await makeRequest('PUT', `/api/prestasi/${createdPrestasiId}`, updatedPrestasi);
    console.log('✓ Status:', updateResponse.status);
    console.log('✓ Updated prestasi:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Test 5: GET /api/prestasi/santri/:santriId (get all for specific santri)
    console.log('Test 5: GET /api/prestasi/santri/:santriId');
    const santriPrestasiResponse = await makeRequest('GET', `/api/prestasi/santri/${testSantriId}`);
    console.log('✓ Status:', santriPrestasiResponse.status);
    console.log('✓ Retrieved', santriPrestasiResponse.data.length, 'prestasi records for santri');
    console.log('');

    // Test 6: Validation - POST with missing required fields
    console.log('Test 6: POST /api/prestasi with missing required fields');
    const validationResponse = await makeRequest('POST', '/api/prestasi', {
      jenis: 'Test Prestasi'
      // Missing santri_id and tanggal
    });
    if (validationResponse.status === 400) {
      console.log('✓ Status:', validationResponse.status);
      console.log('✓ Error message:', validationResponse.data.error);
    } else {
      console.log('✗ Expected 400 status, got:', validationResponse.status);
    }
    console.log('');

    // Test 7: Error handling - PUT non-existent record
    console.log('Test 7: PUT /api/prestasi/:id with non-existent id');
    const notFoundPutResponse = await makeRequest('PUT', '/api/prestasi/99999', updatedPrestasi);
    if (notFoundPutResponse.status === 404) {
      console.log('✓ Status:', notFoundPutResponse.status);
      console.log('✓ Error message:', notFoundPutResponse.data.error);
    } else {
      console.log('✗ Expected 404 status, got:', notFoundPutResponse.status);
    }
    console.log('');

    // Test 8: Error handling - DELETE non-existent record
    console.log('Test 8: DELETE /api/prestasi/:id with non-existent id');
    const notFoundDeleteResponse = await makeRequest('DELETE', '/api/prestasi/99999');
    if (notFoundDeleteResponse.status === 404) {
      console.log('✓ Status:', notFoundDeleteResponse.status);
      console.log('✓ Error message:', notFoundDeleteResponse.data.error);
    } else {
      console.log('✗ Expected 404 status, got:', notFoundDeleteResponse.status);
    }
    console.log('');

    // Test 9: Error handling - POST with invalid santri_id
    console.log('Test 9: POST /api/prestasi with invalid santri_id');
    const invalidSantriResponse = await makeRequest('POST', '/api/prestasi', {
      santri_id: 99999,
      jenis: 'Test Prestasi',
      tanggal: '2024-01-20',
      deskripsi: 'Test',
      penghargaan: 'Test'
    });
    if (invalidSantriResponse.status === 400) {
      console.log('✓ Status:', invalidSantriResponse.status);
      console.log('✓ Error message:', invalidSantriResponse.data.error);
    } else {
      console.log('✗ Expected 400 status, got:', invalidSantriResponse.status);
    }
    console.log('');

    // Test 10: DELETE /api/prestasi/:id (delete record)
    console.log('Test 10: DELETE /api/prestasi/:id');
    const deleteResponse = await makeRequest('DELETE', `/api/prestasi/${createdPrestasiId}`);
    console.log('✓ Status:', deleteResponse.status);
    console.log('✓ Message:', deleteResponse.data.message);
    console.log('');

    // Cleanup: Delete test santri
    console.log('Cleanup: Deleting test santri...');
    await makeRequest('DELETE', `/api/santri/${testSantriId}`);
    console.log('✓ Deleted test santri');
    console.log('');

    // Cleanup: Delete test kelas
    console.log('Cleanup: Deleting test kelas...');
    await makeRequest('DELETE', `/api/kelas/${testKelasId}`);
    console.log('✓ Deleted test kelas');
    console.log('');

    console.log('=== All Prestasi API Tests Completed Successfully ===');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error('Stack:', error.stack);

    // Attempt cleanup on error
    if (createdPrestasiId) {
      try {
        await makeRequest('DELETE', `/api/prestasi/${createdPrestasiId}`);
        console.log('Cleanup: Deleted test prestasi');
      } catch (e) {
        console.error('Cleanup failed for prestasi:', e.message);
      }
    }
    if (testSantriId) {
      try {
        await makeRequest('DELETE', `/api/santri/${testSantriId}`);
        console.log('Cleanup: Deleted test santri');
      } catch (e) {
        console.error('Cleanup failed for santri:', e.message);
      }
    }
    if (testKelasId) {
      try {
        await makeRequest('DELETE', `/api/kelas/${testKelasId}`);
        console.log('Cleanup: Deleted test kelas');
      } catch (e) {
        console.error('Cleanup failed for kelas:', e.message);
      }
    }

    process.exit(1);
  }
}

// Run tests
testPrestasiAPI();
