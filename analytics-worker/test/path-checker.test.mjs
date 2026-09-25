import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  PATH_CHECK_BASELINES,
  REVIEW_ONLINE_CHECK_KEY,
  REVIEW_ONLINE_FAILURE_DEBOUNCE,
  SHELF_RECONCILIATION_CHECK_KEY,
  SHELF_RECONCILIATION_FAILURE_DEBOUNCE,
  buildReviewOnlineAlertPreview,
  buildShelfReconciliationAlertPreview,
  checkPathContract,
  isFastPathCheckFailure,
  pathCheckAlertThreshold,
  reviewOnlineCheckEnabled,
  reviewOnlinePathCheckTarget,
  reviewOnlineStatus,
  shelfReconciliationCheckEnabled,
  shelfReconciliationPathCheckTarget,
  shelfReconciliationStatus,
  shouldSendPathCheckAlert,
  stableFingerprint
} from '../src/worker.js';

test('path checker baseline covers customer-facing pages and APIs', () => {
  const keys = new Set(PATH_CHECK_BASELINES.map((target) => target.key));
  for (const key of [
    'bjt-mogi-trial',
    'bjt-patto-trial',
    'bjt-patto-bjt-trial',
    'bjt-patto-keigo-trial',
    'bjt-buy',
    'bjt-login',
    'bjt-questions-free',
    'bjt-check-locked',
    'bjt-ebook-catalog',
    'bjt-video-logs-locked',
    'site-snorkel-home',
    'site-kiso-home'
  ]) {
    assert.ok(keys.has(key), `${key} is missing from path checker baseline`);
  }
  assert.equal(PATH_CHECK_BASELINES.filter((target) => target.key.startsWith('site-')).length, 12);
});

test('BJT trial resource probes target trial-only files and keep full banks as reverse probes', () => {
  const byKey = new Map(PATH_CHECK_BASELINES.map((target) => [target.key, target]));
  const resources = [
    ...(byKey.get('bjt-patto-trial')?.resources || []),
    ...(byKey.get('bjt-patto-bjt-trial')?.resources || []),
    ...(byKey.get('bjt-patto-keigo-trial')?.resources || []),
  ];
  const expected = new Map([
    ['https://bjt.nice.okinawa/patto/trial_bank.js', [200]],
    ['https://bjt.nice.okinawa/patto/bjt/trial/trial_bank.js', [200]],
    ['https://bjt.nice.okinawa/patto/keigo/trial/trial_bank.js', [200]],
    ['https://bjt.nice.okinawa/audio/voca/bank01.js', [404]],
    ['https://bjt.nice.okinawa/patto/keigo/keigo_a_bank.js', [404]],
  ]);
  for (const [url, statuses] of expected) {
    const match = resources.find((resource) => resource.url === url);
    assert.ok(match, `${url} is missing from BJT trial path checker resources`);
    assert.deepEqual(match.okStatuses, statuses, `${url} must use the expected status contract`);
  }
  assert.equal(resources.filter((resource) => resource.url === 'https://bjt.nice.okinawa/audio/voca/bank01.js').length, 1);
  assert.equal(resources.filter((resource) => resource.url === 'https://bjt.nice.okinawa/patto/keigo/keigo_a_bank.js').length, 1);
});

test('path checker text contracts catch broken 200 shells', () => {
  assert.deepEqual(
    checkPathContract({ type: 'text_contains', contains: '体验版固定开放 9 题' }, '<main>体验版固定开放 9 题</main>'),
    { ok: true }
  );
  const broken = checkPathContract({ type: 'text_contains', contains: '体验版固定开放 9 题' }, '<main></main>');
  assert.equal(broken.ok, false);
  assert.match(broken.error, /missing_text/);
});

test('japanusedcars home contract uses stable title text case-insensitively', () => {
  const byKey = new Map(PATH_CHECK_BASELINES.map((target) => [target.key, target]));
  const target = byKey.get('site-japanusedcars-home');
  assert.equal(target.contract.contains, 'Okinawa Used Cars');
  assert.equal(target.contract.case_insensitive, true);
  assert.deepEqual(
    checkPathContract(target.contract, '<title>okinawa used cars | export support</title>'),
    { ok: true }
  );
});

