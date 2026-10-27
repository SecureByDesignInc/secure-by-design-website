// Cyber Range stack-duel engine (owner direction, 26 October 2026). Pure functions over content/range/systems.json:
// no I/O, no globals, so the same code runs in the Worker (lib/range/api.mjs), in the page (public/range-app/) and
// in tests. The rules are the ones in "Cyber Range: Stack Duel Rules":
//  - a stack is three systems; each has integrity and up to four moves (the fourth opens at level 4);
//  - both sides pick at once, then each answers the question the other side's move sends (a repair question goes
//    to its own user); a correct answer resists for 0 and counters 10 (20 under five seconds); a resisted heavy
//    move backfires 15; a move of a type the target is weak to does 1.5x; a side that swaps makes no move and the
//    incoming move lands on the system swapped in without a resist chance;
//  - statuses Drift, Noisy and Isolated attach to the operator; the first side to put all three of the other's
//    systems down wins, or after 12 turns the side with more integrity left.
export const KINDS = ['light', 'heavy', 'repair', 'status'];

export function createEngine(content) {
 const rules = content.rules, systems = content.systems, chart = content.chart;
 const byId = Object.fromEntries(systems.map(s => [s.id, s]));
 const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
 const level = n => clamp(Math.floor(n) || 1, 1, rules.maxLevel);

 const systemById = id => byId[id] || null;
 const maxIntegrity = (id, lvl = 1) => byId[id].integrity + (level(lvl) - 1) * rules.levelIntegrity;
 const movesFor = (id, lvl = 1) => byId[id].moves.slice(0, level(lvl) >= rules.fourthMoveLevel ? 4 : 3);
 const moveById = (systemId, moveId) => byId[systemId]?.moves.find(m => m.id === moveId) || null;
 const weakTo = systemId => chart[byId[systemId].type] || [];
 const effectiveness = (moveType, targetSystemId) => weakTo(targetSystemId).includes(moveType) ? rules.superEffective : 1;
 const levelFor = cards => clamp(1 + Math.floor((cards || 0) / rules.levelCards), 1, rules.maxLevel);
 const cardsToNext = cards => levelFor(cards) >= rules.maxLevel ? 0 : rules.levelCards - ((cards || 0) % rules.levelCards);
 const tierFor = badges => { let tier = content.tiers[0]; for (const t of content.tiers) if ((badges || 0) >= t.badges) tier = t; return tier.name; };
 const rankFor = points => ['I', 'II', 'III'][content.ranks.filter(min => (points || 0) >= min).length - 1] || 'I';
 const answerWindow = (side, lvl) => (side.status?.name === 'Drift' ? rules.driftAnswerMs : rules.answerMs) + (level(lvl) >= rules.maxLevel ? rules.level5AnswerBonusMs : 0);

 // Validates a stack: exactly three distinct known systems with sane levels.
 function stack(entries) {
  if (!Array.isArray(entries) || entries.length !== 3) throw new Error('A stack is three systems.');
  const ids = entries.map(e => typeof e === 'string' ? e : e?.system);
  if (new Set(ids).size !== 3 || ids.some(id => !byId[id])) throw new Error('A stack is three different lab systems.');
  return entries.map(e => ({ system: typeof e === 'string' ? e : e.system, level: level(typeof e === 'string' ? 1 : e.level) }));
 }

 function createBattle({ a, b, maxTurns = rules.maxTurns }) {
  const side = (who, info) => ({
   who, callsign: info.callsign || who, operator: info.operator || null, pool: info.pool || null,
   stack: stack(info.stack).map(s => ({ ...s, integrity: maxIntegrity(s.system, s.level), max: maxIntegrity(s.system, s.level), down: false })),
   active: 0, status: null, telegraph: null,
  });
  return { turn: 1, maxTurns, sides: { a: side('a', a), b: side('b', b) }, log: [], over: null };
 }
 const activeOf = side => side.stack[side.active];
 const standing = side => side.stack.filter(s => !s.down).length;
 const totalIntegrity = side => side.stack.reduce((n, s) => n + s.integrity, 0);
 const canSwap = side => side.status?.name !== 'Isolated' && side.stack.some((s, i) => !s.down && i !== side.active);
 const mustSwap = side => activeOf(side).down && side.stack.some(s => !s.down);
 const availableMoves = side => mustSwap(side) ? [] : movesFor(activeOf(side).system, activeOf(side).level);
 const other = who => who === 'a' ? 'b' : 'a';

 // What each side faces this turn, after picks: the question to answer (by the other side's move, or its own repair).
 function questionsFor(state, picks) {
  const out = {};
  for (const who of ['a', 'b']) {
   const me = state.sides[who], them = state.sides[other(who)], mine = picks[who], theirs = picks[other(who)];
   const ask = (pick, side) => pick?.move ? { system: activeOf(side).system, move: moveById(activeOf(side).system, pick.move), pool: side.pool } : null;
   const incoming = theirs?.move && !mine?.swap ? ask(theirs, them) : null;
   const repair = mine?.move && moveById(activeOf(me).system, mine.move)?.kind === 'repair' ? ask(mine, me) : null;
   out[who] = repair || (incoming && incoming.move.kind !== 'repair' ? incoming : null);
  }
  return out;
 }

 // picks: {a:{move:id}|{swap:index}, b:...}; answers: {a:{correct,ms}|null, b:...} where each side's answer is to the
 // question questionsFor() gave it. Returns the events of the turn and advances state.
 function resolveTurn(state, picks, answers = {}) {
  if (state.over) throw new Error('The duel is over.');
  const events = [];
  const S = state.sides;
  // 1. Swaps first; an invalid or forbidden swap is a wasted turn.
  for (const who of ['a', 'b']) {
   const me = S[who], pick = picks[who] || {};
   if (pick.swap != null) {
    const target = me.stack[pick.swap];
    const allowed = target && !target.down && pick.swap !== me.active && (mustSwap(me) || canSwap(me));
    if (allowed) { me.active = pick.swap; events.push({ who, kind: 'swap', system: target.system }); }
    else events.push({ who, kind: 'wasted', reason: me.status?.name === 'Isolated' ? 'Isolated' : 'no swap' });
   } else if (mustSwap(me)) events.push({ who, kind: 'wasted', reason: 'down' });
  }
  // 2. Moves resolve at once.
  const damage = { a: 0, b: 0 }, heal = { a: 0, b: 0 }, status = { a: null, b: null };
  for (const who of ['a', 'b']) {
   const me = S[who], you = S[other(who)], pick = picks[who] || {};
   if (pick.swap != null || pick.move == null || mustSwap(me)) continue;
   const move = moveById(activeOf(me).system, pick.move);
   if (!move || !availableMoves(me).some(m => m.id === move.id)) { events.push({ who, kind: 'wasted', reason: 'no move' }); continue; }
   const spec = rules[move.kind];
   if (move.kind === 'repair') {
    const ok = !!answers[who]?.correct;
    if (ok) heal[who] += spec.heal;
    events.push({ who, kind: 'repair', move: move.id, correct: ok, heal: ok ? spec.heal : 0 });
    continue;
   }
   const mult = effectiveness(move.type, activeOf(you).system);
   const theirAnswer = picks[other(who)]?.swap != null ? null : answers[other(who)];
   const resisted = !!theirAnswer?.correct;
   if (resisted) {
    const fast = theirAnswer.ms != null && theirAnswer.ms <= rules.fastMs;
    const counter = fast ? rules.fastCounter : rules.counter;
    damage[who] += counter + (spec.backfire || 0);
    events.push({ who, kind: 'resisted', move: move.id, counter, fast, backfire: spec.backfire || 0, by: other(who) });
   } else if (move.kind === 'status') {
    status[other(who)] = { name: move.status, turns: rules.statuses[move.status].turns };
    events.push({ who, kind: 'status', move: move.id, status: move.status, on: other(who), swapped: picks[other(who)]?.swap != null });
   } else {
    const dealt = Math.floor(spec.damage * mult);
    damage[other(who)] += dealt;
    events.push({ who, kind: 'hit', move: move.id, damage: dealt, superEffective: mult > 1, on: other(who), swapped: picks[other(who)]?.swap != null });
   }
  }
  // 3. Settle: heal, then damage, then downs and statuses.
  for (const who of ['a', 'b']) {
   const me = S[who], sys = activeOf(me);
   if (heal[who]) sys.integrity = Math.min(sys.max, sys.integrity + heal[who]);
   if (damage[who]) sys.integrity = Math.max(0, sys.integrity - damage[who]);
   if (sys.integrity === 0 && !sys.down) { sys.down = true; events.push({ who, kind: 'down', system: sys.system }); }
   if (status[who]) me.status = status[who];
   else if (me.status && --me.status.turns <= 0) me.status = null;
   me.telegraph = me.status?.name === 'Noisy';
  }
  state.log.push({ turn: state.turn, events });
  // 4. Over?
  const aOut = standing(S.a) === 0, bOut = standing(S.b) === 0;
  if (aOut || bOut) state.over = { winner: aOut && bOut ? null : aOut ? 'b' : 'a', reason: 'down' };
  else if (state.turn >= state.maxTurns) {
   const ta = totalIntegrity(S.a), tb = totalIntegrity(S.b);
   state.over = { winner: ta === tb ? null : ta > tb ? 'a' : 'b', reason: 'turns', integrity: { a: ta, b: tb } };
  }
  else state.turn += 1;
  return events;
 }

 // The bot: prefers super effective moves, repairs when low, and resists by chance per difficulty.
 function botPick(state, who, rng = Math.random) {
  const me = state.sides[who], you = state.sides[other(who)];
  if (mustSwap(me)) return { swap: me.stack.findIndex(s => !s.down) };
  const sys = activeOf(me), moves = availableMoves(me);
  const weighted = moves.map(m => {
   let w = 1;
   if (m.kind === 'repair') w = sys.integrity < sys.max * 0.4 ? 3 : 0.3;
   else if (effectiveness(m.type, activeOf(you).system) > 1) w = 3;
   else if (m.kind === 'heavy') w = 1.2;
   return [m, w];
  });
  let roll = rng() * weighted.reduce((n, [, w]) => n + w, 0);
  for (const [m, w] of weighted) { roll -= w; if (roll <= 0) return { move: m.id }; }
  return { move: moves[0].id };
 }
 const botAnswer = (difficulty, rng = Math.random) => ({ correct: rng() < content.bot.resist[difficulty || 'medium'], ms: 4000 + Math.floor(rng() * 11000) });

 // Picks a question for a move: that system's questions for the move first, then the move's type and difficulty,
 // then the type alone. `pool` names a bank slice (signoff's RMF questions) that replaces the system's own.
 function pickQuestion(questions, { system, move, pool, exclude = new Set(), rng = Math.random }) {
  const difficulty = rules[move.kind]?.difficulty || 'medium';
  const fresh = list => list.filter(q => !exclude.has(q.id));
  const tiers = pool
   ? [questions.filter(q => q.system === pool && q.difficulty === difficulty), questions.filter(q => q.system === pool)]
   : [questions.filter(q => q.system === system && q.move === move.id), questions.filter(q => q.type === move.type && q.difficulty === difficulty), questions.filter(q => q.type === move.type)];
  for (const list of tiers) { const open = fresh(list); if (open.length) return open[Math.floor(rng() * open.length)]; }
  for (const list of tiers) if (list.length) return list[Math.floor(rng() * list.length)];
  return null;
 }

 // Today's encounter: one question for the whole day, the same for everyone.
 function dailyQuestion(questions, date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  let h = 2166136261; for (const c of key) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return questions[h % questions.length];
 }

 const points = content.points;
 function pointsFor(mode, outcome = {}) {
  switch (mode) {
   case 'duel': return outcome.won ? points.duelWin : points.duelLoss;
   case 'sparring': return outcome.won ? points.sparringWin : 0;
   case 'checkpoint': return outcome.won ? (outcome.first ? points.checkpointFirst : points.checkpointRematch) : 0;
   case 'run': return (outcome.cleared || 0) * points.runPerResident;
   case 'daily': return outcome.correct ? points.dailyCorrect + ((outcome.streak || 0) >= 7 ? points.dailyStreakBonus : 0) : 0;
   case 'drill': return points.drillScored;
   case 'deck': return Math.min(points.deckDailyCap, Math.floor((outcome.cards || 0) / 10) * points.deckPerTenCards);
   default: return 0;
  }
 }

 // Spaced repetition: Again 10 minutes, Hard 2 days, Good 5 days, Easy 12 days on a first review; later reviews grow.
 const DAY = 86400000;
 function schedule(rating, card = {}, now = new Date()) {
  const prev = card.intervalDays || 0;
  const next = rating === 'again' ? { ms: 10 * 60000, intervalDays: 0 }
   : rating === 'hard' ? { intervalDays: Math.max(2, Math.round(prev * 1.2)) }
   : rating === 'easy' ? { intervalDays: Math.max(12, Math.round(prev * 4)) }
   : { intervalDays: Math.max(5, Math.round(prev * 2.5)) };
  const due = new Date(now.getTime() + (next.ms ?? next.intervalDays * DAY)).toISOString();
  return { intervalDays: next.intervalDays, due, reviews: (card.reviews || 0) + 1 };
 }

 // ISO week key, e.g. 2026-W43, for the weekly ladder that clears Sunday 23:59.
 function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - start) / DAY + 1) / 7)).padStart(2, '0')}`;
 }

 return { rules, systems, chart, systemById, maxIntegrity, movesFor, moveById, weakTo, effectiveness, levelFor, cardsToNext, tierFor, rankFor,
  answerWindow, stack, createBattle, activeOf, standing, totalIntegrity, canSwap, mustSwap, availableMoves, questionsFor, resolveTurn,
  botPick, botAnswer, pickQuestion, dailyQuestion, pointsFor, schedule, weekKey, other };
}
