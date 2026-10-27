// Cyber Range API: /api/range/... (owner direction, 26 October 2026).
//
// The Range is a place to test what you know, open to everyone from the first visit. Nothing here reads or writes
// course progress. Solo play needs no account: the catalog, questions, answer checks, the daily encounter and the
// ladder are public; an account is what makes an operator, a stack, levels, badges and points last.
//
// Questions leave this handler without their answer or explanation; POST /answer returns both for one choice.
// Scores are computed here from the rules in content/range/systems.json (lib/range/engine.mjs), never taken from the
// page, and daily caps keep solo results honest enough for a weekly ladder.
import {createEngine} from './engine.mjs';

const LIMITS={body:8192,callsign:16,exclude:40,sparringPerDay:10,checkpointRematchPerDay:6,runsPerDay:5,ladder:20};
const BASES=['visor','hood','headset','goggles'],GLOWS=['cyan','ice','blue','magenta'],MARKS=['none','trace','node'];
const RESERVED=new Set(['guest','admin','secure','securebydesign','support','staff','owner','moderator']);
class Bad extends Error{constructor(message,status=400){super(message);this.status=status}}
const reply=(data,status=200,extra={})=>Response.json(data,{status,headers:{'cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff',...extra}});
const nowIso=()=>new Date().toISOString();
const dayKey=d=>d.toISOString().slice(0,10);
const json=(value,fallback)=>{try{return value==null?fallback:JSON.parse(value)}catch{return fallback}};
const rid=()=>crypto.randomUUID();

async function readBody(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Bad('Send JSON.',415);
 const text=await request.text();
 if(new TextEncoder().encode(text).length>LIMITS.body)throw new Bad('That is too much to send at once.',413);
 if(!text)return {};
 let data;try{data=JSON.parse(text)}catch{throw new Bad('Check the request and try again.')}
 if(!data||Array.isArray(data)||typeof data!=='object')throw new Bad('Check the request and try again.');
 return data;
}
const oneOf=(value,options,label)=>{if(!options.includes(value))throw new Bad(`Choose a valid ${label}.`);return value;};

// What the page may see of a question before it is answered.
const publicQuestion=q=>({id:q.id,system:q.system,type:q.type,difficulty:q.difficulty,move:q.move,prompt:q.prompt,options:q.options});
const fullQuestion=q=>({...publicQuestion(q),answer:q.answer,explanation:q.explanation,lesson:q.lesson||''});

