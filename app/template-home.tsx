'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, Network } from 'lucide-react';
import { GradientButton } from '../components/saleshook/gradient-button';
import HomeRangeTaster from './home-range-taster';
import HomeCommunityPanel from './home-community-panel';

// The decorative WebGL layer (three.js) loads only once the page is idle.
const HeroShaderGradient = lazy(() => import('../components/saleshook/HeroShaderGradient').then(module => ({default: module.HeroShaderGradient})));

type ConnectionInfo = EventTarget & { saveData?: boolean };

export default function TemplateHome() {
  // 'wait' until idle, then the purchased shader. Visitors who prefer reduced motion or have
  // Save-Data on keep the static gradient ('static') and never download three.js.
  const [hero,setHero] = useState<'wait' | 'shader' | 'static'>('wait');
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    let idle: number | undefined;
    let timer: number | undefined;
    const show = () => setHero('shader');
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(show, { timeout: 2000 });
      else timer = window.setTimeout(show, 500);
    };
    const cancel = () => {
      window.removeEventListener('load', whenIdle);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      idle = timer = undefined;
    };
    const update = () => {
      cancel();
      if (motion.matches || connection?.saveData) { setHero('static'); return; }
      if (document.readyState === 'complete') whenIdle();
      else window.addEventListener('load', whenIdle, { once: true });
    };
    update();
    motion.addEventListener('change', update);
    connection?.addEventListener?.('change', update);
    return () => {
      cancel();
      motion.removeEventListener('change', update);
      connection?.removeEventListener?.('change', update);
    };
  }, []);
  return <main id="main" className="sbd-home">
    <section className={hero === 'static' ? 'sbd-hero sbd-hero-static' : 'sbd-hero'} aria-labelledby="sbd-hero-title">{hero === 'shader' && <Suspense fallback={null}><HeroShaderGradient/></Suspense>}<div className="sbd-hero-content container">
      <h1 id="sbd-hero-title">Cybersecurity starts<br/>with <span>curiosity.</span></h1>
      <p>Cybersecurity isn’t some exclusive club for geniuses. It really just takes a healthy dose of curiosity and a drive to figure out how things work under the hood.</p>
      <div className="sbd-hero-actions"><GradientButton asChild><a href="/technical-training">Find your starting point <ArrowRight size={18}/></a></GradientButton><a className="sbd-secondary-button" href="/inside-the-network"><Network size={18}/> Step inside the network</a></div>
      <small>For the first question. The next challenge. And everything in between.</small>
    </div></section>
    <HomeRangeTaster/>
    <HomeCommunityPanel/>
  </main>;
}
