'use client';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { GradientButton } from '../components/saleshook/gradient-button';
import FooterShare from './footer-share';

// The community panel: the only homepage section after the Live Threat Map (owner's request, 17 October 2026).
// Pay what you can, ways to help without paying, and the supporter wall. It replaced "More ways to figure it
// out", "Choose your next step" and "There's always more to understand".

// Online payments are not set up yet. Until a checkout link exists the Support button stays disabled and
// says so; paste the provider's checkout address here when it is ready.
const CHECKOUT_URL = '';

// Supporters who chose to be listed, newest first. The wall stays hidden until the first name is added.
const SUPPORTERS: { name: string; monthly: boolean }[] = [];

const AMOUNTS = [3, 5, 10, 25];

const HELP = [
  { title: 'Share a lesson', body: 'Send a guide or video to someone who’s just starting out.', cta: 'Copy a lesson link', href: '/technical-training' },
  { title: 'Publish your newly earned professional portfolio on LinkedIn', body: 'Post your portfolio or the build you just finished, and tag Secure By Design so we can cheer you on and share it with the community.', cta: 'Share on LinkedIn', href: 'https://www.linkedin.com/company/secure-by-design-inc/', external: true },
  { title: 'Answer a question in Discord', body: 'Help with the step you were stuck on last month.', cta: 'Join the Discord', href: 'https://discord.gg/MDrGbP4cAY', external: true },
  { title: 'Report an error', body: 'Tell us when a step or screenshot is out of date.', cta: 'Report an error', href: `mailto:support@securebydesigninc.com?subject=${encodeURIComponent('Report an error')}` },
];

export default function HomeCommunityPanel() {
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState('');
  const [listName, setListName] = useState(false);
  const [badge, setBadge] = useState(false);

  const typed = custom.replace(/[^0-9.]/g, '');
  const shown = custom !== '' ? (typed ? `$${typed}` : 'what you can') : `$${amount}`;
  const label = frequency === 'monthly' ? `Support ${shown} a month` : `Support ${shown} once`;
  const ready = CHECKOUT_URL !== '';

  return <section id="community" className="sbd-support container" aria-labelledby="sbd-support-title">
    <div className="sbd-support-panel">
      <div className="sbd-support-top">
        <div className="sbd-support-intro">
          <h2 id="sbd-support-title">Help keep the community going.</h2>
          <p className="sbd-support-lead">Secure By Design runs on the people who learn here. If the training is helping you, you can chip in what you can, when you can. If you can’t, that’s completely fine. Most of what keeps this community going doesn’t cost a thing.</p>
          <div id="help" className="sbd-support-help">
            <h3>Can’t chip in? Here’s how to help.</h3>
            <div className="sbd-support-help-grid">
              {HELP.map(item => <article key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
                <a href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.cta}<ArrowRight size={16} aria-hidden="true"/>{item.external && <span className="sr-only"> (opens in a new tab)</span>}</a>
              </article>)}
            </div>
            <div className="sbd-support-pass">
              <p>If this helped you, help someone else find it.</p>
              <FooterShare/>
            </div>
          </div>
        </div>

        <form className="sbd-support-form" aria-labelledby="sbd-support-form-title" onSubmit={event => { event.preventDefault(); if (ready) window.location.assign(CHECKOUT_URL); }}>
          <div>
            <h3 id="sbd-support-form-title">Pay what you can</h3>
            <p>Any amount helps. Change or cancel anytime.</p>
          </div>
          <div className="sbd-support-frequency" role="group" aria-label="How often">
            <button type="button" aria-pressed={frequency === 'once'} onClick={() => setFrequency('once')}>Just once</button>
            <button type="button" aria-pressed={frequency === 'monthly'} onClick={() => setFrequency('monthly')}>Monthly</button>
          </div>
          <div className="sbd-support-amounts" role="group" aria-label="Amount">
            {AMOUNTS.map(value => <button key={value} type="button" aria-pressed={custom === '' && amount === value} onClick={() => { setAmount(value); setCustom(''); }}>${value}</button>)}
          </div>
          <div className="sbd-support-field">
            <label htmlFor="sbd-support-custom">Or enter your own amount (USD)</label>
            <div><span aria-hidden="true">$</span><input id="sbd-support-custom" type="text" inputMode="decimal" autoComplete="off" placeholder="Any amount" value={custom} onChange={event => setCustom(event.target.value)}/></div>
          </div>
          <fieldset className="sbd-support-recognition">
            <legend>Recognition (optional, off by default)</legend>
            <label><input type="checkbox" checked={listName} onChange={() => setListName(!listName)}/><span>List my display name on the supporter wall</span></label>
            {listName && <div className="sbd-support-field sbd-support-name">
              <label htmlFor="sbd-support-display-name">Display name</label>
              <div><input id="sbd-support-display-name" type="text" autoComplete="nickname" placeholder="How you want to be thanked"/></div>
            </div>}
            <label><input type="checkbox" checked={badge} onChange={() => setBadge(!badge)}/><span>Show a Supporter badge on my portfolio and Discord profile</span></label>
          </fieldset>
          <GradientButton type="submit" disabled={!ready}>{label}</GradientButton>
          <p className="sbd-support-note">{ready ? 'You’ll finish on our payment provider’s secure checkout.' : 'Online payments open soon.'}</p>
          <a className="sbd-inline-link" href="#help">Can’t chip in? Here’s how to help</a>
        </form>
      </div>

      {SUPPORTERS.length > 0 && <div className="sbd-support-wall-row">
        <div className="sbd-support-wall" aria-labelledby="sbd-support-wall-title">
          <p className="sbd-kicker">Supporter wall</p>
          <h3 id="sbd-support-wall-title">Thank you for keeping this going</h3>
          <p>Listed by choice, newest first</p>
          <ul>
            {SUPPORTERS.map((supporter, index) => <li key={`${supporter.name}-${index}`}>
              <span aria-hidden="true">{supporter.name.trim().charAt(0).toUpperCase()}</span>
              {supporter.name}
              {supporter.monthly && <small>Monthly</small>}
            </li>)}
          </ul>
        </div>
      </div>}
    </div>
  </section>;
}
