// Owner request, 9 October 2026: My Account matches the site's dark design instead of a white page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('My Account and the app sign-in page render inside the full-width dark account page', () => {
  for (const path of ['app/my-progress/page.tsx', 'app/app-sign-in/page.tsx']) {
    const source = read(path);
    assert.match(source, /<main id="main" className="account-page"><div className="container reader-page">/, path);
    assert.match(source, /import '(?:\.\/|\.\.\/my-progress\/)my-progress\.css';/, path);
  }
  const css = read('app/my-progress/my-progress.css');
  assert.match(css, /^\.account-page\{background:#071521;/m, 'dark page background');
  assert.match(css, /body\.site-editorial:has\(\.account-page\)\{background:#071521\}/, 'dark body behind the page');
});

test('the dark account theme stays scoped to the account pages', () => {
  const css = read('app/my-progress/my-progress.css').replace(/\/\*[\s\S]*?\*\//g, '');
  // Rules that restyle the shared reader styles must sit under .account-page, so the light reading
  // surfaces (.reader-save in guides and articles) keep their colors after client-side navigation.
  const shared = /\.reader-(?:welcome|privacy|primary|note|error|app-note|auth-modes|account-form|consent|summary|collection|delete)\b|\.sso-|\.sign-in-method|\.method-icon/;
  // Selector lists split on top-level commas only (not the commas inside :is() or :not()).
  const parts = selector => {
    const out = [''];
    let depth = 0;
    for (const char of selector) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (char === ',' && depth === 0) out.push('');
      else out[out.length - 1] += char;
    }
    return out.map(part => part.trim());
  };
  const selectors = css.split('}').map(rule => rule.split('{').at(-2)).filter(selector => selector?.trim());
  assert.ok(selectors.length > 50, 'rules were read');
  for (const selector of selectors) {
    for (const part of parts(selector)) {
      if (shared.test(part)) assert.match(part, /^(?:body\.site-editorial )?\.account-page\b/, part);
    }
  }
  assert.doesNotMatch(css, /\.reader-save/, 'reading-page progress controls are not restyled here');
});
