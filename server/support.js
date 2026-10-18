// Pay-what-you-can support on the homepage community panel (17 October 2026), through Stripe Checkout.
//
// Secrets, set in the Worker's settings in Cloudflare (never in the repository):
//   STRIPE_SECRET_KEY      the Stripe secret or restricted key (sk_/rk_test_… while testing, sk_/rk_live_… when live)
//   STRIPE_WEBHOOK_SECRET  the signing secret of the webhook endpoint below (whsec_…)
// Until both are set, /api/support/wall reports enabled:false and the Support button stays disabled.
// Optional plain variable: STRIPE_PORTAL_LOGIN_URL, the customer portal login link from Stripe's
// Settings > Customer portal (https://billing.stripe.com/p/login/…), shown as "Manage monthly support".
//
// Routes:
//   GET  /api/support/wall      whether payments are on, and the names supporters chose to list
//   POST /api/support/checkout  starts a Stripe Checkout session for the chosen amount, once or monthly
//   POST /api/support/webhook   Stripe's events: adds a listed name once a payment succeeds
//
// Analytics: when the Worker has a POSTHOG_KEY, completed support payments, monthly renewals,
// cancellations and refunds are also sent to PostHog as anonymous events (support_payment_completed,
// support_monthly_renewed, support_monthly_cancelled, support_refunded) for the website analytics
// dashboard. They carry the amount, once or monthly, and whether the supporter chose a wall listing or
// badge; never a name, email, card or Stripe ID. Renewals and refunds need the invoice.paid and
// charge.refunded events added to the Stripe webhook.
//
// Card details never touch this site: Stripe's hosted checkout collects them. The only supporter data
// stored here is a display name someone chose to list, whether their support is monthly, and the Stripe
// session and subscription IDs that tie the name to a completed payment.

const STRIPE_API = 'https://api.stripe.com/v1';
const MIN_DOLLARS = 1;
const MAX_DOLLARS = 5000;
const NAME_MAX = 40;
const WALL_LIMIT = 60;
const SIGNATURE_TOLERANCE_SECONDS = 300;
const CHECKOUTS_PER_HOUR = 20;
// PostHog's US ingestion endpoint, matching POSTHOG_REGION in server/analytics.js.
const POSTHOG_CAPTURE = 'https://us.i.posthog.com/i/v0/e/';

