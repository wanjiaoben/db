const COLLECT_ORIGIN = 'https://translation.nice.okinawa';
const DASHBOARD_ORIGIN = 'https://db.nice.okinawa';
const MONTHLY_ALERT_SELF_CHECK_CRON = '0 0 1 * *';
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

    if (url.pathname === '/control' && request.method === 'GET') {
      return controlDashboard(request, env);
    }

    if (url.pathname === '/probes/run' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 401);
      }
      const result = await runProbes(env, 'manual');
      return json({ ok: true, ...result }, request);
    }

    if (url.pathname === '/alerts/check' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 401);
      }
      const result = await evaluateDashboardAlerts(env, 'manual');
      return json({ ok: true, ...result }, request);
    }

    if (url.pathname === '/alerts/test' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 401);
      }
      try {
        const result = await sendManualTestAlert(env);
        return json({ ok: true, ...result }, request);
      } catch (error) {
        return json({ ok: false, error: clean(error.message || String(error), 300) }, request, 502);
      }
    }

    if (url.pathname === '/alerts/self-check' && request.method === 'POST') {
      if (!requireDashboard(request, env)) {
        return json({ ok: false, error: 'unauthorized' }, request, 401);
      }
      try {
        const result = await sendMonthlyAlertChannelSelfCheck(env, new Date(), 'manual', {
          force: url.searchParams.get('force') === '1'
        });
        return json({ ok: true, ...result }, request);
      } catch (error) {
        return json({ ok: false, error: clean(error.message || String(error), 300) }, request, 502);
      }
    }

    if (url.pathname === '/search-console/sync' && request.method === 'POST') {
      return syncSearchConsole(request, env);
    }

    if (url.pathname === '/search-console/status' && request.method === 'GET') {
      return searchConsoleStatus(request, env);
    }

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'nice-analytics' }, request);
    }

    return json({ ok: false, error: 'not_found' }, request, 404);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduledTasks(event, env));
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

async function runScheduledTasks(event, env) {
  const errors = [];
  const cron = event?.cron || 'cron';
  const scheduledAt = new Date(Number(event?.scheduledTime || Date.now()));

  if (cron === MONTHLY_ALERT_SELF_CHECK_CRON) {
    try {
      await sendMonthlyAlertChannelSelfCheck(env, scheduledAt, cron);
    } catch (e) {
      errors.push(`alert-self-check:${e.message}`);
    }
  }

  try {
    await runProbes(env, cron);
  } catch (e) {
    errors.push(`probes:${e.message}`);
  }

  if (scheduledAt.getUTCHours() === 20) {
    try {
      await syncSearchConsoleRange(env);
    } catch (e) {
      errors.push(`gsc:${e.message}`);
    }
  }
  try {
    await evaluateDashboardAlerts(env, cron);
  } catch (e) {
    errors.push(`alerts:${e.message}`);
  }
  return { ok: errors.length === 0, errors };
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
  const range = clean(url.searchParams.get('range'), 20);
  const days = range === 'today'
    ? 1
    : Math.min(Math.max(Number(url.searchParams.get('days') || 7), 1), 365);
  const selectedSite = clean(url.searchParams.get('site'), 120);
  const selectedPath = clean(url.searchParams.get('path'), 300);
  const filterClause = `${selectedSite ? ' AND site = ?' : ''}${selectedPath ? ' AND path = ?' : ''}`;
  const filterParams = [...(selectedSite ? [selectedSite] : []), ...(selectedPath ? [selectedPath] : [])];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const since = range === 'today' ? todayIso : new Date(Date.now() - days * 86400000).toISOString();
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

  const pageRows = await all(env.DB, `
    WITH page_views AS (
      SELECT site, path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions, COUNT(DISTINCT visitor_id) AS visitors
      FROM events
      WHERE created_at >= ?${filterClause} AND type='page_view'
      GROUP BY site, path
    ),
    source_rank AS (
      SELECT site, path, source, COUNT(*) AS views,
        ROW_NUMBER() OVER (PARTITION BY site, path ORDER BY COUNT(*) DESC) AS rn
      FROM events
      WHERE created_at >= ?${filterClause} AND type='page_view'
      GROUP BY site, path, source
    ),
    lang_rank AS (
      SELECT site, path, lang, COUNT(*) AS views,
        ROW_NUMBER() OVER (PARTITION BY site, path ORDER BY COUNT(*) DESC) AS rn
      FROM events
      WHERE created_at >= ?${filterClause} AND type='page_view'
      GROUP BY site, path, lang
    ),
    contacts AS (
      SELECT site, path, COUNT(*) AS clicks
      FROM events
      WHERE created_at >= ?${filterClause} AND type='click' AND event_name LIKE 'contact_%'
      GROUP BY site, path
    ),
    leave_stats AS (
      SELECT site, path, ROUND(AVG(duration_ms)) AS avg_duration_ms, ROUND(AVG(max_scroll)) AS avg_scroll
      FROM events
      WHERE created_at >= ?${filterClause} AND type='page_leave'
      GROUP BY site, path
    )
    SELECT
      pv.site,
      pv.path,
      pv.views,
      pv.sessions,
      pv.visitors,
      COALESCE(sr.source, '') AS top_source,
      COALESCE(lr.lang, '') AS top_lang,
      COALESCE(c.clicks, 0) AS contact_clicks,
      ls.avg_duration_ms,
      ls.avg_scroll
    FROM page_views pv
    LEFT JOIN source_rank sr ON sr.site = pv.site AND sr.path = pv.path AND sr.rn = 1
    LEFT JOIN lang_rank lr ON lr.site = pv.site AND lr.path = pv.path AND lr.rn = 1
    LEFT JOIN contacts c ON c.site = pv.site AND c.path = pv.path
    LEFT JOIN leave_stats ls ON ls.site = pv.site AND ls.path = pv.path
    ORDER BY pv.views DESC
    LIMIT 100
  `, [since, ...filterParams, since, ...filterParams, since, ...filterParams, since, ...filterParams, since, ...filterParams]);

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

  const searchConsole = await searchConsoleSummary(env.DB, {
    since: range === 'today' ? dateOnly(Date.now()) : dateOnly(Date.now() - days * 86400000),
    site: selectedSite,
    path: selectedPath
  });

  return json({
    ok: true,
    days,
    range: range === 'today' ? 'today' : `${days}d`,
    selected_site: selectedSite,
    selected_path: selectedPath,
    generated_at: new Date().toISOString(),
    online: online?.sessions || 0,
    totals,
    today: todayTotals,
    sites,
    pages,
    page_rows: pageRows,
    sources,
    sections,
    contacts,
    languages,
    countries,
    devices,
    recent,
    search_console: searchConsole
  }, request);
}

