const COLLECT_ORIGIN = 'https://translation.nice.okinawa';
const DASHBOARD_ORIGIN = 'https://db.nice.okinawa';
const TRACKING_SCRIPT = `(function(){var endpoint='https://analytics.nice.okinawa/collect';var site=location.hostname;var sessionKey='nice_analytics_session';var start=Date.now();var maxScroll=0;var sectionTimers={};var lastSection='';function uuid(){if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();return String(Date.now())+'-'+Math.random().toString(16).slice(2)}function sid(){try{var e=sessionStorage.getItem(sessionKey);if(e)return e;var id=uuid();sessionStorage.setItem(sessionKey,id);return id}catch(e){return uuid()}}var sessionId=sid();var visitorId=function(){try{var k='nice_analytics_visitor';var e=localStorage.getItem(k);if(e)return e;var id=uuid();localStorage.setItem(k,id);return id}catch(e){return''}}();function lang(){return document.documentElement.dataset.staticLang||document.body.dataset.lang||document.documentElement.lang||navigator.language||''}function depth(){var d=document.documentElement,b=document.body,t=window.scrollY||d.scrollTop||b.scrollTop||0,h=Math.max(b.scrollHeight,d.scrollHeight)-window.innerHeight;if(h<=0)return 100;return Math.max(0,Math.min(100,Math.round(t/h*100)))}function data(type,extra){var out={type:type,site:site,session_id:sessionId,visitor_id:visitorId,path:location.pathname,title:document.title,url:location.href,referrer:document.referrer,lang:lang(),browser_lang:navigator.language||'',screen:(screen&&screen.width?screen.width+'x'+screen.height:''),viewport:window.innerWidth+'x'+window.innerHeight,ts:new Date().toISOString()};if(extra)Object.keys(extra).forEach(function(k){out[k]=extra[k]});return out}function send(type,extra,keepalive){var body=JSON.stringify(data(type,extra));if(navigator.sendBeacon&&keepalive){try{navigator.sendBeacon(endpoint,new Blob([body],{type:'application/json'}));return}catch(e){}}try{fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:body,keepalive:!!keepalive,mode:'cors'}).catch(function(){})}catch(e){}}function contactType(el){var href=el.getAttribute('href')||'',text=(el.textContent||'').toLowerCase();if(href.indexOf('wa.me')>=0||text.indexOf('whatsapp')>=0)return'whatsapp';if(href.indexOf('mailto:')===0||text.indexOf('email')>=0)return'email';if(text.indexOf('wechat')>=0||text.indexOf('okinawaonline')>=0)return'wechat';if(href.indexOf('line')>=0||text.indexOf('line')>=0)return'line';if(href.indexOf('tel:')===0)return'phone';if(href.indexOf('#contact')>=0)return'contact';return''}document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a,button,summary,select');if(!link)return;var label=(link.textContent||link.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,120);var href=link.getAttribute&&link.getAttribute('href');var contact=link.matches('a')?contactType(link):'';var kind=contact?'contact_'+contact:(link.closest('nav')?'nav':(link.tagName||'').toLowerCase());send('click',{event_name:kind,label:label,href:href||'',section:lastSection})},true);window.addEventListener('scroll',function(){maxScroll=Math.max(maxScroll,depth())},{passive:true});if('IntersectionObserver'in window){var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){var id=entry.target.id||entry.target.tagName.toLowerCase();if(entry.isIntersecting){lastSection=id;sectionTimers[id]=Date.now();send('section_view',{section:id})}else if(sectionTimers[id]){var ms=Date.now()-sectionTimers[id];sectionTimers[id]=0;if(ms>800)send('section_time',{section:id,duration_ms:ms})}})},{threshold:.55});document.querySelectorAll('header[id],main[id],section[id]').forEach(function(s){observer.observe(s)})}var qs=new URLSearchParams(location.search);send('page_view',{utm_source:qs.get('utm_source')||'',utm_medium:qs.get('utm_medium')||'',utm_campaign:qs.get('utm_campaign')||''});window.addEventListener('pagehide',function(){send('page_leave',{duration_ms:Date.now()-start,max_scroll:Math.max(maxScroll,depth()),section:lastSection},true)})})();`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (url.pathname === '/collect' && request.method === 'POST') {
      return collect(request, env, ctx);
    }

    if (url.pathname === '/script.js' && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(request.method === 'HEAD' ? null : TRACKING_SCRIPT, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          ...corsHeaders(request)
        }
      });
    }

    if (url.pathname === '/summary' && request.method === 'GET') {
      return summary(request, env);
    }

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'nice-analytics' }, request);
    }

    return json({ ok: false, error: 'not_found' }, request, 404);
  }
};

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : DASHBOARD_ORIGIN;
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-dashboard-key',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function isAllowedOrigin(origin) {
  if (origin === COLLECT_ORIGIN || origin === DASHBOARD_ORIGIN || origin === 'https://nice.okinawa') return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'nice.okinawa' || host.endsWith('.nice.okinawa');
  } catch (e) {
    return false;
  }
}

