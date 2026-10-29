import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import worker, {
  classifyConfigSnapshotChange,
  describeConfigSnapshotChanges,
  buildAlertEmailPreview,
  collectConfigSnapshot,
  diffSnapshotJson,
  normalizeSnapshot,
  runConfigSnapshot,
  sanitizeSecretName,
  sha256Hex
} from '../src/worker.js';

function memoryDb() {
  const state = {
    snapshots: [],
    alertSendLog: []
  };
  return {
    state,
    prepare(sql) {
      const statement = { sql, params: [] };
      return {
        bind(...params) {
          statement.params = params;
          return this;
        },
        async run() {
          if (/INSERT INTO config_snapshot/.test(sql)) {
            const [ts, source, json, sha256] = statement.params;
            state.snapshots.push({ id: state.snapshots.length + 1, ts, source, json, sha256 });
            return { meta: { changes: 1, last_row_id: state.snapshots.length } };
          }
          if (/INSERT INTO alert_send_log/.test(sql)) {
            const [key, status, fingerprint, windowStart, reason, detail] = statement.params;
            const exists = state.alertSendLog.some((row) => row.key === key && row.status === status && row.fingerprint === fingerprint && row.window_start === windowStart);
            if (exists) return { meta: { changes: 0 } };
            state.alertSendLog.push({ id: state.alertSendLog.length + 1, key, status, fingerprint, window_start: windowStart, reason, detail, ok: 0 });
            return { meta: { changes: 1, last_row_id: state.alertSendLog.length } };
          }
          if (/UPDATE alert_send_log/.test(sql)) {
            const [ok, error, result, id] = statement.params;
            const row = state.alertSendLog.find((item) => item.id === id);
            if (row) Object.assign(row, { ok, error, result, sent_at: new Date().toISOString() });
            return { meta: { changes: row ? 1 : 0 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          if (/FROM config_snapshot/.test(sql)) {
            const source = statement.params[0];
            const before = statement.params[1] || '9999';
            const rows = state.snapshots
              .filter((row) => row.source === source && row.ts < before)
              .sort((a, b) => b.ts.localeCompare(a.ts) || b.id - a.id);
            return rows[0] || null;
          }
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

function snapshot(extra = {}) {
  return {
    schema_version: 1,
    generated_at: '2026-09-04T00:00:00.000Z',
    cloudflare: {
      configured: true,
      items: [
        {
          key: 'cf.pages_projects',
          items: [
            {
              name: 'bjt',
              domains: ['bjt.nice.okinawa'],
              build_config: { build_command: 'npm run build' },
              env_vars: { DASHBOARD_KEY: 'must-not-store' }
            }
          ]
        }
      ]
    },
    github: {
      configured: true,
      repos: [
        {
          repo: 'wanjiaoben/db',
          required_checks: ['MERGE_GATE'],
          actions_secret_names: ['DASHBOARD_KEY']
        }
      ]
    },
    permissions: [{ target: 'github.wanjiaoben/db.branch', result: 'OK' }],
    pending_authorization: [],
    ...extra
  };
}

test('config snapshot normalization sorts stably and redacts secret-looking values', async () => {
  const a = normalizeSnapshot({ z: ['b', 'a'], token: 'super-secret-value-1234567890', nested: { b: 2, a: 1 } });
  const b = normalizeSnapshot({ nested: { a: 1, b: 2 }, token: 'another-secret-value-1234567890', z: ['a', 'b'] });
  assert.deepEqual(a, b);
  assert.equal(a.token, 'present');
  assert.equal(await sha256Hex(JSON.stringify(a)), await sha256Hex(JSON.stringify(b)));
});

test('readable snapshot changes identify each Worker, route, schedule, Pages and Access field', async () => {
  const before = { generated_at: '2026-10-28T00:07:00Z', cloudflare: { items: [
    { key: 'cf.workers_scripts', items: [{ script_name: 'nice-analytics', modified_on: '2026-10-26T11:57:51Z' }] },
    { key: 'cf.workers_routes', items: [{ pattern: 'db.nice.okinawa/*', script: 'old-worker' }] },
    { key: 'cf.workers.nice-analytics.schedules', items: [{ cron: '0 0 * * *' }] },
    { key: 'cf.pages_projects', items: [{ name: 'test-site', domains: ['old.example'] }] },
    { key: 'cf.access_apps', items: [{ name: 'db-dashboard', session_duration: '24h' }] }
  ] } };
  const after = structuredClone(before);
  after.generated_at = '2026-10-29T00:07:00Z';
  after.cloudflare.items[0].items[0].modified_on = '2026-10-28T11:34:27Z';
  after.cloudflare.items[1].items[0].script = 'new-worker';
  after.cloudflare.items[2].items.push({ cron: '*/5 * * * *' });
  after.cloudflare.items[3].items[0].domains.push('new.example');
  after.cloudflare.items[4].items[0].session_duration = '730h';
  const changes = await describeConfigSnapshotChanges(JSON.stringify(before), JSON.stringify(after));
  const text = JSON.stringify(changes);
  assert.match(text, /nice-analytics/);
  assert.match(text, /2026-10-28 20:34:27/);
  assert.match(text, /old-worker → new-worker/);
  assert.match(text, /new.example/);
  assert.match(text, /24h → 730h/);
  assert.deepEqual(new Set(changes.map((item) => item.type)), new Set(['Worker','route','schedule','Pages','Access']));
  assert.doesNotMatch(text, /generated_at|T11:34:27Z/);
});

test('snapshot email hashes every secret name and lists additions and removals only', async () => {
  const make = (names) => JSON.stringify({ cloudflare: { items: [{ key: 'cf.workers.nice-analytics.secrets', items: names.map((name) => ({ secret_names: [{ name, value: 'must-not-leak' }] })) }] } });
  const changes = await describeConfigSnapshotChanges(make(['OLD_PRIVATE_NAME']), make(['NEW_PRIVATE_NAME']));
  assert.equal(changes.length, 2);
  const email = buildAlertEmailPreview({ ALERT_RECIPIENTS: 'ops@example.invalid' }, 'red', [{ type: 'config_snapshot', latest_at: '2026-10-29T00:07:49.472Z', changes }]);
  assert.match(email.subject, /\[Nice Dashboard\] 配置变更：Cloudflare 2 项/);
  assert.match(email.text, /2026-10-29 09:07:49\.472 JST/);
  assert.match(email.text, /新增 name_hash=[0-9a-f]{64}/);
  assert.match(email.text, /删除 name_hash=[0-9a-f]{64}/);
  assert.doesNotMatch(JSON.stringify(email), /OLD_PRIVATE_NAME|NEW_PRIVATE_NAME|must-not-leak|T00:07/);
});

test('snapshot detail email caps at ten, keeps metadata-only snapshots silent and preserves routing', async () => {
  const changes = Array.from({ length: 12 }, (_, i) => ({ source: 'Cloudflare', type: 'Worker', name: `test-worker-${i}`, change: 'version：old → new' }));
  const email = buildAlertEmailPreview({ ALERT_RECIPIENTS: 'ops@example.invalid' }, 'red', [{ type: 'config_snapshot', latest_at: '2026-10-29T00:07:00Z', changes }]);
  assert.equal(email.text.split('\n').filter((line) => line.startsWith('- ')).length, 10);
  assert.match(email.text, /另 2 条见面板/);
  assert.equal(email.recipient, 'ops@example.invalid');
  assert.deepEqual(await describeConfigSnapshotChanges('{"generated_at":"old"}', '{"generated_at":"new"}'), []);
  assert.match(buildAlertEmailPreview({ ALERT_RECIPIENTS: 'ops@example.invalid' }, 'red', [{ type: 'probe', label: 'test-probe' }]).subject, /ALERT: 1 red item/);
});

test('sensitive business secret names are hashed instead of stored verbatim', () => {
  assert.deepEqual(sanitizeSecretName('DASHBOARD_KEY'), { name: 'DASHBOARD_KEY' });
  const sensitive = sanitizeSecretName('CUSTOMER_EMAIL_KEY');
  assert.equal(sensitive.category, 'email-related');
  assert.match(sensitive.name_hash, /^[0-9a-f]{8}$/);
  assert.equal(JSON.stringify(sensitive).includes('CUSTOMER_EMAIL_KEY'), false);
});

test('config snapshot diff reports changed fields only after baseline', async () => {
  const db = memoryDb();
  const env = {
    DB: db,
    ALERT_RECIPIENTS: 'aboutokinawa@gmail.com',
    ALERT_FROM_EMAIL: 'Nice Okinawa Inquiry <noreply@nice.okinawa>',
    RESEND_API_KEY: 'test-resend'
  };
  const originalFetch = globalThis.fetch;
  const sentSubjects = [];
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://api.resend.com/emails') {
      sentSubjects.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
    }
    throw new Error('unexpected network in config snapshot test');
  };
  try {
    const first = await runConfigSnapshot(env, 'test', { snapshot: snapshot(), notify: true });
    assert.equal(first.changed, false);
    assert.equal(sentSubjects.length, 0);

    const second = await runConfigSnapshot(env, 'test', {
      snapshot: snapshot({ github: { configured: true, repos: [{ repo: 'wanjiaoben/db', required_checks: ['MERGE_GATE', 'extra'], actions_secret_names: ['DASHBOARD_KEY'] }] } }),
      notify: true
    });
    assert.equal(second.changed, true);
    assert.equal(sentSubjects.length, 1);
    assert.match(sentSubjects[0].subject, /\[Nice Dashboard\] 配置变更：GitHub 1 项/);
    assert.match(sentSubjects[0].text, /新增 required_checks\[\]：extra/);
    assert.doesNotMatch(sentSubjects[0].text, /\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    assert.equal(db.state.alertSendLog.length, 1);

    const third = await runConfigSnapshot(env, 'test', {
      snapshot: snapshot({ github: { configured: true, repos: [{ repo: 'wanjiaoben/db', required_checks: ['MERGE_GATE', 'extra'], actions_secret_names: ['DASHBOARD_KEY'] }] } }),
      notify: true
    });
    assert.equal(third.changed, false);
    assert.equal(sentSubjects.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('stub Cloudflare and GitHub responses become a safe config snapshot', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const text = String(url);
    if (text.includes('api.cloudflare.com/client/v4/accounts/acct/access/apps')) {
      return Response.json({ result: [{ name: 'db-dashboard', domain: 'db.nice.okinawa', type: 'self_hosted', aud: 'aud', session_duration: '730h', policies: [{ name: 'Wan', decision: 'allow', include: [{ email: { email: 'masked@example.invalid' } }] }] }] });
    }
    if (text.includes('api.cloudflare.com/client/v4/accounts/acct/access/service_tokens')) return Response.json({ result: [{ name: 'cc-readonly-revenue', duration: 'forever' }] });
    if (text.includes('api.cloudflare.com/client/v4/accounts/acct/pages/projects')) return Response.json({ result: [{ name: 'bjt', domains: ['bjt.nice.okinawa'], production_branch: 'main', build_config: { build_command: 'npm run build' }, deployment_configs: { production: { env_vars: { API_BASE: { value: 'https://example.invalid' }, CUSTOMER_EMAIL_KEY: { value: 'secret' } } } } }] });
    if (text.includes('api.cloudflare.com/client/v4/accounts/acct/workers/scripts')) return Response.json({ result: [{ id: 'nice-analytics', modified_on: '2026-09-04T00:00:00Z' }] });
    if (text.includes('api.cloudflare.com/client/v4/accounts/acct')) return Response.json({ result: { id: 'acct', name: 'account' } });
    if (text.includes('api.github.com/repos/wanjiaoben/db/branches/main')) return Response.json({ protected: true, protection: { required_status_checks: { contexts: ['MERGE_GATE'] } } });
    if (text.includes('api.github.com/repos/wanjiaoben/db/actions/secrets')) return Response.json({ secrets: [{ name: 'DASHBOARD_KEY' }, { name: 'CUSTOMER_EMAIL_KEY' }] });
    if (text.includes('api.github.com/repos/wanjiaoben/db/actions/variables')) return Response.json({ variables: [{ name: 'PUBLIC_FLAG', value: 'no-store' }] });
    if (text.includes('api.github.com/repos/wanjiaoben/db/pages')) return Response.json({ status: 'built', source: { branch: 'main', path: '/' } });
    return new Response('{}', { status: 404 });
  };
  try {
    const data = await collectConfigSnapshot({
      CLOUDFLARE_CONFIG_READ_TOKEN: 'cf-token',
      CLOUDFLARE_ACCOUNT_ID: 'acct',
      GITHUB_TOKEN: 'gh-token',
      CONFIG_SNAPSHOT_GITHUB_REPOS: 'db'
    });
    const safe = normalizeSnapshot(data);
    const text = JSON.stringify(safe);
    assert.match(text, /cf\.access_apps/);
    assert.match(text, /MERGE_GATE/);
    assert.doesNotMatch(text, /https:\/\/example\.invalid/);
    assert.doesNotMatch(text, /CUSTOMER_EMAIL_KEY/);
    assert.doesNotMatch(text, /gh-token|cf-token/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('dashboard renders config snapshot health row', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="configSnapshotTable"/);
  assert.match(html, /配置快照/);
  assert.match(html, /data\.config_snapshot/);
});

test('diffSnapshotJson reports added fields for alert payloads', () => {
  const diff = diffSnapshotJson(JSON.stringify({ a: { b: 1 } }), JSON.stringify({ a: { b: 1, c: 2 } }));
  assert.deepEqual(diff, ['a.c changed']);
});

test('config snapshot diff ignores generated and fetched timestamps', () => {
  const previous = JSON.stringify({
    generated_at: '2026-09-08T00:00:00Z',
    cloudflare: {
      items: [{ key: 'cf.account', fetched_at: '2026-09-08T00:00:01Z', items: [{ name: 'account' }] }]
    }
  });
  const next = JSON.stringify({
    generated_at: '2026-09-08T00:15:00Z',
    cloudflare: {
      items: [{ key: 'cf.account', fetched_at: '2026-09-08T00:15:01Z', items: [{ name: 'account' }] }]
    }
  });
  assert.deepEqual(diffSnapshotJson(previous, next), []);
});

test('worker modified_on near own atomic release is expected, not changed', () => {
  const previous = JSON.stringify({
    cloudflare: {
      items: [{ key: 'cf.workers_scripts', items: [{ id: 'nice-analytics', modified_on: '2026-09-07T00:22:08Z', compatibility_date: '2026-06-12' }] }]
    }
  });
  const next = JSON.stringify({
    cloudflare: {
      items: [{ key: 'cf.workers_scripts', items: [{ id: 'nice-analytics', modified_on: '2026-09-07T22:40:10Z', compatibility_date: '2026-06-12' }] }]
    }
  });
  const result = classifyConfigSnapshotChange(previous, next, [{
    conclusion: 'success',
    headBranch: 'worker-prod-daily-0907-02-20260907',
    headSha: '7cea97f',
    updatedAt: '2026-09-07T22:40:20Z',
    url: 'https://github.com/wanjiaoben/db/actions/runs/34167426573'
  }]);
  assert.equal(result.changed, false);
  assert.equal(result.diff.length, 0);
  assert.equal(result.expected_changes.length, 1);
  assert.equal(result.expected_changes[0].type, 'EXPECTED_OWN_RELEASE');
});

test('worker modified_on without matching atomic release remains changed', () => {
  const previous = JSON.stringify({
    cloudflare: {
      items: [{ key: 'cf.workers_scripts', items: [{ id: 'db-private', modified_on: '2026-09-07T00:22:12Z', compatibility_date: '2026-06-12' }] }]
    }
  });
  const next = JSON.stringify({
    cloudflare: {
      items: [{ key: 'cf.workers_scripts', items: [{ id: 'db-private', modified_on: '2026-09-07T22:40:16Z', compatibility_date: '2026-06-12' }] }]
    }
  });
  const result = classifyConfigSnapshotChange(previous, next, []);
  assert.equal(result.changed, true);
  assert.deepEqual(result.diff, ['cloudflare.items changed']);
});