test('path checker JSON contracts require fields and exact values', () => {
  const contract = {
    type: 'json_fields',
    fields: ['ok', 'access', 'questions', 'lockedCount'],
    equals: { ok: true, access: 'free' }
  };
  assert.deepEqual(
    checkPathContract(contract, JSON.stringify({ ok: true, access: 'free', questions: [], lockedCount: 80 })),
    { ok: true }
  );
  assert.equal(checkPathContract(contract, JSON.stringify({ ok: true, questions: [] })).ok, false);
  assert.equal(checkPathContract(contract, JSON.stringify({ ok: true, access: 'pro', questions: [], lockedCount: 0 })).ok, false);
});

test('path checker uses fast debounce for group, DNS, and 5xx failures', () => {
  assert.equal(isFastPathCheckFailure([{ status: 500 }], [{}, {}, {}]), true);
  assert.equal(isFastPathCheckFailure([{ status: 0 }], [{}, {}, {}]), true);
  assert.equal(isFastPathCheckFailure([{ status: 403 }, { status: 404 }], [{}, {}, {}, {}]), true);
  assert.equal(isFastPathCheckFailure([{ status: 403 }], [{}, {}, {}, {}, {}]), false);
});

test('path checker fingerprints are stable and compact', () => {
  const one = stableFingerprint('bjt-mogi-trial|missing_text');
  const two = stableFingerprint('bjt-mogi-trial|missing_text');
  const three = stableFingerprint('bjt-mogi-trial|status_500');
  assert.equal(one, two);
  assert.notEqual(one, three);
  assert.match(one, /^[0-9a-f]{8}$/);
});

test('path checker alert escalation repeats unresolved red lights daily', () => {
  const now = new Date('2026-08-16T12:00:00.000Z');
  const result = { ok: false, critical: true, fingerprint: 'deadbeef' };
  const previous = {
    fingerprint: 'deadbeef',
    last_ok_at: '2026-08-15T11:00:00.000Z',
    last_alert_at: '2026-08-15T11:30:00.000Z'
  };

  assert.equal(shouldSendPathCheckAlert({
    result,
    previous,
    consecutiveFailures: 100,
    threshold: 3,
    now
  }), true);
});

test('path checker alert escalation keeps same-fingerprint red lights quiet inside daily window', () => {
  const now = new Date('2026-08-16T12:00:00.000Z');
  const result = { ok: false, critical: true, fingerprint: 'deadbeef' };
  assert.equal(shouldSendPathCheckAlert({
    result,
    previous: {
      fingerprint: 'deadbeef',
      last_ok_at: '2026-08-15T11:00:00.000Z',
      last_alert_at: '2026-08-16T01:00:00.000Z'
    },
    consecutiveFailures: 100,
    threshold: 3,
    now
  }), false);
  assert.equal(shouldSendPathCheckAlert({
    result,
    previous: {
      fingerprint: 'deadbeef',
      last_ok_at: '2026-08-16T06:00:00.000Z',
      last_alert_at: '2026-08-15T11:00:00.000Z'
    },
    consecutiveFailures: 10,
    threshold: 3,
    now
  }), false);
});

test('review online check is disabled by default and does not join the baseline', () => {
  assert.equal(reviewOnlineCheckEnabled({}), false);
  assert.equal(reviewOnlinePathCheckTarget({}), null);
  assert.equal(PATH_CHECK_BASELINES.some((target) => target.key === REVIEW_ONLINE_CHECK_KEY), false);

  const disabled = reviewOnlineStatus({}, []);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.status, 'disabled');
  assert.equal(disabled.display_status, '未启用');
});

test('review online check target is opt-in, status-only, and alerts after two failures', () => {
  const target = reviewOnlinePathCheckTarget({
    REVIEW_ONLINE_CHECK_ENABLED: '1',
    REVIEW_ONLINE_PROBE_URL: 'https://example.test/review-online'
  });
  assert.equal(target.key, REVIEW_ONLINE_CHECK_KEY);
  assert.equal(target.label, '审核台在线');
  assert.deepEqual(target.okStatuses, [200, 204]);
  assert.equal(target.contract, null);
  assert.equal(target.sensitive, true);
  assert.equal(target.alert_profile, 'review_online');
  assert.equal(target.failure_debounce, REVIEW_ONLINE_FAILURE_DEBOUNCE);

  const result = { ok: false, critical: true, fingerprint: 'reviewdead', failure_debounce: target.failure_debounce };
  const threshold = pathCheckAlertThreshold(result, false);
  assert.equal(threshold, 2);
  assert.equal(shouldSendPathCheckAlert({
    result,
    previous: null,
    consecutiveFailures: 1,
    threshold,
    now: new Date('2026-09-23T01:00:00.000Z')
  }), false);
  assert.equal(shouldSendPathCheckAlert({
    result,
    previous: null,
    consecutiveFailures: 2,
    threshold,
    now: new Date('2026-09-23T01:15:00.000Z')
  }), true);
});

