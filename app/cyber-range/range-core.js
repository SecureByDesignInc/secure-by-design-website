// Cyber Range (owner direction, 26 and 27 October 2026): a place to test what you know about the lab network, open to
// everyone from the first visit, in the Training Hub's design. Solo play runs here on the shared engine (engine.mjs, a
// copy of lib/range/engine.mjs); questions come from /api/range without their answers and are checked there. Signed-in
// learners' operators, stacks, levels, badges and points are saved through the same API; a visitor's live in
// sessionStorage for the visit. mountRange() renders into a root element: the site route (app/cyber-range) mounts it
// under the page's own intro; the app's standalone page (public/range-app, a copy) mounts it alone.
import { createEngine } from './engine.mjs';
import { operatorSvg, systemSvg, GLOWS } from './avatars.js';

const API = '/api/range';
const GUEST_KEY = 'sbd-range-guest';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const VIEWS = ['hub', 'stack', 'checkpoints', 'decks', 'ladder', 'operator'];
const TYPES = ['Identity', 'Network', 'Trust', 'Visibility', 'Endpoint'];

export function mountRange(root, { standalone = false } = {}) {
 const S = { catalog: null, E: null, me: null, guest: null, view: 'hub', battle: null, deck: null, daily: null, ladder: null, poke: 0, draft: null, stackDraft: null, stackFocus: null, dailyResult: null };
 const inApp = standalone || new URLSearchParams(location.search).get('app') === '1';
 root.classList.add('cr-page');
 if (standalone) root.classList.add('cr-standalone');
 root.innerHTML = `<div class="cr-container">${standalone ? '<div class="cr-intro"><div><p class="cr-kicker">Cyber Range</p><h1>Prove what <em>you built.</em></h1></div><div class="cr-intro-copy"><p>Checkpoints, sparring, runs and decks built from the lab network. Open to everyone.</p></div></div>' : ''}<nav class="cr-tabs" aria-label="Range sections"></nav><div class="cr-view" aria-live="polite"><p class="cr-note">Loading the Range\u2026</p></div></div><div class="cr-toast" role="status" aria-live="polite"></div>`;
 const $ = sel => root.querySelector(sel);
 const tabsEl = $('.cr-tabs'), viewEl = $('.cr-view'), toastEl = $('.cr-toast');

 // --- data ----------------------------------------------------------------------------------------------------
 async function api(path, options = {}) {
  const response = await fetch(API + path, { credentials: 'same-origin', headers: options.body ? { 'content-type': 'application/json' } : {}, method: options.method || (options.body ? 'POST' : 'GET'), body: options.body ? JSON.stringify(options.body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'The Range is unavailable. Please try again.'), { status: response.status });
  return data;
 }
 function loadGuest() {
  try { const saved = JSON.parse(sessionStorage.getItem(GUEST_KEY) || 'null'); if (saved?.operator) return saved; } catch { /* fresh */ }
  return { operator: { callsign: 'guest', base: 'visor', glow: 'cyan', mark: 'none' }, stack: ['sbd-dc01', 'l3-router', 'splunk'], cards: {}, badges: [], points: 0, wins: {}, daily: null, schedule: {} };
 }
 const saveGuest = () => { try { sessionStorage.setItem(GUEST_KEY, JSON.stringify(S.guest)); } catch { /* storage may be off */ } };
 const signedIn = () => !!(S.me && S.me.reader);
 const levelsFor = cards => Object.fromEntries(S.catalog.systems.map(s => [s.id, { cards: cards[s.id] || 0, level: S.E.levelFor(cards[s.id] || 0), toNext: S.E.cardsToNext(cards[s.id] || 0) }]));
 // One shape for both kinds of learner.
 function profile() {
  const E = S.E;
  if (signedIn() && S.me.operator) {
   const m = S.me;
   return { signedIn: true, built: true, callsign: m.operator.callsign, operator: m.operator, stack: m.operator.stack.length === 3 ? m.operator.stack : ['sbd-dc01', 'l3-router', 'splunk'],
    levels: m.levels, badges: m.badges.map(b => b.resident), badgeWins: Object.fromEntries(m.badges.map(b => [b.resident, b.wins])), tier: m.tier, rank: m.rank, weekPoints: m.weekPoints, lifetimePoints: m.lifetimePoints, cardsDue: m.cardsDue, dailyAnswered: m.dailyAnswered, dailyStreak: m.dailyStreak };
  }
  if (signedIn()) return { signedIn: true, built: false, callsign: '', operator: null, stack: ['sbd-dc01', 'l3-router', 'splunk'], levels: levelsFor({}), badges: [], badgeWins: {}, tier: 'Recruit', rank: 'I', weekPoints: 0, lifetimePoints: 0, cardsDue: 0, dailyAnswered: null, dailyStreak: 0 };
  const g = S.guest, today = new Date().toISOString().slice(0, 10);
  const due = Object.values(g.schedule || {}).filter(c => Date.parse(c.due) <= Date.now()).length;
  return { signedIn: false, built: true, callsign: 'guest', operator: g.operator, stack: g.stack, levels: levelsFor(g.cards), badges: g.badges, badgeWins: g.wins || {}, tier: E.tierFor(g.badges.length), rank: E.rankFor(g.points), weekPoints: g.points, lifetimePoints: g.points, cardsDue: due, dailyAnswered: g.daily?.day === today ? g.daily.result : null, dailyStreak: g.daily?.day === today && g.daily.result === 'correct' ? 1 : 0 };
 }
 const systemOf = id => S.catalog.systems.find(s => s.id === id);
 const typeColor = type => S.catalog.types[type]?.color || '#8ae5ef';
 const residentOf = id => S.catalog.residents.find(r => r.id === id);

 // --- rendering helpers ----------------------------------------------------------------------------------------
 let toastTimer = null;
 function toast(text) { toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }
 const frame = (operator, { size = 48, threat = false, tier = 'Operator', hit = false, cls = '' } = {}) => `<span class="cr-frame ${threat ? 'threat' : 'tier-' + tier} ${cls}" style="width:${size}px;height:${size}px">${operatorSvg({ ...operator, size: Math.round(size * 0.92), threat, hit })}</span>`;
 const typeChip = (type, extra = '') => `<span class="cr-chip"><span class="cr-dot" style="background:${typeColor(type)}"></span>${esc(type)}${extra}</span>`;
 const sysArt = (id, { size = 56, down = false, threat = false } = {}) => { const s = systemOf(id); return systemSvg(s.glyph, { size, down, color: threat ? '#ff4fd8' : typeColor(s.type), label: s.name }); };
 const kindLabel = (move, E) => { const r = E.rules[move.kind]; return move.kind === 'light' ? `light, ${r.damage}` : move.kind === 'heavy' ? `heavy, ${r.damage}` : move.kind === 'repair' ? `repair, +${r.heal}` : `status: ${move.status}`; };
 const siteLink = (path, text) => `<a href="${inApp ? 'https://securebydesigninc.com' : ''}${path}">${text}</a>`;
 const signInNote = (what = 'keep your operator, points and badges') => inApp
  ? `<p class="cr-note">Playing as a guest in the app: everything lasts until you leave this tab. ${siteLink('/cyber-range', 'Open the Range on the website')} and sign in there to ${what}.</p>`
  : `<p class="cr-note">Playing as a guest: everything lasts until you leave this page. ${siteLink('/my-progress', 'Sign in')} with a free Community account to ${what}.</p>`;
 const heading = (kicker, title, note = '', aside = '') => `<div class="cr-heading"><div><p class="cr-kicker">${esc(kicker)}</p><h2>${title}</h2>${note ? `<p>${note}</p>` : ''}</div>${aside ? `<span>${aside}</span>` : ''}</div>`;
 function setView(view) { S.view = view; render(); if (view !== 'battle') root.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); }

 function renderTabs() {
  const p = profile();
  const tabs = [['hub', 'Range'], ['checkpoints', 'Checkpoints'], ['stack', 'Stack'], ['decks', 'Decks'], ['ladder', 'Ladder'], ['operator', p.built ? esc(p.callsign) : 'Operator']];
  tabsEl.innerHTML = tabs.map(([id, label]) => `<button type="button" data-act="view" data-view="${id}" ${S.view === id || (S.view === 'battle' && id === 'checkpoints') ? 'aria-current="page"' : ''}>${label}</button>`).join('');
 }

 // --- hub -----------------------------------------------------------------------------------------------------
 function renderHub() {
  const p = profile();
  const daily = S.daily;
  const ladder = S.ladder?.entries?.slice(0, 5) || [];
  return `<section class="cr-section cr-section-first">
   <div class="cr-readouts" aria-label="Your status">
    <div class="cr-readout"><span class="cr-label">Your tier</span><b>${esc(p.tier)} ${p.rank}</b></div>
    <div class="cr-readout"><span class="cr-label">${p.signedIn ? 'Points this week' : 'Points this visit'}</span><b>${p.weekPoints}</b></div>
    <div class="cr-readout"><span class="cr-label">Badges</span><b>${p.badges.length} of ${S.catalog.residents.length}</b></div>
    <div class="cr-readout"><span class="cr-label">Cards due</span><b>${p.cardsDue}</b></div>
   </div>
   ${p.signedIn && !p.built ? `<p class="cr-note" style="margin-top:14px">Build your operator first. <button type="button" class="cr-btn cr-btn-small cr-btn-primary" data-act="view" data-view="operator">Open the builder</button></p>` : ''}
   ${p.signedIn ? '' : `<p class="cr-note" style="margin-top:14px">No account needed to play. ${siteLink(inApp ? '/cyber-range' : '/my-progress', inApp ? 'Open the Range on the website' : 'Sign in')} to keep your operator, badges and points, and to appear on the ladder.</p>`}
  </section>
  <section class="cr-section" aria-labelledby="cr-daily-h">
   ${heading("Today\u2019s encounter", '<span id="cr-daily-h">One question, one try.</span>', 'The same question as this morning\u2019s post. Answer before midnight UTC and the explanation follows.', daily ? esc(daily.day) : '')}
   <div class="cr-tile cr-tile-accent">${daily ? renderDaily(daily, p) : '<p class="cr-note">Loading today\u2019s encounter\u2026</p>'}</div>
  </section>
  <section class="cr-section" aria-labelledby="cr-modes-h">
   ${heading('Four ways in', '<span id="cr-modes-h">Four ways in, <em style="font-style:normal;color:#8bdde9">one network.</em></span>', 'Short rounds built from the same systems you configure in the Training Hub. Nothing here checks your course progress.')}
   <div class="cr-grid cr-grid-fill">
    <button type="button" class="cr-tile" data-act="view" data-view="checkpoints"><h3>Checkpoints</h3><p>Six resident operators, each with a stack of three lab systems. Any order. A badge on the first win moves you up a tier.</p><span class="cr-foot">${p.badges.length} of ${S.catalog.residents.length} badges earned</span></button>
    <button type="button" class="cr-tile" data-act="spar"><h3>Sparring</h3><p>A bot match with your own stack. Pick the bot\u2019s type to practise the matchups you keep losing.</p><span class="cr-foot">10 points a win</span></button>
    <button type="button" class="cr-tile" data-act="run"><h3>Run</h3><p>One stack, no repairs between fights. How many residents can you clear before it falls?</p><span class="cr-foot">20 points a resident</span></button>
    <button type="button" class="cr-tile" data-act="view" data-view="decks"><h3>Decks</h3><p>Flashcards cut from the lesson checks. Spaced repetition brings each card back right before you\u2019d forget it, and levels the system.</p><span class="cr-foot">${p.cardsDue} cards due</span></button>
   </div>
  </section>
  <section class="cr-section">
   <div class="cr-grid cr-grid-2 cr-two" style="gap:18px">
    <div class="cr-tile"><div class="cr-row cr-between"><h3>This week\u2019s ladder</h3><span class="cr-chip">${S.ladder ? esc(S.ladder.week) : ''}</span></div>
     ${ladder.length ? `<table class="cr-table"><thead><tr><th>Place</th><th>Operator</th><th>Tier</th><th class="cr-right">Points</th></tr></thead><tbody>${ladder.map(e => `<tr${S.ladder.mine && e.callsign === S.ladder.mine.callsign ? ' class="me"' : ''}><td class="cr-mono">${String(e.place).padStart(2, '0')}</td><td><span class="cr-row" style="gap:8px;flex-wrap:nowrap">${frame(e.operator, { size: 28, tier: e.tier })}<b>${esc(e.callsign)}</b></span></td><td class="cr-muted">${esc(e.tier)} ${e.rank}</td><td class="cr-mono cr-right">${e.points}</td></tr>`).join('')}</tbody></table>` : '<p>Nobody has scored this week yet. The ladder clears every Sunday at 23:59; your tier stays.</p>'}
     <span class="cr-foot"><button type="button" class="cr-btn cr-btn-small" data-act="view" data-view="ladder">Full ladder</button></span>
    </div>
    <div class="cr-tile"><div class="cr-row cr-between"><h3>Your record</h3>${p.built ? `<button type="button" class="cr-row" data-act="view" data-view="operator" style="background:none;border:0;padding:0;gap:10px;color:#eef7fc;flex-wrap:nowrap">${frame(p.operator, { size: 40, tier: p.tier })}<span style="text-align:left"><b>${esc(p.callsign)}</b><br><small style="color:#8ae5ef">Edit operator</small></span></button>` : ''}</div>
     <div><span class="cr-label">Rank track</span><div class="cr-row" style="margin-top:8px;gap:6px">${S.catalog.tiers.map(t => `<span class="cr-chip ${p.tier === t.name ? 'on' : ''}">${esc(t.name)}</span>`).join('')}</div></div>
     <p>Tiers come from play. Each checkpoint badge moves you up, and nothing here checks your course progress.</p>
     <div class="cr-grid cr-grid-3"><div class="cr-raised"><span class="cr-label">Badges</span><br><b>${p.badges.length}</b></div><div class="cr-raised"><span class="cr-label">Lifetime points</span><br><b>${p.lifetimePoints}</b></div><div class="cr-raised"><span class="cr-label">Daily streak</span><br><b>${p.dailyStreak}</b></div></div>
     ${p.signedIn ? '' : signInNote()}
    </div>
   </div>
  </section>`;
 }
 function renderDaily(daily, p) {
  const q = daily.question;
  const done = S.dailyResult || (p.dailyAnswered ? { correct: p.dailyAnswered === 'correct' } : null);
  return `<p class="cr-flip">${esc(q.prompt)}</p>
  <div class="cr-options">${q.options.map((o, i) => { const k = 'ABCD'[i]; const cls = done ? (done.answer === k ? 'right' : done.choice === k ? 'wrong' : '') : ''; return `<button type="button" class="cr-opt ${cls}" data-act="daily" data-choice="${k}" ${done ? 'disabled' : ''}><span class="cr-key">${k}</span><span>${esc(o)}</span></button>`; }).join('')}</div>
  ${done ? `<div class="cr-explain"><b>${done.correct ? 'Resisted.' : done.answer ? 'Missed. The answer is ' + done.answer + '.' : 'Played today.'}</b> ${esc(done.explanation || 'Come back tomorrow for the next one.')} ${done.lesson ? siteLink(done.lesson, 'See the lesson') : ''}</div>` : '<p class="cr-note">Your streak counts if you answer before midnight UTC.</p>'}`;
 }
 async function answerDaily(choice) {
  const q = S.daily.question;
  try {
   if (signedIn() && S.me.operator) {
    const r = await api('/result', { body: { mode: 'daily', questionId: q.id, choice } });
    S.me = r; S.dailyResult = { correct: r.correct, answer: r.answer, choice, explanation: r.explanation, lesson: r.lesson };
    if (r.awarded) toast(`+${r.awarded} points`);
   } else {
    const r = await api('/answer', { body: { id: q.id, choice } });
    S.dailyResult = { ...r, choice };
    if (!signedIn()) { S.guest.daily = { day: S.daily.day, result: r.correct ? 'correct' : 'wrong' }; if (r.correct) S.guest.points += S.E.pointsFor('daily', { correct: true }); saveGuest(); }
   }
  } catch (error) { toast(error.message); }
  render();
 }

 // --- operator builder ----------------------------------------------------------------------------------------
 function renderOperator() {
  const p = profile();
  const d = S.draft || (S.draft = { ...(p.operator || { callsign: '', base: 'visor', glow: 'cyan', mark: 'none' }) });
  const bases = [['visor', 'Visor'], ['hood', 'Hood'], ['headset', 'Headset'], ['goggles', 'Goggles']];
  return `<section class="cr-section cr-section-first">
  ${heading('Your operator', 'Only your callsign, never your name.', 'Your operator stands in for you on the ladder, in duels and in the Community. The frame is earned with your tier; everything else is yours to pick.')}
  <div class="cr-grid cr-grid-2 cr-two" style="grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:18px">
   <div class="cr-tile cr-tile-accent" style="align-items:center">
    <button type="button" class="cr-frame cr-poke tier-${esc(p.tier)} ${S.poke ? (S.poke % 2 ? 'cr-burst' : 'cr-burst b') : ''}" data-act="poke" aria-label="Poke your operator" style="width:220px;height:220px">${operatorSvg({ ...d, size: 200, label: 'Your operator' })}</button>
    <b id="cr-callsign-preview" style="font-size:22px;letter-spacing:-.03em;color:#f1f8ff">${esc(d.callsign || p.callsign || 'callsign')}</b>
    <span class="cr-chip on">${esc(p.tier)} ${p.rank}</span>
    <p style="text-align:center">Tap the operator to see it react.</p>
   </div>
   <div class="cr-stack" style="gap:18px">
    <div><span class="cr-label">Base</span><div class="cr-grid cr-grid-4" style="margin-top:10px;gap:10px">${bases.map(([id, name]) => `<button type="button" class="cr-pick" data-act="draft" data-key="base" data-value="${id}" aria-pressed="${d.base === id}">${operatorSvg({ base: id, glow: d.glow, mark: 'none', size: 56 })}<span>${name}</span></button>`).join('')}</div></div>
    <div class="cr-grid cr-grid-2">
     <div><span class="cr-label">Visor glow</span><div class="cr-row" style="margin-top:10px;gap:14px">${Object.entries(GLOWS).map(([id, hex]) => `<button type="button" class="cr-swatch" data-act="draft" data-key="glow" data-value="${id}" aria-pressed="${d.glow === id}" aria-label="${id}" style="background:${hex}"></button>`).join('')}</div><p class="cr-note" style="margin-top:8px">In a duel the other side is always shown in magenta, so the two sides never blur together.</p></div>
     <div><span class="cr-label">Mark</span><div class="cr-row" style="margin-top:10px;gap:8px">${[['none', 'None'], ['trace', 'Trace'], ['node', 'Node']].map(([id, name]) => `<button type="button" class="cr-chip ${d.mark === id ? 'on' : ''}" data-act="draft" data-key="mark" data-value="${id}" aria-pressed="${d.mark === id}" style="min-height:40px;padding:0 16px;font-size:13px">${name}</button>`).join('')}</div><p class="cr-note" style="margin-top:8px">A small cheek mark in your glow color.</p></div>
    </div>
    <div><span class="cr-label">Frame, earned with your tier</span><ol class="cr-grid" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr));margin-top:10px;gap:8px">${S.catalog.tiers.map(t => `<li class="cr-pick ${t.name === p.tier ? '' : 'locked'}" ${t.name === p.tier ? 'aria-current="true" style="border-color:#7dd8e6"' : ''}>${frame({ base: d.base, glow: d.glow, mark: 'none' }, { size: 44, tier: t.name })}<span>${esc(t.name)}</span><small>${t.badges} badge${t.badges === 1 ? '' : 's'}</small></li>`).join('')}</ol></div>
    <div class="cr-raised cr-stack" style="gap:10px">
     <label class="cr-label" for="cr-callsign">Callsign</label>
     ${p.signedIn ? `<input id="cr-callsign" class="cr-input" type="text" maxlength="16" value="${esc(d.callsign)}" placeholder="letters_numbers_underscores" data-act="draft-input" data-key="callsign" autocomplete="off"><p class="cr-note">3 to 16 letters, numbers and underscores. Changeable once every seven days. Shown instead of your name everywhere in the Range.</p>` : `<input id="cr-callsign" class="cr-input" type="text" value="guest" disabled><p class="cr-note">Visitors play as \u201cguest\u201d. ${siteLink(inApp ? '/cyber-range' : '/my-progress', inApp ? 'Sign in on the website' : 'Sign in')} to pick a callsign that is yours.</p>`}
     <div class="cr-row"><button type="button" class="cr-btn cr-btn-primary" data-act="save-operator">Save operator</button><button type="button" class="cr-btn cr-btn-quiet" data-act="reset-operator">Reset</button></div>
    </div>
   </div>
  </div></section>`;
 }
 async function saveOperator() {
  const d = S.draft; if (!d) return;
  try {
   if (signedIn()) { S.me = await api('/operator', { method: 'PUT', body: { callsign: d.callsign.trim(), base: d.base, glow: d.glow, mark: d.mark } }); toast('Operator saved'); }
   else { S.guest.operator = { callsign: 'guest', base: d.base, glow: d.glow, mark: d.mark }; saveGuest(); toast('Operator saved for this visit'); }
   S.draft = null; setView('hub');
  } catch (error) { toast(error.message); }
 }

 // --- stack ---------------------------------------------------------------------------------------------------
 function renderStack() {
  const p = profile(), E = S.E;
  const chosen = S.stackDraft || (S.stackDraft = [...p.stack]);
  const focus = systemOf(S.stackFocus || chosen[0]);
  const lvl = p.levels[focus.id];
  const moves = focus.moves.map((m, i) => ({ m, locked: i >= 3 && lvl.level < E.rules.fourthMoveLevel }));
  return `<section class="cr-section cr-section-first">
  ${heading('Your stack', 'Field any three systems.', 'Every system in the lab is open from your first match. Tap a system to read its card; tap it again to field it.', `${chosen.length} of 3 fielded`)}
  <div class="cr-grid cr-grid-2 cr-two" style="grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:18px">
   <div class="cr-stack" style="gap:18px">
    <ol class="cr-grid cr-grid-3">${chosen.map(id => { const s = systemOf(id); return `<li class="cr-raised cr-row" style="flex-wrap:nowrap">${sysArt(id, { size: 44 })}<span><b style="color:#f1f8ff">${esc(s.name)}</b><br><span class="cr-label" style="color:${typeColor(s.type)}">${esc(s.type)}, Lv ${p.levels[id].level}</span></span></li>`; }).join('')}</ol>
    <div class="cr-systems">${S.catalog.systems.map(s => `<button type="button" class="cr-sys" data-act="focus-system" data-id="${s.id}" aria-pressed="${focus.id === s.id}">${sysArt(s.id, { size: 52 })}<b>${esc(s.name)}</b><span class="t" style="color:${typeColor(s.type)}">${esc(s.type)}</span>${chosen.includes(s.id) ? '<span class="cr-chip on">Fielded</span>' : ''}</button>`).join('')}</div>
    <p class="cr-note">Seven systems, the same ones in the System Hub. No others.</p>
   </div>
   <div class="cr-tile cr-tile-accent">
    <div class="cr-row" style="gap:14px;flex-wrap:nowrap;align-items:flex-start">${sysArt(focus.id, { size: 96 })}<div class="cr-stack" style="gap:8px;min-width:0"><h3 style="font-size:20px">${esc(focus.name)}</h3><div class="cr-row" style="gap:6px">${typeChip(focus.type)}<span class="cr-chip">Lv ${lvl.level}</span></div><p>${esc(focus.lab)}. Weak to ${esc(E.weakTo(focus.id).join(' and '))}: ${esc(S.catalog.why[focus.type] || '')}</p></div></div>
    <div class="cr-grid cr-grid-2"><div class="cr-raised"><span class="cr-label">Integrity</span><br><b>${E.maxIntegrity(focus.id, lvl.level)}</b></div><div class="cr-raised"><span class="cr-label">Fourth move</span><br><b>${lvl.level >= E.rules.fourthMoveLevel ? 'Open' : 'Opens at Lv 4'}</b></div></div>
    <div><span class="cr-label">Moves</span><ul class="cr-movelist" style="margin-top:8px">${moves.map(({ m, locked }) => `<li class="${locked ? 'locked' : ''}"><span><b>${esc(m.name)}</b><br><span class="cr-note">${esc(m.about)}</span></span><span class="cr-mono" style="font-size:11px;color:${typeColor(m.type)};white-space:nowrap">${esc(m.type)}, ${kindLabel(m, E)}${locked ? ', Lv 4' : ''}</span></li>`).join('')}</ul></div>
    <div class="cr-raised"><div class="cr-row cr-between"><span class="cr-label">To Lv ${Math.min(E.rules.maxLevel, lvl.level + 1)}</span><span class="cr-mono" style="font-size:11px">${lvl.level >= E.rules.maxLevel ? 'Max level' : `${E.rules.levelCards - lvl.toNext} of ${E.rules.levelCards} cards`}</span></div><div class="cr-meter thin" style="margin-top:6px"><i style="width:${lvl.level >= E.rules.maxLevel ? 100 : Math.round(100 * (E.rules.levelCards - lvl.toNext) / E.rules.levelCards)}%"></i></div><p class="cr-note" style="margin-top:6px">Levels come from reviewing this system\u2019s deck in the Range. Nothing else counts.</p></div>
    <div class="cr-row"><button type="button" class="cr-btn ${chosen.includes(focus.id) ? '' : 'cr-btn-primary'}" data-act="toggle-field" data-id="${focus.id}">${chosen.includes(focus.id) ? 'Take out of the stack' : 'Field this system'}</button><button type="button" class="cr-btn cr-btn-small cr-btn-quiet" data-act="deck" data-system="${focus.id}">Review its deck</button></div>
    <div class="cr-row"><button type="button" class="cr-btn cr-btn-primary" data-act="save-stack" ${chosen.length === 3 ? '' : 'disabled'}>Save stack</button><span class="cr-note">${chosen.length === 3 ? '' : 'Pick three to save.'}</span></div>
   </div>
  </div></section>`;
 }
 function toggleField(id) {
  const chosen = S.stackDraft;
  if (chosen.includes(id)) { if (chosen.length > 1) S.stackDraft = chosen.filter(x => x !== id); }
  else if (chosen.length < 3) chosen.push(id); else { chosen.shift(); chosen.push(id); }
  render();
 }
 async function saveStack() {
  const stack = S.stackDraft; if (!stack || stack.length !== 3) return;
  try {
   if (signedIn()) { if (!S.me.operator) throw new Error('Build your operator first.'); S.me = await api('/stack', { method: 'PUT', body: { systems: stack } }); }
   else { S.guest.stack = [...stack]; saveGuest(); }
   toast('Stack saved'); S.stackDraft = null; render();
  } catch (error) { toast(error.message); }
 }

 // --- checkpoints -----------------------------------------------------------------------------------------------
 function renderCheckpoints() {
  const p = profile();
  return `<section class="cr-section cr-section-first">
  ${heading('Checkpoints', 'Six residents, any order.', 'Each resident holds a stack of three lab systems. A badge on the first win moves you up a tier; rematch any time.', `${p.badges.length} of ${S.catalog.residents.length} badges`)}
  <ol class="cr-residents">${S.catalog.residents.map(r => { const earned = p.badges.includes(r.id); return `<li class="cr-resident">${frame(r, { size: 64, tier: earned ? 'Operator' : 'Recruit' })}<b>${esc(r.callsign)}</b><span class="cr-label" style="color:${typeColor(r.type)}">${esc(r.type)}</span><q>${esc(r.line)}</q><span class="cr-row" style="gap:4px;justify-content:center">${r.stack.map(e => sysArt(e.system, { size: 24 })).join('')}</span><span class="cr-chip ${earned ? 'on' : ''}">${earned ? `Badge earned${p.badgeWins[r.id] > 1 ? ', ' + p.badgeWins[r.id] + ' wins' : ''}` : r.pool ? 'Asks RMF questions' : 'Not tried yet'}</span><button type="button" class="cr-btn cr-btn-small cr-btn-block ${earned ? '' : 'cr-btn-primary'}" data-act="challenge" data-id="${r.id}">${earned ? 'Rematch' : 'Challenge'}</button></li>`; }).join('')}</ol>
  </section>
  <section class="cr-section">
  ${heading('Solo modes', 'Sparring, runs and today\u2019s encounter.')}
  <div class="cr-grid cr-grid-3">
   <div class="cr-tile"><h3>Sparring</h3><p>A bot match with your own stack. Pick the bot\u2019s type to practise the matchups you keep losing.</p><div class="cr-row" style="gap:6px;margin-top:auto">${TYPES.map(t => `<button type="button" class="cr-btn cr-btn-small" data-act="spar" data-type="${t}">${t}</button>`).join('')}</div></div>
   <div class="cr-tile"><h3>Run</h3><p>One stack, no repairs between fights. How many residents can you clear before it falls?</p><span class="cr-foot"><button type="button" class="cr-btn cr-btn-small cr-btn-primary" data-act="run">Start a run</button></span></div>
   <div class="cr-tile"><h3>Today\u2019s encounter</h3><p>The daily challenge, one question, the same as the morning post.</p><span class="cr-foot"><button type="button" class="cr-btn cr-btn-small" data-act="view" data-view="hub">Play today\u2019s</button></span></div>
  </div>
  ${p.signedIn ? '' : `<div style="margin-top:14px">${signInNote('keep your badges')}</div>`}
  </section>`;
 }

 // --- battle ----------------------------------------------------------------------------------------------------
 const botStackFor = type => {
  const of = S.catalog.systems.filter(s => s.type === type).map(s => s.id);
  const rest = S.catalog.systems.filter(s => s.type !== type).map(s => s.id).sort(() => Math.random() - 0.5);
  return [...of, ...rest].slice(0, 3).map(system => ({ system, level: 2 }));
 };
 const botOperator = () => ({ callsign: ['nullroute', 'sysvol', 'kerb_tkt', 'vlan30', 'dfsr'][Math.floor(Math.random() * 5)], base: ['hood', 'visor', 'headset', 'goggles'][Math.floor(Math.random() * 4)], glow: 'magenta', mark: 'none' });
 const myStack = p => p.stack.map(system => ({ system, level: p.levels[system]?.level || 1 }));
 const residentOpponent = r => ({ kind: 'resident', id: r.id, callsign: r.callsign, operator: r, stack: r.stack, pool: r.pool || null, tier: 'Resident' });
 function startBattle(opponent, { run = null, carry = null } = {}) {
  const p = profile(), E = S.E;
  const b = E.createBattle({ a: { stack: myStack(p), callsign: p.callsign, operator: p.operator }, b: { stack: opponent.stack, callsign: opponent.callsign, operator: opponent.operator, pool: opponent.pool || null } });
  if (carry) { b.sides.a.stack = carry.map(s => ({ ...s })); b.sides.a.active = Math.max(0, carry.findIndex(s => !s.down)); }
  S.battle = { state: b, opponent, run, phase: 'pick', picks: {}, answers: {}, question: null, used: new Set(), events: [], explain: null, deadline: 0, timer: null, botPick: null, result: null, myAnswer: null, theirAnswer: null, answerStart: 0 };
  S.view = 'battle';
  beginPick();
  root.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
 }
 function stopTimer() { if (S.battle?.timer) { clearInterval(S.battle.timer); S.battle.timer = null; } }
 function startTimer(ms, onExpire) {
  const b = S.battle; stopTimer(); b.deadline = Date.now() + ms;
  b.timer = setInterval(() => { const left = b.deadline - Date.now(); const el = $('#cr-timer'); if (el) { el.textContent = fmt(left); el.classList.toggle('low', left < 5000); } if (left <= 0) { stopTimer(); onExpire(); } }, 100);
 }
 const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return '00:' + String(s).padStart(2, '0'); };
 function beginPick() {
  const b = S.battle, E = S.E, st = b.state, me = st.sides.a;
  b.phase = 'pick'; b.picks = {}; b.answers = {}; b.question = null; b.explain = null; b.myAnswer = null; b.theirAnswer = null;
  // The bot picks now unless I'm Noisy, when it waits to see mine. Its own Noisy status shows its pick to me.
  b.botPick = me.telegraph ? null : E.botPick(st, 'b');
  render();
  startTimer(E.rules.pickMs, () => { const moves = E.availableMoves(me); if (E.mustSwap(me)) choosePick({ swap: me.stack.findIndex(s => !s.down) }); else choosePick({ move: (moves.find(m => m.kind === 'light') || moves[0]).id }); });
 }
 async function choosePick(pick) {
  const b = S.battle, E = S.E, st = b.state; if (!b || b.phase !== 'pick') return;
  stopTimer();
  b.picks.a = pick;
  b.picks.b = b.botPick || E.botPick(st, 'b');
  b.phase = 'answer';
  const q = E.questionsFor(st, b.picks).a;
  if (!q) { b.question = null; render(); await sleep(reduced() ? 300 : 1200); return resolveNow(); }
  try {
   const data = await api(`/question?system=${encodeURIComponent(q.system)}&move=${encodeURIComponent(q.move.id)}${q.pool ? '&pool=' + q.pool : ''}&exclude=${[...b.used].join(',')}`);
   b.question = { ...data, forMove: q.move, repair: q.move.kind === 'repair' }; b.used.add(data.id);
  } catch { b.question = null; render(); return resolveNow(); }
  b.answerStart = Date.now();
  render();
  startTimer(E.answerWindow(st.sides.a, E.activeOf(st.sides.a).level), () => submitAnswer(null));
 }
 async function submitAnswer(choice) {
  const b = S.battle, E = S.E; if (!b || b.phase !== 'answer' || b.myAnswer) return;
  stopTimer();
  const ms = Date.now() - b.answerStart;
  b.myAnswer = { choice, pending: true }; render();
  let checked = { correct: false, answer: null, explanation: 'Time ran out.', lesson: '' };
  if (choice && b.question) { try { checked = await api('/answer', { body: { id: b.question.id, choice } }); } catch { /* counts as a miss */ } }
  b.myAnswer = { choice, ...checked, ms };
  b.explain = checked;
  await resolveNow();
 }
 async function resolveNow() {
  const b = S.battle, E = S.E, st = b.state; if (!b) return;
  const theirQ = E.questionsFor(st, b.picks).b;
  const theirAnswer = theirQ ? E.botAnswer(E.rules[theirQ.move.kind]?.difficulty || 'medium') : null;
  const answers = { a: b.myAnswer ? { correct: !!b.myAnswer.correct, ms: b.myAnswer.ms } : null, b: theirAnswer };
  b.phase = 'resolve';
  b.events = E.resolveTurn(st, b.picks, answers);
  b.theirAnswer = theirAnswer;
  render();
  playEvents(b.events);
  if (st.over) { b.phase = 'over'; await finishBattle(); render(); }
 }
 function playEvents(events) {
  for (const e of events) {
   const target = e.on || (e.kind === 'resisted' ? e.who : null);
   const el = target ? $(`#cr-active-${target}`) : null;
   if (!el) continue;
   const number = (text, good) => { const n = document.createElement('span'); n.className = 'cr-dmg' + (good ? ' good' : ''); n.textContent = text; el.appendChild(n); };
   if (e.kind === 'hit') { el.classList.add('cr-shake'); number(`-${e.damage}`); }
   if (e.kind === 'resisted') { el.classList.add('cr-shake'); number(`-${e.counter + e.backfire}`); $(`#cr-active-${e.by}`)?.classList.add('cr-flare'); }
   if (e.kind === 'repair' && e.correct) { const mine = $(`#cr-active-${e.who}`); if (mine) { const n = document.createElement('span'); n.className = 'cr-dmg good'; n.textContent = `+${e.heal}`; mine.appendChild(n); } }
  }
 }
 async function finishBattle() {
  const b = S.battle, E = S.E, st = b.state;
  const won = st.over.winner === 'a';
  const op = b.opponent;
  let awarded = 0, badge = null;
  try {
   if (op.kind === 'resident') {
    if (signedIn() && S.me.operator) { const r = await api('/result', { body: { mode: 'checkpoint', resident: op.id, won } }); S.me = r; awarded = r.awarded; badge = r.badge; }
    else if (!signedIn()) { const first = won && !S.guest.badges.includes(op.id); if (won) { if (first) { S.guest.badges.push(op.id); badge = op.id; } S.guest.wins[op.id] = (S.guest.wins[op.id] || 0) + 1; } awarded = E.pointsFor('checkpoint', { won, first }); S.guest.points += awarded; saveGuest(); }
    if (b.run && won) b.run.cleared += 1;
   } else if (op.kind === 'bot') {
    if (signedIn() && S.me.operator) { const r = await api('/result', { body: { mode: 'sparring', won } }); S.me = r; awarded = r.awarded; }
    else if (!signedIn()) { awarded = E.pointsFor('sparring', { won }); S.guest.points += awarded; saveGuest(); }
   }
   if (b.run && (!won || b.run.index + 1 >= b.run.order.length)) {
    if (signedIn() && S.me.operator) { const r = await api('/result', { body: { mode: 'run', cleared: b.run.cleared } }); S.me = r; awarded += r.awarded; }
    else if (!signedIn()) { const pts = E.pointsFor('run', { cleared: b.run.cleared }); S.guest.points += pts; awarded += pts; saveGuest(); }
    b.run.done = true;
   }
  } catch (error) { toast(error.message); }
  const text = won ? `You win${awarded ? `, +${awarded} points` : ''}${badge ? `. Badge earned: ${esc(residentOf(badge)?.callsign || badge)}` : ''}.` : st.over.winner === null ? 'A draw: both stacks fell together.' : `${esc(op.callsign)} wins${awarded ? `, +${awarded} points` : ''}.`;
  b.result = { won, awarded, badge, text, stack: st.sides.a.stack.map(s => ({ ...s })) };
 }
 function nextTurn() { const b = S.battle; if (!b || b.phase !== 'resolve' || b.state.over) return; b.state.sides.a.telegraph = b.state.sides.a.status?.name === 'Noisy'; beginPick(); }
 function nextInRun() {
  const b = S.battle; if (!b?.run || b.run.done) return;
  b.run.index += 1;
  startBattle(residentOpponent(residentOf(b.run.order[b.run.index])), { run: b.run, carry: b.result.stack });
 }
 function renderBattle() {
  const b = S.battle, E = S.E, st = b.state, me = st.sides.a, them = st.sides.b, p = profile();
  const mine = E.activeOf(me), theirs = E.activeOf(them);
  const side = (s, who) => { const a = E.activeOf(s), sys = systemOf(a.system), threat = who === 'b'; return `
   <div class="cr-side">
    <div class="cr-who">${frame(s.operator || { base: 'hood', glow: 'magenta', mark: 'none' }, { size: 44, threat, tier: who === 'a' ? p.tier : 'Operator', hit: threat && b.events.some(e => e.kind === 'hit' && e.on === 'b') })}<span><b style="color:#f1f8ff">${esc(s.callsign)}</b><br><small class="cr-muted">${who === 'a' ? p.tier + ' ' + p.rank : esc(b.opponent.tier || 'Resident')}, ${E.standing(s)} of 3 standing${s.status ? `, ${esc(s.status.name)}` : ''}</small></span></div>
    <div class="cr-active" id="cr-active-${who}">${sysArt(a.system, { size: 88, down: a.down, threat })}<div class="cr-stack" style="gap:6px;flex:1;min-width:0"><div class="cr-row cr-between"><span class="cr-name">${esc(sys.name)}</span><span class="cr-muted" style="font-size:11px">Lv ${a.level}</span></div><div class="cr-row" style="gap:6px">${typeChip(sys.type)}<span class="cr-chip">Weak to ${esc(E.weakTo(a.system).join(', '))}</span></div><div class="cr-row cr-between cr-label"><span>Integrity</span><span style="color:#f1f8ff">${a.integrity} / ${a.max}</span></div><div class="cr-meter ${threat ? 'threat' : ''}"><i style="width:${Math.round(100 * a.integrity / a.max)}%"></i></div></div></div>
    <div class="cr-bench">${s.stack.map((x, i) => i === s.active ? '' : `<div class="b ${x.down ? 'down' : ''}">${sysArt(x.system, { size: 30, down: x.down, threat })}<span style="flex:1;min-width:0"><b>${esc(systemOf(x.system).name)}</b><br><span class="cr-muted" style="font-size:11px">${x.down ? 'Down' : x.integrity + '/' + x.max}</span></span>${who === 'a' && b.phase === 'pick' && !x.down && (E.canSwap(me) || E.mustSwap(me)) ? `<button type="button" class="cr-btn cr-btn-small" data-act="pick" data-swap="${i}">Swap</button>` : ''}</div>`).join('')}</div>
   </div>`; };
  const phase = b.phase;
  let bottom = '';
  if (phase === 'pick') {
   const moves = E.availableMoves(me);
   bottom = `<div class="cr-tile"><div class="cr-row cr-between"><h3>${esc(systemOf(mine.system).name)}\u2019s moves</h3><span class="cr-note">Both sides pick at once. Then you answer the question coming at you.${them.telegraph && b.botPick ? ` <b style="color:#f7bd68">${esc(b.opponent.callsign)} is Noisy: ${b.botPick.swap != null ? 'swapping' : esc(E.moveById(theirs.system, b.botPick.move)?.name)}.</b>` : ''}</span></div>
    ${E.mustSwap(me) ? '<p>Your system is down. Swap in another to carry on.</p>' : `<div class="cr-moves">${moves.map(m => { const se = E.effectiveness(m.type, theirs.system) > 1; return `<button type="button" class="cr-move" data-act="pick" data-move="${m.id}"><span class="cr-top"><b>${esc(m.name)}</b><span class="cr-kind">${esc(m.type)}, ${kindLabel(m, E)}</span></span><span class="cr-note">${esc(m.about)}</span>${se ? `<span class="cr-se">Super effective against ${esc(systemOf(theirs.system).type)}</span>` : ''}</button>`; }).join('')}</div>`}
    ${me.status ? `<p class="cr-note">You are ${esc(me.status.name)}: ${esc(E.rules.statuses[me.status.name].about)}</p>` : ''}
   </div>`;
  } else if (phase === 'answer') {
   const q = b.question;
   bottom = `<div class="cr-tile cr-tile-accent">
    ${q ? `<div class="cr-incoming ${q.repair ? 'mine' : ''}"><span class="cr-dot ${q.repair ? '' : 't'}"></span><span><b>${q.repair ? `Your ${esc(q.forMove.name)}` : `Incoming: ${esc(q.forMove.name)}`}</b><br><span class="cr-muted" style="font-size:12px">${esc(q.forMove.type)}, ${kindLabel(q.forMove, E)}${q.repair ? '. Answer it to repair; a right answer also resists what is coming at you.' : E.effectiveness(q.forMove.type, mine.system) > 1 ? '. Super effective against ' + esc(systemOf(mine.system).type) + '.' : '. Neutral.'}</span></span></div>
    <p class="cr-flip">${esc(q.prompt)}</p>
    <div class="cr-options">${q.options.map((o, i) => `<button type="button" class="cr-opt ${b.myAnswer?.choice === 'ABCD'[i] ? 'picked' : ''}" data-act="answer" data-choice="${'ABCD'[i]}" ${b.myAnswer ? 'disabled' : ''}><span class="cr-key">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
    <div class="cr-row cr-between"><span class="cr-note" style="color:#8ae5ef">Resist: 0 damage, counter ${E.rules.counter} (${E.rules.fastCounter} under 5 s)</span><span class="cr-note" style="color:#f7bd68">${q.repair ? 'Miss: no repair' : `Miss: ${Math.floor((E.rules[q.forMove.kind].damage || 0) * E.effectiveness(q.forMove.type, mine.system))} damage`}</span></div>` : `<p>${b.picks.a?.swap != null ? 'You swapped. The incoming move lands on the system you brought in.' : 'Nothing to answer this turn.'}</p>`}
   </div>`;
  } else {
   const over = st.over;
   const lines = b.events.map(e => describeEvent(e, st, b));
   bottom = `<div class="cr-tile"><div class="cr-row cr-between"><h3>Turn ${st.log.at(-1)?.turn} resolved</h3>${over ? '' : `<button type="button" class="cr-btn cr-btn-primary" data-act="next-turn">Next turn</button>`}</div>
    <ul class="cr-stack" style="gap:6px;color:#adc3d2;font-size:14px">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
    ${b.explain ? `<div class="cr-explain"><b>${b.myAnswer?.correct ? 'Resisted.' : b.explain.answer ? `Missed. The answer is ${esc(b.explain.answer)}.` : 'No answer in time.'}</b> ${esc(b.explain.explanation || '')} ${b.explain.lesson ? siteLink(b.explain.lesson, 'See the lesson') : ''}</div>` : ''}
    ${over ? `<div class="cr-raised cr-stack" style="gap:10px"><b style="font-size:20px;color:#f1f8ff">${b.result?.text || ''}</b>${b.run && !b.run.done ? `<p class="cr-note">Run: ${b.run.cleared} of ${b.run.order.length} cleared. Your stack carries its damage into the next fight.</p><div class="cr-row"><button type="button" class="cr-btn cr-btn-primary" data-act="next-run">Next resident</button><button type="button" class="cr-btn cr-btn-quiet" data-act="view" data-view="checkpoints">Stop the run</button></div>` : b.run ? `<p class="cr-note">Run over: ${b.run.cleared} of ${b.run.order.length} residents cleared.</p>` : ''}<div class="cr-row"><button type="button" class="cr-btn" data-act="rematch">Play again</button><button type="button" class="cr-btn cr-btn-quiet" data-act="view" data-view="checkpoints">Back to checkpoints</button></div>${p.signedIn ? '' : signInNote('keep your badges and points')}</div>` : ''}
   </div>`;
  }
  return `<section class="cr-section cr-section-first">
  <div class="cr-row cr-between" style="margin-bottom:14px"><div class="cr-row" style="flex-wrap:nowrap"><button type="button" class="cr-btn cr-btn-small cr-btn-quiet" data-act="leave" aria-label="Leave the duel">Leave</button><div><p class="cr-kicker" style="margin:0 0 2px">${b.run ? `Run, fight ${b.run.index + 1} of ${b.run.order.length}` : b.opponent.kind === 'resident' ? 'Checkpoint' : 'Sparring'}</p><b style="color:#f1f8ff">${esc(p.callsign)} against ${esc(b.opponent.callsign)}</b></div></div>
   <div class="cr-row" style="gap:16px;flex-wrap:nowrap"><span class="cr-label">Turn ${st.turn} of ${st.maxTurns}, ${phase === 'pick' ? 'pick a move' : phase === 'answer' ? 'answer' : phase === 'over' ? 'over' : 'resolving'}</span><span class="cr-timer" id="cr-timer">${phase === 'pick' || phase === 'answer' ? fmt(b.deadline - Date.now()) : ''}</span></div></div>
  <div class="cr-tile cr-tile-accent cr-stage" style="margin-bottom:14px;display:grid">
   ${side(me, 'a')}
   <div class="cr-vs"><span class="big">VS</span><span class="cr-note">${esc(systemOf(mine.system).type)} into ${esc(systemOf(theirs.system).type)}: ${E.weakTo(theirs.system).includes(systemOf(mine.system).type) ? 'super effective' : 'neutral'}. ${esc(systemOf(theirs.system).type)} into ${esc(systemOf(mine.system).type)}: ${E.weakTo(mine.system).includes(systemOf(theirs.system).type) ? 'super effective' : 'neutral'}.</span>${phase === 'pick' ? `<span class="cr-note" style="color:#f7bd68">${esc(b.opponent.callsign)} is choosing</span>` : ''}</div>
   ${side(them, 'b')}
  </div>
  ${bottom}
  ${st.log.length ? `<div class="cr-raised" style="margin-top:14px"><span class="cr-label">Turn log</span><ol class="cr-log" style="margin-top:8px">${st.log.slice().reverse().map(t => t.events.map(e => `<li><b>T${t.turn}</b> ${describeEvent(e, st, b)}</li>`).join('')).join('')}</ol></div>` : ''}
  </section>`;
 }
 function describeEvent(e, st, b) {
  const E = S.E, name = who => who === 'a' ? 'You' : esc(b.opponent.callsign);
  const moveName = id => esc(S.catalog.systems.flatMap(s => s.moves).find(m => m.id === id)?.name || id);
  switch (e.kind) {
   case 'swap': return `${name(e.who)} swapped in ${esc(systemOf(e.system).name)}.`;
   case 'wasted': return `${name(e.who)} lost the turn (${esc(e.reason)}).`;
   case 'repair': return `${name(e.who)} used ${moveName(e.move)}: ${e.correct ? `+${e.heal} integrity` : 'no repair'}.`;
   case 'resisted': return `${name(e.by)} resisted ${moveName(e.move)}${e.fast ? ' in under 5 s' : ''}: ${name(e.who)} take${e.who === 'a' ? '' : 's'} ${e.counter}${e.backfire ? ` and ${e.backfire} backfire` : ''}.`;
   case 'status': return `${name(e.who)} used ${moveName(e.move)}: ${name(e.on)} ${e.on === 'a' ? 'are' : 'is'} ${esc(e.status)}.`;
   case 'hit': return `${name(e.who)} used ${moveName(e.move)}${e.superEffective ? ', super effective' : ''}: ${e.damage} damage${e.swapped ? ' on the system swapped in' : ''}.`;
   case 'down': return `<span class="t">${esc(systemOf(e.system).name)} is down.</span>`;
   default: return '';
  }
 }

 // --- decks -----------------------------------------------------------------------------------------------------
 async function openDeck(system) {
  S.view = 'decks'; S.deck = { system, cards: null, queue: [], index: 0, revealed: false, reviewed: 0, dueCount: 0 }; render();
  try {
   const data = await api(`/cards?system=${encodeURIComponent(system)}`);
   const now = Date.now();
   const sched = id => signedIn() ? data.cards.find(c => c.id === id)?.schedule : S.guest.schedule[id];
   const due = data.cards.filter(c => { const s = sched(c.id); return !s || Date.parse(s.due) <= now; });
   const later = data.cards.filter(c => !due.includes(c));
   S.deck.cards = data.cards; S.deck.queue = [...due.sort(() => Math.random() - 0.5), ...later]; S.deck.dueCount = due.length;
  } catch (error) { toast(error.message); }
  render();
 }
 function renderDecks() {
  const p = profile(), E = S.E, d = S.deck;
  if (!d) return `<section class="cr-section cr-section-first">${heading('Decks', 'One deck per system.', 'Flashcards cut from the lesson checks. Twenty cards reviewed is a level.')}
   <div class="cr-systems">${S.catalog.systems.map(s => `<button type="button" class="cr-sys" data-act="deck" data-system="${s.id}">${sysArt(s.id, { size: 52 })}<b>${esc(s.name)}</b><span class="t" style="color:${typeColor(s.type)}">${esc(s.type)}</span><span class="cr-chip">Lv ${p.levels[s.id].level}, ${p.levels[s.id].cards} reviewed</span></button>`).join('')}</div>${p.signedIn ? '' : `<div style="margin-top:14px">${signInNote('keep your schedule and levels')}</div>`}</section>`;
  const s = systemOf(d.system), card = d.queue[d.index];
  const lvl = p.levels[s.id];
  return `<section class="cr-section cr-section-first">
  <div class="cr-row cr-between" style="margin-bottom:14px"><div class="cr-row" style="flex-wrap:nowrap"><button type="button" class="cr-btn cr-btn-small cr-btn-quiet" data-act="view" data-view="decks">Decks</button><h2 style="color:#f0f8ff;font-size:22px;font-weight:550">${esc(s.name)}</h2></div><div class="cr-row"><span class="cr-chip">Lv ${lvl.level}</span><span class="cr-chip">${d.reviewed} reviewed this sitting</span><span class="cr-chip">${d.dueCount} due</span></div></div>
  <div class="cr-meter thin"><i style="width:${lvl.level >= E.rules.maxLevel ? 100 : Math.round(100 * (E.rules.levelCards - lvl.toNext) / E.rules.levelCards)}%"></i></div>
  ${!d.cards ? '<p class="cr-note" style="margin-top:16px">Loading cards\u2026</p>' : !card ? `<div class="cr-tile" style="margin-top:16px"><h3>Deck complete for now.</h3><p>Every card has a next date. Come back when it is due, or pick another system.</p><div class="cr-row"><button type="button" class="cr-btn" data-act="deck" data-system="${s.id}">Go round again</button><button type="button" class="cr-btn cr-btn-quiet" data-act="view" data-view="decks">Other decks</button></div></div>` : `
  <div class="cr-tile cr-tile-accent" style="margin-top:16px">
   <div class="cr-row cr-between"><span class="cr-kicker" style="margin:0">Card ${d.index + 1} of ${d.queue.length}</span><span class="cr-muted" style="font-size:11px">${card.schedule?.reviews ? `seen ${card.schedule.reviews} time${card.schedule.reviews === 1 ? '' : 's'}` : 'new'}</span></div>
   <p class="cr-flip">${esc(card.prompt)}</p>
   ${d.revealed ? `<div class="cr-options">${card.options.map((o, i) => `<div class="cr-opt ${'ABCD'[i] === card.answer ? 'right' : ''}" style="min-height:44px"><span class="cr-key">${'ABCD'[i]}</span><span>${esc(o)}</span></div>`).join('')}</div><div class="cr-explain"><b>Answer ${esc(card.answer)}.</b> ${esc(card.explanation)} ${card.lesson ? siteLink(card.lesson, 'See the lesson') : ''}</div>
    <p class="cr-label">How did that feel?</p>
    <div class="cr-rate">${[['again', 'Again', '10 min'], ['hard', 'Hard', '2 days'], ['good', 'Good', '5 days'], ['easy', 'Easy', '12 days']].map(([id, name, when]) => `<button type="button" class="${id}" data-act="rate" data-rating="${id}">${name}<small>${when}</small></button>`).join('')}</div>` : `<div class="cr-row"><button type="button" class="cr-btn cr-btn-primary" data-act="reveal">Show answer</button></div>`}
  </div>`}
  ${p.signedIn ? '' : `<div style="margin-top:14px">${signInNote('keep your schedule and levels')}</div>`}
  </section>`;
 }
 async function rateCard(rating) {
  const d = S.deck, card = d.queue[d.index]; if (!card) return;
  try {
   if (signedIn()) { if (!S.me.operator) throw new Error('Build your operator first.'); const r = await api('/deck', { body: { questionId: card.id, rating } }); S.me = r; if (r.awarded) toast(`+${r.awarded} points`); }
   else { S.guest.schedule[card.id] = S.E.schedule(rating, S.guest.schedule[card.id] || {}); S.guest.cards[card.system] = (S.guest.cards[card.system] || 0) + 1; saveGuest(); }
  } catch (error) { toast(error.message); }
  d.reviewed += 1; d.index += 1; d.revealed = false; render();
 }

 // --- ladder ----------------------------------------------------------------------------------------------------
 function renderLadder() {
  const L = S.ladder;
  return `<section class="cr-section cr-section-first">${heading("This week\u2019s ladder", 'Callsigns only.', 'Points come from checkpoints, sparring, runs, the daily encounter and decks. The ladder clears every Sunday at 23:59; tiers stay.', L ? esc(L.week) : '')}
  <div class="cr-tile">${!L ? '<p>Loading\u2026</p>' : L.entries.length ? `<table class="cr-table"><thead><tr><th>Place</th><th>Operator</th><th>Tier</th><th class="cr-right">Points</th></tr></thead><tbody>${L.entries.map(e => `<tr${L.mine && e.callsign === L.mine.callsign ? ' class="me"' : ''}><td class="cr-mono">${String(e.place).padStart(2, '0')}</td><td><span class="cr-row" style="gap:8px;flex-wrap:nowrap">${frame(e.operator, { size: 28, tier: e.tier })}<b>${esc(e.callsign)}</b></span></td><td class="cr-muted">${esc(e.tier)} ${e.rank}</td><td class="cr-mono cr-right">${e.points}</td></tr>`).join('')}</tbody></table>${L.mine ? `<p>You: ${esc(L.mine.callsign)}, ${L.mine.points} points${L.mine.place ? `, place ${L.mine.place}` : ''}.</p>` : ''}` : '<p>Nobody has scored this week yet.</p>'}
  ${signedIn() ? '' : `<p class="cr-note">Guests play but do not appear here. ${siteLink(inApp ? '/cyber-range' : '/my-progress', inApp ? 'Sign in on the website' : 'Sign in')} to take a place.</p>`}</div></section>`;
 }

 // --- render and events ---------------------------------------------------------------------------------------
 function render() {
  if (!S.catalog) { viewEl.innerHTML = '<p class="cr-note">Loading the Range\u2026</p>'; return; }
  renderTabs();
  viewEl.innerHTML = S.view === 'hub' ? renderHub() : S.view === 'operator' ? renderOperator() : S.view === 'stack' ? renderStack() : S.view === 'checkpoints' ? renderCheckpoints() : S.view === 'decks' ? renderDecks() : S.view === 'ladder' ? renderLadder() : S.view === 'battle' ? renderBattle() : renderHub();
 }
 async function refreshLadder() { try { S.ladder = await api('/ladder'); } catch { /* shown as empty */ } }
 const onClick = event => {
  const el = event.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
  const act = el.dataset.act, d = el.dataset;
  if (act === 'view') { stopTimer(); if (S.view === 'battle') S.battle = null; if (d.view === 'decks') S.deck = null; if (d.view === 'ladder') refreshLadder().then(render); if (d.view === 'stack') S.stackDraft = null; if (d.view === 'operator') S.draft = null; setView(d.view); }
  else if (act === 'daily') answerDaily(d.choice);
  else if (act === 'draft') { S.draft[d.key] = d.value; S.poke += 1; render(); }
  else if (act === 'poke') { S.poke += 1; render(); }
  else if (act === 'save-operator') saveOperator();
  else if (act === 'reset-operator') { S.draft = null; render(); }
  else if (act === 'focus-system') { if (S.stackFocus === d.id) toggleField(d.id); else { S.stackFocus = d.id; render(); } }
  else if (act === 'toggle-field') toggleField(d.id);
  else if (act === 'save-stack') saveStack();
  else if (act === 'challenge') startBattle(residentOpponent(residentOf(d.id)));
  else if (act === 'spar') { const type = d.type || TYPES[Math.floor(Math.random() * TYPES.length)]; const op = botOperator(); startBattle({ kind: 'bot', callsign: op.callsign, operator: op, stack: botStackFor(type), tier: type + ' bot' }); }
  else if (act === 'run') { const order = S.catalog.residents.map(r => r.id); startBattle(residentOpponent(residentOf(order[0])), { run: { order, index: 0, cleared: 0, done: false } }); }
  else if (act === 'pick') choosePick(d.swap != null ? { swap: Number(d.swap) } : { move: d.move });
  else if (act === 'answer') submitAnswer(d.choice);
  else if (act === 'next-turn') nextTurn();
  else if (act === 'next-run') nextInRun();
  else if (act === 'rematch') { const op = S.battle.opponent; S.battle = null; startBattle(op); }
  else if (act === 'leave') { stopTimer(); S.battle = null; setView('checkpoints'); }
  else if (act === 'deck') openDeck(d.system);
  else if (act === 'reveal') { S.deck.revealed = true; render(); }
  else if (act === 'rate') rateCard(d.rating);
 };
 const onInput = event => { const el = event.target.closest('[data-act="draft-input"]'); if (el && S.draft) { S.draft[el.dataset.key] = el.value; const b = $('#cr-callsign-preview'); if (b) b.textContent = el.value || 'callsign'; } };
 const onUnload = event => { if (S.battle && !S.battle.state.over) { event.preventDefault(); event.returnValue = ''; } };
 root.addEventListener('click', onClick);
 root.addEventListener('input', onInput);
 window.addEventListener('beforeunload', onUnload);

 (async function boot() {
  S.guest = loadGuest();
  try {
   const [catalog, me] = await Promise.all([api('/catalog'), api('/me').catch(() => ({ reader: false }))]);
   S.catalog = catalog; S.E = createEngine(catalog); S.me = me;
   const hash = location.hash.replace('#', '');
   if (VIEWS.includes(hash) && hash !== 'hub') S.view = hash;
   render();
   const [daily] = await Promise.all([api('/daily').catch(() => null), refreshLadder()]);
   S.daily = daily; render();
  } catch (error) { viewEl.innerHTML = `<p class="cr-note">${esc(error.message)}</p>`; }
 })();

 return () => { stopTimer(); root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); window.removeEventListener('beforeunload', onUnload); clearTimeout(toastTimer); root.innerHTML = ''; root.classList.remove('cr-page', 'cr-standalone'); };
}
