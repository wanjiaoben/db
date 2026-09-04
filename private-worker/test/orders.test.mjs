import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/worker.js';

const AUTH = 'Basic ' + btoa('wan:pass');
const ACCESS_AUD = 'db-dashboard-test-aud';
const ACCESS_EMAIL = 'wan@example.test';
const ACCESS_CERTS_URL = 'https://access.test/certs';

function envWithKv(records, extra = {}) {
  return {
    BASIC_USER: 'wan',
    BASIC_PASS: 'pass',
    DASHBOARD_KEY: 'dash',
    BJT_KV: {
      async list(options) {
        assert.equal(options.prefix, 'paypal_order_meta:');
        assert.equal(options.cursor, undefined);
        return { keys: Object.keys(records).map((name) => ({ name })) };
      },
      async get(name) {
        if (Array.isArray(name)) {
          return new Map(name.map((key) => [key, records[key] || null]));
        }
        return records[name] || null;
      }
    },
    ...extra
  };
}

function request(headers = {}) {
  return new Request('https://db.nice.okinawa/orders?days=180', {
    headers: {
      authorization: AUTH,
      'x-dashboard-key': 'dash',
      ...headers
    }
  });
}

function unauthenticatedRequest(headers = {}) {
  return new Request('https://db.nice.okinawa/orders?days=180', { headers });
}

function envWithAccess(records, extra = {}) {
  return envWithKv(records, {
    CF_ACCESS_AUD: ACCESS_AUD,
    CF_ACCESS_ALLOWED_EMAILS: ACCESS_EMAIL,
    CF_ACCESS_CERTS_URL: ACCESS_CERTS_URL,
    CF_ACCESS_ISSUER: 'https://orange-field-364e.cloudflareaccess.com',
    ...extra
  });
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function accessJwt(overrides = {}) {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
  const jwk = await crypto.subtle.exportKey('jwk', publicKey);
  jwk.kid = overrides.kid || 'access-test-key';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: jwk.kid }));
  const payload = b64url(JSON.stringify({
    iss: 'https://orange-field-364e.cloudflareaccess.com',
    aud: ACCESS_AUD,
    exp: now + 300,
    email: ACCESS_EMAIL,
    ...overrides.payload
  }));
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  return {
    token: `${header}.${payload}.${b64url(Buffer.from(signature))}`,
    jwk
  };
}

async function withAccessCerts(jwk, fn, certsUrl = ACCESS_CERTS_URL) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === certsUrl) {
      return new Response(JSON.stringify({ keys: [jwk] }), {
        headers: { 'content-type': 'application/json' }
      });
    }
    return originalFetch(input, init);
  };
  try {
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function withAccessCertsAndDashboard(jwk, fn, certsUrl = ACCESS_CERTS_URL) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === certsUrl) {
      return new Response(JSON.stringify({ keys: [jwk] }), {
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url === 'https://dashboard.test/index.html') {
      return new Response('<!doctype html><title>panel</title><main>Dashboard</main>', {
        headers: { 'content-type': 'text/html; charset=utf-8' }
      });
    }
    return originalFetch(input, init);
  };
  try {
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function isoDaysAgo(days, extraMs = 0) {
  return new Date(Date.now() - days * 86400000 + extraMs).toISOString();
}

test('/orders rejects unauthenticated requests without Basic challenge', async () => {
  const res = await worker.fetch(new Request('https://db.nice.okinawa/orders'), envWithKv({}), {});
  assert.equal(res.status, 403);
  assert.equal(res.headers.has('www-authenticate'), false);
});

test('/orders accepts verified Cloudflare Access JWT without Basic', async () => {
  const { token, jwk } = await accessJwt();
  await withAccessCerts(jwk, async () => {
    const res = await worker.fetch(unauthenticatedRequest({
      'cf-access-jwt-assertion': token
    }), envWithAccess({}), {});
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.ok, true);
  });
});

test('dashboard accepts verified Cloudflare Access JWT without Basic', async () => {
  const { token, jwk } = await accessJwt();
  const certsUrl = 'https://access.test/certs-dashboard';
  await withAccessCertsAndDashboard(jwk, async () => {
    const response = await worker.fetch(
      new Request('https://db.nice.okinawa/', {
        headers: { 'cf-access-jwt-assertion': token }
      }),
      envWithAccess({}, { CF_ACCESS_CERTS_URL: certsUrl, DASHBOARD_ORIGIN: 'https://dashboard.test' }),
      {}
    );
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Dashboard/);
  }, certsUrl);
});