async function searchConsoleSummary(db, filters) {
  try {
    const clause = `${filters.site ? ' AND site = ?' : ''}${filters.path ? ' AND path = ?' : ''}`;
    const params = [filters.since, ...(filters.site ? [filters.site] : []), ...(filters.path ? [filters.path] : [])];
    const totals = await first(db, `
      SELECT
        COALESCE(SUM(clicks), 0) AS clicks,
        COALESCE(SUM(impressions), 0) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position,
        MAX(imported_at) AS imported_at
      FROM search_console_daily
      WHERE date >= ?${clause}
    `, params);
    const queries = await all(db, `
      SELECT
        query,
        site,
        path,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
      FROM search_console_daily
      WHERE date >= ?${clause}
      GROUP BY query, site, path
      ORDER BY clicks DESC, impressions DESC
      LIMIT 80
    `, params);
    const pages = await all(db, `
      SELECT
        site,
        path,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks) * 1.0 / SUM(impressions) ELSE 0 END AS ctr,
        CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
      FROM search_console_daily
      WHERE date >= ?${clause}
      GROUP BY site, path
      ORDER BY clicks DESC, impressions DESC
      LIMIT 80
    `, params);
    return { ok: true, totals, queries, pages };
  } catch (e) {
    return { ok: false, error: 'search_console_not_ready' };
  }
}

async function searchConsoleStatus(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 401);
  }
  const data = await searchConsoleSummary(env.DB, {
    since: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    site: '',
    path: ''
  });
  return json({
    ok: true,
    configured: hasSearchConsoleConfig(env),
    sites: configuredSearchConsoleSites(env),
    search_console: data
  }, request);
}

async function syncSearchConsole(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 401);
  }
  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || 7), 1), 365);
  const endDate = url.searchParams.get('end') || dateOnly(Date.now() - 2 * 86400000);
  const startDate = url.searchParams.get('start') || dateOnly(Date.parse(endDate + 'T00:00:00Z') - (days - 1) * 86400000);
  const result = await syncSearchConsoleRange(env, startDate, endDate);
  return json({ ok: true, ...result }, request);
}

async function syncSearchConsoleRange(env, startDate, endDate) {
  if (!hasSearchConsoleConfig(env)) {
    return { configured: false, imported_rows: 0, error: 'missing_search_console_config' };
  }
  const end = endDate || dateOnly(Date.now() - 2 * 86400000);
  const start = startDate || dateOnly(Date.now() - 8 * 86400000);
  const token = await googleAccessToken(env);
  const sites = configuredSearchConsoleSites(env);
  let imported = 0;
  const details = [];
  for (const siteUrl of sites) {
    const rows = await fetchSearchConsoleRows(token, siteUrl, start, end);
    const count = await storeSearchConsoleRows(env.DB, siteUrl, rows);
    imported += count;
    details.push({ site_url: siteUrl, rows: count });
  }
  return { configured: true, start_date: start, end_date: end, imported_rows: imported, sites: details };
}

function hasSearchConsoleConfig(env) {
  return Boolean(env.GSC_CLIENT_EMAIL && env.GSC_PRIVATE_KEY && configuredSearchConsoleSites(env).length);
}

function configuredSearchConsoleSites(env) {
  return clean(env.GSC_SITE_URLS || '', 5000)
    .split(',')
    .map((site) => site.trim())
    .filter(Boolean);
}

