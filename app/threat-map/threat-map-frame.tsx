'use client';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import RadwareSalesCover, { RADWARE_H, RADWARE_VISIBLE_H, RADWARE_VISIBLE_H_TOUCH, RADWARE_W, TOUCH_QUERY } from '../radware-sales-cover';

const threatMapUrl = 'https://livethreatmap.radware.com/';

// Radware's map loads as its section nears the screen. The frame is added once the page is running in the
// browser (so its load event is never missed during hydration) and fades in over our own placeholder when Radware's
// page has loaded. The direct link stays visible in case the frame can't load. The map is drawn at a fixed
// 1240 × 800 and scaled to fit, so Radware always shows the same layout and the blur over its "Contact
// sales" button lands in the right place on any screen (and in full screen). Only the top RADWARE_VISIBLE_H
// pixels are shown (RADWARE_VISIBLE_H_TOUCH on phones and tablets, where the notice is taller), which keeps
// Radware's cookie notice at the bottom of its page out of sight.
export default function ThreatMapFrame() {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 0, x: 0, y: 0 });
  const [visibleH, setVisibleH] = useState(RADWARE_VISIBLE_H);

  // Touch screens show less of the map, because Radware's cookie notice is taller there. This effect comes
  // before the one that adds the frame, so the frame is never shown with the desktop cut-off on a phone.
  useEffect(() => {
    const touch = window.matchMedia?.(TOUCH_QUERY);
    if (!touch) return;
    const sync = () => setVisibleH(touch.matches ? RADWARE_VISIBLE_H_TOUCH : RADWARE_VISIBLE_H);
    sync();
    touch.addEventListener?.('change', sync);
    return () => touch.removeEventListener?.('change', sync);
  }, []);

  // Add Radware's frame as the map comes near the screen (on the homepage it sits just below the hero), so
  // nothing loads from Radware during hydration or for visitors who never reach it.
  useEffect(() => {
    const element = stage.current;
    if (!element || typeof IntersectionObserver !== 'function') { setMounted(true); return; }
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setMounted(true); near.disconnect(); }
    }, { rootMargin: '600px 0px' });
    near.observe(element);
    return () => near.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  // Scale the visible part of the 1240 × 800 map to fit the stage, centered.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth, height = element.clientHeight;
      const scale = Math.min(width / RADWARE_W, height / visibleH);
      setFit({ scale, x: (width - RADWARE_W * scale) / 2, y: (height - visibleH * scale) / 2 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [visibleH]);

  useEffect(() => {
    if (ready || !mounted) return;
    const timer = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(timer);
  }, [ready, mounted]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      // Some browsers (iPhone Safari) don't allow it for a page element; the direct link still works.
    }
  };

  return <div className="tm-frame">
    <div className="tm-toolbar">
      <div className="tm-source">
        <span className="tm-live"><span aria-hidden="true" />Live · Radware</span>
        <p className="tm-credit">The live map is provided by Radware. Secure By Design is not affiliated with Radware.</p>
      </div>
      <div>
        <button type="button" className="tm-tool" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
          {fullscreen ? 'Exit full screen' : 'Full screen'}
        </button>
        <a className="tm-tool" href={threatMapUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={15} aria-hidden="true" />Open on Radware<span className="tm-sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
    <div ref={stage} className="tm-stage" aria-busy={!ready}>
      <div className="tm-poster" aria-hidden={ready}>
        <div className="tm-poster-art" aria-hidden="true">
          <span className="tm-arc tm-arc-a" /><span className="tm-arc tm-arc-b" /><span className="tm-arc tm-arc-c" />
        </div>
        <div className="tm-poster-copy" role="status">
          <span className="tm-spinner" aria-hidden="true" />
          <p className="tm-loading">Loading the live map…</p>
          {slow && <p>Taking a while? <a href={threatMapUrl} target="_blank" rel="noopener noreferrer">Open it on Radware</a>.</p>}
        </div>
      </div>
      <div className="tm-canvas" style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`, clipPath: `inset(0 0 ${RADWARE_H - visibleH}px 0)` }}>
        {mounted && <iframe
          className={ready ? 'is-ready' : undefined}
          src={threatMapUrl}
          title="Radware live cyber threat map"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin"
          allow="fullscreen"
          onLoad={() => setReady(true)}
        />}
        {mounted && <RadwareSalesCover show={ready} />}
      </div>
    </div>
  </div>;
}
