'use client';

import { useEffect, useRef, useState } from 'react';

export default function NetworkExplorer() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>();
  const requestHeight = () => frame.current?.contentWindow?.postMessage({ type: 'sbd-network-request-height' }, window.location.origin);
  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type !== 'sbd-network-height' || !Number.isFinite(data.height)) return;
      setFrameHeight(Math.max(900, Math.min(12000, data.height)));
    };
    window.addEventListener('message', resize);
    requestHeight();
    return () => window.removeEventListener('message', resize);
  }, []);

  return <>
    <iframe
      ref={frame}
      className="inside-network-frame"
      src="/inside-network-model/model.html"
      title="Inside the Network — interactive 3D security architecture"
      style={frameHeight ? { height: frameHeight } : undefined}
      onLoad={requestHeight}
      allowFullScreen
    />
    <noscript><p className="network-fallback">This interactive model needs JavaScript. <a href="/inside-network-model/model.html">Open Inside the Network</a>.</p></noscript>
  </>;
}
