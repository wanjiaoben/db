const REALM = 'Nice Okinawa Dashboard';

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

    const target = targetUrl(url, env);
    const upstream = await fetch(target, {
      headers: { 'user-agent': 'db-private-worker' },
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    const headers = new Headers(upstream.headers);
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.delete('content-security-policy');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    });
  }
};

function targetUrl(url, env) {
  let pathname = url.pathname;
  if (pathname === '/' || pathname.endsWith('/')) pathname += 'index.html';
  return `${env.DASHBOARD_ORIGIN}${pathname}`;
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
