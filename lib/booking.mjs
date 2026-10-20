// Owner request, 18 October 2026: one "Book a call" link to the Google Calendar booking page, in the
// site footer, the Community & Careers Hub and My Account. The address lives only in
// content/booking.json. Until it holds a valid Google booking-page address, no link is shown.
// Keep the app's copy (lib/data/booking.dart in the native app) on the same address.
// Owner direction, 20 October 2026: every "Book a call" on the site is the same pill as the header's,
// with the Book a call logo tile and no underline (renderBookingLink here, BookingLink in app/booking-link.tsx).
const BOOKING_HOSTS = new Set(['calendar.app.google', 'calendar.google.com']);

/** Base path of the Book a call logo tile files (public/social/book-a-call-sbd-<size>.png). */
export const bookingTile = '/social/book-a-call-sbd';
export const BOOKING_TILE_SIZES = [22, 40, 44, 60, 66, 88];
export const bookingTileSet = () => BOOKING_TILE_SIZES.map(size => `${bookingTile}-${size}.png ${size}w`).join(', ');

const escape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

/** The booking link, or null when content/booking.json has no valid Google booking-page address. */
export function bookingLink(config) {
  try {
    const url = new URL(String(config?.url ?? ''));
    if (url.protocol !== 'https:' || !BOOKING_HOSTS.has(url.hostname)) return null;
    return { href: url.href, label: String(config?.label || 'Book a call') };
  } catch {
    return null;
  }
}

/**
 * Static markup for pages built outside React (the generated Community shells).
 * Clicks are counted by the site's analytics as booking_click, with where the link was.
 */
export function renderBookingLink(config, placement) {
  const link = bookingLink(config);
  if (!link) return '';
  return `<a class="logo-pill booking-pill" href="${escape(link.href)}" target="_blank" rel="noopener noreferrer" data-track="booking_click" data-placement="${escape(placement)}">` +
    `<img class="logo-pill-icon" src="${bookingTile}-44.png" srcset="${bookingTileSet()}" sizes="22px" width="22" height="22" alt="" decoding="async">` +
    `${escape(link.label)}<span class="sr-only"> (opens in a new tab)</span></a>`;
}
