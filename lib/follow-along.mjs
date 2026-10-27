// The "Follow along" row: one logo pill per channel (YouTube, TikTok, Instagram, LinkedIn, Discord), then
// the "Book a call" pill from content/booking.json (shown only while that address is a valid Google booking
// page). The React layout (app/layout.tsx) and the generated Community shells (scripts/prepare-career-shell.mjs)
// both render this markup so the two never drift apart.
//
// Owner direction, 26 October 2026: the row moved from the site header to the site footer, beside App
// availability. It now uses the site-wide logo pill (`.logo-pill`, the same markup as app/logo-link.tsx and
// renderBookingLink), with the platform name always visible. The footer's Book a call is this row's last pill,
// so the footer lists it once. Every pill carries data-placement, which the analytics script records with
// channel_click (social) and booking_click (Book a call).
//
// Icons (18 October 2026): public/social/<id>-sbd-<size>.png hold just the logo cut from the owner's unlabeled
// 1024px icon files, with the dark frame around it cropped away, so the logo sits directly on the pill's
// gradient. The 22, 44, 66 and 88px files are exact 1x–4x renders of the pill's 22px icon slot; every logo pill
// on the site (app/logo-link.tsx, renderBookingLink) offers the same set.
import { bookingTile, renderBookingLink } from './booking.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Widths of the tile files in public/social. */
export const TILE_SIZES = [22, 40, 44, 60, 66, 88];
const tileSet = (base) => TILE_SIZES.map(size => `${base}-${size}.png ${size}w`).join(', ');

/** Base path of a platform's tile files (`<base>-<size>.png`); every platform in content/videos.json has a set. */
export const platformTile = platform => `/social/${platform.id}-sbd`;

export { bookingTile };

/** A logo pill for a channel: the same markup as app/logo-link.tsx, opening in a new tab. */
export const renderChannelPill = (platform, placement) =>
  `<a class="logo-pill" href="${escape(platform.channelUrl)}" target="_blank" rel="noopener noreferrer" data-placement="${escape(placement)}">` +
  `<img class="logo-pill-icon" src="${escape(platformTile(platform))}-44.png" srcset="${escape(tileSet(platformTile(platform)))}" sizes="22px" width="22" height="22" alt="" decoding="async">` +
  `${escape(platform.name)}<span class="sr-only"> (opens in a new tab)</span></a>`;

/**
 * Static markup for the Follow along row: one pill per platform with a channel address, then the
 * Book a call pill.
 */
export function renderFollowAlong(platforms, bookingConfig, placement = 'footer') {
  const links = platforms
    .filter(platform => platform.channelUrl)
    .map(platform => renderChannelPill(platform, placement));
  const booking = renderBookingLink(bookingConfig, placement);
  if (booking) links.push(booking);
  return `<nav class="footer-follow" aria-label="Follow Secure By Design"><span class="footer-connect-label">Follow along</span><div>${links.join('')}</div></nav>`;
}

/** The footer's connect block: App availability above Follow along. */
export const renderFooterConnect = (appStoresMarkup, followAlongMarkup) =>
  `<div class="footer-connect">${appStoresMarkup}${followAlongMarkup}</div>`;
