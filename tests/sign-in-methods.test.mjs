import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { signInApi } from '../server/sign-in-methods.js';
import { nativeAuthApi } from '../server/native-auth.js';
import { providers, b64url, clearKeyCache, MICROSOFT_CONSUMER_TENANT } from '../server/oidc.js';
import { digest } from '../server/reader-auth.js';

function database(){const raw=new DatabaseSync(':memory:');raw.exec('PRAGMA foreign_keys=ON');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(fs.readFileSync('drizzle/'+f,'utf8'));const prepare=sql=>{let values=[];return{bind(...v){values=v;return this},async first(){return raw.prepare(sql).get(...values)||null},async all(){return{results:raw.prepare(sql).all(...values)}},async run(){return{meta:{changes:Number(raw.prepare(sql).run(...values).changes)}}}}};return{raw,prepare,async batch(statements){raw.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}};}

const origin = 'https://securebydesigninc.com';
const enc = new TextEncoder();
const rsa = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const publicJwk = { ...(await crypto.subtle.exportKey('jwk', rsa.publicKey)), kid: 'test-key', use: 'sig', alg: 'RS256' };
const apple = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const applePem = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(await crypto.subtle.exportKey('pkcs8', apple.privateKey)).toString('base64')}\n-----END PRIVATE KEY-----`;
const env = () => ({
  DB: database(),
  GOOGLE_CLIENT_ID: 'google-client', GOOGLE_CLIENT_SECRET: 'google-secret',
  MICROSOFT_CLIENT_ID: 'microsoft-client', MICROSOFT_CLIENT_SECRET: 'microsoft-secret',
  APPLE_CLIENT_ID: 'com.securebydesigninc.web', APPLE_TEAM_ID: 'TEAM123456', APPLE_KEY_ID: 'KEY1234567', APPLE_PRIVATE_KEY: applePem,
});
const part = value => b64url.encode(enc.encode(JSON.stringify(value)));
async function idToken(claims) {
  const input = `${part({ alg: 'RS256', kid: 'test-key' })}.${part(claims)}`;
  return `${input}.${b64url.encode(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', rsa.privateKey, enc.encode(input)))}`;
}
// Simulates the provider: hands out the signing keys and answers the token request with the next ID token.
function provider(claims, seen = []) {
  return async (url, init) => {
    if (Object.values(providers).some(p => p.jwks === url)) return Response.json({ keys: [publicJwk] });
    if (Object.values(providers).some(p => p.token === url)) { seen.push(new URLSearchParams(init.body.toString())); return Response.json({ id_token: await idToken(claims()) }); }
    throw new Error('Unexpected fetch ' + url);
  };
}
const browser = (path, { cookie = '', method = 'GET', body, headers = {} } = {}) => new Request(origin + path, { method, body, headers: { 'cf-connecting-ip': '192.0.2.10', 'sec-fetch-site': 'same-origin', ...(cookie ? { cookie } : {}), ...headers } });
const cookieValue = (response, name) => response.headers.getSetCookie().map(c => c.split(';')[0]).find(c => c.startsWith(name + '='))?.slice(name.length + 1) || '';
const now = () => Math.floor(Date.now() / 1000);

async function signInWith(id, e, makeClaims, { cookie = '', intent = 'signin', returnTo = '/my-progress', tamperBinding = false } = {}) {
  clearKeyCache();
  const start = await signInApi(browser(`/api/sign-in/${id}/start?intent=${intent}&returnTo=${encodeURIComponent(returnTo)}`, { cookie }), e);
  assert.equal(start.status, 303);
  const location = new URL(start.headers.get('location'));
  const state = location.searchParams.get('state'), nonce = location.searchParams.get('nonce');
  const binding = tamperBinding ? 'wrong' : cookieValue(start, '__Host-sbd_flow');
  const seen = [];
  const fetcher = provider(() => makeClaims(nonce), seen);
  const flowCookie = `__Host-sbd_flow=${binding}${cookie ? '; ' + cookie : ''}`;
  const callback = id === 'apple'
    ? new Request(`${origin}/api/sign-in/apple/callback`, { method: 'POST', body: new URLSearchParams({ code: 'auth-code', state }), headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: flowCookie, 'cf-connecting-ip': '192.0.2.10', origin: 'https://appleid.apple.com', 'sec-fetch-site': 'cross-site' } })
    : browser(`/api/sign-in/${id}/callback?code=auth-code&state=${encodeURIComponent(state)}`, { cookie: flowCookie, headers: { 'sec-fetch-site': 'cross-site' } });
  const response = await signInApi(callback, e, { fetcher });
  return { start: location, response, location: new URL(response.headers.get('location'), origin), session: cookieValue(response, '__Host-sbd_reader'), seen };
}
const googleClaims = (email, verified = true, sub = 'google-sub-1') => nonce => ({ iss: 'https://accounts.google.com', aud: 'google-client', sub, email, email_verified: verified, nonce, exp: now() + 600, iat: now() });
async function sessionFor(e, accountId, email) {
  const token = 'a'.repeat(64);
  e.DB.raw.prepare('INSERT OR IGNORE INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run(accountId, email, new Date().toISOString());
  e.DB.raw.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').run(await digest(token), accountId, new Date(Date.now() + 3600000).toISOString());
  return `__Host-sbd_reader=${token}`;
}

test('Google sign-in creates an account for a verified email and starts a browser session', async () => {
  const e = env();
  const { start, response, location, session, seen } = await signInWith('google', e, googleClaims('learner@example.com'));
  assert.equal(start.origin + start.pathname, providers.google.authorize);
  assert.equal(start.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(start.searchParams.get('redirect_uri'), origin + '/api/sign-in/google/callback');
  assert.equal(response.status, 303);
  assert.equal(location.searchParams.get('signed_in'), 'google');
  assert.match(session, /^[a-f0-9]{64}$/);
  assert.ok(seen[0].get('code_verifier'));
  const account = e.DB.raw.prepare('SELECT * FROM reader_accounts').get();
  assert.equal(account.email, 'learner@example.com');
  assert.equal(account.password_hash, null);
  assert.equal(e.DB.raw.prepare('SELECT account_id FROM reader_identities WHERE provider=? AND subject=?').get('google', 'google-sub-1').account_id, account.id);
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM community_memberships').get().n, 1);
  // A second sign-in reuses the identity.
  const again = await signInWith('google', e, googleClaims('learner@example.com'));
  assert.equal(again.location.searchParams.get('signed_in'), 'google');
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM reader_accounts').get().n, 1);
});

test('a verified provider email reaches the existing account instead of creating another', async () => {
  const e = env();
  e.DB.raw.prepare('INSERT INTO reader_accounts (id,email,created_at,password_hash) VALUES (?,?,?,?)').run('existing', 'learner@example.com', new Date().toISOString(), 'scrypt$x');
  await signInWith('google', e, googleClaims('learner@example.com'));
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM reader_accounts').get().n, 1);
  assert.equal(e.DB.raw.prepare('SELECT account_id FROM reader_identities').get().account_id, 'existing');
});

test('unverified emails never create or take over accounts', async () => {
  const e = env();
  e.DB.raw.prepare('INSERT INTO reader_accounts (id,email,created_at,password_hash) VALUES (?,?,?,?)').run('victim', 'victim@example.com', new Date().toISOString(), 'scrypt$x');
  const workTenant = '11111111-2222-3333-4444-555555555555';
  const work = await signInWith('microsoft', e, nonce => ({ iss: `https://login.microsoftonline.com/${workTenant}/v2.0`, tid: workTenant, aud: 'microsoft-client', sub: 'ms-attacker', email: 'victim@example.com', nonce, exp: now() + 600, iat: now() }));
  assert.equal(work.location.searchParams.get('signin_error'), 'unverified_microsoft');
  assert.equal(work.session, '');
  const google = await signInWith('google', e, googleClaims('victim@example.com', false, 'g-unverified'));
  assert.equal(google.location.searchParams.get('signin_error'), 'unverified_email');
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM reader_identities').get().n, 0);
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM reader_sessions').get().n, 0);
});

test('Microsoft personal accounts and Apple form_post sign-ins work', async () => {
  const e = env();
  const ms = await signInWith('microsoft', e, nonce => ({ iss: `https://login.microsoftonline.com/${MICROSOFT_CONSUMER_TENANT}/v2.0`, tid: MICROSOFT_CONSUMER_TENANT, aud: 'microsoft-client', sub: 'ms-personal', email: 'person@outlook.com', nonce, exp: now() + 600 }));
  assert.equal(ms.location.searchParams.get('signed_in'), 'microsoft');
  const ap = await signInWith('apple', e, nonce => ({ iss: 'https://appleid.apple.com', aud: 'com.securebydesigninc.web', sub: 'apple-sub', email: 'abc123@privaterelay.appleid.com', email_verified: 'true', nonce, exp: now() + 600 }));
  assert.equal(ap.start.searchParams.get('response_mode'), 'form_post');
  assert.equal(ap.location.searchParams.get('signed_in'), 'apple');
  // Apple's client secret is an ES256 JWT signed with the configured key.
  const secret = ap.seen[0].get('client_secret').split('.');
  assert.equal(secret.length, 3);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, apple.publicKey, b64url.decode(secret[2]), enc.encode(`${secret[0]}.${secret[1]}`)));
  assert.equal(JSON.parse(new TextDecoder().decode(b64url.decode(secret[1]))).sub, 'com.securebydesigninc.web');
});

