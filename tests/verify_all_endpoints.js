/**
 * Automated Endpoint Verification Script
 * Verifies all API endpoints are responding correctly
 *
 * Run with: node tests/verify_all_endpoints.js
 */

const API_URL = 'http://localhost:3000/api';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  endpoints: []
};

/**
 * Make HTTP request
 */
async function request(method, endpoint) {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, { method });
    const data = await response.text();

    return {
      status: response.status,
      ok: response.ok,
      data: data ? JSON.parse(data) : null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Verify endpoint
 */
async function verifyEndpoint(name, method, endpoint, expectedStatus = 200) {
  results.total++;

  try {
    const res = await request(method, endpoint);

    if (res.status === expectedStatus) {
      results.passed++;
      console.log(`${colors.green}✓${colors.reset} ${name} ${colors.gray}(${res.status})${colors.reset}`);
      results.endpoints.push({ name, status: 'passed', code: res.status });
      return true;
    } else {
      results.failed++;
      console.log(`${colors.red}✗${colors.reset} ${name} ${colors.gray}(Expected ${expectedStatus}, got ${res.status})${colors.reset}`);
      results.endpoints.push({ name, status: 'failed', code: res.status, expected: expectedStatus });
      return false;
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name} ${colors.gray}(${error.message})${colors.reset}`);
    results.endpoints.push({ name, status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Print header
 */
function printHeader(title) {
  console.log(`\n${colors.cyan}${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.gray}${'='.repeat(60)}${colors.reset}`);
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n${colors.bright}Verification Summary${colors.reset}`);
  console.log(`${colors.gray}${'='.repeat(60)}${colors.reset}`);
  console.log(`Total Endpoints: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  console.log(`\nPass Rate: ${passRate}%`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ All endpoints are responding correctly!${colors.reset}`);
    console.log(`${colors.green}Server is ready for manual testing.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Some endpoints are not responding${colors.reset}`);
    console.log(`${colors.yellow}Please check the server logs and fix the issues.${colors.reset}\n`);
  }
}

// ============================================================================
// MAIN VERIFICATION
// ============================================================================

console.log(`${colors.bright}API Endpoint Verification${colors.reset}`);
console.log(`${colors.gray}Checking if all endpoints are responding...${colors.reset}`);

// Summary
printHeader('Summary API');
await verifyEndpoint('GET /api/summary', 'GET', '/summary');

// Santri
printHeader('Santri API');
await verifyEndpoint('GET /api/santri', 'GET', '/santri');

// Guru
printHeader('Guru API');
await verifyEndpoint('GET /api/guru', 'GET', '/guru');

// Kelas
printHeader('Kelas API');
await verifyEndpoint('GET /api/kelas', 'GET', '/kelas');

// Kamar
printHeader('Kamar API');
await verifyEndpoint('GET /api/kamar', 'GET', '/kamar');

// Tahun Ajaran
printHeader('Tahun Ajaran API');
await verifyEndpoint('GET /api/tahun-ajaran', 'GET', '/tahun-ajaran');
await verifyEndpoint('GET /api/tahun-ajaran/active', 'GET', '/tahun-ajaran/active');

// Pelanggaran
printHeader('Pelanggaran API');
await verifyEndpoint('GET /api/pelanggaran', 'GET', '/pelanggaran');

// Prestasi
printHeader('Prestasi API');
await verifyEndpoint('GET /api/prestasi', 'GET', '/prestasi');

// Alumni
printHeader('Alumni API');
await verifyEndpoint('GET /api/alumni', 'GET', '/alumni');
await verifyEndpoint('GET /api/alumni/search', 'GET', '/alumni/search');
await verifyEndpoint('GET /api/santri/active', 'GET', '/santri/active');

// Mata Pelajaran
printHeader('Mata Pelajaran API');
await verifyEndpoint('GET /api/mata-pelajaran', 'GET', '/mata-pelajaran');

// Jabatan
printHeader('Jabatan API');
await verifyEndpoint('GET /api/jabatan', 'GET', '/jabatan');

// Print summary
printSummary();

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
