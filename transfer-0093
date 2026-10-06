"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export type CardStackItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc?: string;
  /** Fires when this card is already the active/front card and gets clicked again
   * (e.g. open a signup modal) — distinct from the click that just brings a card to front. */
  onSelect?: () => void;
  ctaLabel?: string;
  tag?: string;
};

export type CardStackProps<T extends CardStackItem> = {
  items: T[];
  initialIndex?: number;
  /** How many cards are visible around the active (odd recommended) */
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  /** How much cards overlap each other (0..0.8). Higher = more overlap */
  overlap?: number;
  /** Total fan angle (deg). Higher = wider arc */
  spreadDeg?: number;
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;
  springStiffness?: number;
  springDamping?: number;
  loop?: boolean;
  showDots?: boolean;
  className?: string;
  onChangeIndex?: (index: number, item: T) => void;
  renderCard?: (item: T, state: { active: boolean }) => React.ReactNode;
};

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

/** Minimal signed offset from active index to i, with wrapping (for loop behavior). */
function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack<T extends CardStackItem>({
  items,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 340,
  cardHeight = 425,
  overlap = 0.48,
  spreadDeg = 34,
  perspectivePx = 1100,
  depthPx = 140,
  tiltXDeg = 10,
  activeLiftPx = 18,
  activeScale = 1.04,
  inactiveScale = 0.92,
  springStiffness = 280,
  springDamping = 28,
  loop = true,
  showDots = true,
  className,
  onChangeIndex,
  renderCard,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len));

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const prev = React.useCallback(() => {
    if (!len) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [len]);
  const next = React.useCallback(() => {
    if (!len) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [len]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  // A drag-release still fires a native click on the same element right after — without this,
  // swiping the front card to browse would also immediately trigger its onSelect (e.g. opening
  // the signup modal) on every swipe. Track whether the pointer actually moved so the click
  // handler can tell a deliberate tap from a swipe-drag and only select on the former.
  const draggedRef = React.useRef(false);

  if (!len) return null;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative w-full"
        style={{ height: Math.max(380, cardHeight + 80) }}
        tabIndex={0}
        role="region"
        aria-label="Community cards. Use left and right arrow keys to browse."
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;
              if (!visible) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 10;
              const z = -abs * depthPx;
              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              const dragProps = isActive
                ? {
                    drag: "x" as const,
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.18,
                    onDragStart: () => {
                      draggedRef.current = false;
                    },
                    onDrag: (_e: unknown, info: { offset: { x: number } }) => {
                      if (Math.abs(info.offset.x) > 4) draggedRef.current = true;
                    },
                    onDragEnd: (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
                      const travel = info.offset.x;
                      const v = info.velocity.x;
                      const threshold = Math.min(160, cardWidth * 0.22);
                      if (travel > threshold || v > 650) prev();
                      else if (travel < -threshold || v < -650) next();
                    },
                  }
                : {};

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    "absolute bottom-0 rounded-2xl overflow-hidden will-change-transform select-none",
                    isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  )}
                  style={{ width: cardWidth, height: cardHeight, zIndex, transformStyle: "preserve-3d" }}
                  initial={reduceMotion ? false : { opacity: 0, y: y + 40, x, rotateZ, rotateX, scale }}
                  animate={{ opacity: 1, x, y: y + lift, rotateZ, rotateX, scale }}
                  transition={reduceMotion ? {duration: 0} : { type: "spring", stiffness: springStiffness, damping: springDamping }}
                  onClick={() => {
                    if (isActive) {
                      if (!draggedRef.current) item.onSelect?.();
                      draggedRef.current = false;
                    } else {
                      setActive(i);
                    }
                  }}
                  {...dragProps}
                >
                  <div className="h-full w-full" style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}>
                    {renderCard ? renderCard(item, { active: isActive }) : <DefaultFanCard item={item} active={isActive} />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {showDots ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button type="button" className="sbd-stack-arrow" onClick={prev} aria-label="Previous community card">←</button>
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setActive(idx)}
              type="button"
              className="sbd-stack-dot"
              aria-pressed={idx === active}
              aria-label={`${it.title}`}
            />
          ))}
          <button type="button" className="sbd-stack-arrow" onClick={next} aria-label="Next community card">→</button>
        </div>
      ) : null}
    </div>
  );
}

function DefaultFanCard({ item }: { item: CardStackItem; active: boolean }) {
  return (
    <div className="relative h-full w-full bg-black">
      <div className="absolute inset-0">
        {item.imageSrc ? (
          <img src={item.imageSrc} alt={item.title} className="h-full w-full object-cover" draggable={false} loading="eager" />
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <div className="truncate text-lg font-semibold text-white">{item.title}</div>
        {item.description ? <div className="mt-1 line-clamp-2 text-sm text-white/80">{item.description}</div> : null}
      </div>
    </div>
  );
}
