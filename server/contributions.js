import {isOwner} from './careers.js';
import {communityEnrollmentStatement,communityMembership,enrollCommunity} from './community-membership.js';
const recipient='support@securebydesigninc.com',originDefault='https://securebydesigninc.com';
export const contributionConsent='Secure By Design may keep my submission and contact details to review my contribution and contact me about it.';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
class InputError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const db=env=>{if(!env.DB)throw new InputError('The records service is not available yet. Your answers have not been submitted.',503);return env.DB;};
const q=(env,sql,...args)=>db(env).prepare(sql).bind(...args);
export function emailReady(env){return !!(env.RESEND_API_KEY&&env.NOTIFICATION_FROM);}
async function readJSON(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new InputError('Send the form as JSON.',415);
 if(Number(request.headers.get('content-length'))>16000)throw new InputError('The form is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw new InputError('The form is empty.');let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();throw new InputError('The form is too large.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 try{const data=JSON.parse(new TextDecoder().decode(bytes));if(!data||Array.isArray(data)||typeof data!=='object')throw Error();return data;}catch{throw new InputError('The form could not be read. Please try again.');}
}

const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function submit(request,env,ctx){
 const data=await readJSON(request),id=data.submissionId;
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new InputError('Reload the form and try again.');
 if(Object.keys(data).some(k=>!['submissionId','name','email','kind','resourceUrl','message','consent','website'].includes(k))||data.website)throw new InputError('The form could not be accepted.');
 if(data.consent!==true)throw new InputError('Please confirm that Secure By Design may keep your contribution and contact you about it.');
 const values={};for(const [key,max] of Object.entries({name:120,email:254,kind:20,resourceUrl:2000,message:5000})){const value=data[key]??'';if(typeof value!=='string'||value.length>max)throw new InputError('Please shorten your '+key+' response.');values[key]=value.trim();}
 if(!values.name||!values.message)throw new InputError('Please enter your name and describe your contribution.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))throw new InputError('Please enter a valid email address.');
 values.email=values.email.toLowerCase();
 if(!['resource','article','other'].includes(values.kind))throw new InputError('Choose a contribution type.');
 if(values.kind==='resource'&&!values.resourceUrl)throw new InputError('Please include the resource link.');
 if(values.resourceUrl){try{const url=new URL(values.resourceUrl);if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch{throw new InputError('Use a complete https:// link without login details.');}}
 const digest=await hash(JSON.stringify(values));
 const existing=await q(env,'SELECT request_hash FROM community_contributions WHERE id=?',id).first();
 if(existing){if(existing.request_hash!==digest)throw new InputError('This contribution was already saved with different answers. Reload to start a new submission.',409);await enrollCommunity(env,values.email,'contribution');return json({saved:true,id,membership:communityMembership});}
 const identity=request.headers.get('cf-connecting-ip')||request.headers.get('oai-authenticated-user-id');if(!identity)throw new InputError('Your submission could not be verified. Please try again later.',503);
 const now=new Date().toISOString(),key=await hash('community:'+now.slice(0,10)+':'+identity),until=new Date(Date.now()+2*81600000).toISOString();
 let results;try{results=await db(env).batch([
 q(env,'DELETE FROM community_contribution_limits WHERE expires_at < ?',now),q(env,'INSERT OR IGNORE INTO community_contribution_limits (key,count,expires_at) VALUES (?,0,?)',key,until),q(env,'UPDATE community_contribution_limits SET count=count+1 WHERE key=? AND count<5',key),
 q(env,"INSERT INTO community_contributions (id,request_hash,name,email,kind,resource_url,message,created_at,consent_text,status) SELECT ?,?,?,?,?,?,?,?,?,'new' WHERE changes()=1",id,digest,values.name,values.email,values.kind,values.resourceUrl,values.message,now,contributionConsent),
 q(env,"INSERT INTO community_notifications (record_id,state,attempts) SELECT ?,'pending',0 WHERE changes()=1",id),
 communityEnrollmentStatement(env,values.email,'contribution',{recordId:id})
 ]);}catch(error){const duplicate=await q(env,'SELECT request_hash FROM community_contributions WHERE id=?',id).first();if(duplicate?.request_hash===digest){await enrollCommunity(env,values.email,'contribution');return json({saved:true,id,membership:communityMembership});}throw error;}
 if(!results[3].meta.changes)throw new InputError('Several contributions have already been submitted today. Please try again tomorrow.',429);
 ctx.waitUntil(notifyWithRetries(env,id).catch(()=>console.error('community_notification_failed')));return json({saved:true,id,membership:communityMembership},201);
}
export async function notify(env,id){
 if(!emailReady(env))return {state:'pending',reason:'Email service is not connected.'};
 const row=await q(env,'SELECT * FROM community_notifications WHERE record_id=?',id).first();if(!row)return {state:'missing'};
 if(['accepted','needs_review'].includes(row.state))return {state:row.state};
 const now=new Date().toISOString();
 if(row.first_attempt_at&&Date.now()-Date.parse(row.first_attempt_at)>23*3600000){await q(env,"UPDATE community_notifications SET state='needs_review',error='Check the email provider before retrying: the deduplication window has expired.' WHERE record_id=?",id).run();return {state:'needs_review'};}
 const lock=await q(env,"UPDATE community_notifications SET state='sending',attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,?),last_attempt_at=? WHERE record_id=? AND (state IN ('pending','failed') OR (state='sending' AND last_attempt_at<?))",now,now,id,new Date(Date.now()-120000).toISOString()).run();
 if(!lock.meta.changes)return {state:'sending'};
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(12000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'community-contribution/'+id},body:JSON.stringify({from:env.NOTIFICATION_FROM,to:[recipient],subject:'New Secure By Design community contribution',text:'A new community contribution is ready for your review.\n\nOpen your private records area:\n'+(env.SITE_ORIGIN||originDefault)+'/community-contributions#'+id+'\n\nSign in with your site owner account to read the record.'})});
  if(!response.ok){const transient=response.status===429||response.status>=500;await q(env,"UPDATE community_notifications SET state='failed',error=? WHERE record_id=?",'Email service returned HTTP '+response.status,id).run();return {state:'failed',transient};}
  const result=await response.json();if(typeof result.id!=='string')throw Error('No provider receipt');
  await q(env,"UPDATE community_notifications SET state='accepted',provider_id=?,error=NULL WHERE record_id=?",result.id,id).run();
  return {state:'accepted'};
 }catch{await q(env,"UPDATE community_notifications SET state='failed',error='Email delivery attempt could not be confirmed.' WHERE record_id=?",id).run();return {state:'failed',transient:true};}
}
async function notifyWithRetries(env,id){for(let attempt=0;attempt<3;attempt++){const result=await notify(env,id);if(!result.transient)return result;await new Promise(r=>setTimeout(r,attempt===0?1000:2500));}}

