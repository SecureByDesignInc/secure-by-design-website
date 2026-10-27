// Cyber Range (owner direction, 26 October 2026): a place to test what you know about the lab network, open to everyone
// from the first visit. Solo play runs here in the page on the shared engine (engine.mjs, a copy of lib/range/engine.mjs);
// questions come from /api/range without their answers and are checked there. Signed-in learners' operators, stacks,
// levels, badges and points are saved through the same API; a visitor's live in sessionStorage for the visit.
import { createEngine } from './engine.mjs';
import { operatorSvg, systemSvg, GLOWS } from './avatars.js';

const API = '/api/range';
const GUEST_KEY = 'sbd-range-guest';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = sel => document.querySelector(sel);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = { catalog: null, E: null, me: null, guest: null, view: 'hub', battle: null, deck: null, daily: null, ladder: null, poke: 0, draft: null };

// --- data -----------------------------------------------------------------------------------------------------
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
// One shape for both kinds of learner.
function profile() {
 const E = S.E;
 if (signedIn() && S.me.operator) {
  const m = S.me;
  return { signedIn: true, built: true, callsign: m.operator.callsign, operator: m.operator, stack: m.operator.stack.length === 3 ? m.operator.stack : ['sbd-dc01', 'l3-router', 'splunk'], stackSaved: m.operator.stack.length === 3,
   levels: m.levels, badges: m.badges.map(b => b.resident), badgeWins: Object.fromEntries(m.badges.map(b => [b.resident, b.wins])), tier: m.tier, rank: m.rank, weekPoints: m.weekPoints, lifetimePoints: m.lifetimePoints, cardsDue: m.cardsDue, dailyAnswered: m.dailyAnswered, dailyStreak: m.dailyStreak };
 }
 if (signedIn()) return { signedIn: true, built: false, callsign: '', operator: null, stack: ['sbd-dc01', 'l3-router', 'splunk'], stackSaved: false, levels: Object.fromEntries(S.catalog.systems.map(s => [s.id, { cards: 0, level: 1, toNext: E.cardsToNext(0) }])), badges: [], badgeWins: {}, tier: 'Recruit', rank: 'I', weekPoints: 0, lifetimePoints: 0, cardsDue: 0, dailyAnswered: null, dailyStreak: 0 };
 const g = S.guest, today = new Date().toISOString().slice(0, 10);
 const due = Object.values(g.schedule || {}).filter(c => Date.parse(c.due) <= Date.now()).length;
 return { signedIn: false, built: true, callsign: 'guest', operator: g.operator, stack: g.stack, stackSaved: true,
  levels: Object.fromEntries(S.catalog.systems.map(s => [s.id, { cards: g.cards[s.id] || 0, level: E.levelFor(g.cards[s.id] || 0), toNext: E.cardsToNext(g.cards[s.id] || 0) }])),
  badges: g.badges, badgeWins: g.wins || {}, tier: E.tierFor(g.badges.length), rank: E.rankFor(g.points), weekPoints: g.points, lifetimePoints: g.points, cardsDue: due, dailyAnswered: g.daily?.day === today ? g.daily.result : null, dailyStreak: g.daily?.day === today && g.daily.result === 'correct' ? 1 : 0 };
}
const systemOf = id => S.catalog.systems.find(s => s.id === id);
const typeColor = type => S.catalog.types[type]?.color || '#83dcfa';
const residentOf = id => S.catalog.residents.find(r => r.id === id);

// --- rendering helpers ----------------------------------------------------------------------------------------
function toast(text) { const t = $('#toast'); t.textContent = text; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }
const frame = (operator, { size = 48, threat = false, tier = 'Operator', hit = false, cls = '' } = {}) => `<span class="frame ${size > 60 ? 'lg' : ''} ${threat ? 'threat' : 'tier-' + tier} ${cls}" style="width:${size}px;height:${size}px">${operatorSvg({ ...operator, size: Math.round(size * 0.92), threat, hit })}</span>`;
const typeChip = (type, extra = '') => `<span class="chip"><span class="dot" style="background:${typeColor(type)};box-shadow:0 0 8px ${typeColor(type)}"></span>${esc(type)}${extra}</span>`;
const sysArt = (id, { size = 56, down = false, threat = false } = {}) => { const s = systemOf(id); return systemSvg(s.glyph, { size, down, color: threat ? '#ff4fd8' : typeColor(s.type), label: s.name }); };
const kindLabel = (move, E) => { const r = E.rules[move.kind]; return move.kind === 'light' ? `light, ${r.damage}` : move.kind === 'heavy' ? `heavy, ${r.damage}` : move.kind === 'repair' ? `repair, +${r.heal}` : `status: ${move.status}`; };
// In the native app (?app=1) the Range plays as a guest for now; sign-in opens the website in the browser.
const inApp = new URLSearchParams(location.search).get('app') === '1';
const signInNote = (what = 'keep your operator, points and badges') => inApp
 ? `<p class="note">Playing as a guest in the app: everything lasts until you leave this tab. <a href="https://securebydesigninc.com/cyber-range" target="_top">Open the Range on the website</a> and sign in there to ${what}.</p>`
 : `<p class="note">Playing as a guest: everything lasts until you leave this page. <a href="/my-progress" target="_top">Sign in</a> with a free Community account to ${what}.</p>`;
function setView(view) { S.view = view; render(); window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); }

