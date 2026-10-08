// OpenID Connect sign-in with Apple, Google, and Microsoft.
// Authorization code flow (PKCE where the provider supports it), then the ID token is verified
// against the provider's published signing keys before any account is touched.
const encoder = new TextEncoder();

export const b64url = {
  encode(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    let text = '';
    for (const byte of bytes) text += String.fromCharCode(byte);
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('Invalid base64url');
    const text = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4));
    return Uint8Array.from(text, char => char.charCodeAt(0));
  },
};
export const sha256 = async data => new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? encoder.encode(data) : data));
export const randomToken = (bytes = 32) => b64url.encode(crypto.getRandomValues(new Uint8Array(bytes)));

// Microsoft's tenant for personal accounts (Outlook.com, Hotmail, Xbox); Microsoft verifies those addresses.
export const MICROSOFT_CONSUMER_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad';

export const providers = {
  apple: {
    name: 'Apple',
    authorize: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    jwks: 'https://appleid.apple.com/auth/keys',
    scope: 'email',
    // Apple requires form_post whenever scopes are requested, so the callback arrives as a cross-site POST.
    responseMode: 'form_post',
    pkce: false,
    configured: env => Boolean(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY),
    clientId: env => env.APPLE_CLIENT_ID,
    clientSecret: env => appleClientSecret(env),
    issuerValid: claims => claims.iss === 'https://appleid.apple.com',
    emailTrusted: claims => claims.email_verified === true || claims.email_verified === 'true',
  },
  google: {
    name: 'Google',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    jwks: 'https://www.googleapis.com/oauth2/v3/certs',
    scope: 'openid email',
    pkce: true,
    extra: { prompt: 'select_account' },
    configured: env => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    clientId: env => env.GOOGLE_CLIENT_ID,
    clientSecret: async env => env.GOOGLE_CLIENT_SECRET,
    issuerValid: claims => claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com',
    emailTrusted: claims => claims.email_verified === true,
  },
  microsoft: {
    name: 'Microsoft',
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    jwks: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    scope: 'openid email',
    pkce: true,
    extra: { prompt: 'select_account', response_mode: 'query' },
    configured: env => Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET),
    clientId: env => env.MICROSOFT_CLIENT_ID,
    clientSecret: async env => env.MICROSOFT_CLIENT_SECRET,
    // Multi-tenant: the issuer names the user's own tenant.
    issuerValid: claims => typeof claims.tid === 'string' && /^[0-9a-f-]{36}$/.test(claims.tid) && claims.iss === `https://login.microsoftonline.com/${claims.tid}/v2.0`,
    // Work and school tenants let administrators set any email address, so only personal accounts
    // or an explicit "email domain owner verified" claim count as a verified address.
    emailTrusted: claims => claims.tid === MICROSOFT_CONSUMER_TENANT || claims.xms_edov === true || claims.xms_edov === 1 || claims.xms_edov === '1' || claims.xms_edov === 'true',
  },
};

export function providerStatus(env) {
  return Object.fromEntries(Object.entries(providers).map(([id, provider]) => [id, provider.configured(env)]));
}

function pemBody(pem) {
  const text = String(pem).replace(/\\n/g, '\n').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(text), char => char.charCodeAt(0));
}
const jsonPart = value => b64url.encode(encoder.encode(JSON.stringify(value)));

// Apple's client secret is a short-lived ES256 JWT signed with the Sign in with Apple key (.p8).
export async function appleClientSecret(env, now = Date.now()) {
  const key = await crypto.subtle.importKey('pkcs8', pemBody(env.APPLE_PRIVATE_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const iat = Math.floor(now / 1000);
  const input = `${jsonPart({ alg: 'ES256', kid: env.APPLE_KEY_ID, typ: 'JWT' })}.${jsonPart({ iss: env.APPLE_TEAM_ID, iat, exp: iat + 300, aud: 'https://appleid.apple.com', sub: env.APPLE_CLIENT_ID })}`;
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(input));
  return `${input}.${b64url.encode(signature)}`;
}

const keyCache = new Map();
async function signingKey(url, kid, fetcher) {
  const cached = keyCache.get(url);
  let keys = cached && cached.expires > Date.now() ? cached.keys : null;
  if (!keys || !keys.some(key => key.kid === kid)) {
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Signing keys unavailable');
    keys = (await response.json()).keys || [];
    keyCache.set(url, { keys, expires: Date.now() + 3600000 });
  }
  const jwk = keys.find(key => key.kid === kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Unknown signing key');
  return crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}
export function clearKeyCache() { keyCache.clear(); }

export async function verifyIdToken(provider, env, token, nonce, { fetcher = fetch, now = Date.now() } = {}) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new Error('Malformed ID token');
  const decoder = new TextDecoder();
  const header = JSON.parse(decoder.decode(b64url.decode(parts[0])));
  const claims = JSON.parse(decoder.decode(b64url.decode(parts[1])));
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Unexpected token algorithm');
  const key = await signingKey(provider.jwks, header.kid, fetcher);
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url.decode(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`))) throw new Error('Bad token signature');
  const seconds = Math.floor(now / 1000), clientId = provider.clientId(env);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!provider.issuerValid(claims)) throw new Error('Wrong issuer');
  if (!audience.includes(clientId) || (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp !== clientId)) throw new Error('Wrong audience');
  if (typeof claims.exp !== 'number' || claims.exp < seconds - 60) throw new Error('Token expired');
  if (typeof claims.iat === 'number' && claims.iat > seconds + 300) throw new Error('Token issued in the future');
  if (!nonce || claims.nonce !== nonce) throw new Error('Nonce mismatch');
  if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 255) throw new Error('Missing subject');
  const email = typeof claims.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) && claims.email.length <= 254 ? claims.email.trim().toLowerCase() : null;
  return { subject: claims.sub, email, emailTrusted: Boolean(email) && provider.emailTrusted(claims) };
}

export async function authorizationUrl(provider, env, { redirectUri, state, nonce, verifier }) {
  const params = new URLSearchParams({ client_id: provider.clientId(env), redirect_uri: redirectUri, response_type: 'code', scope: provider.scope, state, nonce });
  if (provider.responseMode) params.set('response_mode', provider.responseMode);
  if (provider.pkce) {
    params.set('code_challenge', b64url.encode(await sha256(verifier)));
    params.set('code_challenge_method', 'S256');
  }
  for (const [key, value] of Object.entries(provider.extra || {})) params.set(key, value);
  return `${provider.authorize}?${params}`;
}

export async function exchangeCode(provider, env, { code, redirectUri, verifier, fetcher = fetch }) {
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: provider.clientId(env), client_secret: await provider.clientSecret(env) });
  if (provider.pkce) body.set('code_verifier', verifier);
  const response = await fetcher(provider.token, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.id_token !== 'string') throw new Error('Token exchange failed');
  return { idToken: data.id_token, refreshToken: typeof data.refresh_token === 'string' && data.refresh_token.length < 2048 ? data.refresh_token : null };
}

// Apple asks apps that delete accounts or unlink Sign in with Apple to revoke the user's tokens.
export async function revokeAppleToken(env, refreshToken, fetcher = fetch) {
  if (!refreshToken || !providers.apple.configured(env)) return false;
  try {
    const body = new URLSearchParams({ client_id: env.APPLE_CLIENT_ID, client_secret: await appleClientSecret(env), token: refreshToken, token_type_hint: 'refresh_token' });
    const response = await fetcher('https://appleid.apple.com/auth/revoke', { method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    return response.ok;
  } catch { return false; }
}
