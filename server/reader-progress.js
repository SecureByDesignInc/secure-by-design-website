import {progressCatalog,validProfile} from '../content/progress-catalog.js';
import {getReader,readAuthBody} from './reader-auth.js';
import {bookmarkCatalog} from '../content/bookmark-catalog.js';
import {readerCommunityMembership} from './community-membership.js';
import moves from '../content/progress-moves.json' with {type:'json'};
const bookmarkIds=new Set(bookmarkCatalog.map(item=>item.id));
const ids=new Set(progressCatalog.map(item=>item.id));
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff'}});
export async function readerProgressApi(request,env){
 const url=new URL(request.url);let reader;
 try{reader=await getReader(request,env)}catch{return reply({error:'Your saved progress is unavailable. Please try again.'},503)}
 const userId=reader?.id;
 const route=url.pathname.replace(/\/$/,'');
 if(!userId)return request.method==='GET'&&route==='/api/reader-progress'?reply({user:null,profile:null,records:[],bookmarks:[]}):reply({error:'Sign in to save your progress.'},401);
 if(!env.DB)return reply({error:'Your saved progress is unavailable. Please try again.'},503);
 try{
  if(request.method==='GET'&&route==='/api/reader-progress'){
   const [profile,rows,bookmarks]=await Promise.all([env.DB.prepare('SELECT profile FROM reader_profiles WHERE user_id=?').bind(userId).first(),env.DB.prepare('SELECT item_id AS id, status, updated_at AS updatedAt FROM reader_progress WHERE user_id=? ORDER BY updated_at DESC').bind(userId).all(),env.DB.prepare('SELECT item_id AS id,saved,updated_at AS updatedAt FROM reader_bookmarks WHERE user_id=?').bind(userId).all()]);
   return reply({user:{email:reader.email,needsPassword:!!reader.needsPassword},membership:await readerCommunityMembership(env,reader),profile:profile?JSON.parse(profile.profile):null,records:rows.results,bookmarks:bookmarks.results.filter(item=>bookmarkIds.has(item.id)).map(item=>({...item,saved:!!item.saved}))});
  }
  if(!['PUT','DELETE'].includes(request.method))return reply({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'This request could not be verified. Reload the page and try again.'},403);
  if(request.method==='DELETE'&&route==='/api/reader-progress'){
   await env.DB.batch([env.DB.prepare('DELETE FROM reader_progress WHERE user_id=?').bind(userId),env.DB.prepare('DELETE FROM reader_profiles WHERE user_id=?').bind(userId)]);
   return reply({saved:true});
  }
  if(request.method!=='PUT')return reply({error:'Not found.'},404);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Use JSON for this request.'},415);
  let data;try{data=await readAuthBody(request)}catch{return reply({error:'Check your progress update.'},400)}
  const now=new Date().toISOString();
  if(route.startsWith('/api/reader-progress/bookmarks/')){
   let id;try{id=decodeURIComponent(route.slice('/api/reader-progress/bookmarks/'.length))}catch{return reply({error:'Unknown resource.'},400)}
   if(!bookmarkIds.has(id)||!data||Object.keys(data).length!==1||typeof data.saved!=='boolean')return reply({error:'Choose a valid resource.'},400);
   await env.DB.prepare('INSERT INTO reader_bookmarks (user_id,item_id,saved,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET saved=excluded.saved,updated_at=excluded.updated_at').bind(userId,id,data.saved?1:0,now).run();
  }else if(route==='/api/reader-progress/profile'){
   if(!validProfile(data))return reply({error:'Choose a valid experience level, goal, and pace.'},400);
   await env.DB.prepare('INSERT INTO reader_profiles (user_id,profile,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET profile=excluded.profile,updated_at=excluded.updated_at').bind(userId,JSON.stringify(data),now).run();
  }else{
   let id;try{id=decodeURIComponent(route.slice('/api/reader-progress/'.length))}catch{return reply({error:'Unknown reading item.'},400)}
   id=moves.moved[id]??id; // a guide page cached before the October 2026 restructure
   if(!ids.has(id)||!data||Object.keys(data).length!==1||!['in_progress','completed'].includes(data.status))return reply({error:'Choose a valid reading item and status.'},400);
   await env.DB.prepare('INSERT INTO reader_progress (user_id,item_id,status,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at').bind(userId,id,data.status,now).run();
  }
  return reply({saved:true});
 }catch(error){console.error('Reader progress storage failed',error);return reply({error:'Progress could not be loaded or saved. Please try again.'},503)}
}