function json(data, request, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request)
    }
  });
}

function clean(value, max = 500) {
  if (value === undefined || value === null) return '';
  return String(value).slice(0, max);
}

function deviceFromUA(ua) {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobile|iphone|android/.test(s)) return 'mobile';
  return 'desktop';
}

function sourceFromReferrer(referrer, url) {
  const utmSource = clean(url.searchParams.get('utm_source'), 80);
  const utmMedium = clean(url.searchParams.get('utm_medium'), 80);
  const utmCampaign = clean(url.searchParams.get('utm_campaign'), 120);
  if (utmSource) return { source: utmSource, medium: utmMedium || 'utm', campaign: utmCampaign };
  if (!referrer) return { source: 'direct', medium: 'none', campaign: '' };
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host.includes('google.')) return { source: 'google', medium: 'organic', campaign: '' };
    if (host.includes('bing.')) return { source: 'bing', medium: 'organic', campaign: '' };
    if (host.includes('yahoo.')) return { source: 'yahoo', medium: 'organic', campaign: '' };
    if (host.includes('instagram.')) return { source: 'instagram', medium: 'social', campaign: '' };
    if (host.includes('facebook.')) return { source: 'facebook', medium: 'social', campaign: '' };
    if (host.includes('whatsapp.')) return { source: 'whatsapp', medium: 'message', campaign: '' };
    if (host.includes('translation.nice.okinawa')) return { source: 'internal', medium: 'site', campaign: '' };
    return { source: host, medium: 'referral', campaign: '' };
  } catch (e) {
    return { source: 'unknown', medium: 'unknown', campaign: '' };
  }
}

function safeUrl(value) {
  try {
    return new URL(value || 'https://translation.nice.okinawa/');
  } catch (e) {
    return new URL('https://translation.nice.okinawa/');
  }
}

