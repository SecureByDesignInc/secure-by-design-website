// A link that carries a logo (owner direction, 20 October 2026): any statement tied to a platform or service with a
// logo tile (Book a call, Discord, LinkedIn, YouTube, TikTok, Instagram) shows that tile in the same pill as the
// header's Follow along row, with no underline. Tiles live at public/social/<tile>-<size>.png.
import type { ReactNode } from 'react';
import { BOOKING_TILE_SIZES } from '../lib/booking.mjs';

export type LogoTile = 'book-a-call' | 'discord' | 'linkedin' | 'youtube' | 'tiktok' | 'instagram';

const tileBase = (tile: LogoTile) => `/social/${tile}-sbd`;
const tileSet = (tile: LogoTile) => BOOKING_TILE_SIZES.map(size => `${tileBase(tile)}-${size}.png ${size}w`).join(', ');

export default function LogoLink({ tile, href, children, className, external = true, ...rest }: {
  tile: LogoTile;
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  [attribute: `data-${string}`]: string | undefined;
}) {
  return (
    <a className={className ? `logo-pill ${className}` : 'logo-pill'} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      <img className="logo-pill-icon" src={`${tileBase(tile)}-44.png`} srcSet={tileSet(tile)} sizes="22px" width={22} height={22} alt="" decoding="async" />
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
