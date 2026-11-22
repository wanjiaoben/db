import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/worker.js';

function fakeDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const call = { sql, params: [] };
      calls.push(call);
      return {
        bind(...params) {
          call.params = params;
          return this;
        },
        async run() {
          return { success: true };
        }
      };
    }
  };
}

test('source click stores only UTC date, allowlisted source, count and timestamp', async () => {
  const db = fakeDb();
  const response = await worker.fetch(new Request('https://analytics.nice.okinawa/source-click', {
    method: 'POST',
    headers: { origin: 'https://nice.okinawa', 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'reddit', email: 'must-not-store@example.invalid', visitor_id: 'must-not-store' })
  }), { DB: db }, {});

  assert.equal(response.status, 204);
  const insert = db.calls.find((call) => call.sql.includes('INSERT INTO source_click_daily'));
  assert.ok(insert);
  assert.match(insert.params[0], /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(insert.params[1], 'reddit');
  assert.match(insert.params[2], /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(JSON.stringify(db.calls).includes('must-not-store'), false);
  assert.equal(JSON.stringify(db.calls).includes('email'), false);
  assert.equal(JSON.stringify(db.calls).includes('visitor_id'), false);
});

test('source click rejects unknown sources and non-production origins without writing', async () => {
  for (const [origin, source, expected] of [
    ['https://nice.okinawa', 'unknown-source', 400],
    ['https://attacker.example', 'reddit', 403]
  ]) {
    const db = fakeDb();
    const response = await worker.fetch(new Request('https://analytics.nice.okinawa/source-click', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ source })
    }), { DB: db }, {});
    assert.equal(response.status, expected);
    assert.equal(db.calls.some((call) => call.sql.includes('INSERT INTO source_click_daily')), false);
  }
});

test('source click preflight is limited to nice.okinawa', async () => {
  const good = await worker.fetch(new Request('https://analytics.nice.okinawa/source-click', {
    method: 'OPTIONS', headers: { origin: 'https://nice.okinawa' }
  }), {}, {});
  assert.equal(good.status, 204);
  assert.equal(good.headers.get('access-control-allow-origin'), 'https://nice.okinawa');

  const bad = await worker.fetch(new Request('https://analytics.nice.okinawa/source-click', {
    method: 'OPTIONS', headers: { origin: 'https://attacker.example' }
  }), {}, {});
  assert.equal(bad.status, 403);
});
