'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Users, Network } from 'lucide-react';
import { GradientButton } from '../components/saleshook/gradient-button';
import membershipCatalog from '../content/membership-plans.json';

// Load the decorative WebGL layer after the usable page has hydrated.
const HeroShaderGradient = lazy(() => import('../components/saleshook/HeroShaderGradient').then(module => ({default: module.HeroShaderGradient})));

export default function TemplateHome() {
  const [showShader,setShowShader] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setShowShader(!preference.matches);
    update(); preference.addEventListener('change',update);
    return () => preference.removeEventListener('change',update);
  }, []);
  return <main id="main" className="sbd-home">
    <section className="sbd-hero" aria-labelledby="sbd-hero-title">{showShader && <Suspense fallback={null}><HeroShaderGradient/></Suspense>}<div className="sbd-hero-content container">
      <h1 id="sbd-hero-title">Cybersecurity starts<br/>with <span>curiosity.</span></h1>
      <p>Cybersecurity isn’t some exclusive club for geniuses. It really just takes a healthy dose of curiosity and a drive to figure out how things work under the hood.</p>
      <div className="sbd-hero-actions"><GradientButton asChild><a href="/training">Find your starting point <ArrowRight size={18}/></a></GradientButton><a className="sbd-secondary-button" href="/inside-the-network"><Network size={18}/> Step inside the network</a></div>
      <small>For the first question. The next challenge. And everything in between.</small>
    </div></section>
    <section className="sbd-start container" aria-labelledby="sbd-start-title">
      <div className="sbd-section-heading"><div><p className="sbd-kicker">A practical place to begin</p><h2 id="sbd-start-title">Start building<br/><span>your network.</span></h2></div><p>Two learning paths, one network: build it course by course, then prepare the same network for authorization.</p></div>
      <div className="sbd-start-grid">
        <article className="sbd-start-first"><p className="sbd-kicker">Start here · Course 1.1 · Build the Network</p><h3>Build the identity foundation</h3><p>Configure Active Directory and DNS on Windows Server 2025. Follow the interactive guide and record your work in the companion workbook.</p><small>Written training available · Video in production</small><a className="sbd-inline-link" href="/training/dc01-dc02/index.html">Start the first course <ArrowRight size={18}/></a></article>
        <div className="sbd-start-next"><p className="sbd-kicker">Then keep building, in order</p><a href="/training/dns-configuration"><span><strong>1.2 · Configure DNS</strong><small>Build the Network · Name resolution</small></span><ArrowUpRight size={18}/></a><a href="/training/two-tier-pki"><span><strong>1.3 · Configure a Root CA &amp; issuing CA</strong><small>Build the Network · Two-tier PKI</small></span><ArrowUpRight size={18}/></a><a href="/training/rmf/index.html"><span><strong>Path 2 · Prepare the network for authorization</strong><small>Network Authorization · Risk Management Framework, Body of Evidence &amp; Authorization to Operate</small></span><ArrowUpRight size={18}/></a></div>
      </div><a className="sbd-inline-link sbd-start-catalog" href="/training">Explore all training <ArrowRight size={17}/></a>
    </section>
    <aside className="sbd-creator-note container" aria-labelledby="sbd-creator-title"><div className="sbd-creator-card"><span className="sbd-creator-initials" aria-hidden="true">SBD</span><div><h2 id="sbd-creator-title">A note from Secure By Design</h2><p>{membershipCatalog.creatorNote}</p><span className="sbd-creator-signature">Secure By Design</span></div></div></aside>
    <section className="sbd-future container" id="start-reading" aria-labelledby="sbd-future-title"><div><p className="sbd-kicker">Learn your way</p><h2 id="sbd-future-title">More ways<br/>to <span>figure it out.</span></h2><p>Read the training, watch the builds take shape, and keep building your understanding.</p></div><div className="sbd-future-list">
      <a href="/training"><BookOpen size={30} strokeWidth={1.2}/><div><h3>Training Library</h3><p>Interactive guides, workbooks, and templates for building a network and preparing it for authorization.</p></div><ArrowUpRight size={18}/></a>
      <a href="/inside-the-network"><Network size={30} strokeWidth={1.2}/><div><h3>Inside the Network</h3><p>Explore the complete training network in 3D and see how every course connects to the same build.</p></div><ArrowUpRight size={18}/></a>
    </div></section>
    <section className="sbd-future container" id="community" aria-labelledby="sbd-memberships-title"><div><p className="sbd-kicker">Learn it. Share it. Pay it forward.</p><h2 id="sbd-memberships-title">Choose your<br/><span>next step.</span></h2><p>Create an account to keep your progress and saved materials. Builder and Guided memberships are coming soon for deeper project work and personal guidance.</p></div><div className="sbd-future-list"><a href="/my-progress"><Users size={30} strokeWidth={1.2}/><div><h3>My Account</h3><p>Continue learning, find your saved materials, and manage your account.</p></div><ArrowUpRight size={18}/></a></div></section>
    <section className="sbd-about" id="about" aria-labelledby="sbd-about-title"><div className="container"><div><p className="sbd-kicker">Built for curious minds</p><h2 id="sbd-about-title">There’s always<br/>more to understand.</h2></div><div><p>Secure By Design connects the dots between technology and compliance, with room to ask questions, share knowledge, and put ideas into practice.</p><p>Whether you’ve been in the field for years or you’re just getting curious, you’re welcome here.</p><a className="sbd-inline-link" href="/training">Let’s get into it <ArrowRight size={17}/></a></div></div></section>
  </main>;
}
