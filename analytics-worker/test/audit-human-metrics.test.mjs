import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import worker, {
  auditMonthRangeJst,
  buildAuditHumanMetricRows,
  getAuditHumanMetricsStatus,
  runAuditHumanMetrics,
  validateAuditHumanDataPlan
} from '../src/worker.js';

import auditHumanDataPlan from '../audit-human-data-plan.json' with { type: 'json' };

function memoryDb() {
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

function env(extra = {}) {
  return { DB: memoryDb(), DASHBOARD_KEY: 'secret-key', ...extra };
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

test('audit metric rows preserve EI and keep q9 out of denominators', () => {
  const rows = buildAuditHumanMetricRows(validateAuditHumanDataPlan(auditHumanDataPlan).rows, '2026-08', '2026-09-01T00:00:00.000Z', {
    trial: { visitors: 3, pageviews: 9 },
    content: { visitors: 2, pageviews: 5 }
  });
  assert.equal(rows.length, 12);
  assert.equal(rows.filter((row) => row.evidence_status === 'EI').length, 11);
  const q9 = rows.find((row) => row.question_id === 'q9').value;
  assert.equal(q9.evidence_status, 'WAN_PENDING');
  assert.equal(q9.metrics.denominator_policy, 'excluded_until_wan_fills');
  assert.equal(rows.find((row) => row.question_id === 'q3').value.metrics.anonymous_trial_or_study_visitors, 3);
  assert.equal(rows.find((row) => row.question_id === 'q12').value.metrics.learning_content_pageviews, 5);
});

test('runAuditHumanMetrics writes 12 rows idempotently and reports artifact pending without R2 binding', async () => {
  const db = memoryDb();
  const runEnv = { DB: db };
  const first = await runAuditHumanMetrics(runEnv, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  const second = await runAuditHumanMetrics(runEnv, { month: '2026-08', now: new Date('2026-09-01T00:05:00.000Z') });
  assert.equal(first.rows, 12);
  assert.equal(second.rows, 12);
  assert.equal(db.state.metrics.size, 12);
  assert.equal(second.artifact.status, 'ARTIFACT_R2_PENDING');
  assert.equal(second.evidence_summary.EI, 11);
  assert.equal(second.evidence_summary.WAN_PENDING, 1);
});

test('audit payload does not contain personal fields or records', async () => {
  const db = memoryDb();
  const result = await runAuditHumanMetrics({ DB: db }, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  const text = JSON.stringify(result.payload);
  assert.doesNotMatch(text, /email/i);
  assert.doesNotMatch(text, /order[_-]?id/i);
  assert.doesNotMatch(text, /\bip\b/i);
  assert.doesNotMatch(text, /visitor_id/i);
  assert.doesNotMatch(text, /customer/i);
});

test('audit human metrics endpoint requires dashboard key and returns stored month JSON', async () => {
  const db = memoryDb();
  const runEnv = { DB: db, DASHBOARD_KEY: 'secret-key' };
  await runAuditHumanMetrics(runEnv, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });

  const denied = await worker.fetch(new Request('https://analytics.nice.okinawa/audit/human-metrics?month=2026-08'), runEnv, {});
  assert.equal(denied.status, 403);

  const ok = await worker.fetch(new Request('https://analytics.nice.okinawa/audit/human-metrics?month=2026-08', { headers: { 'x-dashboard-key': 'secret-key' } }), runEnv, {});
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.ok, true);
  assert.equal(data.count, 12);
});

test('audit manual run endpoint writes preview-safe EI rows', async () => {
  const runEnv = env();
  const res = await worker.fetch(new Request('https://analytics.nice.okinawa/audit/human-metrics/run?month=2026-08', {
    method: 'POST',
    headers: { 'x-dashboard-key': 'secret-key' }
  }), runEnv, {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.rows, 12);
  assert.equal(data.artifact.status, 'ARTIFACT_R2_PENDING');
});

test('dashboard renders AUDIT health row', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="auditHumanMetricsTable"/);
  assert.match(html, /AUDIT 数据/);
  assert.match(html, /data.audit_human_metrics/);
});

test('audit status summarizes the latest generated month', async () => {
  const db = memoryDb();
  await runAuditHumanMetrics({ DB: db }, { month: '2026-08', now: new Date('2026-09-01T00:00:00.000Z') });
  const status = await getAuditHumanMetricsStatus({ DB: db });
  assert.equal(status.configured, true);
  assert.equal(status.latest_month, '2026-08');
  assert.equal(status.evidence_summary.EI, 11);
  assert.equal(status.evidence_summary.WAN_PENDING, 1);
});
