import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildDailyBriefSubject,
  buildDailyBossBrief,
  classifyDailyBriefSource,
  dailyBriefLamp,
  dailyBriefSentKey,
  jstWindow,
  renderDailyBossBrief,
  sendDailyBossBrief
} from '../src/worker.js';

test('daily brief window starts at JST midnight and ends at generation time', () => {
  const window = jstWindow(Date.parse('2026-09-05T11:00:00.000Z'));
  assert.equal(window.start, '2026-09-04T15:00:00.000Z');
  assert.equal(window.end.toISOString(), '2026-09-05T11:00:00.000Z');
});

test('daily brief source classification keeps unknown evidence out of search channels', () => {
  assert.equal(classifyDailyBriefSource('www.google.com', ''), 'Google');
  assert.equal(classifyDailyBriefSource('chatgpt.com', ''), 'AI');
  assert.equal(classifyDailyBriefSource('www.bing.com', ''), 'Bing');
  assert.equal(classifyDailyBriefSource('l.instagram.com', ''), 'SNS');
  assert.equal(classifyDailyBriefSource('', ''), 'Direct');
  assert.equal(classifyDailyBriefSource('https://unknown.example/', ''), 'Other');
});

test('daily brief lamp colors are deterministic and EI is distinct from green', () => {
  assert.equal(dailyBriefLamp([true, true]).icon, '🟢');
  assert.equal(dailyBriefLamp([true, 'stale']).icon, '🟡');
  assert.equal(dailyBriefLamp([true, false]).icon, '🔴');
  assert.equal(dailyBriefLamp([]).color, 'ei');
  assert.equal(dailyBriefLamp([]).icon, '—');
});

test('sample subject and body use the sample gate and EI fallback', () => {
  const report = {
    generated_at: '2026-09-05T11:00:00.000Z',
    window: { start: '2026-09-05T15:00:00.000Z', end: '2026-09-05T11:00:00.000Z' },
    review_count: null,
    system_red: 0,
    visitors: { totals: { visitors: 3, sessions: 2, pageviews: 4 }, by_source: {} },
    headline: '🟢 今日暂无紧急阻断',
    system: { business_health: [{ name: 'BJT', lamp: dailyBriefLamp([]) }] },
    seo: [{ site: 'translation', host: 'translation.nice.okinawa', seo: dailyBriefLamp([]), geo: dailyBriefLamp([]), signals: { gsc_latest_available_date: '—' } }],
    review: { available: false },
    top_actions: []
  };
  assert.match(buildDailyBriefSubject(report, true), /^【SAMPLE｜Nice Okinawa Daily】09\/05｜待审核—｜系统0红｜今日访客3$/);
  assert.match(renderDailyBossBrief(report), /EI \/ 数据暂不可用/);
});

