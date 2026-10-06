'use client';
// Adapted from the purchased StackedTabs: retain its spring-selected pill and
// stacked panel treatment, adding stable reading order and keyboard semantics.
import { useId, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
type Tab = { title: string; value: string; content: ReactNode };
export function StackedTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  return <div className="sbd-stacked-tabs">
    <div className="sbd-tabs" role="tablist" aria-label="Reading paths" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      {tabs.map((tab, index) => <button type="button" key={tab.value} id={`${id}-tab-${index}`} role="tab" aria-selected={active === index} aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1} ref={node => { refs.current[index] = node; }} onClick={() => setActive(index)} onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
        if (next !== null) { event.preventDefault(); setActive(next); refs.current[next]?.focus(); }
      }}>
        {active === index && <motion.span className="sbd-tab-highlight" layoutId={`${id}-selected`} transition={reduced ? {duration: 0} : {type: 'spring', bounce: .2, duration: .5}} />}
        <span>{tab.title}</span>
      </button>)}
    </div>
    <div className="sbd-tab-stack">
      <motion.div className="sbd-tab-back" aria-hidden="true" animate={{ y: hovering && !reduced ? -14 : -7, scale: .96 }} />
      {tabs.map((tab, index) => <div key={tab.value} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={active !== index}>
        {active === index && <motion.div key={tab.value} initial={reduced ? false : {opacity: .7, y: 12}} animate={{opacity: 1, y: 0}} transition={{duration: reduced ? 0 : .3}}>{tab.content}</motion.div>}
      </div>)}
    </div>
  </div>;
}
