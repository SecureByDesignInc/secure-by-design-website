// Pay-what-you-can support through Stripe Checkout on the homepage community panel (17 October 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyticsFor, checkoutForm, supportApi, supportCents, verifyStripeSignature, wallName } from '../server/support.js';

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

test('restricted keys and pasted spaces still turn payments on', async () => {
  for (const key of ['rk_test_example', 'rk_live_example', 'sk_live_example', ' sk_test_example ']) {
    const response = await supportApi(new Request('https://securebydesigninc.com/api/support/wall'), { DB: fakeDb(), STRIPE_SECRET_KEY: key, STRIPE_WEBHOOK_SECRET: ' whsec_example' });
    assert.equal((await response.json()).enabled, true, key);
  }
  const wrong = await supportApi(new Request('https://securebydesigninc.com/api/support/wall'), { DB: fakeDb(), STRIPE_SECRET_KEY: 'whsec_swapped', STRIPE_WEBHOOK_SECRET: 'sk_test_swapped' });
  assert.equal((await wrong.json()).enabled, false, 'swapped values stay off');
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

test('support analytics events carry amounts and choices, never names or Stripe IDs', () => {
  const paid = analyticsFor({ type: 'checkout.session.completed', data: { object: { id: 'cs_1', mode: 'payment', payment_status: 'paid', amount_total: 1250, metadata: { list_name: 'yes', display_name: 'Ada', badge: 'no' } } } });
  assert.equal(paid.event, 'support_payment_completed');
  assert.deepEqual({ frequency: paid.properties.frequency, amount_usd: paid.properties.amount_usd, listed: paid.properties.listed, badge: paid.properties.badge }, { frequency: 'once', amount_usd: 12.5, listed: true, badge: false });
  assert.doesNotMatch(JSON.stringify(paid.properties), /Ada|cs_1/);
  assert.equal(analyticsFor({ type: 'checkout.session.completed', data: { object: { id: 'cs_2', payment_status: 'unpaid' } } }), null);
  assert.equal(analyticsFor({ type: 'invoice.paid', data: { object: { billing_reason: 'subscription_create', amount_paid: 500 } } }), null, 'the first monthly payment is counted once, at checkout');
  assert.equal(analyticsFor({ type: 'invoice.paid', data: { object: { billing_reason: 'subscription_cycle', amount_paid: 500, subscription: 'sub_1' } } }).properties.amount_usd, 5);
  assert.equal(analyticsFor({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } }).event, 'support_monthly_cancelled');
  assert.equal(analyticsFor({ type: 'charge.refunded', data: { object: { amount_refunded: 1000 }, previous_attributes: { amount_refunded: 400 } } }).properties.amount_usd, 6);
});

test('a paid checkout is sent to PostHog when the key is set, and a PostHog failure changes nothing', async () => {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); throw new Error('offline'); };
  try {
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_9', mode: 'subscription', subscription: 'sub_9', payment_status: 'paid', amount_total: 500, metadata: { list_name: 'no', badge: 'yes' } } } });
    const header = await sign(payload, 'whsec_example', Math.floor(Date.now() / 1000));
    const response = await supportApi(new Request('https://securebydesigninc.com/api/support/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header } }), { ...env(fakeDb()), POSTHOG_KEY: 'phc_example' });
    assert.equal(response.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].body.event, 'support_payment_completed');
    assert.equal(sent[0].body.properties.frequency, 'monthly');
    assert.equal(sent[0].body.properties.$process_person_profile, false);
    assert.match(sent[0].body.distinct_id, /^support_[0-9a-f]{24}$/);
    assert.doesNotMatch(JSON.stringify(sent[0].body), /cs_test_9|sub_9/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('the panel tags its help actions and checkout for the analytics dashboard', () => {
  const panel = read('app/home-community-panel.tsx');
  for (const action of ['share_lesson', 'linkedin_portfolio', 'discord_answer', 'report_error', 'pass_it_on']) assert.match(panel, new RegExp(action));
  assert.match(panel, /data-track="support_help_click"/);
  assert.match(panel, /track\('support_checkout_started'/);
  assert.doesNotMatch(panel, /track\([^)]*displayName/, 'display names are never sent to analytics');
  assert.match(read('app/privacy/page.tsx'), /counted in PostHog as an anonymous event/);
});

test('the panel has its own working Pass it on button, and the form has no extra help link', () => {
  // Owner's report, 17 October 2026: the panel's Pass it on (the footer's share button reused) didn't work,
  // and the "Can't chip in? Here's how to help" link under the Stripe line should go.
  const panel = read('app/home-community-panel.tsx');
  assert.doesNotMatch(panel, /FooterShare/, 'the panel no longer reuses the footer button');
  assert.match(panel, /function PassItOn\(\)/);
  assert.match(panel, /<PassItOn\/>/);
  assert.match(panel, /onClick=\{\(\) => \{ void pass\(\); \}\}/);
  assert.match(panel, /homepageShareUrl/, 'it always shares the homepage');
  assert.match(panel, /\(pointer: coarse\)/, 'computers copy the link; phones open the share sheet');
  assert.match(panel, /Link copied\. Ready to pass it on\./);
  assert.doesNotMatch(panel, /<a className="sbd-inline-link" href="#help">/, 'the link under the Stripe line is gone');
  assert.match(panel, /<h3>Can’t chip in\? Here’s how to help\.<\/h3>/, 'the heading above the help cards stays');
});
