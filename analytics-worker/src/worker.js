const COLLECT_ORIGIN = 'https://translation.nice.okinawa';
const DASHBOARD_ORIGIN = 'https://db.nice.okinawa';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (url.pathname === '/collect' && request.method === 'POST') {
      return collect(request, env, ctx);
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
  const allowed = origin === COLLECT_ORIGIN || origin === DASHBOARD_ORIGIN ? origin : DASHBOARD_ORIGIN;
  return {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-dashboard-key',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
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
    WHERE created_at >= ?
  `, [since]);

  const todayTotals = await first(env.DB, `
    SELECT
      COUNT(CASE WHEN type='page_view' THEN 1 END) AS page_views,
      COUNT(DISTINCT CASE WHEN type='page_view' THEN session_id END) AS sessions,
      COUNT(DISTINCT CASE WHEN type='page_view' THEN visitor_id END) AS visitors
    FROM events
    WHERE created_at >= ?
  `, [todayIso]);

  const online = await first(env.DB, `
    SELECT COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ?
  `, [onlineSince]);

  const pages = await all(env.DB, `
    SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ? AND type='page_view'
    GROUP BY path
    ORDER BY views DESC
    LIMIT 20
  `, [since]);

  const sources = await all(env.DB, `
    SELECT source, medium, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ? AND type='page_view'
    GROUP BY source, medium
    ORDER BY views DESC
    LIMIT 20
  `, [since]);

  const sections = await all(env.DB, `
    SELECT section, COUNT(*) AS views, ROUND(AVG(duration_ms)) AS avg_duration_ms
    FROM events
    WHERE created_at >= ? AND section <> ''
    GROUP BY section
    ORDER BY views DESC
    LIMIT 20
  `, [since]);

  const contacts = await all(env.DB, `
    SELECT event_name, label, COUNT(*) AS clicks
    FROM events
    WHERE created_at >= ? AND type='click' AND event_name LIKE 'contact_%'
    GROUP BY event_name, label
    ORDER BY clicks DESC
    LIMIT 20
  `, [since]);

  const languages = await all(env.DB, `
    SELECT lang, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE created_at >= ? AND type='page_view'
    GROUP BY lang
    ORDER BY views DESC
    LIMIT 20
  `, [since]);

  const countries = await all(env.DB, `
    SELECT country, COUNT(*) AS views
    FROM events
    WHERE created_at >= ? AND type='page_view' AND country <> ''
    GROUP BY country
    ORDER BY views DESC
    LIMIT 20
  `, [since]);

  const devices = await all(env.DB, `
    SELECT device, COUNT(*) AS views
    FROM events
    WHERE created_at >= ? AND type='page_view'
    GROUP BY device
    ORDER BY views DESC
  `, [since]);

  const recent = await all(env.DB, `
    SELECT created_at, type, path, source, country, device, lang, event_name, section, duration_ms, max_scroll
    FROM events
    ORDER BY created_at DESC
    LIMIT 50
  `);

  return json({
    ok: true,
    days,
    generated_at: new Date().toISOString(),
    online: online?.sessions || 0,
    totals,
    today: todayTotals,
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
