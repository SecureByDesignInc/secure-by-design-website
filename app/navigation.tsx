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
  return <nav ref={nav} aria-label="Main navigation">{links.map(([href, label]) =>
    <a key={href} href={href} className="nav-link" aria-current={(href === '/' ? path === '/' : path.startsWith(href)||(href==='/technical-training'&&path.startsWith('/videos'))) ? 'page' : undefined}>{label}</a>
  )}</nav>;
}