function renderTop() {
 const p = profile();
 const tabs = [['hub', 'Range'], ['stack', 'Stack'], ['checkpoints', 'Checkpoints'], ['decks', 'Decks'], ['ladder', 'Ladder'], ['operator', 'Operator']];
 return `<a class="rg-brand" href="/cyber-range" target="_top"><img src="/brand-lock.svg" alt="" width="36" height="36"><span><b>Secure By Design</b><small>Cyber Range</small></span></a>
 <nav class="rg-nav" aria-label="Range">${tabs.map(([id, label]) => `<button type="button" data-act="view" data-view="${id}" ${S.view === id || (S.view === 'battle' && id === 'checkpoints') ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav>
 <button type="button" class="rg-who" data-act="view" data-view="operator" aria-label="Your operator">${p.built ? frame(p.operator, { size: 36, tier: p.tier }) : ''}<span class="txt">${p.built ? esc(p.callsign) + ' · ' + esc(p.tier) + ' ' + p.rank : 'Build your operator'}</span></button>`;
}

// --- hub -------------------------------------------------------------------------------------------------------
function renderHub() {
 const p = profile(), E = S.E;
 const daily = S.daily;
 const dailyBlock = !daily ? '<p class="muted">Loading today\u2019s encounter\u2026</p>' : renderDaily(daily, p);
 const ladder = S.ladder?.entries?.slice(0, 5) || [];
 return `<section class="hero">
  <div><p class="kicker">Cyber Range</p><h1>Prove what you built.</h1>
   <p class="deck">Short rounds built from the same network you configure in the Training Hub. Take a resident checkpoint, spar against a bot, run your stack as far as it goes, or keep your decks warm. It\u2019s a place to find out what you know, with nothing riding on it but your spot on the ladder.</p>
   <div class="row"><button type="button" class="btn primary" data-act="view" data-view="checkpoints">Pick a checkpoint</button><button type="button" class="btn" data-act="spar">Spar against a bot</button></div>
   ${p.signedIn ? '' : '<p class="note" style="margin-top:14px">No account needed to play. <a href="/my-progress" target="_top">Sign in</a> to keep your operator, badges and points, and to appear on the ladder.</p>'}
   ${p.signedIn && !p.built ? '<p class="note" style="margin-top:14px">Build your operator first: <button type="button" class="btn small" data-act="view" data-view="operator">Open the builder</button></p>' : ''}
  </div>
  <section class="panel hud" aria-labelledby="daily-h"><span class="corner"></span>
   <div class="row between"><h2 id="daily-h" class="kicker" style="margin:0">Today\u2019s encounter</h2><span class="mono muted" style="font-size:12px">${daily ? esc(daily.day) : ''}</span></div>
   <p class="note" style="margin:8px 0 12px">The same question as this morning\u2019s post. One try, then the explanation.</p>
   ${dailyBlock}
  </section>
 </section>
 <section class="status-strip" aria-label="Your status">
  <div class="readout"><span class="label">Your tier</span><b>${esc(p.tier)} ${p.rank}</b></div>
  <div class="readout"><span class="label">${p.signedIn ? 'Points this week' : 'Points this visit'}</span><b>${p.weekPoints}</b></div>
  <div class="readout"><span class="label">Badges</span><b>${p.badges.length} of ${S.catalog.residents.length}</b></div>
  <div class="readout"><span class="label">Cards due</span><b>${p.cardsDue}</b></div>
 </section>
 <h2 style="font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:550;letter-spacing:-.045em">Four ways in, <span style="color:#96a8bf">one network.</span></h2>
 <section class="modes">
  <button type="button" class="tile" data-act="view" data-view="checkpoints"><h3>Checkpoints</h3><p class="note">Six resident operators, each with a stack. Any order. A badge on the first win moves you up a tier.</p><span class="foot">${p.badges.length} badges earned</span></button>
  <button type="button" class="tile" data-act="spar"><h3>Sparring</h3><p class="note">A bot match with your own stack. Pick the bot\u2019s type to practise the matchups you keep losing.</p><span class="foot">10 points a win</span></button>
  <button type="button" class="tile" data-act="run"><h3>Run</h3><p class="note">One stack, no repairs between fights. How many residents can you clear before it falls?</p><span class="foot">20 points a resident</span></button>
  <button type="button" class="tile" data-act="view" data-view="decks"><h3>Decks</h3><p class="note">Flashcards cut from the lesson checks. Spaced repetition brings each card back right before you\u2019d forget it, and levels the system.</p><span class="foot">${p.cardsDue} cards due</span></button>
 </section>
 <section class="two">
  <section class="panel"><div class="row between"><h2>This week\u2019s ladder</h2><span class="chip">${S.ladder ? esc(S.ladder.week) : ''}</span></div>
   ${ladder.length ? `<table style="margin-top:12px"><thead><tr><th>Place</th><th>Operator</th><th>Tier</th><th class="right">Points</th></tr></thead><tbody>${ladder.map(e => `<tr${S.ladder.mine && e.callsign === S.ladder.mine.callsign ? ' class="me"' : ''}><td class="mono" style="color:var(--cyan)">${String(e.place).padStart(2, '0')}</td><td><span class="row" style="gap:8px">${frame(e.operator, { size: 28, tier: e.tier })}<b>${esc(e.callsign)}</b></span></td><td class="muted">${esc(e.tier)} ${e.rank}</td><td class="mono right">${e.points}</td></tr>`).join('')}</tbody></table>` : '<p class="note" style="margin-top:12px">Nobody has scored this week yet. The ladder clears every Sunday at 23:59; your tier stays.</p>'}
   <p class="row" style="margin-top:12px"><button type="button" class="btn small" data-act="view" data-view="ladder">Full ladder</button></p>
  </section>
  <section class="panel"><div class="row between"><h2>Your record</h2>${p.built ? `<button type="button" class="row" data-act="view" data-view="operator" style="background:none;border:0;padding:0;gap:10px;color:var(--ink)">${frame(p.operator, { size: 44, tier: p.tier })}<span><b>${esc(p.callsign)}</b><br><small style="color:var(--link)">Edit operator</small></span></button>` : ''}</div>
   <div class="stack" style="margin-top:14px">
    <div><span class="label">Rank track</span><ol class="plain row" style="margin-top:8px;gap:8px">${S.catalog.tiers.map(t => `<li class="chip" ${p.tier === t.name ? 'style="border-color:var(--cyan);color:var(--ink)"' : ''}>${esc(t.name)}</li>`).join('')}</ol><p class="note" style="margin-top:8px">Tiers come from play. Each checkpoint badge moves you up, and nothing here checks your course progress.</p></div>
    <div class="grid cols-3"><div class="raised" style="padding:12px"><span class="label">Badges</span><br><b style="font-size:20px">${p.badges.length}</b></div><div class="raised" style="padding:12px"><span class="label">Lifetime points</span><br><b style="font-size:20px">${p.lifetimePoints}</b></div><div class="raised" style="padding:12px"><span class="label">Daily streak</span><br><b style="font-size:20px">${p.dailyStreak}</b></div></div>
    ${p.signedIn ? '' : signInNote()}
   </div>
  </section>
 </section>`;
}
function renderDaily(daily, p) {
 const q = daily.question;
 const done = S.dailyResult || (p.dailyAnswered ? { correct: p.dailyAnswered === 'correct' } : null);
 return `<p style="font-size:18px;line-height:1.5;font-weight:500;margin-bottom:12px">${esc(q.prompt)}</p>
 <div class="stack" style="gap:8px">${q.options.map((o, i) => { const k = 'ABCD'[i]; const cls = done ? (done.answer === k ? 'right' : done.choice === k ? 'wrong' : '') : ''; return `<button type="button" class="opt ${cls}" data-act="daily" data-choice="${k}" ${done ? 'disabled' : ''}><span class="key">${k}</span><span>${esc(o)}</span></button>`; }).join('')}</div>
 ${done ? `<div class="explain" style="margin-top:12px"><b>${done.correct ? 'Resisted.' : done.answer ? 'Missed. The answer is ' + done.answer + '.' : 'Played today.'}</b> ${esc(done.explanation || 'Come back tomorrow for the next one.')} ${done.lesson ? `<a href="${esc(done.lesson)}" target="_top">See the lesson</a>` : ''}</div>` : '<p class="note" style="margin-top:12px">Resets at midnight UTC. Your streak counts if you answer before then.</p>'}`;
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

// --- operator builder ------------------------------------------------------------------------------------------
function renderOperator() {
 const p = profile();
 const d = S.draft || (S.draft = { ...(p.operator || { callsign: '', base: 'visor', glow: 'cyan', mark: 'none' }) });
 const bases = [['visor', 'Visor'], ['hood', 'Hood'], ['headset', 'Headset'], ['goggles', 'Goggles']];
 return `<div class="row between" style="padding:22px 0 16px"><div><p class="kicker">Cyber Range</p><h2>Your operator</h2></div><p class="note">Shows on the ladder, in duels and in the Community. Only your callsign, never your name.</p></div>
 <div class="two" style="grid-template-columns:minmax(0,400px) minmax(0,1fr)">
  <section class="panel hud" style="display:flex;flex-direction:column;align-items:center;gap:18px"><span class="corner"></span>
   <button type="button" class="frame lg poke tier-${esc(p.tier)} ${S.poke ? (S.poke % 2 ? 'burst' : 'burst b') : ''}" data-act="poke" aria-label="Poke your operator" style="width:240px;height:240px;padding:0">${operatorSvg({ ...d, size: 220, label: 'Your operator' })}</button>
   <div style="text-align:center"><b style="font-size:24px;letter-spacing:-.03em">${esc(d.callsign || p.callsign || 'callsign')}</b><br><span class="chip"><span class="dot"></span>${esc(p.tier)} ${p.rank}</span></div>
   <p class="note" style="text-align:center;max-width:30ch">Tap the operator to see it react. The frame is earned with your tier; everything else is yours to pick.</p>
  </section>
  <section class="stack" style="gap:22px">
   <div><span class="label">Base</span><div class="grid cols-4" style="margin-top:10px;gap:10px">${bases.map(([id, name]) => `<button type="button" class="pick" data-act="draft" data-key="base" data-value="${id}" aria-pressed="${d.base === id}">${operatorSvg({ base: id, glow: d.glow, mark: 'none', size: 56 })}<span style="font-size:13px;font-weight:600">${name}</span></button>`).join('')}</div></div>
   <div class="grid cols-2">
    <div><span class="label">Visor glow</span><div class="row" style="margin-top:10px;gap:14px">${Object.entries(GLOWS).map(([id, hex]) => `<button type="button" class="swatch" data-act="draft" data-key="glow" data-value="${id}" aria-pressed="${d.glow === id}" aria-label="${id}" style="background:${hex}"></button>`).join('')}</div><p class="note" style="margin-top:8px">In a duel the other side is always shown in magenta, so you can tell the two apart at a glance.</p></div>
    <div><span class="label">Mark</span><div class="grid cols-3" style="margin-top:10px;gap:8px">${[['none', 'None'], ['trace', 'Trace'], ['node', 'Node']].map(([id, name]) => `<button type="button" class="opt" style="min-height:44px;justify-content:center" data-act="draft" data-key="mark" data-value="${id}" aria-pressed="${d.mark === id}">${name}</button>`).join('')}</div><p class="note" style="margin-top:8px">A small cheek mark in your glow color.</p></div>
   </div>
   <div><span class="label">Frame, earned with your tier</span><ol class="plain grid" style="grid-template-columns:repeat(5,minmax(0,1fr));margin-top:10px;gap:8px">${S.catalog.tiers.map(t => `<li class="pick ${t.name === p.tier ? '' : 'locked'}" ${t.name === p.tier ? 'aria-current="true" style="border-color:var(--cyan)"' : ''}>${frame({ base: d.base, glow: d.glow, mark: 'none' }, { size: 44, tier: t.name })}<span style="font-size:12px">${esc(t.name)}</span><small class="muted" style="font-size:10px">${t.badges} badge${t.badges === 1 ? '' : 's'}</small></li>`).join('')}</ol></div>
   <div class="raised" style="padding:16px;display:grid;gap:10px">
    <label class="label" for="callsign">Callsign</label>
    ${p.signedIn ? `<input id="callsign" type="text" maxlength="16" value="${esc(d.callsign)}" placeholder="letters_numbers_underscores" data-act="draft-input" data-key="callsign" autocomplete="off"><p class="note">3 to 16 letters, numbers and underscores. Changeable once every seven days. Shown instead of your name everywhere in the Range.</p>` : `<input id="callsign" type="text" value="guest" disabled><p class="note">Visitors play as \u201cguest\u201d. <a href="/my-progress" target="_top">Sign in</a> to pick a callsign that is yours.</p>`}
    <div class="row"><button type="button" class="btn primary" data-act="save-operator">Save operator</button><button type="button" class="btn quiet" data-act="reset-operator">Reset</button></div>
   </div>
  </section>
 </div>`;
}
async function saveOperator() {
 const d = S.draft; if (!d) return;
 try {
  if (signedIn()) { S.me = await api('/operator', { method: 'PUT', body: { callsign: d.callsign.trim(), base: d.base, glow: d.glow, mark: d.mark } }); toast('Operator saved'); }
  else { S.guest.operator = { callsign: 'guest', base: d.base, glow: d.glow, mark: d.mark }; saveGuest(); toast('Operator saved for this visit'); }
  S.draft = null; setView('hub');
 } catch (error) { toast(error.message); }
}

// --- stack ----------------------------------------------------------------------------------------------------
function renderStack() {
 const p = profile(), E = S.E;
 const chosen = S.stackDraft || (S.stackDraft = [...p.stack]);
 const focus = systemOf(S.stackFocus || chosen[0]);
 const lvl = p.levels[focus.id];
 const moves = focus.moves.map((m, i) => ({ m, locked: i >= 3 && lvl.level < E.rules.fourthMoveLevel }));
 return `<div class="row between" style="padding:22px 0 16px"><div><p class="kicker">Cyber Range</p><h2>Your stack</h2></div><p class="note">Field any three systems from the lab. Every system is open from your first match.</p></div>
 <div class="two" style="grid-template-columns:minmax(0,1fr) minmax(0,420px)">
  <div class="stack" style="gap:22px">
   <section><div class="row between"><h3>Fielded</h3><span class="chip">${chosen.length} of 3</span></div>
    <ol class="plain grid cols-3" style="margin-top:10px">${chosen.map(id => { const s = systemOf(id); return `<li class="raised" style="display:flex;align-items:center;gap:10px;padding:12px">${sysArt(id, { size: 44 })}<span><b>${esc(s.name)}</b><br><span class="label" style="color:${typeColor(s.type)}">${esc(s.type)}, Lv ${p.levels[id].level}</span></span></li>`; }).join('')}</ol>
   </section>
   <section><div class="row between"><h3>The lab</h3><span class="note">Tap a system to read its card; tap again to field it.</span></div>
    <div class="sysgrid" style="margin-top:10px">${S.catalog.systems.map(s => `<button type="button" class="sys" data-act="focus-system" data-id="${s.id}" aria-pressed="${focus.id === s.id}">${sysArt(s.id, { size: 52 })}<b style="font-size:14px">${esc(s.name)}</b><span class="t" style="color:${typeColor(s.type)}">${esc(s.type)}</span>${chosen.includes(s.id) ? '<span class="chip"><span class="dot"></span>Fielded</span>' : ''}</button>`).join('')}
    <div class="sys" style="border-style:dashed;justify-content:center;color:var(--muted);font-size:12px;text-align:center">Seven systems, the same ones in the System Hub. No others.</div></div>
   </section>
  </div>
  <section class="panel hud stack"><span class="corner"></span>
   <div class="row" style="gap:16px">${sysArt(focus.id, { size: 110 })}<div class="stack" style="gap:8px;min-width:0"><h2>${esc(focus.name)}</h2><div class="row" style="gap:6px">${typeChip(focus.type)}<span class="chip">Lv ${lvl.level}</span></div><p class="note">${esc(focus.lab)}. Weak to ${esc(E.weakTo(focus.id).join(' and '))}: ${esc(S.catalog.why[focus.type] || '')}</p></div></div>
   <div class="grid cols-2"><div class="raised" style="padding:12px"><span class="label">Integrity</span><br><b style="font-size:20px">${E.maxIntegrity(focus.id, lvl.level)}</b></div><div class="raised" style="padding:12px"><span class="label">Fourth move</span><br><b style="font-size:20px">${lvl.level >= E.rules.fourthMoveLevel ? 'Open' : 'Lv 4'}</b></div></div>
   <div><span class="label">Moves</span><ul class="plain movelist" style="margin-top:8px">${moves.map(({ m, locked }) => `<li class="${locked ? 'locked' : ''}"><span><b>${esc(m.name)}</b><br><span class="note">${esc(m.about)}</span></span><span class="mono" style="font-size:11px;color:${typeColor(m.type)};white-space:nowrap">${esc(m.type)}, ${kindLabel(m, E)}${locked ? ', Lv 4' : ''}</span></li>`).join('')}</ul></div>
   <div class="raised" style="padding:12px"><div class="row between"><span class="label">To Lv ${Math.min(E.rules.maxLevel, lvl.level + 1)}</span><span class="mono" style="font-size:11px">${lvl.level >= E.rules.maxLevel ? 'Max level' : `${E.rules.levelCards - lvl.toNext} of ${E.rules.levelCards} cards`}</span></div><div class="meter thin" style="margin-top:6px"><i style="width:${lvl.level >= E.rules.maxLevel ? 100 : Math.round(100 * (E.rules.levelCards - lvl.toNext) / E.rules.levelCards)}%"></i></div><p class="note" style="margin-top:6px">Levels come from reviewing this system\u2019s deck in the Range. Nothing else counts.</p></div>
   <div class="row"><button type="button" class="btn ${chosen.includes(focus.id) ? '' : 'primary'}" data-act="toggle-field" data-id="${focus.id}">${chosen.includes(focus.id) ? 'Take out of the stack' : 'Field this system'}</button><button type="button" class="btn small" data-act="deck" data-system="${focus.id}">Review its deck</button></div>
   <div class="row"><button type="button" class="btn primary" data-act="save-stack" ${chosen.length === 3 ? '' : 'disabled'}>Save stack</button><span class="note">${chosen.length === 3 ? '' : 'Pick three to save.'}</span></div>
  </section>
 </div>`;
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
 return `<div class="row between" style="padding:22px 0 16px"><div><p class="kicker">Cyber Range</p><h2>Checkpoints</h2></div><div class="row"><span class="note">Take them in any order. Each badge moves you up a tier.</span><span class="chip">${p.badges.length} of ${S.catalog.residents.length} badges</span></div></div>
 <ol class="plain badges">${S.catalog.residents.map(r => { const earned = p.badges.includes(r.id); return `<li class="resident">${frame(r, { size: 64, tier: earned ? 'Operator' : 'Recruit' })}<b>${esc(r.callsign)}</b><span class="label" style="color:${typeColor(r.type)}">${esc(r.type)}</span><q>${esc(r.line)}</q><span class="row" style="gap:4px;justify-content:center">${r.stack.map(e => sysArt(e.system, { size: 24 })).join('')}</span><span class="chip" ${earned ? 'style="border-color:var(--cyan);color:var(--ink)"' : ''}>${earned ? `Badge earned${p.badgeWins[r.id] > 1 ? ', ' + p.badgeWins[r.id] + ' wins' : ''}` : r.pool ? 'Asks RMF questions' : 'Not tried yet'}</span><button type="button" class="btn small ${earned ? '' : 'primary'}" data-act="challenge" data-id="${r.id}" style="width:100%">${earned ? 'Rematch' : 'Challenge'}</button></li>`; }).join('')}</ol>
 <section class="grid cols-3" style="margin-top:18px">
  <div class="raised stack" style="padding:18px;gap:8px"><b style="font-size:16px">Sparring</b><p class="note">A bot match with your own stack. Pick the bot\u2019s type to practise the matchups you keep losing.</p><div class="row" style="gap:6px;margin-top:auto">${['Identity', 'Network', 'Trust', 'Visibility', 'Endpoint'].map(t => `<button type="button" class="btn small" data-act="spar" data-type="${t}">${t}</button>`).join('')}</div></div>
  <div class="raised stack" style="padding:18px;gap:8px"><b style="font-size:16px">Run</b><p class="note">One stack, no repairs between fights. How many residents can you clear before it falls?</p><button type="button" class="btn small" data-act="run" style="margin-top:auto;align-self:flex-start">Start a run</button></div>
  <div class="raised stack" style="padding:18px;gap:8px"><b style="font-size:16px">Today\u2019s encounter</b><p class="note">The daily challenge, one question, the same as the morning post.</p><button type="button" class="btn small" data-act="view" data-view="hub" style="margin-top:auto;align-self:flex-start">Play today\u2019s</button></div>
 </section>
 ${p.signedIn ? '' : signInNote('keep your badges')}`;
}

// --- battle ----------------------------------------------------------------------------------------------------
const botStackFor = type => {
 const of = S.catalog.systems.filter(s => s.type === type).map(s => s.id);
 const rest = S.catalog.systems.filter(s => s.type !== type).map(s => s.id).sort(() => Math.random() - 0.5);
 return [...of, ...rest].slice(0, 3).map(system => ({ system, level: 2 }));
};
const botOperator = () => ({ callsign: ['nullroute', 'sysvol', 'kerb_tkt', 'vlan30', 'dfsr'][Math.floor(Math.random() * 5)], base: ['hood', 'visor', 'headset', 'goggles'][Math.floor(Math.random() * 4)], glow: 'magenta', mark: 'none' });
function myStack(p) { return p.stack.map(system => ({ system, level: p.levels[system]?.level || 1 })); }
function startBattle(opponent, { run = null, carry = null } = {}) {
 const p = profile(), E = S.E;
 const b = E.createBattle({ a: { stack: myStack(p), callsign: p.callsign, operator: p.operator }, b: { stack: opponent.stack, callsign: opponent.callsign, operator: opponent.operator, pool: opponent.pool || null } });
 if (carry) { b.sides.a.stack = carry.map(s => ({ ...s })); b.sides.a.active = Math.max(0, carry.findIndex(s => !s.down)); }
 S.battle = { state: b, opponent, run, phase: 'pick', picks: {}, answers: {}, question: null, used: new Set(), events: [], explain: null, deadline: 0, timer: null, botPick: null, result: null };
 S.view = 'battle';
 beginPick();
}
function stopTimer() { if (S.battle?.timer) { clearInterval(S.battle.timer); S.battle.timer = null; } }
function startTimer(ms, onExpire) {
 const b = S.battle; stopTimer(); b.deadline = Date.now() + ms;
 b.timer = setInterval(() => { const left = b.deadline - Date.now(); const el = $('#timer'); if (el) { el.textContent = fmt(left); el.classList.toggle('low', left < 5000); } if (left <= 0) { stopTimer(); onExpire(); } }, 100);
}
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return '00:' + String(s).padStart(2, '0'); };
function beginPick() {
 const b = S.battle, E = S.E, st = b.state, me = st.sides.a;
 b.phase = 'pick'; b.picks = {}; b.answers = {}; b.question = null; b.explain = null; b.myAnswer = null;
 // The bot picks first; if it's Noisy its pick is shown. If I'm Noisy it waits to see mine (counter-picks).
 b.botPick = st.sides.a.telegraph ? null : E.botPick(st, 'b');
 render();
 if (E.mustSwap(me) && !E.canSwap(me) && st.sides.a.stack.every(s => s.down)) return;
 startTimer(E.rules.pickMs, () => { const moves = E.availableMoves(me); if (E.mustSwap(me)) choosePick({ swap: me.stack.findIndex(s => !s.down) }); else choosePick({ move: (moves.find(m => m.kind === 'light') || moves[0]).id }); });
}
async function choosePick(pick) {
 const b = S.battle, E = S.E, st = b.state; if (b.phase !== 'pick') return;
 stopTimer();
 b.picks.a = pick;
 b.picks.b = b.botPick || (() => { // Noisy: the bot sees my pick and leans into what my active system is weak to.
  const choice = E.botPick(st, 'b'); return choice; })();
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
 const b = S.battle, E = S.E; if (b.phase !== 'answer' || b.myAnswer) return;
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
 const b = S.battle, E = S.E, st = b.state;
 // The bot answers the question my move sends it (or its own repair question) by chance, per difficulty.
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
  const el = target ? $(`#active-${target}`) : null;
  if (!el) continue;
  if (e.kind === 'hit') { el.classList.add('shake'); const n = document.createElement('span'); n.className = 'dmg'; n.textContent = `-${e.damage}`; el.appendChild(n); }
  if (e.kind === 'resisted') { el.classList.add('shake'); const n = document.createElement('span'); n.className = 'dmg'; n.textContent = `-${e.counter + e.backfire}`; el.appendChild(n); const other = $(`#active-${e.by}`); other?.classList.add('flare'); }
  if (e.kind === 'repair' && e.correct) { const n = document.createElement('span'); n.className = 'dmg good'; n.textContent = `+${e.heal}`; $(`#active-${e.who}`)?.appendChild(n); }
 }
}
async function finishBattle() {
 const b = S.battle, E = S.E, st = b.state, p = profile();
 const won = st.over.winner === 'a';
 const op = b.opponent;
 let awarded = 0, badge = null, text;
 try {
  if (op.kind === 'resident') {
   if (signedIn() && S.me.operator) { const r = await api('/result', { body: { mode: 'checkpoint', resident: op.id, won } }); S.me = r; awarded = r.awarded; badge = r.badge; }
   else if (!signedIn()) { const first = won && !S.guest.badges.includes(op.id); if (won) { if (first) { S.guest.badges.push(op.id); badge = op.id; } S.guest.wins[op.id] = (S.guest.wins[op.id] || 0) + 1; } awarded = E.pointsFor('checkpoint', { won, first }); S.guest.points += awarded; saveGuest(); }
   if (b.run) { if (won) { b.run.cleared += 1; } }
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
 text = won ? `You win${awarded ? `, +${awarded} points` : ''}${badge ? `. Badge earned: ${residentOf(badge)?.callsign || badge}` : ''}.` : st.over.winner === null ? 'A draw: both stacks fell together.' : `${esc(op.callsign)} wins${awarded ? `, +${awarded} points` : ''}.`;
 b.result = { won, awarded, badge, text, stack: st.sides.a.stack.map(s => ({ ...s })) };
}
function nextTurn() { const b = S.battle; if (!b || b.phase !== 'resolve') return; if (b.state.over) return; b.state.sides.a.telegraph = b.state.sides.a.status?.name === 'Noisy'; beginPick(); }
function nextInRun() {
 const b = S.battle; if (!b?.run || b.run.done) return;
 b.run.index += 1;
 const r = residentOf(b.run.order[b.run.index]);
 startBattle({ kind: 'resident', id: r.id, callsign: r.callsign, operator: r, stack: r.stack, pool: r.pool || null }, { run: b.run, carry: b.result.stack });
}
function renderBattle() {
 const b = S.battle, E = S.E, st = b.state, me = st.sides.a, them = st.sides.b, p = profile();
 const mine = E.activeOf(me), theirs = E.activeOf(them);
 const side = (s, who) => { const a = E.activeOf(s), sys = systemOf(a.system), threat = who === 'b'; return `
  <div class="side ${who === 'a' ? 'me' : 'them'}">
   <div class="who">${frame(s.operator || { base: 'hood', glow: 'magenta', mark: 'none' }, { size: 48, threat, tier: who === 'a' ? p.tier : 'Operator', hit: threat && b.events.some(e => e.kind === 'hit' && e.on === 'b') })}<span><b>${esc(s.callsign)}</b><br><small class="muted">${who === 'a' ? p.tier + ' ' + p.rank : esc(b.opponent.tier || 'Resident')}, ${E.standing(s)} of 3 standing${s.status ? `, ${esc(s.status.name)}` : ''}</small></span></div>
   <div class="active" id="active-${who}">${sysArt(a.system, { size: 110, down: a.down, threat })}<div class="stack" style="gap:6px;flex:1;min-width:0"><div class="row between"><span class="name">${esc(sys.name)}</span><span class="mono muted" style="font-size:11px">Lv ${a.level}</span></div><div class="row" style="gap:6px">${typeChip(sys.type)}<span class="chip">Weak to ${esc(E.weakTo(a.system).join(', '))}</span></div><div class="row between label"><span>Integrity</span><span style="color:var(--ink)">${a.integrity} / ${a.max}</span></div><div class="meter ${threat ? 'threat' : ''}"><i style="width:${Math.round(100 * a.integrity / a.max)}%"></i></div></div></div>
   <div class="bench">${s.stack.map((x, i) => i === s.active ? '' : `<div class="b ${x.down ? 'down' : ''}">${sysArt(x.system, { size: 30, down: x.down, threat })}<span style="flex:1;min-width:0"><b>${esc(systemOf(x.system).name)}</b><br><span class="mono muted" style="font-size:11px">${x.down ? 'Down' : x.integrity + '/' + x.max}</span></span>${who === 'a' && b.phase === 'pick' && !x.down && (E.canSwap(me) || E.mustSwap(me)) ? `<button type="button" class="btn small" data-act="pick" data-swap="${i}">Swap</button>` : ''}</div>`).join('')}</div>
  </div>`; };
 const matchup = `${mine.down ? '' : `${E.effectiveness(systemOf(mine.system).moves[0].type, theirs.system) > 1 ? '' : ''}`}`;
 const phase = b.phase;
 let bottom = '';
 if (phase === 'pick') {
  const moves = E.availableMoves(me);
  bottom = `<section class="panel"><div class="row between"><h2 class="kicker" style="margin:0">${esc(systemOf(mine.system).name)}\u2019s moves</h2><span class="note">Both sides pick at once. Then you answer the question coming at you.${them.telegraph && b.botPick ? ` <b style="color:var(--threat)">${esc(b.opponent.callsign)} is Noisy: ${b.botPick.swap != null ? 'swapping' : esc(E.moveById(theirs.system, b.botPick.move)?.name)}.</b>` : ''}</span></div>
   ${E.mustSwap(me) ? '<p class="note" style="margin-top:10px">Your system is down. Swap in another to carry on.</p>' : `<div class="moves" style="margin-top:12px">${moves.map(m => { const se = E.effectiveness(m.type, theirs.system) > 1; return `<button type="button" class="move" data-act="pick" data-move="${m.id}"><span class="top"><b>${esc(m.name)}</b><span class="kind">${esc(m.type)}, ${kindLabel(m, E)}</span></span><span class="note">${esc(m.about)}</span>${se ? `<span class="se"><span class="dot" style="display:inline-block"></span> Super effective against ${esc(systemOf(theirs.system).type)}</span>` : ''}</button>`; }).join('')}</div>`}
   ${me.status ? `<p class="note" style="margin-top:10px">You are ${esc(me.status.name)}: ${esc(E.rules.statuses[me.status.name].about)}</p>` : ''}
  </section>`;
 } else if (phase === 'answer') {
  const q = b.question;
  bottom = `<section class="panel hud"><span class="corner"></span>
   ${q ? `<div class="stack" style="gap:8px"><div class="incoming ${q.repair ? 'mine' : ''}"><span class="dot ${q.repair ? '' : 't'}"></span><span><b>${q.repair ? `Your ${esc(q.forMove.name)}` : `Incoming: ${esc(q.forMove.name)}`}</b><br><span class="mono muted" style="font-size:11px">${esc(q.forMove.type)}, ${kindLabel(q.forMove, E)}${q.repair ? '. Answer it to repair; a right answer also resists what is coming at you.' : E.effectiveness(q.forMove.type, mine.system) > 1 ? '. Super effective against ' + esc(systemOf(mine.system).type) + '.' : '. Neutral.'}</span></span></div></div>
   <p style="font-size:19px;line-height:1.45;font-weight:500;margin:14px 0">${esc(q.prompt)}</p>
   <div class="moves">${q.options.map((o, i) => `<button type="button" class="opt ${b.myAnswer?.choice === 'ABCD'[i] ? 'picked' : ''}" data-act="answer" data-choice="${'ABCD'[i]}" ${b.myAnswer ? 'disabled' : ''}><span class="key">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
   <div class="row between" style="margin-top:12px"><span class="mono" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--cyan)">Resist: 0 damage, counter ${E.rules.counter} (${E.rules.fastCounter} under 5 s)</span><span class="mono" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--threat)">${q.repair ? 'Miss: no repair' : `Miss: ${Math.floor((E.rules[q.forMove.kind].damage || 0) * E.effectiveness(q.forMove.type, mine.system))} damage`}</span></div>` : `<p class="note">${b.picks.a?.swap != null ? 'You swapped. The incoming move lands on the system you brought in.' : 'Nothing to answer this turn.'}</p>`}
  </section>`;
 } else {
  const over = st.over;
  const lines = b.events.map(e => describeEvent(e, st, b));
  bottom = `<section class="panel"><div class="row between"><h2 class="kicker" style="margin:0">Turn ${st.log.at(-1)?.turn} resolved</h2>${over ? '' : `<button type="button" class="btn primary" data-act="next-turn">Next turn</button>`}</div>
   <ul class="plain stack" style="gap:6px;margin-top:12px;font-size:14px;color:var(--muted)">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
   ${b.explain ? `<div class="explain" style="margin-top:12px"><b>${b.myAnswer?.correct ? 'Resisted.' : b.explain.answer ? `Missed. The answer is ${esc(b.explain.answer)}.` : 'No answer in time.'}</b> ${esc(b.explain.explanation || '')} ${b.explain.lesson ? `<a href="${esc(b.explain.lesson)}" target="_top">See the lesson</a>` : ''}</div>` : ''}
   ${over ? `<div class="raised stack" style="padding:16px;margin-top:14px;gap:10px"><b style="font-size:20px">${b.result?.text || ''}</b>${b.run && !b.run.done ? `<p class="note">Run: ${b.run.cleared} of ${b.run.order.length} cleared. Your stack carries its damage into the next fight.</p><div class="row"><button type="button" class="btn primary" data-act="next-run">Next resident</button><button type="button" class="btn quiet" data-act="view" data-view="checkpoints">Stop the run</button></div>` : b.run ? `<p class="note">Run over: ${b.run.cleared} of ${b.run.order.length} residents cleared.</p>` : ''}<div class="row"><button type="button" class="btn" data-act="rematch">Play again</button><button type="button" class="btn quiet" data-act="view" data-view="checkpoints">Back to checkpoints</button></div>${p.signedIn ? '' : signInNote('keep your badges and points')}</div>` : ''}
  </section>`;
 }
 return `<div class="row between" style="padding:16px 0 12px"><div class="row"><button type="button" class="btn small quiet" data-act="leave" aria-label="Leave the duel">Leave</button><div><p class="kicker" style="margin:0">Cyber Range</p><b>${b.run ? `Run, fight ${b.run.index + 1} of ${b.run.order.length}` : b.opponent.kind === 'resident' ? 'Checkpoint' : 'Sparring'}: ${esc(p.callsign)} against ${esc(b.opponent.callsign)}</b></div></div>
  <div class="row" style="gap:14px"><span class="label">Turn ${st.turn} of ${st.maxTurns}</span><span class="label" style="color:var(--ink)">${phase === 'pick' ? 'Pick a move' : phase === 'answer' ? 'Answer' : phase === 'over' ? 'Over' : 'Resolving'}</span></div>
  <div class="row" style="gap:14px"><span class="label">${phase === 'pick' ? 'To pick' : phase === 'answer' ? 'To answer' : ''}</span><span class="timer" id="timer">${phase === 'pick' || phase === 'answer' ? fmt(b.deadline - Date.now()) : ''}</span></div></div>
 <section class="panel hud threat stage" style="margin-bottom:16px"><span class="corner"></span>
  ${side(me, 'a')}
  <div class="vs"><span class="label">Matchup</span><span class="big">VS</span><span class="note">${esc(systemOf(mine.system).type)} into ${esc(systemOf(theirs.system).type)}: ${E.weakTo(theirs.system).includes(systemOf(mine.system).type) ? 'super effective' : 'neutral'}.<br>${esc(systemOf(theirs.system).type)} into ${esc(systemOf(mine.system).type)}: ${E.weakTo(mine.system).includes(systemOf(theirs.system).type) ? 'super effective' : 'neutral'}.</span>${phase === 'pick' ? `<span class="note" style="color:var(--threat)">${esc(b.opponent.callsign)} is choosing</span>` : ''}${matchup}</div>
  ${side(them, 'b')}
 </section>
 ${bottom}
 ${st.log.length ? `<section class="raised" style="padding:14px 16px;margin-top:14px"><span class="label">Turn log</span><ol class="plain log" style="margin-top:8px">${st.log.slice().reverse().map(t => t.events.map(e => `<li><b>T${t.turn}</b> ${describeEvent(e, st, b)}</li>`).join('')).join('')}</ol></section>` : ''}`;
}
function describeEvent(e, st, b) {
 const E = S.E, name = who => who === 'a' ? 'You' : esc(b.opponent.callsign);
 const moveName = (who, id) => esc(E.moveById(E.activeOf(st.sides[who]).system, id)?.name || S.catalog.systems.flatMap(s => s.moves).find(m => m.id === id)?.name || id);
 switch (e.kind) {
  case 'swap': return `${name(e.who)} swapped in ${esc(systemOf(e.system).name)}.`;
  case 'wasted': return `${name(e.who)} lost the turn (${e.reason}).`;
  case 'repair': return `${name(e.who)} used ${moveName(e.who, e.move)}: ${e.correct ? `+${e.heal} integrity` : 'no repair'}.`;
  case 'resisted': return `${name(e.by)} resisted ${moveName(e.who, e.move)}${e.fast ? ' in under 5 s' : ''}: ${name(e.who)} take${e.who === 'a' ? '' : 's'} ${e.counter}${e.backfire ? ` and ${e.backfire} backfire` : ''}.`;
  case 'status': return `${name(e.who)} used ${moveName(e.who, e.move)}: ${name(e.on)} ${e.on === 'a' ? 'are' : 'is'} ${e.status}.`;
  case 'hit': return `${name(e.who)} used ${moveName(e.who, e.move)}${e.superEffective ? ', super effective' : ''}: ${e.damage} damage${e.swapped ? ' on the system swapped in' : ''}.`;
  case 'down': return `<span class="t">${esc(systemOf(e.system).name)} is down.</span>`;
  default: return '';
 }
}

// --- decks -----------------------------------------------------------------------------------------------------
async function openDeck(system) {
 S.view = 'decks'; S.deck = { system, cards: null, queue: [], index: 0, revealed: false, reviewed: 0 }; render();
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
 if (!d) return `<div class="row between" style="padding:22px 0 16px"><div><p class="kicker">Cyber Range</p><h2>Decks</h2></div><p class="note">One deck per system, cut from the lesson checks. Twenty cards reviewed is a level.</p></div>
  <div class="sysgrid">${S.catalog.systems.map(s => `<button type="button" class="sys" data-act="deck" data-system="${s.id}">${sysArt(s.id, { size: 52 })}<b style="font-size:14px">${esc(s.name)}</b><span class="t" style="color:${typeColor(s.type)}">${esc(s.type)}</span><span class="chip">Lv ${p.levels[s.id].level}, ${p.levels[s.id].cards} reviewed</span></button>`).join('')}</div>${p.signedIn ? '' : signInNote('keep your schedule and levels')}`;
 const s = systemOf(d.system), card = d.queue[d.index];
 const lvl = p.levels[s.id];
 return `<div class="row between" style="padding:22px 0 16px"><div class="row"><button type="button" class="btn small quiet" data-act="view" data-view="decks">Decks</button><div><p class="kicker" style="margin:0">Deck</p><h2>${esc(s.name)}</h2></div></div><div class="row"><span class="chip">Lv ${lvl.level}</span><span class="chip">${d.reviewed} reviewed this sitting</span><span class="chip">${d.dueCount ?? 0} due</span></div></div>
 <div class="meter thin"><i style="width:${lvl.level >= E.rules.maxLevel ? 100 : Math.round(100 * (E.rules.levelCards - lvl.toNext) / E.rules.levelCards)}%"></i></div>
 ${!d.cards ? '<p class="note" style="margin-top:16px">Loading cards\u2026</p>' : !card ? `<section class="panel" style="margin-top:16px"><b>Deck complete for now.</b><p class="note">Every card has a next date. Come back when it is due, or pick another system.</p><p class="row" style="margin-top:12px"><button type="button" class="btn" data-act="deck" data-system="${s.id}">Go round again</button><button type="button" class="btn quiet" data-act="view" data-view="decks">Other decks</button></p></section>` : `
 <section class="panel hud card" style="margin-top:16px"><span class="corner"></span>
  <div class="row between"><span class="kicker" style="margin:0">Card ${d.index + 1} of ${d.queue.length}</span><span class="mono muted" style="font-size:11px">${card.schedule?.reviews ? `seen ${card.schedule.reviews} time${card.schedule.reviews === 1 ? '' : 's'}` : 'new'}</span></div>
  <p class="flip" style="margin:12px 0">${esc(card.prompt)}</p>
  ${d.revealed ? `<div class="stack" style="gap:8px">${card.options.map((o, i) => `<div class="opt ${'ABCD'[i] === card.answer ? 'right' : ''}" style="min-height:44px"><span class="key">${'ABCD'[i]}</span><span>${esc(o)}</span></div>`).join('')}</div><div class="explain" style="margin-top:12px"><b>Answer ${esc(card.answer)}.</b> ${esc(card.explanation)} ${card.lesson ? `<a href="${esc(card.lesson)}" target="_top">See the lesson</a>` : ''}</div>
   <p class="label" style="margin:14px 0 8px">How did that feel?</p>
   <div class="rate">${[['again', 'Again', '10 min'], ['hard', 'Hard', '2 days'], ['good', 'Good', '5 days'], ['easy', 'Easy', '12 days']].map(([id, name, when]) => `<button type="button" class="${id}" data-act="rate" data-rating="${id}">${name}<small>${when}</small></button>`).join('')}</div>` : `<p class="row"><button type="button" class="btn primary" data-act="reveal">Show answer</button></p>`}
 </section>`}
 ${p.signedIn ? '' : signInNote('keep your schedule and levels')}`;
}
async function rateCard(rating) {
 const d = S.deck, card = d.queue[d.index]; if (!card) return;
 try {
  if (signedIn()) { if (!S.me.operator) throw new Error('Build your operator first.'); const r = await api('/deck', { body: { questionId: card.id, rating } }); S.me = r; if (r.awarded) toast(`+${r.awarded} points`); }
  else { const next = S.E.schedule(rating, S.guest.schedule[card.id] || {}); S.guest.schedule[card.id] = next; S.guest.cards[card.id.split('-')[0] === card.system ? card.system : card.system] = (S.guest.cards[card.system] || 0) + 1; saveGuest(); }
 } catch (error) { toast(error.message); }
 d.reviewed += 1; d.index += 1; d.revealed = false; render();
}

// --- ladder ----------------------------------------------------------------------------------------------------
function renderLadder() {
 const L = S.ladder;
 return `<div class="row between" style="padding:22px 0 16px"><div><p class="kicker">Cyber Range</p><h2>This week\u2019s ladder</h2></div><span class="note">Points come from checkpoints, sparring, runs, the daily encounter and decks. The ladder clears every Sunday at 23:59; tiers stay.</span></div>
 <section class="panel">${!L ? '<p class="note">Loading\u2026</p>' : L.entries.length ? `<table><thead><tr><th>Place</th><th>Operator</th><th>Tier</th><th class="right">Points</th></tr></thead><tbody>${L.entries.map(e => `<tr${L.mine && e.callsign === L.mine.callsign ? ' class="me"' : ''}><td class="mono" style="color:var(--cyan)">${String(e.place).padStart(2, '0')}</td><td><span class="row" style="gap:8px">${frame(e.operator, { size: 28, tier: e.tier })}<b>${esc(e.callsign)}</b></span></td><td class="muted">${esc(e.tier)} ${e.rank}</td><td class="mono right">${e.points}</td></tr>`).join('')}</tbody></table>${L.mine ? `<p class="note" style="margin-top:12px">You: ${esc(L.mine.callsign)}, ${L.mine.points} points${L.mine.place ? `, place ${L.mine.place}` : ''}.</p>` : ''}` : '<p class="note">Nobody has scored this week yet.</p>'}
 ${signedIn() ? '' : '<p class="note" style="margin-top:12px">Guests play but do not appear here. <a href="/my-progress" target="_top">Sign in</a> to take a place.</p>'}</section>`;
}

// --- render & events -------------------------------------------------------------------------------------------
function render() {
 const top = $('#top'), view = $('#view');
 if (!S.catalog) { view.innerHTML = '<p class="note" style="padding:40px 0">Loading the Range\u2026</p>'; return; }
 top.innerHTML = renderTop();
 view.innerHTML = S.view === 'hub' ? renderHub() : S.view === 'operator' ? renderOperator() : S.view === 'stack' ? renderStack() : S.view === 'checkpoints' ? renderCheckpoints() : S.view === 'decks' ? renderDecks() : S.view === 'ladder' ? renderLadder() : S.view === 'battle' ? renderBattle() : renderHub();
 document.body.dataset.view = S.view;
 postHeight();
}
// Hosted in /cyber-range's iframe: tell the page how tall the Range is after every render (and whenever the body resizes).
function postHeight() {
 if (window.parent === window) return;
 const height = Math.ceil(document.body.getBoundingClientRect().height) + 16;
 window.parent.postMessage({ type: 'sbd-range-height', height }, window.location.origin);
}
if (window.parent !== window && 'ResizeObserver' in window) new ResizeObserver(() => postHeight()).observe(document.body);
async function refreshLadder() { try { S.ladder = await api('/ladder'); } catch { /* shown as empty */ } }
async function refreshMe() { try { S.me = await api('/me'); } catch { S.me = { reader: false }; } }
document.addEventListener('click', async event => {
 const el = event.target.closest('[data-act]'); if (!el) return;
 const act = el.dataset.act, d = el.dataset;
 if (act === 'view') { stopTimer(); S.battle = S.view === 'battle' && d.view === 'checkpoints' ? null : S.battle; if (d.view === 'decks') S.deck = null; if (d.view === 'ladder') refreshLadder().then(render); if (d.view === 'stack') S.stackDraft = null; if (d.view === 'operator') S.draft = null; setView(d.view); }
 else if (act === 'daily') answerDaily(d.choice);
 else if (act === 'draft') { S.draft[d.key] = d.value; S.poke += 1; render(); }
 else if (act === 'poke') { S.poke += 1; render(); }
 else if (act === 'save-operator') saveOperator();
 else if (act === 'reset-operator') { S.draft = null; render(); }
 else if (act === 'focus-system') { if (S.stackFocus === d.id) toggleField(d.id); else { S.stackFocus = d.id; render(); } }
 else if (act === 'toggle-field') toggleField(d.id);
 else if (act === 'save-stack') saveStack();
 else if (act === 'challenge') { const r = residentOf(d.id); startBattle({ kind: 'resident', id: r.id, callsign: r.callsign, operator: r, stack: r.stack, pool: r.pool || null, tier: 'Resident' }); }
 else if (act === 'spar') { const type = d.type || ['Identity', 'Network', 'Trust', 'Visibility', 'Endpoint'][Math.floor(Math.random() * 5)]; const op = botOperator(); startBattle({ kind: 'bot', callsign: op.callsign, operator: op, stack: botStackFor(type), tier: type + ' bot' }); }
 else if (act === 'run') { const order = S.catalog.residents.map(r => r.id); const r = residentOf(order[0]); startBattle({ kind: 'resident', id: r.id, callsign: r.callsign, operator: r, stack: r.stack, pool: r.pool || null, tier: 'Resident' }, { run: { order, index: 0, cleared: 0, done: false } }); }
 else if (act === 'pick') choosePick(d.swap != null ? { swap: Number(d.swap) } : { move: d.move });
 else if (act === 'answer') submitAnswer(d.choice);
 else if (act === 'next-turn') nextTurn();
 else if (act === 'next-run') nextInRun();
 else if (act === 'rematch') { const op = S.battle.opponent; S.battle = null; startBattle(op); }
 else if (act === 'leave') { stopTimer(); S.battle = null; setView('checkpoints'); }
 else if (act === 'deck') openDeck(d.system);
 else if (act === 'reveal') { S.deck.revealed = true; render(); }
 else if (act === 'rate') rateCard(d.rating);
});
document.addEventListener('input', event => { const el = event.target.closest('[data-act="draft-input"]'); if (el && S.draft) { S.draft[el.dataset.key] = el.value; const b = $('.panel.hud b'); if (b) b.textContent = el.value || 'callsign'; } });
window.addEventListener('beforeunload', event => { if (S.battle && !S.battle.state.over) { event.preventDefault(); event.returnValue = ''; } });

(async function boot() {
 S.guest = loadGuest();
 render();
 try {
  const [catalog, me] = await Promise.all([api('/catalog'), api('/me').catch(() => ({ reader: false }))]);
  S.catalog = catalog; S.E = createEngine(catalog); S.me = me;
  const hash = location.hash.replace('#', '');
  if (['stack', 'checkpoints', 'decks', 'ladder', 'operator'].includes(hash)) S.view = hash;
  render();
  const [daily] = await Promise.all([api('/daily').catch(() => null), refreshLadder()]);
  S.daily = daily; render();
 } catch (error) { $('#view').innerHTML = `<p class="note" style="padding:40px 0">${esc(error.message)}</p>`; }
})();