test('dashboard rejects forged or invalid Cloudflare Access JWTs', async () => {
  const absent = await worker.fetch(new Request('https://db.nice.okinawa/'), envWithAccess({}), {});
  assert.equal(absent.status, 403);
  assert.equal(absent.headers.has('www-authenticate'), false);

  const signed = await accessJwt();
  const otherKey = await accessJwt();
  const forgedUrl = ACCESS_CERTS_URL + '/forged-dashboard';
  await withAccessCerts(otherKey.jwk, async () => {
    const forged = await worker.fetch(new Request('https://db.nice.okinawa/', {
      headers: { 'cf-access-jwt-assertion': signed.token }
    }), envWithAccess({}, { CF_ACCESS_CERTS_URL: forgedUrl }), {});
    assert.equal(forged.status, 403);
  }, forgedUrl);

  const cases = [
    await accessJwt({ payload: { aud: 'wrong-aud' } }),
    await accessJwt({ payload: { exp: Math.floor(Date.now() / 1000) - 60 } }),
    await accessJwt({ payload: { iss: 'https://wrong.cloudflareaccess.com' } }),
    await accessJwt({ payload: { email: 'other@example.test' } })
  ];
  for (const [index, item] of cases.entries()) {
    const certsUrl = ACCESS_CERTS_URL + '/invalid-dashboard-' + index;
    await withAccessCerts(item.jwk, async () => {
      const res = await worker.fetch(new Request('https://db.nice.okinawa/', {
        headers: { 'cf-access-jwt-assertion': item.token }
      }), envWithAccess({}, { CF_ACCESS_CERTS_URL: certsUrl }), {});
      assert.equal(res.status, 403);
    }, certsUrl);
  }
});

test('/orders rejects absent or invalid Cloudflare Access JWT without Basic challenge', async () => {
  const absent = await worker.fetch(unauthenticatedRequest(), envWithAccess({}), {});
  assert.equal(absent.status, 403);
  assert.equal(absent.headers.has('www-authenticate'), false);

  const wrongAud = await accessJwt({ payload: { aud: 'wrong-aud' } });
  const wrongAudUrl = ACCESS_CERTS_URL + '/wrong-aud';
  await withAccessCerts(wrongAud.jwk, async () => {
    const res = await worker.fetch(unauthenticatedRequest({
      'cf-access-jwt-assertion': wrongAud.token
    }), envWithAccess({}, { CF_ACCESS_CERTS_URL: wrongAudUrl }), {});
    assert.equal(res.status, 403);
  }, wrongAudUrl);

  const expired = await accessJwt({ payload: { exp: Math.floor(Date.now() / 1000) - 60 } });
  const expiredUrl = ACCESS_CERTS_URL + '/expired';
  await withAccessCerts(expired.jwk, async () => {
    const res = await worker.fetch(unauthenticatedRequest({
      'cf-access-jwt-assertion': expired.token
    }), envWithAccess({}, { CF_ACCESS_CERTS_URL: expiredUrl }), {});
    assert.equal(res.status, 403);
  }, expiredUrl);

  const wrongEmail = await accessJwt({ payload: { email: 'other@example.test' } });
  const wrongEmailUrl = ACCESS_CERTS_URL + '/wrong-email';
  await withAccessCerts(wrongEmail.jwk, async () => {
    const res = await worker.fetch(unauthenticatedRequest({
      'cf-access-jwt-assertion': wrongEmail.token
    }), envWithAccess({}, { CF_ACCESS_CERTS_URL: wrongEmailUrl }), {});
    assert.equal(res.status, 403);
  }, wrongEmailUrl);
});

test('/orders allows dashboard-key program requests', async () => {
  const res = await worker.fetch(unauthenticatedRequest({ 'x-dashboard-key': 'dash' }), envWithKv({}), {});
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.total_orders, 0);
});

