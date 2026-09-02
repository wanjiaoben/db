import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import worker, { BEACON_SCRIPT } from '../src/worker.js';

test('beacon script stays small and posts visitor events', () => {
  assert.ok(Buffer.byteLength(BEACON_SCRIPT, 'utf8') < 4096);
  assert.match(BEACON_SCRIPT, /analytics\.nice\.okinawa\/events/);
  assert.doesNotMatch(BEACON_SCRIPT, /analytics\.nice\.okinawa\/collect/);
});

test('beacon script reads explicit data-site and does not infer site from hostname', () => {
  assert.match(BEACON_SCRIPT, /dataset&&s\.dataset\.site/);
  assert.match(BEACON_SCRIPT, /site_id:site/);
  assert.doesNotMatch(BEACON_SCRIPT, /location\.hostname/);
});

test('beacon script guards section_view once per section per session', () => {
  assert.match(BEACON_SCRIPT, /seen=new Set/);
  assert.match(BEACON_SCRIPT, /!seen\.has\(id\)/);
  assert.match(BEACON_SCRIPT, /seen\.add\(id\)/);
  assert.match(BEACON_SCRIPT, /section_view/);
});

test('beacon script keeps only UTM allowlist in landing_url', () => {
  assert.match(BEACON_SCRIPT, /utm_source/);
  assert.match(BEACON_SCRIPT, /utm_medium/);
  assert.match(BEACON_SCRIPT, /utm_campaign/);
  assert.match(BEACON_SCRIPT, /location\.pathname/);
});

test('beacon script writes first touch attribution for checkout reuse', () => {
  assert.match(BEACON_SCRIPT, /ftk='nice_ft'/);
  assert.match(BEACON_SCRIPT, /localStorage\.setItem\(ftk,j\)/);
  assert.match(BEACON_SCRIPT, /max-age=2592000/);
  assert.match(BEACON_SCRIPT, /first_seen/);
  assert.match(BEACON_SCRIPT, /ref_host/);
  assert.match(BEACON_SCRIPT, /landing:location\.pathname/);
});

test('beacon dwell uses text/plain to avoid CORS preflight', () => {
  assert.match(BEACON_SCRIPT, /new Blob\(\[body\],\{type:'text\/plain'\}\)/);
  assert.doesNotMatch(BEACON_SCRIPT, /sendBeacon\(ep,new Blob\(\[body\],\{type:'application\/json'\}\)\)/);
});

test('visitor events accepts text/plain JSON bodies', async () => {
  const calls = [];
  const waits = [];
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...params) {
            calls.push({ sql, params });
            return {
              first: async () => ({ count: 0 }),
              run: async () => ({ success: true })
            };
          }
        };
      }
    }
  };
  const body = {
    site_id: 'snorkel',
    event_type: 'dwell',
    visitor_id: 'm0727-27-text-plain-visitor',
    session_id: 'm0727-27-text-plain-session',
    ts: '2026-07-27T03:30:00.000Z',
    landing_url: '/dwell?utm_source=codex&utm_medium=test&utm_campaign=m0727_27&secret=drop',
    dwell_ms: 12345
  };
  const request = new Request('https://analytics.nice.okinawa/events', {
    method: 'POST',
    headers: {
      origin: 'https://snorkel.nice.okinawa',
      'content-type': 'text/plain'
    },
    body: JSON.stringify(body)
  });
  const response = await worker.fetch(request, env, { waitUntil: (promise) => waits.push(promise) });
  await Promise.all(waits);
  assert.equal(response.status, 204);
  const insert = calls.find((call) => call.sql.includes('INSERT INTO visitor_events'));
  assert.ok(insert);
  assert.equal(insert.params[0], 'snorkel');
  assert.equal(insert.params[1], 'dwell');
  assert.equal(insert.params[11], '/dwell');
  assert.equal(insert.params[12], 'codex');
  assert.equal(insert.params[13], 'test');
  assert.equal(insert.params[14], 'm0727_27');
  assert.equal(insert.params[15], 12345);
});

function audioFailDb(count = 0) {
  const calls = [];
  return {
    calls,
    DB: {
      prepare(sql) {
        return {
          bind(...params) {
            calls.push({ sql, params });
            return {
              first: async () => ({ count }),
              run: async () => ({ success: true })
            };
          }
        };
      }
    }
  };
}

