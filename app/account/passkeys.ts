// Browser side of passkeys (WebAuthn). The server sends base64url strings; the browser wants bytes.
const toBytes = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)), char => char.charCodeAt(0));
const toText = (buffer: ArrayBuffer | ArrayBufferView) => {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let text = ''; for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const passkeysSupported = () => typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function' && !!navigator.credentials;

async function post(path: string, body: unknown) {
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Please try again.');
  return data;
}
const cancelled = (error: unknown) => error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');

export function deviceLabel() {
  const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return /iPhone/.test(agent) ? 'iPhone' : /iPad/.test(agent) ? 'iPad' : /Android/.test(agent) ? 'Android device' : /Macintosh/.test(agent) ? 'Mac' : /Windows/.test(agent) ? 'Windows PC' : /CrOS/.test(agent) ? 'Chromebook' : 'This device';
}

export async function signInWithPasskey(): Promise<boolean> {
  const { publicKey } = await post('/api/sign-in/passkey/options', {}) as { publicKey: { challenge: string; rpId: string; timeout: number; userVerification: UserVerificationRequirement } };
  let credential: PublicKeyCredential | null;
  try {
    credential = await navigator.credentials.get({ publicKey: { ...publicKey, challenge: toBytes(publicKey.challenge), allowCredentials: [] } }) as PublicKeyCredential | null;
  } catch (error) { if (cancelled(error)) return false; throw new Error('Your device could not use a passkey here.'); }
  if (!credential) return false;
  const response = credential.response as AuthenticatorAssertionResponse;
  await post('/api/sign-in/passkey/authenticate', { credential: { id: credential.id, rawId: toText(credential.rawId), type: credential.type, response: {
    clientDataJSON: toText(response.clientDataJSON), authenticatorData: toText(response.authenticatorData), signature: toText(response.signature),
    userHandle: response.userHandle ? toText(response.userHandle) : null,
  } } });
  return true;
}

type CreationOptions = { challenge: string; rp: PublicKeyCredentialRpEntity; user: { id: string; name: string; displayName: string }; pubKeyCredParams: PublicKeyCredentialParameters[]; authenticatorSelection: AuthenticatorSelectionCriteria; excludeCredentials: { type: 'public-key'; id: string; transports?: AuthenticatorTransport[] }[]; attestation: AttestationConveyancePreference; timeout: number };
export async function addPasskey(): Promise<boolean> {
  const { publicKey } = await post('/api/sign-in/passkey/register-options', {}) as { publicKey: CreationOptions };
  let credential: PublicKeyCredential | null;
  try {
    credential = await navigator.credentials.create({ publicKey: {
      ...publicKey, challenge: toBytes(publicKey.challenge), user: { ...publicKey.user, id: toBytes(publicKey.user.id) },
      excludeCredentials: publicKey.excludeCredentials.map(item => ({ ...item, id: toBytes(item.id) })),
    } }) as PublicKeyCredential | null;
  } catch (error) {
    if (cancelled(error)) return false;
    if (error instanceof DOMException && error.name === 'InvalidStateError') throw new Error('This device already has a passkey for your account.');
    throw new Error('Your device could not create a passkey here.');
  }
  if (!credential) return false;
  const response = credential.response as AuthenticatorAttestationResponse;
  await post('/api/sign-in/passkey/register', { label: deviceLabel(), credential: { id: credential.id, rawId: toText(credential.rawId), type: credential.type, response: {
    clientDataJSON: toText(response.clientDataJSON), attestationObject: toText(response.attestationObject),
    transports: typeof response.getTransports === 'function' ? response.getTransports() : [],
  } } });
  return true;
}
