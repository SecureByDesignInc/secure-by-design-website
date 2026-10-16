// Owner request, 16 October 2026: remove membership tiers entirely. Every account is a free Community account.
// This replaces tests/membership-plans.test.mjs (the 13 October "Coming soon" rule).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const path = file => new URL('../' + file, import.meta.url);
const read = file => readFileSync(path(file), 'utf8');

test('the membership plan files are gone', () => {
  for (const file of ['app/memberships/plans.tsx', 'app/memberships/memberships.css', 'content/membership-plans.json', 'tests/membership-plans.test.mjs', 'archive/membership-drafts-2026-10-09.json', 'archive/membership-drafts-2026-10-13.json']) {
    assert.equal(existsSync(path(file)), false, `${file} should be deleted`);
  }
});

test('the founding waitlist table is dropped', () => {
  assert.match(read('drizzle/0016_drop_membership_waitlist.sql'), /^DROP TABLE IF EXISTS membership_waitlist;$/m);
});

test('old /memberships links open the free Community account section', () => {
  const page = read('app/memberships/page.tsx');
  assert.match(page, /permanentRedirect\('\/my-progress#community-account'\)/);
  assert.match(read('app/my-progress/progress-dashboard.tsx'), /id="community-account"/);
});

test('pages and messages people see describe one free Community account, with no tiers', () => {
  const pages = ['app/template-home.tsx', 'app/my-progress/progress-dashboard.tsx', 'app/my-progress/page.tsx', 'app/my-progress/my-progress.css', 'app/account/sign-in.tsx', 'app/my-progress/sign-in-methods.tsx', 'app/career-goals/worksheet.tsx', 'app/privacy/page.tsx'];
  for (const file of pages) {
    const text = read(file).replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/g, '');
    assert.doesNotMatch(text, /membership/i, `${file} should not mention memberships`);
  }
  // The server keeps the internal field name `membership` because the installed app reads it; only the wording changes.
  for (const file of ['server/resources.js', 'server/reader-auth.js']) {
    assert.doesNotMatch(read(file), /Community membership/, `${file} messages should not say "Community membership"`);
  }
  const published = pages.map(read).join('\n');
  assert.doesNotMatch(published, /\$\d|per month|\/month|annual plan|quarterly|(?<!Package )Builder plan|Guided (plan|tier)/i, 'no plan names, prices or billing');
  assert.match(read('app/template-home.tsx'), /free Community account/);
  assert.match(read('app/my-progress/progress-dashboard.tsx'), /Every Secure By Design account is a free Community account/);
});
