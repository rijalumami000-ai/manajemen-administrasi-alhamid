// Comprehensive Authentication API Tests
// Tests: Login, Logout, Get Profile, Change Password, User Management

const http = require('http');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Test state
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

let adminToken = '';
let guruToken = '';
let testUserId = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  testResults.total++;
  try {
    await testFn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    testResults.failed++;
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runAllTests() {
  console.log(`\n${colors.cyan}=== Authentication API Tests ===${colors.reset}\n`);

  // ===== AUTHENTICATION TESTS =====
  console.log(`${colors.yellow}Authentication Tests:${colors.reset}`);

  await runTest('POST /api/auth/login - Admin login success', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.user, 'Should return user');
    assert(res.data.accessToken, 'Should return accessToken');
    assert(res.data.refreshToken, 'Should return refreshToken');
    assertEqual(res.data.user.username, 'admin', 'Username should be admin');
    assertEqual(res.data.user.role, 'admin', 'Role should be admin');
    adminToken = res.data.accessToken;
  });

  await runTest('POST /api/auth/login - Guru login success', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      username: 'guru1',
      password: 'guru123'
    });
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.user, 'Should return user');
    assertEqual(res.data.user.role, 'guru', 'Role should be guru');
    guruToken = res.data.accessToken;
  });

  await runTest('POST /api/auth/login - Invalid credentials', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'wrongpassword'
    });
    assertEqual(res.status, 400, 'Status should be 400');
    assert(res.data.error, 'Should return error message');
  });

  await runTest('POST /api/auth/login - Missing fields', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      username: 'admin'
    });
    assertEqual(res.status, 400, 'Status should be 400');
    assert(res.data.error, 'Should return error message');
  });

  await runTest('GET /api/auth/me - Get current user', async () => {
    const res = await makeRequest('GET', '/api/auth/me', null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.user, 'Should return user');
    assertEqual(res.data.user.username, 'admin', 'Username should be admin');
  });

  await runTest('GET /api/auth/me - No token', async () => {
    const res = await makeRequest('GET', '/api/auth/me');
    assertEqual(res.status, 401, 'Status should be 401');
    assert(res.data.error, 'Should return error message');
  });

  // ===== USER MANAGEMENT TESTS (Admin only) =====
  console.log(`\n${colors.yellow}User Management Tests (Admin):${colors.reset}`);

  await runTest('GET /api/users - Get all users (Admin)', async () => {
    const res = await makeRequest('GET', '/api/users', null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assert(Array.isArray(res.data), 'Should return array');
    assert(res.data.length >= 3, 'Should have at least 3 users');
  });

  await runTest('GET /api/users - Forbidden for Guru', async () => {
    const res = await makeRequest('GET', '/api/users', null, guruToken);
    assertEqual(res.status, 403, 'Status should be 403');
    assert(res.data.error, 'Should return error message');
  });

  await runTest('POST /api/users - Create new user (Admin)', async () => {
    const res = await makeRequest('POST', '/api/users', {
      username: 'testuser',
      password: 'testpass123',
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'staff'
    }, adminToken);
    assertEqual(res.status, 201, 'Status should be 201');
    assert(res.data.id, 'Should return user with ID');
    assertEqual(res.data.username, 'testuser', 'Username should match');
    testUserId = res.data.id;
  });

  await runTest('POST /api/users - Duplicate username', async () => {
    const res = await makeRequest('POST', '/api/users', {
      username: 'testuser',
      password: 'testpass123',
      full_name: 'Test User 2',
      role: 'staff'
    }, adminToken);
    assertEqual(res.status, 409, 'Status should be 409');
    assert(res.data.error, 'Should return error message');
  });

  await runTest('GET /api/users/:id - Get user by ID (Admin)', async () => {
    const res = await makeRequest('GET', `/api/users/${testUserId}`, null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data.id, testUserId, 'ID should match');
    assertEqual(res.data.username, 'testuser', 'Username should match');
  });

  await runTest('PUT /api/users/:id - Update user (Admin)', async () => {
    const res = await makeRequest('PUT', `/api/users/${testUserId}`, {
      full_name: 'Updated Test User',
      phone: '081234567890'
    }, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data.full_name, 'Updated Test User', 'Name should be updated');
  });

  // ===== PROFILE MANAGEMENT TESTS =====
  console.log(`\n${colors.yellow}Profile Management Tests:${colors.reset}`);

  await runTest('GET /api/profile - Get own profile', async () => {
    const res = await makeRequest('GET', '/api/profile', null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data.username, 'admin', 'Username should be admin');
  });

  await runTest('PUT /api/profile - Update own profile', async () => {
    const res = await makeRequest('PUT', '/api/profile', {
      phone: '081234567890'
    }, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data.phone, '081234567890', 'Phone should be updated');
  });

  await runTest('POST /api/profile/change-password - Change password', async () => {
    const res = await makeRequest('POST', '/api/profile/change-password', {
      currentPassword: 'guru123',
      newPassword: 'newguru123'
    }, guruToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.message, 'Should return success message');
  });

  await runTest('POST /api/profile/change-password - Wrong current password', async () => {
    const res = await makeRequest('POST', '/api/profile/change-password', {
      currentPassword: 'wrongpassword',
      newPassword: 'newpass123'
    }, adminToken);
    assertEqual(res.status, 400, 'Status should be 400');
    assert(res.data.error, 'Should return error message');
  });

  // ===== CLEANUP TESTS =====
  console.log(`\n${colors.yellow}Cleanup Tests:${colors.reset}`);

  await runTest('DELETE /api/users/:id - Soft delete user (Admin)', async () => {
    const res = await makeRequest('DELETE', `/api/users/${testUserId}`, null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.message, 'Should return success message');
  });

  await runTest('POST /api/users/:id/activate - Activate user (Admin)', async () => {
    const res = await makeRequest('POST', `/api/users/${testUserId}/activate`, null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data.is_active, true, 'User should be active');
  });

  await runTest('DELETE /api/users/:id/hard - Hard delete user (Admin)', async () => {
    const res = await makeRequest('DELETE', `/api/users/${testUserId}/hard`, null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.message, 'Should return success message');
  });

  await runTest('POST /api/auth/logout - Logout', async () => {
    const res = await makeRequest('POST', '/api/auth/logout', null, adminToken);
    assertEqual(res.status, 200, 'Status should be 200');
    assert(res.data.message, 'Should return success message');
  });

  // ===== SUMMARY =====
  console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}`);
  console.log(`Total: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
