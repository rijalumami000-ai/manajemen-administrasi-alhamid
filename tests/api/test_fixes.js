// Quick test script to verify all fixes
const API_URL = 'http://localhost:3000/api';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const tests = [
    { name: 'GET /api/kamar', url: `${API_URL}/kamar` },
    { name: 'GET /api/pelanggaran', url: `${API_URL}/pelanggaran` },
    { name: 'GET /api/prestasi', url: `${API_URL}/prestasi` },
    { name: 'GET /api/santri', url: `${API_URL}/santri` },
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      const status = response.status;
      const statusText = response.ok ? '✅ OK' : '❌ FAILED';
      console.log(`${statusText} ${test.name} - Status: ${status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   → Returned ${Array.isArray(data) ? data.length : 0} items`);
      } else {
        const error = await response.text();
        console.log(`   → Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('✅ All endpoint tests completed!');
}

// Run tests
testEndpoints().catch(console.error);
