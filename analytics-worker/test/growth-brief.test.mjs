import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { acquisitionChannel, growthWindows, aggregateGrowthBrief, loadGrowthBrief, renderGrowthBrief } from '../src/growth-brief.js';
const now=new Date('2026-11-27T11:00:00Z');
const options={botCities:['Boardman','The Dalles','Ashburn','Council Bluffs'],weekly:true};
const event=(extra={})=>({id:1,created_at:'2026-11-26T01:00:00.000Z',site_id:'bjt',visitor_id:'private-person',session_id:'s1',event_type:'pageview',landing_path:'/en/free-practice/',referrer_host:'google.com',...extra});

test('yesterday and rolling seven-day windows use complete JST days',()=>{
 const w=growthWindows(now);assert.deepEqual(w.day,{start:'2026-11-25T15:00:00.000Z',end:'2026-11-26T15:00:00.000Z'});assert.equal(w.week.start,'2026-11-19T15:00:00.000Z');
});
test('AI domains are distinguished before search engines; internal hops and direct visits excluded',()=>{
 for(const [host,expected] of [['gemini.google.com','Gemini'],['copilot.microsoft.com','Copilot'],['chatgpt.com','ChatGPT'],['perplexity.ai','Perplexity'],['claude.ai','Claude'],['google.co.jp','Google'],['www.google.com.au','Google'],['google.com.evil.example','其他外站'],['bing.com','Bing'],['duckduckgo.com','DDG'],['search.yahoo.co.jp','Yahoo'],['m.facebook.com','社交']])assert.equal(acquisitionChannel(host),expected);
 assert.equal(acquisitionChannel('snorkel.nice.okinawa','google'),null);assert.equal(acquisitionChannel('direct'),null);assert.equal(acquisitionChannel('','chatgpt'),'ChatGPT');assert.equal(acquisitionChannel('','made-up'),null);
});
test('dedupe visits per site, keep first external touch, count trial session once, and do not invent payments',()=>{
 const events=[event(),event({id:2,created_at:'2026-11-26T02:00:00Z',referrer_host:'bing.com'}),event({id:3,created_at:'2026-11-26T03:00:00Z',referrer_host:'bjt.nice.okinawa'}),event({id:4,site_id:'progress',landing_path:'/trial/'}),event({id:5,visitor_id:'bot',city:'Boardman'}),event({id:6,visitor_id:'bot2',user_agent:'Googlebot'}),event({id:7,visitor_id:'internal',referrer_host:'nice.okinawa'})];
 const r=aggregateGrowthBrief({events},now,options),l=r.lines[0];assert.equal(l.daily.visitors,2);assert.equal(l.daily.outcomes,2);assert.deepEqual(l.daily.firstChannels,[['Google',2]]);assert.equal(l.weekly.channels.some(c=>c.name==='Bing'),false);
 const body=renderGrowthBrief(r);assert.doesNotMatch(body.text+body.html,/private-person|bot2|秒|访客 01/);assert.match(body.text,/成交\/表单\/询价暂无/);
});
test('contact clicks require a prior external arrival; form clicks are not submitted enquiries',()=>{
 const events=[event({site_id:'rental',landing_path:'/cars/'}),event({site_id:'rental',event_type:'contact_click',contact_channel:'whatsapp',created_at:'2026-11-26T02:00:00Z'}),event({site_id:'rental',event_type:'contact_click',contact_channel:'form',created_at:'2026-11-26T03:00:00Z'}),event({site_id:'japanusedcars',event_type:'contact_click',contact_channel:'whatsapp'})];
 const r=aggregateGrowthBrief({events},now,options);assert.equal(r.lines.find(l=>l.key==='travel').daily.outcomes,1);assert.equal(r.lines.find(l=>l.key==='cars').daily.outcomes,0);
});
test('GSC weighting, exact JST dates, unseen queries and domain-form site aliases',()=>{
 const gsc=[{site:'exams.nice.okinawa',path:'/x',query:'new keyword',period:0,impressions:40,clicks:0,position_weight:400},{site:'exams.nice.okinawa',path:'/y',query:'new keyword',period:0,impressions:10,clicks:1,position_weight:200}];
 const r=aggregateGrowthBrief({events:[],gsc,coverage:[{site:'exams.nice.okinawa',latest_date:'2026-11-24'}],queryFirst:[{site:'exams.nice.okinawa',query:'new keyword',first_date:'2026-11-26'}]},now,options),w=r.lines[0].weekly;
 assert.equal(w.keywords.near[0].position,12);assert.equal(w.keywords.fresh.length,1);assert.equal(w.keywords.lowCtr.length,0);assert.equal(w.gscMissing.includes('exams'),false);assert.equal(w.gscMissing.includes('progress'),true);
});
test('first country means first in the business line, not first in another site',()=>{
 const r=aggregateGrowthBrief({events:[event({country:'JP'})],countryFirst:[{site_id:'bjt',country:'JP',first_at:'2026-11-26T01:00:00Z'},{site_id:'progress',country:'JP',first_at:'2026-10-01T00:00:00Z'}]},now,options);
 assert.deepEqual(r.lines[0].weekly.newCountries,[]);
});
test('first AI landing gets new marker and advice; recommendations cap at three',()=>{
 const rows=Array.from({length:15},(_,i)=>event({id:i,visitor_id:'v'+i,landing_path:'/article-'+i,referrer_host:'chatgpt.com'}));
 const r=aggregateGrowthBrief({events:rows,aiFirst:rows.map(e=>({...e,first_at:e.created_at}))},now,options);assert.equal(r.lines[0].weekly.pages.length,10);assert.equal(r.lines[0].weekly.pages.every(p=>p.newAI),true);assert.equal(r.suggestions.length,3);
});
test('read-only loader paginates real schema; missing GSC is unavailable, not zero or not connected',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE visitor_events (id INTEGER PRIMARY KEY,site_id,visitor_id,session_id,event_type,landing_path,referrer_host,utm_source,country,city,ui_lang,browser_lang,contact_channel,device_type,created_at)');
 const insert=db.prepare('INSERT INTO visitor_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 for(let i=0;i<1005;i++)insert.run(i,'bjt','v'+i,'s'+i,'pageview','/trial/','google.com','','JP','','en','en','','desktop','2026-11-26T01:00:00.000Z');
 const statements=[];const adapter={prepare(sql){statements.push(sql);assert.match(sql,/^SELECT/);return{bind(...p){return{async all(){return{results:db.prepare(sql).all(...p)}}}}}}};
 const r=await loadGrowthBrief({DB:adapter},now,options);assert.equal(r.lines[0].daily.visitors,1005);assert.equal(r.lines[0].daily.outcomes,1005);assert.equal(r.lines[0].weekly.gscAvailable,false);assert.deepEqual(r.lines[0].weekly.gscMissing,[]);assert.equal(statements.filter(s=>s.includes('ORDER BY created_at,id')).length,2);db.close();
});
test('missing visitor data stays unavailable and email escapes query text',()=>{
 const r=aggregateGrowthBrief({eventsAvailable:false,gscAvailable:false},now,options);const body=renderGrowthBrief(r);assert.match(body.text,/站外 暂无/);assert.doesNotMatch(body.text,/学习：站外0/);assert.match(body.html,/<main lang="zh-Hans" dir="ltr"/);
 r.lines[0].weekly.keywords.fresh=[{site:'bjt',query:'<script>alert(1)</script>',impressions:1,clicks:0,position:10}];r.lines[0].weekly.gscAvailable=true;assert.doesNotMatch(renderGrowthBrief(r).html,/<script>/);
});
test('declining page is recommended even after it disappears from current landings',()=>{
 const events=[...Array.from({length:5},(_,i)=>event({visitor_id:'old'+i,landing_path:'/lost',created_at:'2026-11-08T01:00:00Z'})),...Array.from({length:2},(_,i)=>event({visitor_id:'prev'+i,landing_path:'/lost',created_at:'2026-11-15T01:00:00Z'}))];
 const r=aggregateGrowthBrief({events},now,options);assert.equal(r.lines[0].weekly.pages.length,0);assert.match(r.suggestions[0].text,/5→2→0/);
});
test('HTML keeps the complete keyword list rather than cutting a paragraph at 240 characters',()=>{
 const r=aggregateGrowthBrief({events:[]},now,options);
 r.lines[2].weekly.keywords.fresh=Array.from({length:5},(_,i)=>({site:'japanusedcars',query:'long import question for a customer destination number '+i,impressions:2,clicks:0,position:10}));
 const body=renderGrowthBrief(r);assert.match(body.html,/destination number 4/);
});

