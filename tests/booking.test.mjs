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
  assert.match(html, /^<a href="https:\/\/calendar\.app\.google\/AbC123" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /data-track="booking_click" data-placement="footer"/);
  assert.match(html, /\(opens in a new tab\)/);
});

test('the link appears in the footer, the hub and My Account, and nowhere is embedded', () => {
  assert.match(read('app/layout.tsx'), /data-placement="footer"/);
  assert.match(read('scripts/prepare-career-shell.mjs'), /renderBookingLink\(/);
  assert.match(read('app/community/page.tsx'), /data-placement="community_hub"/);
  assert.match(read('app/my-progress/progress-dashboard.tsx'), /data-placement="my_account"/);
  for (const path of ['app/layout.tsx', 'app/community/page.tsx', 'app/my-progress/progress-dashboard.tsx']) {
    assert.doesNotMatch(read(path), /<iframe|calendar\.app\.google/, path + ' should read the address from content/booking.json');
  }
});

test('the privacy policy names the booking page and text reminders', () => {
  const privacy = read('app/privacy/page.tsx');
  assert.match(privacy, /Google Calendar<\/strong> hosts our booking page/);
  assert.match(privacy, /SMS Reminder<\/strong> texts a reminder/);
});
