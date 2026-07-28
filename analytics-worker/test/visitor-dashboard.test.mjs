import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/worker.js';

function fakeDb(fixtures) {
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
        async all() {
          const key = Object.keys(fixtures).find((needle) => sql.includes(needle));
          return { results: key ? fixtures[key] : [] };
        },
        async first() {
          const key = Object.keys(fixtures).find((needle) => sql.includes(needle));
          return key ? fixtures[key] : null;
        }
      };
    }
  };
}

test('visitor dashboard requires DASHBOARD_KEY and returns 403 without it', async () => {
  const env = { DB: fakeDb({}) };
  const res = await worker.fetch(new Request('https://analytics.nice.okinawa/visitors?days=28'), env, {});
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { ok: false, error: 'unauthorized' });
});

test('visitor dashboard returns 28/7 day aggregate with sample protection', async () => {
  const db = fakeDb({
    'COUNT(CASE WHEN event_type': [
      { site_id: 'snorkel', event_count: 25, pv: 10, uv: 4, contact_clicks: 3 },
      { site_id: 'fishing', event_count: 3, pv: 1, uv: 1, contact_clicks: 0 }
    ],
    'GROUP BY site_id\n      ORDER BY count DESC': [
      { site_id: 'snorkel', count: 3 }
    ],
    "event_type='contact_click'": { count: 3 },
    'median_dwell_ms': [
      { site_id: 'snorkel', median_dwell_ms: 12000 }
    ],
    "SELECT site_id, ? AS field": [
      { site_id: 'snorkel', field: 'referrer_host', value: 'google.com', count: 6 }
    ],
    'ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY created_at DESC': [
      {
        created_at: '2026-07-27T04:00:00.000Z',
        site_id: 'fishing',
        event_type: 'pageview',
        referrer_host: 'direct',
        country: 'JP',
        city: 'Okinawa',
        landing_path: '/'
      }
    ]
  });
  const res = await worker.fetch(new Request('https://analytics.nice.okinawa/visitors?days=7', {
    headers: { 'x-dashboard-key': 'test-token' }
  }), { DASHBOARD_KEY: 'test-token', DB: db }, {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.days, 7);
  assert.equal(data.sample_min_events, 20);
  assert.equal(data.contact_clicks.total, 3);
  assert.equal(data.contact_clicks.by_site[0].site_id, 'snorkel');
  assert.equal(data.sites[0].site_id, 'snorkel');
  assert.equal(data.sites[0].protected, false);
  assert.equal(data.sites[0].median_dwell_ms, 12000);
  assert.equal(data.sites[1].site_id, 'fishing');
  assert.equal(data.sites[1].protected, true);
  assert.equal(data.sites[1].raw_records.length, 1);
  assert.match(db.calls[0].params[0], /^\d{4}-\d{2}-\d{2}T/);
});
