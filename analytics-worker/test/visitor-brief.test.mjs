import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { aggregateVisitorBrief, loadVisitorBrief, renderVisitorBrief } from '../src/visitor-brief.js';
import { buildDailyBossBrief, renderDailyBossBrief, jstWindow } from '../src/worker.js';
const event = (id, overrides = {}) => ({ id, site_id: 'bjt', visitor_id: 'private-visitor', session_id: 'private-session', event_type: 'pageview', landing_path: '/start?email=secret@example.com', referrer_host: '', utm_source: '', dwell_ms: null, contact_channel: '', created_at: `2026-11-26T01:00:${String(id).padStart(2,'0')}.000Z`, ...overrides });
const report = (visitors) => ({ generated_at: '2026-11-26T11:00:00Z', window: { start: '2026-11-25T15:00:00Z', end: '2026-11-26T11:00:00Z' }, visitors });
test('same visitor across sites is separate; first-page source wins over later referrers', () => {
  const data = aggregateVisitorBrief([event(1), event(2, {referrer_host:'google.com'}), event(3, {site_id:'progress',referrer_host:'chatgpt.com'}), event(4,{visitor_id:'v2',referrer_host:'bjt.nice.okinawa'})]);
  assert.equal(data.totals.visitors,3); assert.equal(data.totals.pageviews,4);
  assert.equal(data.by_source['直接／来源未传'].visitors,1);
  assert.equal(data.by_source.ChatGPT.visitors,1);
  assert.equal(data.by_source['站内续访／初始来源未知'].visitors,1);
  assert.equal(Object.values(data.by_source).reduce((n,v)=>n+v.views,0),4);
  assert.doesNotMatch(JSON.stringify(data), /private-visitor|private-session|secret@example/);
});
test('dwell is matched only to same site/session/path and before next view; missing differs from zero', () => {
  const rows=[event(1,{landing_path:'/a'}),event(2,{event_type:'dwell',landing_path:'/a',dwell_ms:4200}),event(3,{landing_path:'/a'}),event(4,{event_type:'dwell',landing_path:'/b',dwell_ms:9000}),event(5,{landing_path:'/b'}),event(6,{event_type:'dwell',landing_path:'/a',dwell_ms:88000}),event(7,{event_type:'dwell',landing_path:'/b',dwell_ms:0}),event(8,{landing_path:'/c'}),event(9,{event_type:'dwell',landing_path:'/c',session_id:'other',dwell_ms:99000}),event(10,{event_type:'dwell',landing_path:'/c',dwell_ms:1800999})];
  assert.deepEqual(aggregateVisitorBrief(rows).visitors[0].pages.map(p=>p.seconds),[4,null,0,1800]);
});
test('contact clicks are marked without claiming consultation/payment; output escapes text and masks emails', () => {
  const data=aggregateVisitorBrief([event(1,{landing_path:'/user/person@example.com/<script>',utm_source:'<img src=x onerror=alert(1)>'}),event(2,{event_type:'contact_click',contact_channel:'whatsapp'})]);
  const body=renderVisitorBrief(report(data));
  assert.match(body.html,/点击联系：WhatsApp（不等于已咨询）/);
  assert.match(body.html,/&lt;script&gt;/); assert.doesNotMatch(body.html,/<script>|<img|person@example|secret@example|private-visitor|private-session/);
  assert.match(body.text,/付款、表单咨询暂未与匿名访客可靠关联/);
});
test('missing data never claims zero visitors or zero-record sites; empty successful query does', () => {
  const missing=renderVisitorBrief(report(null));
  assert.match(missing.text,/访客数据暂不可用/); assert.doesNotMatch(missing.text,/0 位访客|无页面记录/);
  const empty=renderVisitorBrief(report(aggregateVisitorBrief([])));
  assert.match(empty.text,/0 位访客/); assert.match(empty.text,/无页面记录/);
});
test('real SQLite query handles >1000 rows, boundary times and only approved sites; reads only', async () => {
  const sqlite=new DatabaseSync(':memory:');
  // Use the actual collector schema, including its event and identity columns.
  const worker=readFileSync(new URL('../schema.sql',import.meta.url),'utf8');
  const schema=worker.match(/CREATE TABLE IF NOT EXISTS visitor_events \([\s\S]*?\n\)/)[0];
  sqlite.exec(schema);
  const insert=sqlite.prepare('INSERT INTO visitor_events (site_id,visitor_id,session_id,event_type,landing_path,referrer_host,utm_source,dwell_ms,contact_channel,created_at,ts) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const add=(id,time,site='bjt')=>insert.run(site,`v${id}`,`s${id}`,'pageview','/','google.com','',null,'',time,time);
  for(let i=0;i<1005;i++) add(i,'2026-11-26T01:00:00.000Z');
  add('before','2026-11-25T14:59:59.999Z'); add('end','2026-11-26T11:00:00.000Z'); add('plus','2026-11-26T01:00:00.000Z','exams');
  const sqls=[];
  const DB={prepare(sql){sqls.push(sql);return{bind(...args){return{all:async()=>({results:sqlite.prepare(sql).all(...args)})}}}}};
  const result=await loadVisitorBrief(DB,jstWindow(Date.parse('2026-11-26T11:00:00.000Z')));
  assert.equal(result.totals.visitors,1005);assert.equal(result.totals.pageviews,1005);assert.equal(sqls.length,2);
  assert.ok(sqls.every(s=>/^SELECT/.test(s))); sqlite.close();
});
test('daily report reads visitor_events only, no payment or health services',async()=>{
  const sqls=[];
  const DB={prepare(sql){sqls.push(sql);return{bind(){return{all:async()=>({results:[]})}}}}};
  const built=await buildDailyBossBrief({DB},new Date('2026-11-26T11:00:00Z'));
  assert.equal(built.weekly,false);assert.equal(built.eventsAvailable,true);
  assert.ok(sqls.length>0 && sqls.every(s=>/^SELECT/.test(s)&&s.includes('FROM visitor_events')));
  assert.doesNotMatch(renderDailyBossBrief(built),/系统红项|营收|SNS 队列|Review 摘要/);
});