test('/orders remains fail-closed when DASHBOARD_KEY is missing', async () => {
  const res = await worker.fetch(request(), envWithKv({}, { DASHBOARD_KEY: '' }), {});
  assert.equal(res.status, 403);
  assert.equal(await res.text(), 'forbidden');
});

test('browser data endpoints accept verified Cloudflare Access JWT and proxy with server dashboard key', async () => {
  const { token, jwk } = await accessJwt();
  const seen = [];
  await withAccessCerts(jwk, async () => {
    const res = await worker.fetch(new Request('https://db.nice.okinawa/control', {
      headers: { 'cf-access-jwt-assertion': token }
    }), {
      ...envWithAccess({}),
      ANALYTICS: {
        async fetch(request) {
          seen.push({
            url: request.url,
            key: request.headers.get('x-dashboard-key')
          });
          return Response.json({ ok: true });
        }
      }
    }, {});
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });
  assert.deepEqual(seen, [{ url: 'https://analytics.nice.okinawa/control', key: 'dash' }]);
});

test('program analytics endpoints require x-dashboard-key even with a valid Access JWT', async () => {
  const { token, jwk } = await accessJwt();
  await withAccessCerts(jwk, async () => {
    const res = await worker.fetch(new Request('https://db.nice.okinawa/alerts/check', {
      headers: { 'cf-access-jwt-assertion': token }
    }), envWithAccess({}), {});
    assert.equal(res.status, 403);
  });

  const withKey = await worker.fetch(new Request('https://db.nice.okinawa/alerts/check', {
    headers: { 'x-dashboard-key': 'dash' }
  }), {
    ...envWithKv({}),
    ANALYTICS: {
      async fetch() {
        return Response.json({ ok: true });
      }
    }
  }, {});
  assert.equal(withKey.status, 200);
});

