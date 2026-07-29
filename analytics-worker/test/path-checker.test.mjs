import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  PATH_CHECK_BASELINES,
  checkPathContract,
  isFastPathCheckFailure,
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
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*PATH_CHECK_ALERTS_ENABLED = "0"/);
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*DASHBOARD_ALERTS_ENABLED = "0"/);
});
