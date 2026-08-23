const REALM = 'Nice Okinawa Dashboard';
const DEFAULT_ANALYTICS_ORIGIN = 'https://analytics.nice.okinawa';
const ORDER_META_PREFIX = 'paypal_order_meta:';
const ORDER_DAY_OPTIONS = new Set([1, 7, 30, 180]);
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const COUNTRY_REGION_ALIASES = {
  JP: 'japan',
  JAPAN: 'japan',
  TW: 'taiwan',
  TAIWAN: 'taiwan',
  HK: 'hong_kong',
  HONGKONG: 'hong_kong',
  HONG_KONG: 'hong_kong',
  MO: 'macau',
  MACAU: 'macau',
  MACAO: 'macau',
  CN: 'china',
  CHINA: 'china',
  KR: 'korea',
  KOREA: 'korea',
  SG: 'singapore',
  SINGAPORE: 'singapore',
  US: 'usa',
  USA: 'usa',
  UNITEDSTATES: 'usa',
  UNITED_STATES: 'usa'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-robots-tag': 'noindex, nofollow'
        }
      });
    }

    if (!isAuthorized(request, env)) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'www-authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex, nofollow'
        }
      });
    }

    if (url.pathname === '/orders') {
      return orders(request, env);
    }

    if (isAnalyticsProxyPath(url.pathname)) {
      return proxyAnalytics(request, env, url);
    }

    const target = targetUrl(url, env);
    const upstream = await fetch(target, {
      headers: { 'user-agent': 'db-private-worker' },
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    const headers = new Headers(upstream.headers);
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.set('content-type', contentTypeFor(target));
    headers.delete('content-security-policy');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    });
  }
};

function isAnalyticsProxyPath(pathname) {
  return pathname === '/summary'
    || pathname === '/control'
    || pathname === '/visitors'
    || pathname === '/probes/run'
    || pathname === '/alerts/check'
    || pathname === '/alerts/test'
    || pathname === '/alerts/self-check'
    || pathname === '/path-checks/status'
    || pathname === '/search-console/status'
    || pathname === '/search-console/sync'
    || pathname === '/search-console/weekly-report';
}

async function proxyAnalytics(request, env, url) {
  const origin = String(env.ANALYTICS_ORIGIN || DEFAULT_ANALYTICS_ORIGIN).replace(/\/+$/, '');
  const target = origin + url.pathname + url.search;
  const headers = new Headers();
  headers.set('accept', request.headers.get('accept') || 'application/json');
  const key = env.DASHBOARD_KEY || request.headers.get('x-dashboard-key') || '';
  if (key) headers.set('x-dashboard-key', key);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const proxyRequest = new Request(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  });
  const upstream = env.ANALYTICS
    ? await env.ANALYTICS.fetch(proxyRequest)
    : await fetch(proxyRequest);
  const outHeaders = new Headers(upstream.headers);
  outHeaders.set('cache-control', 'no-store');
  outHeaders.set('x-robots-tag', 'noindex, nofollow');
  outHeaders.delete('access-control-allow-origin');
  outHeaders.delete('access-control-allow-methods');
  outHeaders.delete('access-control-allow-headers');
  outHeaders.delete('access-control-max-age');
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders
  });
}