export async function contributionsApi(request,env,ctx){try{
 const url=new URL(request.url),path=url.pathname;
 if(!['GET','POST','PUT'].includes(request.method))return json({error:'Method not allowed.'},405);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Request origin could not be verified.'},403);
 if(path==='/api/community-contributions'&&request.method==='POST')return await submit(request,env,ctx);
 if(!isOwner(request,env))return json({error:'Sign in with the site owner account to review contributions.'},403);
 if(path==='/api/community-contributions'&&request.method==='GET'){
 const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)throw new InputError('Invalid page.');
 const rows=await q(env,'SELECT c.*,n.state AS notification_state FROM community_contributions c LEFT JOIN community_notifications n ON n.record_id=c.id ORDER BY c.created_at DESC,c.id DESC LIMIT 50 OFFSET ?',offset).all();const total=await q(env,'SELECT count(*) AS count FROM community_contributions').first();return json({contributions:rows.results,total:total.count});}
 if(path==='/api/community-contributions/status'&&request.method==='PUT'){
 const data=await readJSON(request);if(typeof data.id!=='string'||!['new','reviewing','closed'].includes(data.status))throw new InputError('Invalid review status.');const result=await q(env,'UPDATE community_contributions SET status=? WHERE id=?',data.status,data.id).run();if(!result.meta.changes)throw new InputError('Contribution not found.',404);return json({saved:true});}
 if(path==='/api/community-contributions/notify'&&request.method==='POST'){const data=await readJSON(request);if(typeof data.id!=='string')throw new InputError('Invalid contribution.');return json(await notify(env,data.id));}
 return json({error:'Not found.'},404);
 }catch(error){if(error instanceof InputError)return json({error:error.message},error.status);console.error('community_contribution_unavailable');return json({error:'Contributions are temporarily unavailable. Please try again.'},503);}}
