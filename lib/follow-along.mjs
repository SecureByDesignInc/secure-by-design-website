// Owner request, 18 October 2026: the header's "Follow along" row keeps its pill buttons, but each one
// shows the Secure By Design tile artwork for that destination instead of the cyan symbol, and the row
// ends with a "Book a call" pill that opens the Google Calendar booking page from content/booking.json
// (shown only while that address is valid, like the footer link). The React header (app/layout.tsx) and
// the generated Community shells (scripts/prepare-career-shell.mjs) both render this markup so the two
// never drift apart.
//
// Icons (18 October 2026, third pass): public/social/<id>-sbd-<size>.png hold just the logo cut from the
// owner's unlabeled 1024px icon files, with the dark frame around it cropped away, so the logo sits
// directly on the pill's gradient: YouTube's red play panel, Discord's blurple square, LinkedIn's blue
// square, Instagram's inner gradient square, TikTok's note and the Book a call calendar. Each file is an
// exact 1x, 2x, 3x or 4x render of the 22px desktop and 20px phone slots (22, 44, 66, 88 and 40, 60),
// resized with premultiplied alpha and centred in a square canvas, so no browser rescales.
import { bookingLink } from './booking.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Widths of the tile files; `sizes` below mirrors the pill breakpoints in app/template-shared.css. */
export const TILE_SIZES = [22, 40, 44, 60, 66, 88];
const TILE_SIZES_ATTR = '(max-width:620px) 20px, (max-width:1000px) and (max-height:540px) 20px, 22px';
const tileSet = (base) => TILE_SIZES.map(size => `${base}-${size}.png ${size}w`).join(', ');

const pill = ({ href, tile, label, name, attributes = '' }) =>
  `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(name)} (opens in a new tab)"${attributes}>` +
  `<img class="header-social-icon" src="${escape(tile)}-44.png" srcset="${escape(tileSet(tile))}" sizes="${TILE_SIZES_ATTR}" width="22" height="22" alt="" decoding="async">` +
  `<span class="header-social-label">${escape(label)}</span></a>`;

/** Base path of a platform's tile files (`<base>-<size>.png`); every platform in content/videos.json has a set. */
export const platformTile = platform => `/social/${platform.id}-sbd`;

export const bookingTile = '/social/book-a-call-sbd';

/**
 * Static markup for the Follow along row: one pill per platform with a channel address, then the
 * booking pill. Social clicks are counted by the analytics script as channel_click from the link's
 * host; the booking pill is a booking_click with placement "header".
 */
export function renderFollowAlong(platforms, bookingConfig) {
  const links = platforms
    .filter(platform => platform.channelUrl)
    .map(platform => pill({ href: platform.channelUrl, tile: platformTile(platform), label: platform.name, name: `Secure By Design on ${platform.name}` }));
  const booking = bookingLink(bookingConfig);
  if (booking) {
    links.push(pill({ href: booking.href, tile: bookingTile, label: booking.label, name: `${booking.label} with Secure By Design`, attributes: ' data-track="booking_click" data-placement="header"' }));
  }
  return `<nav class="header-socials" aria-label="Follow Secure By Design"><span>Follow along</span><div>${links.join('')}</div></nav>`;
}