function dateOnly(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function googleAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(env.GSC_CLIENT_EMAIL, env.GSC_PRIVATE_KEY, {
    iss: env.GSC_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'google_token_failed');
  }
  return data.access_token;
}

async function signJwt(clientEmail, privateKeyPem, claims) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlJson(header);
  const encodedClaims = base64UrlJson(claims);
  const input = `${encodedHeader}.${encodedClaims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  return `${input}.${base64UrlBytes(signature)}`;
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  const array = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer || bytes);
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function fetchSearchConsoleRows(token, siteUrl, startDate, endDate) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['date', 'page', 'query', 'country', 'device'],
      rowLimit: 25000,
      dataState: 'final'
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'search_console_query_failed');
  }
  return data.rows || [];
}

async function storeSearchConsoleRows(db, siteUrl, rows) {
  if (!rows.length) return 0;
  const statements = rows.map((row) => {
    const keys = row.keys || [];
    const date = clean(keys[0], 20);
    const page = clean(keys[1], 1000);
    const query = clean(keys[2], 500);
    const country = clean(keys[3], 20);
    const device = clean(keys[4], 30);
    const parsed = parsePage(siteUrl, page);
    return db.prepare(`
      INSERT INTO search_console_daily (
        date, site_url, site, page, path, query, country, device, clicks, impressions, ctr, position, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(date, site_url, page, query, country, device) DO UPDATE SET
        site = excluded.site,
        path = excluded.path,
        clicks = excluded.clicks,
        impressions = excluded.impressions,
        ctr = excluded.ctr,
        position = excluded.position,
        imported_at = excluded.imported_at
    `).bind(
      date,
      clean(siteUrl, 300),
      parsed.site,
      page,
      parsed.path,
      query,
      country,
      device,
      Math.round(Number(row.clicks || 0)),
      Math.round(Number(row.impressions || 0)),
      Number(row.ctr || 0),
      Number(row.position || 0)
    );
  });
  await db.batch(statements);
  return statements.length;
}

function parsePage(siteUrl, page) {
  try {
    const parsed = new URL(page);
    return { site: parsed.hostname, path: parsed.pathname || '/' };
  } catch (e) {
    try {
      const fallback = new URL(siteUrl);
      return { site: fallback.hostname, path: '/' };
    } catch (err) {
      return { site: '', path: '/' };
    }
  }
}

const PROBE_TARGETS = [
  {
    key: 'bjt-member',
    label: 'BJT /api/member',
    url: 'https://bjt-worker.gerheidicn.workers.dev/api/member',
    okStatuses: [200, 401, 403],
    authHeader: 'Bearer probe',
    serviceBinding: 'BJT_API'
  },
  {
    key: 'progress-session',
    label: 'Progress /api/session',
    url: 'https://api.progress.nice.okinawa/api/session',
    okStatuses: [200, 401, 403]
  },
  {
    key: 'analytics-health',
    label: 'Analytics /health',
    url: 'https://nice-analytics.gerheidicn.workers.dev/health',
    okStatuses: [200],
    serviceBinding: 'ANALYTICS_API'
  }
];

const DEPLOYMENT_REPOS = ['db', 'bjt', 'progress', 'kiso'];

async function controlDashboard(request, env) {
  if (!requireDashboard(request, env)) {
    return json({ ok: false, error: 'unauthorized' }, request, 401);
  }

  const [backups, deployments, probes, revenue] = await Promise.all([
    getBackupStatus(env),
    getDeploymentStatus(env),
    getProbeSummary(env),
    getRevenueSummary(env)
  ]);

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    backups,
    deployments,
    probes,
    revenue
  }, request);
}

async function ensureProbeTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS probe_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      target TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      ok INTEGER NOT NULL DEFAULT 0,
      status INTEGER,
      duration_ms INTEGER,
      error TEXT,
      reason TEXT
    )
  `).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_probe_results_checked_at ON probe_results(checked_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_probe_results_target_checked ON probe_results(target, checked_at)').run();
}