async function postAudioFail(env, body, headers = {}) {
  const waits = [];
  const request = new Request('https://analytics.nice.okinawa/events', {
    method: 'POST',
    headers: {
      origin: 'https://bjt.nice.okinawa',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 Version/17.0 Mobile/15E148 Safari/604.1',
      ...headers
    },
    body: JSON.stringify({
      site_id: 'bjt',
      event_type: 'audio_fail',
      ts: '2026-08-27T03:00:00.000Z',
      question_id: 'ps71301',
      failure_stage: 'media',
      status_code: 403,
      browser_family: 'chrome',
      ...body
    })
  });
  Object.defineProperty(request, 'cf', {
    value: { country: 'JP', city: 'Tokyo', timezone: 'Asia/Tokyo' },
    configurable: true
  });
  const response = await worker.fetch(request, env, { waitUntil: (promise) => waits.push(promise) });
  await Promise.all(waits);
  return response;
}

test('audio_fail events are stored in the dedicated allowlisted table', async () => {
  const env = audioFailDb();
  const response = await postAudioFail(env);
  assert.equal(response.status, 204);

  const insert = env.calls.find((call) => call.sql.includes('INSERT INTO audio_fail_events'));
  assert.ok(insert);
  assert.equal(insert.params[0], 'bjt');
  assert.equal(insert.params[2], 'ps71301');
  assert.equal(insert.params[3], 'media');
  assert.equal(insert.params[4], '403');
  assert.equal(insert.params[5], 'safari');
  assert.equal(insert.params[6], 'JP');
  assert.equal(env.calls.some((call) => call.sql.includes('INSERT INTO visitor_events')), false);
});

test('audio_fail drops non-allowlisted fields instead of storing sensitive payload', async () => {
  const env = audioFailDb();
  const response = await postAudioFail(env, {
    email: 'student@example.com',
    token: 'jwt.secret',
    url: 'https://bjt.nice.okinawa/pro/ps71301.mp3?token=secret',
    signed_url: 'https://bjt.nice.okinawa/pro/ps71301.mp3?token=secret',
    screen: '390x844',
    canvas: 'fingerprint',
    user_agent: 'full user agent',
    timezone: 'Europe/Paris',
    city: 'Paris',
    country: 'FR',
    ts: '1999-01-01T00:00:00.000Z'
  });
  assert.equal(response.status, 204);

  const insert = env.calls.find((call) => call.sql.includes('INSERT INTO audio_fail_events'));
  assert.ok(insert);
  const serialized = JSON.stringify({ sql: insert.sql, params: insert.params });
  assert.doesNotMatch(serialized, /student@example\.com/);
  assert.doesNotMatch(serialized, /jwt\.secret/);
  assert.doesNotMatch(serialized, /signed_url|token=secret|390x844|fingerprint|full user agent|Europe\/Paris|Paris|FR|1999-01-01/);
  assert.equal(insert.params.length, 7);
  assert.equal(insert.params[1] !== '1999-01-01T00:00:00.000Z', true);
  assert.equal(insert.params[6], 'JP');
});

test('audio_fail accepts schema_invalid as a text status code', async () => {
  const env = audioFailDb();
  const response = await postAudioFail(env, { status_code: 'schema_invalid' });
  assert.equal(response.status, 204);

  const insert = env.calls.find((call) => call.sql.includes('INSERT INTO audio_fail_events'));
  assert.ok(insert);
  assert.equal(insert.params[4], 'schema_invalid');
  assert.equal(typeof insert.params[4], 'string');
});

test('audio_fail rate limit returns 204 and skips inserts', async () => {
  const env = audioFailDb(30);
  const response = await postAudioFail(env);
  assert.equal(response.status, 204);
  assert.equal(env.calls.some((call) => call.sql.includes('INSERT INTO audio_fail_events')), false);
});

test('audio_fail never returns 5xx when storage is unavailable', async () => {
  const env = {
    DB: {
      prepare() {
        throw new Error('d1 unavailable');
      }
    }
  };
  const response = await postAudioFail(env);
  assert.equal(response.status, 204);
});

test('unknown visitor event types still fail closed', async () => {
  const env = audioFailDb();
  const request = new Request('https://analytics.nice.okinawa/events', {
    method: 'POST',
    headers: {
      origin: 'https://bjt.nice.okinawa',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      site_id: 'bjt',
      event_type: 'audio_debug',
      visitor_id: 'v',
      session_id: 's',
      ts: '2026-08-27T03:00:00.000Z'
    })
  });
  const response = await worker.fetch(request, env, { waitUntil: () => {} });
  assert.equal(response.status, 400);
});
