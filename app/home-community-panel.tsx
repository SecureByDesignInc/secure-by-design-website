'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Share2 } from 'lucide-react';
import { GradientButton } from '../components/saleshook/gradient-button';
import { copyPublicLink, homepageShareUrl } from '../public/footer-share.mjs';

// The community panel: the only homepage section after the Live Threat Map (owner's request, 17 October 2026).
// Pay what you can, ways to help without paying, and the supporter wall. It replaced "More ways to figure it
// out", "Choose your next step" and "There's always more to understand".

// Payments go through Stripe Checkout (server/support.js). The Support button stays disabled until the
// Stripe secrets are set in Cloudflare, and the supporter wall stays hidden until someone chooses to be listed.
type Supporter = { name: string; monthly: boolean };
type WallResponse = { enabled?: boolean; portal?: string | null; supporters?: Supporter[] };
type CheckoutResponse = { url?: string; error?: string };

// Panel events for the website analytics dashboard, sent through the site's PostHog setup
// (server/analytics.js) when it is on. Amounts and choices only; never a display name.
function track(event: string, properties: Record<string, unknown>) {
  const posthog = (window as unknown as { posthog?: { capture?: (name: string, props: Record<string, unknown>) => void } }).posthog;
  try { posthog?.capture?.(event, { ...properties, page: window.location.pathname }); } catch { /* analytics never blocks support */ }
}

const AMOUNTS = [3, 5, 10, 25];

const HELP = [
  { action: 'share_lesson', title: 'Share a lesson', body: 'Send a guide or video to someone who’s just starting out.', cta: 'Copy a lesson link', href: '/technical-training' },
  { action: 'linkedin_portfolio', title: 'Publish your newly earned professional portfolio on LinkedIn', body: 'Post your portfolio or the build you just finished, and tag Secure By Design so we can cheer you on and share it with the community.', cta: 'Share on LinkedIn', href: 'https://www.linkedin.com/company/secure-by-design-inc/', external: true },
  { action: 'discord_answer', title: 'Answer a question in Discord', body: 'Help with the step you were stuck on last month.', cta: 'Join the Discord', href: 'https://discord.gg/MDrGbP4cAY', external: true },
  { action: 'report_error', title: 'Report an error', body: 'Tell us when a step or screenshot is out of date.', cta: 'Report an error', href: `mailto:support@securebydesigninc.com?subject=${encodeURIComponent('Report an error')}` },
];

// The panel's own Pass it on button (owner's report, 17 October 2026: the shared footer button didn't work
// here). Phones and tablets open the share sheet; computers copy the homepage link and say so. If neither
// works, the link appears in a box to copy by hand. It always shares the homepage, never the current address.
type ShareState = 'idle' | 'busy' | 'copied' | 'opened' | 'manual';
const SHARE_MESSAGES: Record<ShareState, string> = {
  idle: '',
  busy: 'Please wait…',
  copied: 'Link copied. Ready to pass it on.',
  opened: 'Share options opened.',
  manual: 'Select and copy the link below.',
};

function PassItOn() {
  const [state, setState] = useState<ShareState>('idle');
  async function pass() {
    if (state === 'busy') return;
    setState('busy');
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Secure By Design', url: homepageShareUrl });
        setState('opened');
        return;
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') { setState('idle'); return; }
      }
    }
    setState(await copyPublicLink(navigator) === 'copied' ? 'copied' : 'manual');
  }
  return <div className="sbd-pass-share">
    <button type="button" className="footer-share-button" data-track="support_help_click" data-placement="support_panel" data-action="pass_it_on" disabled={state === 'busy'} onClick={() => { void pass(); }}>
      <Share2 size={16} aria-hidden="true"/>Pass it on
    </button>
    <output className="footer-share-status" aria-live="polite" aria-atomic="true">{SHARE_MESSAGES[state]}</output>
    {state === 'manual' && <div className="footer-share-manual">
      <label htmlFor="sbd-pass-link">Secure By Design homepage</label>
      <input id="sbd-pass-link" type="text" readOnly value={homepageShareUrl} onFocus={event => event.currentTarget.select()}/>
    </div>}
  </div>;
}

