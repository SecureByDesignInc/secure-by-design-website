'use client';

import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import catalog from '../../content/membership-plans.json';

export default function MembershipPlans() {
  const [cycle, setCycle] = useState('monthly');
  const [selected, setSelected] = useState('community');
  const annual = cycle === 'annual';
  const plan = catalog.plans.find(item => item.id === selected)!;
  const yearly = annual && plan.annualPrice !== null;
  const amount = yearly ? plan.annualPrice : plan.monthlyPrice;
  return <>
    <header className="membership-heading">
      <p className="membership-kicker"><ShieldCheck size={20} aria-hidden="true" /> Learn it. Build it. Put it to work.</p>
      <h2 id="membership-options-title">Membership options</h2>
      <p>Start with Community. Add hands-on projects or personal guidance when you’re ready.</p>
      <a className="membership-continue" href="/videos">Continue with Community</a>
    </header>
    <div className="membership-billing">
      <RadioGroup value={cycle} onValueChange={setCycle} aria-label="Builder billing period" className="membership-cycle">
        <label data-selected={!annual}><RadioGroupItem id="membership-monthly" value="monthly" /> Monthly</label>
        <label data-selected={annual}><RadioGroupItem id="membership-annual" value="annual" /> Annual · save 25%</label>
      </RadioGroup>
      <p>Annual savings apply to Builder. Guided is monthly. All prices are in USD.</p>
    </div>
    <div className="membership-grid">
      {catalog.plans.map(item => {
        const isAnnual = annual && item.annualPrice !== null;
        return <article key={item.id} className="membership-card" data-selected={selected === item.id}>
          <p className="membership-status">{item.available ? 'Available now' : 'Coming soon · planned benefits'}</p>
          <h3>{item.name}</h3><p className="membership-tagline">{item.tagline}</p>
          <p className="membership-price">${isAnnual ? item.annualPrice : item.monthlyPrice}<span>{item.id === 'community' ? '' : isAnnual ? ' / year' : ' / month'}</span></p>
          <p className="membership-charge">{item.available ? 'No payment details required.' : isAnnual ? '$180 billed yearly · $15/month equivalent.' : `$${item.monthlyPrice} billed monthly when available.`}</p>
          <ul>{item.features.map(feature => <li key={feature}><Check size={17} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
          {item.available ? <a className="membership-button membership-primary" href="/videos">Continue with Community</a> : <button className="membership-button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{selected === item.id ? `${item.name} details selected` : `Explore ${item.name}`}</button>}
        </article>;
      })}
    </div>
    <section className="membership-details" aria-live="polite" aria-atomic="true">
      <h3>{plan.name} · ${amount}{plan.available ? '' : yearly ? '/year · coming soon' : '/month · coming soon'}</h3>
      <p>{plan.available ? 'Keep learning with the current courses and tools. Sharing is always optional. No subscription or automatic charges.' : plan.id === 'builder' ? `${yearly ? 'Pay $180 for 12 months and save $60 compared with 12 monthly payments.' : 'Planned price: $20 for one month of Builder access.'} Your own lab hardware, software and hosting are separate.` : 'Includes Builder, one 30-minute coaching call and one project review each month. Enrollment opens when coaching appointments are available.'}</p>
      {!plan.available && <p>Planned billing: renews at ${amount}/{yearly ? 'year' : 'month'}. Cancel before renewal; access continues through the paid period. Community access and saved progress remain.</p>}
      <p className="membership-availability">Builder and Guided are coming soon. Their benefits are being prepared; paid enrollment and checkout are not open.</p>
      <a href="/videos">Keep learning with Community</a>
    </section>
    <aside className="membership-creator" aria-label="A note from Secure By Design">
      <div className="membership-initials" aria-hidden="true">SBD</div>
      <div><h3>A note from Secure By Design</h3><p>{catalog.creatorNote}</p><span>Secure By Design</span></div>
    </aside>
  </>;
}
