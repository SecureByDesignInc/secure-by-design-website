import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { bookingLink, renderBookingLink } from '../lib/booking.mjs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('only a Google booking page over https becomes a link', () => {
  assert.deepEqual(bookingLink({ url: 'https://calendar.app.google/AbC123', label: 'Book a call' }),
    { href: 'https://calendar.app.google/AbC123', label: 'Book a call' });
  assert.equal(bookingLink({ url: 'https://calendar.google.com/calendar/appointments/schedules/AcZ' })?.label, 'Book a call');
  for (const url of ['', 'not a url', 'http://calendar.app.google/AbC123', 'https://calendly.com/sbd',
    'https://calendar.app.google.evil.example/x', 'javascript:alert(1)']) {
    assert.equal(bookingLink({ url }), null, url);
    assert.equal(renderBookingLink({ url }, 'footer'), '', url);
  }
});

test('static markup opens in a new tab and is counted by placement', () => {
  const html = renderBookingLink({ url: 'https://calendar.app.google/AbC123', label: 'Book a call' }, 'footer');
  // Owner direction, 20 October 2026: the pill with the Book a call logo tile, the same look as the header's.
  assert.match(html, /^<a class="logo-pill booking-pill" href="https:\/\/calendar\.app\.google\/AbC123" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /<img class="logo-pill-icon" src="\/social\/book-a-call-sbd-44\.png" srcset="[^"]*book-a-call-sbd-88\.png 88w"/);
  assert.match(html, /data-track="booking_click" data-placement="footer"/);
  assert.match(html, /\(opens in a new tab\)/);
});

test('the link appears in the footer, the hub and My Account, and nowhere is embedded', () => {
  assert.match(read('app/layout.tsx'), /<BookingLink placement="footer" \/>/);
  assert.match(read('scripts/prepare-career-shell.mjs'), /renderBookingLink\(/);
  assert.match(read('app/community/page.tsx'), /<BookingLink placement="community_hub" \/>/);
  assert.match(read('app/my-progress/progress-dashboard.tsx'), /<BookingLink placement="my_account" \/>/);
  // Every Book a call is the pill: no page renders its own plain or underlined booking link.
  for (const path of ['app/layout.tsx', 'app/community/page.tsx', 'app/my-progress/progress-dashboard.tsx']) {
    assert.doesNotMatch(read(path), /data-track="booking_click"/, path + ' should use BookingLink');
  }
  assert.match(read('app/booking-link.tsx'), /<LogoLink tile="book-a-call"[^>]*className=\{className \? `booking-pill \$\{className\}` : 'booking-pill'\}/);
  // No underlines anywhere on the site (owner direction, 20 October 2026), and the logo pill is defined once.
  assert.match(read('app/template-shared.css'), /body\.site-editorial a,body\.site-editorial a:hover,[^{]*\{text-decoration:none!important\}/);
  assert.match(read('app/template-shared.css'), /body\.site-editorial a\.logo-pill\{[^}]*text-decoration:none/);
  assert.match(read('app/globals.css'), /a, a:hover, a:focus, a:active, a:visited \{ text-decoration:none !important; \}/);
  for (const path of ['app/community/page.tsx', 'app/community/[state]/page.tsx']) assert.match(read(path), /<LogoLink tile="discord" href=\{discordUrl\}>Join the Discord<\/LogoLink>/, path);
  assert.match(read('app/home-community-panel.tsx'), /tile: 'linkedin' as const[\s\S]*tile: 'discord' as const[\s\S]*<LogoLink tile=\{item\.tile\}/);
  for (const path of ['app/layout.tsx', 'app/community/page.tsx', 'app/my-progress/progress-dashboard.tsx']) {
    assert.doesNotMatch(read(path), /<iframe|calendar\.app\.google/, path + ' should read the address from content/booking.json');
  }
});

test('the privacy policy names the booking page and text reminders', () => {
  const privacy = read('app/privacy/page.tsx');
  assert.match(privacy, /Google Calendar<\/strong> hosts our booking page/);
  assert.match(privacy, /SMS Reminder<\/strong> texts a reminder/);
});