export default function HomeCommunityPanel() {
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState('');
  const [listName, setListName] = useState(false);
  const [badge, setBadge] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [ready, setReady] = useState(false);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [thanked, setThanked] = useState(false);
  const [portal, setPortal] = useState('');

  useEffect(() => {
    const returned = new URLSearchParams(window.location.search).get('support') === 'thanks';
    setThanked(returned);
    if (returned) track('support_thanks_seen', {});
    let live = true;
    fetch('/api/support/wall').then(response => response.ok ? response.json() as Promise<WallResponse> : null).then(data => {
      if (!live || !data) return;
      setReady(data.enabled === true);
      if (typeof data.portal === 'string' && data.portal.startsWith('https://billing.stripe.com/')) setPortal(data.portal);
      if (Array.isArray(data.supporters)) setSupporters(data.supporters.filter((item: Supporter) => typeof item?.name === 'string'));
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  async function startCheckout() {
    if (!ready || sending) return;
    setError('');
    const chosen = custom !== '' ? typed : String(amount);
    if (!chosen || Number(chosen) < 1) { setError('Enter an amount of at least $1.'); return; }
    if (listName && !displayName.trim()) { setError('Enter the display name you’d like on the wall, or untick that option.'); return; }
    setSending(true);
    track('support_checkout_started', { frequency, amount_usd: Number(chosen), listed: listName, badge });
    try {
      const response = await fetch('/api/support/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ frequency, amount: chosen, listName, displayName, badge }) });
      const data = await (response.json() as Promise<CheckoutResponse>).catch(() => null);
      if (response.ok && typeof data?.url === 'string' && data.url.startsWith('https://checkout.stripe.com/')) { window.location.assign(data.url); return; }
      setError(typeof data?.error === 'string' ? data.error : 'Checkout couldn’t start. Please try again.');
      track('support_checkout_error', { frequency, status: response.status });
    } catch {
      track('support_checkout_error', { frequency, status: 0 });
      setError('Checkout couldn’t start. Check your connection and try again.');
    }
    setSending(false);
  }

  const typed = custom.replace(/[^0-9.]/g, '');
  const shown = custom !== '' ? (typed ? `$${typed}` : 'what you can') : `$${amount}`;
  const label = frequency === 'monthly' ? `Support ${shown} a month` : `Support ${shown} once`;

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
                <a href={item.href} data-placement="support_panel" data-action={item.action} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : { 'data-track': 'support_help_click' })}>{item.cta}<ArrowRight size={16} aria-hidden="true"/>{item.external && <span className="sr-only"> (opens in a new tab)</span>}</a>
              </article>)}
            </div>
            <div className="sbd-support-pass">
              <p>If this helped you, help someone else find it.</p>
              <PassItOn/>
            </div>
          </div>
        </div>

        <form className="sbd-support-form" aria-labelledby="sbd-support-form-title" onSubmit={event => { event.preventDefault(); void startCheckout(); }}>
          {thanked && <p className="sbd-support-thanks" role="status">Thank you for your support. Stripe has emailed your receipt.</p>}
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
              <div><input id="sbd-support-display-name" type="text" autoComplete="off" maxLength={40} placeholder="How you want to be thanked" value={displayName} onChange={event => setDisplayName(event.target.value)}/></div>
            </div>}
            <label><input type="checkbox" checked={badge} onChange={() => setBadge(!badge)}/><span>Show a Supporter badge on my portfolio and Discord profile</span></label>
          </fieldset>
          <GradientButton type="submit" disabled={!ready || sending}>{sending ? 'Opening secure checkout…' : label}</GradientButton>
          {error && <p className="sbd-support-error" role="alert">{error}</p>}
          <p className="sbd-support-note">{ready ? 'Payments are handled securely by Stripe.' : 'Online payments open soon.'}</p>
          {portal && <a className="sbd-inline-link" href={portal} target="_blank" rel="noopener noreferrer">Manage or cancel monthly support<span className="sr-only"> (opens in a new tab)</span></a>}
        </form>
      </div>

      {supporters.length > 0 && <div className="sbd-support-wall-row">
        <div className="sbd-support-wall" aria-labelledby="sbd-support-wall-title">
          <p className="sbd-kicker">Supporter wall</p>
          <h3 id="sbd-support-wall-title">Thank you for keeping this going</h3>
          <p>Listed by choice, newest first</p>
          <ul>
            {supporters.map((supporter, index) => <li key={`${supporter.name}-${index}`}>
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
