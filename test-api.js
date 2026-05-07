// Script untuk test API backend
// Jalankan dengan: node test-api.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function testAPI() {
  console.log('🧪 Testing Backend API...\n');

  try {
    // Test 1: Get tahun ajaran
    console.log('1️⃣ Test GET /api/tahun-ajaran');
    const tahunAjaranRes = await makeRequest('GET', '/api/tahun-ajaran');
    console.log('   Status:', tahunAjaranRes.status);
    console.log('   Data:', JSON.stringify(tahunAjaranRes.data, null, 2).substring(0, 200) + '...');

    if (tahunAjaranRes.status === 200 && tahunAjaranRes.data.length > 0) {
      console.log('   ✅ PASS\n');

      const activeTahunAjaran = tahunAjaranRes.data.find(ta => ta.is_active);
      if (activeTahunAjaran) {
        console.log('   📌 Tahun Ajaran Berjalan:', activeTahunAjaran.kode);
        console.log('   📌 ID:', activeTahunAjaran.id);
        console.log('   📌 Tahun Mulai:', activeTahunAjaran.tahun_mulai);
        console.log('   📌 Tahun Selesai:', activeTahunAjaran.tahun_selesai);
        console.log('');
      } else {
        console.log('   ⚠️  WARNING: Tidak ada tahun ajaran berjalan (is_active = TRUE)\n');
      }
    } else {
      console.log('   ❌ FAIL\n');
    }

    // Test 2: Get santri
    console.log('2️⃣ Test GET /api/santri');
    const santriRes = await makeRequest('GET', '/api/santri');
    console.log('   Status:', santriRes.status);
    console.log('   Jumlah santri:', santriRes.data.length);

    if (santriRes.status === 200) {
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL\n');
    }

    // Test 3: Test POST santri (dry run - tidak benar-benar insert)
    console.log('3️⃣ Test POST /api/santri (struktur request)');
    const testSantriData = {
      nis: 'TEST001',
      nama: 'Test Santri',
      tahun_ajaran_id: activeTahunAjaran ? activeTahunAjaran.id : 1,
      jenis_kelamin: 'L',
      nama_ayah: 'Test Ayah',
      nama_ibu: 'Test Ibu'
    };
    console.log('   Request body:', JSON.stringify(testSantriData, null, 2));
    console.log('   ℹ️  Tidak benar-benar mengirim request (dry run)\n');

    // Test 4: Check if MigrationModal component exists
    console.log('4️⃣ Test Frontend Component');
    const fs = require('fs');
    const migrationModalPath = './frontend/src/components/features/MigrationModal.jsx';

    if (fs.existsSync(migrationModalPath)) {
      console.log('   ✅ MigrationModal.jsx exists');
      const content = fs.readFileSync(migrationModalPath, 'utf8');
      if (content.includes('export function MigrationModal')) {
        console.log('   ✅ MigrationModal component exported\n');
      } else {
        console.log('   ⚠️  MigrationModal component not exported properly\n');
      }
    } else {
      console.log('   ❌ MigrationModal.jsx NOT FOUND\n');
    }

    // Test 5: Check Santri.jsx modifications
    console.log('5️⃣ Test Santri.jsx Modifications');
    const santriPagePath = './frontend/src/pages/Santri.jsx';

    if (fs.existsSync(santriPagePath)) {
      const content = fs.readFileSync(santriPagePath, 'utf8');

      const checks = [
        { name: 'getYearStatus function', pattern: 'const getYearStatus = ()' },
        { name: 'canAdd variable', pattern: 'const canAdd = yearStatus' },
        { name: 'MigrationModal import', pattern: 'import { MigrationModal }' },
        { name: 'tahun_ajaran_id in submit', pattern: 'tahun_ajaran_id: targetTahunAjaranId' },
      ];

      checks.forEach(check => {
        if (content.includes(check.pattern)) {
          console.log(`   ✅ ${check.name} found`);
        } else {
          console.log(`   ❌ ${check.name} NOT FOUND`);
        }
      });
      console.log('');
    } else {
      console.log('   ❌ Santri.jsx NOT FOUND\n');
    }

    console.log('✅ Test selesai!\n');
    console.log('📝 Kesimpulan:');
    console.log('   - Jika semua test PASS, backend sudah benar');
    console.log('   - Jika ada FAIL, ada masalah di backend atau database');
    console.log('   - Pastikan frontend sudah di-rebuild: cd frontend && npm run build');
    console.log('   - Pastikan browser sudah di-refresh: Ctrl+Shift+R\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Pastikan server backend sedang jalan di port 3000');
    console.log('   Jalankan: node server.js\n');
  }
}

testAPI();