async function runProbes(env, reason = 'cron') {
  await ensureProbeTable(env);
  const checkedAt = new Date().toISOString();
  const results = await Promise.all(PROBE_TARGETS.map((target) => probeTarget(target, env)));
  if (results.length) {
    await env.DB.batch(results.map((result) => env.DB.prepare(`
      INSERT INTO probe_results (checked_at, target, label, url, ok, status, duration_ms, error, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      checkedAt,
      result.target,
      result.label,
      result.url,
      result.ok ? 1 : 0,
      result.status,
      result.duration_ms,
      result.error || '',
      reason
    )));
  }
  return { checked_at: checkedAt, results };
}

async function probeTarget(target, env) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), 12000);
  try {
    const fetcher = target.serviceBinding ? env[target.serviceBinding] : null;
    const probeRequest = new Request(target.url, {
      method: 'GET',
      headers: {
        accept: 'application/json,text/plain,*/*',
        'user-agent': 'nice-analytics-probe/1.0',
        ...(target.authHeader ? { authorization: target.authHeader } : {})
      },
      signal: controller.signal,
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const res = fetcher ? await fetcher.fetch(probeRequest) : await fetch(probeRequest);
    const status = res.status;
    await res.body?.cancel?.();
    return {
      target: target.key,
      label: target.label,
      url: target.url,
      ok: target.okStatuses.includes(status),
      status,
      duration_ms: Date.now() - started,
      error: ''
    };
  } catch (e) {
    return {
      target: target.key,
      label: target.label,
      url: target.url,
      ok: false,
      status: 0,
      duration_ms: Date.now() - started,
      error: clean(e.message || String(e), 300)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function getProbeSummary(env) {
  await ensureProbeTable(env);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await all(env.DB, `
    SELECT id, target, label, url, ok, status, duration_ms, error, checked_at
    FROM probe_results
    WHERE checked_at >= ?
    ORDER BY checked_at DESC, id DESC
  `, [since]);
  const byTarget = new Map(PROBE_TARGETS.map((target) => [target.key, {
    target: target.key,
    label: target.label,
    url: target.url,
    total: 0,
    ok_count: 0,
    latest: null,
    hourly: []
  }]));
  for (const row of rows) {
    if (!byTarget.has(row.target)) {
      byTarget.set(row.target, {
        target: row.target,
        label: row.label,
        url: row.url,
        total: 0,
        ok_count: 0,
        latest: null,
        hourly: []
      });
    }
    const item = byTarget.get(row.target);
    item.total += 1;
    if (Number(row.ok)) item.ok_count += 1;
    const point = {
      checked_at: row.checked_at,
      ok: Boolean(row.ok),
      status: row.status,
      duration_ms: row.duration_ms,
      error: row.error || ''
    };
    if (!item.latest) item.latest = point;
    item.hourly.push(point);
  }
  return {
    generated_at: new Date().toISOString(),
    window_hours: 24,
    targets: Array.from(byTarget.values()).map((item) => ({
      ...item,
      ok: item.latest ? item.latest.ok : false,
      ok_rate: item.total ? item.ok_count / item.total : 0,
      hourly: item.hourly.slice(0, 24).reverse()
    }))
  };
}

async function getBackupStatus(env) {
  const [bjt, progressProduction, progressPreview] = await Promise.all([
    readR2Json(env.BJT_BACKUPS, 'kv-snapshots/latest/manifest.json'),
    readR2Json(env.PROGRESS_BACKUP, 'd1/progress/production/latest.json'),
    readR2Json(env.PROGRESS_BACKUP, 'd1/progress/preview/latest.json')
  ]);
  return {
    generated_at: new Date().toISOString(),
    items: [
      backupItem('bjt', 'BJT R2 latest manifest', bjt, ['generatedAt', 'generated_at', 'created_at', 'date']),
      progressBackupItem('progress-production', 'Progress production D1 export', progressProduction, 'production', 'progress'),
      progressBackupItem('progress-preview', 'Progress preview D1 export', progressPreview, 'preview', 'progress-otp-preview')
    ]
  };
}

async function readR2Json(bucket, key) {
  if (!bucket) return { ok: false, status: 'manual', key, error: 'missing_r2_binding' };
  try {
    const object = await bucket.get(key);
    if (!object) return { ok: false, status: 'missing', key, error: 'not_found' };
    const text = await object.text();
    return {
      ok: true,
      status: 'ok',
      key,
      updated_at: object.uploaded ? object.uploaded.toISOString() : '',
      data: JSON.parse(text)
    };
  } catch (e) {
    return { ok: false, status: 'error', key, error: clean(e.message || String(e), 300) };
  }
}

const BACKUP_MAX_AGE_HOURS = 27;
const BACKUP_MAX_AGE_MS = BACKUP_MAX_AGE_HOURS * 60 * 60 * 1000;

function backupAge(dateValue, now) {
  const parsed = parseDateSafe(dateValue);
  if (!parsed) return { ageMs: Number.POSITIVE_INFINITY, fresh: false };
  const ageMs = now.getTime() - parsed.getTime();
  return { ageMs, fresh: ageMs >= 0 && ageMs <= BACKUP_MAX_AGE_MS };
}

export function backupItem(key, label, result, dateFields, now = new Date()) {
  const data = result.data || {};
  const dateValue = firstDateValue(data, dateFields) || result.updated_at || '';
  const { ageMs, fresh: ageFresh } = backupAge(dateValue, now);
  const fresh = result.ok && ageFresh;
  return {
    key,
    label,
    object_key: result.key,
    status: fresh ? result.status : (result.ok ? 'stale' : result.status),
    ok: fresh,
    latest_at: dateValue,
    max_age_hours: BACKUP_MAX_AGE_HOURS,
    age_hours: Number.isFinite(ageMs) ? Math.round(ageMs / 36000) / 100 : null,
    error: result.error || (!fresh && result.ok ? `latest manifest is outside 27h freshness window: ${dateValue || '<missing>'}` : ''),
    source: 'R2'
  };
}

export function progressBackupItem(key, label, result, expectedEnvironment, expectedDatabase, now = new Date()) {
  const data = result.data || {};
  const dateValue = firstDateValue(data, ['generated_at', 'generatedAt', 'created_at', 'date']) || result.updated_at || '';
  const { ageMs, fresh: ageFresh } = backupAge(dateValue, now);
  const expectedPrefix = `d1/progress/${expectedEnvironment}/`;
  let validationError = '';
  if (result.ok && data.environment !== expectedEnvironment) {
    validationError = `manifest environment mismatch: expected ${expectedEnvironment}, got ${data.environment || '<missing>'}`;
  } else if (result.ok && data.database !== expectedDatabase) {
    validationError = `manifest database mismatch: expected ${expectedDatabase}, got ${data.database || '<missing>'}`;
  } else if (result.ok && !String(data.object_key || '').startsWith(expectedPrefix)) {
    validationError = `manifest object key crosses environment boundary: ${data.object_key || '<missing>'}`;
  }
  const fresh = result.ok && ageFresh;
  const ok = fresh && !validationError;
  return {
    key,
    label,
    environment: expectedEnvironment,
    database: expectedDatabase,
    object_key: result.key,
    backup_object_key: data.object_key || '',
    status: ok ? 'ok' : (validationError ? 'environment_mismatch' : (result.ok ? 'stale' : result.status)),
    ok,
    latest_at: dateValue,
    max_age_hours: BACKUP_MAX_AGE_HOURS,
    age_hours: Number.isFinite(ageMs) ? Math.round(ageMs / 36000) / 100 : null,
    error: result.error || validationError || (!fresh && result.ok ? `latest manifest is older than 27h: ${dateValue || '<missing>'}` : ''),
    source: 'R2'
  };
}

function firstDateValue(data, fields) {
  for (const field of fields) {
    if (data[field]) return String(data[field]);
  }
  if (data.manifest && typeof data.manifest === 'object') {
    return firstDateValue(data.manifest, fields);
  }
  return '';
}

async function getDeploymentStatus(env) {
  const items = await Promise.all(DEPLOYMENT_REPOS.map((repo) => getRepoDeploymentStatus(env, repo)));
  return {
    generated_at: new Date().toISOString(),
    source: 'GitHub Actions latest main workflow run',
    items
  };
}

async function getRepoDeploymentStatus(env, repo) {
  const token = env.GITHUB_TOKEN || '';
  const url = `https://api.github.com/repos/wanjiaoben/${repo}/actions/runs?branch=main&per_page=10`;
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'nice-analytics-dashboard',
    'x-github-api-version': '2022-11-28'
  };
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        repo,
        ok: false,
        status: 'unknown',
        conclusion: '',
        updated_at: '',
        url: '',
        error: data.message || `github_http_${res.status}`,
        manual: !token
      };
    }
    const run = (data.workflow_runs || []).find((item) => item.head_branch === 'main') || (data.workflow_runs || [])[0];
    if (!run) {
      return { repo, ok: false, status: 'unknown', conclusion: '', updated_at: '', url: '', error: 'no_main_runs', manual: false };
    }
    const conclusion = run.conclusion || run.status || '';
    return {
      repo,
      ok: run.status === 'completed' && run.conclusion === 'success',
      status: run.status || '',
      conclusion,
      workflow: run.name || '',
      updated_at: run.updated_at || run.created_at || '',
      url: run.html_url || '',
      error: ''
    };
  } catch (e) {
    return {
      repo,
      ok: false,
      status: 'error',
      conclusion: '',
      updated_at: '',
      url: '',
      error: clean(e.message || String(e), 300),
      manual: false
    };
  }
}

