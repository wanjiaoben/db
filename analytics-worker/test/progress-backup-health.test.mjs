import assert from 'node:assert/strict';
import test from 'node:test';
import { attachBackupHistory, backupHistoryFromIndex, backupItem, buildAlertEmailPreview, collectAlertItems, dailyD1BackupItem, deploymentWorkflowStatus, d1BackupItem, getBackupStatus, progressBackupItem, readProgressBackupHistory, readR2Json, selectDeploymentWorkflowRun } from '../src/worker.js';

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

function memoryBucket(label, objects = {}) {
  const calls = [];
  return {
    calls,
    async get(key) {
      calls.push(`get:${key}`);
      const value = objects[key];
      if (value === undefined) return null;
      return {
        uploaded: new Date(value.uploaded || value.data?.generated_at || '2026-07-18T19:00:00.000Z'),
        async text() { return typeof value.body === 'string' ? value.body : JSON.stringify(value.data); }
      };
    },
    async list(options = {}) {
      calls.push(`list:${options.prefix || ''}`);
      return {
        objects: Object.entries(objects)
          .filter(([key]) => key.startsWith(options.prefix || ''))
          .map(([key, value]) => ({ key, uploaded: new Date(value.uploaded || value.data?.generated_at || '2026-07-18T19:00:00.000Z') }))
      };
    }
  };
}

function throwingBucket() {
  const calls = [];
  return {
    calls,
    async get(key) {
      calls.push(`get:${key}`);
      throw new Error('R2 read unavailable');
    },
    async list(options = {}) {
      calls.push(`list:${options.prefix || ''}`);
      throw new Error('R2 list unavailable');
    }
  };
}

test('preview Progress uses the dedicated R2 bucket and attaches history', async () => {
  const generatedAt = '2026-07-18T19:00:00.000Z';
  const previewKey = 'd1/progress/preview/2026-07-18T19-00-00-000Z.json';
  const previewData = {
    kind: 'progress-d1-backup', environment: 'preview', database: 'progress-otp-preview',
    generated_at: generatedAt, object_key: previewKey
  };
  const canonical = memoryBucket('canonical', {
    'd1/latest/manifest.json': { data: { ...result('production', generatedAt).data, kind: 'progress-d1-backup' } }
  });
  const dedicated = memoryBucket('dedicated', {
    'd1/progress/preview/latest.json': { data: previewData },
    [previewKey]: { data: previewData }
  });
  const empty = memoryBucket('empty');
  const status = await getBackupStatus({
    BJT_BACKUPS: empty,
    PROGRESS_BACKUP: canonical,
    PROGRESS_BACKUP_PREVIEW: dedicated
  }, new Date(generatedAt));
  const preview = status.items.find((item) => item.key === 'progress-preview');
  assert.equal(preview.ok, true);
  assert.equal(preview.history_7d[0].ok, true);
  assert.ok(dedicated.calls.includes('get:d1/progress/preview/latest.json'));
  assert.ok(dedicated.calls.includes('list:d1/progress/preview/'));
  assert.ok(!canonical.calls.includes('get:d1/progress/preview/latest.json'));
  assert.ok(canonical.calls.includes('get:d1/latest/manifest.json'));
});

test('missing preview binding is an explicit red state and never probes the shared bucket for preview', async () => {
  const shared = memoryBucket('shared');
  const status = await getBackupStatus({
    BJT_BACKUPS: memoryBucket('bjt'),
    PROGRESS_BACKUP: shared
  }, new Date('2026-07-18T19:00:00.000Z'));
  const preview = status.items.find((item) => item.key === 'progress-preview');
  assert.equal(preview.ok, false);
  assert.equal(preview.status, 'MONITOR_BINDING_MISSING');
  assert.equal(preview.error, 'MONITOR_BINDING_MISSING: missing PROGRESS_BACKUP_PREVIEW binding');
  assert.equal(preview.detail, 'missing PROGRESS_BACKUP_PREVIEW binding');
  assert.equal(preview.history_7d, null);
  assert.equal(preview.success_rate_7d, null);
  assert.equal(preview.consecutive_failures, null);
  assert.equal(shared.calls.filter((call) => call.includes('d1/progress/preview/')).length, 0);
});

