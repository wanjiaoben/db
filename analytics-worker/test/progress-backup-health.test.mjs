import assert from 'node:assert/strict';
import test from 'node:test';
import { attachBackupHistory, backupHistoryFromIndex, backupItem, buildAlertEmailPreview, collectAlertItems, dailyD1BackupItem, d1BackupItem, progressBackupItem, selectDeploymentWorkflowRun } from '../src/worker.js';

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

test('BJT rolling freshness follows every-other-day 51h window', () => {
  const manifestResult = (generatedAt) => ({
    ok: true,
    status: 'ok',
    key: 'kv-snapshots/latest/manifest.json',
    data: { created_at: generatedAt }
  });
  const fresh = backupItem(
    'bjt', 'BJT', manifestResult('2026-07-16T19:00:00.000Z'), ['created_at'], now, { maxAgeHours: 51 }
  );
  const stale = backupItem(
    'bjt', 'BJT', manifestResult('2026-07-16T17:00:00.000Z'), ['created_at'], now, { maxAgeHours: 51 }
  );
  const noAlert = collectAlertItems({ items: [fresh] }, { items: [] }, { targets: [] });
  const alert = collectAlertItems({ items: [stale] }, { items: [] }, { targets: [] });

  assert.equal(fresh.ok, true);
  assert.equal(fresh.age_hours, 50);
  assert.equal(fresh.max_age_hours, 51);
  assert.equal(stale.ok, false);
  assert.equal(stale.age_hours, 52);
  assert.match(stale.error, /51h/);
  assert.equal(noAlert.length, 0);
  assert.deepEqual(alert.map((item) => item.key), ['bjt']);
});

test('Progress rolling freshness remains daily 27h', () => {
  const freshProgress = progressBackupItem(
    'progress-production', 'Progress production', result('production', '2026-07-17T19:00:00.000Z'),
    'production', 'progress', now
  );
  const staleProgress = progressBackupItem(
    'progress-production', 'Progress production', result('production', '2026-07-17T17:00:00.000Z'),
    'production', 'progress', now
  );
  const noAlert = collectAlertItems({ items: [freshProgress] }, { items: [] }, { targets: [] });
  const alert = collectAlertItems({ items: [staleProgress] }, { items: [] }, { targets: [] });

  assert.equal(freshProgress.ok, true);
  assert.equal(freshProgress.max_age_hours, 27);
  assert.equal(staleProgress.ok, false);
  assert.match(staleProgress.error, /27h/);
  assert.equal(noAlert.length, 0);
  assert.deepEqual(alert.map((item) => item.key), ['progress-production']);
});

test('daily Progress manifests expose the failed stage and escalation metadata', () => {
  const failed = dailyD1BackupItem(
    'progress-production',
    'Progress production',
    {
      ok: true,
      status: 'ok',
      key: 'd1/latest/manifest.json',
      data: {
        kind: 'progress-d1-r2-daily-backup',
        status: 'failed',
        generated_at: '2026-07-18T19:00:00.000Z',
        failures: [{ stage: 'd1-export', error: 'Authentication error [code: 10000]' }]
      }
    },
    now
  );
  const [item] = collectAlertItems({ items: [{ ...failed, consecutive_failures: 2, failure_date: '2026-07-18', failure_stage: 'd1-export' }] }, { items: [] }, { targets: [] });
  assert.equal(item.alert_kind, 'escalation');
  assert.equal(item.failure_stage, 'd1-export');
  const preview = buildAlertEmailPreview({ ALERT_SUBJECT_PREFIX: '', ALERT_RECIPIENTS: 'aboutokinawa@gmail.com' }, 'red', [item]);
  assert.match(preview.subject, /^\[P0\] Backup failure: progress-production 2026-07-18 d1-export/);
});

test('backup health reports the latest successful artifact and seven-day success rate', () => {
  const item = attachBackupHistory({ key: 'progress-production', ok: false, latest_at: '' }, [
    { date: '2026-07-18', ok: false, error: 'd1-export: auth' },
    { date: '2026-07-17', ok: false, error: 'd1-export: auth' },
    { date: '2026-07-16', ok: true, latest_at: '2026-07-16T09:00:00.000Z' },
    { date: '2026-07-15', ok: true, latest_at: '2026-07-15T09:00:00.000Z' },
    { date: '2026-07-14', ok: true, latest_at: '2026-07-14T09:00:00.000Z' },
    { date: '2026-07-13', ok: true, latest_at: '2026-07-13T09:00:00.000Z' },
    { date: '2026-07-12', ok: true, latest_at: '2026-07-12T09:00:00.000Z' }
  ]);
  assert.equal(item.success_days_7d, 5);
  assert.equal(item.success_rate_7d, 5 / 7);
  assert.equal(item.last_success_at, '2026-07-16T09:00:00.000Z');
  assert.equal(item.consecutive_failures, 2);
});

