'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Users, Terminal, MessageSquare } from 'lucide-react';
import { GradientButton } from '../components/saleshook/gradient-button';
import { CardStack } from '../components/saleshook/card-stack';
import { ScrollReveal } from '../components/saleshook/scroll-reveal';
import membershipCatalog from '../content/membership-plans.json';

// Load the decorative WebGL layer after the usable page has hydrated.
const HeroShaderGradient = lazy(() => import('../components/saleshook/HeroShaderGradient').then(module => ({default: module.HeroShaderGradient})));

const community = [
  {id: 'goals', title: 'Career Goals & Support', description: 'Share your career goals and the help you need. Create a worksheet and use it to start a conversation.', href: '/careers#goals', ctaLabel: 'Explore your career goals', icon: MessageSquare, tag: 'Your next step'},
  {id: 'resources', title: 'Cybersecurity Resources', description: 'Discover guides, tools, and learning material selected for their practical value, with context to help you use them.', href: '/careers#resources', ctaLabel: 'Find useful resources', icon: BookOpen, tag: 'Keep learning'},
  {id: 'contribute', title: 'Share What You Know', description: 'Found something helpful or have an experience worth sharing? Bring a resource, an article idea, or a lesson from your work.', href: '/careers#contribute', ctaLabel: 'Share what you know', icon: Users, tag: 'Bring your experience'},
];
export default function TemplateHome() {
  const [communityIndex,setCommunityIndex] = useState(0);
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
      <div className="sbd-hero-actions"><GradientButton asChild><a href="/videos">Find your starting point <ArrowRight size={18}/></a></GradientButton><a className="sbd-secondary-button" href="#community"><Users size={18}/> Be part of the community</a></div>
      <small>For the first question. The next challenge. And everything in between.</small>
    </div></section>
    <section className="sbd-start container" aria-labelledby="sbd-start-title">
      <div className="sbd-section-heading"><div><p className="sbd-kicker">A practical place to begin</p><h2 id="sbd-start-title">Start building<br/><span>your network.</span></h2></div><p>Build the foundations, establish trust, and learn how to prepare the same network for authorization.</p></div>
      <div className="sbd-start-grid">
        <article className="sbd-start-first"><p className="sbd-kicker">Start here · Build the Network</p><h3>Build the identity foundation</h3><p>Configure Active Directory and DNS on Windows Server 2025. Follow the interactive guide and record your work in the companion workbook.</p><small>Written training available · Video coming soon</small><a className="sbd-inline-link" href="/training/dc01-dc02/index.html">Start the first course <ArrowRight size={18}/></a></article>
        <div className="sbd-start-next"><p className="sbd-kicker">Keep building</p><a href="/training/dns-configuration"><span><strong>Configure DNS</strong><small>Build the Network · Name resolution</small></span><ArrowUpRight size={18}/></a><a href="/training/two-tier-pki"><span><strong>Configure a Root CA &amp; issuing CA</strong><small>Build the Network · Two-tier PKI</small></span><ArrowUpRight size={18}/></a><a href="/training/rmf/index.html"><span><strong>Prepare the network for authorization</strong><small>Network Authorization · Risk Management Framework, Body of Evidence &amp; Authorization to Operate</small></span><ArrowUpRight size={18}/></a></div>
      </div><a className="sbd-inline-link sbd-start-catalog" href="/videos">Explore all training <ArrowRight size={17}/></a>
    </section>
    <aside className="sbd-creator-note container" aria-labelledby="sbd-creator-title"><div className="sbd-creator-card"><span className="sbd-creator-initials" aria-hidden="true">SBD</span><div><h2 id="sbd-creator-title">A note from Secure By Design</h2><p>{membershipCatalog.creatorNote}</p><span className="sbd-creator-signature">Secure By Design</span></div></div></aside>
    <section className="sbd-community" id="community" aria-labelledby="sbd-community-title"><div className="container"><ScrollReveal><div className="sbd-section-heading"><div><p className="sbd-kicker">Better with a community</p><h2 id="sbd-community-title">Bring more than<br/><span>your questions.</span></h2></div><p>Your goals. Your experience.<br/>The resource you wish you’d found sooner.</p></div></ScrollReveal>
      <p className="sbd-card-hint">Choose a card, or use the arrow keys to explore.</p>
      <CardStack items={community} cardWidth={330} cardHeight={350} maxVisible={3} spreadDeg={10} overlap={.06} tiltXDeg={2} activeScale={1} inactiveScale={.94} activeLiftPx={10} onChangeIndex={index=>setCommunityIndex(index)} className="sbd-community-stack" renderCard={(item,{active}) => { const Icon = item.icon; return <article className="sbd-community-card" aria-hidden={!active}><div className="sbd-community-icon"><Icon size={29} strokeWidth={1.3}/><span>{item.tag}</span></div><h3>{item.title}</h3><p>{item.description}</p><a href={item.href} tabIndex={active?0:-1} onClick={event=>event.stopPropagation()}>{item.ctaLabel}<ArrowUpRight size={18}/></a></article>; }}/>
      <p className="sbd-card-status" aria-live="polite">{communityIndex+1} / 3 · {community[communityIndex].title}</p>
      <div className="sbd-mobile-community">{community.map(item=>{const Icon=item.icon;return <a key={item.id} href={item.href}><Icon size={22}/><span>{item.title}</span><ArrowUpRight size={16}/></a>;})}</div>
    </div></section>
    <section className="sbd-future container" id="start-reading" aria-labelledby="sbd-future-title"><div><p className="sbd-kicker">Learn your way</p><h2 id="sbd-future-title">More ways<br/>to <span>figure it out.</span></h2><p>Choose a path, put the ideas into practice, and keep building your understanding.</p></div><div className="sbd-future-list">
      <a href="/cyber-range"><Terminal size={30} strokeWidth={1.2}/><div><h3>Learning Path <small>Pilot live</small></h3><p>Choose a starting point, follow a recommended route, and explore the invitation-only Linux lab.</p></div><ArrowUpRight size={18}/></a>
      <a href="/videos"><BookOpen size={30} strokeWidth={1.2}/><div><h3>Training Library</h3><p>Interactive guides, workbooks, and templates for building a network and preparing it for authorization.</p></div></a>
    </div></section>
    <section className="sbd-future container" aria-labelledby="sbd-memberships-title"><div><p className="sbd-kicker">Learn it. Share it. Pay it forward.</p><h2 id="sbd-memberships-title">Choose your<br/><span>next step.</span></h2><p>Start with Community. Builder and Guided memberships are coming soon for deeper project work and personal guidance.</p></div><div className="sbd-future-list"><a href="/my-progress"><BookOpen size={30} strokeWidth={1.2}/><div><h3>My Account</h3><p>Continue learning, find your saved materials, and manage your account and Community membership.</p></div></a></div></section>
    <section className="sbd-about" id="about" aria-labelledby="sbd-about-title"><div className="container"><div><p className="sbd-kicker">Built for curious minds</p><h2 id="sbd-about-title">There’s always<br/>more to understand.</h2></div><div><p>Secure By Design connects the dots between technology and compliance, with room to ask questions, share knowledge, and put ideas into practice.</p><p>Whether you’ve been in the field for years or you’re just getting curious, you’re welcome here.</p><a className="sbd-inline-link" href="/videos">Let’s get into it <ArrowRight size={17}/></a></div></div></section>
  </main>;
}
