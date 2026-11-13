const assert = require('assert');
const path = require('path');
const upload = require('../src/middleware/upload');
const reportController = require('../src/controllers/reportController');
const { saveCase } = require('../src/utils/devStore');

async function runUploadPipelineTests() {
  console.log('--- RUNNING UPLOAD PIPELINE & ANDROID PHOTO VALIDATION TESTS ---\n');

  // Test 1: Standard file with valid .jpg extension and image/jpeg MIME
  await new Promise((resolve, reject) => {
    const file = { originalname: 'dog-injury.jpg', mimetype: 'image/jpeg' };
    upload.fileFilter({}, file, (err, accepted) => {
      if (err) return reject(new Error(`Test 1 Failed: ${err.message}`));
      assert.strictEqual(accepted, true, 'Valid JPEG file should be accepted');
      console.log('✅ Test 1 Passed: Standard JPEG image with extension accepted');
      resolve();
    });
  });

  // Test 2: Standard file with valid .png extension and image/png MIME
  await new Promise((resolve, reject) => {
    const file = { originalname: 'cat-rescue.png', mimetype: 'image/png' };
    upload.fileFilter({}, file, (err, accepted) => {
      if (err) return reject(new Error(`Test 2 Failed: ${err.message}`));
      assert.strictEqual(accepted, true, 'Valid PNG file should be accepted');
      console.log('✅ Test 2 Passed: Standard PNG image with extension accepted');
      resolve();
    });
  });

  // Test 3: Android ContentProvider URI filename without extension (e.g. "1000000034") with image/jpeg
  await new Promise((resolve, reject) => {
    const file = { originalname: '1000000034', mimetype: 'image/jpeg' };
    upload.fileFilter({}, file, (err, accepted) => {
      if (err) return reject(new Error(`Test 3 Failed: ${err.message}`));
      assert.strictEqual(accepted, true, 'Android extensionless JPEG should be accepted');
      assert.strictEqual(file.originalname, '1000000034.jpg', 'Android filename should be normalized with .jpg');
      console.log('✅ Test 3 Passed: Android extensionless filename normalized with .jpg extension');
      resolve();
    });
  });

  // Test 4: Android ContentProvider URI filename without extension with image/png
  await new Promise((resolve, reject) => {
    const file = { originalname: 'content_media_10029', mimetype: 'image/png' };
    upload.fileFilter({}, file, (err, accepted) => {
      if (err) return reject(new Error(`Test 4 Failed: ${err.message}`));
      assert.strictEqual(accepted, true, 'Android extensionless PNG should be accepted');
      assert.strictEqual(file.originalname, 'content_media_10029.png', 'Android filename should be normalized with .png');
      console.log('✅ Test 4 Passed: Android extensionless filename normalized with .png extension');
      resolve();
    });
  });

  // Test 5: Reject invalid MIME type (e.g. application/pdf)
  await new Promise((resolve) => {
    const file = { originalname: 'document.pdf', mimetype: 'application/pdf' };
    upload.fileFilter({}, file, (err, accepted) => {
      assert(err, 'Should reject invalid MIME type');
      assert(/Invalid MIME type/i.test(err.message), 'Error message should clearly state Invalid MIME type');
      console.log('✅ Test 5 Passed: Invalid MIME type rejected with descriptive error');
      resolve();
    });
  });

  // Test 6: Reject invalid extension (e.g. script.exe disguised as image/jpeg)
  await new Promise((resolve) => {
    const file = { originalname: 'exploit.exe', mimetype: 'image/jpeg' };
    upload.fileFilter({}, file, (err, accepted) => {
      assert(err, 'Should reject invalid file extension');
      assert(/Invalid file extension/i.test(err.message), 'Error message should clearly state Invalid file extension');
      console.log('✅ Test 6 Passed: Disguised executable extension rejected with descriptive error');
      resolve();
    });
  });

  // Test 7: Verify limits configuration (10MB limit and 1 file)
  assert.strictEqual(upload.limits.fileSize, 10 * 1024 * 1024, 'Multer limit must remain 10MB');
  assert.strictEqual(upload.limits.files, 1, 'Multer files limit must remain 1');
  console.log('✅ Test 7 Passed: Multer fileSize limit preserved at 10 MB and single file');

  // Test 8: End-to-end report creation with uploaded photo URL
  const mockPhotoUrl = 'https://res.cloudinary.com/animal-rescue/image/upload/v123456/rescue-test.jpg';
  const mockReq = {
    body: {
      animalType: 'dog',
      description: 'Injured puppy with verified photo URL',
      photoUrl: mockPhotoUrl,
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Bengaluru',
      reporterName: 'Android User',
      reporterPhone: '9876543210',
      clientRequestId: `test-upload-${Date.now()}`,
    },
    user: null,
  };

  let responseData = null;
  let responseStatusCode = null;
  const mockRes = {
    status: (code) => {
      responseStatusCode = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      return mockRes;
    },
  };

  await reportController.createReport(mockReq, mockRes, (err) => {
    if (err) throw err;
  });

  assert(responseStatusCode === 201 || responseStatusCode === 200, 'Report submission should succeed');
  assert.strictEqual(responseData.success, true, 'Report submission should return success');
  assert.strictEqual(responseData.case.photoUrl, mockPhotoUrl, 'Report case must store the photoUrl');
  console.log('✅ Test 8 Passed: Emergency report creation successfully stores uploaded photo URL');

  console.log('\n🎉 ALL 8 UPLOAD PIPELINE AND ANDROID PHOTO VALIDATION TESTS PASSED WITH 100% SUCCESS!\n');
}

runUploadPipelineTests().catch((err) => {
  console.error('❌ Upload pipeline test failed:', err);
  process.exit(1);
});
