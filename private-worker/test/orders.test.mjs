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
        assert.deepEqual(options, { prefix: 'paypal_order_meta:' });
        return { keys: Object.keys(records).map((name) => ({ name })) };
      },
      async get(name) {
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

test('/orders requires x-dashboard-key after Basic auth', async () => {
  const res = await worker.fetch(request(), envWithKv({}), {});
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
      paypal_payer_country: 'TW',
      captured_at: '2026-07-02T00:01:00.000Z',
      business_record_key: 'business:newer'
    })
  };

  const res = await worker.fetch(request({ 'x-dashboard-key': 'dash' }), envWithKv(records), {});
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.total_orders, 2);
  assert.deepEqual(data.orders.map((order) => order.order_id), ['newer-order-ABCDEF', 'older-order-123456']);
  assert.equal(data.orders[0].order_short, 'ABCDEF');
  assert.equal(data.orders[0].email_masked, 'b***@example.net');
  assert.equal(data.orders[0].ip, '198.51.100.9');
  assert.equal(data.orders[0].location_mismatch, true);
  assert.equal(data.orders[1].overseas_region, '');
  assert.equal(data.orders[1].location_mismatch, false);
  assert.deepEqual(data.distributions.paypal_payer_country, [
    { value: 'JP', count: 1 },
    { value: 'TW', count: 1 }
  ]);
});
