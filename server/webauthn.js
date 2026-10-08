// Passkeys (WebAuthn): minimal, dependency-free verification of registration and sign-in.
// Attestation is not required ("none"); trust comes from the signed challenge and the stored public key.
import { b64url, sha256 } from './oidc.js';

const decoder = new TextDecoder();
export const ES256 = -7, RS256 = -257;

// CBOR (RFC 8949) subset used by WebAuthn: unsigned/negative integers, byte/text strings, arrays, maps, simple values.
export function decodeCbor(bytes, start = 0) {
  let offset = start;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  function length(info) {
    if (info < 24) return info;
    if (info === 24) return view.getUint8(offset++);
    if (info === 25) { const value = view.getUint16(offset); offset += 2; return value; }
    if (info === 26) { const value = view.getUint32(offset); offset += 4; return value; }
    if (info === 27) { const high = view.getUint32(offset), low = view.getUint32(offset + 4); offset += 8; const value = high * 2 ** 32 + low; if (!Number.isSafeInteger(value)) throw new Error('CBOR integer too large'); return value; }
    throw new Error('Unsupported CBOR length');
  }
  function item(depth) {
    if (depth > 16) throw new Error('CBOR nesting too deep');
    if (offset >= bytes.length) throw new Error('Truncated CBOR');
    const initial = bytes[offset++], major = initial >> 5, info = initial & 31;
    if (major === 0) return length(info);
    if (major === 1) return -1 - length(info);
    if (major === 2 || major === 3) {
      const size = length(info);
      if (offset + size > bytes.length) throw new Error('Truncated CBOR');
      const value = bytes.slice(offset, offset + size); offset += size;
      return major === 2 ? value : decoder.decode(value);
    }
    if (major === 4) { const size = length(info); return Array.from({ length: size }, () => item(depth + 1)); }
    if (major === 5) {
      const size = length(info), map = new Map();
      for (let i = 0; i < size; i++) { const key = item(depth + 1); map.set(key, item(depth + 1)); }
      return map;
    }
    if (major === 7) {
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22) return null;
    }
    throw new Error('Unsupported CBOR item');
  }
  const value = item(0);
  return { value, offset };
}

export function parseAuthenticatorData(data) {
  if (!(data instanceof Uint8Array) || data.length < 37) throw new Error('Authenticator data too short');
  const flags = data[32];
  const parsed = {
    rpIdHash: data.slice(0, 32), flags,
    userPresent: Boolean(flags & 0x01), userVerified: Boolean(flags & 0x04),
    signCount: new DataView(data.buffer, data.byteOffset + 33, 4).getUint32(0),
  };
  if (flags & 0x40) {
    if (data.length < 55) throw new Error('Missing credential data');
    const idLength = new DataView(data.buffer, data.byteOffset + 53, 2).getUint16(0);
    if (idLength < 16 || idLength > 1023 || data.length < 55 + idLength) throw new Error('Bad credential ID');
    parsed.credentialId = data.slice(55, 55 + idLength);
    const { value } = decodeCbor(data, 55 + idLength);
    parsed.publicKey = value;
  }
  return parsed;
}

export function coseToJwk(cose) {
  if (!(cose instanceof Map)) throw new Error('Bad public key');
  const kty = cose.get(1), alg = cose.get(3);
  if (kty === 2 && alg === ES256 && cose.get(-1) === 1) {
    const x = cose.get(-2), y = cose.get(-3);
    if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) throw new Error('Bad EC key');
    return { alg: ES256, jwk: { kty: 'EC', crv: 'P-256', x: b64url.encode(x), y: b64url.encode(y) } };
  }
  if (kty === 3 && alg === RS256) {
    const n = cose.get(-1), e = cose.get(-2);
    if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array) || n.length < 256) throw new Error('Bad RSA key');
    return { alg: RS256, jwk: { kty: 'RSA', n: b64url.encode(n), e: b64url.encode(e) } };
  }
  throw new Error('Unsupported passkey algorithm');
}

