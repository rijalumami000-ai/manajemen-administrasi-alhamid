/**
 * API Performance Test
 * Tests API response times and caching effectiveness
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_ITERATIONS = 10;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Measure API response time
 */
async function measureResponseTime(url, description) {
  const start = Date.now();
  try {
    const response = await axios.get(url, {
      withCredentials: true,
      validateStatus: () => true, // Don't throw on any status
    });
    const end = Date.now();
    const duration = end - start;
    const cacheStatus = response.headers['x-cache'] || 'N/A';

    return {
      success: response.status === 200,
      duration,
      status: response.status,
      cacheStatus,
      description,
    };
  } catch (error) {
    const end = Date.now();
    return {
      success: false,
      duration: end - start,
      status: 'ERROR',
      cacheStatus: 'N/A',
      description,
      error: error.message,
    };
  }
}

/**
 * Test endpoint multiple times
 */
async function testEndpoint(url, description, iterations = TEST_ITERATIONS) {
  console.log(`\n${colors.cyan}Testing: ${description}${colors.reset}`);
  console.log(`${colors.gray}URL: ${url}${colors.reset}`);
  console.log(`${colors.gray}Iterations: ${iterations}${colors.reset}\n`);

  const results = [];

  for (let i = 0; i < iterations; i++) {
    const result = await measureResponseTime(url, description);
    results.push(result);

    const statusColor = result.success ? colors.green : colors.red;
    const cacheColor = result.cacheStatus === 'HIT' ? colors.green : colors.yellow;

    console.log(
      `  ${i + 1}. ${statusColor}${result.status}${colors.reset} | ` +
      `${result.duration}ms | ` +
      `Cache: ${cacheColor}${result.cacheStatus}${colors.reset}`
    );

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const successfulResults = results.filter(r => r.success);
  const durations = successfulResults.map(r => r.duration);
  const cacheHits = results.filter(r => r.cacheStatus === 'HIT').length;
  const cacheMisses = results.filter(r => r.cacheStatus === 'MISS').length;

  if (durations.length === 0) {
    console.log(`\n${colors.red}❌ All requests failed${colors.reset}`);
    return null;
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const median = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)];

  console.log(`\n${colors.cyan}Statistics:${colors.reset}`);
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Median:  ${median}ms`);
  console.log(`  Min:     ${min}ms`);
  console.log(`  Max:     ${max}ms`);
  console.log(`  Cache Hits:   ${cacheHits}/${iterations} (${((cacheHits/iterations)*100).toFixed(1)}%)`);
  console.log(`  Cache Misses: ${cacheMisses}/${iterations} (${((cacheMisses/iterations)*100).toFixed(1)}%)`);

  return {
    description,
    avg,
    median,
    min,
    max,
    cacheHits,
    cacheMisses,
    cacheHitRate: (cacheHits / iterations) * 100,
  };
}

/**
 * Main test runner
 */
async function runPerformanceTests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   API Performance Test Suite          ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.gray}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.gray}Iterations per endpoint: ${TEST_ITERATIONS}${colors.reset}`);

  const endpoints = [
    { url: `${BASE_URL}/api/summary`, description: 'Summary (Cached)' },
    { url: `${BASE_URL}/api/kelas`, description: 'Kelas List' },
    { url: `${BASE_URL}/api/kamar`, description: 'Kamar List' },
    { url: `${BASE_URL}/api/tahun-ajaran`, description: 'Tahun Ajaran List' },
    { url: `${BASE_URL}/api/mata-pelajaran`, description: 'Mata Pelajaran List' },
    { url: `${BASE_URL}/api/jabatan`, description: 'Jabatan List' },
  ];

  const allResults = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.url, endpoint.description);
    if (result) {
      allResults.push(result);
    }

    // Delay between different endpoints
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log(`\n\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Performance Summary                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  console.log('Endpoint                    | Avg (ms) | Median | Min | Max | Cache Hit Rate');
  console.log('─'.repeat(85));

  allResults.forEach(result => {
    const avgColor = result.avg < 100 ? colors.green : result.avg < 200 ? colors.yellow : colors.red;
    const cacheColor = result.cacheHitRate > 80 ? colors.green : result.cacheHitRate > 50 ? colors.yellow : colors.red;

    console.log(
      `${result.description.padEnd(27)} | ` +
      `${avgColor}${result.avg.toFixed(1).padStart(8)}${colors.reset} | ` +
      `${String(result.median).padStart(6)} | ` +
      `${String(result.min).padStart(3)} | ` +
      `${String(result.max).padStart(3)} | ` +
      `${cacheColor}${result.cacheHitRate.toFixed(1).padStart(5)}%${colors.reset}`
    );
  });

  // Overall statistics
  const overallAvg = allResults.reduce((sum, r) => sum + r.avg, 0) / allResults.length;
  const overallCacheHitRate = allResults.reduce((sum, r) => sum + r.cacheHitRate, 0) / allResults.length;

  console.log('\n' + '─'.repeat(85));
  console.log(`Overall Average Response Time: ${overallAvg.toFixed(2)}ms`);
  console.log(`Overall Cache Hit Rate: ${overallCacheHitRate.toFixed(1)}%`);

  // Performance grades
  console.log(`\n${colors.cyan}Performance Grades:${colors.reset}`);

  const responseGrade = overallAvg < 100 ? 'A' : overallAvg < 200 ? 'B' : overallAvg < 300 ? 'C' : 'D';
  const responseColor = overallAvg < 100 ? colors.green : overallAvg < 200 ? colors.yellow : colors.red;
  console.log(`  Response Time: ${responseColor}${responseGrade}${colors.reset} (${overallAvg.toFixed(2)}ms)`);

  const cacheGrade = overallCacheHitRate > 80 ? 'A' : overallCacheHitRate > 60 ? 'B' : overallCacheHitRate > 40 ? 'C' : 'D';
  const cacheColor = overallCacheHitRate > 80 ? colors.green : overallCacheHitRate > 60 ? colors.yellow : colors.red;
  console.log(`  Cache Efficiency: ${cacheColor}${cacheGrade}${colors.reset} (${overallCacheHitRate.toFixed(1)}% hit rate)`);

  console.log(`\n${colors.cyan}Recommendations:${colors.reset}`);
  if (overallAvg > 200) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Consider optimizing database queries`);
    console.log(`  ${colors.yellow}⚠${colors.reset} Check database indexes`);
  }
  if (overallCacheHitRate < 60) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Increase cache TTL for static data`);
    console.log(`  ${colors.yellow}⚠${colors.reset} Review cache invalidation strategy`);
  }
  if (overallAvg < 100 && overallCacheHitRate > 80) {
    console.log(`  ${colors.green}✓${colors.reset} Excellent performance! Keep it up.`);
  }

  console.log('');
}

// Run tests
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log(`${colors.green}✓ Performance tests completed${colors.reset}\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`${colors.red}✗ Performance tests failed:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { measureResponseTime, testEndpoint };
