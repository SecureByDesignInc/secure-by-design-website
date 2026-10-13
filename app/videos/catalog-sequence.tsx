'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

// The courses in a learning path are taken in order. This grid draws an arrow
// between each pair of consecutive tiles: across the column gap when the next
// course sits beside, down the row gap when it sits below, and a dashed return
// path when the row wraps. Positions are measured, so the arrows follow every
// column count, an expanded tile, and search results.

type Connector =
  | { kind: 'right' | 'down'; x: number; y: number }
  | { kind: 'wrap'; x: number; y: number; path: string };

const BADGE = 11;

function measure(grid: HTMLElement): Connector[] {
  const tiles = [...grid.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.classList.contains('vc-catalog-tile'),
  );
  if (tiles.length < 2) return [];
  const origin = grid.getBoundingClientRect();
  const rowGap = parseFloat(getComputedStyle(grid).rowGap) || 18;
  const boxes = tiles.map((tile) => {
    const r = tile.getBoundingClientRect();
    return {
      left: r.left - origin.left,
      right: r.right - origin.left,
      top: r.top - origin.top,
      bottom: r.bottom - origin.top,
      height: r.height,
    };
  });
  const connectors: Connector[] = [];
  for (let i = 0; i < boxes.length - 1; i += 1) {
    const a = boxes[i];
    const b = boxes[i + 1];
    if (Math.abs(a.top - b.top) < 2 && b.left > a.right) {
      connectors.push({
        kind: 'right',
        x: (a.right + b.left) / 2,
        y: a.top + Math.min(a.height, b.height) / 2,
      });
      continue;
    }
    const y = b.top - rowGap / 2;
    const overlapLeft = Math.max(a.left, b.left);
    const overlapRight = Math.min(a.right, b.right);
    if (overlapRight - overlapLeft > BADGE * 2) {
      connectors.push({ kind: 'down', x: (overlapLeft + overlapRight) / 2, y });
      continue;
    }
    const startX = (a.left + a.right) / 2;
    const endX = (b.left + b.right) / 2;
    const turn = endX < startX ? BADGE : -BADGE;
    connectors.push({
      kind: 'wrap',
      x: endX,
      y,
      path: `M ${startX} ${a.bottom + 4} V ${y} H ${endX + turn}`,
    });
  }
  return connectors;
}

function same(a: Connector[], b: Connector[]) {
  return (
    a.length === b.length &&
    a.every((item, i) => {
      const other = b[i];
      return (
        item.kind === other.kind &&
        Math.abs(item.x - other.x) < 0.5 &&
        Math.abs(item.y - other.y) < 0.5 &&
        (item.kind !== 'wrap' || (other.kind === 'wrap' && item.path === other.path))
      );
    })
  );
}

function Chevron({ kind }: { kind: Connector['kind'] }) {
  // Drawn around (0, 0); "right" points across, the others point down.
  return kind === 'right' ? (
    <path d="M -2.5 -5 L 2.5 0 L -2.5 5" />
  ) : (
    <path d="M -5 -2.5 L 0 2.5 L 5 -2.5" />
  );
}

export default function CatalogSequenceGrid({ children }: { children: ReactNode }) {
  const grid = useRef<HTMLDivElement>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure(element);
        setConnectors((current) => (same(current, next) ? current : next));
      });
    };
    const resize = new ResizeObserver(update);
    const observeTiles = () => {
      resize.disconnect();
      resize.observe(element);
      for (const child of element.children) resize.observe(child);
      update();
    };
    const mutations = new MutationObserver(observeTiles);
    mutations.observe(element, { childList: true });
    observeTiles();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
    };
  }, []);

  return (
    <div ref={grid} className="vc-catalog-grid vc-sequence-grid">
      {children}
      {connectors.length > 0 && (
        <svg className="vc-sequence-arrows" aria-hidden="true" focusable="false">
          {connectors.map((item, i) => (
            <g key={i} data-kind={item.kind}>
              {item.kind === 'wrap' && <path className="vc-sequence-path" d={item.path} />}
              <g transform={`translate(${item.x} ${item.y})`}>
                <circle className="vc-sequence-badge" r={BADGE} />
                <g className="vc-sequence-chevron">
                  <Chevron kind={item.kind} />
                </g>
              </g>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
