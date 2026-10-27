import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { TILE_SIZES, bookingTile, platformTile, renderFollowAlong, renderFooterConnect } from '../lib/follow-along.mjs';
import { renderBookingLink } from '../lib/booking.mjs';
import { betaRequestLink, renderAppStores } from '../lib/app-stores.mjs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const publicFile = (path) => existsSync(new URL('../public' + path, import.meta.url));
const tileFiles = (base) => TILE_SIZES.map(size => `${base}-${size}.png`);
const tileImage = (base) => `<img class="logo-pill-icon" src="${base}-44.png" srcset="${TILE_SIZES.map(size => `${base}-${size}.png ${size}w`).join(', ')}" sizes="22px" width="22" height="22" alt="" decoding="async">`;
const platforms = JSON.parse(read('content/videos.json')).platforms;
const appStores = JSON.parse(read('content/app-stores.json'));
const booking = { url: 'https://calendar.app.google/AbC123', label: 'Book a call' };

// Owner direction, 26 October 2026: the Follow along row lives in the site footer and uses the site-wide logo pill.
test('every platform with a channel gets a logo pill with its tile artwork at every size', () => {
  const html = renderFollowAlong(platforms, { url: '' });
  const linked = platforms.filter(platform => platform.channelUrl);
  assert.ok(linked.length >= 5, 'YouTube, TikTok, Instagram, LinkedIn and Discord stay linked');
  assert.deepEqual(TILE_SIZES, [22, 40, 44, 60, 66, 88]);
  for (const platform of linked) {
    for (const file of tileFiles(platformTile(platform))) assert.ok(publicFile(file), `${file} is missing from public/social`);
    const escaped = platform.channelUrl.replaceAll('/', '\\/').replaceAll('.', '\\.').replaceAll('?', '\\?');
    assert.match(html, new RegExp(`<a class="logo-pill" href="${escaped}" target="_blank" rel="noopener noreferrer" data-placement="footer">${tileImage(platformTile(platform))}${platform.name}<span class="sr-only"> \\(opens in a new tab\\)<\\/span><\\/a>`));
  }
  assert.match(html, /^<nav class="footer-follow" aria-label="Follow Secure By Design"><span class="footer-connect-label">Follow along<\/span><div>/);
  assert.doesNotMatch(html, /header-social|-sbd\.svg|-sbd\.png/, 'no header pill markup, retired cyan symbols or first (labeled) tile set');
});

test('the Book a call pill closes the row, once, only while content/booking.json holds a Google booking page', () => {
  const html = renderFollowAlong(platforms, booking);
  for (const file of tileFiles(bookingTile)) assert.ok(publicFile(file), file + ' is missing from public/social');
  assert.ok(html.endsWith(renderBookingLink(booking, 'footer') + '</div></nav>'), 'the same pill as every other Book a call on the site');
  assert.match(html, /data-track="booking_click" data-placement="footer"/);
  assert.equal((html.match(/booking_click/g) || []).length, 1);
  for (const url of ['', 'https://calendly.com/sbd', 'http://calendar.app.google/AbC123']) {
    assert.doesNotMatch(renderFollowAlong(platforms, { url }), /Book a call|book-a-call/, url);
  }
});