test('/orders returns sorted masked order source rows and distributions', async () => {
  const records = {
    'paypal_order_meta:older-order-123456': JSON.stringify({
      order_id: 'older-order-123456',
      email: 'alice@example.com',
      product_type: 'pro',
      plan: 'monthly',
      service: 'bjt',
      amount: '980',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      buyer_location_basis: 'self',
      ip: '203.0.113.12',
      ip_country: 'JP',
      overseas_region: '',
      created_at: '2026-07-01T00:00:00.000Z',
      updated_at: '2026-07-01T00:00:00.000Z',
      status: 'captured',
      source: 'paypal',
      paypal_payer_country: 'JP',
      captured_at: '2026-07-01T00:01:00.000Z',
      business_record_key: 'business:older',
      first_ref: 'google.com',
      first_landing: '/en/free-practice/'
    }),
    'paypal_order_meta:newer-order-ABCDEF': JSON.stringify({
      order_id: 'newer-order-ABCDEF',
      email: 'bob@example.net',
      product_type: 'pro',
      plan: 'yearly',
      service: 'bjt',
      amount: '9800',
      currency: 'JPY',
      buyer_location: 'overseas',
      buyer_location_label: '台湾',
      buyer_location_basis: 'self',
      ip: '198.51.100.9',
      ip_country: 'JP',
      overseas_region: 'taiwan',
      created_at: '2026-07-02T00:00:00.000Z',
      updated_at: '2026-07-02T00:00:00.000Z',
      status: 'captured',
      source: 'paypal',
      first_ref: 'https://www.google.com/',
      first_landing: '/pro/buy/',
      first_utm: '{"utm_source":"google"}',
      first_seen: '2026-07-01T23:00:00.000Z',
      ui_lang: 'ja',
      paypal_payer_country: 'TW',
      captured_at: '2026-07-02T00:01:00.000Z',
      business_record_key: 'business:newer'
    })
  };

  const res = await worker.fetch(request({ 'x-dashboard-key': 'dash' }), envWithKv(records), {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.source, 'bjt_kv');
  assert.equal(data.source_total_orders, 2);
  assert.equal(data.total_orders, 2);
  assert.deepEqual(Object.keys(data.range_counts).sort(), ['days_30', 'days_7', 'today']);
  assert.deepEqual(data.recent_orders.map((order) => order.order_id), ['newer-order-ABCDEF', 'older-order-123456']);
  assert.deepEqual(data.orders.map((order) => order.order_id), ['newer-order-ABCDEF', 'older-order-123456']);
  assert.equal(data.orders[0].order_short, 'ABCDEF');
  assert.equal(data.orders[0].email_masked, 'b***@example.net');
  assert.equal(data.orders[0].ip, '198.51.100.9');
  assert.equal(data.orders[0].first_ref, 'https://www.google.com/');
  assert.equal(data.orders[0].first_landing, '/pro/buy/');
  assert.equal(data.orders[0].location_mismatch, true);
  assert.equal(data.orders[1].overseas_region, '');
  assert.equal(data.orders[1].location_mismatch, false);
  assert.deepEqual(data.distributions.paypal_payer_country, [
    { value: 'JP', count: 1 },
    { value: 'TW', count: 1 }
  ]);
  assert.deepEqual(data.paid_channel_summary.by_ref, [
    { value: 'google', count: 2, amounts: [{ currency: 'JPY', amount: 10780 }] }
  ]);
  assert.deepEqual(data.paid_channel_summary.by_landing, [
    { value: '/en/free-practice/', count: 1, amounts: [{ currency: 'JPY', amount: 980 }] },
    { value: '/pro/buy/', count: 1, amounts: [{ currency: 'JPY', amount: 9800 }] }
  ]);
});

test('/orders day mode counts only paid, deduped, non-test orders', async () => {
  const fallbackBase = Math.floor((Date.now() - 3 * 86400000) / 60000) * 60000;
  const records = {
    'paypal_order_meta:paid-captured': JSON.stringify({
      order_id: 'paid-captured',
      email: 'real1@example.com',
      plan: 'monthly',
      amount: '1900',
      currency: 'JPY',
      created_at: isoDaysAgo(0),
      updated_at: isoDaysAgo(0),
      status: 'captured'
    }),
    'paypal_order_meta:paid-completed': JSON.stringify({
      order_id: 'paid-completed',
      email: 'real2@example.com',
      plan: 'yearly',
      amount: '7200',
      currency: 'JPY',
      created_at: isoDaysAgo(2),
      status: 'completed'
    }),
    'paypal_order_meta:pending-real': JSON.stringify({
      order_id: 'pending-real',
      email: 'real3@example.com',
      plan: 'monthly',
      amount: '1900',
      currency: 'JPY',
      created_at: isoDaysAgo(1),
      status: 'pending'
    }),
    'paypal_order_meta:duplicate-draft': JSON.stringify({
      order_id: 'paid-captured',
      email: 'real1@example.com',
      plan: 'monthly',
      amount: '1900',
      currency: 'JPY',
      created_at: isoDaysAgo(0, -1000),
      updated_at: isoDaysAgo(0, -1000),
      status: 'created'
    }),
    'paypal_order_meta:fallback-a': JSON.stringify({
      email: 'real4@example.com',
      plan: 'monthly',
      amount: '1200',
      currency: 'JPY',
      created_at: new Date(fallbackBase).toISOString(),
      status: 'captured'
    }),
    'paypal_order_meta:fallback-b': JSON.stringify({
      email: 'real4@example.com',
      plan: 'monthly',
      amount: '1200',
      currency: 'JPY',
      created_at: new Date(fallbackBase + 30_000).toISOString(),
      status: 'captured'
    }),
    'paypal_order_meta:cctest-paid': JSON.stringify({
      order_id: 'cctest-paid',
      email: 'cctest@nice.okinawa',
      plan: 'monthly',
      amount: '1900',
      currency: 'JPY',
      created_at: isoDaysAgo(0),
      status: 'captured'
    }),
    'paypal_order_meta:regtest-paid': JSON.stringify({
      order_id: 'regtest-paid',
      email: 'regtest@example.com',
      plan: 'monthly',
      amount: '1900',
      currency: 'JPY',
      created_at: isoDaysAgo(0),
      status: 'captured'
    }),
    'paypal_order_meta:internal-paid': JSON.stringify({
      order_id: 'internal-paid',
      email: 'internal-test@nice.okinawa',
      plan: 'monthly',
      amount: '1900',
      currency: 'JPY',
      created_at: isoDaysAgo(0),
      status: 'captured'
    })
  };

  const res = await worker.fetch(new Request('https://db.nice.okinawa/orders?days=7', {
    headers: { authorization: AUTH, 'x-dashboard-key': 'dash' }
  }), envWithKv(records), {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.source_total_orders, 9);
  assert.equal(data.source_unique_orders, 4);
  assert.equal(data.source_paid_orders, 3);
  assert.equal(data.total_orders, 3);
  assert.equal(data.captured_total, 3);
  assert.deepEqual(new Set(data.recent_orders.map((order) => order.order_id || order.key)), new Set([
    'paid-captured',
    'paid-completed',
    'fallback-b'
  ]));
  assert.equal(data.recent_orders.some((order) => order.order_id === 'pending-real'), false);
  assert.equal(data.recent_orders.some((order) => order.email.includes('test')), false);
  assert.equal(data.range_counts.days_7, 3);
  assert.equal(data.range_counts.days_30, 3);
});

test('/orders detail mode paginates paid rows and can search all statuses', async () => {
  const records = {
    'paypal_order_meta:paid-alpha': JSON.stringify({
      order_id: 'paid-alpha',
      email: 'alpha@example.com',
      plan: 'pro',
      amount: '1900',
      currency: 'JPY',
      created_at: '2026-08-03T00:00:00.000Z',
      status: 'captured',
      paypal_capture_id: '9PAYPALALPHA'
    }),
    'paypal_order_meta:paid-beta': JSON.stringify({
      order_id: 'paid-beta',
      email: 'beta@example.com',
      plan: 'score_check',
      amount: '7200',
      currency: 'JPY',
      created_at: '2026-08-02T00:00:00.000Z',
      status: 'completed'
    }),
    'paypal_order_meta:pending-gamma': JSON.stringify({
      order_id: 'pending-gamma',
      email: 'gamma@example.com',
      plan: 'pro',
      amount: '7200',
      currency: 'JPY',
      created_at: '2026-08-01T00:00:00.000Z',
      status: 'pending'
    })
  };

  const pageOne = await worker.fetch(new Request('https://db.nice.okinawa/orders?detail=1&page_size=1', {
    headers: { authorization: AUTH, 'x-dashboard-key': 'dash' }
  }), envWithKv(records), {});
  const pageOneData = await pageOne.json();
  assert.equal(pageOne.status, 200);
  assert.equal(pageOneData.detail, true);
  assert.equal(pageOneData.status_mode, 'paid');
  assert.equal(pageOneData.total_orders, 2);
  assert.equal(pageOneData.total_pages, 2);
  assert.equal(pageOneData.has_next_page, true);
  assert.deepEqual(pageOneData.orders.map((order) => order.order_id), ['paid-alpha']);
  assert.equal(pageOneData.orders[0].paypal_transaction_id, '9PAYPALALPHA');
  assert.deepEqual(pageOneData.totals, [{ currency: 'JPY', count: 2, amount: 9100 }]);

  const searchAll = await worker.fetch(new Request('https://db.nice.okinawa/orders?detail=1&status=all&q=gamma', {
    headers: { authorization: AUTH, 'x-dashboard-key': 'dash' }
  }), envWithKv(records), {});
  const searchAllData = await searchAll.json();
  assert.equal(searchAll.status, 200);
  assert.equal(searchAllData.status_mode, 'all');
  assert.equal(searchAllData.total_orders, 1);
  assert.deepEqual(searchAllData.orders.map((order) => order.order_id), ['pending-gamma']);
});

test('/orders follows BJT_KV pagination before building dashboard data', async () => {
  const records = {
    'paypal_order_meta:first-page': JSON.stringify({
      order_id: 'first-page',
      email: 'first@example.com',
      plan: 'monthly',
      amount: '1000',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip_country: 'JP',
      created_at: '2026-07-01T00:00:00.000Z',
      status: 'captured'
    }),
    'paypal_order_meta:second-page': JSON.stringify({
      order_id: 'second-page',
      email: 'second@example.com',
      plan: 'yearly',
      amount: '9800',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip_country: 'JP',
      created_at: '2026-07-02T00:00:00.000Z',
      status: 'captured'
    })
  };
  const seenOptions = [];
  const env = envWithKv(records, {
    BJT_KV: {
      async list(options) {
        seenOptions.push({ ...options });
        if (!options.cursor) {
          return {
            keys: [{ name: 'paypal_order_meta:first-page' }],
            list_complete: false,
            cursor: 'next-page'
          };
        }
        assert.equal(options.cursor, 'next-page');
        return {
          keys: [{ name: 'paypal_order_meta:second-page' }],
          list_complete: true
        };
      },
      async get(name) {
        if (Array.isArray(name)) {
          return new Map(name.map((key) => [key, records[key] || null]));
        }
        return records[name] || null;
      }
    }
  });

  const res = await worker.fetch(request(), env, {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(seenOptions, [
    { prefix: 'paypal_order_meta:' },
    { prefix: 'paypal_order_meta:', cursor: 'next-page' }
  ]);
  assert.equal(data.source_total_orders, 2);
  assert.deepEqual(data.recent_orders.map((order) => order.order_id), ['second-page', 'first-page']);
});

test('/orders reuses parsed order rows cache for repeated dashboard loads', async () => {
  let listCalls = 0;
  let getCalls = 0;
  const records = {
    'paypal_order_meta:cached-order': JSON.stringify({
      order_id: 'cached-order',
      email: 'cache@example.com',
      plan: 'monthly',
      amount: '1000',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip_country: 'JP',
      created_at: new Date().toISOString(),
      status: 'captured'
    })
  };
  const env = envWithKv(records, {
    BJT_KV: {
      async list(options) {
        assert.equal(options.prefix, 'paypal_order_meta:');
        listCalls += 1;
        return { keys: [{ name: 'paypal_order_meta:cached-order' }] };
      },
      async get(name) {
        getCalls += 1;
        if (Array.isArray(name)) {
          return new Map(name.map((key) => [key, records[key] || null]));
        }
        return records[name] || null;
      }
    }
  });

  const first = await worker.fetch(request(), env, {});
  const firstData = await first.json();
  const second = await worker.fetch(request(), env, {});
  const secondData = await second.json();

  assert.equal(firstData.cache_status, 'miss');
  assert.equal(secondData.cache_status, 'hit');
  assert.equal(firstData.source_total_orders, 1);
  assert.equal(secondData.source_total_orders, 1);
  assert.equal(listCalls, 1);
  assert.equal(getCalls, 1);
});

test('/orders loads source rows with KV bulk get chunks', async () => {
  const records = {};
  for (let i = 0; i < 101; i += 1) {
    const key = 'paypal_order_meta:bulk-' + String(i).padStart(3, '0');
    records[key] = JSON.stringify({
      order_id: 'bulk-' + String(i).padStart(3, '0'),
      email: 'bulk@example.com',
      plan: 'monthly',
      amount: '1000',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip_country: 'JP',
      created_at: new Date(Date.now() - i * 1000).toISOString(),
      status: 'captured'
    });
  }
  const bulkGetSizes = [];
  const env = envWithKv(records, {
    BJT_KV: {
      async list(options) {
        assert.equal(options.prefix, 'paypal_order_meta:');
        assert.equal(options.cursor, undefined);
        return { keys: Object.keys(records).map((name) => ({ name })) };
      },
      async get(keys, options) {
        assert.equal(Array.isArray(keys), true);
        assert.deepEqual(options, { type: 'text', cacheTtl: 60 });
        bulkGetSizes.push(keys.length);
        return new Map(keys.map((key) => [key, records[key] || null]));
      }
    }
  });

  const res = await worker.fetch(request(), env, {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(bulkGetSizes, [100, 1]);
  assert.equal(data.source_total_orders, 101);
  assert.equal(data.recent_orders.length, 10);
});

test('/orders month mode uses JST boundaries and separates captured from excluded statuses', async () => {
  const records = {
    'paypal_order_meta:june-jst-last': JSON.stringify({
      order_id: 'june-jst-last',
      email: 'june@example.com',
      product_type: 'pro',
      plan: 'monthly',
      amount: '1000',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip: '203.0.113.1',
      ip_country: 'JP',
      overseas_region: '',
      created_at: '2026-06-30T14:59:59.000Z',
      status: 'captured',
      paypal_payer_country: 'JP',
      captured_at: '2026-06-30T15:02:00.000Z'
    }),
    'paypal_order_meta:july-jst-first': JSON.stringify({
      order_id: 'july-jst-first',
      email: 'first@example.com',
      product_type: 'pro',
      plan: 'monthly',
      amount: '1200',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip: '203.0.113.2',
      ip_country: 'JP',
      overseas_region: '',
      created_at: '2026-06-30T15:00:00.000Z',
      status: 'captured',
      paypal_payer_country: 'JP',
      captured_at: '2026-06-30T15:03:00.000Z'
    }),
    'paypal_order_meta:july-overseas': JSON.stringify({
      order_id: 'july-overseas',
      email: 'overseas@example.com',
      product_type: 'pro',
      plan: 'yearly',
      amount: '50',
      currency: 'USD',
      buyer_location: 'overseas',
      buyer_location_label: '海外',
      ip: '198.51.100.2',
      ip_country: 'US',
      overseas_region: 'usa',
      created_at: '2026-07-10T01:00:00.000Z',
      status: 'captured',
      paypal_payer_country: 'US',
      captured_at: '2026-07-10T01:01:00.000Z'
    }),
    'paypal_order_meta:july-pending': JSON.stringify({
      order_id: 'july-pending',
      email: 'pending@example.com',
      product_type: 'pro',
      plan: 'monthly',
      amount: '980',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip: '203.0.113.3',
      ip_country: 'JP',
      overseas_region: '',
      created_at: '2026-07-31T14:59:59.000Z',
      status: 'pending',
      paypal_payer_country: '',
      captured_at: ''
    }),
    'paypal_order_meta:august-jst-first': JSON.stringify({
      order_id: 'august-jst-first',
      email: 'august@example.com',
      product_type: 'pro',
      plan: 'monthly',
      amount: '1000',
      currency: 'JPY',
      buyer_location: 'japan',
      buyer_location_label: '日本',
      ip: '203.0.113.4',
      ip_country: 'JP',
      overseas_region: '',
      created_at: '2026-07-31T15:00:00.000Z',
      status: 'captured',
      paypal_payer_country: 'JP',
      captured_at: '2026-07-31T15:02:00.000Z'
    })
  };

  const res = await worker.fetch(new Request('https://db.nice.okinawa/orders?month=2026-07', {
    headers: { authorization: AUTH, 'x-dashboard-key': 'dash' }
  }), envWithKv(records), {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.mode, 'month');
  assert.equal(data.month_start_jst, '2026-07-01T00:00:00+09:00');
  assert.equal(data.month_end_jst, '2026-08-01T00:00:00+09:00');
  assert.deepEqual(data.captured_orders.map((order) => order.order_id), ['july-overseas', 'july-jst-first']);
  assert.deepEqual(data.excluded_orders.map((order) => order.order_id), ['july-pending']);
  assert.equal(data.total_orders, 2);
  assert.equal(data.captured_total, 2);
  assert.equal(data.excluded_total, 1);
  assert.deepEqual(data.tax_totals, [
    {
      currency: 'JPY',
      japan_count: 1,
      japan_amount: 1200,
      overseas_count: 0,
      overseas_amount: 0,
      total_count: 1,
      total_amount: 1200
    },
    {
      currency: 'USD',
      japan_count: 0,
      japan_amount: 0,
      overseas_count: 1,
      overseas_amount: 50,
      total_count: 1,
      total_amount: 50
    }
  ]);
});

test('/orders empty month keeps exportable response shape', async () => {
  const res = await worker.fetch(new Request('https://db.nice.okinawa/orders?month=2026-05', {
    headers: { authorization: AUTH, 'x-dashboard-key': 'dash' }
  }), envWithKv({}), {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.mode, 'month');
  assert.equal(data.month, '2026-05');
  assert.deepEqual(data.orders, []);
  assert.deepEqual(data.captured_orders, []);
  assert.deepEqual(data.excluded_orders, []);
  assert.deepEqual(data.tax_totals, []);
});