test('review online alert and recovery emails stay inside the approved field whitelist', () => {
  const env = { ALERT_RECIPIENTS: 'aboutokinawa@gmail.com' };
  const now = new Date('2026-09-23T02:00:00.000Z');
  const candidate = {
    result: {
      key: REVIEW_ONLINE_CHECK_KEY,
      label: '审核台在线',
      url: 'https://review.example.invalid/internal-healthz',
      ok: false,
      status: 503,
      failure_stage: 'http_5xx',
      excerpt: 'server says private body should not leak',
      error: 'private error should not leak',
      alert_profile: 'review_online',
      checked_at: '2026-09-23T02:00:00.000Z'
    },
    state: {
      previous_last_ok_at: '2026-09-23T01:30:00.000Z',
      previous_fingerprint: 'oldred'
    }
  };
  const alert = buildReviewOnlineAlertPreview(env, candidate, 'test', now, 'red');
  assert.match(alert.subject, /ALERT: 审核台在线/);
  for (const allowed of ['Time:', 'Check:', 'Failure stage:', 'HTTP status:', 'Last success time:']) {
    assert.match(alert.text, new RegExp(allowed));
  }
  for (const forbidden of ['review.example.invalid', 'internal-healthz', 'private body', 'private error', 'URL:', 'Excerpt:', 'Fingerprint:']) {
    assert.doesNotMatch(alert.text, new RegExp(forbidden));
  }

  const recovery = buildReviewOnlineAlertPreview(env, candidate, 'test', now, 'green');
  assert.match(recovery.subject, /RECOVERY: 审核台在线/);
  assert.match(recovery.text, /Failure stage: recovered/);
  assert.doesNotMatch(recovery.text, /review\.example\.invalid|private body|private error/);
});

test('shelf reconciliation check is disabled by default and does not join the baseline', () => {
  assert.equal(shelfReconciliationCheckEnabled({}), false);
  assert.equal(shelfReconciliationPathCheckTarget({}), null);
  assert.equal(PATH_CHECK_BASELINES.some((target) => target.key === SHELF_RECONCILIATION_CHECK_KEY), false);

  const disabled = shelfReconciliationStatus({}, []);
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.status, 'disabled');
  assert.equal(disabled.display_status, '未启用');
});

test('shelf reconciliation status contract treats normal as green and needs_reconciliation as red', () => {
  const contract = { type: 'shelf_operational_status' };
  assert.deepEqual(
    checkPathContract(contract, JSON.stringify({ question_banks: [{ question_bank: 'mogi', operational_status: 'normal' }] })),
    { ok: true, operational_status: 'normal', question_banks: ['mogi'] }
  );
  const needs = checkPathContract(contract, JSON.stringify({ question_banks: [{ question_bank: 'mogi', operational_status: 'needs_reconciliation' }] }));
  assert.equal(needs.ok, false);
  assert.equal(needs.error, 'needs_reconciliation');
  assert.equal(needs.operational_status, 'needs_reconciliation');
  assert.deepEqual(needs.question_banks, ['mogi']);

  const badJson = checkPathContract(contract, '<html>not json</html>');
  assert.equal(badJson.ok, false);
  assert.equal(badJson.error, 'bad_json');

  const missing = checkPathContract(contract, JSON.stringify({ ok: true }));
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'missing_operational_status');
});

test('shelf reconciliation target is opt-in, read-only-token protected, and alerts immediately', () => {
  const target = shelfReconciliationPathCheckTarget({
    SHELF_RECONCILIATION_CHECK_ENABLED: '1',
    SHELF_STATUS_SUMMARY_URL: 'https://example.test/shelf/status',
    SHELF_STATUS_READ_TOKEN: 'readonly-status-token'
  });
  assert.equal(target.key, SHELF_RECONCILIATION_CHECK_KEY);
  assert.equal(target.label, '货架需核对');
  assert.deepEqual(target.okStatuses, [200]);
  assert.deepEqual(target.contract, { type: 'shelf_operational_status' });
  assert.equal(target.headers.authorization, 'Bearer readonly-status-token');
  assert.equal(target.sensitive, true);
  assert.equal(target.alert_profile, 'shelf_reconciliation');
  assert.equal(target.failure_debounce, SHELF_RECONCILIATION_FAILURE_DEBOUNCE);

  const result = { ok: false, critical: true, fingerprint: 'shelfdead', failure_debounce: target.failure_debounce };
  const threshold = pathCheckAlertThreshold(result, false);
  assert.equal(threshold, 1);
  assert.equal(shouldSendPathCheckAlert({
    result,
    previous: null,
    consecutiveFailures: 1,
    threshold,
    now: new Date('2026-09-25T01:00:00.000Z')
  }), true);
});

