// Animal photo check: how every Gemini answer (and failure) is turned into valid / invalid / unavailable.
// Gemini is never called here; fetch is replaced with a fake.
const assert = require('assert');

process.env.GEMINI_API_KEY = 'test-key-not-real';
process.env.NODE_ENV = 'test'; // no waiting between the retries below
const { validateAnimalPhoto } = require('../src/services/imageValidationService');

const photo = { buffer: Buffer.from('fake-jpeg-bytes'), mimeType: 'image/jpeg' };
const originalFetch = global.fetch;

const geminiSays = (text) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

async function run() {
  console.log('--- RUNNING ANIMAL PHOTO CHECK TESTS ---\n');

  try {
    // 1. A real animal is accepted, and the photo is sent to Gemini as image data
    let sent = null;
    global.fetch = async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return geminiSays('{"realAnimal": true, "reason": "A dog standing on a street."}');
    };
    const valid = await validateAnimalPhoto(photo);
    assert.strictEqual(valid.status, 'valid');
    const parts = sent.body.contents[0].parts;
    assert.strictEqual(parts[1].inlineData.mimeType, 'image/jpeg');
    assert.strictEqual(parts[1].inlineData.data, photo.buffer.toString('base64'), 'the photo itself is sent');
    assert.ok(!sent.url.includes('test-key-not-real'), 'the API key is not put in the URL');
    console.log('✔ real animal -> valid');

    // 2. Not an animal -> invalid, with Gemini's reason kept
    global.fetch = async () => geminiSays('{"realAnimal": false, "reason": "A close-up of a plate of food."}');
    const healthy = await validateAnimalPhoto(photo);
    assert.strictEqual(healthy.status, 'invalid');
    assert.strictEqual(healthy.reason, 'A close-up of a plate of food.');
    console.log('✔ random picture -> invalid');

    // 3. Only an explicit true counts: missing field, string "true", or wrapped in markdown fences
    for (const odd of ['{"reason": "no verdict"}', '{"realAnimal": "true"}', '{"realAnimal": null}']) {
      global.fetch = async () => geminiSays(odd);
      assert.strictEqual((await validateAnimalPhoto(photo)).status, 'invalid', `"${odd}" is not accepted`);
    }
    global.fetch = async () => geminiSays('```json\n{"realAnimal": true, "reason": "ok"}\n```');
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'valid', 'markdown fences are tolerated');
    console.log('✔ only an explicit true is accepted');

    // 3b. A real animal that is not an original photo is refused: AI-generated, stock / internet picture, or a screen
    const flags = (over) =>
      JSON.stringify({ realAnimal: true, aiGenerated: false, professionalOrWeb: false, screenOrPrint: false, reason: 'ok', ...over });

    global.fetch = async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return geminiSays(flags({}));
    };
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'valid', 'real animal, all other answers "no" -> valid');
    const prompt = sent.body.contents[0].parts[0].text;
    for (const question of ['realAnimal', 'aiGenerated', 'professionalOrWeb', 'screenOrPrint']) {
      assert.ok(prompt.includes(question), `the prompt asks about ${question}`);
    }

    for (const [flag, reason] of [
      ['aiGenerated', 'This picture looks AI-generated.'],
      ['professionalOrWeb', 'This is a professional stock photo.'],
      ['screenOrPrint', 'This is a photo of a computer screen.'],
    ]) {
      global.fetch = async () => geminiSays(flags({ [flag]: true, reason }));
      const refused = await validateAnimalPhoto(photo);
      assert.strictEqual(refused.status, 'invalid', `${flag} -> invalid even though an animal is visible`);
      assert.strictEqual(refused.reason, reason, 'the reason is passed on');
    }

    // Not an animal stays invalid whatever the other answers say
    global.fetch = async () => geminiSays(flags({ realAnimal: false, reason: 'A QR code.' }));
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'invalid');
    console.log('✔ AI-generated, stock/internet and screen pictures are refused even with an animal in them');

    // 4. Failures of the check itself are "unavailable", never "valid"
    global.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable', 'Gemini error');

    global.fetch = async () => {
      throw new TypeError('fetch failed');
    };
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable', 'network down');

    global.fetch = async () => geminiSays('this is not json');
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable', 'unreadable answer');

    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [] }) });
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable', 'empty answer');

    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }),
    });
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'invalid', 'blocked photo is not usable');
    console.log('✔ Gemini failures never let a photo through');

    // 4b. A brief outage is retried once, so a good photo is not refused just because Gemini was busy
    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      return calls === 1
        ? { ok: false, status: 503, json: async () => ({}) }
        : geminiSays('{"realAnimal": true, "reason": "A dog."}');
    };
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'valid', 'busy once, then fine');
    assert.strictEqual(calls, 2, 'it tried a second time');

    calls = 0;
    global.fetch = async () => {
      calls += 1;
      return { ok: false, status: 503, json: async () => ({}) };
    };
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable', 'still busy -> not accepted');
    assert.strictEqual(calls, 2, 'it gives up after one retry');

    calls = 0;
    global.fetch = async () => {
      calls += 1;
      const timeout = new Error('aborted');
      timeout.name = 'AbortError';
      throw timeout;
    };
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable', 'timeout');
    assert.strictEqual(calls, 2, 'a stuck request is dropped early and tried once more');

    // ...and when that second try answers, the photo is checked normally
    calls = 0;
    global.fetch = async () => {
      calls += 1;
      if (calls === 1) {
        const timeout = new Error('aborted');
        timeout.name = 'AbortError';
        throw timeout;
      }
      return geminiSays('{"realAnimal": true, "reason": "A bird."}');
    };
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'valid', 'slow once, then fine');
    assert.strictEqual(calls, 2);

    calls = 0;
    global.fetch = async () => {
      calls += 1;
      return { ok: false, status: 400, json: async () => ({}) };
    };
    await validateAnimalPhoto(photo);
    assert.strictEqual(calls, 1, 'a request error (400) is not retried');
    console.log('✔ a brief outage or a stuck request is retried once; real failures are not');

    // 4c. A request that never answers and ignores its time limit cannot hold the check forever
    {
      const realSetTimeout = global.setTimeout;
      // Make the 20 s overall deadline fire at once; leave the other timers alone
      global.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, ms === 20000 ? 5 : ms, ...rest);
      global.fetch = () => new Promise(() => {}); // never settles, does not even honour the abort signal
      try {
        const started = Date.now();
        const stuck = await validateAnimalPhoto(photo);
        assert.strictEqual(stuck.status, 'unavailable', 'a hung check ends as unavailable');
        assert.ok(Date.now() - started < 2000, 'it does not wait for the hung request');
      } finally {
        global.setTimeout = realSetTimeout;
      }
    }
    console.log('✔ a hung request is cut off by the overall deadline');

    // 5. Files Gemini cannot read, or empty files, are invalid without calling Gemini at all
    let called = false;
    global.fetch = async () => {
      called = true;
      return geminiSays('{"realAnimal": true}');
    };
    assert.strictEqual((await validateAnimalPhoto({ ...photo, mimeType: 'image/gif' })).status, 'invalid');
    assert.strictEqual((await validateAnimalPhoto({ ...photo, mimeType: 'application/pdf' })).status, 'invalid');
    assert.strictEqual((await validateAnimalPhoto({ buffer: Buffer.alloc(0), mimeType: 'image/png' })).status, 'invalid');
    assert.strictEqual(called, false, 'unsupported or empty files are rejected before any request');
    console.log('✔ unsupported / empty files -> invalid');

    // 6. No API key -> unavailable (not accepted)
    delete process.env.GEMINI_API_KEY;
    assert.strictEqual((await validateAnimalPhoto(photo)).status, 'unavailable');
    console.log('✔ no API key -> unavailable');

    console.log('\n✅ ALL PHOTO CHECK TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    global.fetch = originalFetch;
  }
}

run().catch((err) => {
  console.error('❌ Photo check test failed:', err);
  process.exit(1);
});