test('while the apps are in beta, each availability line is a Join the beta test email request', () => {
  assert.equal(appStores.enabled, false);
  assert.equal(appStores.betaRequest.email, 'support@securebydesigninc.com');
  const [ios, android] = appStores.stores.map(store => betaRequestLink(appStores, store));
  assert.equal(ios.label, 'Join the beta test');
  assert.match(ios.href, /^mailto:support@securebydesigninc\.com\?subject=Join%20the%20beta%20test%20%E2%80%94%20iPhone%20%26%20iPad%20app&body=/);
  assert.match(android.href, /^mailto:support@securebydesigninc\.com\?subject=Join%20the%20beta%20test%20%E2%80%94%20Android%20app&body=/);
  assert.match(ios.href, /TestFlight/);
  assert.match(ios.href, /%0D%0A/, 'line breaks travel as CRLF (RFC 6068)');
  assert.doesNotMatch(ios.href, /[\s"<>]/);

  const html = renderAppStores(appStores);
  assert.equal((html.match(/class="app-store-availability app-store-beta"/g) || []).length, 2);
  assert.match(html, /<a class="app-store-availability app-store-beta" href="mailto:support@securebydesigninc\.com\?subject=[^"]*" title="[^"]*" data-track="beta_request_click" data-store="app-store" data-placement="footer">Join the beta test<span class="sr-only"> — iPhone &amp; iPad, by email<\/span><\/a>/);
  assert.match(html, /data-store="google-play" data-placement="footer">Join the beta test<span class="sr-only"> — Android, by email<\/span>/);
  assert.doesNotMatch(html, /<small|TestFlight<|Coming soon/);
  assert.match(html, /<button class="app-store-badge" type="button" disabled aria-disabled="true"/, 'store badges stay disabled until launch');
});

test('without a valid request address the line falls back to plain text, and a published listing has none', () => {
  const plain = { ...appStores, betaRequest: { email: 'not an address' } };
  assert.equal(betaRequestLink(plain, appStores.stores[0]), null);
  assert.match(renderAppStores(plain), /<small class="app-store-availability" title="[^"]*">Join the beta test<\/small>/);
  assert.doesNotMatch(renderAppStores(plain), /mailto:/);
  const published = { ...appStores, enabled: true, stores: [{ ...appStores.stores[0], listingUrl: 'https://apps.apple.com/us/app/secure-by-design/id1234567890' }] };
  const html = renderAppStores(published);
  assert.match(html, /<a class="app-store-badge" href="https:\/\/apps\.apple\.com\/us\/app\/secure-by-design\/id1234567890"/);
  assert.doesNotMatch(html, /app-store-availability|mailto:/);
});

test('the React layout and the generated Community shells render App availability and Follow along in the footer only', () => {
  assert.match(renderAppStores(appStores), /^<section class="footer-apps" aria-label="App availability"><span class="footer-connect-label">App availability<\/span><div class="app-store-badges">/);
  assert.match(renderAppStores(appStores, 'header'), /data-placement="header"/, 'placement is recorded where the row is shown');
  assert.equal(renderFooterConnect('A', 'B'), '<div class="footer-connect">AB</div>');

  const layout = read('app/layout.tsx');
  assert.match(layout, /renderAppStores\(appStores,'footer'\)\+renderFollowAlong\(videoLibrary\.platforms,bookingConfig,'footer'\)/);
  const header = layout.slice(layout.indexOf('<header'), layout.indexOf('</header>'));
  const footer = layout.slice(layout.indexOf('<footer'), layout.indexOf('</footer>'));
  assert.doesNotMatch(header, /footerConnect|header-connect|BookingLink/, 'the header holds only the branding and the navigation');
  assert.match(footer, /<div className="footer-top">[\s\S]*<div className="footer-connect" dangerouslySetInnerHTML=\{\{__html: footerConnect\}\} \/>/);
  assert.doesNotMatch(footer, /BookingLink/, 'Book a call is listed once, at the end of Follow along');
  assert.doesNotMatch(layout, /logo-pill-icon|\/social\//, 'no hand-written social markup in the layout');

  const shell = read('scripts/prepare-career-shell.mjs');
  assert.match(shell, /renderFooterConnect\(renderAppStores\(appStores,'footer'\),renderFollowAlong\(platforms,bookingConfig,'footer'\)\)/);
  for (const name of ['careers', 'career-explorer', 'career-records', 'resource-subscribers', 'resource-preferences', 'community-contributions']) {
    const html = read(`server/career-pages/${name}.html`);
    const shellHeader = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    assert.doesNotMatch(shellHeader, /header-connect|footer-connect|app-store|logo-pill/, name + ' header');
    const shellFooter = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
    assert.match(shellFooter, /<div class="footer-top">[\s\S]*<div class="footer-connect"><section class="footer-apps"[\s\S]*<nav class="footer-follow"/, name + ' footer');
    assert.equal((shellFooter.match(/booking_click/g) || []).length, 1, name + ' lists Book a call once');
  }

  const css = read('app/template-shared.css');
  assert.match(css, /body\.site-editorial \.sr-only\{/, 'the generated shells need their own sr-only rule');
  assert.doesNotMatch(css, /header-connect|header-socials|header-app-stores|header-social-icon/, 'the retired header rows leave no styles behind');
});