async function getRevenueSummary(env) {
  const [progress, bjt] = await Promise.all([
    getProgressRevenue(env),
    getBjtRevenue(env)
  ]);
  return {
    generated_at: new Date().toISOString(),
    currency: 'JPY',
    items: [progress, bjt]
  };
}

async function getProgressRevenue(env) {
  const token = env.PROGRESS_ADMIN_TOKEN || '';
  if (!token) return manualRevenueItem('progress', 'missing_PROGRESS_ADMIN_TOKEN', 'https://api.progress.nice.okinawa/api/admin/stats');
  const data = await fetchJsonWithBearer('https://api.progress.nice.okinawa/api/admin/stats', token);
  if (!data.ok) return { ...manualRevenueItem('progress', data.error, data.url), ok: false };
  const stats = data.data || {};
  const orders = Array.isArray(stats.orders) ? stats.orders : Array.isArray(stats.recentOrders) ? stats.recentOrders : [];
  const totals = aggregateOrders(orders);
  return {
    site: 'progress',
    ok: true,
    source: '/api/admin/stats',
    today_amount: numberFrom(stats.today_amount ?? stats.todayRevenue ?? stats.ordersTodayAmount ?? totals.today_amount),
    month_amount: numberFrom(stats.month_amount ?? stats.monthRevenue ?? stats.ordersMonthAmount ?? totals.month_amount),
    users_total: numberFrom(stats.users_total ?? stats.totalUsers ?? stats.users?.total ?? stats.accounts?.length),
    manual: orders.length === 0 && stats.today_amount == null && stats.month_amount == null,
    note: orders.length === 0 && stats.today_amount == null && stats.month_amount == null
      ? 'admin stats returned no order revenue fields'
      : ''
  };
}

