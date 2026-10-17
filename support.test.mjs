// Pay-what-you-can support through Stripe Checkout on the homepage community panel (17 October 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkoutForm, supportApi, supportCents, verifyStripeSignature, wallName } from '../server/support.js';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const hex = buffer => Array.from(new Uint8Array(buffer), n => n.toString(16).padStart(2, '0')).join('');
async function sign(payload, secret, timestamp) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${timestamp},v1=${hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)))}`;
}

// A tiny stand-in for D1 that records the statements the handler runs.
function fakeDb(rows = []) {
  const runs = [];
  return {
    runs,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            run: async () => { runs.push({ sql, values }); return {}; },
            first: async () => { runs.push({ sql, values }); return { count: 1 }; },
            all: async () => ({ results: rows }),
          };
        },
      };
    },
  };
}
const env = db => ({ DB: db, STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_WEBHOOK_SECRET: 'whsec_example' });

test('amounts run from $1 to $5,000 in dollars and cents', () => {
  assert.equal(supportCents(10), 1000);
  assert.equal(supportCents('12.50'), 1250);
  assert.equal(supportCents('1'), 100);
  assert.equal(supportCents('5000'), 500000);
  for (const bad of ['0.99', '5000.01', '-5', '12.345', 'ten', '', null, undefined, '1e3']) assert.equal(supportCents(bad), null, String(bad));
});

test('wall names are short and carry no links, markup or emails', () => {
  assert.equal(wallName('  Ada   Lovelace '), 'Ada Lovelace');
  assert.equal(wallName('The Blue Team'), 'The Blue Team');
  for (const bad of ['', '   ', 'x'.repeat(41), 'see https://spam', 'www.spam', 'buy.com now', 'me@example', '<b>hi</b>', 42]) assert.equal(wallName(bad), null, String(bad));
});

test('webhook signatures must match the secret and be recent', async () => {
  const payload = '{"type":"checkout.session.completed"}', now = 1_800_000_000;
  const header = await sign(payload, 'whsec_example', now);
  assert.equal(await verifyStripeSignature(payload, header, 'whsec_example', now), true);
  assert.equal(await verifyStripeSignature(payload + ' ', header, 'whsec_example', now), false);
  assert.equal(await verifyStripeSignature(payload, header, 'whsec_other', now), false);
  assert.equal(await verifyStripeSignature(payload, header, 'whsec_example', now + 301), false);
  assert.equal(await verifyStripeSignature(payload, null, 'whsec_example', now), false);
});

test('checkout sessions: Just once is a payment, Monthly is a monthly subscription', () => {
  const once = checkoutForm({ origin: 'https://securebydesigninc.com', cents: 1000, monthly: false, listName: false, displayName: null, badge: false });
  assert.equal(once.get('mode'), 'payment');
  assert.equal(once.get('line_items[0][price_data][unit_amount]'), '1000');
  assert.equal(once.get('line_items[0][price_data][recurring][interval]'), null);
  assert.equal(once.get('success_url'), 'https://securebydesigninc.com/?support=thanks#community');
  assert.equal(once.get('metadata[display_name]'), null, 'no name unless the supporter asks to be listed');
  const monthly = checkoutForm({ origin: 'https://securebydesigninc.com', cents: 500, monthly: true, listName: true, displayName: 'Ada', badge: true });
  assert.equal(monthly.get('mode'), 'subscription');
  assert.equal(monthly.get('line_items[0][price_data][recurring][interval]'), 'month');
  assert.equal(monthly.get('subscription_data[metadata][display_name]'), 'Ada');
  assert.equal(monthly.get('metadata[badge]'), 'yes');
  assert.doesNotMatch(once.toString() + monthly.toString(), /donat/i, 'support is not described as a donation');
});

test('payments stay off until both Stripe secrets are set', async () => {
  const response = await supportApi(new Request('https://securebydesigninc.com/api/support/wall'), { DB: fakeDb() });
  assert.equal((await response.json()).enabled, false);
  const checkout = await supportApi(new Request('https://securebydesigninc.com/api/support/checkout', { method: 'POST', body: '{}' }), { DB: fakeDb(), STRIPE_SECRET_KEY: 'sk_test_example' });
  assert.equal(checkout.status, 503);
});

test('checkout rejects bad input before calling Stripe', async () => {
  const post = body => supportApi(new Request('https://securebydesigninc.com/api/support/checkout', { method: 'POST', body: JSON.stringify(body) }), env(fakeDb()));
  assert.equal((await post({ frequency: 'yearly', amount: 10 })).status, 400);
  assert.equal((await post({ frequency: 'once', amount: 0.5 })).status, 400);
  assert.equal((await post({ frequency: 'once', amount: 10, listName: true, displayName: 'visit https://spam' })).status, 400);
});

test('a paid checkout adds a listed name to the wall; unsigned events are refused', async () => {
  const db = fakeDb();
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', mode: 'subscription', subscription: 'sub_1', payment_status: 'paid', metadata: { list_name: 'yes', display_name: 'Ada' } } } });
  const unsigned = await supportApi(new Request('https://securebydesigninc.com/api/support/webhook', { method: 'POST', body: payload }), env(db));
  assert.equal(unsigned.status, 400);
  assert.equal(db.runs.length, 0);
  const header = await sign(payload, 'whsec_example', Math.floor(Date.now() / 1000));
  const signed = await supportApi(new Request('https://securebydesigninc.com/api/support/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header } }), env(db));
  assert.equal(signed.status, 200);
  assert.match(db.runs[0].sql, /INSERT INTO support_wall/);
  assert.deepEqual(db.runs[0].values.slice(0, 4), ['cs_test_1', 'sub_1', 'Ada', 1]);
});

test('the wall lists only shown names, newest first, and the route and migration exist', async () => {
  const response = await supportApi(new Request('https://securebydesigninc.com/api/support/wall'), env(fakeDb([{ name: 'Ada', monthly: 1 }, { name: 'Grace', monthly: 0 }])));
  assert.deepEqual((await response.json()).supporters, [{ name: 'Ada', monthly: true }, { name: 'Grace', monthly: false }]);
  assert.match(read('server/support.js'), /WHERE hidden=0 ORDER BY created_at DESC/);
  assert.match(read('server/index.js'), /\/api\\\/support/);
  assert.match(read('drizzle/0017_support_wall.sql'), /CREATE TABLE IF NOT EXISTS `support_wall`/);
  assert.doesNotMatch(read('server/support.js'), /sk_live_[A-Za-z0-9]{8}|whsec_[A-Za-z0-9]{8}/, 'no real keys in the repository');
});

test('the panel uses Stripe checkout, keeps Just once first, and states Stripe in the privacy policy', () => {
  const panel = read('app/home-community-panel.tsx');
  assert.match(panel, /\/api\/support\/checkout/);
  assert.match(panel, /\/api\/support\/wall/);
  assert.match(panel, /checkout\.stripe\.com/);
  assert.ok(panel.indexOf('>Just once<') < panel.indexOf('>Monthly<'));
  assert.match(read('app/privacy/page.tsx'), /<strong>Stripe<\/strong> processes support payments/);
});
