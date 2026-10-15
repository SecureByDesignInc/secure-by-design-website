import { Clock, ShieldCheck } from 'lucide-react';
import catalog from '../../content/membership-plans.json';

// Owner request, 13 October 2026: no membership specifics are public — no plan names, prices,
// features or billing — only one "Coming soon" statement. The previous plan copy is kept unpublished in
// archive/membership-drafts-2026-10-13.json.
export default function MembershipPlans() {
  return <>
    <header className="membership-heading">
      <p className="membership-kicker"><ShieldCheck size={20} aria-hidden="true" /> Learn it. Build it. Put it to work.</p>
      <h2 id="membership-options-title">Membership options</h2>
      <p className="membership-coming-soon"><Clock size={16} aria-hidden="true" />{catalog.comingSoon}</p>
      <p>{catalog.comingSoonDetail}</p>
      <a className="membership-continue" href="/training">Keep learning in the Training Library</a>
    </header>
    <aside className="membership-creator" aria-label="A note from Secure By Design">
      <div className="membership-initials" aria-hidden="true">SBD</div>
      <div><h3>A note from Secure By Design</h3><p>{catalog.creatorNote}</p><span>Secure By Design</span></div>
    </aside>
  </>;
}
