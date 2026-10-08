import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// The return address after sign-in must stay on this site (audit finding S2: "/.//evil.example" left it).
const source = readFileSync(new URL('../app/account/safe-return.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const exports = {};
runInNewContext(code, { exports, URL, window: { location: { origin: 'https://securebydesigninc.com' } } });
const { safeReturnPath } = exports;

test('paths on this site are kept as they are', () => {
  assert.equal(safeReturnPath('/training'), '/training');
  assert.equal(safeReturnPath('/training/dns-configuration?x=1#zones'), '/training/dns-configuration?x=1#zones');
  assert.equal(safeReturnPath('/career-records'), '/career-records');
  assert.equal(safeReturnPath('https://securebydesigninc.com/privacy'), '/privacy');
});

test('anything that leaves the site is refused', () => {
  for (const value of ['/.//evil.example', '//evil.example', '/\\evil.example', 'https://evil.example/', 'javascript:alert(1)', '///evil.example', '/%2F%2Fevil.example/..', ' //evil.example', 'http://securebydesigninc.com/', '']) {
    const result = safeReturnPath(value);
    assert.ok(result === null || (result.startsWith('/') && !result.startsWith('//')), `${value} -> ${result}`);
    if (result) assert.equal(new URL(result, 'https://securebydesigninc.com').origin, 'https://securebydesigninc.com', value);
  }
  assert.equal(safeReturnPath('/.//evil.example'), null);
  assert.equal(safeReturnPath('//evil.example'), null);
  assert.equal(safeReturnPath('https://evil.example/'), null);
  assert.equal(safeReturnPath('javascript:alert(1)'), null);
  assert.equal(safeReturnPath(null), null);
});

test('very long or non-printable return paths are refused', () => {
  assert.equal(safeReturnPath('/' + 'a'.repeat(600)), null);
  assert.equal(safeReturnPath('/café'), '/caf%C3%A9');
  assert.equal(safeReturnPath('/a\u0000b'), '/a%00b');
});
