const assert = require('assert');
const { generateQrCode } = require('../src/controllers/animalController');

async function runQrTests() {
  console.log('--- RUNNING ANIMAL DIGITAL PROFILE & QR CODE TESTS ---\n');

  const mockAnimalId = '66f00112233445566778899a';
  const mockCaseId = '66f00112233445566778899b';

  const qrDataUrl = await generateQrCode(mockAnimalId, mockCaseId);

  console.log('Generated QR Data URL prefix:', qrDataUrl.substring(0, 45) + '...');
  assert(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Code should be a valid Base64 PNG data URL');
  assert(qrDataUrl.length > 500, 'QR Code image should have sufficient resolution');

  console.log('\n✅ ALL QR CODE & ANIMAL PROFILE TESTS PASSED SUCCESSFULLY!\n');
}

runQrTests().catch((err) => {
  console.error('❌ QR test failed:', err);
  process.exit(1);
});
