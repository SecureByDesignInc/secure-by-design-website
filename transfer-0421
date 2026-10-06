import {getNativeReader,nativeRequestAllowed} from './native-auth.js';
import {readAuthBody} from './reader-auth.js';
import training from '../content/training-progress.json' with {type:'json'};
import {bookmarkCatalog} from '../content/bookmark-catalog.js';
const ids=new Set([...training.map(item=>item.id),...['ad','monitoring','rmf'].flatMap(path=>[1,2,3].map(n=>`native:${path}-${n}`))]);
const bookmarkIds=new Set([...bookmarkCatalog.map(item=>item.id),'journal']);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function nativeProgressApi(request,env){
 if(!nativeRequestAllowed(request))return reply({error:'Use the Secure By Design app for this request.'},403);
 if(new URL(request.url).pathname!=='/api/native-progress')return reply({error:'Not found.'},404);
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!env.DB)return reply({error:'Progress is temporarily unavailable.'},503);
 try{
  const reader=await getNativeReader(request,env);if(!reader)return reply({error:'Sign in again to sync your progress.'},401);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Use JSON for this request.'},415);
  let data;try{data=await readAuthBody(request)}catch{return reply({error:'Check your progress update.'},400)}
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