async function getBjtRevenue(env) {
  const token = env.BJT_ADMIN_TOKEN || '';
  if (!token) return manualRevenueItem('bjt', 'missing_BJT_ADMIN_TOKEN', 'https://bjt-worker.gerheidicn.workers.dev/api/admin/service-orders');
  const data = await fetchJsonWithBearer('https://bjt-worker.gerheidicn.workers.dev/api/admin/service-orders', token);
  if (!data.ok) return { ...manualRevenueItem('bjt', data.error, data.url), ok: false };
  const orders = Array.isArray(data.data?.orders) ? data.data.orders : [];
  const totals = aggregateOrders(orders);
  return {
    site: 'bjt',
    ok: true,
    source: '/api/admin/service-orders',
    today_amount: totals.today_amount,
    month_amount: totals.month_amount,
    users_total: null,
    orders_total: orders.length,
    manual: false,
    note: ''
  };
}

function manualRevenueItem(site, note, source) {
  return {
    site,
    ok: false,
    source,
    today_amount: null,
    month_amount: null,
    users_total: null,
    orders_total: null,
    manual: true,
    note
  };
}

async function fetchJsonWithBearer(url, token) {
  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
        'user-agent': 'nice-analytics-dashboard'
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, url, error: data.error || `http_${res.status}` };
    return { ok: true, url, data };
  } catch (e) {
    return { ok: false, url, error: clean(e.message || String(e), 300) };
  }
}

function aggregateOrders(orders) {
  const now = new Date();
  const todayKey = jstDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  let todayAmount = 0;
  let monthAmount = 0;
  for (const order of orders || []) {
    if (!order || order.source === 'cctest' || order.email === 'cctest@nice.okinawa') continue;
    const paidAt = order.paid_at || order.paidAt || order.created_at || order.createdAt || order.sort_at || '';
    const day = jstDateKey(parseDateSafe(paidAt));
    if (!day) continue;
    const amount = numberFrom(order.amount);
    if (day === todayKey) todayAmount += amount;
    if (day.slice(0, 7) === monthKey) monthAmount += amount;
  }
  return { today_amount: todayAmount, month_amount: monthAmount };
}

function numberFrom(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseDateSafe(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function jstDateKey(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

async function ensureAlertTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS alert_state (
      key TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      fingerprint TEXT NOT NULL DEFAULT '',
      detail TEXT,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      notified_at TEXT
    )
  `).run();
}

async function ensureAlertSendLogTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS alert_send_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      status TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      window_start TEXT NOT NULL,
      reason TEXT,
      detail TEXT,
      claimed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      sent_at TEXT,
      ok INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      result TEXT
    )
  `).run();
  await env.DB.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_send_log_unique_window
    ON alert_send_log(key, status, fingerprint, window_start)
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_alert_send_log_key_claimed
    ON alert_send_log(key, claimed_at)
  `).run();
}

async function ensureAlertSelfCheckTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS alert_channel_self_checks (
      month_key TEXT PRIMARY KEY,
      scheduled_at TEXT NOT NULL,
      sent_at TEXT,
      ok INTEGER NOT NULL DEFAULT 0,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      error TEXT,
      result TEXT,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `).run();
}

async function evaluateDashboardAlerts(env, reason = 'cron') {
  await ensureAlertTable(env);
  await ensureAlertSendLogTable(env);
  const [backups, deployments, probes] = await Promise.all([
    getBackupStatus(env),
    getDeploymentStatus(env),
    getProbeSummary(env)
  ]);
  const redItems = collectAlertItems(backups, deployments, probes);
  const status = redItems.length ? 'red' : 'green';
  const fingerprint = redItems.map((item) => `${item.type}:${item.key}`).sort().join('|');
  const key = 'dashboard-control';
  const previous = await first(env.DB, 'SELECT key, status, fingerprint FROM alert_state WHERE key = ?', [key]);
  const shouldNotify = !previous ? status === 'red' : previous.status !== status;
  const generatedAt = new Date().toISOString();
  let sendLock = null;
  let alert = null;

  if (shouldNotify) {
    sendLock = await claimAlertSend(env, {
      key,
      status,
      fingerprint,
      reason,
      detail: JSON.stringify({ reason, generated_at: generatedAt, red_items: redItems })
    });
    if (sendLock.acquired) {
      alert = await trySendDashboardAlert(env, status, redItems);
      await finishAlertSend(env, sendLock.id, alert);
    }
  }

  const sendHistory = await alertSendHistory(env, key);
  const detail = buildAlertDetail({
    reason,
    generatedAt,
    redItems,
    sendLock,
    sendHistory
  });
  await upsertAlertState(env, key, status, fingerprint, detail, !!sendLock?.acquired);
  return {
    status,
    previous_status: previous?.status || null,
    sent: !!alert?.ok,
    alert,
    red_items: redItems,
    send_lock: sendLock
  };
}

