import assert from 'node:assert/strict';
import test from 'node:test';
import { backupItem, collectAlertItems, progressBackupItem } from '../src/worker.js';

const now = new Date('2026-07-18T21:00:00.000Z');

function result(environment, generatedAt, overrides = {}) {
  const database = environment === 'production' ? 'progress' : 'progress-otp-preview';
  return {
    ok: true,
    status: 'ok',
    key: `d1/progress/${environment}/latest.json`,
    data: {
      environment,
      database,
      generated_at: generatedAt,
      object_key: `d1/progress/${environment}/2026-07-18T18-17-00-000Z.json`,
      ...overrides
    }
  };
}

test('production and preview manifests pass independently inside 27h', () => {
  const production = progressBackupItem('production', 'production', result('production', '2026-07-17T18:17:01.000Z'), 'production', 'progress', now);
  const preview = progressBackupItem('preview', 'preview', result('preview', '2026-07-18T18:17:01.000Z'), 'preview', 'progress-otp-preview', now);
  assert.equal(production.ok, true);
  assert.equal(preview.ok, true);
  assert.equal(production.max_age_hours, 27);
});

test('a Progress backup at exactly 27h is still fresh and 28h is stale', () => {
  const boundary = progressBackupItem('production', 'production', result('production', '2026-07-17T18:00:00.000Z'), 'production', 'progress', now);
  const item = progressBackupItem('production', 'production', result('production', '2026-07-17T17:00:00.000Z'), 'production', 'progress', now);
  assert.equal(boundary.ok, true);
  assert.equal(boundary.age_hours, 27);
  assert.equal(item.ok, false);
  assert.equal(item.status, 'stale');
  assert.match(item.error, /older than 27h/);
});

test('BJT and Progress rolling freshness alert only for 28h manifests, not 26h manifests', () => {
  const manifestResult = (generatedAt) => ({
    ok: true,
    status: 'ok',
    key: 'kv-snapshots/latest/manifest.json',
    data: { created_at: generatedAt }
  });
  const fresh = backupItem(
    'bjt', 'BJT', manifestResult('2026-07-17T19:00:00.000Z'), ['created_at'], now
  );
  const stale = backupItem(
    'bjt', 'BJT', manifestResult('2026-07-17T17:00:00.000Z'), ['created_at'], now
  );
  const freshProgress = progressBackupItem(
    'progress-production', 'Progress production', result('production', '2026-07-17T19:00:00.000Z'),
    'production', 'progress', now
  );
  const staleProgress = progressBackupItem(
    'progress-production', 'Progress production', result('production', '2026-07-17T17:00:00.000Z'),
    'production', 'progress', now
  );
  const noAlert = collectAlertItems({ items: [fresh, freshProgress] }, { items: [] }, { targets: [] });
  const alert = collectAlertItems({ items: [stale, staleProgress] }, { items: [] }, { targets: [] });

  assert.equal(fresh.ok, true);
  assert.equal(fresh.age_hours, 26);
  assert.equal(freshProgress.ok, true);
  assert.equal(stale.ok, false);
  assert.equal(stale.age_hours, 28);
  assert.equal(staleProgress.ok, false);
  assert.equal(noAlert.length, 0);
  assert.deepEqual(alert.map((item) => item.key), ['bjt', 'progress-production']);
});

test('cross-environment latest is red even when fresh', () => {
  const item = progressBackupItem(
    'production',
    'production',
    result('preview', '2026-07-18T18:17:01.000Z'),
    'production',
    'progress',
    now
  );
  assert.equal(item.ok, false);
  assert.equal(item.status, 'environment_mismatch');
  assert.match(item.error, /environment mismatch/);
});

test('wrong database or object prefix is red', () => {
  const wrongDatabase = progressBackupItem(
    'production', 'production', result('production', '2026-07-18T18:17:01.000Z', { database: 'progress-otp-preview' }),
    'production', 'progress', now
  );
  const wrongPrefix = progressBackupItem(
    'production', 'production', result('production', '2026-07-18T18:17:01.000Z', { object_key: 'd1/progress/preview/x.json' }),
    'production', 'progress', now
  );
  assert.equal(wrongDatabase.ok, false);
  assert.equal(wrongPrefix.ok, false);
});
