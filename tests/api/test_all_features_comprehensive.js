/**
 * Comprehensive API Test Suite
 * Tests all features: Alumni, Santri, Guru, Kelas, Kamar, Pelanggaran, Prestasi
 *
 * Run with: node tests/api/test_all_features_comprehensive.js
 */

const API_URL = 'http://localhost:3000/api';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

/**
 * Make HTTP request
 */
async function request(method, endpoint, body = null) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
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
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Test runner
 */
async function test(name, fn, options = {}) {
  results.total++;

  if (options.skip) {
    results.skipped++;
    console.log(`${colors.yellow}⊘ SKIP${colors.reset} ${colors.gray}${name}${colors.reset}`);
    results.tests.push({ name, status: 'skipped' });
    return;
  }

  try {
    await fn();
    results.passed++;
    console.log(`${colors.green}✓ PASS${colors.reset} ${name}`);
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

/**
 * Test suite header
 */
function suite(name) {
  console.log(`\n${colors.cyan}${colors.bright}${name}${colors.reset}`);
  console.log(`${colors.gray}${'='.repeat(60)}${colors.reset}`);
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.gray}${'='.repeat(60)}${colors.reset}`);
  console.log(`Total:   ${results.total}`);
  console.log(`${colors.green}Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  console.log(`\nPass Rate: ${passRate}%`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
  }
}

// ============================================================================
// ALUMNI TESTS
// ============================================================================

suite('Alumni API Tests');

await test('GET /api/alumni - should return alumni list', async () => {
  const res = await request('GET', '/alumni');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('GET /api/alumni/search - should search alumni', async () => {
  const res = await request('GET', '/alumni/search?q=test');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('POST /api/alumni - should reject invalid NIS', async () => {
  const res = await request('POST', '/alumni', {
    nis: '123', // Invalid: too short
    nama: 'Test Alumni',
    tahun_lulus: '2025'
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('POST /api/alumni - should reject invalid email', async () => {
  const res = await request('POST', '/alumni', {
    nis: '1234567890',
    nama: 'Test Alumni',
    tahun_lulus: '2025',
    email: 'invalid-email' // Invalid format
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  assert(res.data.error.includes('Email'), 'Error should mention email');
});

await test('POST /api/alumni - should create with valid data', async () => {
  const timestamp = Date.now().toString().slice(-10); // Get last 10 digits
  const res = await request('POST', '/alumni', {
    nis: timestamp, // Valid 10-digit NIS
    nama: 'Test Alumni Valid',
    tahun_lulus: '2025'
  });
  assert(res.status === 201, `Expected 201, got ${res.status}. Error: ${JSON.stringify(res.data)}`);
  assert(res.data.id, 'Should return created alumni with ID');

  // Cleanup
  if (res.data.id) {
    await request('DELETE', `/alumni/${res.data.id}`);
  }
});

await test('GET /api/alumni/:id/detail - should return 404 for non-existent', async () => {
  const res = await request('GET', '/alumni/99999/detail');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// SANTRI TESTS
// ============================================================================

suite('Santri API Tests');

await test('GET /api/santri - should return santri list', async () => {
  const res = await request('GET', '/santri');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('POST /api/santri - should reject missing required fields', async () => {
  const res = await request('POST', '/santri', {
    // Missing nis and nama
    jenis_kelamin: 'L'
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('POST /api/santri - should create with valid data', async () => {
  const res = await request('POST', '/santri', {
    nis: `TEST${Date.now()}`,
    nama: 'Test Santri',
    jenis_kelamin: 'L'
  });
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(res.data.id, 'Should return created santri with ID');

  // Cleanup
  if (res.data.id) {
    await request('DELETE', `/santri/${res.data.id}`);
  }
});

await test('PUT /api/santri/:id - should return 404 for non-existent', async () => {
  const res = await request('PUT', '/santri/99999', {
    nis: '1234567890',
    nama: 'Test Update'
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('DELETE /api/santri/:id - should return 404 for non-existent', async () => {
  const res = await request('DELETE', '/santri/99999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// GURU TESTS
// ============================================================================

suite('Guru API Tests');

await test('GET /api/guru - should return guru list', async () => {
  const res = await request('GET', '/guru');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('POST /api/guru - should reject missing required fields', async () => {
  const res = await request('POST', '/guru', {
    nama: 'Test Guru'
    // Missing mata_pelajaran_id, jabatan_id, no_hp, alamat, status
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('PUT /api/guru/:id - should return 404 for non-existent', async () => {
  const res = await request('PUT', '/guru/99999', {
    nama: 'Test Update',
    mata_pelajaran_id: 1,
    jabatan_id: 1,
    no_hp: '081234567890',
    alamat: 'Test',
    status: 'Aktif'
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('DELETE /api/guru/:id - should return 404 for non-existent', async () => {
  const res = await request('DELETE', '/guru/99999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// KELAS TESTS
// ============================================================================

suite('Kelas API Tests');

await test('GET /api/kelas - should return kelas list', async () => {
  const res = await request('GET', '/kelas');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('POST /api/kelas - should reject missing required fields', async () => {
  const res = await request('POST', '/kelas', {
    // Missing jenis and nama
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('POST /api/kelas - should create with valid data', async () => {
  const res = await request('POST', '/kelas', {
    jenis: 'diniyah',
    nama: `Test Kelas ${Date.now()}`
  });
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(res.data.id, 'Should return created kelas with ID');

  // Cleanup
  if (res.data.id) {
    await request('DELETE', `/kelas/${res.data.id}`);
  }
});

await test('PUT /api/kelas/:id - should return 404 for non-existent', async () => {
  const res = await request('PUT', '/kelas/99999', {
    jenis: 'diniyah',
    nama: 'Test Update'
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('DELETE /api/kelas/:id - should return 404 for non-existent', async () => {
  const res = await request('DELETE', '/kelas/99999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// KAMAR TESTS
// ============================================================================

suite('Kamar API Tests');

await test('GET /api/kamar - should return kamar list', async () => {
  const res = await request('GET', '/kamar');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('POST /api/kamar - should reject missing required fields', async () => {
  const res = await request('POST', '/kamar', {
    nama: 'Test Kamar'
    // Missing kapasitas and jenis
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('POST /api/kamar - should create with valid data', async () => {
  const res = await request('POST', '/kamar', {
    nama: `Test Kamar ${Date.now()}`,
    kapasitas: 10,
    jenis: 'Putra'
  });
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(res.data.id, 'Should return created kamar with ID');

  // Cleanup
  if (res.data.id) {
    await request('DELETE', `/kamar/${res.data.id}`);
  }
});

await test('PUT /api/kamar/:id - should return 404 for non-existent', async () => {
  const res = await request('PUT', '/kamar/99999', {
    nama: 'Test Update',
    kapasitas: 10,
    jenis: 'Putra'
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

await test('DELETE /api/kamar/:id - should return 404 for non-existent', async () => {
  const res = await request('DELETE', '/kamar/99999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// PELANGGARAN TESTS
// ============================================================================

suite('Pelanggaran API Tests');

await test('GET /api/pelanggaran - should return pelanggaran list', async () => {
  const res = await request('GET', '/pelanggaran');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('DELETE /api/pelanggaran/:id - should return 404 for non-existent', async () => {
  const res = await request('DELETE', '/pelanggaran/99999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// PRESTASI TESTS
// ============================================================================

suite('Prestasi API Tests');

await test('GET /api/prestasi - should return prestasi list', async () => {
  const res = await request('GET', '/prestasi');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('DELETE /api/prestasi/:id - should return 404 for non-existent', async () => {
  const res = await request('DELETE', '/prestasi/99999');
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  assert(res.data.error, 'Should return error message');
});

// ============================================================================
// SUMMARY TESTS
// ============================================================================

suite('Summary API Tests');

await test('GET /api/summary - should return dashboard summary', async () => {
  const res = await request('GET', '/summary');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(res.data.santri !== undefined, 'Should have santri count');
  assert(res.data.guru !== undefined, 'Should have guru count');
});

// ============================================================================
// TAHUN AJARAN TESTS
// ============================================================================

suite('Tahun Ajaran API Tests');

await test('GET /api/tahun-ajaran - should return tahun ajaran list', async () => {
  const res = await request('GET', '/tahun-ajaran');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Response should be an array');
});

await test('GET /api/tahun-ajaran/active - should return active tahun ajaran', async () => {
  const res = await request('GET', '/tahun-ajaran/active');
  assert(res.ok, `Expected 200, got ${res.status}`);
  assert(res.data.id, 'Should have active tahun ajaran');
});

// ============================================================================
// PRINT SUMMARY
// ============================================================================

printSummary();

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
