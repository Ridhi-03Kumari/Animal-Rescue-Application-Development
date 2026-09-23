const assert = require('assert');
const { assessUrgency, getRuleBasedFallback } = require('../src/services/aiTriageService');

async function runAiTriageTests() {
  console.log('--- RUNNING AI URGENCY TRIAGE TESTS ---\n');

  // Test 1: High Urgency Case (Bleeding, accident)
  const highCase = await assessUrgency({
    animalType: 'dog',
    description: 'Dog hit by car on Indiranagar 100ft road, severe bleeding and broken leg, cannot stand up',
  });
  console.log('Test 1 (Severe Injury):', highCase);
  assert.strictEqual(highCase.urgency, 'HIGH', 'Urgency should be HIGH for severe bleeding/car accident');
  assert(highCase.guidance.length > 10, 'Guidance should provide actionable citizen safety instructions');
  assert(!highCase.guidance.toLowerCase().includes('paracetamol'), 'Guidance must NEVER recommend medication');

  // Test 2: Low Urgency Case (Minor scratch, walking fine)
  const lowCase = await assessUrgency({
    animalType: 'cat',
    description: 'Small scratch on ear, walking fine and alert near park bench',
  });
  console.log('Test 2 (Minor Scratch):', lowCase);
  assert.strictEqual(lowCase.urgency, 'LOW', 'Urgency should be LOW for minor scratch');

  // Test 3: Medium Urgency Fallback (Ambiguous/neutral description)
  const mediumCase = await assessUrgency({
    animalType: 'cow',
    description: 'Cow sitting near garbage bin, looks slightly tired and not moving fast',
  });
  console.log('Test 3 (Ambiguous/Moderate):', mediumCase);
  assert.strictEqual(mediumCase.urgency, 'MEDIUM', 'Urgency should default to MEDIUM for moderate cases');

  // Test 4: Rule-based fallback directly
  const fallback = getRuleBasedFallback('bird', 'Pigeon with broken wing, bleeding profusely');
  console.log('Test 4 (Fallback Direct):', fallback);
  assert.strictEqual(fallback.urgency, 'HIGH');
  assert.strictEqual(fallback.isFallback, true);
  assert.strictEqual(fallback.manualOverrideAllowed, true);

  console.log('\n✅ ALL AI TRIAGE TESTS PASSED SUCCESSFULLY!\n');
}

runAiTriageTests().catch((err) => {
  console.error('❌ AI Triage test failed:', err);
  process.exit(1);
});
