// Covers the in-memory (no MongoDB) mode: saving to disk, rescuer + coordinator endpoints,
// accept / decline edge cases and populated rescuer details.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

// Use a throwaway data file, with saving switched on, BEFORE the app loads the store
const dataFile = path.join(os.tmpdir(), `animal-rescue-test-${Date.now()}.json`);
process.env.DEV_STORE_FILE = dataFile;
process.env.DEV_STORE_PERSIST = 'true';

const app = require('../src/app');
const bcrypt = require('bcryptjs');
const { saveUser } = require('../src/utils/devStore');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let uploadedFile = null;

async function run() {
  console.log('===========================================================');
  console.log('💾 TESTING DEV STORE PERSISTENCE, RESCUER & COORDINATOR ROUTES');
  console.log('===========================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}/api/v1`;

  const call = async (method, url, body, token) => {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
    // --- auth + shared JWT secret
    const rescuerLogin = await call('POST', '/auth/login', { phone: '9845012345', password: 'password123' });
    assert.strictEqual(rescuerLogin.status, 200);
    const rescuerToken = rescuerLogin.json.token;

    // Public sign-up cannot create staff accounts
    const staffSignUp = await call('POST', '/auth/register', {
      name: 'Sneaky', phone: '9111111111', password: 'secret123', role: 'coordinator',
    });
    assert.strictEqual(staffSignUp.status, 400, 'nobody can sign up as a coordinator or admin');
    console.log('✔ sign-up only allows citizen and rescuer roles');

    // A coordinator account is created by the project team, so create one directly in the store
    const coordPhone = '9' + String(Date.now()).slice(-9);
    saveUser({ name: 'Coord', phone: coordPhone, passwordHash: bcrypt.hashSync('secret123', 10), role: 'coordinator' });
    const coordLogin = await call('POST', '/auth/login', { phone: coordPhone, password: 'secret123' });
    assert.strictEqual(coordLogin.status, 200);
    const coordToken = coordLogin.json.token;

    // --- rescuer endpoints (these used to hang for 10s and fail without MongoDB)
    const noToken = await call('GET', '/rescuers/profile');
    assert.strictEqual(noToken.status, 401, 'profile needs a token');

    const profile = await call('GET', '/rescuers/profile', null, rescuerToken);
    assert.strictEqual(profile.status, 200);
    assert.strictEqual(profile.json.rescuer.user.name, 'Rajesh Kumar', 'profile includes the user details');
    console.log('✔ rescuer profile loads with user details');

    const off = await call('PATCH', '/rescuers/availability', { available: false }, rescuerToken);
    assert.strictEqual(off.status, 200);
    assert.strictEqual(off.json.available, false);
    const profileAfter = await call('GET', '/rescuers/profile', null, rescuerToken);
    assert.strictEqual(profileAfter.json.rescuer.available, false, 'availability is remembered');
    const missing = await call('PATCH', '/rescuers/availability', {}, rescuerToken);
    assert.strictEqual(missing.status, 400);
    console.log('✔ availability toggle is saved and validated');

    const loc = await call('PATCH', '/rescuers/location', { latitude: 12.95, longitude: 77.6 }, rescuerToken);
    assert.strictEqual(loc.status, 200);
    assert.strictEqual(loc.json.location.latitude, 12.95);
    const badLoc = await call('PATCH', '/rescuers/location', { latitude: 'abc', longitude: 1 }, rescuerToken);
    assert.strictEqual(badLoc.status, 400);
    console.log('✔ location update works and rejects bad values');

    const publicList = await call('GET', '/rescuers?available=false');
    assert.strictEqual(publicList.status, 401, 'the rescuer list (with phone numbers) is not public');
    const list = await call('GET', '/rescuers?available=false', null, coordToken);
    assert.ok(list.json.rescuers.some((r) => r.organizationName.includes('Bengaluru Animal Rescue Squad')));
    console.log('✔ rescuer list filters by availability');

    // --- report -> accept -> complete
    const report = await call('POST', '/reports', {
      animalType: 'cat', description: 'Kitten on a roof', latitude: 12.93, longitude: 77.62,
      address: 'Koramangala, Bengaluru', reporterName: 'Test', reporterPhone: '9000000000',
    });
    assert.strictEqual(report.status, 201);
    const caseId = report.json.case._id;
    assert.strictEqual(report.json.case.location.address, 'Koramangala, Bengaluru', 'address is stored');

    const latest = await call('GET', '/cases', null, coordToken);
    assert.strictEqual(latest.json.cases[0]._id, caseId, 'newest case is listed first');
    console.log('✔ cases are listed newest first and keep their address');

    const ghost = await call('POST', '/dispatch/ffffffffffffffffffffffff/accept', {}, rescuerToken);
    assert.strictEqual(ghost.status, 404, 'accepting an unknown case is a 404');
    const ghostDecline = await call('POST', '/dispatch/ffffffffffffffffffffffff/decline', {}, rescuerToken);
    assert.strictEqual(ghostDecline.status, 404);

    const accept1 = await call('POST', `/dispatch/${caseId}/accept`, {}, rescuerToken);
    const accept2 = await call('POST', `/dispatch/${caseId}/accept`, {}, rescuerToken);
    assert.strictEqual(accept1.status, 200);
    assert.strictEqual(accept2.status, 200, 'accepting twice is harmless');
    const timelineAccepts = accept2.json.case.timeline.filter((t) => t.status === 'accepted').length;
    assert.strictEqual(timelineAccepts, 1, 'second accept does not duplicate the timeline');

    const tracked = await call('GET', `/cases/${caseId}`);
    assert.ok(
      tracked.json.case.assignedRescuer.organizationName,
      'citizen tracking sees the rescuer organisation, not just an id'
    );
    console.log('✔ accept/decline validate the case; rescuer details are filled in');

    const done1 = await call('PATCH', `/cases/${caseId}/status`, { status: 'completed', medicalNotes: 'ok' }, rescuerToken);
    const done2 = await call('PATCH', `/cases/${caseId}/status`, { status: 'completed' }, rescuerToken);
    assert.strictEqual(done1.status, 200);
    assert.strictEqual(done2.status, 200);
    assert.strictEqual(done1.json.animal._id, done2.json.animal._id, 'only one animal record per case');
    console.log('✔ completing a case twice keeps a single animal record');

    // --- coordinator routes
    const blocked = await call('GET', '/coordinator/stats', null, rescuerToken);
    assert.strictEqual(blocked.status, 403, 'rescuers cannot open the coordinator dashboard');
    const stats = await call('GET', '/coordinator/stats', null, coordToken);
    assert.strictEqual(stats.status, 200);
    assert.ok(stats.json.stats.totalCases >= 3 && stats.json.stats.completedRescues >= 1);
    const escalated = await call('GET', '/coordinator/cases', null, coordToken);
    assert.strictEqual(escalated.status, 200);
    const demoRescuerId = profile.json.rescuer._id;
    const verify = await call('PATCH', `/coordinator/rescuers/${demoRescuerId}/verify`, { verificationStatus: 'approved' }, coordToken);
    assert.strictEqual(verify.status, 200);
    const second = await call('POST', '/reports', {
      animalType: 'dog', latitude: 12.97, longitude: 77.59, reporterName: 'T', reporterPhone: '1',
    });
    const assign = await call('POST', `/coordinator/cases/${second.json.case._id}/assign`, { rescuerId: demoRescuerId }, coordToken);
    assert.strictEqual(assign.status, 200);
    assert.strictEqual(assign.json.case.status, 'assigned');
    console.log('✔ coordinator stats, escalations, verification and manual assignment work');

    // --- one report form never creates two cases (double tap, retry after a timeout)
    const formKey = `test-form-${Date.now()}`;
    const dupBody = { animalType: 'dog', latitude: 12.95, longitude: 77.6, description: 'Duplicate check', clientRequestId: formKey };
    const [d1, d2] = await Promise.all([call('POST', '/reports', dupBody), call('POST', '/reports', dupBody)]);
    const d3 = await call('POST', '/reports', dupBody);
    assert.deepStrictEqual([d1.status, d2.status].sort(), [200, 201], 'one request creates the case, the other gets it back');
    assert.strictEqual(new Set([d1.json.case._id, d2.json.case._id, d3.json.case._id]).size, 1, 'all three are the same case');
    assert.strictEqual(d3.json.duplicate, true);
    const withKey = (await call('GET', '/cases', null, coordToken)).json.cases.filter((c) => c.clientRequestId === formKey);
    assert.strictEqual(withKey.length, 1, 'only one case was stored');
    const otherKey = await call('POST', '/reports', { ...dupBody, clientRequestId: `${formKey}-again` });
    assert.strictEqual(otherKey.status, 201, 'a new form (new key) is a new report');
    console.log('✔ a report sent twice creates only one case');

    // --- an older app build sends no form key at all: the same sender, animal, text and place is the same report
    const keyless = {
      animalType: 'cat', description: 'No key sent', latitude: 12.91, longitude: 77.58,
      reporterName: 'Old App', reporterPhone: '9000000011',
    };
    const [k1, k2] = await Promise.all([call('POST', '/reports', keyless), call('POST', '/reports', keyless)]);
    const k3 = await call('POST', '/reports', keyless);
    assert.deepStrictEqual([k1.status, k2.status].sort(), [200, 201], 'one request creates the case, the other gets it back');
    assert.strictEqual(new Set([k1.json.case._id, k2.json.case._id, k3.json.case._id]).size, 1, 'all three are the same case');
    assert.strictEqual(k3.json.duplicate, true);
    const nearby = await call('POST', '/reports', { ...keyless, latitude: 12.9102 }); // about 22 m away
    assert.strictEqual(nearby.json.case._id, k1.json.case._id, 'a few metres away is still the same report');
    const sameSender = (await call('GET', '/cases', null, coordToken)).json.cases.filter(
      (c) => c.reporterPhone === keyless.reporterPhone
    );
    assert.strictEqual(sameSender.length, 1, 'only one case was stored');
    const differentText = await call('POST', '/reports', { ...keyless, description: 'A different animal' });
    const farAway = await call('POST', '/reports', { ...keyless, latitude: 12.95 });
    const otherSender = await call('POST', '/reports', { ...keyless, reporterPhone: '9000000012' });
    assert.deepStrictEqual(
      [differentText.status, farAway.status, otherSender.status],
      [201, 201, 201],
      'different text, place or sender is a new report'
    );
    console.log('✔ a report with no form key is still not stored twice');

    // --- citizen side vs rescuer side
    const dupCaseId = d3.json.case._id;
    const citPhone = '8' + String(Date.now()).slice(-9);
    const citReg = await call('POST', '/auth/register', { name: 'Citizen', phone: citPhone, password: 'secret123', role: 'citizen' });
    assert.strictEqual(citReg.status, 201);
    const citToken = citReg.json.token;
    const rescuerOnly = [
      ['GET', '/rescuers/profile'],
      ['PATCH', '/rescuers/availability'],
      ['GET', '/dispatch/nearby'],
      ['GET', '/dispatch/active'],
    ];
    for (const [method, url] of rescuerOnly) {
      const r = await call(method, url, method === 'PATCH' ? { available: true } : null, citToken);
      assert.strictEqual(r.status, 403, `${method} ${url} must be closed to a citizen`);
    }
    assert.strictEqual((await call('POST', `/dispatch/${dupCaseId}/accept`, {}, citToken)).status, 403, 'a citizen cannot accept');
    assert.strictEqual((await call('POST', `/dispatch/${dupCaseId}/accept`, {})).status, 401, 'a guest cannot accept');
    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'completed' }, citToken)).status, 403);
    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'completed' })).status, 401);
    assert.strictEqual((await call('GET', '/cases')).status, 401, 'the case list needs a login');

    const ownReport = await call('POST', '/reports', { animalType: 'cat', latitude: 12.9, longitude: 77.6 }, citToken);
    const citList = await call('GET', '/cases', null, citToken);
    const idOf = (v) => String(v && v._id ? v._id : v);
    assert.ok(citList.json.cases.length >= 1, 'a citizen sees their own report');
    assert.ok(citList.json.cases.every((c) => idOf(c.citizen) === citReg.json.id), 'a citizen sees only their own reports');
    assert.ok(citList.json.cases.some((c) => c._id === ownReport.json.case._id));
    console.log('✔ citizens cannot use rescuer features and only see their own reports');

    // --- rescuer rules: own cases only, moving forward only, one rescue at a time
    const rescuer2Phone = '7' + String(Date.now()).slice(-9);
    const rescuer2 = await call('POST', '/auth/register', { name: 'Second Rescuer', phone: rescuer2Phone, password: 'secret123', role: 'rescuer' });
    assert.strictEqual(rescuer2.status, 201);
    const token2 = rescuer2.json.token;

    const alerts = await call('GET', '/dispatch/nearby', null, rescuerToken);
    assert.ok(alerts.json.cases.some((c) => c._id === second.json.case._id), 'a rescuer sees the case assigned to them');
    assert.ok(alerts.json.cases.some((c) => c._id === dupCaseId), 'and open cases nobody has taken');
    const alerts2 = await call('GET', '/dispatch/nearby', null, token2);
    assert.ok(!alerts2.json.cases.some((c) => c._id === second.json.case._id), 'but not a case assigned to someone else');

    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'on_the_way' }, rescuerToken)).status, 403, 'cannot update a case that is not yours');
    assert.strictEqual((await call('POST', `/dispatch/${dupCaseId}/accept`, {}, rescuerToken)).status, 200);
    assert.strictEqual((await call('POST', `/dispatch/${dupCaseId}/accept`, {}, token2)).status, 409, 'cannot take a case another rescuer accepted');
    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'on_the_way' }, token2)).status, 403);
    assert.strictEqual((await call('POST', `/dispatch/${second.json.case._id}/accept`, {}, rescuerToken)).status, 409, 'one rescue at a time');
    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'accepted' }, rescuerToken)).status, 400, 'accepting only happens through Accept');
    const active = await call('GET', '/dispatch/active', null, rescuerToken);
    assert.strictEqual(active.json.activeCase._id, dupCaseId, 'the active case is the one just accepted');

    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'reached_location' }, rescuerToken)).status, 200);
    const back = await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'on_the_way' }, rescuerToken);
    assert.strictEqual(back.status, 409, 'a case cannot go backwards');
    const again = await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'reached_location' }, rescuerToken);
    assert.strictEqual(again.status, 200);
    assert.strictEqual(again.json.case.timeline.filter((t) => t.status === 'reached_location').length, 1, 'a repeat tap adds no second timeline entry');
    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'cancelled' }, rescuerToken)).status, 200);
    assert.strictEqual((await call('PATCH', `/cases/${dupCaseId}/status`, { status: 'on_the_way' }, rescuerToken)).status, 409, 'a closed case stays closed');
    const afterCancel = await call('GET', '/rescuers/profile', null, rescuerToken);
    assert.strictEqual(afterCancel.json.rescuer.available, true, 'the rescuer is free again');

    const rescuerCases = await call('GET', '/cases', null, rescuerToken);
    assert.ok(rescuerCases.json.cases.length >= 2 && rescuerCases.json.cases.every((c) => idOf(c.assignedRescuer) === demoRescuerId), 'a rescuer only lists their own cases');
    console.log('✔ rescuer rules: own cases only, forward only, one rescue at a time');

    // --- animal records + photo upload
    const animalId = done1.json.animal._id;
    const animals = await call('GET', '/animals?status=in_treatment');
    assert.ok(animals.json.animals.some((a) => a._id === animalId), 'animal list is not empty in demo mode');
    const noAuth = await call('POST', '/animals', { caseId: caseId, animalType: 'dog', foundLocation: {} });
    assert.strictEqual(noAuth.status, 401, 'creating an animal needs a token');
    const adopted = await call('PATCH', `/animals/${animalId}`, { status: 'adopted' }, rescuerToken);
    assert.strictEqual(adopted.status, 200);
    assert.strictEqual(adopted.json.animal.status, 'adopted');
    assert.strictEqual(adopted.json.animal.medicalNotes, 'ok', 'a partial update keeps the other fields');
    const badStatus = await call('PATCH', `/animals/${animalId}`, { status: 'flying' }, rescuerToken);
    assert.strictEqual(badStatus.status, 400);
    console.log('✔ animal list and partial updates work');

    // The animal-photo check calls Google Gemini, so the tests replace it with a fixed answer
    const imageValidation = require('../src/services/imageValidationService');
    let checkerAnswer = { status: 'valid' };
    imageValidation.validateAnimalPhoto = async () => checkerAnswer;

    const photoForm = (type = 'image/png', name = 'test.png') => {
      const form = new FormData();
      form.append('photo', new Blob([Buffer.from('fake-image-bytes')], { type }), name);
      return form;
    };
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const countUploads = () => (fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0);
    const filesBefore = countUploads();

    const up = await fetch(`${base}/upload`, { method: 'POST', body: photoForm() });
    const upJson = await up.json();
    assert.strictEqual(up.status, 201, 'a photo that passes the check is accepted');
    uploadedFile = upJson.filename;
    const served = await fetch(upJson.url);
    assert.strictEqual(served.status, 200, 'uploaded photo is served back');
    const noFile = await fetch(`${base}/upload`, { method: 'POST', body: new FormData() });
    assert.strictEqual(noFile.status, 400);
    console.log('✔ photo upload stores and serves a checked photo');

    // A photo that is not an animal is refused with "Invalid image" and is never stored
    checkerAnswer = { status: 'invalid', reason: 'This is a selfie.' };
    const rejected = await fetch(`${base}/upload`, { method: 'POST', body: photoForm() });
    const rejectedJson = await rejected.json();
    assert.strictEqual(rejected.status, 422, 'a photo that is not an animal is rejected');
    assert.strictEqual(rejectedJson.code, 'INVALID_IMAGE');
    assert.ok(/invalid image/i.test(rejectedJson.error), 'the message says the image is invalid');
    assert.strictEqual(rejectedJson.reason, 'This is a selfie.', 'the reason is passed on to the app');

    // If the check cannot run, the photo is NOT let through
    checkerAnswer = { status: 'unavailable', reason: 'timeout' };
    const unchecked = await fetch(`${base}/upload`, { method: 'POST', body: photoForm() });
    const uncheckedJson = await unchecked.json();
    assert.strictEqual(unchecked.status, 503, 'an unchecked photo is not accepted');
    assert.strictEqual(uncheckedJson.code, 'IMAGE_CHECK_UNAVAILABLE');

    // A file that is not an image at all never reaches the check
    checkerAnswer = { status: 'valid' };
    const notImage = await fetch(`${base}/upload`, { method: 'POST', body: photoForm('application/pdf', 'doc.pdf') });
    assert.strictEqual(notImage.status, 400, 'a non-image file is rejected');
    assert.strictEqual((await notImage.json()).code, 'INVALID_IMAGE');

    assert.strictEqual(countUploads(), filesBefore + 1, 'rejected and unchecked photos are never stored; only the accepted one is');
    console.log('✔ non-animal, unchecked and non-image uploads are rejected and not stored');

    // A report can only carry a photo that passed the check
    const reportBase = { animalType: 'dog', latitude: 12.93, longitude: 77.61, reporterPhone: '9000000099' };
    const withChecked = await call('POST', '/reports', {
      ...reportBase, photoUrl: upJson.url, clientRequestId: 'photo-ok-1',
    });
    assert.strictEqual(withChecked.status, 201, 'a report with a checked photo is accepted');
    assert.strictEqual(withChecked.json.case.photoUrl, upJson.url);
    const withoutPhoto = await call('POST', '/reports', { ...reportBase, clientRequestId: 'photo-none-1' });
    assert.strictEqual(withoutPhoto.status, 201, 'a report with no photo is still accepted (emergency, nothing to attach)');
    for (const [label, bad] of [
      ['a file path on the phone', 'file:///data/user/0/cache/ImagePicker/gallery.jpg'],
      ['a link to another website', 'https://example.com/uploads/animal-1-2.jpg'],
      ['another website using the real file name', upJson.url.replace(/^http:\/\/[^/]+/, 'https://example.com')],
      ['an upload that does not exist', upJson.url.replace(upJson.filename, 'animal-1-2.jpg')],
      ['a path trick', `${base.replace('/api/v1', '')}/uploads/../../package.json`],
      ['a fake Cloudinary link', 'https://res.cloudinary.com/someone/image/upload/v1/animal_rescue/reports/rescue-1-2.jpg'],
    ]) {
      const res = await call('POST', '/reports', { ...reportBase, photoUrl: bad, clientRequestId: `photo-bad-${label}` });
      assert.strictEqual(res.status, 400, `${label} is rejected`);
      assert.strictEqual(res.json.code, 'INVALID_IMAGE');
    }
    console.log('✔ reports only accept photos that passed the animal-photo check');

    // --- clean errors
    const unknown = await call('GET', '/nothing-here');
    assert.strictEqual(unknown.status, 404);
    assert.ok(unknown.json.error.includes('Route not found'));
    const badJson = await fetch(`${base}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
    assert.strictEqual(badJson.status, 400);
    console.log('✔ unknown routes and malformed JSON return clean JSON errors');

    // --- persistence: a brand new process must see the same data
    // (completing a case above freed the rescuer, so mark them busy again for this check)
    await call('PATCH', '/rescuers/availability', { available: false }, rescuerToken);
    await sleep(700); // saving is debounced
    assert.ok(fs.existsSync(dataFile), 'data file was written');
    const reloaded = JSON.parse(
      execFileSync(
        process.execPath,
        [
          '-e',
          `process.env.DEV_STORE_FILE=${JSON.stringify(dataFile)};process.env.DEV_STORE_PERSIST='true';` +
            `const s=require(${JSON.stringify(path.join(__dirname, '..', 'src', 'utils', 'devStore'))});` +
            `const c=s.getCase(${JSON.stringify(caseId)});` +
            `const r=s.getRescuerByUserId('66f001122334455667788992');` +
            `console.log(JSON.stringify({status:c&&c.status,created:c&&(c.createdAt instanceof Date),` +
            `animal:!!s.getAnimalByCaseId(${JSON.stringify(caseId)}),available:r&&r.available,` +
            `users:s.usersMap.size}));`,
        ],
        { encoding: 'utf8' }
      )
        .trim()
        .split('\n')
        .pop()
    );
    assert.strictEqual(reloaded.status, 'completed', 'case survives a restart');
    assert.strictEqual(reloaded.created, true, 'dates are restored as Date objects');
    assert.strictEqual(reloaded.animal, true, 'animal record survives a restart');
    assert.strictEqual(reloaded.available, false, 'rescuer settings survive a restart');
    assert.ok(reloaded.users >= 3, 'accounts survive a restart');
    console.log('✔ cases, animals, accounts and rescuer settings survive a restart');

    console.log('\n===========================================================');
    console.log('🎉 DEV STORE, RESCUER & COORDINATOR TESTS PASSED');
    console.log('===========================================================\n');
  } finally {
    server.close();
    if (uploadedFile) {
      try {
        fs.unlinkSync(path.join(__dirname, '..', 'public', 'uploads', uploadedFile));
      } catch (e) {
        /* already gone */
      }
    }
    [dataFile, `${dataFile}.tmp`].forEach((f) => {
      try {
        fs.unlinkSync(f);
      } catch (e) {
        /* already gone */
      }
    });
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err.message);
    console.error(err.stack);
    process.exit(1);
  });
