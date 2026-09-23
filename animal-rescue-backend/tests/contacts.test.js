const assert = require('assert');
const EMERGENCY_CONTACTS = require('../src/data/emergencyContacts');

console.log('--- RUNNING EMERGENCY CONTACTS DIRECTORY TESTS ---\n');

assert(Array.isArray(EMERGENCY_CONTACTS), 'Contacts should be an array');
assert(EMERGENCY_CONTACTS.length >= 7, 'Should have at least 7 verified Bengaluru emergency rescue contacts');

// Check Govt 1962 helpline
const gov1962 = EMERGENCY_CONTACTS.find((c) => c.phone === '1962');
console.log('Govt Helpline Found:', gov1962.name, '->', gov1962.phone);
assert(gov1962, '1962 Animal Helpline must be listed');

// Check CUPA
const cupa = EMERGENCY_CONTACTS.find((c) => c.id === 'cupa-rescue');
console.log('CUPA Found:', cupa.name, '->', cupa.phone);
assert(cupa, 'CUPA must be listed');

// Check CARE
const care = EMERGENCY_CONTACTS.find((c) => c.id === 'care-bangalore');
console.log('CARE Found:', care.name, '->', care.phone);
assert(care, 'CARE must be listed');

// Check 24x7 hospital
const cessna = EMERGENCY_CONTACTS.find((c) => c.id === 'cessna-247');
console.log('Cessna 24x7 Found:', cessna.name, '->', cessna.timing);
assert(cessna, 'Cessna 24x7 hospital must be listed');

console.log('\n✅ ALL EMERGENCY CONTACTS TESTS PASSED SUCCESSFULLY!\n');
