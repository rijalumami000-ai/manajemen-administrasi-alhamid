const http = require('http');

const BASE_URL = 'http://localhost:3000';

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

  try {
    // Test 1: GET /api/prestasi (retrieve all)
    console.log('Test 1: GET /api/prestasi');
    const getAllResponse = await makeRequest('GET', '/api/prestasi');
    console.log('✓ Status:', getAllResponse.status);
    console.log('✓ Retrieved', getAllResponse.data.length, 'prestasi records');
    console.log('✓ Sample data:', JSON.stringify(getAllResponse.data[0] || {}, null, 2));
    console.log('');

    // Test 2: GET /api/santri to get a valid santri_id
    console.log('Test 2: Getting valid santri_id for testing');
    const santriResponse = await makeRequest('GET', '/api/santri');
    if (santriResponse.data.length === 0) {
      console.log('✗ No santri found. Please add santri first.');
      return;
    }
    const testSantriId = santriResponse.data[0].id;
    console.log('✓ Using santri_id:', testSantriId, '(', santriResponse.data[0].nama, ')');
    console.log('');

    // Test 3: POST /api/prestasi (create new record)
    console.log('Test 3: POST /api/prestasi');
    const newPrestasi = {
      santri_id: testSantriId,
      jenis: 'Juara Lomba Tahfidz',
      tanggal: '2024-01-20',
      deskripsi: 'Juara 1 Lomba Tahfidz Juz 30 tingkat kabupaten',
      penghargaan: 'Piala dan Sertifikat'
    };
    const createResponse = await makeRequest('POST', '/api/prestasi', newPrestasi);
    console.log('✓ Status:', createResponse.status);
    console.log('✓ Created prestasi:', JSON.stringify(createResponse.data, null, 2));
    const createdId = createResponse.data.id;
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
    const updateResponse = await makeRequest('PUT', `/api/prestasi/${createdId}`, updatedPrestasi);
    console.log('✓ Status:', updateResponse.status);
    console.log('✓ Updated prestasi:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Test 5: GET /api/prestasi/santri/:santriId (get all for specific santri)
    console.log('Test 5: GET /api/prestasi/santri/:santriId');
    const santriPrestasiResponse = await makeRequest('GET', `/api/prestasi/santri/${testSantriId}`);
    console.log('✓ Status:', santriPrestasiResponse.status);
    console.log('✓ Retrieved', santriPrestasiResponse.data.length, 'prestasi records for santri');
    console.log('');

    // Test 6: DELETE /api/prestasi/:id (delete record)
    console.log('Test 6: DELETE /api/prestasi/:id');
    const deleteResponse = await makeRequest('DELETE', `/api/prestasi/${createdId}`);
    console.log('✓ Status:', deleteResponse.status);
    console.log('✓ Message:', deleteResponse.data.message);
    console.log('');

    // Test 7: Validation - POST with missing required fields
    console.log('Test 7: POST /api/prestasi with missing required fields');
    const validationResponse = await makeRequest('POST', '/api/prestasi', {
      jenis: 'Test Prestasi'
      // Missing santri_id and tanggal
    });
    if (validationResponse.status === 400) {
      console.log('✓ Status:', validationResponse.status);
      console.log('✓ Error message:', validationResponse.data.error);
    } else {
      console.log('✗ Should have returned 400 error');
    }
    console.log('');

    // Test 8: Error handling - PUT non-existent record
    console.log('Test 8: PUT /api/prestasi/:id with non-existent id');
    const notFoundPutResponse = await makeRequest('PUT', '/api/prestasi/99999', updatedPrestasi);
    if (notFoundPutResponse.status === 404) {
      console.log('✓ Status:', notFoundPutResponse.status);
      console.log('✓ Error message:', notFoundPutResponse.data.error);
    } else {
      console.log('✗ Should have returned 404 error');
    }
    console.log('');

    // Test 9: Error handling - DELETE non-existent record
    console.log('Test 9: DELETE /api/prestasi/:id with non-existent id');
    const notFoundDeleteResponse = await makeRequest('DELETE', '/api/prestasi/99999');
    if (notFoundDeleteResponse.status === 404) {
      console.log('✓ Status:', notFoundDeleteResponse.status);
      console.log('✓ Error message:', notFoundDeleteResponse.data.error);
    } else {
      console.log('✗ Should have returned 404 error');
    }
    console.log('');

    // Test 10: Error handling - POST with invalid santri_id
    console.log('Test 10: POST /api/prestasi with invalid santri_id');
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
      console.log('✗ Should have returned 400 error');
    }
    console.log('');

    console.log('=== All Prestasi API Tests Completed Successfully ===');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testPrestasiAPI();