export function createRangeApi(content){
 const E=createEngine(content.systems);
 const questions=content.questions.questions,residents=content.residents.residents;
 const byId=Object.fromEntries(questions.map(q=>[q.id,q]));
 const residentById=Object.fromEntries(residents.map(r=>[r.id,r]));
 const catalog={
  systems:content.systems.systems,types:content.systems.types,chart:content.systems.chart,why:content.systems.why,rules:content.systems.rules,
  points:content.systems.points,tiers:content.systems.tiers,ranks:content.systems.ranks,bot:content.systems.bot,residents,
  bases:BASES,glows:GLOWS,marks:MARKS,counts:{questions:questions.length},
 };

 async function ensureOperator(env,reader){
  return env.DB.prepare('SELECT * FROM range_operators WHERE account_id=?').bind(reader.id).first();
 }
 const operatorRow=r=>r&&({callsign:r.callsign,base:r.base,glow:r.glow,mark:r.mark,stack:json(r.stack,[]),lifetimePoints:r.lifetime_points,callsignChangedAt:r.callsign_changed_at,createdAt:r.created_at});

 // Everything the page needs about a signed-in learner, in one shape.
 async function me(env,reader){
  const op=await ensureOperator(env,reader);
  if(!op)return {reader:true,operator:null};
  const [levels,badges,week,due,todayDaily]=await Promise.all([
   env.DB.prepare('SELECT system,cards_reviewed FROM range_system_progress WHERE account_id=?').bind(reader.id).all(),
   env.DB.prepare('SELECT resident,earned_at,wins FROM range_badges WHERE account_id=?').bind(reader.id).all(),
   env.DB.prepare('SELECT points FROM range_points WHERE account_id=? AND week=?').bind(reader.id,E.weekKey()).first(),
   env.DB.prepare('SELECT COUNT(*) AS n FROM range_cards WHERE account_id=? AND due_at<=?').bind(reader.id,nowIso()).first(),
   env.DB.prepare('SELECT correct FROM range_daily WHERE account_id=? AND day=?').bind(reader.id,dayKey(new Date())).first(),
  ]);
  const cards=Object.fromEntries((levels.results||[]).map(r=>[r.system,r.cards_reviewed]));
  const badgeList=(badges.results||[]).map(r=>({resident:r.resident,earnedAt:r.earned_at,wins:r.wins}));
  return {
   reader:true,operator:operatorRow(op),
   levels:Object.fromEntries(content.systems.systems.map(s=>[s.id,{cards:cards[s.id]||0,level:E.levelFor(cards[s.id]||0),toNext:E.cardsToNext(cards[s.id]||0)}])),
   badges:badgeList,tier:E.tierFor(badgeList.length),rank:E.rankFor(op.lifetime_points),weekPoints:week?.points||0,lifetimePoints:op.lifetime_points,
   cardsDue:due?.n||0,dailyAnswered:todayDaily?(todayDaily.correct?'correct':'wrong'):null,dailyStreak:await dailyStreak(env,reader),
  };
 }
 async function dailyStreak(env,reader){
  const rows=await env.DB.prepare('SELECT day FROM range_daily WHERE account_id=? AND correct=1 ORDER BY day DESC LIMIT 60').bind(reader.id).all();
  const days=new Set((rows.results||[]).map(r=>r.day));
  let streak=0;const d=new Date();
  if(!days.has(dayKey(d)))d.setUTCDate(d.getUTCDate()-1);
  while(days.has(dayKey(d))){streak++;d.setUTCDate(d.getUTCDate()-1);}
  return streak;
 }
 async function award(env,reader,mode,outcome,points){
  if(points<=0)return;
  const now=nowIso(),week=E.weekKey();
  await env.DB.batch([
   env.DB.prepare('INSERT INTO range_points (account_id,week,points) VALUES (?,?,?) ON CONFLICT(account_id,week) DO UPDATE SET points=points+excluded.points').bind(reader.id,week,points),
   env.DB.prepare('UPDATE range_operators SET lifetime_points=lifetime_points+?,updated_at=? WHERE account_id=?').bind(points,now,reader.id),
   env.DB.prepare('INSERT INTO range_results (id,account_id,mode,outcome,points,created_at) VALUES (?,?,?,?,?,?)').bind(rid(),reader.id,mode,JSON.stringify(outcome),points,now),
  ]);
 }
 const countToday=async(env,reader,mode,extra='')=>(await env.DB.prepare(`SELECT COUNT(*) AS n FROM range_results WHERE account_id=? AND mode=? AND created_at>=?${extra}`).bind(reader.id,mode,dayKey(new Date())+'T00:00:00.000Z').first())?.n||0;

 // Validates and saves an operator; the callsign is unique, case-insensitive, and changes once every seven days.
 async function saveOperator(env,reader,data){
  const callsign=String(data.callsign??'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(callsign))throw new Bad('A callsign is 3 to 16 letters, numbers and underscores.');
  if(RESERVED.has(callsign.toLowerCase()))throw new Bad('That callsign is reserved.');
  const base=oneOf(data.base,BASES,'base'),glow=oneOf(data.glow,GLOWS,'glow'),mark=oneOf(data.mark??'none',MARKS,'mark');
  const now=nowIso();
  const existing=await ensureOperator(env,reader);
  const taken=await env.DB.prepare('SELECT account_id FROM range_operators WHERE callsign=? AND account_id<>?').bind(callsign,reader.id).first();
  if(taken)throw new Bad('That callsign is taken.',409);
  if(!existing){
   await env.DB.prepare('INSERT INTO range_operators (account_id,callsign,base,glow,mark,stack,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(reader.id,callsign,base,glow,mark,'[]',now,now).run();
  }else{
   const renaming=existing.callsign.toLowerCase()!==callsign.toLowerCase();
   if(renaming&&existing.callsign_changed_at&&Date.now()-Date.parse(existing.callsign_changed_at)<7*86400000)throw new Bad('A callsign can change once every seven days.',429);
   await env.DB.prepare('UPDATE range_operators SET callsign=?,base=?,glow=?,mark=?,callsign_changed_at=COALESCE(?,callsign_changed_at),updated_at=? WHERE account_id=?').bind(callsign,base,glow,mark,renaming?now:null,now,reader.id).run();
  }
  return me(env,reader);
 }

 // A solo result: points by the rules, a badge on a checkpoint's first win, daily caps on repeatable modes.
 async function recordResult(env,reader,data){
  const mode=oneOf(data.mode,['sparring','checkpoint','run','daily','deck'],'mode');
  const op=await ensureOperator(env,reader);if(!op)throw new Bad('Build your operator first.',409);
  let outcome,points,extra={};
  if(mode==='sparring'){
   outcome={won:!!data.won};
   points=(await countToday(env,reader,'sparring'))>=LIMITS.sparringPerDay?0:E.pointsFor(mode,outcome);
  }else if(mode==='checkpoint'){
   const resident=residentById[data.resident];if(!resident)throw new Bad('Choose a checkpoint.');
   const badge=await env.DB.prepare('SELECT wins FROM range_badges WHERE account_id=? AND resident=?').bind(reader.id,resident.id).first();
   outcome={won:!!data.won,resident:resident.id,first:!!data.won&&!badge};
   if(outcome.won){
    if(!badge)await env.DB.prepare('INSERT INTO range_badges (account_id,resident,earned_at) VALUES (?,?,?)').bind(reader.id,resident.id,nowIso()).run();
    else await env.DB.prepare('UPDATE range_badges SET wins=wins+1 WHERE account_id=? AND resident=?').bind(reader.id,resident.id).run();
   }
   const rematches=await countToday(env,reader,'checkpoint'," AND outcome LIKE '%\"first\":false%'");
   points=outcome.first?E.pointsFor(mode,outcome):rematches>=LIMITS.checkpointRematchPerDay?0:E.pointsFor(mode,outcome);
   extra={badge:outcome.first?resident.id:null};
  }else if(mode==='run'){
   outcome={cleared:Math.max(0,Math.min(residents.length,Math.floor(Number(data.cleared)||0)))};
   points=(await countToday(env,reader,'run'))>=LIMITS.runsPerDay?0:E.pointsFor(mode,outcome);
  }else if(mode==='daily'){
   const q=byId[data.questionId];if(!q)throw new Bad('Choose a question.');
   if(q.id!==E.dailyQuestion(questions).id)throw new Bad('That is not today\u2019s encounter.');
   const day=dayKey(new Date());
   const already=await env.DB.prepare('SELECT correct FROM range_daily WHERE account_id=? AND day=?').bind(reader.id,day).first();
   if(already)throw new Bad('You already played today\u2019s encounter.',409);
   const correct=String(data.choice)===q.answer;
   await env.DB.prepare('INSERT INTO range_daily (account_id,day,correct) VALUES (?,?,?)').bind(reader.id,day,correct?1:0).run();
   outcome={correct,streak:correct?await dailyStreak(env,reader):0};
   points=E.pointsFor(mode,outcome);
   extra={correct,answer:q.answer,explanation:q.explanation,lesson:q.lesson||''};
  }else throw new Bad('Deck reviews are recorded through /deck.');
  await award(env,reader,mode,outcome,points);
  return {...await me(env,reader),awarded:points,...extra};
 }

 // Spaced repetition on the account: schedules the card and counts it toward the system's level and the day's points.
 async function reviewCard(env,reader,data){
  const q=byId[data.questionId];if(!q||q.system==='rmf')throw new Bad('Choose a card.');
  const rating=oneOf(data.rating,['again','hard','good','easy'],'rating');
  const op=await ensureOperator(env,reader);if(!op)throw new Bad('Build your operator first.',409);
  const card=await env.DB.prepare('SELECT interval_days,reviews FROM range_cards WHERE account_id=? AND question_id=?').bind(reader.id,q.id).first();
  const next=E.schedule(rating,{intervalDays:card?.interval_days||0,reviews:card?.reviews||0});
  const now=nowIso();
  const todayCards=(await env.DB.prepare("SELECT COUNT(*) AS n FROM range_results WHERE account_id=? AND mode='deck' AND created_at>=?").bind(reader.id,dayKey(new Date())+'T00:00:00.000Z').first())?.n||0;
  await env.DB.batch([
   env.DB.prepare('INSERT INTO range_cards (account_id,question_id,system,interval_days,due_at,reviews,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(account_id,question_id) DO UPDATE SET interval_days=excluded.interval_days,due_at=excluded.due_at,reviews=excluded.reviews,updated_at=excluded.updated_at').bind(reader.id,q.id,q.system,next.intervalDays,next.due,next.reviews,now),
   env.DB.prepare('INSERT INTO range_system_progress (account_id,system,cards_reviewed) VALUES (?,?,1) ON CONFLICT(account_id,system) DO UPDATE SET cards_reviewed=cards_reviewed+1').bind(reader.id,q.system),
   env.DB.prepare('INSERT INTO range_results (id,account_id,mode,outcome,points,created_at) VALUES (?,?,?,?,?,?)').bind(rid(),reader.id,'deck',JSON.stringify({questionId:q.id,rating}),0,now),
  ]);
  // Two points per ten cards, ten a day at most: paid on every tenth card.
  const reviewed=todayCards+1;
  const points=reviewed%10===0?Math.min(content.systems.points.deckPerTenCards,Math.max(0,content.systems.points.deckDailyCap-E.pointsFor('deck',{cards:reviewed-10}))):0;
  if(points)await env.DB.batch([
   env.DB.prepare('INSERT INTO range_points (account_id,week,points) VALUES (?,?,?) ON CONFLICT(account_id,week) DO UPDATE SET points=points+excluded.points').bind(reader.id,E.weekKey(),points),
   env.DB.prepare('UPDATE range_operators SET lifetime_points=lifetime_points+?,updated_at=? WHERE account_id=?').bind(points,now,reader.id),
  ]);
  return {...await me(env,reader),due:next.due,intervalDays:next.intervalDays,awarded:points};
 }

 async function ladder(env,reader){
  const week=E.weekKey();
  const rows=await env.DB.prepare('SELECT o.callsign,o.base,o.glow,o.mark,o.lifetime_points,p.points,(SELECT COUNT(*) FROM range_badges b WHERE b.account_id=o.account_id) AS badges FROM range_points p JOIN range_operators o ON o.account_id=p.account_id WHERE p.week=? ORDER BY p.points DESC,o.callsign ASC LIMIT ?').bind(week,LIMITS.ladder).all();
  const entries=(rows.results||[]).map((r,i)=>({place:i+1,callsign:r.callsign,operator:{base:r.base,glow:r.glow,mark:r.mark},tier:E.tierFor(r.badges),rank:E.rankFor(r.lifetime_points),points:r.points}));
  let mine=null;
  if(reader){
   const op=await ensureOperator(env,reader);
   if(op){
    const my=await env.DB.prepare('SELECT points FROM range_points WHERE account_id=? AND week=?').bind(reader.id,week).first();
    const above=my?(await env.DB.prepare('SELECT COUNT(*) AS n FROM range_points WHERE week=? AND points>?').bind(week,my.points).first())?.n||0:null;
    mine={callsign:op.callsign,points:my?.points||0,place:my?above+1:null};
   }
  }
  return {week,resetsAt:'Sunday 23:59',entries,mine};
 }

 return async function rangeHandler(request,env,reader){
  const url=new URL(request.url),method=request.method;
  const path=url.pathname.replace(/^\/api\/range\/?/,'').replace(/\/$/,'');
  if(method!=='GET'&&!env.LOCAL&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return reply({error:'This request could not be verified. Reload the page and try again.'},403);
  try{
   if(method==='GET'){
    if(path==='catalog')return reply(catalog,200,{'cache-control':'public, max-age=300'});
    if(path==='question'){
     const system=url.searchParams.get('system'),moveId=url.searchParams.get('move'),pool=url.searchParams.get('pool')||null;
     const move=E.moveById(system,moveId);if(!move)throw new Bad('Choose a system and one of its moves.');
     if(pool&&pool!=='rmf')throw new Bad('Choose a valid pool.');
     const exclude=new Set((url.searchParams.get('exclude')||'').split(',').filter(Boolean).slice(0,LIMITS.exclude));
     const q=E.pickQuestion(questions,{system,move,pool,exclude});
     return reply(q?publicQuestion(q):{error:'No question is available.'},q?200:404);
    }
    if(path==='daily'){
     const q=E.dailyQuestion(questions);
     const out={question:publicQuestion(q),day:dayKey(new Date())};
     if(reader){const state=await me(env,reader);out.answered=state.dailyAnswered;out.streak=state.dailyStreak;}
     return reply(out);
    }
    if(path==='cards'){
     // Flashcards show their answers, so this is the one place full questions are served. Signed-in learners get
     // their schedule; everyone gets a system's cards.
     const system=url.searchParams.get('system');
     const list=questions.filter(q=>q.system!=='rmf'&&(!system||q.system===system));
     if(!list.length)throw new Bad('Choose a lab system.');
     let schedule={};
     if(reader){const rows=await env.DB.prepare('SELECT question_id,due_at,interval_days,reviews FROM range_cards WHERE account_id=?').bind(reader.id).all();schedule=Object.fromEntries((rows.results||[]).map(r=>[r.question_id,{due:r.due_at,intervalDays:r.interval_days,reviews:r.reviews}]));}
     return reply({cards:list.map(q=>({...fullQuestion(q),schedule:schedule[q.id]||null}))});
    }
    if(path==='ladder')return reply(await ladder(env,reader));
    if(path==='me')return reply(reader?await me(env,reader):{reader:false});
    throw new Bad('Not found.',404);
   }
   if(method==='POST'&&path==='answer'){
    const data=await readBody(request);
    const q=byId[data.id];if(!q)throw new Bad('Choose a question.');
    const choice=String(data.choice??'');
    return reply({id:q.id,correct:choice===q.answer,answer:q.answer,explanation:q.explanation,lesson:q.lesson||''});
   }
   if(!reader)throw new Bad('Sign in to save that.',401);
   if(method==='PUT'&&path==='operator')return reply(await saveOperator(env,reader,await readBody(request)));
   if(method==='PUT'&&path==='stack'){
    const data=await readBody(request);
    const stack=E.stack(Array.isArray(data.systems)?data.systems.map(String):[]).map(s=>s.system);
    const op=await ensureOperator(env,reader);if(!op)throw new Bad('Build your operator first.',409);
    await env.DB.prepare('UPDATE range_operators SET stack=?,updated_at=? WHERE account_id=?').bind(JSON.stringify(stack),nowIso(),reader.id).run();
    return reply(await me(env,reader));
   }
   if(method==='POST'&&path==='result')return reply(await recordResult(env,reader,await readBody(request)));
   if(method==='POST'&&path==='deck')return reply(await reviewCard(env,reader,await readBody(request)));
   throw new Bad('Not found.',404);
  }catch(error){
   if(error instanceof Bad)return reply({error:error.message},error.status);
   if(error?.message?.startsWith('A stack is'))return reply({error:error.message},400);
   console.error('range',error);
   return reply({error:'The Range is unavailable. Please try again.'},503);
  }
 };
}
export const rangeLimits=LIMITS;