// ECDSA signatures arrive DER-encoded; WebCrypto expects r || s.
export function derToRaw(der) {
  if (der[0] !== 0x30) throw new Error('Bad signature');
  let offset = 2;
  const parts = [];
  for (let i = 0; i < 2; i++) {
    if (der[offset] !== 0x02) throw new Error('Bad signature');
    const size = der[offset + 1];
    let value = der.slice(offset + 2, offset + 2 + size);
    offset += 2 + size;
    while (value.length > 32 && value[0] === 0) value = value.slice(1);
    if (value.length > 32) throw new Error('Bad signature');
    const padded = new Uint8Array(32); padded.set(value, 32 - value.length); parts.push(padded);
  }
  const raw = new Uint8Array(64); raw.set(parts[0]); raw.set(parts[1], 32); return raw;
}

function clientData(encoded, type, challenge, origins) {
  const bytes = b64url.decode(encoded);
  if (bytes.length > 4096) throw new Error('Client data too large');
  const data = JSON.parse(decoder.decode(bytes));
  if (data.type !== type) throw new Error('Wrong ceremony');
  if (data.challenge !== challenge) throw new Error('Challenge mismatch');
  if (!origins.includes(data.origin)) throw new Error('Wrong origin');
  if (data.crossOrigin === true) throw new Error('Cross-origin ceremony');
  return bytes;
}
const same = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);

export async function verifyRegistration({ credential, challenge, origins, rpId }) {
  const response = credential?.response;
  if (!response || typeof response.clientDataJSON !== 'string' || typeof response.attestationObject !== 'string') throw new Error('Incomplete passkey');
  clientData(response.clientDataJSON, 'webauthn.create', challenge, origins);
  const attestation = decodeCbor(b64url.decode(response.attestationObject)).value;
  if (!(attestation instanceof Map) || !(attestation.get('authData') instanceof Uint8Array)) throw new Error('Bad attestation');
  const auth = parseAuthenticatorData(attestation.get('authData'));
  if (!same(auth.rpIdHash, await sha256(rpId))) throw new Error('Wrong relying party');
  if (!auth.userPresent || !auth.credentialId) throw new Error('No user presence');
  if (!auth.userVerified) throw new Error('Device unlock required');
  const credentialId = b64url.encode(auth.credentialId);
  if (credential.id !== credentialId) throw new Error('Credential ID mismatch');
  const { alg, jwk } = coseToJwk(auth.publicKey);
  return { credentialId, alg, jwk, signCount: auth.signCount, userVerified: auth.userVerified };
}

export async function verifyAssertion({ credential, challenge, origins, rpId, stored }) {
  const response = credential?.response;
  if (!response || typeof response.clientDataJSON !== 'string' || typeof response.authenticatorData !== 'string' || typeof response.signature !== 'string') throw new Error('Incomplete passkey response');
  const clientBytes = clientData(response.clientDataJSON, 'webauthn.get', challenge, origins);
  const authData = b64url.decode(response.authenticatorData);
  const auth = parseAuthenticatorData(authData);
  if (!same(auth.rpIdHash, await sha256(rpId))) throw new Error('Wrong relying party');
  if (!auth.userPresent) throw new Error('No user presence');
  if (!auth.userVerified) throw new Error('Device unlock required');
  const signed = new Uint8Array(authData.length + 32);
  signed.set(authData); signed.set(await sha256(clientBytes), authData.length);
  const jwk = JSON.parse(stored.public_key);
  const signature = b64url.decode(response.signature);
  let valid;
  if (stored.algorithm === ES256) {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, derToRaw(signature), signed);
  } else if (stored.algorithm === RS256) {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
  }
  if (!valid) throw new Error('Bad passkey signature');
  // A counter that stops increasing can mean a cloned authenticator; synced passkeys report 0.
  if (stored.sign_count > 0 && auth.signCount <= stored.sign_count) throw new Error('Passkey counter went backwards');
  return { signCount: auth.signCount, userVerified: auth.userVerified };
}

export function relyingParty(url) {
  const host = url.hostname;
  if (host === 'securebydesigninc.com' || host === 'www.securebydesigninc.com') {
    return { rpId: 'securebydesigninc.com', origins: ['https://securebydesigninc.com', 'https://www.securebydesigninc.com'] };
  }
  return { rpId: host, origins: [url.origin] };
}
