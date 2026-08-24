import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildSearchConsoleWeeklyEmailText,
  bingDateOnly,
  configuredSearchConsoleSites,
  configuredBingSites,
  normalizeBingQueryRow,
  normalizeSearchTermSource,
  parsePage,
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
  assert.match(worker, /syncBingSearchTermsRange\(env\)/);
  assert.match(worker, /sendSearchConsoleWeeklyReport\(env, scheduledAt/);
  assert.match(wrangler, /GSC_SERVICE_ACCOUNT_JSON/);
  assert.match(wrangler, /GSC_SITE_URLS = "sc-domain:bjt\.nice\.okinawa/);
  assert.match(wrangler, /BING_SITE_URLS = "https:\/\/bjt\.nice\.okinawa\//);
  assert.match(wrangler, /BING_API_KEY/);
  assert.match(wrangler, /ALERT_RECIPIENTS = "aboutokinawa@gmail\.com"/);
  assert.doesNotMatch(wrangler, /GSC_WEEKLY_REPORT_EMAIL/);
  assert.doesNotMatch(wrangler, /ALERT_EMAIL_ALLOWLIST/);
  assert.doesNotMatch(wrangler, /WAN_ALERT_EMAIL/);
});

test('Search Console config supports domain and URL-prefix properties', () => {
  assert.deepEqual(configuredSearchConsoleSites({
    GSC_SITE_URLS: 'sc-domain:bjt.nice.okinawa,sc-domain:kiso.nice.okinawa,sc-domain:nice.okinawa,sc-domain:progress.nice.okinawa,sc-domain:snorkel.nice.okinawa,https://translation.nice.okinawa/'
  }), [
    'sc-domain:bjt.nice.okinawa',
    'sc-domain:kiso.nice.okinawa',
    'sc-domain:nice.okinawa',
    'sc-domain:progress.nice.okinawa',
    'sc-domain:snorkel.nice.okinawa',
    'https://translation.nice.okinawa/'
  ]);
  assert.deepEqual(parsePage('sc-domain:bjt.nice.okinawa', 'https://bjt.nice.okinawa/pro/buy/'), {
    site: 'bjt',
    path: '/pro/buy/'
  });
  assert.deepEqual(parsePage('sc-domain:bjt.nice.okinawa', ''), {
    site: 'bjt',
    path: '/'
  });
  assert.deepEqual(parsePage('https://translation.nice.okinawa/', 'https://translation.nice.okinawa/en/'), {
    site: 'translation',
    path: '/en/'
  });
});

test('Bing Webmaster query stats rows normalize into search_terms shape', () => {
  assert.equal(bingDateOnly('/Date(1787443200000+0000)/'), '2026-08-23');
  const row = normalizeBingQueryRow({
    Date: '/Date(1787443200000+0000)/',
    Query: 'okinawa snorkel',
    Impressions: 40,
    Clicks: 4,
    AvgImpressionPosition: 8.5
  });
  assert.deepEqual(row, {
    date: '2026-08-23',
    query: 'okinawa snorkel',
    impressions: 40,
    clicks: 4,
    ctr: 0.1,
    position: 8.5
  });
});

test('Bing search term config uses the six requested sites by default', () => {
  assert.equal(normalizeSearchTermSource('bing'), 'bing');
  assert.equal(normalizeSearchTermSource('all'), 'all');
  assert.equal(normalizeSearchTermSource('bad'), 'google');
  assert.deepEqual(configuredBingSites({}), [
    'https://bjt.nice.okinawa/',
    'https://kiso.nice.okinawa/',
    'https://snorkel.nice.okinawa/',
    'https://progress.nice.okinawa/',
    'https://nice.okinawa/',
    'https://translation.nice.okinawa/'
  ]);
});
