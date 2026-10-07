'use client';
import { usePathname } from 'next/navigation';
import links from '../content/navigation.json';
export default function Navigation() {
  const path = usePathname();
  return <nav aria-label="Main navigation">{links.map(([href, label]) =>
    <a key={href} href={href} className="nav-link" aria-current={(href === '/' ? path === '/' : path.startsWith(href)||(href==='/training'&&path.startsWith('/videos'))) ? 'page' : undefined}>{label}</a>
  )}</nav>;
}
