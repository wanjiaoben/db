import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildSearchConsoleWeeklyEmailText,
  searchConsoleCredentials
} from '../src/worker.js';

test('Search Console accepts a single service-account JSON secret', () => {
  const credentials = searchConsoleCredentials({
    GSC_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: 'nice-dashboard@example.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n'
    })
  });
  assert.equal(credentials.clientEmail, 'nice-dashboard@example.iam.gserviceaccount.com');
  assert.match(credentials.privateKey, /BEGIN PRIVATE KEY/);
  assert.equal(credentials.source, 'GSC_SERVICE_ACCOUNT_JSON');
});

test('Search Console still accepts split legacy secrets as fallback', () => {
  const credentials = searchConsoleCredentials({
    GSC_CLIENT_EMAIL: 'legacy@example.iam.gserviceaccount.com',
    GSC_PRIVATE_KEY: 'legacy-key'
  });
  assert.equal(credentials.clientEmail, 'legacy@example.iam.gserviceaccount.com');
  assert.equal(credentials.privateKey, 'legacy-key');
  assert.equal(credentials.source, 'split');
});

test('weekly Search Console report lists site deltas and both Top sections', () => {
  const text = buildSearchConsoleWeeklyEmailText({
    generated_at: '2026-08-21T00:00:00.000Z',
    current: { start_date: '2026-08-10', end_date: '2026-08-16' },
    previous: { start_date: '2026-08-03', end_date: '2026-08-09' },
    sites: [{
      site: 'snorkel',
      clicks: 12,
      impressions: 345,
      clicks_delta: 3,
      impressions_delta: -10,
      ctr: 0.0347,
      position: 8.42
    }],
    no_click: [{
      site: 'fishing',
      query: 'okinawa fishing charter',
      path: '/en/',
      impressions: 44,
      position: 6.2
    }],
    striking_distance: [{
      site: 'kiso',
      query: 'learn japanese okinawa',
      path: '/english/',
      clicks: 1,
      impressions: 88,
      position: 9.7
    }]
  });
  assert.match(text, /snorkel: clicks 12 \(\+3\), impressions 345 \(-10\)/);
  assert.match(text, /CTR opportunities: impressions without clicks Top 5/);
  assert.match(text, /okinawa fishing charter/);
  assert.match(text, /Striking distance: ranking 4-15 Top 5/);
  assert.match(text, /learn japanese okinawa/);
});

test('Search Console cron and email configuration are explicit', () => {
  const worker = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
  const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(worker, /const GSC_DAILY_SYNC_CRON = '0 0 \* \* \*'/);
  assert.match(worker, /sendSearchConsoleWeeklyReport\(env, scheduledAt/);
  assert.match(wrangler, /GSC_SERVICE_ACCOUNT_JSON/);
  assert.match(wrangler, /ALERT_RECIPIENTS = "aboutokinawa@gmail\.com"/);
  assert.doesNotMatch(wrangler, /GSC_WEEKLY_REPORT_EMAIL/);
  assert.doesNotMatch(wrangler, /ALERT_EMAIL_ALLOWLIST/);
  assert.doesNotMatch(wrangler, /WAN_ALERT_EMAIL/);
});
