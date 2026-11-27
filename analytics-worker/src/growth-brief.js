// HB-428: read-only analysis for the existing nightly email. No beacon/order writes.
const DAY = 86400000;
export const LINES = Object.freeze({ learning: ['学习', ['bjt','exams','kiso','progress']], travel: ['旅游', ['snorkel','rental','fishing','golf','activity','ev']], cars: ['二手车', ['japanusedcars']], other: ['其他', []] });
const AI = new Set(['ChatGPT','Perplexity','Gemini','Claude','Copilot']);
const safeText = v => String(v ?? '').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'***').replace(/[\x00-\x1f]/g,' ');
const clean = v => safeText(v).slice(0,240);
const esc = v => safeText(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jstDate = v => new Date(Date.parse(v)+9*3600000).toISOString().slice(0,10);
const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const siteOf = s => String(s || '').toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'').replace(/\.nice\.okinawa$/,'');
const lineOf = s => Object.keys(LINES).find(k=>LINES[k][1].includes(siteOf(s))) || 'other';
const pathOf = v => { try { return new URL(String(v || '/'),'https://placeholder.invalid').pathname; } catch { return '/'; } };
const pageKey = (site,path) => siteOf(site)+'|'+pathOf(path);
const PAGE_NAMES = Object.freeze({'free-practice':'免费练习','how-to-prepare':'备考方法','bjt-vs-jlpt':'BJT 与 JLPT','what-is-bjt':'BJT 介绍','fishing-seasons':'钓鱼季节','trip-reports':'出海记录','shops':'球具商店','ireland':'爱尔兰进口','auction-sheet':'拍卖单','faq':'常见问题','how-it-works':'进口流程','pricing':'费用说明','trial':'免费体验'});
const pageName = p => {const parts=p.path.split('/').filter(Boolean),last=parts.at(-1);return `${p.site} · ${PAGE_NAMES[last] || (!last||['en','ja','zh-tw','zh-hant','zh-cn','zh-hans'].includes(last)?'首页':last.replace(/\.html$/,'').replace(/-/g,' '))}${parts.length&&['en','ja','zh-tw','zh-hant','zh-cn','zh-hans'].includes(parts[0])?'（'+parts[0]+'）':''}`;};
const inRange = (date,range) => date >= range.start && date < range.end;
const range = (end,days,offset=0) => ({start:new Date(end-(days+offset)*DAY).toISOString(),end:new Date(end-offset*DAY).toISOString()});
const ranked = map => [...map.values()].sort((a,b)=>b.visitors-a.visitors || a.name.localeCompare(b.name));
const delta = (value,baseline) => baseline ? `${value>=baseline?'↑':'↓'}${Math.round(Math.abs(value-baseline)/baseline*100)}%` : value ? '新' : '持平';
export function growthWindows(now=new Date()) {
  const end=Math.floor((now.getTime()+9*3600000)/DAY)*DAY-9*3600000;
  return {day:range(end,1),baseline:range(end,7,1),week:range(end,7),previous:range(end,7,7),older:range(end,7,14),history:range(end,22),monday:new Date(now.getTime()+9*3600000).getUTCDay()===1};
}
export function acquisitionChannel(referrer='',utm='') {
  let host='';
  try {host=new URL(String(referrer).includes('://')?referrer:'https://'+referrer).hostname.toLowerCase().replace(/\.$/,'');} catch {}
  if(host==='nice.okinawa'||host.endsWith('.nice.okinawa')) return null;
  if(['direct','none','unknown','localhost'].includes(host)) host='';
  const u=String(utm).trim().toLowerCase();
  const is = (domains,aliases=[]) => host ? domains.some(d=>host===d||host.endsWith('.'+d)) : aliases.includes(u);
  if(is(['chatgpt.com','chat.openai.com'],['chatgpt','openai'])) return 'ChatGPT';
  if(is(['perplexity.ai'],['perplexity'])) return 'Perplexity';
  if(is(['gemini.google.com'],['gemini'])) return 'Gemini';
  if(is(['claude.ai'],['claude'])) return 'Claude';
  if(is(['copilot.microsoft.com','copilot.com'],['copilot'])) return 'Copilot';
  if((host && /(^|\.)google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host)) || !host&&u==='google') return 'Google';
  if(is(['bing.com'],['bing'])) return 'Bing';
  if(is(['duckduckgo.com'],['duckduckgo','ddg'])) return 'DDG';
  if(is(['yahoo.com','yahoo.co.jp'],['yahoo'])) return 'Yahoo';
  if(is(['facebook.com','instagram.com','tiktok.com','youtube.com','x.com','twitter.com','linkedin.com','line.me','threads.net','pinterest.com','reddit.com','xiaohongshu.com'],['facebook','instagram','tiktok','youtube','twitter','linkedin','line','xiaohongshu','xhs'])) return '社交';
  return host && host.includes('.') ? '其他外站' : null;
}
function outcome(event,line) {
  if(event.event_type==='pageview' && line==='learning' && /(?:^|\/)(?:trial|free(?:-practice)?)(?:\/|$|\.html)/i.test(pathOf(event.landing_path))) return '免费练习';
  if(event.event_type==='contact_click' && ['travel','cars'].includes(line) && (event.contact_channel==='whatsapp'||line==='travel'&&event.contact_channel==='email')) return '联系点击';
  // No form-success or captured-payment event is present in visitor_events.
  return null;
}
function aggregatePeriod(rows,period) {
  const lines=Object.fromEntries(Object.entries(LINES).map(([k,[name]])=>[k,{name,visitors:0,ai:0,outcomes:0,channels:new Map(),pages:new Map(),countries:new Map(),outcomeChannels:new Map()}]));
  const arrivals=new Map();
  for(const e of rows) {
    if(!inRange(e.created_at,period) || e.event_type!=='pageview') continue;
    const channel=acquisitionChannel(e.referrer_host,e.utm_source);
    if(!channel) continue;
    const key=siteOf(e.site_id)+'|'+e.visitor_id;
    if(!arrivals.has(key)) arrivals.set(key,{...e,channel});
  }
  for(const e of arrivals.values()) {
    const line=lines[lineOf(e.site_id)];line.visitors++;if(AI.has(e.channel))line.ai++;
    if(!line.channels.has(e.channel))line.channels.set(e.channel,{name:e.channel,visitors:0,outcomes:0});
    line.channels.get(e.channel).visitors++;
    const key=pageKey(e.site_id,e.landing_path);
    if(!line.pages.has(key))line.pages.set(key,{key,site:siteOf(e.site_id),path:pathOf(e.landing_path),name:key,visitors:0,outcomes:0,channels:new Map(),languages:new Map()});
    const p=line.pages.get(key);p.visitors++;p.channels.set(e.channel,(p.channels.get(e.channel)||0)+1);
    const language=clean(e.ui_lang||e.browser_lang);if(language)p.languages.set(language,(p.languages.get(language)||0)+1);
    if(e.country)line.countries.set(clean(e.country),(line.countries.get(clean(e.country))||0)+1);
  }
  const trialSessions=new Set();
  for(const e of rows) {
    if(!inRange(e.created_at,period)) continue;
    const key=lineOf(e.site_id),kind=outcome(e,key);if(!kind)continue;
    const arrival=arrivals.get(siteOf(e.site_id)+'|'+e.visitor_id);
    // Attribute only to a preceding external arrival, never a later one or guessed identity.
    if(!arrival || e.created_at<arrival.created_at)continue;
    if(kind==='免费练习') {const session=siteOf(e.site_id)+'|'+e.visitor_id+'|'+e.session_id;if(trialSessions.has(session))continue;trialSessions.add(session);}
    const line=lines[key];line.outcomes++;line.channels.get(arrival.channel).outcomes++;
    line.pages.get(pageKey(arrival.site_id,arrival.landing_path)).outcomes++;
    line.outcomeChannels.set(arrival.channel,(line.outcomeChannels.get(arrival.channel)||0)+1);
  }
  return lines;
}
function keywords(input,key,start,end) {
  const first=new Map((input.queryFirst||[]).map(r=>[siteOf(r.site)+'|'+r.query,r.first_date]));
  const map=new Map();
  for(const r of input.gsc||[]) {
    if(lineOf(r.site)!==key || Number(r.period)!==0)continue;
    const id=siteOf(r.site)+'|'+r.query;
    if(!map.has(id))map.set(id,{site:siteOf(r.site),query:clean(r.query),impressions:0,clicks:0,weight:0,pages:new Map(),first:first.get(id)||null});
    const v=map.get(id);v.impressions+=num(r.impressions);v.clicks+=num(r.clicks);v.weight+=num(r.position_weight);v.pages.set(pathOf(r.path),(v.pages.get(pathOf(r.path))||0)+num(r.impressions));
  }
  const rows=[...map.values()].map(v=>({...v,position:v.impressions?v.weight/v.impressions:0,path:[...v.pages].sort((a,b)=>b[1]-a[1])[0]?.[0]||'/'})).sort((a,b)=>b.impressions-a.impressions||a.query.localeCompare(b.query));
  return {lowCtr:rows.filter(v=>v.impressions>=20&&v.clicks/v.impressions<.02).slice(0,5),near:rows.filter(v=>v.position>=8&&v.position<=20).slice(0,5),fresh:rows.filter(v=>v.first&&v.first>=start&&v.first<end).slice(0,5)};
}
export function aggregateGrowthBrief(input,now=new Date(),options={}) {
  const windows=growthWindows(now),cities=new Set([...(options.botCities||[])].map(s=>s.toLowerCase()));
  const rows=(input.events||[]).filter(e=>e.visitor_id&&!cities.has(String(e.city||'').trim().toLowerCase())&&!e.is_bot&&!/bot|crawler|spider|headless/i.test(String(e.user_agent||'')+' '+String(e.device_type||''))).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))||num(a.id)-num(b.id));
  const day=aggregatePeriod(rows,windows.day),week=aggregatePeriod(rows,windows.week),previous=aggregatePeriod(rows,windows.previous),older=aggregatePeriod(rows,windows.older);
  const dailyBaseline=Array.from({length:7},(_,i)=>aggregatePeriod(rows,range(Date.parse(windows.day.start),1,i)));
  const titles=new Map((input.titles||[]).map(r=>[pageKey(r.site,r.path),clean(r.title)]));
  const historyCountries=new Map((input.countryFirst||[]).map(r=>[siteOf(r.site_id)+'|'+r.country,r.first_at]));
  const historyAi=new Map();
  for(const r of input.aiFirst||[])if(AI.has(acquisitionChannel(r.referrer_host,r.utm_source))){const k=pageKey(r.site_id,r.landing_path);if(!historyAi.has(k)||r.first_at<historyAi.get(k))historyAi.set(k,r.first_at);}
  const missing=[],suggestions=[],lines=[],alerts=[];
  for(const [key,[name,sites]] of Object.entries(LINES)) {
    const d=day[key],w=week[key],prev=previous[key],old=older[key];
    if(key==='other'&&!d.visitors&&!w.visitors)continue;
    const average=dailyBaseline.reduce((n,p)=>n+p[key].visitors,0)/7;
    if(key!=='other'&&average>0&&d.visitors<average*.5)alerts.push(name+'站外客人比7日均值少'+Math.round((1-d.visitors/average)*100)+'%');
    const lost=[...new Set(dailyBaseline.flatMap(p=>[...p[key].channels.keys()]))].filter(c=>!d.channels.has(c));
    if(key!=='other'&&lost.length)alerts.push(name+' '+lost.join('/')+'归零');
    const channels=ranked(w.channels).map(v=>({...v,previous:prev.channels.get(v.name)?.visitors||0,change:delta(v.visitors,prev.channels.get(v.name)?.visitors||0)}));
    for(const v of prev.channels.values())if(!w.channels.has(v.name))channels.push({...v,visitors:0,outcomes:0,previous:v.visitors,change:'↓100%'});
    const pages=ranked(w.pages).slice(0,10).map(v=>({...v,name:titles.get(v.key)||pageName(v),channel:[...v.channels].sort((a,b)=>b[1]-a[1])[0]?.[0]||'暂无',newAI:inRange(historyAi.get(v.key)||'',windows.week),languages:undefined,channels:undefined}));
    const coverage=(input.coverage||[]).filter(r=>lineOf(r.site)===key);
    const absent=input.gscAvailable===false?[]:sites.filter(site=>!coverage.some(r=>siteOf(r.site)===site));
    if(absent.length)missing.push(...absent.map(s=>s+' 未接 GSC'));
    const dates=coverage.map(r=>r.latest_date).sort();
    const kw=keywords(input,key,jstDate(windows.week.start),jstDate(windows.week.end));
    const newCountries=[...w.countries.keys()].filter(c=>{const first=[...historyCountries].filter(([k])=>k.endsWith('|'+c)&&lineOf(k.split('|')[0])===key).map(([,at])=>at).sort()[0];return first&&inRange(first,windows.week);});
    const advicePages=ranked(w.pages).map(v=>({...v,name:titles.get(v.key)||pageName(v),newAI:inRange(historyAi.get(v.key)||'',windows.week)}));
    for(const p of prev.pages.values())if(!w.pages.has(p.key))advicePages.push({...p,name:titles.get(p.key)||pageName(p),visitors:0,outcomes:0,newAI:false});
    for(const p of advicePages) {
      if(p.visitors>=3&&p.outcomes===0&&key!=='other')suggestions.push({score:p.visitors*4,text:`${name}：${p.name} 有${p.visitors}位站外客人，未记录${key==='learning'?'免费练习':'联系点击'}，先检查入口文案。`,page:p.key});
      const n1=prev.pages.get(p.key)?.visitors||0,n2=old.pages.get(p.key)?.visitors||0;
      if(n2>n1&&n1>p.visitors)suggestions.push({score:(n2-p.visitors)*5,text:`${name}：${p.name} 连续两周掉量（${n2}→${n1}→${p.visitors}），先检查内容是否过时。`,page:p.key});
      if(p.newAI)suggestions.push({score:10+p.visitors,text:`${name}：${p.name} 首次记录到 AI 来客，补清楚这页的直接答案与来源。`,page:p.key});
    }
    for(const country of newCountries){const entry=rows.find(e=>e.country===country&&lineOf(e.site_id)===key&&inRange(e.created_at,windows.week)&&acquisitionChannel(e.referrer_host,e.utm_source));if(entry)suggestions.push({score:8,text:`${name}：新国家 ${country} 从 ${siteOf(entry.site_id)}${pathOf(entry.landing_path)} 进入，先确认页面语言和服务范围。`,page:pageKey(entry.site_id,entry.landing_path)});}
    for(const q of kw.fresh)suggestions.push({score:Math.min(30,q.impressions/5),text:`${name}：新词「${q.query}」有${q.impressions}次曝光，可在 ${q.site}${q.path} 补一段直接回答。`,page:pageKey(q.site,q.path)});
    lines.push({key,name,daily:{visitors:input.eventsAvailable===false?null:d.visitors,ai:input.eventsAvailable===false?null:d.ai,outcomes:input.eventsAvailable===false?null:d.outcomes,average,change:delta(d.visitors,average),firstChannels:[...d.outcomeChannels].sort((a,b)=>b[1]-a[1])},weekly:{visitors:w.visitors,channels,pages,keywords:kw,newCountries,gscMissing:absent,gscThrough:dates.at(-1)||null,gscAvailable:input.gscAvailable!==false}});
  }
  const seen=new Set();const best=suggestions.sort((a,b)=>b.score-a.score||a.text.localeCompare(b.text)).filter(s=>{if(seen.has(s.page))return false;seen.add(s.page);return true;}).slice(0,3);
  return {generated_at:now.toISOString(),window:windows.day,weekly:options.weekly??windows.monday,week:windows.week,lines,alerts:alerts.length?[alerts.sort((a,b)=>Number(b.includes('少'))-Number(a.includes('少'))).slice(0,3).join('；')]:[],suggestions:best,missing,limitations:['成交、表单成功、二手车询价关联暂无','Plus访客未接入；爬虫标识未采集，已剔除机房城市'],eventsAvailable:input.eventsAvailable!==false};
}
async function select(db,sql,params=[]) {return (await db.prepare(sql).bind(...params).all()).results||[];}
export async function loadGrowthBrief(env,now=new Date(),options={}) {
  const w=growthWindows(now),input={events:[],eventsAvailable:true,gscAvailable:true};
  try {
    let cursor=w.history.start,id=-1;
    for(;;){const page=await select(env.DB,`SELECT id,site_id,visitor_id,session_id,event_type,landing_path,referrer_host,utm_source,country,city,ui_lang,browser_lang,contact_channel,device_type,created_at FROM visitor_events WHERE created_at >= ? AND created_at < ? AND (created_at > ? OR (created_at = ? AND id > ?)) AND event_type IN ('pageview','contact_click') ORDER BY created_at,id LIMIT 1000`,[w.history.start,w.day.end,cursor,cursor,id]);input.events.push(...page);if(page.length<1000)break;cursor=page.at(-1).created_at;id=page.at(-1).id;}
  } catch {input.events=[];input.eventsAvailable=false;}
  if(options.weekly??w.monday) {
    const start=jstDate(w.week.start),end=jstDate(w.week.end),previous=jstDate(w.previous.start),older=jstDate(w.older.start);
    try {
      input.gsc=await select(env.DB,`SELECT site,path,query,MIN(date) AS first_date,MAX(date) AS last_date,SUM(impressions) AS impressions,SUM(clicks) AS clicks,SUM(position*impressions) AS position_weight,CASE WHEN date >= ? THEN 0 WHEN date >= ? THEN 1 ELSE 2 END AS period FROM search_terms WHERE source='google' AND date >= ? AND date < ? GROUP BY site,path,query,period`,[start,previous,older,end]);
      input.coverage=await select(env.DB,"SELECT site,MAX(date) AS latest_date FROM search_terms WHERE source='google' GROUP BY site");
      input.queryFirst=await select(env.DB,"SELECT site,query,MIN(date) AS first_date FROM search_terms WHERE source='google' GROUP BY site,query");
    } catch {input.gscAvailable=false;input.gsc=[];}
    const cities=[...(options.botCities||[])];const cityClause=cities.length?` AND lower(COALESCE(city,'')) NOT IN (${cities.map(()=>'?').join(',')})`:'';
    try {input.countryFirst=await select(env.DB,`SELECT site_id,country,MIN(created_at) AS first_at FROM visitor_events WHERE event_type='pageview'${cityClause} GROUP BY site_id,country`,cities);
      input.aiFirst=await select(env.DB,`SELECT site_id,landing_path,referrer_host,utm_source,MIN(created_at) AS first_at FROM visitor_events WHERE event_type='pageview'${cityClause} AND (lower(COALESCE(referrer_host,'')||' '||COALESCE(utm_source,'')) LIKE '%chatgpt%' OR lower(COALESCE(referrer_host,'')||' '||COALESCE(utm_source,'')) LIKE '%perplexity%' OR lower(COALESCE(referrer_host,'')||' '||COALESCE(utm_source,'')) LIKE '%gemini%' OR lower(COALESCE(referrer_host,'')||' '||COALESCE(utm_source,'')) LIKE '%claude%' OR lower(COALESCE(referrer_host,'')||' '||COALESCE(utm_source,'')) LIKE '%copilot%') GROUP BY site_id,landing_path,referrer_host,utm_source`,cities);
      input.titles=await select(env.DB,"SELECT site,path,MAX(title) AS title FROM events WHERE created_at >= ? AND created_at < ? AND title IS NOT NULL AND title <> '' GROUP BY site,path",[w.history.start,w.day.end]);
    } catch { /* Missing auxiliary data does not invent a first appearance. */ }
  }
  return aggregateGrowthBrief(input,now,options);
}
export function renderGrowthBrief(report) {
  const lines=report.lines||[],when=report.window?.start?new Date(Date.parse(report.window.start)+9*3600000).toISOString().slice(0,10):'暂无';
  const title=`${when} · 客人从哪里来${report.weekly?'｜周报':''}`;
  const daily=lines.filter(l=>l.key!=='other'||l.daily.visitors).map(l=>`${l.name}：站外${l.daily.visitors??'暂无'}（${l.daily.change}）· AI ${l.daily.ai??'暂无'} · ${l.key==='learning'?'练习':'联系'} ${l.daily.outcomes??'暂无'}${l.daily.firstChannels.length?'（'+l.daily.firstChannels.map(([c,n])=>c+' '+n).join('、')+'）':''}`);
  const notes='按站去重，不含直接/站内；成交/表单/询价暂无；Plus采集暂无。';
  const paragraphs=[...daily,...(report.alerts||[]).map(a=>'异常：'+a),notes].slice(0,6);
  const text=[title,...paragraphs],blocks=[];
  const p=(s)=>`<p style="margin:8px 0">${esc(s)}</p>`;
  if(report.weekly)for(const l of lines){if(l.key==='other')continue;const w=l.weekly;
    const sources=!report.eventsAvailable?'访客数据暂无':w.channels.length?w.channels.map(c=>`${c.name} ${c.visitors}（${c.change}；收获${c.outcomes}）`).join(' · '):'暂无站外来客';
    const pages=w.pages.map((r,i)=>`${i+1}. ${r.name} · ${r.channel} ${r.visitors}人 / 收获${r.outcomes}${r.newAI?' · 新AI':''}`);
    const kw=q=>q.map(v=>`${v.site}「${v.query}」${v.impressions}曝/${v.clicks}点/位${v.position.toFixed(1)}`).join('；')||'暂无';
    const keywordLines=w.gscAvailable?[`改标题：${kw(w.keywords.lowCtr)}`,`再推一把：${kw(w.keywords.near)}`,`新词：${kw(w.keywords.fresh)}`]:['关键字：暂无'];
    const coverage=w.gscMissing.length?w.gscMissing.map(s=>s+'：该站未接 GSC').join('；'):'';
    const parts=['怎么找到：'+sources,'落脚点：',...(pages.length?pages:['暂无']),...keywordLines,coverage,w.gscThrough?'GSC 截至 '+w.gscThrough:'',w.newCountries.length?'新国家：'+w.newCountries.join('、'):''].filter(Boolean);
    text.push(l.name+' · 最近7个完整日',...parts);
    blocks.push(`<section data-line="${l.key}" style="background:#fff;border:1px solid #dce4df;border-radius:12px;padding:14px;margin:18px 0"><h2 style="font-size:19px;margin:0 0 8px">${esc(l.name)}</h2>${parts.map(p).join('')}</section>`);
  }
  if(report.weekly){const suggestions=(report.suggestions||[]).map(s=>s.text);text.push('本周建议',...(suggestions.length?suggestions:['暂无足够证据，先保持现有内容。']));blocks.push('<h2 style="font-size:19px">本周建议</h2>'+ (suggestions.length?suggestions:['暂无足够证据，先保持现有内容。']).map(p).join(''));text.push('口径：首触为统计期内首次站外来源；收获只含已采集的免费入口访问/联系点击，不等于咨询送达。机房城市已剔除，其他爬虫识别、语言页对应关系暂无；新指现有记录内首次。');blocks.push(p(text.at(-1)));}
  return {text:text.join('\n'),html:`<!doctype html><html lang="zh-Hans" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head><body style="margin:0;background:#f3f5f4;color:#18372e;font:14px/1.55 -apple-system,BlinkMacSystemFont,PingFang SC,Arial,sans-serif"><main lang="zh-Hans" dir="ltr" style="max-width:600px;margin:auto;padding:20px 16px;overflow-wrap:anywhere"><h1 style="font-size:22px;margin:0 0 14px">${esc(title)}</h1><div data-daily="true">${paragraphs.map(p).join('')}</div>${blocks.join('')}</main></body></html>`};
}