const json = (body, status = 200, cache = 'no-store') => Response.json(body, { status, headers: { 'cache-control': cache } });
// A full secret key (sk_…) or a restricted key (rk_…, Stripe's default when a key is created with chosen permissions).
const stripeKey = env => typeof env.STRIPE_SECRET_KEY === 'string' ? env.STRIPE_SECRET_KEY.trim() : '';
const webhookSecret = env => typeof env.STRIPE_WEBHOOK_SECRET === 'string' ? env.STRIPE_WEBHOOK_SECRET.trim() : '';
const enabled = env => /^(sk|rk)_(test|live)_/.test(stripeKey(env)) && webhookSecret(env).startsWith('whsec_');
const hex = buffer => Array.from(new Uint8Array(buffer), n => n.toString(16).padStart(2, '0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));

// Amount in whole cents from a dollar figure such as 10, "10", or "12.50". Null when outside $1–$5,000.
export function supportCents(value) {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(text)) return null;
  const cents = Math.round(Number(text) * 100);
  return cents >= MIN_DOLLARS * 100 && cents <= MAX_DOLLARS * 100 ? cents : null;
}

// A display name fit for the public wall, or null. No links, markup, emails or control characters.
export function wallName(value) {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex -- control and invisible characters are removed on purpose
  const name = value.normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f]/g, '').replace(/\s+/g, ' ').trim();
  if (!name || name.length > NAME_MAX) return null;
  if (/[<>{}[\]\\`]|https?:|www\.|\.(com|net|org|io|gg|ru|xyz)\b|@/i.test(name)) return null;
  return name;
}

// One anonymous support event for the analytics dashboard. Best effort: a PostHog problem never
// affects the payment or the supporter wall.
export function supportEvent(event, properties, distinctSeed) {
  return { event, properties: { ...properties, source: 'stripe_webhook', $process_person_profile: false }, distinctSeed };
}

async function sendToPostHog(env, item) {
  if (typeof env.POSTHOG_KEY !== 'string' || !env.POSTHOG_KEY || !item) return;
  try {
    await fetch(POSTHOG_CAPTURE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: env.POSTHOG_KEY, event: item.event, distinct_id: `support_${(await digest(item.distinctSeed)).slice(0, 24)}`, properties: item.properties, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    console.error('PostHog support event failed', error?.name);
  }
}

// The analytics event for a Stripe event, or null. Amounts are in US dollars.
export function analyticsFor(event) {
  const object = event?.data?.object;
  if (!object) return null;
  const dollars = cents => Math.round(Number(cents || 0)) / 100;
  if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && object.payment_status === 'paid') {
    return supportEvent('support_payment_completed', {
      frequency: object.mode === 'subscription' ? 'monthly' : 'once',
      amount_usd: dollars(object.amount_total),
      listed: object.metadata?.list_name === 'yes',
      badge: object.metadata?.badge === 'yes',
    }, String(object.id));
  }
  if (event.type === 'invoice.paid' && object.billing_reason === 'subscription_cycle') {
    return supportEvent('support_monthly_renewed', { frequency: 'monthly', amount_usd: dollars(object.amount_paid) }, String(object.subscription || object.id));
  }
  if (event.type === 'customer.subscription.deleted') {
    return supportEvent('support_monthly_cancelled', { frequency: 'monthly' }, String(object.id));
  }
  if (event.type === 'charge.refunded') {
    const previous = Number(event.data?.previous_attributes?.amount_refunded || 0);
    const refunded = Number(object.amount_refunded || 0) - previous;
    return refunded > 0 ? supportEvent('support_refunded', { amount_usd: dollars(refunded) }, String(object.payment_intent || object.id)) : null;
  }
  return null;
}

// Stripe's webhook signature: header "t=<unix>,v1=<hex hmac>" over "<t>.<raw body>" with the endpoint secret.
export async function verifyStripeSignature(payload, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (typeof header !== 'string' || typeof secret !== 'string' || !secret) return false;
  const parts = header.split(',').map(part => part.split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!Number.isInteger(timestamp) || !signatures.length || Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some(signature => {
    if (signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

// The form fields Stripe's API expects for a Checkout session.
export function checkoutForm({ origin, cents, monthly, listName, displayName, badge }) {
  const form = new URLSearchParams();
  form.set('mode', monthly ? 'subscription' : 'payment');
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'usd');
  form.set('line_items[0][price_data][unit_amount]', String(cents));
  form.set('line_items[0][price_data][product_data][name]', monthly ? 'Monthly support for Secure By Design' : 'Support for Secure By Design');
  if (monthly) form.set('line_items[0][price_data][recurring][interval]', 'month');
  form.set('success_url', `${origin}/?support=thanks#community`);
  form.set('cancel_url', `${origin}/#community`);
  const metadata = { source: 'homepage-panel', frequency: monthly ? 'monthly' : 'once', list_name: listName ? 'yes' : 'no', badge: badge ? 'yes' : 'no' };
  if (listName && displayName) metadata.display_name = displayName;
  for (const [key, value] of Object.entries(metadata)) {
    form.set(`metadata[${key}]`, value);
    if (monthly) form.set(`subscription_data[metadata][${key}]`, value);
    else form.set(`payment_intent_data[metadata][${key}]`, value);
  }
  if (!monthly) {
    form.set('submit_type', 'pay');
    form.set('payment_intent_data[description]', 'Support for Secure By Design');
  }
  return form;
}

async function allowCheckout(env, request) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const hour = new Date().toISOString().slice(0, 13);
  const expires = new Date(Date.now() + 3600000).toISOString();
  await env.DB.prepare('DELETE FROM support_checkout_limits WHERE expires_at < ?').bind(new Date().toISOString()).run();
  const row = await env.DB.prepare('INSERT INTO support_checkout_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count')
    .bind(await digest(`checkout:${hour}:${ip}`), expires, CHECKOUTS_PER_HOUR).first();
  return !!row;
}