test('shelf reconciliation alert and recovery emails stay inside the approved field whitelist', () => {
  const env = { ALERT_RECIPIENTS: 'aboutokinawa@gmail.com' };
  const now = new Date('2026-09-25T02:00:00.000Z');
  const candidate = {
    result: {
      key: SHELF_RECONCILIATION_CHECK_KEY,
      label: '货架需核对',
      url: 'https://bjt.example.invalid/admin/shelf/internal',
      ok: false,
      status: 200,
      failure_stage: 'contract',
      operational_status: 'needs_reconciliation',
      question_banks: ['mogi'],
      excerpt: 'internal shelf detail should not leak',
      error: 'private shelf error should not leak',
      alert_profile: 'shelf_reconciliation',
      checked_at: '2026-09-25T02:00:00.000Z'
    },
    state: {
      previous_last_ok_at: '2026-09-25T01:45:00.000Z',
      previous_fingerprint: 'oldshelf'
    }
  };
  const alert = buildShelfReconciliationAlertPreview(env, candidate, 'test', now, 'red');
  assert.match(alert.subject, /ALERT: 货架需核对/);
  for (const allowed of ['Time:', 'Question bank:', 'Operational status:', 'Last normal time:', 'Check failure stage:']) {
    assert.match(alert.text, new RegExp(allowed));
  }
  for (const forbidden of ['bjt.example.invalid', 'internal shelf detail', 'private shelf error', 'URL:', 'Excerpt:', 'Fingerprint:', 'HTTP status:']) {
    assert.doesNotMatch(alert.text, new RegExp(forbidden));
  }

  const recovery = buildShelfReconciliationAlertPreview(env, candidate, 'test', now, 'green');
  assert.match(recovery.subject, /RECOVERY: 货架需核对/);
  assert.match(recovery.text, /Operational status: normal/);
  assert.doesNotMatch(recovery.text, /bjt\.example\.invalid|internal shelf detail|private shelf error/);
});

test('path checker test hooks do not send dashboard self-check email', () => {
  const source = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
  const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const previewCronBlock = source.slice(
    source.indexOf('cron === PATH_CHECK_PREVIEW_TEST_EMAIL_CRON'),
    source.indexOf('cron === PATH_CHECK_CRON')
  );
  assert.match(previewCronBlock, /sendPathCheckTestAlert\(env\)/);
  assert.doesNotMatch(previewCronBlock, /sendManualTestAlert\(env\)/);

  const monthlyFunction = source.slice(
    source.indexOf('async function sendMonthlyAlertChannelSelfCheck'),
    source.indexOf('export function collectAlertItems')
  );
  assert.doesNotMatch(monthlyFunction, /sendAlertEmail\(/);
  assert.match(monthlyFunction, /no_email: true/);
  assert.match(source, /pathCheckAlertsEnabled\(env\)/);
  assert.match(source, /dashboardAlertsEnabled\(env\)/);
  assert.match(wrangler, /PATH_CHECK_ALERTS_ENABLED = "1"/);
  assert.match(wrangler, /DASHBOARD_ALERTS_ENABLED = "1"/);
  assert.match(wrangler, /REVIEW_ONLINE_CHECK_ENABLED = "0"/);
  assert.match(wrangler, /REVIEW_ONLINE_PROBE_URL = ""/);
  assert.match(wrangler, /SHELF_RECONCILIATION_CHECK_ENABLED = "0"/);
  assert.match(wrangler, /SHELF_STATUS_SUMMARY_URL = ""/);
  assert.match(wrangler, /SHELF_STATUS_READ_TOKEN\. Scope: BJT shelf operational status summary read-only/);
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*PATH_CHECK_ALERTS_ENABLED = "0"/);
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*DASHBOARD_ALERTS_ENABLED = "0"/);
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*REVIEW_ONLINE_CHECK_ENABLED = "0"/);
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*SHELF_RECONCILIATION_CHECK_ENABLED = "0"/);
});
