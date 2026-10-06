import {getNativeReader,nativeRequestAllowed} from './native-auth.js';
import {readAuthBody} from './reader-auth.js';
import training from '../content/training-progress.json' with {type:'json'};

const lessonIds=new Set([...training.map(item=>item.id),...['ad','monitoring','rmf'].flatMap(path=>[1,2,3].map(n=>`${path}-${n}`))]);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
function validDay(day){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 const date=new Date(day+'T00:00:00Z');
 return Number.isFinite(+date)&&date.toISOString().slice(0,10)===day&&day>='2020-01-01'&&day<=new Date(Date.now()+86400000).toISOString().slice(0,10);
}
export async function nativeActivityApi(request,env){
 if(!nativeRequestAllowed(request))return reply({error:'Use the Secure By Design app for this request.'},403);
 if(new URL(request.url).pathname!=='/api/native-activity')return reply({error:'Not found.'},404);
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!env.DB)return reply({error:'Learning activity is temporarily unavailable.'},503);
 try{
  const reader=await getNativeReader(request,env);
  if(!reader)return reply({error:'Sign in again to sync your activity.'},401);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Use JSON for this request.'},415);
  let data;try{data=await readAuthBody(request)}catch{return reply({error:'Check your activity update.'},400)}
  if(Object.keys(data).some(key=>!['activity','after'].includes(key))||!Array.isArray(data.activity)||data.activity.length>12||typeof data.after!=='string'||data.after.length>120)return reply({error:'Check your activity update.'},400);
  if(data.after!==''&&(!validDay(data.after.split('|')[0])||!lessonIds.has(data.after.split('|')[1])||data.after.split('|').length!==2))return reply({error:'Check your activity cursor.'},400);
  if(data.activity.some(item=>!item||Object.keys(item).length!==4||!validDay(item.day)||!lessonIds.has(item.lessonId)||typeof item.review!=='boolean'||typeof item.perfect!=='boolean'))return reply({error:'Choose a known lesson and a valid learning day.'},400);
  const keys=data.activity.map(item=>`${item.day}|${item.lessonId}`);
  if(new Set(keys).size!==keys.length)return reply({error:'Send each lesson once per day.'},400);
  // Union by lesson/day. Retrying or merging two devices cannot duplicate XP.
  const writes=data.activity.map((item,i)=>env.DB.prepare('INSERT INTO reader_learning_activity (user_id,activity_key,day,lesson_id,review,perfect) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,activity_key) DO UPDATE SET review=MIN(reader_learning_activity.review,excluded.review),perfect=MAX(reader_learning_activity.perfect,excluded.perfect)').bind(reader.id,keys[i],item.day,item.lessonId,item.review?1:0,item.perfect?1:0));
  if(writes.length)await env.DB.batch(writes);
  const rows=(await env.DB.prepare('SELECT activity_key,day,lesson_id AS lessonId,review,perfect FROM reader_learning_activity WHERE user_id=? AND activity_key>? ORDER BY activity_key LIMIT 65').bind(reader.id,data.after).all()).results;
  const page=rows.slice(0,64);
  return reply({accountId:reader.id,activity:page.map(({activity_key,...row})=>({...row,review:!!row.review,perfect:!!row.perfect})),nextCursor:rows.length>64?page.at(-1).activity_key:null});
 }catch{console.error('Native learning activity storage failed');return reply({error:'Activity could not sync. Your device changes can be retried.'},503)}
}