async function startCheckout(request, env) {
  if (!enabled(env)) return json({ error: 'Online payments aren’t open yet.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Something went wrong. Please try again.' }, 400); }
  const monthly = body?.frequency === 'monthly';
  if (body?.frequency !== 'monthly' && body?.frequency !== 'once') return json({ error: 'Choose Just once or Monthly.' }, 400);
  const cents = supportCents(body?.amount);
  if (cents === null) return json({ error: `Enter an amount from $${MIN_DOLLARS} to $${MAX_DOLLARS.toLocaleString('en-US')}.` }, 400);
  const listName = body?.listName === true;
  const displayName = listName ? wallName(body?.displayName) : null;
  if (listName && !displayName) return json({ error: `Enter a display name of up to ${NAME_MAX} characters, without links or email addresses.` }, 400);
  if (!await allowCheckout(env, request)) return json({ error: 'Please wait a little before trying again.' }, 429);
  const origin = new URL(request.url).origin;
  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${stripeKey(env)}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: checkoutForm({ origin, cents, monthly, listName, displayName, badge: body?.badge === true }),
  });
  const session = await response.json().catch(() => null);
  if (!response.ok || typeof session?.url !== 'string') {
    console.error('Stripe checkout failed', response.status, session?.error?.type, session?.error?.code);
    return json({ error: 'Checkout couldn’t start. Please try again in a moment.' }, 502);
  }
  return json({ url: session.url });
}

async function handleWebhook(request, env) {
  if (!enabled(env)) return json({ error: 'Not configured.' }, 503);
  const payload = await request.text();
  if (!await verifyStripeSignature(payload, request.headers.get('stripe-signature'), webhookSecret(env))) return json({ error: 'Invalid signature.' }, 400);
  let event;
  try { event = JSON.parse(payload); } catch { return json({ error: 'Invalid payload.' }, 400); }
  const object = event?.data?.object;
  // Bank payments can finish later, so a delayed success counts the same as an immediate one.
  if ((event?.type === 'checkout.session.completed' || event?.type === 'checkout.session.async_payment_succeeded') && object?.payment_status === 'paid') {
    const name = object.metadata?.list_name === 'yes' ? wallName(object.metadata?.display_name) : null;
    if (name && typeof object.id === 'string') {
      await env.DB.prepare('INSERT INTO support_wall (session_id,subscription_id,display_name,monthly,created_at) VALUES (?,?,?,?,?) ON CONFLICT(session_id) DO NOTHING')
        .bind(object.id, typeof object.subscription === 'string' ? object.subscription : null, name, object.mode === 'subscription' ? 1 : 0, new Date().toISOString()).run();
    }
  } else if (event?.type === 'customer.subscription.deleted' && typeof object?.id === 'string') {
    // A cancelled monthly supporter stays thanked on the wall, without the Monthly label.
    await env.DB.prepare('UPDATE support_wall SET monthly=0 WHERE subscription_id=?').bind(object.id).run();
  }
  await sendToPostHog(env, analyticsFor(event));
  return json({ received: true });
}

async function wall(env) {
  const { results } = await env.DB.prepare('SELECT display_name AS name, monthly FROM support_wall WHERE hidden=0 ORDER BY created_at DESC LIMIT ?').bind(WALL_LIMIT).all();
  const portal = typeof env.STRIPE_PORTAL_LOGIN_URL === 'string' && env.STRIPE_PORTAL_LOGIN_URL.startsWith('https://billing.stripe.com/') ? env.STRIPE_PORTAL_LOGIN_URL : null;
  return json({ enabled: enabled(env), portal, supporters: (results || []).map(row => ({ name: row.name, monthly: row.monthly === 1 })) }, 200, 'public, max-age=60');
}

export async function supportApi(request, env) {
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  if (path === '/api/support/wall' && request.method === 'GET') return wall(env);
  if (path === '/api/support/checkout' && request.method === 'POST') return startCheckout(request, env);
  if (path === '/api/support/webhook' && request.method === 'POST') return handleWebhook(request, env);
  return json({ error: 'Not found.' }, 404);
}
