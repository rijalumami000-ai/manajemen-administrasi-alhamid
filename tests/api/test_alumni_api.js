const http = require('http');

const API_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (error) {
          reject(error);
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

async function testAlumniAPI() {
  console.log('🧪 Testing Alumni API...\n');

  let createdAlumniId = null;

  try {
    // Test 1: GET /api/alumni (empty)
    console.log('1️⃣ GET /api/alumni (initial)');
    const getInitial = await makeRequest('GET', '/api/alumni');
    console.log(`   Status: ${getInitial.status}`);
    console.log(`   Alumni count: ${getInitial.data.length}`);
    console.log('   ✅ PASS\n');

    // Test 2: POST /api/alumni (create)
    console.log('2️⃣ POST /api/alumni (create new alumni)');
    const newAlumni = {
      nis: 'A2020001',
      nik: '3201234567890123',
      nama: 'Ahmad Fauzi',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2002-05-15',
      tahun_masuk: 2015,
      tahun_lulus: 2020,
      kelas_terakhir: 'XII IPA 1',
      alamat: 'Jl. Merdeka No. 123, Jakarta',
      no_hp: '081234567890',
      email: 'ahmad.fauzi@email.com',
      pekerjaan: 'Software Engineer',
      instansi: 'PT Tech Indonesia',
      prestasi_utama: 'Juara 1 Lomba Tahfidz Tingkat Nasional',
      keterangan: 'Alumni berprestasi'
    };

    const postResponse = await makeRequest('POST', '/api/alumni', newAlumni);
    console.log(`   Status: ${postResponse.status}`);
    
    if (postResponse.status === 201) {
      createdAlumniId = postResponse.data.id;
      console.log(`   Created alumni ID: ${createdAlumniId}`);
      console.log(`   Name: ${postResponse.data.nama}`);
      console.log(`   NIS: ${postResponse.data.nis}`);
      console.log(`   Tahun Lulus: ${postResponse.data.tahun_lulus}`);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL - Expected status 201\n');
      return;
    }

    // Test 3: GET /api/alumni (with data)
    console.log('3️⃣ GET /api/alumni (after create)');
    const getAfterCreate = await makeRequest('GET', '/api/alumni');
    console.log(`   Status: ${getAfterCreate.status}`);
    console.log(`   Alumni count: ${getAfterCreate.data.length}`);
    
    if (getAfterCreate.data.length > 0) {
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL - Expected at least 1 alumni\n');
    }

    // Test 4: POST /api/alumni (create another)
    console.log('4️⃣ POST /api/alumni (create second alumni)');
    const secondAlumni = {
      nis: 'A2021002',
      nama: 'Fatimah Zahra',
      tahun_lulus: 2021,
      pekerjaan: 'Guru',
      instansi: 'SD Islam Terpadu'
    };

    const postSecond = await makeRequest('POST', '/api/alumni', secondAlumni);
    console.log(`   Status: ${postSecond.status}`);
    
    if (postSecond.status === 201) {
      console.log(`   Created alumni ID: ${postSecond.data.id}`);
      console.log(`   Name: ${postSecond.data.nama}`);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL\n');
    }

    // Test 5: PUT /api/alumni/:id (update)
    console.log('5️⃣ PUT /api/alumni/:id (update alumni)');
    const updateData = {
      nis: 'A2020001',
      nama: 'Ahmad Fauzi Updated',
      tahun_lulus: 2020,
      pekerjaan: 'Senior Software Engineer',
      instansi: 'PT Tech Indonesia',
      no_hp: '081234567899'
    };

    const putResponse = await makeRequest('PUT', `/api/alumni/${createdAlumniId}`, updateData);
    console.log(`   Status: ${putResponse.status}`);
    
    if (putResponse.status === 200) {
      console.log(`   Updated name: ${putResponse.data.nama}`);
      console.log(`   Updated pekerjaan: ${putResponse.data.pekerjaan}`);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL\n');
    }

    // Test 6: GET /api/alumni/search (search by name)
    console.log('6️⃣ GET /api/alumni/search?q=Ahmad');
    const searchResponse = await makeRequest('GET', '/api/alumni/search?q=Ahmad');
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Results: ${searchResponse.data.length}`);
    
    if (searchResponse.data.length > 0) {
      console.log(`   Found: ${searchResponse.data[0].nama}`);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL - Expected at least 1 result\n');
    }

    // Test 7: GET /api/alumni/search (search by year)
    console.log('7️⃣ GET /api/alumni/search?tahun=2021');
    const searchYear = await makeRequest('GET', '/api/alumni/search?tahun=2021');
    console.log(`   Status: ${searchYear.status}`);
    console.log(`   Results: ${searchYear.data.length}`);
    
    if (searchYear.data.length > 0) {
      console.log(`   Found: ${searchYear.data[0].nama} (${searchYear.data[0].tahun_lulus})`);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL - Expected at least 1 result\n');
    }

    // Test 8: POST /api/alumni (validation - missing required fields)
    console.log('8️⃣ POST /api/alumni (validation test - missing required fields)');
    const invalidAlumni = {
      nama: 'Test Alumni'
      // Missing nis and tahun_lulus
    };

    const postInvalid = await makeRequest('POST', '/api/alumni', invalidAlumni);
    console.log(`   Status: ${postInvalid.status}`);
    
    if (postInvalid.status === 400) {
      console.log(`   Error message: ${postInvalid.data.error}`);
      console.log('   ✅ PASS - Validation working\n');
    } else {
      console.log('   ❌ FAIL - Expected status 400\n');
    }

    // Test 9: DELETE /api/alumni/:id
    console.log('9️⃣ DELETE /api/alumni/:id');
    const deleteResponse = await makeRequest('DELETE', `/api/alumni/${createdAlumniId}`);
    console.log(`   Status: ${deleteResponse.status}`);
    
    if (deleteResponse.status === 200) {
      console.log(`   Message: ${deleteResponse.data.message}`);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL\n');
    }

    // Test 10: GET /api/alumni (verify deletion)
    console.log('🔟 GET /api/alumni (verify deletion)');
    const getFinal = await makeRequest('GET', '/api/alumni');
    console.log(`   Status: ${getFinal.status}`);
    console.log(`   Alumni count: ${getFinal.data.length}`);
    
    const stillExists = getFinal.data.find(a => a.id === createdAlumniId);
    if (!stillExists) {
      console.log('   ✅ PASS - Alumni deleted successfully\n');
    } else {
      console.log('   ❌ FAIL - Alumni still exists\n');
    }

    console.log('✅ All Alumni API tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run tests
console.log('Starting Alumni API tests...');
console.log('Make sure the server is running on http://localhost:3000\n');

testAlumniAPI();
