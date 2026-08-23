import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/worker.js';

const AUTH = 'Basic ' + btoa('wan:pass');

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
      ...headers
    }
  });
}

test('/orders keeps Basic protection before dashboard key checks', async () => {
  const res = await worker.fetch(new Request('https://db.nice.okinawa/orders'), envWithKv({}), {});
  assert.equal(res.status, 401);
});

test('/orders allows Basic-authenticated dashboard requests without x-dashboard-key', async () => {
  const res = await worker.fetch(request(), envWithKv({}), {});
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.total_orders, 0);
});

test('/orders remains fail-closed when DASHBOARD_KEY is missing', async () => {
  const res = await worker.fetch(request(), envWithKv({}, { DASHBOARD_KEY: '' }), {});
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { ok: false, error: 'unauthorized' });
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
      business_record_key: 'business:older'
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
  assert.equal(data.total_orders, 3);
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
