'use client';

import { useState } from 'react';
import { Check, Clock, ShieldCheck } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import catalog from '../../content/membership-plans.json';

type Plan = {
  id: string; name: string; tagline: string; monthlyPrice: number; annualPrice: number | null; quarterlyPrice?: number;
  available: boolean; status: string; badge?: string; features: string[]; comingSoon?: string[];
  chargeMonthly?: string; chargeAnnual?: string; detail?: string; detailMonthly?: string; detailAnnual?: string;
  renewMonthly?: string; renewAnnual?: string;
};
const plans = catalog.plans as unknown as Plan[];

export default function MembershipPlans() {
  const [cycle, setCycle] = useState('monthly');
  const [selected, setSelected] = useState('community');
  const annual = cycle === 'annual';
  const plan = plans.find(item => item.id === selected)!;
  const yearly = annual && plan.annualPrice !== null;
  const amount = yearly ? plan.annualPrice : plan.monthlyPrice;
  const detail = plan.detail ?? (yearly ? plan.detailAnnual : plan.detailMonthly);
  const renewal = yearly ? plan.renewAnnual : plan.renewMonthly;
  return <>
    <header className="membership-heading">
      <p className="membership-kicker"><ShieldCheck size={20} aria-hidden="true" /> Learn it. Build it. Put it to work.</p>
      <h2 id="membership-options-title">Membership options</h2>
      <p>{catalog.intro}</p>
      <a className="membership-continue" href="/training">Continue with Community</a>
    </header>
    <div className="membership-billing">
      <RadioGroup value={cycle} onValueChange={setCycle} aria-label="Builder billing period" className="membership-cycle">
        <label data-selected={!annual}><RadioGroupItem id="membership-monthly" value="monthly" /> Monthly</label>
        <label data-selected={annual}><RadioGroupItem id="membership-annual" value="annual" /> Annual · save 25%</label>
      </RadioGroup>
      <p>{catalog.billingNote}</p>
    </div>
    <div className="membership-grid">
      {plans.map(item => {
        const isAnnual = annual && item.annualPrice !== null;
        const charge = item.available ? 'No payment details required.' : (isAnnual ? item.chargeAnnual : item.chargeMonthly) ?? `$${item.monthlyPrice} billed monthly when available.`;
        return <article key={item.id} className="membership-card" data-selected={selected === item.id} data-recommended={Boolean(item.badge)}>
          <div className="membership-card-top"><p className="membership-status">{item.status}</p>{item.badge && <span className="membership-badge">{item.badge}</span>}</div>
          <h3>{item.name}</h3><p className="membership-tagline">{item.tagline}</p>
          <p className="membership-price">${isAnnual ? item.annualPrice : item.monthlyPrice}<span>{item.monthlyPrice === 0 ? '' : isAnnual ? ' / year' : ' / month'}</span></p>
          <p className="membership-charge">{charge}</p>
          <ul>
            {item.features.map(feature => <li key={feature}><Check size={17} aria-hidden="true" /><span>{feature}</span></li>)}
            {item.comingSoon?.map(feature => <li key={feature} className="membership-soon"><Clock size={17} aria-hidden="true" /><span>{feature} <em>Coming soon</em></span></li>)}
          </ul>
          {item.available ? <a className="membership-button membership-primary" href="/training">Continue with Community</a> : <button className={`membership-button${item.badge ? ' membership-recommended' : ''}`} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{selected === item.id ? `${item.name} details selected` : `Explore ${item.name}`}</button>}
        </article>;
      })}
    </div>
    <section className="membership-details" aria-live="polite" aria-atomic="true">
      <h3>{plan.name} · ${amount}{plan.available ? '' : yearly ? '/year · coming soon' : plan.quarterlyPrice ? `/month or $${plan.quarterlyPrice}/quarter · coming soon` : '/month · coming soon'}</h3>
      <p>{detail}</p>
      {!plan.available && renewal && <p>{renewal}</p>}
      <p className="membership-availability">{catalog.availabilityNote}</p>
      <a href="/training">Keep learning with Community</a>
    </section>
    <aside className="membership-creator" aria-label="A note from Secure By Design">
      <div className="membership-initials" aria-hidden="true">SBD</div>
      <div><h3>A note from Secure By Design</h3><p>{catalog.creatorNote}</p><span>Secure By Design</span></div>
    </aside>
  </>;
}
