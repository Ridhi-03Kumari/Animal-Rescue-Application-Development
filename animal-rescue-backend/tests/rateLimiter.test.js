const assert = require('assert');
const http = require('http');
const express = require('express');

// Step 1: Set environment variables before importing rate-limiter module
process.env.NODE_ENV = 'test';
process.env.TEST_AUTH_RATE_LIMIT = '2';

// Step 2: Import actual exported authLimiter
const { authLimiter } = require('../src/middleware/rateLimiter');

async function run() {
  console.log('===========================================================');
  console.log('🛡️ TESTING AUTHENTICATION RATE LIMITER (ISOLATED)');
  console.log('===========================================================\n');

  // Step 3: Start a small isolated Express test server
  const app = express();
  app.use(express.json());
  app.post('/api/v1/auth/rate-limit-test', authLimiter, (req, res) => {
    res.json({ success: true, message: 'allowed' });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const testUrl = `http://localhost:${server.address().port}/api/v1/auth/rate-limit-test`;

  try {
    // Step 4: Request 1 - should be allowed
    const res1 = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res1.status, 200, 'Request 1 must be allowed (HTTP 200)');
    assert.strictEqual(res1.headers.get('ratelimit-limit'), '2');
    assert.strictEqual(res1.headers.get('ratelimit-remaining'), '1');
    const body1 = await res1.json();
    assert.strictEqual(body1.success, true);
    console.log('✔ Request 1 allowed (HTTP 200, remaining: 1)');

    // Step 5: Request 2 - should be allowed
    const res2 = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res2.status, 200, 'Request 2 must be allowed (HTTP 200)');
    assert.strictEqual(res2.headers.get('ratelimit-limit'), '2');
    assert.strictEqual(res2.headers.get('ratelimit-remaining'), '0');
    const body2 = await res2.json();
    assert.strictEqual(body2.success, true);
    console.log('✔ Request 2 allowed (HTTP 200, remaining: 0)');

    // Step 6: Request 3 from same IP - must be rejected with HTTP 429
    const res3 = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res3.status, 429, 'Request 3 must be blocked with HTTP 429 (Too Many Requests)');
    assert.strictEqual(res3.headers.get('ratelimit-limit'), '2');
    assert.strictEqual(res3.headers.get('ratelimit-remaining'), '0');
    assert.ok(res3.headers.get('retry-after'), 'Response must include Retry-After header');
    const body3 = await res3.json();
    assert.strictEqual(
      body3.error,
      'Too many authentication attempts. Please try again after 15 minutes.'
    );
    console.log('✔ Request 3 blocked with HTTP 429 (Too Many Requests)');
    console.log('✔ Rate-limit headers verified (ratelimit-limit, ratelimit-remaining, retry-after)');

    console.log('\n===========================================================');
    console.log('🎉 RATE LIMITER ISOLATED TEST PASSED WITH 100% SUCCESS');
    console.log('===========================================================\n');
  } finally {
    // Step 7: Await server shutdown and clean up
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error('❌ Rate limiter test failed:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
