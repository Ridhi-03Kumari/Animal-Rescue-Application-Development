const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'tests/dispatchScoring.test.js',
  'tests/aiTriage.test.js',
  'tests/animalsAndQR.test.js',
  'tests/contacts.test.js',
];

console.log('====================================================');
console.log('🚀 RUNNING COMPLETE ANIMAL RESCUE BACKEND TEST SUITE');
console.log('====================================================\n');

let allPassed = true;

for (const testFile of tests) {
  try {
    const fullPath = path.join(__dirname, '..', testFile);
    console.log(`\n▶️ Executing: ${testFile}`);
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
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
