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
