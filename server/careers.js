import {communityEnrollmentStatement,communityMembership,enrollCommunity} from './community-membership.js';
import {getReader} from './reader-auth.js';
const recipient='support@securebydesigninc.com';
const originDefault='https://securebydesigninc.com';
const textFields={name:120,email:254,timeZone:100,contactPreferences:300,currentSituation:3000,background:5000,strengths:3000,aspirations:4000,motivation:3000,currentEfforts:3000,obstacles:3000,discussion:3000,goal1:1500,goal1Date:10,goal1Progress:1500,goal1Action:1500,goal2:1500,goal2Date:10,goal2Progress:1500,goal2Action:1500,accountability:1500,checkInFrequency:150};
const dateValid=s=>s===''||(/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
class InputError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const db=env=>{if(!env.DB)throw new InputError('The records service is not available yet. Your answers have not been submitted.',503);return env.DB;};
const q=(env,sql,...args)=>db(env).prepare(sql).bind(...args);
// The owner signs in like any reader, with the OWNER_EMAIL account, and must have signed in within the last 12 hours.
// (ChatGPT Sites used to vouch for the owner with oai-* headers; the Worker strips those, so they are never trusted.)
export const OWNER_SESSION_HOURS=12;
export async function ownerReader(request,env){
 if(!env.OWNER_EMAIL||!env.DB)return null;
 let reader;try{reader=await getReader(request,env);}catch{return null;}
 if(!reader||reader.email.trim().toLowerCase()!==env.OWNER_EMAIL.trim().toLowerCase())return null;
 const signedInAt=Date.parse(reader.sessionExpires)-30*86400000;
 return Date.now()-signedInAt<OWNER_SESSION_HOURS*3600000?reader:null;
}
export async function isOwner(request,env){return !!await ownerReader(request,env);}
export function emailReady(env){return !!(env.RESEND_API_KEY&&env.NOTIFICATION_FROM);}
async function readJSON(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new InputError('Send the form as JSON.',415);
 if(Number(request.headers.get('content-length'))>64000)throw new InputError('The form is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw new InputError('The form is empty.');let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>64000){await reader.cancel();throw new InputError('The form is too large.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 try{const data=JSON.parse(new TextDecoder().decode(bytes));if(!data||Array.isArray(data)||typeof data!=='object')throw Error();return data;}catch{throw new InputError('The form could not be read. Please try again.');}
}
export function validateSubmission(data){
 if(typeof data.submissionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submissionId))throw new InputError('Reload the form and try again.');
 if(data.website)throw new InputError('The form could not be accepted.');
 if(data.storageAcknowledged!==true)throw new InputError('Please confirm that Secure By Design may keep this record and contact you about your goals.');
 if(Object.keys(data).some(k=>!Object.hasOwn(textFields,k)&&!['submissionId','storageAcknowledged','website'].includes(k)))throw new InputError('Unexpected form field.');
 const answers={};for(const [key,max]of Object.entries(textFields)){const value=data[key]??'';if(typeof value!=='string'||value.length>max)throw new InputError(`Please shorten the ${key} response.`);answers[key]=value.trim();}
 if(!answers.name)throw new InputError('Please enter your name.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email))throw new InputError('Please enter a valid email address.');
 if(!dateValid(answers.goal1Date)||!dateValid(answers.goal2Date))throw new InputError('Please enter a valid target date.');
 return answers;
}
async function hash(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function submit(request,env,ctx){
 const data=await readJSON(request),answers=validateSubmission(data),id=data.submissionId;
 const payload=JSON.stringify(answers),digest=await hash(payload);
 const existing=await q(env,'SELECT request_hash FROM career_records WHERE id = ?',id).first();
 if(existing){if(existing.request_hash!==digest)throw new InputError('This submission was already saved with different answers. Start a new form to make another submission.',409);await enrollCommunity(env,answers.email,'career');return json({saved:true,id,membership:communityMembership});}
 const identity=request.headers.get('oai-authenticated-user-id')||request.headers.get('cf-connecting-ip');
 if(!identity)throw new InputError('Your submission could not be verified. Please try again later.',503);
 const now=new Date().toISOString(),day=now.slice(0,10),key=await hash(day+':'+identity);
 const until=new Date(Date.now()+2*86400000).toISOString();
 let result;
 try{result=await db(env).batch([
  q(env,'DELETE FROM career_submission_limits WHERE expires_at < ?',now),
  q(env,'INSERT OR IGNORE INTO career_submission_limits (key,count,expires_at) VALUES (?,0,?)',key,until),
  q(env,'UPDATE career_submission_limits SET count=count+1 WHERE key=? AND count<5',key),
  q(env,"INSERT INTO career_records (id,request_hash,name,email,answers,created_at,updated_at,status,owner_notes,version) SELECT ?,?,?,?,?,?,?,'new','',1 WHERE changes()=1",id,digest,answers.name,answers.email,payload,now,now),
  q(env,"INSERT INTO career_notifications (record_id,state,attempts) SELECT ?,'pending',0 WHERE changes()=1",id),
  communityEnrollmentStatement(env,answers.email,'career',{recordId:id})
 ]);}catch(error){const duplicate=await q(env,'SELECT request_hash FROM career_records WHERE id=?',id).first();if(duplicate?.request_hash===digest){await enrollCommunity(env,answers.email,'career');return json({saved:true,id,membership:communityMembership});}throw error;}
 if(!result[3].meta.changes)throw new InputError('Several forms have already been submitted today. Please try again tomorrow.',429);
 // Storage completes before any email is attempted. Failure to notify never rolls back the record.
 ctx.waitUntil(notifyWithRetries(env,id).catch(()=>console.error('career_notification_failed')));
 return json({saved:true,id,membership:communityMembership},201);
}
export async function notify(env,id){
 if(!emailReady(env))return {state:'pending',reason:'Email service is not connected.'};
 const row=await q(env,'SELECT * FROM career_notifications WHERE record_id=?',id).first();if(!row)return {state:'missing'};
 if(['accepted','needs_review'].includes(row.state))return {state:row.state};
 const now=new Date().toISOString();
 if(row.first_attempt_at&&Date.now()-Date.parse(row.first_attempt_at)>23*3600000){await q(env,"UPDATE career_notifications SET state='needs_review',error='Check the email provider before retrying: the deduplication window has expired.' WHERE record_id=?",id).run();return {state:'needs_review'};}
 const lock=await q(env,"UPDATE career_notifications SET state='sending',attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,?),last_attempt_at=? WHERE record_id=? AND (state IN ('pending','failed') OR (state='sending' AND last_attempt_at<?))",now,now,id,new Date(Date.now()-120000).toISOString()).run();
 if(!lock.meta.changes)return {state:'sending'};
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(12000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'career-record/'+id},body:JSON.stringify({from:env.NOTIFICATION_FROM,to:[recipient],subject:'New Secure By Design career record',text:'A new background and career goals record is ready for your review.\n\nOpen your private records area:\n'+(env.SITE_ORIGIN||originDefault)+'/career-records#'+id+'\n\nSign in with your site owner account to read the record.'})});
  if(!response.ok){const transient=response.status===429||response.status>=500;await q(env,"UPDATE career_notifications SET state='failed',error=? WHERE record_id=?",'Email service returned HTTP '+response.status,id).run();return {state:'failed',transient};}
  const result=await response.json();if(typeof result.id!=='string')throw Error('No provider receipt');
  await q(env,"UPDATE career_notifications SET state='accepted',provider_id=?,error=NULL WHERE record_id=?",result.id,id).run();
  return {state:'accepted'};
 }catch{await q(env,"UPDATE career_notifications SET state='failed',error='Email delivery attempt could not be confirmed.' WHERE record_id=?",id).run();return {state:'failed',transient:true};}
}
async function notifyWithRetries(env,id){for(let attempt=0;attempt<3;attempt++){const result=await notify(env,id);if(!result.transient)return result;await new Promise(r=>setTimeout(r,attempt===0?1000:2500));}}
export async function api(request,env,ctx){
 try{
  const url=new URL(request.url),path=url.pathname;
  if(!['GET','POST','PUT'].includes(request.method))return json({error:'Method not allowed.'},405);
  if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Request origin could not be verified.'},403);
  if(path==='/api/career-submissions'&&request.method==='POST')return await submit(request,env,ctx);
  if(!await isOwner(request,env))return json({error:'Sign in with the site owner account to view these records.'},403);
  if(path==='/api/career-records'&&request.method==='GET'){
   const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)throw new InputError('Invalid page.');
   const rows=await q(env,'SELECT r.id,r.name,r.email,r.created_at,r.status,r.next_check_in,n.state AS notification_state FROM career_records r LEFT JOIN career_notifications n ON n.record_id=r.id ORDER BY r.created_at DESC,r.id DESC LIMIT 50 OFFSET ?',offset).all();
   const total=await q(env,'SELECT count(*) AS count FROM career_records').first();
   return json({records:rows.results,total:total.count,emailConfigured:emailReady(env),notificationEmail:recipient});
  }
  if(path==='/api/career-notifications/test'&&request.method==='POST'){
   if(!emailReady(env))return json({error:'Connect the email service before sending a test.'},503);
   const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(12000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'career-test/'+Math.floor(Date.now()/300000)},body:JSON.stringify({from:env.NOTIFICATION_FROM,to:[recipient],subject:'Secure By Design notification test',text:'This is a test of the career-record notification service.\n\nNew submissions will link you to your private records area:\n'+(env.SITE_ORIGIN||originDefault)+'/career-records\n\nPlease check your inbox and spam folder to confirm receipt.'})});
   if(!response.ok)return json({error:'The email service rejected the test. Check the sender configuration.'},502);
   const receipt=await response.json();if(!receipt.id)return json({error:'The email service did not provide a receipt.'},502);
   return json({accepted:true,message:'Test accepted by the email service. Check support@securebydesigninc.com, including spam, to confirm receipt.'});
  }
  if(path==='/api/career-notifications/retry'&&request.method==='POST'){
   if(!emailReady(env))return json({error:'Connect the email service before sending notifications.'},503);
   const rows=await q(env,"SELECT record_id FROM career_notifications WHERE state IN ('pending','failed','sending') ORDER BY record_id LIMIT 20").all();
   const results=[];for(const row of rows.results)results.push(await notify(env,row.record_id));
   return json({results});
  }
  const match=path.match(/^\/api\/career-records\/([a-f0-9-]{36})$/i);if(!match)return json({error:'Not found.'},404);
  const id=match[1];
  if(request.method==='GET'){
   const row=await q(env,'SELECT r.*,n.state AS notification_state,n.error AS notification_error FROM career_records r LEFT JOIN career_notifications n ON n.record_id=r.id WHERE r.id=?',id).first();
   if(!row)return json({error:'Record not found.'},404);delete row.request_hash;row.answers=JSON.parse(row.answers);return json(row);
  }
  if(request.method==='PUT'){
   const data=await readJSON(request);
   if(Object.keys(data).some(k=>!['status','nextCheckIn','ownerNotes','version'].includes(k)))throw new InputError('Unexpected update field.');
   if(!['new','in_progress','paused','completed'].includes(data.status)||typeof data.nextCheckIn!=='string'||!dateValid(data.nextCheckIn)||typeof data.ownerNotes!=='string'||data.ownerNotes.length>20000||!Number.isInteger(data.version))throw new InputError('Check the status, date, and notes.');
   const result=await q(env,'UPDATE career_records SET status=?,next_check_in=?,owner_notes=?,updated_at=?,version=version+1 WHERE id=? AND version=?',data.status,data.nextCheckIn||null,data.ownerNotes,new Date().toISOString(),id,data.version).run();
   if(!result.meta.changes)return json({error:'This record changed in another window. Reopen it before saving; your notes are still on screen.'},409);
   return json({saved:true,version:data.version+1});
  }
  return json({error:'Method not allowed.'},405);
 }catch(error){if(error instanceof InputError)return json({error:error.message},error.status);console.error('career_records_unavailable');return json({error:'The records service is temporarily unavailable. Your entries are still on this page; please try again.'},503);}
}