async function trySendDashboardAlert(env, status, redItems) {
  try {
    const result = await sendDashboardAlert(env, status, redItems);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: clean(error.message || String(error), 300) };
  }
}

async function sendManualTestAlert(env) {
  const item = {
    type: 'manual',
    key: 'health_alert_channel_test',
    label: 'Health alert channel test',
    status: 'test',
    detail: 'Manual test alert from db dashboard admin endpoint.',
    latest_at: new Date().toISOString()
  };
  const result = await sendDashboardAlert(env, 'red', [item]);
  const to = normalizeEmailForAlert(env.WAN_ALERT_EMAIL || '');
  return { sent: true, to, result };
}

async function sendMonthlyAlertChannelSelfCheck(env, scheduledAt, reason = MONTHLY_ALERT_SELF_CHECK_CRON, options = {}) {
  await ensureAlertSelfCheckTable(env);
  const monthKey = jstMonthKey(scheduledAt);
  const previous = await first(env.DB, 'SELECT ok, sent_at FROM alert_channel_self_checks WHERE month_key = ?', [monthKey]);
  if (Number(previous?.ok || 0) === 1 && !options.force) {
    return { skipped: true, month_key: monthKey, sent_at: previous.sent_at };
  }

  const recipient = normalizeEmailForAlert(env.ALERT_CHANNEL_SELF_CHECK_EMAIL || env.WAN_ALERT_EMAIL || '');
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const subject = `${prefix}[Nice Dashboard] 通道自检 ${monthKey}`;
  const scheduledIso = scheduledAt.toISOString();
  const text = [
    'Nice dashboard alert-channel monthly self-check.',
    '',
    '收到这封邮件 = 报警通道正常。',
    '若某月 1 号 09:00 JST 没收到这封邮件，请排查报警系统本身。',
    '',
    `Month: ${monthKey}`,
    `Scheduled at: ${scheduledIso}`,
    `Cron: ${reason}`,
    `Recipient: ${recipient}`
  ].join('\n');

  try {
    const config = getAlertConfig(env, recipient);
    const result = await sendAlertEmail(config, subject, text);
    await env.DB.prepare(`
      INSERT INTO alert_channel_self_checks (
        month_key, scheduled_at, sent_at, ok, recipient, subject, error, result, updated_at
      )
      VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 1, ?, ?, '', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(month_key) DO UPDATE SET
        scheduled_at = excluded.scheduled_at,
        sent_at = excluded.sent_at,
        ok = excluded.ok,
        recipient = excluded.recipient,
        subject = excluded.subject,
        error = excluded.error,
        result = excluded.result,
        updated_at = excluded.updated_at
    `).bind(monthKey, scheduledIso, config.to, subject, JSON.stringify(result)).run();
    return { sent: true, month_key: monthKey, to: config.to, result };
  } catch (error) {
    const message = clean(error.message || String(error), 300);
    await env.DB.prepare(`
      INSERT INTO alert_channel_self_checks (
        month_key, scheduled_at, sent_at, ok, recipient, subject, error, result, updated_at
      )
      VALUES (?, ?, NULL, 0, ?, ?, ?, '', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(month_key) DO UPDATE SET
        scheduled_at = excluded.scheduled_at,
        ok = excluded.ok,
        recipient = excluded.recipient,
        subject = excluded.subject,
        error = excluded.error,
        updated_at = excluded.updated_at
    `).bind(monthKey, scheduledIso, recipient, subject, message).run();
    throw error;
  }
}

export function collectAlertItems(backups, deployments, probes) {
  const items = [];
  for (const item of backups?.items || []) {
    if (!item.ok && !item.manual) {
      items.push({
        type: 'backup',
        key: item.key || item.label || 'backup',
        label: item.label || item.key || 'Backup',
        status: item.status || 'red',
        detail: item.error || item.latest_at || item.object_key || '',
        latest_at: item.latest_at || ''
      });
    }
  }
  for (const item of deployments?.items || []) {
    if (!item.ok && !item.manual) {
      items.push({
        type: 'deployment',
        key: item.repo || 'repo',
        label: item.repo || 'Deployment',
        status: item.conclusion || item.status || 'red',
        detail: item.error || item.updated_at || item.url || '',
        latest_at: item.updated_at || ''
      });
    }
  }
  for (const item of probes?.targets || []) {
    if (!item.ok) {
      items.push({
        type: 'probe',
        key: item.target || item.label || 'probe',
        label: item.label || item.target || 'Probe',
        status: item.latest?.status || 'missing',
        detail: item.latest?.error || item.url || '',
        latest_at: item.latest?.checked_at || ''
      });
    }
  }
  return items;
}

