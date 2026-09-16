const assert = require('assert');
const { calculateDistance } = require('../src/utils/distance');
const { calculateScore, rankRescuers } = require('../src/services/dispatchService');

console.log('--- RUNNING SMART DISPATCH SCORING TEST ---\n');

// 1. Test Distance Calculation
const dist = calculateDistance(12.9750, 77.6400, 12.9784, 77.6408);
console.log(`Distance test: (12.9750, 77.6400) to (12.9784, 77.6408) = ${dist} km`);
assert(dist > 0.3 && dist < 1.5, 'Distance calculation should be realistic (~0.39 - 1.1km)');

// 2. Setup Case & Test Rescuers
const caseLocation = { latitude: 12.9750, longitude: 77.6400 };
const animalType = 'dog';

const rescuerA = {
  name: 'Rescuer A (1.1km, handles dog, available)',
  location: { latitude: 12.9830, longitude: 77.6460 },
  animalsHandled: ['dog', 'cat'],
  available: true,
  activeCaseId: null,
  responseRate: 0.9,
};

const rescuerB = {
  name: 'Rescuer B (0.46km, handles bird only, available)',
  location: { latitude: 12.9780, longitude: 77.6425 },
  animalsHandled: ['bird'],
  available: true,
  activeCaseId: null,
  responseRate: 0.8,
};

const rescuerC = {
  name: 'Rescuer C (0.06km, handles dog, but busy)',
  location: { latitude: 12.9754, longitude: 77.6404 },
  animalsHandled: ['dog', 'cat'],
  available: false,
  activeCaseId: 'some-active-id',
  responseRate: 0.95,
};

const rescuerD = {
  name: 'Rescuer D (41km, handles dog, available)',
  location: { latitude: 12.6050, longitude: 77.6400 },
  animalsHandled: ['dog'],
  available: true,
  activeCaseId: null,
  responseRate: 0.85,
};

const scoredA = calculateScore(rescuerA, caseLocation, animalType);
const scoredB = calculateScore(rescuerB, caseLocation, animalType);
const scoredC = calculateScore(rescuerC, caseLocation, animalType);
const scoredD = calculateScore(rescuerD, caseLocation, animalType);

console.log(`\nCandidate Scores for Injured Dog Emergency:`);
console.log(`Rescuer A -> Distance: ${scoredA.distance}km | Score: ${scoredA.totalScore} | Breakdown:`, scoredA.breakdown);
console.log(`Rescuer B -> Distance: ${scoredB.distance}km | Score: ${scoredB.totalScore} | Breakdown:`, scoredB.breakdown);
console.log(`Rescuer C -> Distance: ${scoredC.distance}km | Score: ${scoredC.totalScore} | Breakdown:`, scoredC.breakdown);
console.log(`Rescuer D -> Distance: ${scoredD.distance}km | Score: ${scoredD.totalScore} | Breakdown:`, scoredD.breakdown);

// Verify Ranking
const ranked = rankRescuers([rescuerB, rescuerC, rescuerA, rescuerD], caseLocation, animalType);
console.log(`\n🏆 Winner Selected by Algorithm: ${ranked[0].rescuer.name} (Score: ${ranked[0].totalScore})`);

assert.strictEqual(ranked[0].rescuer.name, rescuerA.name, 'Rescuer A should be ranked #1');
assert(scoredA.totalScore > scoredB.totalScore, 'Rescuer A score should be higher than B');
assert(scoredA.totalScore > scoredC.totalScore, 'Rescuer A score should be higher than C');
assert(scoredA.totalScore > scoredD.totalScore, 'Rescuer A score should be higher than D');

console.log('\n✅ ALL DISPATCH TESTS PASSED SUCCESSFULLY!\n');
