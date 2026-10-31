// Cyber Range (owner direction, 30 October 2026): the Range is one battle, you against the computer, seven
// multiple-choice rounds from the lab question bank. Answer right to hit; answer fast to hit harder. First to 0 HP loses,
// otherwise the most HP after round seven wins. Every player gets a random operator and callsign: a visitor's are kept
// in this browser, a signed-in learner's on the account (/api/range/me). Questions come from /api/range/battle without
// their answers and each choice is checked by POST /api/range/answer. The computer's play is simulated here; nothing is
// scored or saved. mountRange() renders into a root element: the site route (app/cyber-range) mounts it under the
// page's own intro; the app's standalone page (public/range-app, a copy) mounts it alone; the homepage mounts it with
// { taster: true } (owner's request, 31 October 2026): one round, then "Play the full battle".
import { bust, figure, spriteHtml, spriteSetFor, SPRITES, BASES, GLOWS, MARKS } from './avatars.js';

const API = '/api/range';
const GUEST_KEY = 'sbd-range-operator';
const HP = 100, TIME = 15000, FAST = 5000, KEYS = ['A', 'B', 'C', 'D'];
const LEVELS = {
 easy: { label: 'Easy', about: 'Right about half the time, and slow.', acc: 0.5, min: 6500, max: 13500 },
 normal: { label: 'Normal', about: 'Right most of the time.', acc: 0.7, min: 4500, max: 11000 },
 hard: { label: 'Hard', about: 'Rarely wrong, and quick.', acc: 0.88, min: 2600, max: 7500 },
};
// 10 for a right answer at the buzzer, up to 22 for an instant one.
const damageFor = ms => 10 + Math.round(12 * Math.max(0, 1 - ms / TIME));
const CALL_A = ['null', 'root', 'zero', 'byte', 'hex', 'packet', 'cipher', 'kernel', 'proxy', 'stack', 'token', 'shell', 'port', 'ghost', 'static', 'subnet', 'beacon', 'vlan'];
const CALL_B = ['runner', 'vector', 'signal', 'fox', 'echo', 'wire', 'spark', 'shade', 'drift', 'pulse', 'hook', 'relay', 'wraith', 'nomad', 'cache', 'trace', 'lynx', 'glitch'];
const CYAN = '#7dd8e6', MAG = '#ff4fd8';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => sleep(reduced() ? Math.min(ms, 120) : ms);
const pickOne = a => a[Math.floor(Math.random() * a.length)];