test('forged or replayed callbacks are rejected', async () => {
  const e = env();
  const noBinding = await signInWith('google', e, googleClaims('learner@example.com'), { tamperBinding: true });
  assert.equal(noBinding.location.searchParams.get('signin_error'), 'expired');
  const wrongNonce = await signInWith('google', e, () => googleClaims('learner@example.com')('other-nonce'));
  assert.equal(wrongNonce.location.searchParams.get('signin_error'), 'failed');
  const wrongAudience = await signInWith('google', e, nonce => ({ ...googleClaims('learner@example.com')(nonce), aud: 'someone-else' }));
  assert.equal(wrongAudience.location.searchParams.get('signin_error'), 'failed');
  const expired = await signInWith('google', e, nonce => ({ ...googleClaims('learner@example.com')(nonce), exp: now() - 3600 }));
  assert.equal(expired.location.searchParams.get('signin_error'), 'failed');
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM reader_accounts').get().n, 0);
  // Unsafe return paths fall back to My Account.
  const start = await signInApi(browser('/api/sign-in/google/start?returnTo=//evil.example'), e);
  assert.equal(new URL(start.headers.get('location')).searchParams.has('state'), true);
  const flow = JSON.parse(e.DB.raw.prepare("SELECT data FROM reader_auth_flows WHERE kind='oidc' ORDER BY rowid DESC").get().data);
  assert.equal(flow.returnTo, '/my-progress');
});

