import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { TILE_SIZES, bookingTile, platformTile, renderFollowAlong } from '../lib/follow-along.mjs';
import { betaRequestLink, renderAppStores } from '../lib/app-stores.mjs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const publicFile = (path) => existsSync(new URL('../public' + path, import.meta.url));
const tileFiles = (base) => TILE_SIZES.map(size => `${base}-${size}.png`);
const tileImage = (base) => `<img class="header-social-icon" src="${base}-44.png" srcset="${TILE_SIZES.map(size => `${base}-${size}.png ${size}w`).join(', ')}" sizes="\\(max-width:620px\\) 20px, \\(max-width:1000px\\) and \\(max-height:540px\\) 20px, 22px" width="22" height="22" alt="" decoding="async">`;
const platforms = JSON.parse(read('content/videos.json')).platforms;
const appStores = JSON.parse(read('content/app-stores.json'));
const booking = { url: 'https://calendar.app.google/AbC123', label: 'Book a call' };

test('every platform with a channel gets a pill with its tile artwork at every size', () => {
  const html = renderFollowAlong(platforms, { url: '' });
  const linked = platforms.filter(platform => platform.channelUrl);
  assert.ok(linked.length >= 5, 'YouTube, TikTok, Instagram, LinkedIn and Discord stay linked');
  assert.deepEqual(TILE_SIZES, [22, 40, 44, 60, 66, 88], '1x–4x of the 22px desktop and 20px phone tiles');
  for (const platform of linked) {
    for (const file of tileFiles(platformTile(platform))) assert.ok(publicFile(file), `${file} is missing from public/social`);
    const escaped = platform.channelUrl.replaceAll('/', '\\/').replaceAll('.', '\\.').replaceAll('?', '\\?');
    assert.match(html, new RegExp(`<a href="${escaped}" target="_blank" rel="noopener noreferrer" aria-label="Secure By Design on ${platform.name} \\(opens in a new tab\\)">${tileImage(platformTile(platform))}<span class="header-social-label">${platform.name}</span></a>`));
  }
  assert.match(html, /^<nav class="header-socials" aria-label="Follow Secure By Design"><span>Follow along<\/span><div>/);
  assert.doesNotMatch(html, /-sbd\.svg|-sbd\.png/, 'the cyan symbols and the first (labeled) tile set were retired on 18 October 2026');
});

test('the Book a call pill closes the row only while content/booking.json holds a Google booking page', () => {
  const html = renderFollowAlong(platforms, booking);
  for (const file of tileFiles(bookingTile)) assert.ok(publicFile(file), file + ' is missing from public/social');
  assert.match(html, new RegExp(`<a href="https:\\/\\/calendar\\.app\\.google\\/AbC123" target="_blank" rel="noopener noreferrer" aria-label="Book a call with Secure By Design \\(opens in a new tab\\)" data-track="booking_click" data-placement="header">${tileImage(bookingTile)}<span class="header-social-label">Book a call</span></a></div></nav>$`));
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
  assert.match(html, /<a class="app-store-availability app-store-beta" href="mailto:support@securebydesigninc\.com\?subject=[^"]*" title="[^"]*" data-track="beta_request_click" data-store="app-store" data-placement="header">Join the beta test<span class="sr-only"> — iPhone &amp; iPad, by email<\/span><\/a>/);
  assert.match(html, /data-store="google-play" data-placement="header">Join the beta test<span class="sr-only"> — Android, by email<\/span>/);
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

test('the React header and the generated Community shells render the row from the same module', () => {
  const layout = read('app/layout.tsx');
  assert.match(layout, /renderFollowAlong\(videoLibrary\.platforms,bookingConfig\)/);
  assert.doesNotMatch(layout, /header-social-icon|\/social\//, 'no hand-written social markup in the layout');
  const shell = read('scripts/prepare-career-shell.mjs');
  assert.match(shell, /renderFollowAlong\(platforms,bookingConfig\)/);
  assert.doesNotMatch(shell, /header-social-icon/);
  assert.match(read('app/template-shared.css'), /body\.site-editorial \.sr-only\{/, 'the generated shells need their own sr-only rule');
});
