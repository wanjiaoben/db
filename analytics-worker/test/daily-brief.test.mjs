import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import {
  buildDailyBriefSubject,
  buildDailyBossBrief,
  classifyDailyBriefSource,
  dailyBriefHasGscEvidence,
  dailyBriefLamp,
  dailyBriefPathSignal,
  dailyBriefSentKey,
  dailyBriefRedItems,
  loadDailyBriefVisitors,
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
  assert.equal(classifyDailyBriefSource('', 'google'), 'Google');
  assert.equal(classifyDailyBriefSource('google.com', 'chatgpt'), 'Google');
});

test('daily brief lamp colors are deterministic and EI is distinct from green', () => {
  assert.equal(dailyBriefLamp([true, true]).icon, '🟢');
  assert.equal(dailyBriefLamp([true, 'stale']).icon, '🟡');
  assert.equal(dailyBriefLamp([true, false]).icon, '🔴');
  assert.equal(dailyBriefLamp([]).color, 'ei');
  assert.equal(dailyBriefLamp([]).icon, '—');
});

test('daily brief path status accepts green and ok, red only for red, and missing stays EI-neutral', () => {
  assert.equal(dailyBriefPathSignal({ status: 'green' }), true);
  assert.equal(dailyBriefPathSignal({ status: 'ok' }), true);
  assert.equal(dailyBriefPathSignal({ status: 'red' }), false);
  assert.equal(dailyBriefPathSignal({ status: 'yellow' }), 'ei');
  assert.equal(dailyBriefPathSignal(null), null);
});

test('daily brief GSC evidence requires both latest date and imported_at', () => {
  assert.equal(dailyBriefHasGscEvidence({ latest_available_date: '2026-09-06', imported_at: '2026-09-07T00:00:00Z' }), true);
  assert.equal(dailyBriefHasGscEvidence({ latest_available_date: '2026-09-06', imported_at: null }), false);
  assert.equal(dailyBriefHasGscEvidence({ latest_available_date: '', imported_at: '2026-09-07T00:00:00Z' }), false);
});

test('daily brief business and SEO lamps mirror path states without turning green into red', async () => {
  const env = fakeDailyBriefEnv({
    pathStates: [
      { check_key: 'site-bjt-home', status: 'green' },
      { check_key: 'site-kiso-home', status: 'ok' },
      { check_key: 'site-progress-home', status: 'red' },
      { check_key: 'site-snorkel-home', status: 'green' }
    ],
    gscRows: [
      { site: 'bjt', latest_available_date: '2026-09-06', imported_at: '2026-09-07T00:00:00Z' },
      { site: 'kiso', latest_available_date: '2026-09-06', imported_at: '2026-09-07T00:00:00Z' },
      { site: 'progress', latest_available_date: '2026-09-06', imported_at: '2026-09-07T00:00:00Z' },
      { site: 'snorkel', latest_available_date: '2026-09-06', imported_at: '2026-09-07T00:00:00Z' }
    ]
  });
  const report = await buildDailyBossBrief(env, new Date('2026-09-07T11:00:00.000Z'));
  const business = Object.fromEntries(report.system.business_health.map((row) => [row.name, row.lamp.color]));
  assert.equal(business.KISO, 'green');
  assert.equal(business.Progress, 'red');
  const seo = Object.fromEntries(report.seo.map((row) => [row.site, row]));
  assert.equal(seo.bjt.seo.color, 'green');
  assert.equal(seo.snorkel.seo.color, 'green');
  assert.equal(seo.snorkel.geo.color, 'green');
  assert.equal(seo.progress.seo.color, 'red');
});

