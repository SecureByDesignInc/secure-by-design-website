'use client';
// The calmer header (owner direction, 27 October 2026): four menu items, with My Account as a button at the right;
// the logo links home, so the menu has no Home item. On phones a menu button opens the items as a list.
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import links from '../content/navigation.json';
export default function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  // Everything that used to sit under the ATO Package Builder Hub belongs to the Training Hub now: course 2.1, the ATO
  // Template Library and the builder itself, as do the course guides and design references under /training.
  const inTrainingHub = ['/technical-training', '/videos', '/grc-rmf-training', '/training/'].some(prefix => path.startsWith(prefix));
  const current = (href: string) => href === '/technical-training' ? inTrainingHub : path.startsWith(href);
  const account = path.startsWith('/my-progress') || path.startsWith('/account');
  return <div className="site-menu" data-open={open ? 'true' : 'false'}>
    <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-menu-list" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
      </svg>
    </button>
    <div id="site-menu-list" className="site-menu-list">
      <nav aria-label="Main navigation">{links.map(([href, label]) =>
        <a key={href} href={href} className="nav-link" aria-current={current(href) ? 'page' : undefined}>{label}</a>
      )}</nav>
      <a href="/my-progress" className="nav-account" aria-current={account ? 'page' : undefined}>My Account</a>
    </div>
  </div>;
}
