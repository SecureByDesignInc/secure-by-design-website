// Cyber Range API: /api/range/... (owner direction, 30 October 2026).
//
// The Range is one thing: a battle against the computer, seven multiple-choice rounds, open to everyone. Nothing here
// reads or writes course progress. The page asks for a battle's questions, which leave this handler without their
// answer or explanation, and checks each choice through POST /answer. Every player gets a random operator and
// callsign: a visitor's live on their device; a signed-in learner's are assigned here once and kept on the account.
// Owner direction, 30 October 2026: no operator picker, no checkpoints, stacks, decks, ladder, badges or points.

const LIMITS={body:4096,rounds:7};
const BASES=['visor','hood','headset','goggles'],GLOWS=['cyan','ice','blue'],MARKS=['none','trace','node'];
// Callsigns: two words from the lab's vocabulary and two digits (owner direction, 30 October 2026).
const CALL_A=['null','root','zero','byte','hex','packet','cipher','kernel','proxy','stack','token','shell','port','ghost','static','subnet','beacon','vlan'];
const CALL_B=['runner','vector','signal','fox','echo','wire','spark','shade','drift','pulse','hook','relay','wraith','nomad','cache','trace','lynx','glitch'];
class Bad extends Error{constructor(message,status=400){super(message);this.status=status}}
const reply=(data,status=200,extra={})=>Response.json(data,{status,headers:{'cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff',...extra}});
const nowIso=()=>new Date().toISOString();
const pick=list=>list[crypto.getRandomValues(new Uint32Array(1))[0]%list.length];
const randomCallsign=()=>`${pick(CALL_A)}_${pick(CALL_B)}${10+crypto.getRandomValues(new Uint32Array(1))[0]%90}`;

async function readBody(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Bad('Send JSON.',415);
 const text=await request.text();
 if(new TextEncoder().encode(text).length>LIMITS.body)throw new Bad('That is too much to send at once.',413);
 if(!text)return {};
 let data;try{data=JSON.parse(text)}catch{throw new Bad('Check the request and try again.')}
 if(!data||Array.isArray(data)||typeof data!=='object')throw new Bad('Check the request and try again.');
 return data;
}

export function createRangeApi(content){
 const questions=content.questions.questions,residents=content.residents.residents;
 const byId=Object.fromEntries(questions.map(q=>[q.id,q]));
 const systemType=Object.fromEntries(content.systems.systems.map(s=>[s.id,s.type]));
 const topicOf=q=>q.system==='rmf'?'Authorization':systemType[q.system]||'Security';
 // What the page may see of a question before it is answered.
 const publicQuestion=q=>({id:q.id,topic:topicOf(q),prompt:q.prompt,options:q.options});
 const catalog={
  rounds:LIMITS.rounds,
  types:content.systems.types,
  residents:residents.map(r=>({id:r.id,callsign:r.callsign,type:r.type,base:r.base,glow:r.glow,mark:r.mark,line:r.line})),
  counts:{questions:questions.length},
 };

 const operatorOf=r=>r&&({callsign:r.callsign,base:r.base,glow:r.glow,mark:r.mark});
 // A signed-in learner's operator: the one on the account, or a random one assigned now and kept.
 async function assignedOperator(env,reader){
  const existing=await env.DB.prepare('SELECT callsign,base,glow,mark FROM range_operators WHERE account_id=?').bind(reader.id).first();
  if(existing)return operatorOf(existing);
  const reserved=new Set(residents.map(r=>r.callsign.toLowerCase()));
  for(let attempt=0;attempt<12;attempt++){
   const callsign=attempt<10?randomCallsign():`${randomCallsign()}${10+attempt}`;
   if(reserved.has(callsign.toLowerCase()))continue;
   const taken=await env.DB.prepare('SELECT 1 AS x FROM range_operators WHERE callsign=?').bind(callsign).first();
   if(taken)continue;
   const now=nowIso(),op={callsign,base:pick(BASES),glow:pick(GLOWS),mark:pick(MARKS)};
   try{
    await env.DB.prepare('INSERT INTO range_operators (account_id,callsign,base,glow,mark,stack,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(reader.id,op.callsign,op.base,op.glow,op.mark,'[]',now,now).run();
   }catch(error){
    // Another tab assigned one first, or the callsign was taken a moment ago: read again or try another.
    const again=await env.DB.prepare('SELECT callsign,base,glow,mark FROM range_operators WHERE account_id=?').bind(reader.id).first();
    if(again)return operatorOf(again);
    continue;
   }
   return op;
  }
  throw new Error('No callsign could be assigned.');
 }

 return async function rangeHandler(request,env,reader){
  const url=new URL(request.url),method=request.method;
  const path=url.pathname.replace(/^\/api\/range\/?/,'').replace(/\/$/,'');
  if(method!=='GET'&&!env.LOCAL&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return reply({error:'This request could not be verified. Reload the page and try again.'},403);
  try{
   if(method==='GET'){
    if(path==='catalog')return reply(catalog,200,{'cache-control':'public, max-age=300'});
    if(path==='battle'){
     // Seven different questions from the whole bank, in a random order.
     const pool=questions.slice();
     for(let i=pool.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
     return reply({rounds:LIMITS.rounds,questions:pool.slice(0,LIMITS.rounds).map(publicQuestion)});
    }
    if(path==='me')return reply(reader?{reader:true,operator:await assignedOperator(env,reader)}:{reader:false});
    throw new Bad('Not found.',404);
   }
   if(method==='POST'&&path==='answer'){
    const data=await readBody(request);
    const q=byId[data.id];if(!q)throw new Bad('Choose a question.');
    const choice=String(data.choice??'');
    return reply({id:q.id,correct:choice===q.answer,answer:q.answer,explanation:q.explanation,lesson:q.lesson||''});
   }
   throw new Bad('Not found.',404);
  }catch(error){
   if(error instanceof Bad)return reply({error:error.message},error.status);
   console.error('range',error);
   return reply({error:'The Range is unavailable. Please try again.'},503);
  }
 };
}
export const rangeLimits=LIMITS;