test('linking adds a provider to the signed-in account and refuses one linked elsewhere', async () => {
  const e = env();
  const cookie = await sessionFor(e, 'acct-1', 'one@example.com');
  const linked = await signInWith('google', e, googleClaims('different@gmail.com', false, 'g-link'), { cookie, intent: 'link' });
  assert.equal(linked.location.searchParams.get('linked'), 'google');
  assert.equal(e.DB.raw.prepare('SELECT account_id FROM reader_identities WHERE subject=?').get('g-link').account_id, 'acct-1');
  e.DB.raw.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run('acct-2', 'two@example.com', new Date().toISOString());
  e.DB.raw.prepare('INSERT INTO reader_identities (provider,subject,account_id,created_at) VALUES (?,?,?,?)').run('google', 'g-taken', 'acct-2', new Date().toISOString());
  const taken = await signInWith('google', e, googleClaims('x@gmail.com', true, 'g-taken'), { cookie, intent: 'link' });
  assert.equal(taken.location.searchParams.get('signin_error'), 'linked_elsewhere');
  const crossSite = await signInApi(browser('/api/sign-in/google/start?intent=link', { cookie, headers: { 'sec-fetch-site': 'cross-site' } }), e);
  assert.equal(new URL(crossSite.headers.get('location'), origin).searchParams.get('signin_error'), 'failed');
});

