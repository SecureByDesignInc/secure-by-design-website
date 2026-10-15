// Owner requests: 9 October 2026, the Guided portfolio track and the add-ons are not ready to be public;
// 13 October 2026, no membership specifics are public at all — everything sits under one "Coming soon".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('membership options show one "Coming soon" statement and no plan specifics', () => {
  const catalog = JSON.parse(read('content/membership-plans.json'));
  assert.deepEqual(Object.keys(catalog).sort(), ['comingSoon', 'comingSoonDetail', 'creatorNote']);
  assert.equal(catalog.comingSoon, 'Coming soon');
  const published = [read('content/membership-plans.json'), read('app/memberships/plans.tsx'), read('app/template-home.tsx'), read('app/my-progress/progress-dashboard.tsx')].join('\n');
  // "ATO Package Builder" is the authorization practice tool (15 October 2026), not the archived Builder plan.
  assert.doesNotMatch(published, /\$\d|(?<!Package )Builder|Guided|founding|per month|\/month|annual|quarter/i, 'no plan names, prices or billing are published');
  assert.doesNotMatch(read('app/my-progress/progress-dashboard.tsx'), /reader-membership-summary/, 'no membership summary card');
});

test('the earlier plan copy stays archived, unpublished', () => {
  const drafts = JSON.parse(read('archive/membership-drafts-2026-10-13.json'));
  assert.deepEqual(drafts.plans.map(plan => plan.id), ['community', 'builder', 'guided']);
  const earlier = JSON.parse(read('archive/membership-drafts-2026-10-09.json'));
  assert.equal(earlier.portfolioTrack.phases.length, 4, 'the portfolio track draft is kept, unpublished');
  assert.equal(earlier.addOns.items.length, 2, 'the add-on drafts are kept, unpublished');
});
