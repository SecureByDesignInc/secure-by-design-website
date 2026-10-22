import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { contentSecurityPolicy, hsts, protect, securityHeaders } from '../server/security-headers.js';

test('the Worker entry exports only its default handler', () => {
  // A named export that isn't a handler stops the Workers runtime from starting.
  const source = readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
  const named = source.split('\n').filter(line => /^export\s/.test(line) && !/^export default\b/.test(line));
  assert.deepEqual(named, []);
});

test('pages get the policy and every response gets the protections', async () => {
  const page = protect(new Response('<p>hi</p>', { headers: { 'content-type': 'text/html; charset=utf-8' } }), true);
  assert.equal(page.headers.get('content-security-policy'), contentSecurityPolicy);
  assert.equal(page.headers.get('strict-transport-security'), hsts);
  for (const [name, value] of Object.entries(securityHeaders)) assert.equal(page.headers.get(name), value, name);
  assert.equal(await page.text(), '<p>hi</p>');

  const json = protect(Response.json({ ok: true }, { status: 201 }), false);
  assert.equal(json.status, 201);
  assert.equal(json.headers.get('content-security-policy'), null);
  assert.equal(json.headers.get('strict-transport-security'), null);
  assert.equal(json.headers.get('x-content-type-options'), 'nosniff');
});

test('a stricter page policy is kept, and redirects stay redirects', () => {
  const strict = "default-src 'self'; script-src 'self'";
  const owner = protect(new Response('x', { headers: { 'content-type': 'text/html', 'content-security-policy': strict } }), true);
  assert.equal(owner.headers.get('content-security-policy'), strict);
  const moved = protect(Response.redirect('https://securebydesigninc.com/my-progress', 302), true);
  assert.equal(moved.status, 302);
  assert.equal(moved.headers.get('location'), 'https://securebydesigninc.com/my-progress');
});

test('the policy keeps other sites from framing pages and blocks plugins', () => {
  assert.match(contentSecurityPolicy, /frame-ancestors 'self'/);
  assert.match(contentSecurityPolicy, /object-src 'none'/);
  assert.match(contentSecurityPolicy, /base-uri 'self'/);
  assert.match(hsts, /includeSubDomains/);
});

// Owner direction, 21 October 2026: the ATO Package Builder page compiles SQLite to WebAssembly for visitors without an
// account, so only that page allows 'wasm-unsafe-eval' (WebAssembly only, never JavaScript eval).
test('only the ATO Package Builder page may compile WebAssembly', () => {
  const page = (path) => protect(new Response('<p>x</p>', { headers: { 'content-type': 'text/html' } }), true, path).headers.get('content-security-policy');
  assert.match(page('/grc-rmf-training/workspace'), /script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https:\/\/static\.cloudflareinsights\.com/);
  for (const path of ['/', '/grc-rmf-training', '/technical-training', '/grc-rmf-training/workspace/other', undefined]) assert.doesNotMatch(page(path), /wasm-unsafe-eval/, String(path));
  assert.doesNotMatch(page('/grc-rmf-training/workspace'), /'unsafe-eval'/);
});
