'use client';

import { useEffect, useRef, useState } from 'react';

export default function NetworkExplorer() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>();
  const post = (message: object) => frame.current?.contentWindow?.postMessage(message, window.location.origin);
  const requestHeight = () => post({ type: 'sbd-network-request-height' });
  // Shareable links such as /inside-the-network#process=web&step=2 open that view inside the model.
  const openFromHash = () => { const hash = window.location.hash.slice(1); if (hash) post({ type: 'sbd-network-open', hash }); };
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === 'sbd-network-height' && Number.isFinite(data.height)) setFrameHeight(Math.max(900, Math.min(12000, data.height)));
      // The model announces when it is ready, so a link still opens if the frame loaded before hydration.
      if (data?.type === 'sbd-network-ready') { requestHeight(); openFromHash(); }
      if (data?.type === 'sbd-network-state' && typeof data.hash === 'string' && /^[\w=&%.()-]*$/.test(data.hash)) {
        const next = data.hash ? `#${data.hash}` : '';
        if (window.location.hash !== next) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${next}`);
      }
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('hashchange', openFromHash);
    requestHeight();
    if (frame.current?.contentDocument?.readyState === 'complete') openFromHash();
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, []);

  return <>
    <iframe
      ref={frame}
      className="inside-network-frame"
      src="/inside-network-model/model.html"
      title="Inside the Network — interactive 3D security architecture"
      style={frameHeight ? { height: frameHeight } : undefined}
      onLoad={() => { requestHeight(); openFromHash(); }}
      allowFullScreen
    />
    <noscript><p className="network-fallback">This interactive model needs JavaScript. <a href="/inside-network-model/model.html">Open Inside the Network</a>.</p></noscript>
  </>;
}
