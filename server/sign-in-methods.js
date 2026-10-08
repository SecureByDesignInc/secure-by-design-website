// Sign-in methods beyond email and password: Apple, Google, Microsoft, and passkeys.
// Also: managing linked methods, handing a website sign-in to the app, and deleting an account.
//
// Account rules:
// - A provider identity (provider + subject) belongs to exactly one account.
// - Signing in with a provider whose email is verified by that provider reaches the account with that
//   email, creating it if needed. Unverified provider emails (for example Microsoft work or school
//   accounts) are never matched to or create an account; those learners link the provider from My Account.
// - Linking requires an existing session and a request started on this site.
import { b64url, sha256, randomToken, providers, providerStatus, authorizationUrl, exchangeCode, verifyIdToken } from './oidc.js';
import { verifyRegistration, verifyAssertion, relyingParty, ES256, RS256 } from './webauthn.js';
import { getReader, startBrowserSession, cookie, setCookie, local, digest } from './reader-auth.js';
import { deleteAccount } from './account-deletion.js';

const CANONICAL = 'securebydesigninc.com';
const APP_SCHEME = 'securebydesign';
const reply = (data, status = 200, cookies = []) => {
  const headers = new Headers({ 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' });
  for (const value of cookies) headers.append('set-cookie', value);
  return Response.json(data, { status, headers });
};
function redirect(location, cookies = []) {
  const headers = new Headers({ location, 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer' });
  for (const value of cookies) headers.append('set-cookie', value);
  return new Response(null, { status: 303, headers });
}
// The flow cookie must survive Apple's cross-site form POST, so it is SameSite=None (HTTPS only).
const flowCookieName = request => local(request) ? 'sbd_local_flow' : '__Host-sbd_flow';
function flowCookie(request, value, age) {
  return local(request)
    ? `${flowCookieName(request)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}`
    : `${flowCookieName(request)}=${value}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${age}`;
}
function readFlowCookie(request) {
  const prefix = flowCookieName(request) + '=';
  const entries = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).filter(part => part.startsWith(prefix));
  return entries.length === 1 ? entries[0].slice(prefix.length) : '';
}
export function safeReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.length > 512 || /[\u0000-\u001f]/.test(value)) return '/my-progress';
  return value;
}
const withParam = (path, key, value) => {
  const [base, hash = ''] = path.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}${hash ? '#' + hash : '#account'}`;
};
const sameSite = request => ['same-origin', 'none', null].includes(request.headers.get('sec-fetch-site'));
const jsonPost = (request, url) => request.method === 'POST' && request.headers.get('origin') === url.origin && request.headers.get('sec-fetch-site') !== 'cross-site' && (request.headers.get('content-type') || '').startsWith('application/json');
async function readJson(request, limit = 16384) {
  const reader = request.body?.getReader(); if (!reader) throw new Error('empty');
  const chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw new Error('too large'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad');
  return data;
}
async function rate(env, key, max) {
  const now = new Date().toISOString(), expires = new Date(Date.now() + 3600000).toISOString();
  await env.DB.prepare('DELETE FROM reader_auth_limits WHERE expires_at<?').bind(now).run();
  const row = await env.DB.prepare('INSERT INTO reader_auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(await digest(`${key}:${now.slice(0, 13)}`), expires, max).first();
  return Boolean(row);
}
const clientIp = request => request.headers.get('cf-connecting-ip') || (local(request) ? 'local-test' : null);
async function saveFlow(env, id, kind, data, minutes) {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM reader_auth_flows WHERE expires_at<?').bind(now),
    env.DB.prepare('INSERT INTO reader_auth_flows (id_hash,kind,data,expires_at) VALUES (?,?,?,?)').bind(await digest(id), kind, JSON.stringify(data), new Date(Date.now() + minutes * 60000).toISOString()),
  ]);
}
async function takeFlow(env, id, kind) {
  if (typeof id !== 'string' || id.length < 20 || id.length > 200) return null;
  const row = await env.DB.prepare('DELETE FROM reader_auth_flows WHERE id_hash=? AND kind=? AND expires_at>? RETURNING data').bind(await digest(id), kind, new Date().toISOString()).first();
  return row ? JSON.parse(row.data) : null;
}
const methodCount = async (env, accountId) => {
  const row = await env.DB.prepare('SELECT (SELECT password_hash IS NOT NULL FROM reader_accounts WHERE id=?) + (SELECT count(*) FROM reader_identities WHERE account_id=?) + (SELECT count(*) FROM reader_passkeys WHERE account_id=?) AS n').bind(accountId, accountId, accountId).first();
  return Number(row?.n || 0);
};

// ---- Apple, Google, Microsoft ----------------------------------------------------------------

async function startProvider(request, env, url, id) {
  const provider = providers[id];
  if (url.hostname === `www.${CANONICAL}`) { url.hostname = CANONICAL; return redirect(url.toString()); }
  const returnTo = safeReturn(url.searchParams.get('returnTo'));
  if (!provider.configured(env)) return redirect(withParam(returnTo, 'signin_error', 'unavailable'));
  const intent = url.searchParams.get('intent') === 'link' ? 'link' : 'signin';
  let accountId = null;
  if (intent === 'link') {
    if (!sameSite(request)) return redirect(withParam(returnTo, 'signin_error', 'failed'));
    const reader = await getReader(request, env);
    if (!reader) return redirect(withParam(returnTo, 'signin_error', 'signin_first'));
    accountId = reader.id;
  }
  const ip = clientIp(request); if (!ip || !await rate(env, `oidc-start:${ip}`, 60)) return redirect(withParam(returnTo, 'signin_error', 'busy'));
  const state = randomToken(), nonce = randomToken(), verifier = randomToken(48), binding = randomToken();
  await saveFlow(env, state, 'oidc', { provider: id, intent, accountId, returnTo, nonce, verifier, binding: await digest(binding) }, 10);
  const location = await authorizationUrl(provider, env, { redirectUri: `${url.origin}/api/sign-in/${id}/callback`, state, nonce, verifier });
  return redirect(location, [flowCookie(request, binding, 600)]);
}

async function finishProvider(request, env, url, id, fetcher) {
  const provider = providers[id];
  const params = request.method === 'POST'
    ? new URLSearchParams(await request.text().then(text => text.length > 16384 ? '' : text))
    : url.searchParams;
  const clearFlow = flowCookie(request, '', 0);
  const flow = await takeFlow(env, params.get('state'), 'oidc');
  if (!flow || flow.provider !== id) return redirect(withParam('/my-progress', 'signin_error', 'expired'), [clearFlow]);
  const fail = reason => redirect(withParam(flow.returnTo, 'signin_error', reason), [clearFlow]);
  const binding = readFlowCookie(request);
  if (!binding || await digest(binding) !== flow.binding) return fail('expired');
  if (params.get('error')) return fail(params.get('error') === 'access_denied' || params.get('error') === 'user_cancelled_authorize' ? 'cancelled' : 'failed');
  const code = params.get('code'); if (!code || code.length > 2048) return fail('failed');
  const ip = clientIp(request); if (!ip || !await rate(env, `oidc-finish:${ip}`, 60)) return fail('busy');
  let identity;
  try {
    const idToken = await exchangeCode(provider, env, { code, redirectUri: `${url.origin}/api/sign-in/${id}/callback`, verifier: flow.verifier, fetcher });
    identity = await verifyIdToken(provider, env, idToken, flow.nonce, { fetcher });
  } catch (error) {
    console.error(`Sign in with ${provider.name} failed: ${error.message}`);
    return fail('failed');
  }
  const now = new Date().toISOString();
  const linked = await env.DB.prepare('SELECT i.account_id AS id,a.email FROM reader_identities i JOIN reader_accounts a ON a.id=i.account_id WHERE i.provider=? AND i.subject=?').bind(id, identity.subject).first();
  if (flow.intent === 'link') {
    const account = await env.DB.prepare('SELECT id,email FROM reader_accounts WHERE id=?').bind(flow.accountId).first();
    if (!account) return fail('signin_first');
    if (linked && linked.id !== account.id) return fail('linked_elsewhere');
    if (!linked) await env.DB.prepare('INSERT INTO reader_identities (provider,subject,account_id,email,created_at,last_used_at) VALUES (?,?,?,?,?,?)').bind(id, identity.subject, account.id, identity.email, now, now).run();
    return redirect(withParam(flow.returnTo, 'linked', id), [clearFlow]);
  }
  let account = linked;
  if (!account) {
    if (!identity.emailTrusted) return fail(id === 'microsoft' ? 'unverified_microsoft' : 'unverified_email');
    account = await env.DB.prepare('SELECT id,email FROM reader_accounts WHERE email=?').bind(identity.email).first();
    if (!account) {
      account = { id: crypto.randomUUID(), email: identity.email };
      await env.DB.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').bind(account.id, account.email, now).run();
    }
    await env.DB.prepare('INSERT INTO reader_identities (provider,subject,account_id,email,created_at,last_used_at) VALUES (?,?,?,?,?,?)').bind(id, identity.subject, account.id, identity.email, now, now).run();
  } else {
    await env.DB.prepare('UPDATE reader_identities SET last_used_at=? WHERE provider=? AND subject=?').bind(now, id, identity.subject).run();
  }
  const session = await startBrowserSession(request, env, account.id, account.email);
  return redirect(withParam(flow.returnTo, 'signed_in', id), [clearFlow, session]);
}

// ---- Passkeys ---------------------------------------------------------------------------------

const label = value => typeof value === 'string' ? value.replace(/[^\p{L}\p{N} .,'()-]/gu, '').trim().slice(0, 60) : '';
async function passkeyOptions(request, env, url, register) {
  const { rpId } = relyingParty(url);
  const challenge = randomToken();
  if (register) {
    const reader = await getReader(request, env);
    if (!reader) return reply({ error: 'Sign in before adding a passkey.' }, 401);
    const existing = await env.DB.prepare('SELECT credential_id,transports FROM reader_passkeys WHERE account_id=?').bind(reader.id).all();
    await saveFlow(env, challenge, 'passkey-register', { accountId: reader.id, rpId }, 5);
    return reply({ publicKey: {
      challenge, rp: { id: rpId, name: 'Secure By Design' },
      user: { id: b64url.encode(new TextEncoder().encode(reader.id)), name: reader.email, displayName: reader.email },
      pubKeyCredParams: [{ type: 'public-key', alg: ES256 }, { type: 'public-key', alg: RS256 }],
      authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' },
      excludeCredentials: (existing.results || []).map(row => ({ type: 'public-key', id: row.credential_id, ...(row.transports ? { transports: JSON.parse(row.transports) } : {}) })),
      attestation: 'none', timeout: 300000,
    } });
  }
  const ip = clientIp(request); if (!ip || !await rate(env, `passkey-options:${ip}`, 120)) return reply({ error: 'Too many attempts. Try again later.' }, 429);
  await saveFlow(env, challenge, 'passkey-auth', { rpId }, 5);
  return reply({ publicKey: { challenge, rpId, userVerification: 'preferred', timeout: 300000, allowCredentials: [] } });
}
const challengeOf = credential => {
  try { return JSON.parse(new TextDecoder().decode(b64url.decode(credential.response.clientDataJSON))).challenge; } catch { return null; }
};
async function passkeyRegister(request, env, url, data) {
  const reader = await getReader(request, env);
  if (!reader) return reply({ error: 'Sign in before adding a passkey.' }, 401);
  const challenge = challengeOf(data.credential);
  const flow = await takeFlow(env, challenge, 'passkey-register');
  if (!flow || flow.accountId !== reader.id) return reply({ error: 'That passkey request expired. Try again.' }, 400);
  const { origins, rpId } = relyingParty(url);
  let result;
  try { result = await verifyRegistration({ credential: data.credential, challenge, origins, rpId }); }
  catch (error) { console.error(`Passkey registration failed: ${error.message}`); return reply({ error: 'This passkey could not be added. Try again.' }, 400); }
  const transports = Array.isArray(data.credential?.response?.transports) ? JSON.stringify(data.credential.response.transports.filter(t => typeof t === 'string').slice(0, 8)) : null;
  const now = new Date().toISOString();
  const saved = await env.DB.prepare('INSERT INTO reader_passkeys (credential_id,account_id,public_key,algorithm,sign_count,transports,label,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(credential_id) DO NOTHING RETURNING credential_id')
    .bind(result.credentialId, reader.id, JSON.stringify(result.jwk), result.alg, result.signCount, transports, label(data.label) || 'Passkey', now).first();
  if (!saved) return reply({ error: 'This passkey is already registered.' }, 409);
  return reply({ added: true });
}
async function passkeySignIn(request, env, url, data) {
  const ip = clientIp(request); if (!ip || !await rate(env, `passkey-signin:${ip}`, 60)) return reply({ error: 'Too many attempts. Try again later.' }, 429);
  const challenge = challengeOf(data.credential);
  const flow = await takeFlow(env, challenge, 'passkey-auth');
  if (!flow) return reply({ error: 'That sign-in request expired. Try again.' }, 400);
  if (typeof data.credential?.id !== 'string' || data.credential.id.length > 1400) return reply({ error: 'This passkey isn’t recognized.' }, 400);
  const stored = await env.DB.prepare('SELECT p.*,a.email FROM reader_passkeys p JOIN reader_accounts a ON a.id=p.account_id WHERE p.credential_id=?').bind(data.credential.id).first();
  if (!stored) return reply({ error: 'This passkey isn’t registered with Secure By Design. Sign in another way, then add it in My Account.' }, 401);
  const handle = data.credential.response?.userHandle;
  if (handle && handle !== b64url.encode(new TextEncoder().encode(stored.account_id))) return reply({ error: 'This passkey isn’t recognized.' }, 401);
  const { origins, rpId } = relyingParty(url);
  let result;
  try { result = await verifyAssertion({ credential: data.credential, challenge, origins, rpId, stored }); }
  catch (error) { console.error(`Passkey sign-in failed: ${error.message}`); return reply({ error: 'Passkey sign-in failed. Try again.' }, 401); }
  await env.DB.prepare('UPDATE reader_passkeys SET sign_count=?,last_used_at=? WHERE credential_id=?').bind(result.signCount, new Date().toISOString(), stored.credential_id).run();
  return reply({ signedIn: true }, 200, [await startBrowserSession(request, env, stored.account_id, stored.email)]);
}

// ---- Managing methods, app hand-off, deletion -------------------------------------------------

async function listMethods(env, reader) {
  const [account, identities, passkeys] = await Promise.all([
    env.DB.prepare('SELECT password_hash IS NOT NULL AS password FROM reader_accounts WHERE id=?').bind(reader.id).first(),
    env.DB.prepare('SELECT provider,email,created_at AS createdAt,last_used_at AS lastUsedAt FROM reader_identities WHERE account_id=? ORDER BY created_at').bind(reader.id).all(),
    env.DB.prepare('SELECT credential_id AS id,label,created_at AS createdAt,last_used_at AS lastUsedAt FROM reader_passkeys WHERE account_id=? ORDER BY created_at').bind(reader.id).all(),
  ]);
  return { email: reader.email, password: Boolean(account?.password), identities: identities.results || [], passkeys: passkeys.results || [] };
}

export async function signInApi(request, env, { fetcher = fetch } = {}) {
  const url = new URL(request.url), route = url.pathname.replace(/\/$/, '');
  if (!env.DB) return reply({ error: 'Sign-in is temporarily unavailable.' }, 503);
  try {
    if (request.method === 'GET' && route === '/api/sign-in/providers') return reply({ providers: providerStatus(env), passkeys: true });
    const match = /^\/api\/sign-in\/(apple|google|microsoft)\/(start|callback)$/.exec(route);
    if (match) {
      const [, id, step] = match;
      if (step === 'start' && request.method === 'GET') return await startProvider(request, env, url, id);
      if (step === 'callback' && (request.method === 'GET' || (request.method === 'POST' && id === 'apple'))) return await finishProvider(request, env, url, id, fetcher);
      return reply({ error: 'Method not allowed.' }, 405);
    }
    if (request.method === 'GET' && route === '/api/sign-in/methods') {
      const reader = await getReader(request, env);
      return reader ? reply({ ...(await listMethods(env, reader)), providers: providerStatus(env) }) : reply({ error: 'Sign in to manage sign-in methods.' }, 401);
    }
    if (!jsonPost(request, url)) return reply({ error: 'Reload this page and try again.' }, request.method === 'POST' ? 403 : 405);
    let data; try { data = await readJson(request); } catch { return reply({ error: 'Check the request and try again.' }, 400); }
    if (route === '/api/sign-in/passkey/options') return await passkeyOptions(request, env, url, false);
    if (route === '/api/sign-in/passkey/register-options') return await passkeyOptions(request, env, url, true);
    if (route === '/api/sign-in/passkey/register') return await passkeyRegister(request, env, url, data);
    if (route === '/api/sign-in/passkey/authenticate') return await passkeySignIn(request, env, url, data);
    const reader = await getReader(request, env);
    if (!reader) return reply({ error: 'Sign in to continue.' }, 401);
    if (route === '/api/sign-in/methods/remove') {
      if (await methodCount(env, reader.id) <= 1) return reply({ error: 'Add another way to sign in before removing this one.' }, 409);
      const removed = data.kind === 'identity' && typeof data.provider === 'string'
        ? await env.DB.prepare('DELETE FROM reader_identities WHERE account_id=? AND provider=? RETURNING provider').bind(reader.id, data.provider).first()
        : data.kind === 'passkey' && typeof data.id === 'string'
          ? await env.DB.prepare('DELETE FROM reader_passkeys WHERE account_id=? AND credential_id=? RETURNING credential_id').bind(reader.id, data.id).first()
          : null;
      return removed ? reply({ removed: true, ...(await listMethods(env, reader)) }) : reply({ error: 'That sign-in method was not found.' }, 404);
    }
    if (route === '/api/sign-in/app-handoff') {
      // The app opens this site in the system browser with a PKCE challenge; a one-time code returns to the app.
      if (typeof data.challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.challenge)) return reply({ error: 'Open sign-in from the Secure By Design app again.' }, 400);
      const code = randomToken();
      await saveFlow(env, code, 'app-handoff', { accountId: reader.id, challenge: data.challenge }, 2);
      return reply({ redirect: `${APP_SCHEME}://auth?code=${code}` });
    }
    if (route === '/api/sign-in/delete-account') {
      if (data.confirm !== 'DELETE') return reply({ error: 'Type DELETE to confirm.' }, 400);
      await deleteAccount(env, reader);
      return reply({ deleted: true }, 200, [setCookie(request, 'reader', '', 0)]);
    }
    return reply({ error: 'Not found.' }, 404);
  } catch (error) {
    console.error(`Sign-in operation failed: ${error?.message}`);
    return reply({ error: 'Sign-in is temporarily unavailable. Please try again.' }, 503);
  }
}

// Used by the native API: trade the one-time hand-off code and PKCE verifier for an account.
export async function redeemAppHandoff(env, code, verifier) {
  if (typeof verifier !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) return null;
  const flow = await takeFlow(env, code, 'app-handoff');
  if (!flow || b64url.encode(await sha256(verifier)) !== flow.challenge) return null;
  return env.DB.prepare('SELECT id,email FROM reader_accounts WHERE id=?').bind(flow.accountId).first();
}