async function upsertAlertState(env, key, status, fingerprint, detail, notified) {
  await env.DB.prepare(`
    INSERT INTO alert_state (key, status, fingerprint, detail, updated_at, notified_at)
    VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ${notified ? "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')" : 'NULL'})
    ON CONFLICT(key) DO UPDATE SET
      status = excluded.status,
      fingerprint = excluded.fingerprint,
      detail = excluded.detail,
      updated_at = excluded.updated_at,
      notified_at = COALESCE(excluded.notified_at, alert_state.notified_at)
  `).bind(key, status, fingerprint, detail).run();
}

function d1ChangedRows(result) {
  return Number(result?.meta?.changes || result?.changes || 0);
}

async function claimAlertSend(env, { key, status, fingerprint, reason, detail }) {
  const windowStart = alertSendWindowStart(new Date());
  const claimed = await env.DB.prepare(`
    INSERT INTO alert_send_log (key, status, fingerprint, window_start, reason, detail)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(key, status, fingerprint, window_start) DO NOTHING
  `).bind(key, status, fingerprint, windowStart, reason, detail).run();
  const acquired = d1ChangedRows(claimed) > 0;
  return {
    acquired,
    id: acquired ? Number(claimed?.meta?.last_row_id || claimed?.lastRowId || 0) : null,
    status,
    fingerprint,
    window_start: windowStart,
    reason
  };
}

async function finishAlertSend(env, id, alert) {
  if (!id) return;
  await env.DB.prepare(`
    UPDATE alert_send_log
    SET sent_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        ok = ?,
        error = ?,
        result = ?
    WHERE id = ?
  `).bind(
    alert?.ok ? 1 : 0,
    alert?.error || '',
    JSON.stringify(alert?.result || null),
    id
  ).run();
}

function alertSendWindowStart(date) {
  const windowMs = 5 * 60 * 1000;
  return new Date(Math.floor(date.getTime() / windowMs) * windowMs).toISOString();
}

async function alertSendHistory(env, key) {
  return await all(env.DB, `
    SELECT id, status, fingerprint, window_start, reason, claimed_at, sent_at, ok, error
    FROM alert_send_log
    WHERE key = ?
    ORDER BY claimed_at DESC, id DESC
    LIMIT 5
  `, [key]);
}

function buildAlertDetail({ reason, generatedAt, redItems, sendLock, sendHistory }) {
  return JSON.stringify({
    reason,
    generated_at: generatedAt,
    red_items: redItems,
    send_lock: sendLock ? {
      acquired: !!sendLock.acquired,
      id: sendLock.id || null,
      status: sendLock.status,
      fingerprint: sendLock.fingerprint,
      window_start: sendLock.window_start,
      reason: sendLock.reason
    } : null,
    send_history: (sendHistory || []).map((item) => ({
      id: item.id,
      status: item.status,
      fingerprint: item.fingerprint,
      window_start: item.window_start,
      reason: item.reason || '',
      claimed_at: item.claimed_at,
      sent_at: item.sent_at || '',
      ok: Boolean(item.ok),
      error: item.error || ''
    }))
  });
}

async function sendDashboardAlert(env, status, redItems) {
  const config = getAlertConfig(env);
  const prefix = env.ALERT_SUBJECT_PREFIX || '';
  const subject = status === 'red'
    ? `${prefix}[Nice Dashboard] ALERT: ${redItems.length} red item(s)`
    : `${prefix}[Nice Dashboard] RECOVERY: all monitored items green`;
  const text = status === 'red'
    ? [
      'Nice dashboard alert: one or more monitored items are red.',
      '',
      ...redItems.map((item) => [
        `- ${item.type}/${item.label}`,
        `  status: ${item.status || 'red'}`,
        `  latest_at: ${item.latest_at || '-'}`,
        `  detail: ${item.detail || '-'}`,
      ].join('\n')),
      '',
      `Time: ${new Date().toISOString()}`
    ].join('\n')
    : [
      'Nice dashboard recovery: backups, deployments, and probes are all green.',
      '',
      `Time: ${new Date().toISOString()}`
    ].join('\n');

  return sendAlertEmail(config, subject, text);
}

async function sendAlertEmail(config, subject, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      text
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `resend_http_${res.status}`);
  }
  return data;
}

function getAlertConfig(env, recipient) {
  const apiKey = env.RESEND_API_KEY || '';
  const to = normalizeEmailForAlert(recipient || env.WAN_ALERT_EMAIL || '');
  const from = env.ALERT_FROM_EMAIL || '';
  const allowlist = parseAlertAllowlist(env.ALERT_EMAIL_ALLOWLIST || '');
  if (!apiKey) throw new Error('missing_RESEND_API_KEY');
  if (!to) throw new Error('missing_WAN_ALERT_EMAIL');
  if (!from) throw new Error('missing_ALERT_FROM_EMAIL');
  if (!allowlist.includes(to)) {
    throw new Error('invalid_alert_email_allowlist');
  }
  return { apiKey, to, from };
}

function parseAlertAllowlist(value) {
  return String(value || '')
    .split(',')
    .map((item) => normalizeEmailForAlert(item))
    .filter(Boolean);
}

function normalizeEmailForAlert(value) {
  return String(value || '').trim().toLowerCase();
}

function jstMonthKey(date) {
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '00';
  return `${year}-${month}`;
}