test('nice_analytics backup index accepts ISO strings and skips invalid timestamps', () => {
  const rows = backupHistoryFromIndex({
    ok: true,
    data: {
      backups: [
        {
          generated_at: '2026-07-17T18:29:01.000Z',
          object_key: 'd1/nice_analytics/production/2026-07-18/nice.sql'
        },
        {
          generated_at: 'not-a-date',
          object_key: 'd1/nice_analytics/production/bad/nice.sql'
        },
        {
          object_key: 'd1/nice_analytics/production/missing-time/nice.sql'
        }
      ]
    }
  }, now, 3);
  assert.equal(rows.skipped, 2);
  assert.equal(rows[0].date, '2026-07-19');
  assert.equal(rows[1].date, '2026-07-18');
  assert.equal(rows[1].ok, true);
  assert.equal(rows[1].status, 'complete');

  const item = attachBackupHistory({ key: 'nice-analytics-production', ok: true, latest_at: '2026-07-18T18:29:01.000Z' }, rows);
  assert.equal(item.history_skipped, 2);
});

test('empty backup index returns unknown history instead of throwing', () => {
  const rows = backupHistoryFromIndex({ ok: true, data: { backups: [] } }, now, 2);
  assert.equal(rows.skipped, 0);
  assert.deepEqual(rows.map((row) => row.status), ['unknown', 'unknown']);
  assert.match(rows[0].error, /empty/);
});

test('backup failure alert subject identifies a silent same-day gap', () => {
  const [item] = collectAlertItems({ items: [{
    key: 'progress-production',
    label: 'Progress production',
    ok: false,
    status: 'missing',
    latest_at: '',
    success_rate_7d: 0,
    failure_date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date())
  }] }, { items: [] }, { targets: [] });
  item.alert_kind = 'silent';
  const preview = buildAlertEmailPreview({ ALERT_SUBJECT_PREFIX: '[TEST] ', ALERT_RECIPIENTS: 'aboutokinawa@gmail.com' }, 'red', [item]);
  assert.match(preview.subject, /^\[TEST\] \[P0\] Backup silent:/);
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

test('nice_analytics production backup manifest is validated on environment, database, and prefix', () => {
  const fresh = {
    ok: true,
    status: 'ok',
    key: 'd1/nice_analytics/production/latest.json',
    data: {
      environment: 'production',
      database: 'nice_analytics',
      generated_at: '2026-07-18T18:29:01.000Z',
      object_key: 'd1/nice_analytics/production/2026-07-18/nice_analytics-d1-2026-07-18T18-29-01-000Z.sql',
      sha256: 'a'.repeat(64),
      size_bytes: 1024,
      table_counts: { events: 3 },
      failures: []
    }
  };
  const item = d1BackupItem(
    'nice-analytics-production',
    'nice_analytics production D1 export',
    fresh,
    'production',
    'nice_analytics',
    'd1/nice_analytics/production/',
    now
  );
  const crossed = d1BackupItem(
    'nice-analytics-production',
    'nice_analytics production D1 export',
    {
      ...fresh,
      data: { ...fresh.data, object_key: 'd1/progress/production/progress-d1.json' }
    },
    'production',
    'nice_analytics',
    'd1/nice_analytics/production/',
    now
  );
  assert.equal(item.ok, true);
  assert.equal(item.database, 'nice_analytics');
  assert.equal(crossed.ok, false);
  assert.match(crossed.error, /object key crosses environment boundary/);
});

test('deployment status ignores scheduled backup failures and uses latest eligible main workflow', () => {
  const run = selectDeploymentWorkflowRun([
    {
      head_branch: 'main',
      name: 'nice_analytics D1 backup to R2',
      event: 'schedule',
      status: 'completed',
      conclusion: 'failure',
      updated_at: '2026-08-07T19:26:21Z'
    },
    {
      head_branch: 'main',
      name: 'pages build and deployment',
      event: 'dynamic',
      status: 'completed',
      conclusion: 'success',
      updated_at: '2026-08-07T12:28:11Z'
    },
    {
      head_branch: 'main',
      name: 'MERGE_GATE',
      event: 'push',
      status: 'completed',
      conclusion: 'success',
      updated_at: '2026-08-07T12:27:52Z'
    }
  ]);
  assert.equal(run.name, 'pages build and deployment');
  assert.equal(run.conclusion, 'success');
});

test('deployment status ignores manually dispatched backup failures and falls back to main gate', () => {
  const run = selectDeploymentWorkflowRun([
    {
      head_branch: 'main',
      name: 'Progress D1 backup to R2',
      event: 'workflow_dispatch',
      status: 'completed',
      conclusion: 'failure',
      updated_at: '2026-08-08T09:11:13Z'
    },
    {
      head_branch: 'main',
      name: 'MERGE_GATE',
      event: 'push',
      status: 'completed',
      conclusion: 'success',
      updated_at: '2026-08-08T07:59:09Z'
    }
  ]);
  assert.equal(run.name, 'MERGE_GATE');
  assert.equal(run.conclusion, 'success');
});