test('formal daily brief cron is 20:00 JST and old 08:30 summary cron is absent', () => {
  const source = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
  const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(source, /DAILY_BRIEF_SAMPLE_PATH = '\/daily-brief\/sample'/);
  assert.match(source, /DAILY_BOSS_BRIEF_CRON = '0 11 \* \* \*'/);
  assert.match(wrangler, /crons = \[/);
  assert.match(wrangler, /"0 11 \* \* \*"/);
  assert.match(wrangler, /"\*\/15 \* \* \* \*"/);
  assert.doesNotMatch(wrangler, /"30 23 \* \* \*"/);
  assert.doesNotMatch(source, /08:30 summary/);
});

test('daily brief idempotency key uses the JST date', () => {
  assert.equal(dailyBriefSentKey(new Date('2026-09-07T11:00:00.000Z')), 'daily_brief_sent:2026-09-07');
});

test('official daily brief subject has no SAMPLE prefix', () => {
  const report = sampleReport();
  assert.equal(buildDailyBriefSubject(report, false), '【Nice Okinawa Daily】09/07｜待审核2｜系统1红｜今日访客12');
  assert.equal(buildDailyBriefSubject(report, true), '【SAMPLE｜Nice Okinawa Daily】09/07｜待审核2｜系统1红｜今日访客12');
});

test('official send is idempotent for one JST date and does not repeat on manual retrigger', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: `email-${calls.length}` }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const env = fakeDailyBriefEnv();
    const now = new Date('2026-09-07T11:00:00.000Z');
    const first = await sendDailyBossBrief(env, now, { report: sampleReport(), reason: 'manual' });
    const second = await sendDailyBossBrief(env, now, { report: sampleReport(), reason: 'cron' });
    assert.equal(first.sent, true);
    assert.equal(first.subject, '【Nice Okinawa Daily】09/07｜待审核2｜系统1红｜今日访客12');
    assert.equal(second.sent, false);
    assert.equal(second.skipped, true);
    assert.equal(second.reason, 'already_sent');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.to[0], 'aboutokinawa@gmail.com');
    assert.doesNotMatch(calls[0].body.subject, /SAMPLE/);
    assert.equal(env.DB.dailyBriefMarkers.has('daily_brief_sent:2026-09-07'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sample send remains available without writing the idempotency marker', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: 'sample-email' }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const env = fakeDailyBriefEnv();
    const sent = await sendDailyBossBrief(env, new Date('2026-09-07T11:00:00.000Z'), { report: sampleReport(), sample: true });
    assert.equal(sent.sent, true);
    assert.match(sent.subject, /^【SAMPLE｜Nice Okinawa Daily】/);
    assert.equal(calls.length, 1);
    assert.equal(env.DB.dailyBriefMarkers.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('one unavailable data source stays EI and does not block the brief render', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('review_down');
  };
  try {
    const env = fakeDailyBriefEnv({ dbMode: 'throw' });
    const report = await buildDailyBossBrief(env, new Date('2026-09-07T11:00:00.000Z'));
    assert.equal(report.window.start, '2026-09-06T15:00:00.000Z');
    assert.equal(report.window.end, '2026-09-07T11:00:00.000Z');
    assert.equal(report.review.available, false);
    assert.match(renderDailyBossBrief(report), /EI \/ 数据暂不可用/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function sampleReport() {
  return {
    generated_at: '2026-09-07T11:00:00.000Z',
    window: { start: '2026-09-06T15:00:00.000Z', end: '2026-09-07T11:00:00.000Z' },
    review_count: 2,
    system_red: 1,
    visitors: { totals: { visitors: 12, sessions: 9, pageviews: 30 }, by_source: { Google: { views: 5 }, Direct: { views: 3 } } },
    headline: '🔴 有系统红项，先处理阻断项',
    review: { available: true, value: { groups: { BJT: 2 }, entry: 'https://db.nice.okinawa/review' } },
    system: { red_items: [{ detail: 'path red' }], business_health: [{ name: 'BJT', lamp: dailyBriefLamp([true]) }] },
    seo: [{ site: 'bjt', host: 'bjt.nice.okinawa', seo: dailyBriefLamp([true]), geo: dailyBriefLamp([true]), signals: { gsc_latest_available_date: '2026-09-06' } }],
    sns: { available: false },
    top_actions: ['path red'],
    sources: {}
  };
}

function fakeDailyBriefEnv(options = {}) {
  return {
    RESEND_API_KEY: 'test_resend_key',
    ALERT_FROM_EMAIL: 'Nice Okinawa <noreply@nice.okinawa>',
    ALERT_RECIPIENTS: 'ops@example.invalid',
    REVIEW_TASK_API_URL: options.reviewUrl || '',
    DB: fakeDb(options.dbMode)
  };
}

function fakeDb(mode = 'empty') {
  const dailyBriefMarkers = new Map();
  return {
    dailyBriefMarkers,
    prepare(sql) {
      if (mode === 'throw') throw new Error('db_unavailable');
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async all() { return { results: [] }; },
        async first() {
          if (/FROM daily_brief_sent/i.test(sql)) {
            const [key] = this.values;
            return dailyBriefMarkers.get(key) || null;
          }
          return null;
        },
        async run() {
          if (/INSERT INTO daily_brief_sent/i.test(sql)) {
            const [key, jstDate, startedAt, reason] = this.values;
            const existing = dailyBriefMarkers.get(key);
            if (existing && existing.status !== 'failed') return { success: true, meta: { changes: 0 } };
            dailyBriefMarkers.set(key, {
              key,
              jst_date: jstDate,
              status: 'sending',
              started_at: startedAt,
              reason
            });
            return { success: true, meta: { changes: 1 } };
          }
          if (/SET status = 'sent'/i.test(sql)) {
            const [sentAt, subject, , key] = this.values;
            const existing = dailyBriefMarkers.get(key) || { key };
            dailyBriefMarkers.set(key, { ...existing, status: 'sent', sent_at: sentAt, subject, error: null });
          }
          if (/SET status = 'failed'/i.test(sql)) {
            const [error, , key] = this.values;
            const existing = dailyBriefMarkers.get(key) || { key };
            dailyBriefMarkers.set(key, { ...existing, status: 'failed', error });
          }
          return { success: true, meta: { changes: 1 } };
        }
      };
    }
  };
}