async function collect(request, env, ctx) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_json' }, request, 400);
  }

  const eventUrl = safeUrl(clean(body.url, 1000));
  const source = sourceFromReferrer(clean(body.referrer, 1000), eventUrl);
  const ua = request.headers.get('user-agent') || '';
  const cf = request.cf || {};
  const event = {
    type: clean(body.type, 60) || 'event',
    site: clean(body.site, 120) || 'translation.nice.okinawa',
    session_id: clean(body.session_id, 120),
    visitor_id: clean(body.visitor_id, 120),
    path: clean(body.path || eventUrl.pathname, 300),
    title: clean(body.title, 300),
    url: clean(body.url, 1000),
    referrer: clean(body.referrer, 1000),
    source: source.source,
    medium: source.medium,
    campaign: source.campaign || clean(body.utm_campaign, 120),
    lang: clean(body.lang, 40),
    browser_lang: clean(body.browser_lang, 80),
    country: clean(cf.country, 10),
    colo: clean(cf.colo, 20),
    device: deviceFromUA(ua),
    screen: clean(body.screen, 40),
    viewport: clean(body.viewport, 40),
    event_name: clean(body.event_name, 120),
    label: clean(body.label, 300),
    href: clean(body.href, 1000),
    section: clean(body.section, 120),
    duration_ms: Number.isFinite(Number(body.duration_ms)) ? Math.round(Number(body.duration_ms)) : null,
    max_scroll: Number.isFinite(Number(body.max_scroll)) ? Math.round(Number(body.max_scroll)) : null,
    raw: JSON.stringify(body).slice(0, 4000)
  };

  ctx.waitUntil(env.DB.prepare(`
    INSERT INTO events (
      type, site, session_id, visitor_id, path, title, url, referrer, source, medium, campaign,
      lang, browser_lang, country, colo, device, screen, viewport, event_name, label, href, section,
      duration_ms, max_scroll, raw
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    event.type, event.site, event.session_id, event.visitor_id, event.path, event.title, event.url,
    event.referrer, event.source, event.medium, event.campaign, event.lang, event.browser_lang,
    event.country, event.colo, event.device, event.screen, event.viewport, event.event_name,
    event.label, event.href, event.section, event.duration_ms, event.max_scroll, event.raw
  ).run());

  return json({ ok: true }, request);
}

function requireDashboard(request, env) {
  const expected = env.DASHBOARD_KEY;
  if (!expected) return true;
  return request.headers.get('x-dashboard-key') === expected;
}

async function all(db, sql, params = []) {
  return db.prepare(sql).bind(...params).all().then((r) => r.results || []);
}

async function first(db, sql, params = []) {
  return db.prepare(sql).bind(...params).first();
}

async function summary(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 401);
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || 7), 1), 90);
  const selectedSite = clean(url.searchParams.get('site'), 120);
  const selectedPath = clean(url.searchParams.get('path'), 300);
  const filterClause = `${selectedSite ? ' AND site = ?' : ''}${selectedPath ? ' AND path = ?' : ''}`;
  const filterParams = [...(selectedSite ? [selectedSite] : []), ...(selectedPath ? [selectedPath] : [])];
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const onlineSince = new Date(Date.now() - 5 * 60000).toISOString();

  const totals = await first(env.DB, `
    SELECT
      COUNT(CASE WHEN type='page_view' THEN 1 END) AS page_views,
      COUNT(DISTINCT CASE WHEN type='page_view' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN type='page_view' THEN visitor_id END) AS visitors,
      COUNT(CASE WHEN type='click' THEN 1 END) AS clicks,
      ROUND(AVG(CASE WHEN type='page_leave' AND duration_ms IS NOT NULL THEN duration_ms END)) AS avg_duration_ms,
      ROUND(AVG(CASE WHEN type='page_leave' AND max_scroll IS NOT NULL THEN max_scroll END)) AS avg_scroll
    FROM events
    WHERE created_at >= ?${filterClause}
  `, [since, ...filterParams]);

  const todayTotals = await first(env.DB, `
    SELECT
      COUNT(CASE WHEN type='page_view' THEN 1 END) AS page_views,
      COUNT(DISTINCT CASE WHEN type='page_view' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN type='page_view' THEN visitor_id END) AS visitors
    FROM events
    WHERE created_at >= ?${filterClause}
  `, [todayIso, ...filterParams]);

  const online = await first(env.DB, `
    SELECT COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ?${filterClause}
  `, [onlineSince, ...filterParams]);

  const pages = await all(env.DB, `
    SELECT site, path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ?${selectedSite ? ' AND site = ?' : ''} AND type='page_view'
    GROUP BY site, path
    ORDER BY views DESC
    LIMIT 60
  `, [since, ...(selectedSite ? [selectedSite] : [])]);

  const sites = await all(env.DB, `
    SELECT site, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ? AND type='page_view'
    GROUP BY site
    ORDER BY views DESC
    LIMIT 50
  `, [since]);

  const sources = await all(env.DB, `
    SELECT source, medium, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ?${filterClause} AND type='page_view'
    GROUP BY source, medium
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const sections = await all(env.DB, `
    SELECT section, COUNT(*) AS views, ROUND(AVG(duration_ms)) AS avg_duration_ms
    FROM events
    WHERE created_at >= ?${filterClause} AND section <> ''
    GROUP BY section
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const contacts = await all(env.DB, `
    SELECT event_name, label, COUNT(*) AS clicks
    FROM events
    WHERE created_at >= ?${filterClause} AND type='click' AND event_name LIKE 'contact_%'
    GROUP BY event_name, label
    ORDER BY clicks DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const languages = await all(env.DB, `
    SELECT lang, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ?${filterClause} AND type='page_view'
    GROUP BY lang
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const countries = await all(env.DB, `
    SELECT country, COUNT(*) AS views
    FROM events
    WHERE created_at >= ?${filterClause} AND type='page_view' AND country <> ''
    GROUP BY country
    ORDER BY views DESC
    LIMIT 20
  `, [since, ...filterParams]);

  const devices = await all(env.DB, `
    SELECT device, COUNT(*) AS views
    FROM events
    WHERE created_at >= ?${filterClause} AND type='page_view'
    GROUP BY device
    ORDER BY views DESC
  `, [since, ...filterParams]);

  const recent = await all(env.DB, `
    SELECT created_at, type, site, path, source, country, device, lang, event_name, section, duration_ms, max_scroll
    FROM events
    WHERE created_at >= ?${filterClause}
    ORDER BY created_at DESC
    LIMIT 50
  `, [since, ...filterParams]);

  return json({
    ok: true,
    days,
    selected_site: selectedSite,
    selected_path: selectedPath,
    generated_at: new Date().toISOString(),
    online: online?.sessions || 0,
    totals,
    today: todayTotals,
    sites,
    pages,
    sources,
    sections,
    contacts,
    languages,
    countries,
    devices,
    recent
  }, request);
}
