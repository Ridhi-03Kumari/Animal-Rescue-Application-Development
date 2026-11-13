const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Ensure isolated temp dev store file before requiring app/store
const dataFile = path.join(os.tmpdir(), `animal-rescue-auth-test-${Date.now()}.json`);
process.env.DEV_STORE_FILE = dataFile;
process.env.DEV_STORE_PERSIST = 'true';
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const { getUserByPhone, updateUser } = require('../src/utils/devStore');
const { JWT_SECRET, validateProductionSecret } = require('../src/config/jwt');

async function run() {
  console.log('===========================================================');
  console.log('🔐 TESTING AUTHENTICATION & PASSWORD RECOVERY (PAWSOS)');
  console.log('===========================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}/api/v1`;

  const call = async (method, url, body, token) => {
    const res = await fetch(base + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      /* non-JSON body */
    }
    return { status: res.status, json };
  };

  try {
    // =========================================================================
    // SECTION 1: REGISTRATION TESTS
    // =========================================================================
    console.log('--- SECTION 1: User Registration Tests ---');

    // 1. Register a citizen successfully
    const regCitizenRes = await call('POST', '/auth/register', {
      name: 'Aarav Patel',
      phone: '9811122233',
      password: 'citizenPassword123',
      role: 'citizen',
    });
    assert.strictEqual(regCitizenRes.status, 201, 'Citizen registration should return 201');
    assert.strictEqual(regCitizenRes.json.success, true);
    assert.strictEqual(regCitizenRes.json.role, 'citizen');
    assert.ok(regCitizenRes.json.token, 'Should return JWT token upon citizen registration');
    assert.strictEqual(regCitizenRes.json.user.name, 'Aarav Patel');
    assert.strictEqual(regCitizenRes.json.user.phone, '9811122233');
    console.log('✔ 1. Register a citizen successfully');

    // 2. Register a rescuer successfully
    const regRescuerRes = await call('POST', '/auth/register', {
      name: 'Priya Sharma',
      phone: '9822233344',
      password: 'rescuerPassword123',
      role: 'rescuer',
      organizationName: 'Safe Paws NGO',
      animalsHandled: ['dog', 'cat', 'bird'],
      location: { latitude: 12.9716, longitude: 77.5946 },
    });
    assert.strictEqual(regRescuerRes.status, 201, 'Rescuer registration should return 201');
    assert.strictEqual(regRescuerRes.json.success, true);
    assert.strictEqual(regRescuerRes.json.role, 'rescuer');
    assert.ok(regRescuerRes.json.token, 'Should return JWT token upon rescuer registration');
    assert.strictEqual(regRescuerRes.json.user.name, 'Priya Sharma');
    assert.strictEqual(regRescuerRes.json.user.organizationName, 'Safe Paws NGO');
    console.log('✔ 2. Register a rescuer successfully');

    // 3. Reject duplicate phone numbers
    const dupRes = await call('POST', '/auth/register', {
      name: 'Duplicate Aarav',
      phone: '9811122233',
      password: 'anotherPassword123',
      role: 'citizen',
    });
    assert.strictEqual(dupRes.status, 400, 'Duplicate phone should return 400');
    assert.ok(
      dupRes.json.error && dupRes.json.error.includes('already exists'),
      'Should mention that phone already exists'
    );
    console.log('✔ 3. Reject duplicate phone numbers');

    // 4. Reject unsupported roles such as coordinator and admin
    const coordRes = await call('POST', '/auth/register', {
      name: 'Coord Hacker',
      phone: '9833344455',
      password: 'password123',
      role: 'coordinator',
    });
    assert.strictEqual(coordRes.status, 400, 'Coordinator role registration must return 400');
    assert.ok(
      coordRes.json.error && coordRes.json.error.includes('role must be citizen or rescuer'),
      'Should reject coordinator role'
    );

    const adminRes = await call('POST', '/auth/register', {
      name: 'Admin Hacker',
      phone: '9844455566',
      password: 'password123',
      role: 'admin',
    });
    assert.strictEqual(adminRes.status, 400, 'Admin role registration must return 400');
    assert.ok(
      adminRes.json.error && adminRes.json.error.includes('role must be citizen or rescuer'),
      'Should reject admin role'
    );
    console.log('✔ 4. Reject unsupported roles such as coordinator and admin');

    // 5. Reject invalid registration input
    // Missing name
    const missingNameRes = await call('POST', '/auth/register', {
      phone: '9855566677',
      password: 'password123',
      role: 'citizen',
    });
    assert.strictEqual(missingNameRes.status, 400, 'Missing name must return 400');

    // Invalid phone format
    const invalidPhoneRes = await call('POST', '/auth/register', {
      name: 'Bad Phone User',
      phone: '12345',
      password: 'password123',
      role: 'citizen',
    });
    assert.strictEqual(invalidPhoneRes.status, 400, 'Invalid phone format must return 400');

    // Password below 6 characters
    const shortPassRes = await call('POST', '/auth/register', {
      name: 'Short Pass User',
      phone: '9866677788',
      password: '123',
      role: 'citizen',
    });
    assert.strictEqual(shortPassRes.status, 400, 'Short password (<6 chars) must return 400');
    console.log('✔ 5. Reject invalid registration input');

    // =========================================================================
    // SECTION 2: LOGIN TESTS
    // =========================================================================
    console.log('\n--- SECTION 2: User Login Tests ---');

    // 6. Login successfully with correct credentials
    const loginSuccessRes = await call('POST', '/auth/login', {
      phone: '9811122233',
      password: 'citizenPassword123',
    });
    assert.strictEqual(loginSuccessRes.status, 200, 'Login with correct credentials should return 200');
    assert.strictEqual(loginSuccessRes.json.success, true);
    assert.ok(loginSuccessRes.json.token, 'Login should return a JWT token');
    assert.strictEqual(loginSuccessRes.json.user.phone, '9811122233');
    assert.strictEqual(loginSuccessRes.json.user.role, 'citizen');
    console.log('✔ 6. Login successfully with correct credentials');

    // 7. Reject incorrect passwords
    const wrongPassRes = await call('POST', '/auth/login', {
      phone: '9811122233',
      password: 'wrongPassword999',
    });
    assert.strictEqual(wrongPassRes.status, 401, 'Wrong password must return 401');
    assert.strictEqual(wrongPassRes.json.error, 'Invalid phone or password');
    console.log('✔ 7. Reject incorrect passwords');

    // 8. Reject unknown phone numbers
    const unknownPhoneRes = await call('POST', '/auth/login', {
      phone: '9999900000',
      password: 'somePassword123',
    });
    assert.strictEqual(unknownPhoneRes.status, 401, 'Unknown phone number must return 401');
    assert.strictEqual(unknownPhoneRes.json.error, 'Invalid phone or password');
    console.log('✔ 8. Reject unknown phone numbers');

    // 9. Verify returned JWT contains correct user ID and role
    const citizenJwt = loginSuccessRes.json.token;
    const decodedCitizen = jwt.verify(citizenJwt, JWT_SECRET);
    assert.strictEqual(decodedCitizen.id, loginSuccessRes.json.user.id, 'JWT id must match user ID');
    assert.strictEqual(decodedCitizen.role, 'citizen', 'JWT role must match citizen');

    const rescuerLoginRes = await call('POST', '/auth/login', {
      phone: '9822233344',
      password: 'rescuerPassword123',
    });
    assert.strictEqual(rescuerLoginRes.status, 200);
    const decodedRescuer = jwt.verify(rescuerLoginRes.json.token, JWT_SECRET);
    assert.strictEqual(decodedRescuer.id, rescuerLoginRes.json.user.id, 'JWT id must match rescuer ID');
    assert.strictEqual(decodedRescuer.role, 'rescuer', 'JWT role must match rescuer');
    console.log('✔ 9. Verify returned JWT contains correct user ID and role');

    // =========================================================================
    // SECTION 3: FORGOT PASSWORD TESTS
    // =========================================================================
    console.log('\n--- SECTION 3: Forgot Password Tests ---');

    const beforeTokenGenTime = Date.now();

    // 10. Generate reset token for existing account
    const forgotRes = await call('POST', '/auth/forgot-password', {
      phone: '9811122233',
    });
    assert.strictEqual(forgotRes.status, 200, 'Forgot password for existing user should return 200');
    assert.strictEqual(forgotRes.json.success, true);
    assert.ok(forgotRes.json.resetToken, 'Should return resetToken in test environment');
    assert.strictEqual(typeof forgotRes.json.resetToken, 'string');
    assert.strictEqual(forgotRes.json.resetToken.length, 64, 'Raw token should be 64-char hex string (32 bytes)');
    const citizenResetToken = forgotRes.json.resetToken;
    console.log('✔ 10. Generate reset token for existing account');

    // 11. Verify raw token is returned only in dev/test mode (process.env.NODE_ENV !== 'production')
    process.env.NODE_ENV = 'production';
    try {
      const prodForgotRes = await call('POST', '/auth/forgot-password', {
        phone: '9822233344',
      });
      assert.strictEqual(prodForgotRes.status, 200);
      assert.strictEqual(prodForgotRes.json.success, true);
      assert.strictEqual(
        prodForgotRes.json.resetToken,
        undefined,
        'Raw reset token MUST NOT be exposed in production environment'
      );
    } finally {
      process.env.NODE_ENV = 'test';
    }
    console.log('✔ 11. Verify raw token is returned only in dev/test mode');

    // 12. Verify only the SHA-256 token hash is stored
    const citizenUser = getUserByPhone('9811122233');
    assert.ok(citizenUser, 'User should be found in store');
    assert.ok(citizenUser.resetPasswordTokenHash, 'Stored user must have resetPasswordTokenHash');
    assert.notStrictEqual(
      citizenUser.resetPasswordTokenHash,
      citizenResetToken,
      'Stored token hash must NOT equal raw token'
    );
    const expectedHash = crypto.createHash('sha256').update(citizenResetToken).digest('hex');
    assert.strictEqual(
      citizenUser.resetPasswordTokenHash,
      expectedHash,
      'Stored token hash must match SHA-256 hash of raw token'
    );
    console.log('✔ 12. Verify only the SHA-256 token hash is stored');

    // 13. Verify token expires after 15 minutes
    assert.ok(citizenUser.resetPasswordExpires, 'User must have resetPasswordExpires');
    const expiryTime = new Date(citizenUser.resetPasswordExpires).getTime();
    const durationMs = expiryTime - beforeTokenGenTime;
    const fifteenMinutesMs = 15 * 60 * 1000;
    // Allow up to 10 seconds delta for test execution
    assert.ok(
      Math.abs(durationMs - fifteenMinutesMs) < 10000,
      `Token expiry should be set 15 minutes in future (diff: ${durationMs - fifteenMinutesMs}ms)`
    );
    assert.ok(expiryTime > Date.now(), 'Token expiry must be in the future');
    console.log('✔ 13. Verify token expires after 15 minutes');

    // 14. Return generic response for unknown phone numbers (anti-enumeration)
    const unknownForgotRes = await call('POST', '/auth/forgot-password', {
      phone: '9899999999',
    });
    assert.strictEqual(unknownForgotRes.status, 200, 'Non-existent account should still return 200');
    assert.strictEqual(unknownForgotRes.json.success, true);
    assert.strictEqual(
      unknownForgotRes.json.message,
      'If an account exists with this phone number, a password reset token has been issued.'
    );
    assert.strictEqual(unknownForgotRes.json.resetToken, undefined, 'No token returned for unknown user');
    console.log('✔ 14. Return generic response for unknown phone numbers (anti-enumeration)');

    // 15. Verify repeated requests do not expose whether account exists
    // Test that for both existing and non-existing accounts, the response shape and message are identical
    process.env.NODE_ENV = 'production';
    try {
      const respExisting = await call('POST', '/auth/forgot-password', { phone: '9811122233' });
      const respNonExisting = await call('POST', '/auth/forgot-password', { phone: '9900011122' });
      assert.strictEqual(respExisting.status, respNonExisting.status);
      assert.strictEqual(respExisting.json.message, respNonExisting.json.message);
      assert.strictEqual(respExisting.json.resetToken, respNonExisting.json.resetToken);
    } finally {
      process.env.NODE_ENV = 'test';
    }
    console.log('✔ 15. Verify repeated requests do not expose whether account exists');

    // =========================================================================
    // SECTION 4: PASSWORD RESET TESTS
    // =========================================================================
    console.log('\n--- SECTION 4: Password Reset Tests ---');

    // 16. Successfully reset password using valid token
    // Issue a fresh token for rescuer
    const rescuerForgot = await call('POST', '/auth/forgot-password', { phone: '9822233344' });
    assert.strictEqual(rescuerForgot.status, 200);
    const validRescuerToken = rescuerForgot.json.resetToken;
    assert.ok(validRescuerToken, 'Rescuer reset token should be returned');

    const resetSuccessRes = await call('POST', '/auth/reset-password', {
      token: validRescuerToken,
      newPassword: 'newRescuerPassword456',
    });
    assert.strictEqual(resetSuccessRes.status, 200, 'Password reset with valid token should return 200');
    assert.strictEqual(resetSuccessRes.json.success, true);
    assert.ok(
      resetSuccessRes.json.message && resetSuccessRes.json.message.includes('Password has been reset successfully')
    );
    console.log('✔ 16. Successfully reset password using valid token');

    // 17. Reject invalid reset tokens
    const fakeToken = crypto.randomBytes(32).toString('hex');
    const invalidTokenRes = await call('POST', '/auth/reset-password', {
      token: fakeToken,
      newPassword: 'validPassword123',
    });
    assert.strictEqual(invalidTokenRes.status, 400, 'Invalid reset token must return 400');
    assert.ok(
      invalidTokenRes.json.error && invalidTokenRes.json.error.includes('invalid or has expired'),
      'Should report invalid or expired token'
    );
    console.log('✔ 17. Reject invalid reset tokens');

    // 18. Reject expired reset tokens
    // Issue token for citizen, then manipulate expiry time to the past
    const citizenForgotForExpiry = await call('POST', '/auth/forgot-password', { phone: '9811122233' });
    const expiredCandidateToken = citizenForgotForExpiry.json.resetToken;
    // Set expiry to 1 minute in the past
    updateUser('9811122233', { resetPasswordExpires: new Date(Date.now() - 60000) });

    const expiredTokenRes = await call('POST', '/auth/reset-password', {
      token: expiredCandidateToken,
      newPassword: 'newPassword123',
    });
    assert.strictEqual(expiredTokenRes.status, 400, 'Expired reset token must return 400');
    assert.ok(
      expiredTokenRes.json.error && expiredTokenRes.json.error.includes('invalid or has expired'),
      'Should report invalid or expired token'
    );
    console.log('✔ 18. Reject expired reset tokens');

    // 19. Reject missing tokens
    const missingTokenRes = await call('POST', '/auth/reset-password', {
      newPassword: 'newPassword123',
    });
    assert.strictEqual(missingTokenRes.status, 400, 'Missing token must return 400');
    assert.ok(
      missingTokenRes.json.error && missingTokenRes.json.error.includes('token'),
      'Should specify token is required'
    );
    console.log('✔ 19. Reject missing tokens');

    // 20. Reject missing passwords
    const missingPasswordRes = await call('POST', '/auth/reset-password', {
      token: 'someValidOrInvalidToken',
    });
    assert.strictEqual(missingPasswordRes.status, 400, 'Missing password must return 400');
    assert.ok(
      missingPasswordRes.json.error && missingPasswordRes.json.error.includes('newPassword'),
      'Should specify newPassword is required'
    );
    console.log('✔ 20. Reject missing passwords');

    // 21. Reject passwords below policy minimum (< 6 chars)
    // Issue a fresh token for citizen
    const citizenForgotPolicy = await call('POST', '/auth/forgot-password', { phone: '9811122233' });
    const policyToken = citizenForgotPolicy.json.resetToken;
    const shortPasswordRes = await call('POST', '/auth/reset-password', {
      token: policyToken,
      newPassword: '12345',
    });
    assert.strictEqual(shortPasswordRes.status, 400, 'Password < 6 chars must return 400');
    assert.ok(
      shortPasswordRes.json.error && shortPasswordRes.json.error.includes('at least 6 characters'),
      'Should state password must be at least 6 characters'
    );
    console.log('✔ 21. Reject passwords below policy minimum (< 6 chars)');

    // 22. Verify old password stops working after reset
    // Rescuer password was reset in test 16 from 'rescuerPassword123' to 'newRescuerPassword456'
    const oldPassRes = await call('POST', '/auth/login', {
      phone: '9822233344',
      password: 'rescuerPassword123',
    });
    assert.strictEqual(oldPassRes.status, 401, 'Old password must be rejected after reset');
    assert.strictEqual(oldPassRes.json.error, 'Invalid phone or password');
    console.log('✔ 22. Verify old password stops working after reset');

    // 23. Verify new password works
    const newPassRes = await call('POST', '/auth/login', {
      phone: '9822233344',
      password: 'newRescuerPassword456',
    });
    assert.strictEqual(newPassRes.status, 200, 'New password must be accepted after reset');
    assert.strictEqual(newPassRes.json.success, true);
    assert.ok(newPassRes.json.token, 'Should issue JWT token with new password');
    assert.strictEqual(newPassRes.json.user.phone, '9822233344');
    console.log('✔ 23. Verify new password works');

    // 24. Verify reset token cannot be reused
    const reuseTokenRes = await call('POST', '/auth/reset-password', {
      token: validRescuerToken,
      newPassword: 'anotherNewPassword789',
    });
    assert.strictEqual(reuseTokenRes.status, 400, 'Reusing an already-consumed token must return 400');
    assert.ok(
      reuseTokenRes.json.error && reuseTokenRes.json.error.includes('invalid or has expired'),
      'Reused token must be rejected'
    );
    console.log('✔ 24. Verify reset token cannot be reused');

    // 25. Verify token hash and expiry fields are cleared after successful reset
    const updatedRescuer = getUserByPhone('9822233344');
    assert.ok(updatedRescuer, 'Updated rescuer must exist in store');
    assert.strictEqual(
      updatedRescuer.resetPasswordTokenHash,
      null,
      'resetPasswordTokenHash must be cleared (null) after reset'
    );
    assert.strictEqual(
      updatedRescuer.resetPasswordExpires,
      null,
      'resetPasswordExpires must be cleared (null) after reset'
    );
    console.log('✔ 25. Verify token hash and expiry fields are cleared after successful reset');

    // =========================================================================
    // SECTION 5: MALFORMED INPUT TYPE & SECURITY HARDENING TESTS
    // =========================================================================
    console.log('\n--- SECTION 5: Malformed Input Type & Robustness Tests ---');

    // 26. Reject malformed phone values in registration (numeric, object, non-string)
    const numPhoneReg = await call('POST', '/auth/register', {
      name: 'Numeric Phone User',
      phone: 9811122233, // numeric instead of string
      password: 'password123',
      role: 'citizen',
    });
    assert.strictEqual(numPhoneReg.status, 400, 'Numeric phone in register must return 400');

    const objPhoneReg = await call('POST', '/auth/register', {
      name: 'Object Phone User',
      phone: { number: '9811122233' }, // object instead of string
      password: 'password123',
      role: 'citizen',
    });
    assert.strictEqual(objPhoneReg.status, 400, 'Object phone in register must return 400');
    console.log('✔ 26. Reject malformed phone values in registration (numeric, object)');

    // 27. Reject malformed and invalid phone values in forgot-password
    const numPhoneForgot = await call('POST', '/auth/forgot-password', {
      phone: 9811122233, // numeric
    });
    assert.strictEqual(numPhoneForgot.status, 400, 'Numeric phone in forgot-password must return 400');

    const objPhoneForgot = await call('POST', '/auth/forgot-password', {
      phone: { number: '9811122233' }, // object
    });
    assert.strictEqual(objPhoneForgot.status, 400, 'Object phone in forgot-password must return 400');

    const invalidFormatForgot = await call('POST', '/auth/forgot-password', {
      phone: '123', // too short, invalid format
    });
    assert.strictEqual(invalidFormatForgot.status, 400, 'Invalid phone format in forgot-password must return 400');
    assert.ok(
      invalidFormatForgot.json.error && invalidFormatForgot.json.error.includes('valid phone number'),
      'Should report invalid phone number format'
    );

    const nonNumericForgot = await call('POST', '/auth/forgot-password', {
      phone: 'abcdefghij', // alphabetic invalid phone
    });
    assert.strictEqual(nonNumericForgot.status, 400, 'Alphabetic phone in forgot-password must return 400');
    console.log('✔ 27. Reject malformed and invalid phone values in forgot-password');

    // 28. Reject malformed token types in reset-password (numeric, object, array, whitespace)
    const numTokenRes = await call('POST', '/auth/reset-password', {
      token: 12345678, // numeric token - must not crash with TypeError
      newPassword: 'validPassword123',
    });
    assert.strictEqual(numTokenRes.status, 400, 'Numeric token in reset-password must return 400');
    assert.ok(
      numTokenRes.json.error && numTokenRes.json.error.includes('token'),
      'Numeric token error must indicate token requirement'
    );

    const objTokenRes = await call('POST', '/auth/reset-password', {
      token: { token: 'abc' }, // object token
      newPassword: 'validPassword123',
    });
    assert.strictEqual(objTokenRes.status, 400, 'Object token in reset-password must return 400');

    const arrTokenRes = await call('POST', '/auth/reset-password', {
      token: ['tokenString123'], // array token
      newPassword: 'validPassword123',
    });
    assert.strictEqual(arrTokenRes.status, 400, 'Array token in reset-password must return 400');

    const wsTokenRes = await call('POST', '/auth/reset-password', {
      token: '      ', // whitespace-only token
      newPassword: 'validPassword123',
    });
    assert.strictEqual(wsTokenRes.status, 400, 'Whitespace-only token in reset-password must return 400');
    console.log('✔ 28. Reject malformed token types in reset-password (numeric, object, array, whitespace)');

    // 29. Reject malformed password types in login and reset-password
    const objPassLogin = await call('POST', '/auth/login', {
      phone: '9811122233',
      password: { pass: 'citizenPassword123' }, // object password
    });
    assert.strictEqual(objPassLogin.status, 400, 'Object password in login must return 400');

    const numPassLogin = await call('POST', '/auth/login', {
      phone: '9811122233',
      password: 123456, // numeric password
    });
    assert.strictEqual(numPassLogin.status, 400, 'Numeric password in login must return 400');

    // Issue a fresh token for citizen to test reset-password with malformed passwords
    const freshForgot = await call('POST', '/auth/forgot-password', { phone: '9811122233' });
    const freshToken = freshForgot.json.resetToken;

    const objPassReset = await call('POST', '/auth/reset-password', {
      token: freshToken,
      newPassword: { pass: 'newPassword123' }, // object newPassword
    });
    assert.strictEqual(objPassReset.status, 400, 'Object newPassword in reset-password must return 400');
    assert.ok(
      objPassReset.json.error && objPassReset.json.error.includes('newPassword'),
      'Must specify newPassword is required'
    );

    const numPassReset = await call('POST', '/auth/reset-password', {
      token: freshToken,
      newPassword: 123456, // numeric newPassword
    });
    assert.strictEqual(numPassReset.status, 400, 'Numeric newPassword in reset-password must return 400');

    const arrPassReset = await call('POST', '/auth/reset-password', {
      token: freshToken,
      newPassword: ['password123'], // array newPassword
    });
    assert.strictEqual(arrPassReset.status, 400, 'Array newPassword in reset-password must return 400');
    console.log('✔ 29. Reject malformed password types in login and reset-password');

    // 30. Genuine isolated rate-limiter test: verify 2 allowed, 3rd blocked with HTTP 429 & rate-limit headers
    {
      const express = require('express');
      // Set test rate limit to 2 and reload isolated authLimiter module
      process.env.TEST_AUTH_RATE_LIMIT = '2';
      delete require.cache[require.resolve('../src/middleware/rateLimiter')];
      const { authLimiter: isolatedLimiter } = require('../src/middleware/rateLimiter');

      const isolatedApp = express();
      isolatedApp.use(express.json());
      isolatedApp.post('/api/v1/auth/isolated-limit-test', isolatedLimiter, (req, res) => {
        res.json({ success: true, message: 'allowed' });
      });

      const isolatedServer = http.createServer(isolatedApp);
      await new Promise((resolve) => isolatedServer.listen(0, resolve));
      const isolatedUrl = `http://localhost:${isolatedServer.address().port}/api/v1/auth/isolated-limit-test`;

      try {
        // Request 1: allowed (200)
        const res1 = await fetch(isolatedUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        assert.strictEqual(res1.status, 200, 'Request 1 must be allowed (HTTP 200)');
        assert.strictEqual(res1.headers.get('ratelimit-limit'), '2');
        assert.strictEqual(res1.headers.get('ratelimit-remaining'), '1');

        // Request 2: allowed (200)
        const res2 = await fetch(isolatedUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        assert.strictEqual(res2.status, 200, 'Request 2 must be allowed (HTTP 200)');
        assert.strictEqual(res2.headers.get('ratelimit-limit'), '2');
        assert.strictEqual(res2.headers.get('ratelimit-remaining'), '0');

        // Request 3: blocked with HTTP 429
        const res3 = await fetch(isolatedUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        assert.strictEqual(res3.status, 429, 'Request 3 must be blocked with HTTP 429 (Too Many Requests)');
        assert.strictEqual(res3.headers.get('ratelimit-limit'), '2');
        assert.strictEqual(res3.headers.get('ratelimit-remaining'), '0');
        assert.ok(res3.headers.get('retry-after'), 'Response must include Retry-After header');
        const body3 = await res3.json();
        assert.strictEqual(
          body3.error,
          'Too many authentication attempts. Please try again after 15 minutes.'
        );
      } finally {
        await new Promise((resolve) => isolatedServer.close(resolve));
        delete process.env.TEST_AUTH_RATE_LIMIT;
        delete require.cache[require.resolve('../src/middleware/rateLimiter')];
      }
    }
    console.log('✔ 30. Verify rate limiting: 2 allowed, 3rd blocked with HTTP 429 and rate-limit headers');

    // 31. Reject null reset request body
    const nullBodyRes = await fetch(base + '/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'null',
    });
    assert.strictEqual(nullBodyRes.status, 400, 'Null request body must return HTTP 400');
    const nullBodyJson = await nullBodyRes.json();
    assert.ok(nullBodyJson.error, 'Must return error message for null body');
    console.log('✔ 31. Reject null reset request body');

    // 32. Reject array reset request body
    const arrBodyRes = await fetch(base + '/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '[]',
    });
    assert.strictEqual(arrBodyRes.status, 400, 'Array request body must return HTTP 400');
    const arrBodyJson = await arrBodyRes.json();
    assert.ok(arrBodyJson.error, 'Must return error message for array body');
    console.log('✔ 32. Reject array reset request body');

    // 33. Reject whitespace-only new password
    const wsForgot = await call('POST', '/auth/forgot-password', { phone: '9811122233' });
    const wsToken = wsForgot.json.resetToken;
    assert.ok(wsToken, 'Should receive token for whitespace password test');

    const wsPassRes = await call('POST', '/auth/reset-password', {
      token: wsToken,
      newPassword: '      ', // 6 spaces
    });
    assert.strictEqual(wsPassRes.status, 400, 'Whitespace-only password must return HTTP 400');
    assert.ok(
      wsPassRes.json.error && wsPassRes.json.error.toLowerCase().includes('whitespace'),
      'Must specify password cannot be only whitespace'
    );
    console.log('✔ 33. Reject whitespace-only new password');

    // 34. Concurrency: Two simultaneous reset attempts using the same token
    const concForgot = await call('POST', '/auth/forgot-password', { phone: '9811122233' });
    const concToken = concForgot.json.resetToken;
    assert.ok(concToken, 'Should receive token for concurrency test');

    // Launch two simultaneous reset attempts using the exact same token
    const [attemptA, attemptB] = await Promise.all([
      call('POST', '/auth/reset-password', {
        token: concToken,
        newPassword: 'concurrentPasswordA1',
      }),
      call('POST', '/auth/reset-password', {
        token: concToken,
        newPassword: 'concurrentPasswordB2',
      }),
    ]);

    // Exactly one simultaneous reset attempt succeeds
    const statuses = [attemptA.status, attemptB.status].sort();
    assert.deepStrictEqual(statuses, [200, 400], 'Exactly one attempt must return 200 and the other 400');

    const successAttempt = attemptA.status === 200 ? attemptA : attemptB;
    const failedAttempt = attemptA.status === 400 ? attemptA : attemptB;

    assert.strictEqual(successAttempt.json.success, true);
    assert.ok(
      failedAttempt.json.error && failedAttempt.json.error.includes('invalid or has expired'),
      'The second simultaneous attempt must receive invalid-or-expired token error'
    );

    // Verify: The new password works after the successful reset
    const winningPassword = attemptA.status === 200 ? 'concurrentPasswordA1' : 'concurrentPasswordB2';
    const losingPassword = attemptA.status === 200 ? 'concurrentPasswordB2' : 'concurrentPasswordA1';

    const loginWin = await call('POST', '/auth/login', {
      phone: '9811122233',
      password: winningPassword,
    });
    assert.strictEqual(loginWin.status, 200, 'Winning password must log in successfully');
    assert.strictEqual(loginWin.json.success, true);

    const loginLose = await call('POST', '/auth/login', {
      phone: '9811122233',
      password: losingPassword,
    });
    assert.strictEqual(loginLose.status, 401, 'Losing password must not work');

    // Verify: The consumed token cannot be reused
    const reuseAttempt = await call('POST', '/auth/reset-password', {
      token: concToken,
      newPassword: 'anotherAttemptPassword999',
    });
    assert.strictEqual(reuseAttempt.status, 400, 'Consumed token cannot be reused');
    assert.ok(
      reuseAttempt.json.error && reuseAttempt.json.error.includes('invalid or has expired'),
      'Reused token must be rejected'
    );
    console.log('✔ 34. Concurrency: exactly one simultaneous reset succeeds, the other receives 400, new password works, token cannot be reused');

    // =========================================================================
    // SECTION 6: ROLE NORMALIZATION & JWT SECRET SECURITY TESTS
    // =========================================================================
    console.log('\n--- SECTION 6: Role Normalization & JWT Security Tests ---');

    // 35. Normalize registration role with surrounding whitespace
    const wsCitizenReg = await call('POST', '/auth/register', {
      name: 'Whitespace Citizen',
      phone: '9877700011',
      password: 'password123',
      role: '   citizen   ',
    });
    assert.strictEqual(wsCitizenReg.status, 201, 'Registration with whitespace in citizen role should succeed');
    assert.strictEqual(wsCitizenReg.json.role, 'citizen', 'Response role must be trimmed');
    const storedWsCitizen = getUserByPhone('9877700011');
    assert.strictEqual(storedWsCitizen.role, 'citizen', 'Stored user role must be normalized/trimmed');

    const wsRescuerReg = await call('POST', '/auth/register', {
      name: 'Whitespace Rescuer',
      phone: '9877700022',
      password: 'password123',
      role: '   rescuer   ',
      organizationName: 'Paws Rescue',
      animalsHandled: ['dog'],
    });
    assert.strictEqual(wsRescuerReg.status, 201, 'Registration with whitespace in rescuer role should succeed');
    assert.strictEqual(wsRescuerReg.json.role, 'rescuer', 'Response role must be trimmed');
    const storedWsRescuer = getUserByPhone('9877700022');
    assert.strictEqual(storedWsRescuer.role, 'rescuer', 'Stored user role must be normalized/trimmed');
    console.log('✔ 35. Normalize registration role with surrounding whitespace');

    // 36. Production JWT secret hardening: reject missing, whitespace-only, short and weak secrets
    // Missing / null / undefined / empty
    assert.throws(
      () => validateProductionSecret(null),
      /JWT_SECRET environment variable is required in production/
    );
    assert.throws(
      () => validateProductionSecret(undefined),
      /JWT_SECRET environment variable is required in production/
    );
    assert.throws(
      () => validateProductionSecret(''),
      /JWT_SECRET environment variable is required in production/
    );

    // Whitespace-only
    assert.throws(
      () => validateProductionSecret('   '),
      /JWT_SECRET environment variable is required in production/
    );
    assert.throws(
      () => validateProductionSecret('                                '),
      /JWT_SECRET environment variable is required in production/
    );

    // Too short (< 32 characters)
    assert.throws(
      () => validateProductionSecret('short_secret_under_32_chars'),
      /too short for production/
    );
    assert.throws(
      () => validateProductionSecret('  short_padded_secret_too_short  '),
      /too short for production/
    );

    // Known weak / default placeholders
    assert.throws(
      () => validateProductionSecret('animal_rescue_dev_secret_key_2026'),
      /known weak\/default placeholder/
    );
    assert.throws(
      () => validateProductionSecret('   animal_rescue_dev_secret_key_2026   '),
      /known weak\/default placeholder/
    );
    assert.throws(
      () => validateProductionSecret('your_secret_key_here_at_least_32_characters_long'),
      /known weak\/default placeholder/
    );

    // Valid strong secret (>= 32 chars)
    const validProductionSecret = 'c0a801017f0000018a3f9e2b1d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d';
    assert.strictEqual(
      validateProductionSecret(validProductionSecret),
      validProductionSecret
    );
    assert.strictEqual(
      validateProductionSecret('   ' + validProductionSecret + '   '),
      validProductionSecret
    );

    // Never leak actual secret in thrown error message
    try {
      validateProductionSecret('animal_rescue_dev_secret_key_2026');
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.ok(
        !err.message.includes('animal_rescue_dev_secret_key_2026'),
        'Fatal error message must not expose the secret value'
      );
    }
    console.log('✔ 36. Production JWT secret hardening: reject missing, whitespace-only, short and weak secrets');

    console.log('\n===========================================================');
    console.log('🎉 ALL 36 AUTH, RECOVERY, ROLE & JWT TESTS PASSED (100%)');
    console.log('===========================================================\n');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    [dataFile, `${dataFile}.tmp`].forEach((f) => {
      try {
        fs.unlinkSync(f);
      } catch (e) {
        /* already gone */
      }
    });
  }
}

run().catch((err) => {
  console.error('❌ Auth test suite failed:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
