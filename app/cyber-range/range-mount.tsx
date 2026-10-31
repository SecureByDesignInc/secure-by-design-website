'use client';

import { useEffect, useRef } from 'react';
import { mountRange } from './range-core.js';

// Mounts the Range's battle (range-core.js) under the page's own intro, in the site shell, with no frame: the page is
// as tall as its content and the layout answers the viewport like every other hub.
export default function RangeMount() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    return mountRange(root.current);
  }, []);
  return <div ref={root} className="cr-page" aria-label="Cyber Range"><div className="cr-container"><p className="cr-note" style={{ padding: '24px 0' }}>Loading the Range…</p></div></div>;
}
