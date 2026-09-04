import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import worker from '../src/worker.js';

test('GET /alerts/test returns a friendly dashboard-key hint instead of not_found', async () => {
  const res = await worker.fetch(new Request('https://analytics.nice.okinawa/alerts/test'), {}, {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.error, 'missing_dashboard_key');
  assert.match(data.message, /Dashboard key/);
});

test('manual alert test dry-run forces a TEST subject and about recipient', async () => {
  const res = await worker.fetch(new Request('https://analytics.nice.okinawa/alerts/test?dry_run=1', {
    method: 'POST',
    headers: { 'x-dashboard-key': 'test-key' }
  }), {
    DASHBOARD_KEY: 'test-key',
    ALERT_RECIPIENTS: 'aboutokinawa@gmail.com',
    ALERT_FROM_EMAIL: 'Nice Okinawa Inquiry <noreply@nice.okinawa>'
  }, {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.sent, false);
  assert.equal(data.dry_run, true);
  assert.match(data.subject, /^\[TEST\] /);
  assert.equal(data.recipient, 'aboutokinawa@gmail.com');
});

test('dashboard exposes a path-check test alert button', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="sendTestAlert"/);
  assert.match(html, /发测试告警/);
  assert.match(html, /已发到 aboutokinawa@gmail\.com/);
  assert.match(html, /API_ROOT \+ '\/alerts\/test'/);
});

test('proxied production dashboard no longer renders dashboard-key controls', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="keyStatus"/);
  assert.doesNotMatch(html, /id="key" type="password"/);
  assert.doesNotMatch(html, /id="saveKey"/);
  assert.doesNotMatch(html, /nice_dashboard_key/);
  assert.match(html, /loadPathCheckStatus\(\);/);
});
