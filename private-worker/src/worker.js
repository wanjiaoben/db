const REALM = 'Nice Okinawa Dashboard';
const DEFAULT_ANALYTICS_ORIGIN = 'https://analytics.nice.okinawa';

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
    || pathname === '/search-console/status'
    || pathname === '/search-console/sync';
}

async function proxyAnalytics(request, env, url) {
  const target = new URL(url.pathname + url.search, env.ANALYTICS_ORIGIN || DEFAULT_ANALYTICS_ORIGIN);
  const headers = new Headers();
  headers.set('accept', request.headers.get('accept') || 'application/json');
  const key = env.DASHBOARD_KEY || request.headers.get('x-dashboard-key') || '';
  if (key) headers.set('x-dashboard-key', key);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  });
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
