'use client';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

const threatMapUrl = 'https://livethreatmap.radware.com/';

// Radware's map loads as soon as the page opens. The frame is added once the page is running in the browser
// (so its load event is never missed during hydration) and fades in over our own placeholder when Radware's
// page has loaded. The direct link stays visible in case the frame can't load.
export default function ThreatMapFrame() {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const sync = () => setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(timer);
  }, [ready]);

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
      <span className="tm-live"><span aria-hidden="true" />Live · Radware</span>
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
      {mounted && <iframe
        className={ready ? 'is-ready' : undefined}
        src={threatMapUrl}
        title="Radware live cyber threat map"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin"
        allow="fullscreen"
        onLoad={() => setReady(true)}
      />}
    </div>
  </div>;
}
