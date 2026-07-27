import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import { BEACON_SCRIPT } from '../src/worker.js';

test('beacon script stays small and posts visitor events', () => {
  assert.ok(Buffer.byteLength(BEACON_SCRIPT, 'utf8') < 4096);
  assert.match(BEACON_SCRIPT, /analytics\.nice\.okinawa\/events/);
  assert.doesNotMatch(BEACON_SCRIPT, /analytics\.nice\.okinawa\/collect/);
});

test('beacon script reads explicit data-site and does not infer site from hostname', () => {
  assert.match(BEACON_SCRIPT, /dataset&&s\.dataset\.site/);
  assert.match(BEACON_SCRIPT, /site_id:site/);
  assert.doesNotMatch(BEACON_SCRIPT, /location\.hostname/);
});

test('beacon script guards section_view once per section per session', () => {
  assert.match(BEACON_SCRIPT, /seen=new Set/);
  assert.match(BEACON_SCRIPT, /!seen\.has\(id\)/);
  assert.match(BEACON_SCRIPT, /seen\.add\(id\)/);
  assert.match(BEACON_SCRIPT, /section_view/);
});

test('beacon script keeps only UTM allowlist in landing_url', () => {
  assert.match(BEACON_SCRIPT, /utm_source/);
  assert.match(BEACON_SCRIPT, /utm_medium/);
  assert.match(BEACON_SCRIPT, /utm_campaign/);
  assert.match(BEACON_SCRIPT, /location\.pathname/);
});
