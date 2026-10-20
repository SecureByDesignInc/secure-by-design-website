import {getNativeReader,nativeRequestAllowed} from './native-auth.js';
import {readAuthBody} from './reader-auth.js';
import {guideIds,validGuideState,readGuideBody} from './reader-progress.js';
import training from '../content/training-progress.json' with {type:'json'};
import {bookmarkCatalog} from '../content/bookmark-catalog.js';
import moves from '../content/progress-moves.json' with {type:'json'};
const ids=new Set([...training.map(item=>item.id),...['ad','monitoring','rmf'].flatMap(path=>[1,2,3].map(n=>`native:${path}-${n}`))]);
const bookmarkIds=new Set([...bookmarkCatalog.map(item=>item.id),'journal']);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
// Course-guide checks and notes (the same reader_guide_state rows the website's course guides keep), so a
// lesson's checklist and observations follow the learner between the app's lab mode and the website.
const GUIDE='/api/native-progress/guide/';
async function nativeGuideApi(request,env,id){
 if(!guideIds.has(id))return reply({error:'Unknown guide.'},404);
 if(!['GET','PUT'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(!env.DB)return reply({error:'Progress is temporarily unavailable.'},503);
 try{
  const reader=await getNativeReader(request,env);if(!reader)return reply({error:'Sign in again to sync your progress.'},401);
  if(request.method==='PUT'){
   if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Use JSON for this request.'},415);
   let body;try{body=await readGuideBody(request)}catch{return reply({error:'Check your guide notes. Each lesson note can hold up to 30,000 characters.'},400)}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||!validGuideState(body.state))return reply({error:'Check your guide notes and try again.'},400);
   await env.DB.prepare('INSERT INTO reader_guide_state (user_id,guide_id,state,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,guide_id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at').bind(reader.id,id,JSON.stringify(body.state),new Date().toISOString()).run();
  }
  const row=await env.DB.prepare('SELECT state,updated_at AS updatedAt FROM reader_guide_state WHERE user_id=? AND guide_id=?').bind(reader.id,id).first();
  return reply({accountId:reader.id,state:row?JSON.parse(row.state):null,updatedAt:row?.updatedAt??null});
 }catch{console.error('Native guide storage failed');return reply({error:'Your guide notes could not sync. Your device changes can be retried.'},503)}
}
export async function nativeProgressApi(request,env){
 if(!nativeRequestAllowed(request))return reply({error:'Use the Secure By Design app for this request.'},403);
 const pathname=new URL(request.url).pathname;
 if(pathname.startsWith(GUIDE))return nativeGuideApi(request,env,pathname.slice(GUIDE.length));
 if(pathname!=='/api/native-progress')return reply({error:'Not found.'},404);
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!env.DB)return reply({error:'Progress is temporarily unavailable.'},503);
 try{
  const reader=await getNativeReader(request,env);if(!reader)return reply({error:'Sign in again to sync your progress.'},401);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Use JSON for this request.'},415);
  let data;try{data=await readAuthBody(request)}catch{return reply({error:'Check your progress update.'},400)}
  // Older app builds still send the identifiers of lessons that moved to another course (October 2026
  // restructure, content/progress-moves.json): translate them, drop withdrawn ones, and merge duplicates
  // (a completed record wins) before validating, so one stale identifier never rejects the whole sync.
  if(data&&!Array.isArray(data)&&Array.isArray(data.records)&&data.records.some(item=>item&&(moves.moved[item.id]||moves.withdrawn.includes(item.id)))){
   // A translated record merges with the same lesson's current record, in either order; any other duplicate
   // is left in place for validation to reject.
   const out=[],translated=new Set();
   const merge=(twin,item)=>{if(item.status==='completed')twin.status='completed'};
   for(const item of data.records){
    if(item&&moves.withdrawn.includes(item.id))continue;
    const moved=item&&moves.moved[item.id],id=moved||item?.id;
    const twin=out.find(other=>other&&other.id===id);
    if(twin&&(moved||translated.has(id))){merge(twin,item);continue}
    if(moved)translated.add(id);
    out.push(moved?{...item,id}:item);
   }
   data.records=out;
  }
  if(!data||Array.isArray(data)||Object.keys(data).some(key=>!['records','bookmarks'].includes(key))||!Array.isArray(data.records)||!Array.isArray(data.bookmarks)||data.records.length>ids.size||data.bookmarks.length>bookmarkIds.size)return reply({error:'Check your progress update.'},400);
  if(data.records.some(item=>!item||Object.keys(item).length!==2||!ids.has(item.id)||!['in_progress','completed'].includes(item.status))||data.bookmarks.some(item=>!item||Object.keys(item).length!==2||!bookmarkIds.has(item.id)||typeof item.saved!=='boolean'))return reply({error:'Choose a known lesson or resource.'},400);
  if(new Set(data.records.map(item=>item.id)).size!==data.records.length||new Set(data.bookmarks.map(item=>item.id)).size!==data.bookmarks.length)return reply({error:'Send each item once.'},400);
  const now=new Date().toISOString();
  const writes=[...data.records.map(item=>env.DB.prepare("INSERT INTO reader_progress (user_id,item_id,status,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET status=CASE WHEN reader_progress.status='completed' THEN 'completed' ELSE excluded.status END,updated_at=excluded.updated_at").bind(reader.id,item.id,item.status,now)),...data.bookmarks.map(item=>env.DB.prepare('INSERT INTO reader_bookmarks (user_id,item_id,saved,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET saved=excluded.saved,updated_at=excluded.updated_at').bind(reader.id,item.id,item.saved?1:0,now))];
  if(writes.length)await env.DB.batch(writes);
  const [records,bookmarks]=await Promise.all([env.DB.prepare('SELECT item_id AS id,status,updated_at AS updatedAt FROM reader_progress WHERE user_id=?').bind(reader.id).all(),env.DB.prepare('SELECT item_id AS id,saved,updated_at AS updatedAt FROM reader_bookmarks WHERE user_id=?').bind(reader.id).all()]);
  return reply({accountId:reader.id,records:records.results.filter(item=>ids.has(item.id)),bookmarks:bookmarks.results.filter(item=>bookmarkIds.has(item.id)).map(item=>({...item,saved:!!item.saved}))});
 }catch{console.error('Native progress storage failed');return reply({error:'Progress could not sync. Your device changes can be retried.'},503)}
}
