// Read-only live check of sign-in after deploy. Creates no accounts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const base = 'https://securebydesigninc.com';
const out = 'audit-results/sign-in';
mkdirSync(`${out}/shots`, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 400) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${detail}`); };
const safe = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, e.message); } };

await safe('providers endpoint', async () => {
  const r = await fetch(`${base}/api/sign-in/providers`);
  const j = await r.json();
  check('providers endpoint', r.status === 200 && j.passkeys === true && ['apple', 'google', 'microsoft'].every(k => typeof j.providers[k] === 'boolean'), `${r.status} ${JSON.stringify(j)} cache=${r.headers.get('cache-control')}`);
});
await safe('unconfigured provider start', async () => {
  const r = await fetch(`${base}/api/sign-in/google/start?intent=signin&returnTo=/my-progress`, { redirect: 'manual' });
  check('unconfigured provider start redirects with an error code', [302, 303].includes(r.status) && /signin_error=/.test(r.headers.get('location') || ''), `${r.status} ${r.headers.get('location')}`);
});
await safe('methods without session', async () => {
  const r = await fetch(`${base}/api/sign-in/methods`);
  check('methods require a session', r.status === 401, r.status);
});
await safe('cross-site passkey options', async () => {
  const r = await fetch(`${base}/api/sign-in/passkey/options`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }, body: '{}' });
  check('cross-site passkey request refused', r.status === 403, r.status);
});
await safe('cross-site delete', async () => {
  const r = await fetch(`${base}/api/sign-in/delete-account`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }, body: '{"confirm":"DELETE"}' });
  check('cross-site delete refused', [401, 403].includes(r.status), r.status);
});
await safe('app exchange bad code', async () => {
  const r = await fetch(`${base}/api/native-auth/exchange`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-sbd-client': 'native-v1' }, body: JSON.stringify({ code: 'x'.repeat(43), verifier: 'y'.repeat(64) }) });
  const j = await r.json().catch(() => ({}));
  check('app exchange rejects an unknown code', r.status >= 400 && r.status < 500, `${r.status} ${JSON.stringify(j)}`);
});
await safe('www redirect', async () => {
  const r = await fetch('https://www.securebydesigninc.com/app-sign-in?challenge=abc', { redirect: 'manual' });
  check('www redirects to apex keeping the query', r.status === 301 && r.headers.get('location') === `${base}/app-sign-in?challenge=abc`, `${r.status} ${r.headers.get('location')}`);
});

const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  // A real passkey for this site that was never registered: the server must verify and refuse it.
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  await cdp.send('WebAuthn.addCredential', { authenticatorId, credential: {
    credentialId: randomBytes(32).toString('base64'), isResidentCredential: true, rpId: 'securebydesigninc.com',
    privateKey: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
    userHandle: Buffer.from('not-a-real-account').toString('base64'), signCount: 0 } });

  await safe(`my-progress ${width}`, async () => {
    await page.goto(`${base}/my-progress`, { waitUntil: 'networkidle' });
    const button = page.getByRole('button', { name: 'Sign in with a passkey' });
    await button.waitFor({ timeout: 15000 });
    check(`my-progress shows passkey sign-in (${width})`, await button.isVisible(), '');
    const colors = await button.evaluate(el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor]; });
    const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [hi, lo] = colors.map(lum).sort((x, y) => y - x), ratio = (hi + 0.05) / (lo + 0.05);
    check(`passkey button text is readable (${width})`, ratio >= 4.5, `${ratio.toFixed(2)}:1 ${colors.join(' on ')}`);
    const providerButtons = await page.locator('.sso-apple, .sso-google, .sso-microsoft').count();
    check(`provider buttons hidden until keys exist (${width})`, providerButtons === 0, `${providerButtons} shown`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(`no horizontal scroll on my-progress (${width})`, overflow <= 1, `${overflow}px`);
    await page.screenshot({ path: `${out}/shots/my-progress-${width}.png`, fullPage: false });
    if (width === 1440) {
      const options = await page.evaluate(async () => { const r = await fetch('/api/sign-in/passkey/options', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); return { status: r.status, body: await r.json() }; });
      check('passkey options from the site', options.status === 200 && options.body.publicKey?.rpId === 'securebydesigninc.com' && options.body.publicKey?.userVerification === 'required' && options.body.publicKey?.challenge?.length >= 43, JSON.stringify(options).slice(0, 300));
      await button.click();
      const alert = page.locator('.reader-error[role=alert], .reader-error').first();
      await alert.waitFor({ timeout: 30000 });
      const shown = await alert.innerText();
      check('unregistered passkey is refused with a clear message', /isn.t registered/i.test(shown), shown);
      const me = await page.evaluate(async () => (await fetch('/api/sign-in/methods')).status);
      check('still signed out after unregistered passkey', me === 401, me);
      await page.screenshot({ path: `${out}/shots/passkey-unknown-${width}.png` });
    }
  });
  await safe(`app-sign-in ${width}`, async () => {
    await page.goto(`${base}/app-sign-in?challenge=${'A'.repeat(43)}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Sign in to the app' }).waitFor({ timeout: 15000 });
    const passkey = await page.getByRole('button', { name: 'Sign in with a passkey' }).isVisible();
    check(`app-sign-in shows the sign-in form (${width})`, passkey, '');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(`no horizontal scroll on app-sign-in (${width})`, overflow <= 1, `${overflow}px`);
    await page.screenshot({ path: `${out}/shots/app-sign-in-${width}.png`, fullPage: true });
    await page.goto(`${base}/app-sign-in`, { waitUntil: 'networkidle' });
    const plain = await page.getByRole('heading', { name: 'Open sign-in from the app' }).isVisible();
    check(`app-sign-in without a challenge explains itself (${width})`, plain, '');
  });
  await safe(`privacy ${width}`, async () => {
    await page.goto(`${base}/privacy`, { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText();
    check(`privacy mentions passkeys and self-service deletion (${width})`, /passkey/i.test(text) && /delete/i.test(text), '');
  });
  check(`no page errors (${width})`, errors.filter(e => !/401|Failed to load resource/.test(e)).length === 0, errors.join(' || '));
  await context.close();
}
await browser.close();

const failed = results.filter(r => !r.ok);
writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
writeFileSync(`${out}/results.md`, `# Sign-in live check\n\n${failed.length} failed of ${results.length}\n\n${results.map(r => `- ${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`).join('\n')}\n`);
for (const r of failed) console.log(`::error title=Sign-in check::${r.name} | ${r.detail}`);
console.log(`::notice title=Sign-in live check::${results.length - failed.length}/${results.length} passed`);
