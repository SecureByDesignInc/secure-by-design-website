// Owner request, 18 October 2026: the header's "Follow along" row keeps its pill buttons, but each one
// shows the Secure By Design tile artwork (public/social/<id>-sbd.png, from the owner's labeled tile
// set) instead of the cyan symbol, and the row ends with a "Book a call" pill that opens the Google
// Calendar booking page from content/booking.json (shown only while that address is valid, like the
// footer link). The React header (app/layout.tsx) and the generated Community shells
// (scripts/prepare-career-shell.mjs) both render this markup so the two never drift apart.
import { bookingLink } from './booking.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const pill = ({ href, icon, label, name, attributes = '' }) =>
  `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(name)} (opens in a new tab)"${attributes}>` +
  `<img class="header-social-icon" src="${escape(icon)}" width="20" height="20" alt="" decoding="async">` +
  `<span class="header-social-label">${escape(label)}</span></a>`;

/** The tile shown in a platform's pill; every platform in content/videos.json has one in public/social. */
export const platformTile = platform => `/social/${platform.id}-sbd.png`;

export const bookingTile = '/social/book-a-call-sbd.png';

/**
 * Static markup for the Follow along row: one pill per platform with a channel address, then the
 * booking pill. Social clicks are counted by the analytics script as channel_click from the link's
 * host; the booking pill is a booking_click with placement "header".
 */
export function renderFollowAlong(platforms, bookingConfig) {
  const links = platforms
    .filter(platform => platform.channelUrl)
    .map(platform => pill({ href: platform.channelUrl, icon: platformTile(platform), label: platform.name, name: `Secure By Design on ${platform.name}` }));
  const booking = bookingLink(bookingConfig);
  if (booking) {
    links.push(pill({ href: booking.href, icon: bookingTile, label: booking.label, name: `${booking.label} with Secure By Design`, attributes: ' data-track="booking_click" data-placement="header"' }));
  }
  return `<nav class="header-socials" aria-label="Follow Secure By Design"><span>Follow along</span><div>${links.join('')}</div></nav>`;
}
