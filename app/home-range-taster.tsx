'use client';

import { useEffect, useRef } from 'react';
import { mountRange } from './cyber-range/range-core.js';

// The Cyber Range's one-round taster, on the homepage right after the hero (owner's request, 31 October 2026): the
// visitor's random operator against a resident, one question on the same clock, then "Play the full battle". It runs
// the Range's own core (app/cyber-range/range-core.js) in taster mode, so it stays in step with the Range.
export default function HomeRangeTaster() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    return mountRange(root.current, { taster: true });
  }, []);
  return <div id="try-the-range" ref={root} className="cr-page home-range" role="region" aria-label="Try one round of the Cyber Range"><div className="cr-container"><p className="cr-note" style={{ padding: '24px 0' }}>Loading a round…</p></div></div>;
}
