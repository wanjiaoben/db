import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/worker.js';

function fakeDb(fixtures) {
  const calls = [];
  const fixtureKeys = Object.keys(fixtures).sort((a, b) => b.length - a.length);
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
          const key = fixtureKeys.find((needle) => sql.includes(needle));
          return { results: key ? fixtures[key] : [] };
        },
        async first() {
          const key = fixtureKeys.find((needle) => sql.includes(needle));
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

test('visitor dashboard returns ranged aggregate with sample protection', async () => {
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
    ],
    'visitor_sources': [
      { site_id: 'snorkel', field: 'referrer_host', value: 'google.com', count: 2 },
      { site_id: 'snorkel', field: 'referrer_host', value: 'direct', count: 1 }
    ],
    'GROUP_CONCAT(DISTINCT CASE WHEN event_type': [
      {
        site_id: 'snorkel',
        landing_site: 'snorkel',
        visitor_id: 'visitor-123',
        first_seen_at: '2026-07-27T04:00:00.000Z',
        last_seen_at: '2026-07-27T04:03:00.000Z',
        event_count: 4,
        pageviews: 1,
        section_views: 2,
        dwell_count: 1,
        avg_dwell_ms: 12000,
        max_dwell_ms: 12000,
        contact_clicks: 1,
        contact_channels: 'email',
        section_ids: 'hero,price',
        referrer_host: 'google.com',
        country: 'JP',
        city: 'Council Bluffs',
        timezone: 'Asia/Tokyo',
        ui_lang: 'zh-Hant',
        browser_lang: 'zh-CN',
        landing_path: '/',
        utm_source: 'google',
        utm_medium: 'organic',
        utm_campaign: ''
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
  assert.equal(data.sites.length, 12);
  assert.equal(data.sites[0].site_id, 'snorkel');
  assert.equal(data.sites[0].protected, false);
  assert.equal(data.sites[0].median_dwell_ms, 12000);
  assert.deepEqual(data.sites[0].referrers.map((row) => row.value), ['google.com', 'direct']);
  const fishing = data.sites.find((site) => site.site_id === 'fishing');
  assert.equal(fishing.protected, true);
  assert.equal(fishing.raw_records.length, 1);
  assert.equal(data.visitor_rows[0].site_id, 'snorkel');
  assert.equal(data.visitor_rows[0].visitor_id, 'visitor-123');
  assert.equal(data.visitor_rows[0].referrer_host, 'google.com');
  assert.equal(data.visitor_rows[0].is_bot_like, true);
  assert.deepEqual(data.visitor_rows[0].bot_reasons, ['city:Council Bluffs']);
  assert.deepEqual(data.visitor_rows[0].contact_channels, ['email']);
  assert.deepEqual(data.visitor_rows[0].section_ids, ['hero', 'price']);
  assert.match(db.calls[0].params[0], /^\d{4}-\d{2}-\d{2}T/);
});

test('visitor dashboard accepts 1/7/30/180 day ranges and keeps legacy fallback', async () => {
  const emptyFixtures = {
    'COUNT(CASE WHEN event_type': [],
    'GROUP BY site_id\n      ORDER BY count DESC': [],
    "event_type='contact_click'": { count: 0 }
  };
  for (const days of [1, 7, 30, 180]) {
    const res = await worker.fetch(new Request(`https://analytics.nice.okinawa/visitors?days=${days}`, {
      headers: { 'x-dashboard-key': 'test-token' }
    }), { DASHBOARD_KEY: 'test-token', DB: fakeDb(emptyFixtures) }, {});
    assert.equal((await res.json()).days, days);
  }
  const fallback = await worker.fetch(new Request('https://analytics.nice.okinawa/visitors?days=99', {
    headers: { 'x-dashboard-key': 'test-token' }
  }), { DASHBOARD_KEY: 'test-token', DB: fakeDb(emptyFixtures) }, {});
  assert.equal((await fallback.json()).days, 28);
});
