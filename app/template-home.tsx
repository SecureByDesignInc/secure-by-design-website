'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Users, Network } from 'lucide-react';
import { GradientButton } from '../components/saleshook/gradient-button';
import membershipCatalog from '../content/membership-plans.json';
import HomeThreatWindow from './home-threat-window';

// The decorative WebGL layer (three.js) loads only once the page is idle.
const HeroShaderGradient = lazy(() => import('../components/saleshook/HeroShaderGradient').then(module => ({default: module.HeroShaderGradient})));

type ConnectionInfo = EventTarget & { saveData?: boolean };

// One course of the Build the Network path (resolved from content/videos.json in app/page.tsx).
export type BuildPathCourse = { id: string; number: string; title: string; subtitle: string; href: string; video: boolean };

export default function TemplateHome({ buildPath, buildCategory }: { buildPath: BuildPathCourse[]; buildCategory: string }) {
  const [first, ...next] = buildPath;
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
      <div className="sbd-hero-actions"><GradientButton asChild><a href="/training">Find your starting point <ArrowRight size={18}/></a></GradientButton><a className="sbd-secondary-button" href="/inside-the-network"><Network size={18}/> Step inside the network</a></div>
      <small>For the first question. The next challenge. And everything in between.</small>
    </div></section>
    <section className="sbd-start container" aria-labelledby="sbd-start-title">
      <div className="sbd-section-heading"><div><p className="sbd-kicker">A practical place to begin</p><h2 id="sbd-start-title">Start building<br/><span>your network.</span></h2></div><p>Two learning paths, one network: build it course by course, then prepare the same network for authorization.</p></div>
      <div className="sbd-start-grid">
        <article className="sbd-start-first"><div><p className="sbd-kicker">Start here · Course {first.number} · {buildCategory}</p><h3>{first.title}</h3><p>Promote two servers to Active Directory domain controllers on Windows Server, on a network segment of their own. Follow the interactive guide and record your work in the companion workbook.</p></div><div className="sbd-start-first-action"><small>Written training available · {first.video ? 'Video available' : 'Video coming soon'}</small><a className="sbd-inline-link" href={first.href}>Start the first course <ArrowRight size={18}/></a></div></article>
        <div className="sbd-start-next"><p className="sbd-kicker" id="sbd-start-next-title">Then keep building, in order</p><ol aria-labelledby="sbd-start-next-title">{next.map(course => <li key={course.id}><a href={course.href}><span><strong>{course.number} · {course.title}</strong><small>{buildCategory} · {course.subtitle}</small></span><ArrowUpRight size={18}/></a></li>)}<li className="sbd-start-path"><a href="/training/rmf/index.html"><span><strong>Path 2 · Prepare the network for authorization</strong><small>Network Authorization · Risk Management Framework, Body of Evidence &amp; Authorization to Operate</small></span><ArrowUpRight size={18}/></a></li></ol></div>
      </div><a className="sbd-inline-link sbd-start-catalog" href="/training">Explore all training <ArrowRight size={17}/></a>
    </section>
    <aside className="sbd-creator-note container" aria-labelledby="sbd-creator-title"><div className="sbd-creator-card"><span className="sbd-creator-initials" aria-hidden="true">SBD</span><div><h2 id="sbd-creator-title">A note from Secure By Design</h2><p>{membershipCatalog.creatorNote}</p><span className="sbd-creator-signature">Secure By Design</span></div></div></aside>
    <HomeThreatWindow/>
    <section className="sbd-future container" id="start-reading" aria-labelledby="sbd-future-title"><div><p className="sbd-kicker">Learn your way</p><h2 id="sbd-future-title">More ways<br/>to <span>figure it out.</span></h2><p>Read the training, watch the builds take shape, and keep building your understanding.</p></div><div className="sbd-future-list">
      <a href="/training"><BookOpen size={30} strokeWidth={1.2}/><div><h3>Training Library</h3><p>Interactive guides, workbooks, and templates for building a network and preparing it for authorization.</p></div><ArrowUpRight size={18}/></a>
      <a href="/inside-the-network"><Network size={30} strokeWidth={1.2}/><div><h3>Inside the Network</h3><p>Explore the complete training network in 3D and see how every course connects to the same build.</p></div><ArrowUpRight size={18}/></a>
    </div></section>
    <section className="sbd-future sbd-next-step container" id="community" aria-labelledby="sbd-memberships-title"><div><p className="sbd-kicker">Learn it. Share it. Pay it forward.</p><h2 id="sbd-memberships-title">Choose your<br/><span>next step.</span></h2></div><div className="sbd-future-list"><p>Create an account to keep your progress and saved materials. Builder and Guided memberships are coming soon for deeper project work and personal guidance.</p><a href="/my-progress"><Users size={30} strokeWidth={1.2}/><div><h3>My Account</h3><p>Continue learning, find your saved materials, and manage your account.</p></div><ArrowUpRight size={18}/></a></div></section>
    <section className="sbd-about" id="about" aria-labelledby="sbd-about-title"><div className="container"><div><p className="sbd-kicker">Built for curious minds</p><h2 id="sbd-about-title">There’s always<br/>more to understand.</h2></div><div><p>Secure By Design connects the dots between technology and compliance, with room to ask questions, share knowledge, and put ideas into practice.</p><p>Whether you’ve been in the field for years or you’re just getting curious, you’re welcome here.</p><a className="sbd-inline-link" href="/training">Let’s get into it <ArrowRight size={17}/></a></div></div></section>
  </main>;
}