test('preview binding read errors stay non-healthy and never fall back to the shared bucket', async () => {
  const shared = memoryBucket('shared');
  const dedicated = throwingBucket();
  const status = await getBackupStatus({
    BJT_BACKUPS: memoryBucket('bjt'),
    PROGRESS_BACKUP: shared,
    PROGRESS_BACKUP_PREVIEW: dedicated
  }, new Date('2026-07-18T19:00:00.000Z'));
  const preview = status.items.find((item) => item.key === 'progress-preview');
  assert.equal(preview.ok, false);
  assert.equal(preview.status, 'MONITOR_HISTORY_UNAVAILABLE');
  assert.match(preview.error, /^MONITOR_HISTORY_UNAVAILABLE:/);
  assert.equal(preview.history_7d, null);
  assert.equal(shared.calls.filter((call) => call.includes('d1/progress/preview/')).length, 0);
  assert.ok(dedicated.calls.includes('get:d1/progress/preview/latest.json'));
  assert.ok(dedicated.calls.includes('list:d1/progress/preview/'));
});

test('preview missing latest is not green and does not rely on a zero failure default', async () => {
  const dedicated = memoryBucket('dedicated');
  const history = await readProgressBackupHistory(dedicated, 'preview', 'progress-otp-preview', now, 2);
  const item = attachBackupHistory(
    progressBackupItem('progress-preview', 'Progress preview', { ok: false, status: 'missing', key: 'd1/progress/preview/latest.json' }, 'preview', 'progress-otp-preview', now),
    history,
    now
  );
  assert.equal(item.ok, false);
  assert.equal(item.history_7d[0].status, 'missing');
  assert.notEqual(item.consecutive_failures, 0);
});

test('preview history counts consecutive manifest failures and resets at a success', async () => {
  const preview = (timestamp, overrides = {}) => ({
    kind: 'progress-d1-backup', environment: 'preview', database: 'progress-otp-preview',
    generated_at: timestamp, object_key: `d1/progress/preview/${timestamp.replace(/[:.]/g, '-')}.json`, ...overrides
  });
  const bucket = memoryBucket('dedicated', {
    'd1/progress/preview/2026-07-19T01-00-00-000Z.json': { data: { broken: true } },
    'd1/progress/preview/2026-07-18T01-00-00-000Z.json': { data: preview('2026-07-18T01:00:00.000Z') },
    'd1/progress/preview/2026-07-17T01-00-00-000Z.json': { data: preview('2026-07-17T01:00:00.000Z') }
  });
  const history = await readProgressBackupHistory(bucket, 'preview', 'progress-otp-preview', new Date('2026-07-19T04:00:00.000Z'), 3);
  assert.equal(history[0].ok, false);
  assert.equal(history[1].ok, true);
  const item = attachBackupHistory({ key: 'progress-preview', ok: false, status: 'stale', latest_at: '' }, history);
  assert.equal(item.consecutive_failures, 1);
  assert.equal(item.last_success_at, '2026-07-18T01:00:00.000Z');
});

test('preview history accepts only strict timestamp keys and ignores invalid keys regardless of uploaded metadata', async () => {
  const validKey = 'd1/progress/preview/2026-07-18T01-00-00-000Z.json';
  const bucket = memoryBucket('dedicated', {
    [validKey]: { data: {
      kind: 'progress-d1-backup', environment: 'preview', database: 'progress-otp-preview',
      generated_at: '2026-07-18T01:00:00.000Z', object_key: validKey
    } },
    'd1/progress/preview/latest.json': { uploaded: '2026-07-19T03:00:00.000Z', data: { status: 'complete' } },
    'd1/progress/preview/2026-07-19T01-00-00Z.json': { uploaded: '2026-07-19T03:00:00.000Z', data: {} },
    'd1/progress/preview/2026-07-19T01-00-00-000Z.json.bak': { uploaded: '2026-07-19T03:00:00.000Z', data: {} },
    'd1/progress/preview/2026-07-32T01-00-00-000Z.json': { uploaded: '2026-07-19T03:00:00.000Z', data: {} },
    'other/d1/progress/preview/2026-07-19T01-00-00-000Z.json': { uploaded: '2026-07-19T03:00:00.000Z', data: {} }
  });
  const history = await readProgressBackupHistory(bucket, 'preview', 'progress-otp-preview', new Date('2026-07-19T04:00:00.000Z'), 2);
  assert.equal(history[0].ok, false);
  assert.equal(history[1].ok, true);
  assert.equal(history.filter((row) => row.ok).length, 1);
  assert.deepEqual(bucket.calls.filter((call) => call.startsWith('get:')), [`get:${validKey}`]);
  const item = attachBackupHistory({ key: 'progress-preview', ok: false, status: 'stale', latest_at: '' }, history, new Date('2026-07-19T04:00:00.000Z'));
  assert.equal(item.consecutive_failures, 1);
  assert.equal(item.success_rate_7d, 0.5);
});

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