async function orders(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }
  if (!requireDashboard(request, env, { allowServiceKey: true })) {
    return json({ ok: false, error: 'unauthorized' }, 403);
  }
  if (!env.BJT_KV) {
    return json({ ok: false, error: 'missing_BJT_KV' }, 500);
  }

  const url = new URL(request.url);
  const requestedMonth = text(url.searchParams.get('month'));
  const monthRange = MONTH_PATTERN.test(requestedMonth) ? jstMonthRange(requestedMonth) : null;
  const requestedDays = Number(url.searchParams.get('days') || 7);
  const days = ORDER_DAY_OPTIONS.has(requestedDays) ? requestedDays : 7;
  const sinceMs = Date.now() - days * 86400000;
  const listed = await env.BJT_KV.list({ prefix: ORDER_META_PREFIX });
  const keys = Array.isArray(listed.keys) ? listed.keys : [];
  const allRows = [];
  const rows = [];

  for (const key of keys) {
    const name = key && key.name;
    if (!name) continue;
    const raw = await env.BJT_KV.get(name);
    if (!raw) continue;
    let meta;
    try {
      meta = JSON.parse(raw);
    } catch (e) {
      continue;
    }
    const row = orderRow(name, meta);
    allRows.push(row);
    const createdMs = Date.parse(row.created_at || '');
    if (monthRange) {
      if (!Number.isFinite(createdMs) || createdMs < monthRange.startMs || createdMs >= monthRange.endMs) continue;
    } else if (Number.isFinite(createdMs) && createdMs < sinceMs) {
      continue;
    }
    rows.push(row);
  }

  const byCreatedDesc = (a, b) => {
    const at = Date.parse(a.created_at || '') || 0;
    const bt = Date.parse(b.created_at || '') || 0;
    return bt - at;
  };
  allRows.sort(byCreatedDesc);
  rows.sort(byCreatedDesc);

  const capturedRows = rows.filter((row) => isCaptured(row));
  const excludedRows = rows.filter((row) => !isCaptured(row));
  const countedRows = monthRange ? capturedRows : rows;

  return json({
    ok: true,
    mode: monthRange ? 'month' : 'days',
    days,
    month: monthRange ? monthRange.month : null,
    month_start_jst: monthRange ? monthRange.startJst : null,
    month_end_jst: monthRange ? monthRange.endJst : null,
    generated_at: new Date().toISOString(),
    total_orders: rows.length,
    captured_total: capturedRows.length,
    excluded_total: excludedRows.length,
    tax_totals: taxTotals(capturedRows),
    range_counts: orderRangeCounts(allRows),
    recent_orders: allRows.slice(0, 10),
    distributions: {
      overseas_region: distribution(countedRows, (row) => row.overseas_region || (normalizeRegion(row.buyer_location) === 'japan' ? 'japan' : '')),
      ip_country: distribution(countedRows, (row) => row.ip_country),
      paypal_payer_country: distribution(countedRows, (row) => row.paypal_payer_country)
    },
    orders: monthRange ? capturedRows : rows,
    captured_orders: capturedRows,
    excluded_orders: excludedRows
  });
}

function jstMonthRange(month) {
  const [year, monthNumber] = month.split('-').map((part) => Number(part));
  const startMs = Date.UTC(year, monthNumber - 1, 1, -9, 0, 0, 0);
  const endMs = Date.UTC(year, monthNumber, 1, -9, 0, 0, 0);
  return {
    month,
    startMs,
    endMs,
    startJst: `${month}-01T00:00:00+09:00`,
    endJst: jstMonthLabel(endMs)
  };
}

