'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const mapUrl = 'https://livethreatmap.radware.com/';
// Radware's dashboard shows its full detail (attack types, top attackers and attacked countries, attack vectors,
// application violations, scanned ports) only at desktop size. It is drawn at the size of the Threat Map page's
// own view and scaled to the monitor, which spans the section, so on a computer it appears at about full size.
const SCREEN_W = 1240;
const SCREEN_H = 800;

type ConnectionInfo = EventTarget & { saveData?: boolean };

// A security operations monitor on the homepage. It stays dark until a visitor scrolls near it, then powers
// on and shows Radware's live threat map. The map isn't interactive here: the whole screen links to the full
// Threat Map page, so scrolling the homepage never gets caught inside the frame. Phones, reduced motion and
// Save-Data keep a still screen that links to the same page and never load Radware.
export default function HomeThreatWindow() {
  const section = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'wait' | 'live' | 'still'>('wait');
  const [near, setNear] = useState(false);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(0);

  // Decide once the page runs: live monitor on larger screens, still screen otherwise.
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 700px)');
    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    const update = () => setMode(motion.matches || phone.matches || connection?.saveData ? 'still' : 'live');
    update();
    motion.addEventListener('change', update);
    phone.addEventListener('change', update);
    return () => {
      motion.removeEventListener('change', update);
      phone.removeEventListener('change', update);
    };
  }, []);

  // Load the map when the monitor is about to scroll into view; power on once it is visible.
  useEffect(() => {
    if (mode !== 'live' || !section.current) return;
    const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: '600px 0px' });
    const power = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setOn(true); }, { threshold: 0.35 });
    preload.observe(section.current);
    power.observe(section.current);
    return () => { preload.disconnect(); power.disconnect(); };
  }, [mode]);

  // Scale the desktop-sized map to the monitor's width.
  useEffect(() => {
    if (mode !== 'live' || !screen.current) return;
    const element = screen.current;
    const fit = () => setScale(element.clientWidth / SCREEN_W);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);

  const live = mode === 'live';
  return <section ref={section} className="sbd-watch container" aria-labelledby="sbd-watch-title">
    <div className="sbd-watch-copy">
      <div>
        <p className="sbd-kicker">Live threat window</p>
        <h2 id="sbd-watch-title">Right now, somewhere,<br/><span>a network is under attack.</span></h2>
      </div>
      <div>
      <p>This is Radware’s live view of attacks recorded around the world. Every arc is a reminder of why you build it right: hardened, patched, logged, and segmented.</p>
      <div className="sbd-watch-actions">
        <a className="sbd-inline-link" href="/threat-map">Open the full Threat Map <ArrowRight size={17}/></a>
        <a className="sbd-inline-link" href="/training">Learn the defenses <ArrowRight size={17}/></a>
      </div>
      </div>
    </div>

    <figure className={`sbd-monitor${live && on ? ' is-on' : ''}${mode === 'still' ? ' is-still' : ''}`}>
      <div className="sbd-monitor-bezel">
        <div className="sbd-monitor-bar">
          <span className="sbd-monitor-live"><span aria-hidden="true"/>Live feed</span>
          <span>Radware</span>
        </div>
        <div ref={screen} className="sbd-monitor-screen">
          <div className="sbd-monitor-idle" aria-hidden="true">
            <span className="sbd-monitor-arc a"/><span className="sbd-monitor-arc b"/><span className="sbd-monitor-arc c"/>
          </div>
          {live && near && scale > 0 && <iframe
            className={ready ? 'is-ready' : undefined}
            src={mapUrl}
            title="Radware live cyber threat map (preview)"
            tabIndex={-1}
            aria-hidden="true"
            inert
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
            width={SCREEN_W}
            height={SCREEN_H}
            style={{ transform: `scale(${scale})` }}
            onLoad={() => setReady(true)}
          />}
          <span className="sbd-monitor-scan" aria-hidden="true"/>
          <span className="sbd-monitor-corners" aria-hidden="true"/>
          <a className="sbd-monitor-link" href="/threat-map">
            <span>{live ? 'Explore the full live map' : 'Watch live attacks'}<ArrowUpRight size={16}/></span>
          </a>
        </div>
      </div>
      <div className="sbd-monitor-stand" aria-hidden="true"/>
      <figcaption>Live map provided by Radware. Secure By Design is not affiliated with Radware.</figcaption>
    </figure>
  </section>;
}