test('missing same-day daily history does not override a fresh latest manifest', () => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const item = attachBackupHistory({
    key: 'bjt',
    ok: true,
    status: 'ok',
    latest_at: '2026-07-18T18:00:00.000Z'
  }, [
    { date: today, ok: false, status: 'missing', error: 'not_found' },
    { date: '2026-07-18', ok: true, latest_at: '2026-07-18T18:00:00.000Z' },
    { date: '2026-07-17', ok: true, latest_at: '2026-07-17T18:00:00.000Z' }
  ]);

  assert.equal(item.ok, true);
  assert.equal(item.status, 'ok');
  assert.equal(item.consecutive_failures, 0);
  assert.equal(item.failure_date, '');
});

test('R2 JSON reads retry transient Cloudflare 10001 get errors', async () => {
  let attempts = 0;
  const result = await readR2Json({
    async get() {
      attempts += 1;
      if (attempts < 3) throw new Error('get: We encountered an internal error. Please try again. (10001)');
      return {
        uploaded: new Date('2026-08-24T00:00:00.000Z'),
        async text() {
          return '{"ok":true}';
        }
      };
    }
  }, 'd1/latest/manifest.json');

  assert.equal(result.ok, true);
  assert.equal(result.attempts, 3);
  assert.deepEqual(result.data, { ok: true });
});

test('R2 JSON reads do not retry permanent JSON parse errors into success', async () => {
  const result = await readR2Json({
    async get() {
      return {
        async text() {
          return '{bad json';
        }
      };
    }
  }, 'bad.json');

  assert.equal(result.ok, false);
  assert.equal(result.status, 'error');
  assert.match(result.error, /JSON|Expected|position/i);
});

test('missing same-day daily history still marks an already-failed backup as silent', () => {
  const afterNoon = new Date('2026-07-18T04:00:00.000Z'); // 13:00 JST
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(afterNoon);
  const item = attachBackupHistory({
    key: 'progress-production',
    ok: false,
    status: 'stale',
    latest_at: '2026-07-17T18:00:00.000Z'
  }, [
    { date: today, ok: false, status: 'missing', error: 'not_found' },
    { date: '2026-07-18', ok: true, latest_at: '2026-07-18T18:00:00.000Z' }
  ], afterNoon);

  assert.equal(item.ok, false);
  assert.equal(item.status, 'silent');
  assert.equal(item.error, 'not_found');
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

test('deployment alerts only include failed runs and timed-out in-progress runs', () => {
  const now = new Date('2026-08-24T01:00:00.000Z');
  const success = deploymentWorkflowStatus('bjt', {
    head_branch: 'main',
    name: 'Atomic Release',
    status: 'completed',
    conclusion: 'success',
    created_at: '2026-08-24T00:10:00.000Z',
    updated_at: '2026-08-24T00:12:00.000Z'
  }, now);
  const inProgress = deploymentWorkflowStatus('bjt', {
    head_branch: 'main',
    name: 'Atomic Release',
    status: 'in_progress',
    conclusion: null,
    created_at: '2026-08-24T00:40:00.000Z',
    updated_at: '2026-08-24T00:50:00.000Z'
  }, now);
  const failure = deploymentWorkflowStatus('bjt', {
    head_branch: 'main',
    name: 'Atomic Release',
    status: 'completed',
    conclusion: 'failure',
    created_at: '2026-08-24T00:10:00.000Z',
    updated_at: '2026-08-24T00:12:00.000Z'
  }, now);
  const noData = deploymentWorkflowStatus('bjt', null, now);
  const timedOut = deploymentWorkflowStatus('bjt', {
    head_branch: 'main',
    name: 'Atomic Release',
    status: 'in_progress',
    conclusion: null,
    created_at: '2026-08-24T00:20:00.000Z',
    updated_at: '2026-08-24T00:55:00.000Z'
  }, now);

  assert.equal(success.ok, true);
  assert.equal(inProgress.ok, true);
  assert.equal(inProgress.note, '部署进行中');
  assert.equal(noData.manual, true);
  assert.equal(noData.status, 'no_data');
  assert.equal(failure.ok, false);
  assert.equal(failure.alert, true);
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.alert, true);
  assert.equal(timedOut.error, 'deployment_in_progress_timeout');

  const alert = collectAlertItems(
    { items: [] },
    { items: [success, inProgress, failure, noData, timedOut] },
    { targets: [] }
  );
  assert.deepEqual(alert.map((item) => `${item.key}:${item.status}`), [
    'bjt:failure',
    'bjt:in_progress'
  ]);
});
