import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import worker, {
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
  globalThis.fetch = async (url) => {
    if (String(url) === 'https://api.resend.com/emails') {
      sentSubjects.push('sent');
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
