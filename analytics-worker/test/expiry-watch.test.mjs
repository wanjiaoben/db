import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  collectAlertItems,
  evaluateDashboardAlerts,
  getExpiryStatus,
  validateExpiryConfig
} from '../src/worker.js';

function item(overrides = {}) {
  return {
    name: 'Test token',
    kind: 'token',
    expires_on: '2026-10-10',
    owner: 'Test owner',
    renew_url_or_note: 'Rotate from provider dashboard.',
    ...overrides
  };
}

function emptyStatuses(expiries) {
  return [
    { items: [] },
    { items: [] },
    { targets: [] },
    expiries
  ];
}

function memoryDb() {
  const state = {
    alertState: null,
    alertSendLog: []
  };
  return {
    state,
    prepare(sql) {
      const statement = { params: [] };
      return {
        bind(...params) {
          statement.params = params;
          return this;
        },
        async run() {
          if (/INSERT INTO alert_send_log/.test(sql)) {
            const [key, status, fingerprint, windowStart, reason, detail] = statement.params;
            const exists = state.alertSendLog.some((row) => row.key === key && row.status === status && row.fingerprint === fingerprint && row.window_start === windowStart);
            if (exists) return { meta: { changes: 0 } };
            state.alertSendLog.push({ id: state.alertSendLog.length + 1, key, status, fingerprint, window_start: windowStart, reason, detail, ok: 0 });
            return { meta: { changes: 1, last_row_id: state.alertSendLog.length } };
          }
          if (/UPDATE alert_send_log/.test(sql)) {
            const [ok, error, result, id] = statement.params;
            const row = state.alertSendLog.find((entry) => entry.id === id);
            if (row) Object.assign(row, { ok, error, result, sent_at: new Date().toISOString() });
            return { meta: { changes: row ? 1 : 0 } };
          }
          if (/INSERT INTO alert_state/.test(sql)) {
            const [key, status, fingerprint, detail] = statement.params;
            state.alertState = { key, status, fingerprint, detail };
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          if (/FROM alert_state/.test(sql)) return state.alertState;
          return null;
        },
        async all() {
          if (/FROM alert_send_log/.test(sql)) return { results: state.alertSendLog };
          return { results: [] };
        }
      };
    }
  };
}

test('expiry watch reports green, yellow, red, and expired states', () => {
  const now = new Date('2026-09-04T00:00:00.000Z');
  const green = getExpiryStatus({ now, config: [item({ expires_on: '2026-10-10' })] });
  assert.equal(green.status, 'green');
  assert.equal(green.nearest.days_remaining, 36);

  const yellow = getExpiryStatus({ now, config: [item({ expires_on: '2026-10-04' })] });
  assert.equal(yellow.status, 'yellow');
  assert.equal(yellow.ok, true);

  const red = getExpiryStatus({ now, config: [item({ expires_on: '2026-09-11' })] });
  assert.equal(red.status, 'red');
  assert.equal(red.ok, false);

  const expired = getExpiryStatus({ now, config: [item({ expires_on: '2026-09-03' })] });
  assert.equal(expired.status, 'red');
  assert.equal(expired.nearest.status, 'expired');
});

test('expiry yellow is visible but does not enter alert items', () => {
  const expiries = getExpiryStatus({
    now: new Date('2026-09-04T00:00:00.000Z'),
    config: [item({ expires_on: '2026-10-04' })]
  });
  const alerts = collectAlertItems({ items: [] }, { items: [] }, { targets: [] }, expiries);
  assert.deepEqual(alerts, []);
});

test('expiry red and expired enter alert items with stable fingerprints', () => {
  const now = new Date('2026-09-04T00:00:00.000Z');
  const red = getExpiryStatus({ now, config: [item({ expires_on: '2026-09-11' })] });
  const expired = getExpiryStatus({ now, config: [item({ name: 'Expired domain', kind: 'domain', expires_on: '2026-09-03' })] });
  const alerts = collectAlertItems({ items: [] }, { items: [] }, { targets: [] }, red)
    .concat(collectAlertItems({ items: [] }, { items: [] }, { targets: [] }, expired));
  assert.deepEqual(alerts.map((entry) => entry.type), ['expiry', 'expiry']);
  assert.match(alerts[0].fingerprint, /^expiry:token:Test token:2026-09-11:red$/);
  assert.match(alerts[1].fingerprint, /^expiry:domain:Expired domain:2026-09-03:expired$/);
});

test('expiry red sends one alert per fingerprint window', async () => {
  const db = memoryDb();
  const env = {
    DB: db,
    ALERT_RECIPIENTS: 'aboutokinawa@gmail.com',
    ALERT_FROM_EMAIL: 'Nice Okinawa Inquiry <noreply@nice.okinawa>',
    RESEND_API_KEY: 'test-resend'
  };
  const expiries = getExpiryStatus({
    now: new Date('2026-09-04T00:00:00.000Z'),
    config: [item({ expires_on: '2026-09-11' })]
  });
  const originalFetch = globalThis.fetch;
  let sent = 0;
  globalThis.fetch = async (url) => {
    if (String(url) === 'https://api.resend.com/emails') {
      sent += 1;
      return Response.json({ id: 'email_123' });
    }
    throw new Error('unexpected network');
  };
  try {
    const first = await evaluateDashboardAlerts(env, 'test', { statuses: emptyStatuses(expiries), notify: true });
    const second = await evaluateDashboardAlerts(env, 'test', { statuses: emptyStatuses(expiries), notify: true });
    assert.equal(first.status, 'red');
    assert.equal(first.sent, true);
    assert.equal(second.status, 'red');
    assert.equal(second.sent, false);
    assert.equal(sent, 1);
    assert.equal(db.state.alertSendLog.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('expiry config contracts reject missing, invalid JSON, missing fields, invalid dates, and invalid kinds', () => {
  assert.match(validateExpiryConfig(null).error, /missing expiries config file/);
  assert.match(validateExpiryConfig('{').error, /invalid expiries JSON/);
  assert.match(validateExpiryConfig([item({ name: '' })]).error, /name missing/);
  assert.match(validateExpiryConfig([item({ expires_on: '2026-02-30' })]).error, /expires_on invalid/);
  assert.match(validateExpiryConfig([item({ kind: 'password' })]).error, /kind invalid/);
  assert.match(validateExpiryConfig([item({ renew_url_or_note: 'token=abc' })]).error, /sensitive/);
});

test('dashboard renders expiry watch health row', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="expiryTable"/);
  assert.match(html, /到期提醒/);
  assert.match(html, /data\.expiries/);
});