test('providers without keys stay hidden and redirect with a clear error', async () => {
  const e = { DB: database() };
  const list = await (await signInApi(browser('/api/sign-in/providers'), e)).json();
  assert.deepEqual(list, { providers: { apple: false, google: false, microsoft: false }, passkeys: true });
  const start = await signInApi(browser('/api/sign-in/google/start'), e);
  assert.equal(new URL(start.headers.get('location'), origin).searchParams.get('signin_error'), 'unavailable');
});

// ---- Passkeys with a software authenticator ----------------------------------------------------
function cbor(value) {
  const head = (major, n) => n < 24 ? [major << 5 | n] : n < 256 ? [major << 5 | 24, n] : [major << 5 | 25, n >> 8, n & 255];
  if (typeof value === 'number') return Uint8Array.from(value >= 0 ? head(0, value) : head(1, -1 - value));
  if (typeof value === 'string') { const b = enc.encode(value); return Uint8Array.from([...head(3, b.length), ...b]); }
  if (value instanceof Uint8Array) return Uint8Array.from([...head(2, value.length), ...value]);
  if (value instanceof Map) { const parts = [Uint8Array.from(head(5, value.size))]; for (const [k, v] of value) parts.push(cbor(k), cbor(v)); return Uint8Array.from(parts.flatMap(p => [...p])); }
  throw new Error('cbor');
}
const sha = async data => new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
function rawToDer(raw) {
  const int = bytes => { let b = [...bytes]; while (b.length > 1 && b[0] === 0 && !(b[1] & 0x80)) b.shift(); if (b[0] & 0x80) b = [0, ...b]; return [0x02, b.length, ...b]; };
  const body = [...int(raw.slice(0, 32)), ...int(raw.slice(32))];
  return Uint8Array.from([0x30, body.length, ...body]);
}
async function authenticator() {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
  const credentialId = crypto.getRandomValues(new Uint8Array(32));
  let count = 0;
  return {
    id: b64url.encode(credentialId),
    async create(options) {
      const clientDataJSON = enc.encode(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin }));
      const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, b64url.decode(jwk.x)], [-3, b64url.decode(jwk.y)]]);
      const coseBytes = cbor(cose);
      const authData = Uint8Array.from([...await sha(options.rp.id), 0x45, 0, 0, 0, 0, ...new Uint8Array(16), 0, credentialId.length, ...credentialId, ...coseBytes]);
      const attestationObject = cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]));
      return { id: b64url.encode(credentialId), rawId: b64url.encode(credentialId), type: 'public-key', response: { clientDataJSON: b64url.encode(clientDataJSON), attestationObject: b64url.encode(attestationObject), transports: ['internal'] } };
    },
    async get(options, { userHandle, originOverride } = {}) {
      count += 1;
      const clientDataJSON = enc.encode(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin: originOverride || origin }));
      const authData = Uint8Array.from([...await sha(options.rpId), 0x05, 0, 0, 0, count]);
      const signed = Uint8Array.from([...authData, ...await sha(clientDataJSON)]);
      const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, signed));
      return { id: b64url.encode(credentialId), rawId: b64url.encode(credentialId), type: 'public-key', response: { clientDataJSON: b64url.encode(clientDataJSON), authenticatorData: b64url.encode(authData), signature: b64url.encode(rawToDer(raw)), userHandle } };
    },
  };
}
const api = (path, body, cookie) => browser(path, { method: 'POST', cookie, body: JSON.stringify(body), headers: { origin, 'content-type': 'application/json' } });

