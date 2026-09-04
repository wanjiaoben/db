import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import worker, {
  assertReadOnlySql,
  auditMonthRangeJst,
  buildAuditHumanMetricRows,
  collectAuditBjtOrderAggregates,
  collectAuditProgressAggregates,
  createReadOnlyD1,
  createReadOnlyKv,
  getAuditHumanMetricsStatus,
  runAuditHumanMetrics,
  validateAuditHumanDataPlan
} from '../src/worker.js';

import auditHumanDataPlan from '../audit-human-data-plan.json' with { type: 'json' };

function memoryAnalyticsDb() {
  const state = { metrics: new Map(), trial: { visitors: 3, pageviews: 9 }, content: { visitors: 2, pageviews: 5 } };
  return {
    state,
    prepare(sql) {
      const statement = { params: [] };
      return {
        bind(...params) { statement.params = params; return this; },
        async run() {
          if (/INSERT INTO audit_human_metrics/.test(sql)) {
            const [month, question_id, value, source, computed_at, evidence_status] = statement.params;
            state.metrics.set(month + ':' + question_id, { month, question_id, value, source, computed_at, evidence_status });
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          if (/audit:trial/.test(sql)) return state.trial;
          if (/audit:content/.test(sql)) return state.content;
          if (/FROM audit_human_metrics/.test(sql) && /LIMIT 1/.test(sql)) {
            return [...state.metrics.values()].sort((a, b) => b.computed_at.localeCompare(a.computed_at) || b.month.localeCompare(a.month))[0] || null;
          }
          return null;
        },
        async all() {
          if (/GROUP BY evidence_status/.test(sql)) {
            const month = statement.params[0];
            const counts = new Map();
            for (const row of state.metrics.values()) {
              if (row.month !== month) continue;
              counts.set(row.evidence_status, (counts.get(row.evidence_status) || 0) + 1);
            }
            return { results: [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([evidence_status, count]) => ({ evidence_status, count })) };
          }
          if (/FROM audit_human_metrics/.test(sql)) {
            const month = statement.params[0];
            const results = [...state.metrics.values()]
              .filter((row) => row.month === month)
              .sort((a, b) => Number(a.question_id.slice(1)) - Number(b.question_id.slice(1)));
            return { results };
          }
          return { results: [] };
        }
      };
    }
  };
}

function memoryProgressDb() {
  const state = { prepared: [] };
  return {
    state,
    prepare(sql) {
      state.prepared.push(sql);
      const statement = { params: [] };
      return {
        bind(...params) { statement.params = params; return this; },
        async first() {
          if (/audit:progress_active/.test(sql)) return { count: 4 };
          if (/audit:progress_cumulative/.test(sql)) return { count: 2 };
          return null;
        },
        async all() { return { results: [] }; },
        async run() { throw new Error('progress write reached fake DB'); }
      };
    },
    async exec() { throw new Error('progress exec reached fake DB'); },
    async batch() { throw new Error('progress batch reached fake DB'); }
  };
}

function memoryKv(rows) {
  const state = { putCalls: 0, deleteCalls: 0 };
  return {
    state,
    async list({ prefix }) {
      return { list_complete: true, keys: Object.keys(rows).filter((key) => key.startsWith(prefix)).map((name) => ({ name })) };
    },
    async get(key, options) {
      assert.equal(options?.type, 'json');
      return rows[key] || null;
    },
    async put() { state.putCalls += 1; throw new Error('kv write reached fake KV'); },
    async delete() { state.deleteCalls += 1; throw new Error('kv delete reached fake KV'); }
  };
}

function artifactBucket() {
  const state = { writes: [] };
  return {
    state,
    async put(key, body, options) {
      state.writes.push({ key, body: JSON.parse(body), options });
    }
  };
}

function bjtKvFixture() {
  return memoryKv({
    'paypal_order_meta:paid-1': {
      order_id: 'paid-1',
      email: 'alpha@example.test',
      amount: '7200',
      currency: 'JPY',
      status: 'captured',
      created_at: '2026-08-03T01:00:00.000Z',
      captured_at: '2026-08-03T01:05:00.000Z',
      first_ref: 'google.com',
      first_landing: '/guide/bjt-pro',
      first_utm: { utm_source: 'google' }
    },
    'paypal_order_meta:paid-2': {
      order_id: 'paid-2',
      email: 'alpha@example.test',
      amount: '7200',
      currency: 'JPY',
      status: 'completed',
      created_at: '2026-08-20T01:00:00.000Z',
      captured_at: '2026-08-20T01:05:00.000Z',
      first_ref: 'chatgpt.com',
      first_landing: '/column/study',
      first_utm: { utm_source: 'chatgpt' }
    },
    'paypal_order_meta:paid-2-older': {
      order_id: 'paid-2',
      email: 'alpha@example.test',
      amount: '7200',
      currency: 'JPY',
      status: 'created',
      created_at: '2026-08-20T00:50:00.000Z'
    },
    'paypal_order_meta:paid-prev': {
      order_id: 'paid-prev',
      email: 'beta@example.test',
      amount: '1900',
      currency: 'JPY',
      status: 'captured',
      created_at: '2026-07-08T01:00:00.000Z',
      captured_at: '2026-07-08T01:05:00.000Z'
    },
    'paypal_order_meta:test': {
      order_id: 'test',
      email: 'cctest@example.test',
      amount: '1',
      currency: 'JPY',
      status: 'captured',
      created_at: '2026-08-08T01:00:00.000Z'
    }
  });
}

function fullEnv(extra = {}) {
  return {
    DB: memoryAnalyticsDb(),
    DASHBOARD_KEY: 'secret-key',
    BJT_KV: bjtKvFixture(),
    PROGRESS_D1: memoryProgressDb(),
    ...extra
  };
}

test('audit human data plan contains exactly the 12 sourced questions', () => {
  const validated = validateAuditHumanDataPlan(auditHumanDataPlan);
  assert.equal(validated.ok, true);
  assert.deepEqual(validated.rows.map((row) => row.question_id), ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12']);
  assert.equal(validated.rows.find((row) => row.question_id === 'q9').evidence_status, 'WAN_PENDING');
});

test('audit JST month ranges use natural month boundaries', () => {
  assert.deepEqual(auditMonthRangeJst('2026-08'), {
    start: '2026-07-31T15:00:00.000Z',
    end: '2026-08-31T15:00:00.000Z'
  });
});

test('readonly wrappers forbid writes and non-SELECT progress SQL', async () => {
  const kv = memoryKv({});
  const readonlyKv = createReadOnlyKv(kv, 'BJT_KV');
  assert.throws(() => readonlyKv.put('x', 'y'), /BJT_KV_write_forbidden/);
  assert.throws(() => readonlyKv.delete('x'), /BJT_KV_write_forbidden/);
  assertReadOnlySql('SELECT COUNT(*) FROM daily_activity', 'PROGRESS_D1');
  assert.throws(() => assertReadOnlySql('UPDATE daily_activity SET review_count = 1', 'PROGRESS_D1'), /PROGRESS_D1_non_select_forbidden/);
  const readonlyD1 = createReadOnlyD1(memoryProgressDb(), 'PROGRESS_D1');
  assert.throws(() => readonlyD1.prepare('SELECT 1').bind().run(), /PROGRESS_D1_write_forbidden/);
  assert.throws(() => readonlyD1.exec('SELECT 1'), /PROGRESS_D1_write_forbidden/);
  assert.throws(() => readonlyD1.batch([]), /PROGRESS_D1_write_forbidden/);
});

test('BJT order aggregate reads KV only and dedupes paid records', async () => {
  const kv = bjtKvFixture();
  const result = await collectAuditBjtOrderAggregates({ BJT_KV: kv }, '2026-08');
  assert.equal(result.ok, true);
  assert.equal(result.current_paid_count, 2);
  assert.equal(result.current_paid_accounts, 1);
  assert.equal(result.current_new_accounts, 1);
  assert.equal(result.current_repeat_accounts, 0);
  assert.equal(result.attributed_count, 2);
  assert.deepEqual(result.amount_by_currency, { JPY: 14400 });
  assert.equal(kv.state.putCalls, 0);
  assert.equal(kv.state.deleteCalls, 0);
});

test('Progress aggregate uses SELECT only and returns anonymous counts', async () => {
  const db = memoryProgressDb();
  const result = await collectAuditProgressAggregates({ PROGRESS_D1: db }, '2026-08');
  assert.equal(result.ok, true);
  assert.equal(result.active_15_day_accounts, 4);
  assert.equal(result.cumulative_300_answer_accounts, 2);
  assert.equal(db.state.prepared.every((sql) => /^\/\* audit:progress_/.test(sql)), true);
});

test('audit metric rows turn connected sources into OK and keep q9 pending', () => {
  const rows = buildAuditHumanMetricRows(validateAuditHumanDataPlan(auditHumanDataPlan).rows, '2026-08', '2026-09-01T00:00:00.000Z', {
    visitors: { ok: true, trial: { visitors: 3, pageviews: 9 }, content: { visitors: 2, pageviews: 5 } },
    orders: { ok: true, current_new_accounts: 1, current_paid_accounts: 1, current_paid_count: 2, current_repeat_accounts: 0, renewal_rate: 0, amount_by_currency: { JPY: 14400 }, attributed_count: 2, attribution_rate: 1, top_sources: [{ key: 'google', count: 1 }], top_landings: [{ key: '/guide/bjt-pro', count: 1 }], content_paid_count: 1, content_amount_by_currency: { JPY: 7200 } },
    progress: { ok: true, active_15_day_accounts: 4, cumulative_300_answer_accounts: 2 }
  });
  assert.equal(rows.length, 12);
  assert.equal(rows.filter((row) => row.evidence_status === 'OK').length, 9);
  assert.equal(rows.filter((row) => row.evidence_status === 'EI').length, 2);
  const q9 = rows.find((row) => row.question_id === 'q9').value;
  assert.equal(q9.evidence_status, 'WAN_PENDING');
  assert.equal(q9.metrics.denominator_policy, 'excluded_until_wan_fills');
  assert.equal(rows.find((row) => row.question_id === 'q3').value.metrics.anonymous_trial_or_study_visitors, 3);
  assert.equal(rows.find((row) => row.question_id === 'q7').value.metrics.active_15_day_count, 4);
});

test('runAuditHumanMetrics writes 12 rows idempotently and writes isolated artifact when R2 exists', async () => {
  const bucket = artifactBucket();
  const db = memoryAnalyticsDb();
  const runEnv = fullEnv({ DB: db, AUDIT_ARTIFACTS: bucket, AUDIT_ARTIFACTS_PREFIX: 'audit/human-metrics/preview/' });
  const first = await runAuditHumanMetrics(runEnv, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  const second = await runAuditHumanMetrics(runEnv, { month: '2026-08', now: new Date('2026-09-01T00:05:00.000Z') });
  assert.equal(first.rows, 12);
  assert.equal(second.rows, 12);
  assert.equal(db.state.metrics.size, 12);
  assert.equal(second.artifact.status, 'written');
  assert.equal(second.artifact.key, 'audit/human-metrics/preview/2026-08.json');
  assert.equal(bucket.state.writes.at(-1).key, 'audit/human-metrics/preview/2026-08.json');
  assert.equal(second.evidence_summary.OK, 9);
  assert.equal(second.evidence_summary.EI, 2);
  assert.equal(second.evidence_summary.WAN_PENDING, 1);
});

test('missing BJT/progress bindings produce EI instead of fake zeroes', async () => {
  const result = await runAuditHumanMetrics({ DB: memoryAnalyticsDb() }, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  assert.equal(result.evidence_summary.EI, 11);
  assert.equal(result.evidence_summary.WAN_PENDING, 1);
  const q1 = result.payload.metrics.find((row) => row.question_id === 'q1');
  const q7 = result.payload.metrics.find((row) => row.question_id === 'q7');
  assert.equal(q1.evidence_status, 'EI');
  assert.equal(q7.evidence_status, 'EI');
  assert.match(q1.missing_read_access.join(' '), /missing_BJT_KV_binding/);
  assert.match(q7.missing_read_access.join(' '), /missing_PROGRESS_D1_binding/);
});

test('audit payload does not contain personal fields, identifiers, or records', async () => {
  const result = await runAuditHumanMetrics(fullEnv(), { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  const text = JSON.stringify(result.payload);
  assert.doesNotMatch(text, /email/i);
  assert.doesNotMatch(text, /order[_-]?id/i);
  assert.doesNotMatch(text, /visitor_id/i);
  assert.doesNotMatch(text, /customer/i);
  assert.doesNotMatch(text, /paypal_order_meta:/i);
  assert.doesNotMatch(text, /\bip\b/i);
});

test('worker source has no direct write calls against read-only business bindings', () => {
  const source = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /env\.BJT_KV\.(put|delete)\s*\(/);
  assert.doesNotMatch(source, /env\.PROGRESS_D1\.(exec|batch)\s*\(/);
  assert.doesNotMatch(source, /env\.PROGRESS_D1\.prepare\([^)]*\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i);
});

test('wrangler audit bindings keep preview sources separate from production', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /binding = "BJT_KV"\nid = "fc382800625e42b7bbfe13830dd39e82"/);
  assert.match(toml, /binding = "PROGRESS_D1"\ndatabase_name = "progress"\ndatabase_id = "bb1b2b68-ace0-4855-8b1c-2e6611c944dd"/);
  assert.match(toml, /binding = "BJT_KV"\nid = "4a016f0e1eb94e14a08d6aa53add61e3"/);
  assert.match(toml, /binding = "PROGRESS_D1"\ndatabase_name = "progress-otp-preview"\ndatabase_id = "1b912362-95bc-4866-b3d3-652cee57dbe4"/);
  assert.match(toml, /binding = "AUDIT_ARTIFACTS"\nbucket_name = "nice-audit-artifacts"/);
  assert.match(toml, /AUDIT_ARTIFACTS_PREFIX = "audit\/human-metrics\/preview\/"/);
});

test('audit human metrics endpoint requires dashboard key and returns stored month JSON', async () => {
  const runEnv = fullEnv();
  await runAuditHumanMetrics(runEnv, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });

  const denied = await worker.fetch(new Request('https://analytics.nice.okinawa/audit/human-metrics?month=2026-08'), runEnv, {});
  assert.equal(denied.status, 403);

  const ok = await worker.fetch(new Request('https://analytics.nice.okinawa/audit/human-metrics?month=2026-08', { headers: { 'x-dashboard-key': 'secret-key' } }), runEnv, {});
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.ok, true);
  assert.equal(data.count, 12);
});

test('audit manual run endpoint writes connected aggregate rows', async () => {
  const runEnv = fullEnv();
  const res = await worker.fetch(new Request('https://analytics.nice.okinawa/audit/human-metrics/run?month=2026-08', {
    method: 'POST',
    headers: { 'x-dashboard-key': 'secret-key' }
  }), runEnv, {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.rows, 12);
  assert.equal(data.evidence_summary.OK, 9);
  assert.equal(data.evidence_summary.EI, 2);
});

test('dashboard renders AUDIT health row', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="auditHumanMetricsTable"/);
  assert.match(html, /AUDIT 数据/);
  assert.match(html, /data.audit_human_metrics/);
});

test('audit status summarizes the latest generated month', async () => {
  const db = memoryAnalyticsDb();
  await runAuditHumanMetrics(fullEnv({ DB: db }), { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  const status = await getAuditHumanMetricsStatus({ DB: db });
  assert.equal(status.configured, true);
  assert.equal(status.latest_month, '2026-08');
  assert.equal(status.evidence_summary.OK, 9);
  assert.equal(status.evidence_summary.EI, 2);
  assert.equal(status.evidence_summary.WAN_PENDING, 1);
});
