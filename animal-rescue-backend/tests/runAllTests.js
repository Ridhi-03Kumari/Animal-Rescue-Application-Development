const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'tests/auth.test.js',
  'tests/rateLimiter.test.js',
  'tests/dispatchScoring.test.js',
  'tests/aiTriage.test.js',
  'tests/imageValidation.test.js',
  'tests/animalsAndQR.test.js',
  'tests/contacts.test.js',
  'tests/devStoreAndRescuers.test.js',
  'tests/uploadPipeline.test.js',
  'tests/simulateEndToEnd.test.js',
];

console.log('====================================================');
console.log('🚀 RUNNING COMPLETE ANIMAL RESCUE BACKEND TEST SUITE');
console.log('====================================================\n');

let allPassed = true;

for (const testFile of tests) {
  try {
    const fullPath = path.join(__dirname, '..', testFile);
    console.log(`\n▶️ Executing: ${testFile}`);
    // Tests must not write the real dev data file (the persistence test opts back in with its own temp file)
    execSync(`node "${fullPath}"`, {
      stdio: 'inherit',
      env: { ...process.env, DEV_STORE_PERSIST: 'false' },
    });
  } catch (err) {
    console.error(`❌ Test failed in ${testFile}`);
    allPassed = false;
    process.exit(1);
  }
}

if (allPassed) {
  console.log('\n====================================================');
  console.log('🎉 ALL BACKEND COMPONENT TESTS PASSED WITH 100% SUCCESS');
  console.log('====================================================\n');
}