test('passkeys register to the signed-in account and sign in without a password', async () => {
  const e = env(), device = await authenticator();
  const cookie = await sessionFor(e, 'acct-pk', 'pk@example.com');
  const options = (await (await signInApi(api('/api/sign-in/passkey/register-options', {}, cookie), e)).json()).publicKey;
  assert.equal(options.rp.id, 'securebydesigninc.com');
  assert.equal(options.authenticatorSelection.residentKey, 'required');
  const registered = await signInApi(api('/api/sign-in/passkey/register', { credential: await device.create(options), label: 'iPhone' }, cookie), e);
  assert.equal(registered.status, 200, await registered.clone().text());
  const row = e.DB.raw.prepare('SELECT * FROM reader_passkeys').get();
  assert.equal(row.account_id, 'acct-pk'); assert.equal(row.label, 'iPhone');
  // Sign in from a fresh browser.
  const auth = (await (await signInApi(api('/api/sign-in/passkey/options', {}), e)).json()).publicKey;
  const signedIn = await signInApi(api('/api/sign-in/passkey/authenticate', { credential: await device.get(auth, { userHandle: b64url.encode(enc.encode('acct-pk')) }) }), e);
  assert.equal(signedIn.status, 200, await signedIn.clone().text());
  assert.match(cookieValue(signedIn, '__Host-sbd_reader'), /^[a-f0-9]{64}$/);
  // The same challenge cannot be replayed, and other origins are refused.
  const replay = await signInApi(api('/api/sign-in/passkey/authenticate', { credential: await device.get(auth) }), e);
  assert.equal(replay.status, 400);
  const auth2 = (await (await signInApi(api('/api/sign-in/passkey/options', {}), e)).json()).publicKey;
  const phishing = await signInApi(api('/api/sign-in/passkey/authenticate', { credential: await device.get(auth2, { originOverride: 'https://securebydesigninc.com.evil.example' }) }), e);
  assert.equal(phishing.status, 401);
  // A passkey cannot be registered without a session or with another account's challenge.
  const anonymous = await signInApi(api('/api/sign-in/passkey/register-options', {}), e);
  assert.equal(anonymous.status, 401);
  // Cross-site requests are rejected outright.
  const forged = await signInApi(new Request(origin + '/api/sign-in/passkey/options', { method: 'POST', body: '{}', headers: { origin: 'https://evil.example', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.10' } }), e);
  assert.equal(forged.status, 403);
});

test('methods can be listed and removed, but never the last one', async () => {
  const e = env(), device = await authenticator();
  const cookie = await sessionFor(e, 'acct-m', 'm@example.com');
  const options = (await (await signInApi(api('/api/sign-in/passkey/register-options', {}, cookie), e)).json()).publicKey;
  await signInApi(api('/api/sign-in/passkey/register', { credential: await device.create(options) }, cookie), e);
  const list = await (await signInApi(browser('/api/sign-in/methods', { cookie }), e)).json();
  assert.equal(list.password, false); assert.equal(list.passkeys.length, 1);
  const last = await signInApi(api('/api/sign-in/methods/remove', { kind: 'passkey', id: device.id }, cookie), e);
  assert.equal(last.status, 409);
  e.DB.raw.prepare('INSERT INTO reader_identities (provider,subject,account_id,created_at) VALUES (?,?,?,?)').run('google', 'g-m', 'acct-m', new Date().toISOString());
  const removed = await signInApi(api('/api/sign-in/methods/remove', { kind: 'passkey', id: device.id }, cookie), e);
  assert.equal(removed.status, 200);
  assert.equal(e.DB.raw.prepare('SELECT count(*) AS n FROM reader_passkeys').get().n, 0);
});

test('the app trades a one-time code and PKCE verifier for a native session, even without a password', async () => {
  const e = env();
  const cookie = await sessionFor(e, 'acct-app', 'app@example.com');
  e.DB.raw.prepare('INSERT INTO reader_identities (provider,subject,account_id,created_at) VALUES (?,?,?,?)').run('apple', 'a-app', 'acct-app', new Date().toISOString());
  const verifier = b64url.encode(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url.encode(await sha(verifier));
  const handoff = await (await signInApi(api('/api/sign-in/app-handoff', { challenge }, cookie), e)).json();
  const code = new URL(handoff.redirect).searchParams.get('code');
  assert.match(handoff.redirect, /^securebydesign:\/\/auth\?code=/);
  const native = (path, body, token) => new Request(origin + path, { method: body ? 'POST' : 'GET', body: body && JSON.stringify(body), headers: { 'x-sbd-client': 'native-v1', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.20', ...(token ? { authorization: 'Bearer ' + token } : {}) } });
  const wrong = await nativeAuthApi(native('/api/native-auth/exchange', { code, verifier: b64url.encode(crypto.getRandomValues(new Uint8Array(48))) }), e);
  assert.equal(wrong.status, 400);
  // The failed attempt consumed the code; start again.
  const retry = await (await signInApi(api('/api/sign-in/app-handoff', { challenge }, cookie), e)).json();
  const exchanged = await nativeAuthApi(native('/api/native-auth/exchange', { code: new URL(retry.redirect).searchParams.get('code'), verifier }), e);
  assert.equal(exchanged.status, 200);
  const { token, user } = await exchanged.json();
  assert.equal(user.email, 'app@example.com');
  const session = await nativeAuthApi(native('/api/native-auth/session', null, token), e);
  assert.equal(session.status, 200);
  // Browser requests cannot use the native exchange.
  const fromBrowser = await nativeAuthApi(new Request(origin + '/api/native-auth/exchange', { method: 'POST', body: '{}', headers: { origin, 'x-sbd-client': 'native-v1', 'content-type': 'application/json' } }), e);
  assert.equal(fromBrowser.status, 403);
});

test('deleting an account removes its records and keeps only an unsubscribe record', async () => {
  const e = env();
  const cookie = await sessionFor(e, 'acct-del', 'del@example.com');
  const at = new Date().toISOString();
  e.DB.raw.prepare('INSERT INTO reader_progress (user_id,item_id,status,updated_at) VALUES (?,?,?,?)').run('acct-del', 'training:dns-configuration:zones', 'completed', at);
  e.DB.raw.prepare('INSERT INTO reader_identities (provider,subject,account_id,created_at) VALUES (?,?,?,?)').run('google', 'g-del', 'acct-del', at);
  e.DB.raw.prepare('INSERT INTO community_memberships (email,joined_at,source,account_id,verified_at) VALUES (?,?,?,?,?)').run('del@example.com', at, 'account', 'acct-del', at);
  e.DB.raw.prepare("INSERT INTO resource_subscribers (email,name,status,created_at,consent_at,consent_text,unsubscribe_token,last_requested_at,send_window_start) VALUES (?,?,?,?,?,?,?,?,?)").run('del@example.com', 'Del', 'active', at, at, 'consent', 'tok', at, at);
  const refused = await signInApi(api('/api/sign-in/delete-account', { confirm: 'yes' }, cookie), e);
  assert.equal(refused.status, 400);
  const deleted = await signInApi(api('/api/sign-in/delete-account', { confirm: 'DELETE' }, cookie), e);
  assert.equal(deleted.status, 200);
  for (const table of ['reader_accounts', 'reader_sessions', 'reader_progress', 'reader_identities', 'community_memberships']) assert.equal(e.DB.raw.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 0, table);
  const subscriber = e.DB.raw.prepare('SELECT name,status FROM resource_subscribers').get();
  assert.deepEqual({ ...subscriber }, { name: '', status: 'unsubscribed' });
});
