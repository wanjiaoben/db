import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildDailyBriefSubject,
  classifyDailyBriefSource,
  dailyBriefLamp,
  jstWindow,
  renderDailyBossBrief
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

test('sample route does not add a 20:00 cron or alter the existing cron list', () => {
  const source = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
  const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(source, /DAILY_BRIEF_SAMPLE_PATH = '\/daily-brief\/sample'/);
  assert.doesNotMatch(source, /20:00|DAILY_BRIEF_CRON/);
  assert.doesNotMatch(wrangler, /20:00|DAILY_BRIEF_CRON/);
  assert.match(wrangler, /crons = \["\*\/15 \* \* \* \*", "18 \* \* \* \*", "0 0 \* \* \*", "0 0 1 \* \*"\]/);
});