function jstMonthLabel(ms) {
  const date = new Date(ms + 9 * 3600000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01T00:00:00+09:00`;
}

function orderRow(keyName, meta) {
  const orderId = text(meta.order_id) || keyName.slice(ORDER_META_PREFIX.length);
  const email = text(meta.email);
  const ip = text(meta.ip);
  const row = {
    key: keyName,
    order_id: orderId,
    order_short: orderId ? orderId.slice(-6) : '-',
    email,
    email_masked: maskEmail(email),
    product_type: text(meta.product_type),
    plan: text(meta.plan),
    service: text(meta.service),
    amount: text(meta.amount),
    currency: text(meta.currency),
    buyer_location: text(meta.buyer_location),
    buyer_location_label: text(meta.buyer_location_label),
    buyer_location_basis: text(meta.buyer_location_basis),
    ip,
    ip_country: text(meta.ip_country),
    overseas_region: text(meta.overseas_region),
    created_at: text(meta.created_at),
    updated_at: text(meta.updated_at),
    status: text(meta.status),
    source: text(meta.source),
    first_ref: text(meta.first_ref),
    first_landing: text(meta.first_landing),
    first_utm: text(meta.first_utm),
    first_seen: text(meta.first_seen),
    ui_lang: text(meta.ui_lang),
    paypal_payer_country: text(meta.paypal_payer_country),
    captured_at: text(meta.captured_at),
    business_record_key: text(meta.business_record_key)
  };
  row.location_mismatch = hasLocationMismatch(row);
  return row;
}

function hasLocationMismatch(row) {
  const values = [
    normalizeRegion(row.ip_country),
    selectedBuyerRegion(row),
    normalizeRegion(row.paypal_payer_country)
  ].filter(Boolean);
  return values.length >= 2 && new Set(values).size > 1;
}

function selectedBuyerRegion(row) {
  const buyer = normalizeRegion(row.buyer_location);
  if (buyer === 'japan') return 'japan';
  return normalizeRegion(row.overseas_region) || buyer;
}

function isCaptured(row) {
  return text(row.status).toLowerCase() === 'captured';
}

function orderRangeCounts(rows) {
  const now = new Date();
  const todayKey = jstDateKey(now.getTime());
  const nowMs = now.getTime();
  const counts = { today: 0, days_7: 0, days_30: 0 };
  for (const row of rows) {
    const createdMs = Date.parse(row.created_at || '');
    if (!Number.isFinite(createdMs)) continue;
    if (jstDateKey(createdMs) === todayKey) counts.today += 1;
    const ageMs = nowMs - createdMs;
    if (ageMs >= 0 && ageMs <= 7 * 86400000) counts.days_7 += 1;
    if (ageMs >= 0 && ageMs <= 30 * 86400000) counts.days_30 += 1;
  }
  return counts;
}

function jstDateKey(ms) {
  const date = new Date(ms + 9 * 3600000);
  return date.getUTCFullYear() + '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(date.getUTCDate()).padStart(2, '0');
}

function taxTotals(rows) {
  const currencies = new Map();
  for (const row of rows) {
    const currency = text(row.currency) || '-';
    if (!currencies.has(currency)) {
      currencies.set(currency, {
        currency,
        japan_count: 0,
        japan_amount: 0,
        overseas_count: 0,
        overseas_amount: 0,
        total_count: 0,
        total_amount: 0
      });
    }
    const bucket = currencies.get(currency);
    const amount = Number(row.amount);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const region = selectedBuyerRegion(row);
    if (region === 'japan') {
      bucket.japan_count += 1;
      bucket.japan_amount += safeAmount;
    } else {
      bucket.overseas_count += 1;
      bucket.overseas_amount += safeAmount;
    }
    bucket.total_count += 1;
    bucket.total_amount += safeAmount;
  }
  return Array.from(currencies.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}

function normalizeRegion(value) {
  const raw = text(value);
  if (!raw) return '';
  const key = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return COUNTRY_REGION_ALIASES[key] || raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function distribution(rows, pick) {
  const counts = new Map();
  for (const row of rows) {
    const value = text(pick(row)) || '-';
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function maskEmail(email) {
  const value = text(email);
  const at = value.indexOf('@');
  if (at <= 0) return value ? value[0] + '***' : '';
  return value[0] + '***' + value.slice(at);
}

function text(value) {
  return String(value ?? '').trim();
}

function requireDashboard(request, env, options = {}) {
  const expected = env.DASHBOARD_KEY || '';
  if (!expected) return false;
  if (options.allowServiceKey) return true;
  return request.headers.get('x-dashboard-key') === expected;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}

function targetUrl(url, env) {
  let pathname = url.pathname;
  if (pathname === '/' || pathname.endsWith('/')) pathname += 'index.html';
  return `${env.DASHBOARD_ORIGIN}${pathname}`;
}

function contentTypeFor(target) {
  const pathname = new URL(target).pathname;
  if (pathname.endsWith('.html')) return 'text/html; charset=utf-8';
  if (pathname.endsWith('.css')) return 'text/css; charset=utf-8';
  if (pathname.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (pathname.endsWith('.json')) return 'application/json; charset=utf-8';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

function isAuthorized(request, env) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch (e) {
    return false;
  }
  const index = decoded.indexOf(':');
  if (index < 0) return false;
  const user = decoded.slice(0, index);
  const pass = decoded.slice(index + 1);
  return user === env.BASIC_USER && pass === env.BASIC_PASS;
}
