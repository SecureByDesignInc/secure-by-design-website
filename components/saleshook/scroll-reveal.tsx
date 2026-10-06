'use client';
// Adapted from the purchased page's intersection-based ScrollReveal.
// Content remains available without JavaScript and under reduced motion.
import { useEffect, useRef, type ReactNode } from 'react';
export function ScrollReveal({children, className = ''}: {children: ReactNode; className?: string}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.animate([{opacity: .55, transform: 'translateY(22px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 600, easing: 'cubic-bezier(.22,1,.36,1)'});
        observer.disconnect();
      }
    }, {threshold: .08});
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
