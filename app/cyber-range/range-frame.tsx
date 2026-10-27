'use client';

import { useEffect, useRef, useState } from 'react';

// Hosts public/range-app/ at its natural height, the way the System Hub hosts its model; the app posts its height
// after every render. A #view hash on this page (for example /cyber-range#decks) opens that view in the Range.
export default function RangeFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>();
  const [src, setSrc] = useState('/range-app/');
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (/^[a-z]+$/.test(hash)) setSrc('/range-app/#' + hash);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === 'sbd-range-height' && Number.isFinite(data.height)) setFrameHeight(Math.max(700, Math.min(12000, data.height)));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return <>
    <iframe
      ref={frame}
      className="cyber-range-frame"
      src={src}
      title="Cyber Range — checkpoints, sparring, runs and decks"
      style={frameHeight ? { height: frameHeight } : undefined}
      allowFullScreen
    />
    <noscript><p className="cyber-range-fallback">The Cyber Range needs JavaScript. <a href="/range-app/">Open the Range</a>.</p></noscript>
  </>;
}
