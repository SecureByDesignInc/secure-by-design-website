'use client';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, Play } from 'lucide-react';

const threatMapUrl = 'https://livethreatmap.radware.com/';

// Nothing loads from Radware until the visitor chooses to: the map is a heavy animation and its page
// carries Radware's own analytics and cookies. The direct link stays visible in case the frame can't load.
export default function ThreatMapFrame() {
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

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
        {loaded && <button type="button" className="tm-tool" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
          {fullscreen ? 'Exit full screen' : 'Full screen'}
        </button>}
        <a className="tm-tool" href={threatMapUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={15} aria-hidden="true" />Open on Radware<span className="tm-sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
    <div ref={stage} className="tm-stage">
      {loaded
        ? <iframe
            src={threatMapUrl}
            title="Radware live cyber threat map"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
            allow="fullscreen"
          />
        : <div className="tm-poster">
            <div className="tm-poster-art" aria-hidden="true">
              <span className="tm-arc tm-arc-a" /><span className="tm-arc tm-arc-b" /><span className="tm-arc tm-arc-c" />
            </div>
            <div className="tm-poster-copy">
              <button type="button" className="tm-load" onClick={() => setLoaded(true)}>
                <Play size={17} aria-hidden="true" />Load the live map
              </button>
              <p>The map loads from Radware’s website, which uses its own analytics and cookies. It is a busy animation, so it works best on a larger screen.</p>
            </div>
          </div>}
    </div>
  </div>;
}