test('daily email always has three rolling blocks and new markers last one day only',()=>{
 const input={events:[event({referrer_host:'chatgpt.com',country:'NZ'})],aiFirst:[{site_id:'bjt',landing_path:'/en/free-practice/',referrer_host:'chatgpt.com',first_at:'2026-11-26T01:00:00Z'}],countryFirst:[{site_id:'bjt',country:'NZ',first_at:'2026-11-26T01:00:00Z'}],gsc:[{site:'bjt',path:'/',query:'new q',period:0,impressions:2,clicks:0,position_weight:20}],queryFirst:[{site:'bjt',query:'new q',first_date:'2026-11-26'}]};
 const first=aggregateGrowthBrief(input,now,options),next=aggregateGrowthBrief(input,new Date('2026-11-28T10:00:00Z'),options);
 assert.equal(first.lines[0].weekly.pages[0].newAI,true);assert.deepEqual(first.lines[0].weekly.newCountries,['NZ']);assert.equal(first.lines[0].weekly.keywords.fresh.length,1);
 assert.equal(next.lines[0].weekly.pages[0].newAI,false);assert.deepEqual(next.lines[0].weekly.newCountries,[]);assert.equal(next.lines[0].weekly.keywords.fresh.length,0);
 const body=renderGrowthBrief(first);assert.equal((body.html.match(/<section /g)||[]).length,3);assert.match(body.text,/昨天：站外 1/);assert.doesNotMatch(body.text,/周报|本周建议/);
});
