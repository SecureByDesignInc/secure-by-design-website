'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import links from '../content/navigation.json';
export default function Navigation() {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  // On phones the navigation is one horizontally scrollable row; bring the current page's link into view
  // without scrolling the page itself.
  useEffect(() => {
    const row = nav.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !current || row.scrollWidth <= row.clientWidth) return;
    const offset = current.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    row.scrollLeft = Math.max(0, offset - (row.clientWidth - current.offsetWidth) / 2);
  }, [path]);
  // The ATO Template Library (/grc-rmf-training/templates) belongs to the Training Hub, though its address sits under the
  // ATO Package Builder Hub's (owner direction, 19 October 2026).
  const inTrainingHub = path.startsWith('/technical-training') || path.startsWith('/videos') || path.startsWith('/grc-rmf-training/templates');
  const current = (href: string) => href === '/' ? path === '/'
    : href === '/technical-training' ? inTrainingHub
    : href === '/grc-rmf-training' ? path.startsWith(href) && !inTrainingHub
    : path.startsWith(href);
  return <nav ref={nav} aria-label="Main navigation">{links.map(([href, label]) =>
    <a key={href} href={href} className="nav-link" aria-current={current(href) ? 'page' : undefined}>{label}</a>
  )}</nav>;
}
