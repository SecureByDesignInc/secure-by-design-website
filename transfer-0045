'use client';
import { usePathname } from 'next/navigation';
import links from '../content/navigation.json';
export default function Navigation() {
  const path = usePathname();
  return <nav aria-label="Main navigation">{links.map(([href, label]) =>
    <a key={href} href={href} className="nav-link" aria-current={(href === '/' ? path === '/' : path.startsWith(href)||(href==='/careers'&&(path==='/career-goals'||path.startsWith('/career-explorer')))) ? 'page' : undefined}>{label}</a>
  )}</nav>;
}