// A visitor's operator: random the first time, then kept in this browser.
function guestOperator() {
 let o = null;
 try { o = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null'); } catch { /* storage may be off */ }
 if (!(o && BASES[o.base] && GLOWS[o.glow] && o.glow !== 'magenta' && MARKS[o.mark])) o = { base: pickOne(Object.keys(BASES)), glow: pickOne(['cyan', 'ice', 'blue']), mark: pickOne(Object.keys(MARKS)) };
 if (typeof o.callsign !== 'string' || !/^[a-z]+_[a-z]+\d{2,4}$/.test(o.callsign)) o.callsign = `${pickOne(CALL_A)}_${pickOne(CALL_B)}${Math.floor(Math.random() * 90) + 10}`;
 try { localStorage.setItem(GUEST_KEY, JSON.stringify(o)); } catch { /* storage may be off */ }
 return o;
}

export function mountRange(root, { standalone = false, taster = false } = {}) {
 const S = { catalog: null, me: null, op: null, level: 'normal', sound: false, b: null, error: '' };
 const inApp = standalone || new URLSearchParams(location.search).get('app') === '1';
 root.classList.add('cr-page');
 if (standalone) root.classList.add('cr-standalone');
 const $ = sel => root.querySelector(sel);
 const siteLink = (path, text) => `<a href="${inApp ? 'https://securebydesigninc.com' : ''}${path}"${inApp ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a>`;
 const typeColor = t => S.catalog?.types?.[t]?.color || '#8ae5ef';
 const intro = standalone ? '<div class="cr-intro"><div><p class="cr-kicker">Cyber Range</p><h1>Prove what <em>you built.</em></h1></div><div class="cr-intro-copy"><p>Battle the computer in seven rounds of multiple choice from the lab network. Answer right to hit; answer fast to hit harder.</p></div></div>' : '';
 const shell = body => { root.innerHTML = `${intro ? `<div class="cr-container">${intro}</div>` : ''}${body}`; };

 async function api(path, options = {}) {
  const response = await fetch(API + path, { credentials: 'same-origin', headers: options.body ? { 'content-type': 'application/json' } : {}, method: options.body ? 'POST' : 'GET', body: options.body ? JSON.stringify(options.body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The Range is unavailable. Please try again.');
  return data;
 }

 // ---- Setup ------------------------------------------------------------------------------------------------------
 // Owner's request (31 October 2026): no setup screen or difficulty choice. The Range and the taster open straight on a
 // question; the computer plays at Normal. This is only shown if a battle could not be loaded.
 function renderError() {
  stopTimer(); S.b = null;
  shell(`<div class="cr-container"><section class="cr-section cr-section-first"><div class="cr-tile"><p class="cr-note" role="alert">${esc(S.error || 'The Range is unavailable. Please try again.')}</p><div class="cr-row"><button type="button" class="cr-btn cr-btn-primary" data-act="start">Try again</button></div></div></section></div>`);
 }
 const keepNote = () => S.me?.reader ? 'Your operator and callsign are kept on your account.' : inApp ? `Your operator and callsign are kept on this device. ${siteLink('/my-progress', 'Sign in on the website')} to keep them on an account.` : `Your operator and callsign are kept in this browser. ${siteLink('/my-progress', 'Sign in')} with a free Community account to keep them everywhere.`;

 // ---- Battle -----------------------------------------------------------------------------------------------------
 async function start(auto = false) {
  stopTimer();
  let qs;
  try { qs = (await api('/battle')).questions; } catch (e) { S.error = e.message; renderError(); return; }
  if (taster) qs = qs.slice(0, 1);
  S.error = '';
  const r = pickOne(S.catalog.residents);
  const opp = { callsign: r.callsign, operator: { base: r.base, glow: r.glow, mark: r.mark, sprite: SPRITES[r.id] ? r.id : null } };
  const b = S.b = { opp, qs, round: 0, hp: { a: HP, b: HP }, log: [], over: null, phase: 'intro', cur: null };
  renderBattle();
  // Opening the page starts on the question in place; Play again brings the arena back into view.
  if (!auto) $('#bt-arena')?.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
  if (!auto) await sleep(400);
  if (S.b === b) nextRound();
 }
 const fighterArt = who => { const op = who === 'a' ? S.op : S.b.opp.operator, set = spriteSetFor(op); return set ? spriteHtml(set) : figure(op, { height: 150, threat: who === 'b' }); };
 function hudSide(who) {
  const name = who === 'a' ? S.op.callsign : S.b.opp.callsign, op = who === 'a' ? S.op : S.b.opp.operator;
  return `<div class="bt-side ${who}"><span class="bt-ava">${bust(op, { size: 40, threat: who === 'b' })}</span><b class="bt-name">${esc(name)}</b><span class="bt-sub">${who === 'a' ? 'You' : 'Computer'}</span><div class="bt-hp"><s id="bt-ghost-${who}"></s><i id="bt-hp-${who}"></i></div><span class="bt-hpnum" id="bt-hpn-${who}">${HP} HP</span></div>`;
 }
 function renderBattle() {
  const n = S.b.qs.length;
  shell(`<div class="cr-container bt-wrap"><section class="cr-section cr-section-first">
   ${taster ? '<div class="cr-heading bt-taster-head"><div><p class="cr-kicker">Cyber Range</p><h2>Try one round.</h2></div></div>' : ''}
   <div class="cr-tile cr-tile-accent bt-arena" id="bt-arena">
    <div class="bt-hud">${hudSide('a')}<div class="bt-clockbox"><span class="bt-round" id="bt-round">${taster ? 'One round' : `Round 1/${n}`}</span><b class="bt-clock" id="bt-clock">${TIME / 1000}</b><div class="bt-tbar" id="bt-tbarwrap"><i id="bt-tbar"></i></div></div>${hudSide('b')}</div>
    <div class="rs-scene bt-scene" id="bt-scene" aria-hidden="true"><div class="rs-camera" id="bt-camera"><div class="rs-floor"></div><div class="rs-haze"></div><div class="rs-platform a"></div><div class="rs-platform b"></div>
     <div class="rs-lane a"><div class="bt-fighter" id="bt-f-a">${fighterArt('a')}</div></div><div class="rs-lane b"><div class="bt-fighter" id="bt-f-b">${fighterArt('b')}</div></div>
     <div class="rs-fx" id="bt-fx"></div></div><div class="rs-flash" id="bt-flash"></div><div class="rs-banner" id="bt-banner"></div></div>
    <div id="bt-play">
     <div class="bt-q"><span class="cr-chip bt-topic" id="bt-topic"></span><p class="bt-prompt" id="bt-prompt" aria-live="polite">Get ready.</p><p class="bt-status" id="bt-status" aria-live="polite"></p></div>
     <div class="bt-opts" id="bt-opts"></div>
    </div>
    <div class="bt-foot">${taster ? '<span></span>' : '<button type="button" class="cr-btn cr-btn-small bt-forfeit" data-act="forfeit">Forfeit</button>'}<span class="bt-keys">Right answers hit; faster ones hit harder. Keys A to D.</span><button type="button" class="cr-btn cr-btn-small cr-btn-quiet" data-act="sound" aria-pressed="${S.sound}">Sound ${S.sound ? 'on' : 'off'}</button></div>
   </div>
   <div id="bt-result"></div>
  </section></div>`);
  setHp('a'); setHp('b');
 }
 function setHp(who) {
  const v = Math.max(0, S.b.hp[who]), pct = 100 * v / HP;
  const bar = $(`#bt-hp-${who}`), ghost = $(`#bt-ghost-${who}`), num = $(`#bt-hpn-${who}`);
  if (bar) { bar.style.width = pct + '%'; bar.classList.toggle('low', pct <= 30); }
  if (ghost) ghost.style.width = pct + '%';
  if (num) num.textContent = `${v} HP`;
 }

 function nextRound() {
  const b = S.b; if (!b || b.over) return;
  if (b.round >= b.qs.length) return finish();
  const q = b.qs[b.round]; b.round++;
  const L = LEVELS[S.level];
  b.cur = { q, botCorrect: Math.random() < L.acc, botMs: L.min + Math.random() * (L.max - L.min), botShown: false };
  $('#bt-round').textContent = taster ? 'One round' : `Round ${b.round}/${b.qs.length}`;
  $('#bt-topic').innerHTML = `<span class="cr-dot" style="background:${typeColor(q.topic)}"></span>${esc(q.topic)}`;
  $('#bt-prompt').textContent = q.prompt;
  $('#bt-status').textContent = '';
  $('#bt-opts').innerHTML = q.options.map((o, i) => `<button type="button" class="cr-opt bt-opt" data-act="answer" data-choice="${KEYS[i]}"><span class="cr-key">${KEYS[i]}</span><span>${esc(o)}</span></button>`).join('');
  pose('a', 'idle'); pose('b', 'idle');
  const clock = $('#bt-clock'); clock.textContent = String(TIME / 1000); clock.classList.remove('idle', 'low'); $('#bt-tbar').style.width = '100%'; $('#bt-tbarwrap').classList.remove('low');
  // The question shows at once; its clock starts when the arena is in view, so a round never runs out unseen.
  b.phase = 'ready';
  whenVisible($('#bt-arena'), () => { if (S.b === b && b.cur?.q === q && b.phase === 'ready') begin(b); });
 }
 function begin(b) { b.phase = 'answer'; b.cur.t0 = performance.now(); startTimer(); }
 let io = null;
 function whenVisible(el, cb) {
  io?.disconnect(); io = null;
  if (!el || typeof IntersectionObserver !== 'function') return cb();
  io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io?.disconnect(); io = null; cb(); } }, { threshold: 0.35 });
  io.observe(el);
 }

 let raf = null;
 function startTimer() {
  stopTimer();
  const b = S.b, c = b.cur, clock = $('#bt-clock'), bar = $('#bt-tbar'), wrap = $('#bt-tbarwrap');
  clock.classList.remove('idle');
  let last = null;
  const tick = () => {
   if (S.b !== b || b.phase !== 'answer') return;
   const el = performance.now() - c.t0, left = Math.max(0, TIME - el), sec = Math.ceil(left / 1000);
   clock.textContent = String(sec);
   bar.style.width = (100 * left / TIME) + '%';
   const low = left <= 5000; clock.classList.toggle('low', low); wrap.classList.toggle('low', low);
   if (low && sec !== last && sec > 0) sfx('tick');
   last = sec;
   if (!c.botShown && el >= c.botMs) { c.botShown = true; $('#bt-status').innerHTML = `<span class="cr-dot t"></span>${esc(b.opp.callsign)} has answered`; }
   if (left <= 0) { raf = null; answer(null); return; }
   raf = requestAnimationFrame(tick);
  };
  tick();
 }
 function stopTimer() { if (raf) cancelAnimationFrame(raf); raf = null; }

 async function answer(choice) {
  const b = S.b; if (!b) return;
  if (b.phase === 'ready' && choice) begin(b);
  if (b.phase !== 'answer') return;
  const c = b.cur; b.phase = 'checking'; stopTimer();
  const ms = choice ? performance.now() - c.t0 : TIME;
  root.querySelectorAll('#bt-opts .bt-opt').forEach(o => { o.disabled = true; o.classList.toggle('picked', o.dataset.choice === choice); });
  $('#bt-clock').classList.add('idle');
  let check;
  try { check = await api('/answer', { body: { id: c.q.id, choice: choice || '' } }); }
  catch { $('#bt-status').textContent = 'The answer could not be checked. This round counts as no hit for either side.'; check = null; }
  if (S.b !== b || b.over) return;
  b.phase = 'resolve';
  const correct = !!check?.correct, wrong = KEYS.filter(k => k !== check?.answer);
  const botChoice = check ? (c.botCorrect ? check.answer : pickOne(wrong)) : null, botCorrect = !!check && c.botCorrect;
  if (check) {
   root.querySelectorAll('#bt-opts .bt-opt').forEach(o => {
    const k = o.dataset.choice;
    o.classList.toggle('right', k === check.answer); o.classList.toggle('wrong', k === choice && k !== check.answer);
    const marks = [];
    if (k === choice) marks.push(`<span class="bt-mark a" title="You">${bust(S.op, { size: 22 })}</span>`);
    if (k === botChoice) marks.push(`<span class="bt-mark b" title="${esc(b.opp.callsign)}">${bust(b.opp.operator, { size: 22, threat: true })}</span>`);
    if (marks.length) o.insertAdjacentHTML('beforeend', `<span class="bt-marks">${marks.join('')}</span>`);
   });
   const you = choice ? (correct ? `<b class="ok">Right${ms <= FAST ? ', under 5 s' : ''}.</b>` : '<b class="bad">Wrong.</b>') : '<b class="bad">Out of time.</b>';
   $('#bt-status').innerHTML = `${you} ${esc(b.opp.callsign)} answered ${botCorrect ? 'right' : 'wrong'}.`;
   sfx(correct ? 'good' : 'bad');
  }
  await wait(850);
  const hits = [];
  if (correct) hits.push({ from: 'a', to: 'b', ms, dmg: damageFor(ms), fast: ms <= FAST });
  if (botCorrect) hits.push({ from: 'b', to: 'a', ms: c.botMs, dmg: damageFor(c.botMs), fast: c.botMs <= FAST });
  hits.sort((x, y) => x.ms - y.ms);
  if (!hits.length) { banner('No hits this round'); await wait(1300); }
  for (const h of hits) {
   if (S.b !== b || b.over || b.hp.a <= 0 || b.hp.b <= 0) break;
   await playHit(h);
  }
  if (S.b !== b || b.over) return;
  b.log.push({ q: c.q, choice, correct, check });
  if (b.hp.a <= 0 || b.hp.b <= 0 || b.round >= b.qs.length) return finish();
  await wait(700);
  if (S.b === b && !b.over) nextRound();
 }

 function finish(forfeit = false) {
  const b = S.b; if (!b || b.over) return;
  stopTimer(); b.phase = 'over';
  const winner = forfeit ? 'b' : b.hp.a > b.hp.b ? 'a' : b.hp.b > b.hp.a ? 'b' : null;
  b.over = { winner, forfeit };
  const clock = $('#bt-clock'); if (clock) { clock.classList.add('idle'); clock.textContent = winner === 'a' ? 'WIN' : winner === 'b' ? 'LOSS' : 'DRAW'; }
  const bar = $('#bt-tbar'); if (bar) bar.style.width = '0%';
  if (winner === 'a') { pose('a', 'victory'); pose('b', 'slump'); sfx('win'); banner(`${S.op.callsign} wins`); }
  else if (winner === 'b') { pose('b', 'victory'); pose('a', 'slump'); sfx('down'); banner(forfeit ? 'Forfeited' : `${b.opp.callsign} wins`); }
  else { pose('a', 'idle'); pose('b', 'idle'); banner('A draw'); }
  $('#bt-play').innerHTML = '';
  const foot = $('.bt-foot'); if (foot) foot.hidden = true;
  const right = b.log.filter(r => r.correct).length;
  const head = taster ? (winner === 'a' ? 'You win the round.' : winner === 'b' ? `${esc(b.opp.callsign)} takes the round.` : 'No winner this round.') : forfeit ? 'You forfeited.' : winner === 'a' ? `You win with ${b.hp.a} HP left.` : winner === 'b' ? `${esc(b.opp.callsign)} wins with ${b.hp.b} HP left.` : 'A draw.';
  const optText = (q, k) => k ? esc(q.options[KEYS.indexOf(k)]) : 'no answer';
  $('#bt-result').innerHTML = `<div class="cr-tile bt-result">
   <div class="cr-row cr-between"><div><h3>${head}</h3><p>${taster ? 'The full battle is seven rounds against the same clock, at the difficulty you choose.' : `You answered ${right} of ${b.log.length} right.`}</p></div>
    <div class="cr-row">${taster ? `${siteLink('/cyber-range', 'Play the full battle').replace('<a ', '<a class="cr-btn cr-btn-primary" ')}<button type="button" class="cr-btn cr-btn-quiet" data-act="start">Try another round</button>` : '<button type="button" class="cr-btn cr-btn-primary" data-act="start">Play again</button>'}</div></div>
   <p class="cr-note bt-keep">${keepNote()}</p>
   ${b.log.length ? `<ol class="bt-recap">${b.log.map((r, i) => `<li class="${r.correct ? 'ok' : 'miss'}"><span class="bt-rn">${i + 1}</span><div><b>${esc(r.q.prompt)}</b><p>${r.correct ? 'You got it' : `You: ${optText(r.q, r.choice)}`}.${r.check ? ` Answer: <b>${optText(r.q, r.check.answer)}</b>. ${esc(r.check.explanation || '')} ${r.check.lesson ? siteLink(r.check.lesson, 'See the lesson') : ''}` : ''}</p></div></li>`).join('')}</ol>` : ''}
  </div>`;
 }

 // ---- Stage effects ----------------------------------------------------------------------------------------------
 function posOf(who) { const s = $('#bt-scene').getBoundingClientRect(), r = $(`#bt-f-${who}`).getBoundingClientRect(); return { x: r.left + r.width / 2 - s.left, y: r.top + r.height * 0.42 - s.top }; }
 const SPRITE_ACT = { idle: 'idle', attack: 'attack', flinch: 'hit', slump: 'down', victory: 'victory' };
 function pose(who, p) {
  const w = $(`#bt-f-${who}`); if (!w) return;
  const sp = w.querySelector('.rs-sprite');
  if (sp) {
   const act = SPRITE_ACT[p] || 'idle', m = SPRITES[sp.dataset.set][act] || SPRITES[sp.dataset.set].idle;
   sp.className = 'rs-sprite act-' + act; sp.style.setProperty('--n', m.frames); sp.style.setProperty('--fw', m.w); sp.style.setProperty('--fh', m.h);
   clearTimeout(sp._t);
   if (act === 'hit' || act === 'attack') sp._t = setTimeout(() => { if (sp.classList.contains('act-' + act) && !S.b?.over) pose(who, 'idle'); }, 1000 * m.frames / m.fps + 60);
   return;
  }
  const svg = w.querySelector('svg'); if (!svg) return;
  ['pose-command', 'pose-cheer', 'pose-flinch', 'pose-slump', 'pose-victory'].forEach(c => svg.classList.remove(c));
  const cls = p === 'attack' ? 'command' : p;
  if (cls !== 'idle') { void svg.getBoundingClientRect(); svg.classList.add('pose-' + cls); }
 }
 function moveFighter(who, frames, ms) { const f = $(`#bt-f-${who}`); if (!f || reduced() || !f.animate) return; f.animate(frames, { duration: ms, easing: 'cubic-bezier(.3,.9,.3,1)' }); }
 const lunge = who => { const d = who === 'a' ? 1 : -1; moveFighter(who, [{ transform: 'none' }, { transform: `translateX(${-14 * d}px) scale(.97)`, offset: .22 }, { transform: `translateX(${46 * d}px) scale(1.05)`, offset: .58 }, { transform: 'none' }], 520); };
 const knock = who => { const d = who === 'a' ? -1 : 1; moveFighter(who, [{ transform: 'none', filter: 'brightness(1)' }, { transform: `translate(${18 * d}px, 3px) rotate(${6 * d}deg)`, filter: 'brightness(2.4)', offset: .14 }, { transform: `translate(${9 * d}px, 0) rotate(${3 * d}deg)`, filter: 'brightness(1.5)', offset: .42 }, { transform: 'none', filter: 'brightness(1)' }], 560); };
 function fx(html) { const box = $('#bt-fx'), d = document.createElement('div'); d.innerHTML = html; const el = d.firstElementChild; box.appendChild(el); return el; }
 async function bolt(from, to, heavy) {
  if (reduced()) return;
  const a = posOf(from), z = posOf(to), color = from === 'a' ? CYAN : MAG;
  const el = fx(`<span class="rs-bolt ${heavy ? 'heavy' : ''} ${z.x < a.x ? 'rev' : ''}" style="--c:${color};left:${a.x}px;top:${a.y}px"></span>`);
  await el.animate([{ left: a.x + 'px', top: a.y + 'px', opacity: 0 }, { opacity: 1, offset: .12 }, { left: z.x + 'px', top: z.y + 'px', opacity: 1 }], { duration: heavy ? 520 : 400, easing: 'cubic-bezier(.4,0,.8,1)', fill: 'forwards' }).finished.catch(() => {});
  el.remove();
  const ring = fx(`<span class="rs-ring" style="--c:${color};left:${z.x}px;top:${z.y}px"></span>`);
  ring.animate([{ transform: 'translate(-50%,-50%) scale(.25)', opacity: 1 }, { transform: `translate(-50%,-50%) scale(${heavy ? 1.5 : 1.1})`, opacity: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' }).finished.then(() => ring.remove()).catch(() => ring.remove());
  for (let i = 0; i < 8; i++) { const ang = Math.random() * Math.PI * 2, d = 40 + Math.random() * 50; const s = fx(`<span class="rs-spark" style="--c:${color};--dx:${Math.cos(ang) * d}px;--dy:${Math.sin(ang) * d - 20}px;left:${z.x}px;top:${z.y}px"></span>`); setTimeout(() => s.remove(), 950); }
 }
 function number(who, text, sub, big) { const p = posOf(who); const el = fx(`<span class="rs-num ${who === 'a' ? 'bad' : ''} ${big ? 'big' : ''}" style="left:${p.x}px;top:${p.y - 40}px">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>`); setTimeout(() => el.remove(), 1600); }
 function banner(text) { const el = $('#bt-banner'); if (!el) return; el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
 function camera(dir, heavy) { const cam = $('#bt-camera'); if (!cam || reduced() || !cam.animate) return; cam.animate(heavy ? [{ transform: 'none' }, { transform: `scale(1.05) translate(${dir * -12}px,-5px)`, offset: .18 }, { transform: `scale(1.04) translate(${dir * -6}px,3px)`, offset: .32 }, { transform: `scale(1.03) translate(${dir * -10}px,-2px)`, offset: .46 }, { transform: 'none' }] : [{ transform: 'none' }, { transform: `scale(1.035) translate(${dir * -9}px,-4px)`, offset: .3 }, { transform: 'none' }], { duration: heavy ? 520 : 380, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
 function flash(color, strength) { const el = $('#bt-flash'); if (!el || reduced() || !el.animate) return; el.style.background = color; el.animate([{ opacity: strength }, { opacity: 0 }], { duration: 260, easing: 'ease-out' }); }
 async function playHit(h) {
  const b = S.b;
  pose(h.from, 'attack'); lunge(h.from); sfx(h.fast ? 'charge' : 'bolt');
  if (h.fast) await wait(180);
  await bolt(h.from, h.to, h.fast);
  if (S.b !== b || b.over) return;
  knock(h.to); pose(h.to, 'flinch'); camera(h.to === 'a' ? -1 : 1, h.fast); flash(h.to === 'a' ? MAG : CYAN, h.fast ? .2 : .12); sfx(h.fast ? 'slam' : 'hit');
  b.hp[h.to] = Math.max(0, b.hp[h.to] - h.dmg);
  number(h.to, `-${h.dmg}`, h.fast ? 'Fast answer' : '', h.fast);
  setHp(h.to);
  await wait(900);
  if (b.hp[h.to] <= 0) { pose(h.to, 'slump'); sfx('down'); await wait(700); }
 }

 // ---- Sound: synthesized cues, off until the Sound button is pressed ---------------------------------------------
 let AC = null;
 function sfx(name) {
  if (!S.sound) return;
  try {
   AC = AC || new (window.AudioContext || window.webkitAudioContext)();
   if (AC.state === 'suspended') AC.resume();
   const t = AC.currentTime;
   const tone = (type, f0, f1, dur, vol, delay = 0) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + delay); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + delay + dur); g.gain.setValueAtTime(0.0001, t + delay); g.gain.exponentialRampToValueAtTime(vol, t + delay + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur); o.connect(g); g.connect(AC.destination); o.start(t + delay); o.stop(t + delay + dur + .03); };
   switch (name) {
    case 'tick': tone('square', 1100, 0, .05, .035); break;
    case 'bolt': tone('sawtooth', 760, 180, .2, .07); break;
    case 'charge': tone('sawtooth', 120, 900, .42, .07); break;
    case 'hit': tone('triangle', 170, 50, .17, .18); tone('square', 90, 40, .12, .08); break;
    case 'slam': tone('triangle', 140, 40, .32, .24); tone('sawtooth', 60, 30, .3, .12); break;
    case 'good': tone('sine', 660, 990, .16, .07); break;
    case 'bad': tone('square', 220, 140, .2, .05); break;
    case 'down': tone('sawtooth', 320, 48, .55, .1); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone('sine', f, 0, .28, .07, i * .11)); break;
   }
  } catch { /* no sound */ }
 }

 // ---- Events -----------------------------------------------------------------------------------------------------
 const onClick = ev => {
  const btn = ev.target.closest('[data-act]'); if (!btn || !root.contains(btn)) return;
  const act = btn.dataset.act;
  if (act === 'sound') { S.sound = !S.sound; root.querySelectorAll('[data-act="sound"]').forEach(x => { x.setAttribute('aria-pressed', String(S.sound)); x.textContent = `Sound ${S.sound ? 'on' : 'off'}`; }); if (S.sound) sfx('good'); return; }
  if (act === 'start') { start(); return; }
  if (act === 'forfeit') { if (S.b && !S.b.over) finish(true); return; }
  if (act === 'answer') { answer(btn.dataset.choice); return; }
 };
 const onKey = ev => {
  const b = S.b; if (!b || b.phase !== 'answer' || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.target?.closest?.('input, textarea, select')) return;
  const k = ev.key.toUpperCase(), i = '1234'.includes(k) ? '1234'.indexOf(k) : KEYS.indexOf(k);
  if (k.length === 1 && i >= 0) { ev.preventDefault(); answer(KEYS[i]); }
 };
 root.addEventListener('click', onClick);
 document.addEventListener('keydown', onKey);

 (async () => {
  try {
   const [catalog, me] = await Promise.all([api('/catalog'), api('/me').catch(() => ({ reader: false }))]);
   S.catalog = catalog; S.me = me;
   S.op = me.reader && me.operator ? me.operator : guestOperator();
   start(true);
  } catch (e) {
   shell(`<div class="cr-container"><p class="cr-note" role="alert" style="padding:24px 0">${esc(e.message)}</p></div>`);
  }
 })();

 return () => { stopTimer(); io?.disconnect(); S.b = null; root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
}