test('daily brief GSC zero rows or missing imported_at renders SEO/GEO as EI and not red', async () => {
  const env = fakeDailyBriefEnv({
    pathStates: [{ check_key: 'site-bjt-home', status: 'green' }],
    gscRows: [{ site: 'bjt', latest_available_date: '2026-09-06', imported_at: null }]
  });
  const report = await buildDailyBossBrief(env, new Date('2026-09-07T11:00:00.000Z'));
  const bjt = report.seo.find((row) => row.site === 'bjt');
  assert.equal(bjt.seo.color, 'ei');
  assert.equal(bjt.geo.color, 'ei');
  assert.equal(bjt.evidence_status, 'EI');
  assert.match(renderDailyBossBrief(report), /bjt（bjt\.nice\.okinawa）：SEO —｜GEO —｜GSC latest_available_date 2026-09-06｜EI/);
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

test('review without a connected data source omits both placeholder sections', async () => {
  const report = await buildDailyBossBrief(fakeDailyBriefEnv(), new Date('2026-09-07T11:00:00.000Z'));
  assert.equal(report.review.available, false);
  assert.equal(report.review.status, 'not_configured');
  assert.doesNotMatch(renderDailyBossBrief(report), /Review 摘要|待我处理|未配置/);
});

test('daily brief uses JST times and lists up to five named red items with reasons', () => {
  const report = sampleReport();
  report.system.red_items = Array.from({ length: 7 }, (_, i) => ({ key: `backup-${i}`, label: `备份 ${i}`, detail: '超过 48 小时未更新' }));
  report.system_red = 7;
  const text = renderDailyBossBrief(report);
  assert.match(text, /窗口：2026-09-07 00:00 → 2026-09-07 20:00 JST/);
  assert.match(text, /备份 0：超过 48 小时未更新/);
  assert.match(text, /备份 4：超过 48 小时未更新/);
  assert.doesNotMatch(text, /备份 5：|T11:00:00|T15:00:00/);
  assert.match(text, /另 2 条见面板/);
  assert.match(text, /待我处理：2/);
  assert.match(text, /Review 摘要[\s\S]*BJT：2/);
});

test('daily brief expands dashboard-control children without exposing send history JSON', () => {
  const items = dailyBriefRedItems([{ key: 'dashboard-control', detail: JSON.stringify({
    red_items: [{ type: 'backup', key: 'progress-preview-sql', label: 'Progress preview SQL export', detail: 'latest manifest is older than 48h' }],
    send_history: [{ private: 'must-not-render' }]
  }) }]);
  assert.equal(items.length, 1);
  assert.equal(items[0].key, 'progress-preview-sql');
  assert.match(items[0].detail, /48h/);
  assert.doesNotMatch(JSON.stringify(items), /send_history|must-not-render/);
  assert.equal(dailyBriefRedItems([{ key: 'probe', detail: 'HTTP 500\nfailed' }])[0].detail, 'HTTP 500 failed');
  const stale = dailyBriefRedItems([{ key: 'dashboard-control', detail: JSON.stringify({ red_items: [{
    key: 'progress-preview-sql', status: 'stale', detail: 'latest manifest is older than 48h', latest_at: '2026-10-25T18:18:45.516Z'
  }] }) }]);
  assert.equal(stale[0].detail, '备份超过 48 小时未更新；最近成功 2026-10-26 03:18 JST');
});

test('daily brief attribution counts each visitor once, excludes self-referrals and splits five external hosts', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE visitor_events (id INTEGER PRIMARY KEY, visitor_id TEXT, session_id TEXT, created_at TEXT, event_type TEXT, referrer_host TEXT, utm_source TEXT)');
    const add = db.prepare('INSERT INTO visitor_events (visitor_id,session_id,created_at,event_type,referrer_host,utm_source) VALUES (?,?,?,?,?,?)');
    const insert = (visitor, referrer, utm = '', time = '2026-10-28T01:00:00Z', event = 'pageview') => add.run(visitor, visitor, time, event, referrer, utm);
    insert('one', 'bjt.nice.okinawa');
    insert('one', '', 'chatgpt', '2026-10-28T02:00:00Z');
    insert('one', 'www.google.com', 'chatgpt', '2026-10-28T03:00:00Z');
    insert('one', 'bing.com', '', '2026-10-28T04:00:00Z');
    insert('two', 'FISHING.NICE.OKINAWA.', 'openai');
    insert('three', 'nice.okinawa');
    for (let i = 0; i < 7; i++) insert(`other-${i}`, `external-${i}.example`);
    insert('outside', 'bing.com', '', '2026-10-28T11:00:00.000Z');
    insert('no-pageview', 'bing.com', '', '2026-10-28T02:00:00Z', 'dwell');
    const DB = { prepare(sql) { return { bind(...params) { return {
      async all() { return { results: db.prepare(sql).all(...params) }; },
      async first() { return db.prepare(sql).get(...params); }
    }; } }; } };
    const report = await loadDailyBriefVisitors({ DB }, jstWindow(Date.parse('2026-10-28T11:00:00Z')));
    assert.equal(report.totals.visitors, 10);
    assert.equal(report.by_source.Google.visitors, 1);
    assert.equal(report.by_source.AI.visitors, 1);
    assert.equal(report.by_source.Direct.visitors, 1);
    assert.equal(report.by_source.Bing.visitors, 0);
    assert.equal(report.by_source.Other.visitors, 2);
    assert.equal(Object.keys(report.by_source).filter((key) => key.startsWith('外链 ')).length, 5);
    assert.equal(Object.values(report.by_source).reduce((sum, row) => sum + row.visitors, 0), report.totals.visitors);
    assert.equal(Object.values(report.by_source).reduce((sum, row) => sum + row.views, 0), report.totals.pageviews);
    assert.equal(classifyDailyBriefSource('https://bjt.nice.okinawa/', 'openai'), 'AI');
    assert.equal(classifyDailyBriefSource('bjt.nice.okinawa'), 'Direct');
    const empty = await loadDailyBriefVisitors({ DB }, jstWindow(Date.parse('2026-10-29T11:00:00Z')));
    const text = renderDailyBossBrief({ ...sampleReport(), visitors: empty });
    assert.doesNotMatch(text, /NaN|Infinity|undefined/);
  } finally { db.close(); }
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
    DB: fakeDb(options)
  };
}

function fakeDb(options = {}) {
  const dailyBriefMarkers = new Map();
  const mode = typeof options === 'string' ? options : options.dbMode;
  const pathStates = options.pathStates || [];
  const gscRows = options.gscRows || [];
  return {
    dailyBriefMarkers,
    async batch(statements) {
      for (const statement of statements || []) await statement.run();
      return [];
    },
    prepare(sql) {
      if (mode === 'throw') throw new Error('db_unavailable');
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async all() {
          if (/FROM path_check_state/i.test(sql)) return { results: pathStates };
          if (/FROM search_terms/i.test(sql) && /source = 'google'/i.test(sql)) return { results: gscRows };
          return { results: [] };
        },
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
