// Owner request, 9 October 2026: the Guided portfolio track and the add-ons are not ready to be public.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('the membership options leave out the portfolio track and add-ons until the owner publishes them', () => {
  const catalog = JSON.parse(read('content/membership-plans.json'));
  assert.equal(catalog.portfolioTrack, undefined, 'portfolio track copy is not published');
  assert.equal(catalog.addOns, undefined, 'add-on copy is not published');
  assert.deepEqual(catalog.plans.map(plan => plan.id), ['community', 'builder', 'guided']);
  assert.doesNotMatch(read('app/memberships/plans.tsx'), /portfolioTrack|addOns|membership-extra/);
  const drafts = JSON.parse(read('archive/membership-drafts-2026-10-09.json'));
  assert.equal(drafts.portfolioTrack.phases.length, 4, 'the portfolio track draft is kept, unpublished');
  assert.equal(drafts.addOns.items.length, 2, 'the add-on drafts are kept, unpublished');
});
