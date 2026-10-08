import {isOwner} from './careers.js';
import {communityMembership,enrollCommunity} from './community-membership.js';

export const resourceConsent='I would like to receive cybersecurity resources from Secure By Design. I can unsubscribe at any time.';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
class RequestError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const query=(env,sql,...values)=>{if(!env.DB)throw new RequestError('Resource signup is temporarily unavailable. Please try again.',503);return env.DB.prepare(sql).bind(...values);};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const origin=env=>new URL(env.SITE_ORIGIN||'https://securebydesigninc.com').origin;
async function body(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new RequestError('Send the form as JSON.',415);
 if(Number(request.headers.get('content-length'))>4096)throw new RequestError('The form is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw new RequestError('The form is empty.');
 let length=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4096){await reader.cancel();throw new RequestError('The form is too large.',413);}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw new RequestError('The form could not be read.');}
}
const acknowledgement=()=>json({membership:communityMembership,message:'Your Community membership is included. If this address needs confirmation for resource emails, check your inbox for a link from Secure By Design. Please allow a few minutes and check spam. Resource emails begin only after confirmation.'},202);

async function signup(request,env){
 const data=await body(request);
 if(Object.keys(data).some(key=>!['name','email','consent','website'].includes(key)))throw new RequestError('Unexpected form field.');
 if(data.website||data.consent!==true)throw new RequestError('Please confirm that you want to receive resource emails.');
 if(typeof data.email!=='string'||data.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))throw new RequestError('Please enter a valid email address.');
 if(data.name!==undefined&&(typeof data.name!=='string'||data.name.length>120))throw new RequestError('Please keep your name under 120 characters.');
 if(!env.RESEND_API_KEY||!env.NOTIFICATION_FROM)throw new RequestError('Resource signup is temporarily unavailable. Please try again later.',503);
 const identity=request.headers.get('cf-connecting-ip')||request.headers.get('oai-authenticated-user-id');
 if(!identity)throw new RequestError('The signup could not be verified. Please try again.',503);
 const email=data.email.trim().toLowerCase(),name=(data.name||'').trim(),now=new Date().toISOString();
 const confirmToken=token(),confirmHash=await digest(confirmToken),unsubscribeToken=token();
 const key=await digest('resources:'+now.slice(0,10)+':'+identity);
 const minuteAgo=new Date(Date.now()-60000).toISOString(),dayAgo=new Date(Date.now()-86400000).toISOString();
 const expires=new Date(Date.now()+48*3600000).toISOString();
 const results=await env.DB.batch([
  query(env,'DELETE FROM resource_signup_limits WHERE expires_at < ?',now),
  query(env,'INSERT OR IGNORE INTO resource_signup_limits (key,count,expires_at) VALUES (?,0,?)',key,expires),
  query(env,'UPDATE resource_signup_limits SET count=count+1 WHERE key=? AND count<10',key),
  query(env,`INSERT INTO resource_subscribers (email,name,status,created_at,consent_at,consent_text,confirmation_hash,confirmation_expires_at,unsubscribe_token,last_requested_at,send_window_start,send_count,email_state)
   SELECT ?,?,'pending',?,?,?,?,?,?,?,?,1,'sending' WHERE changes()=1
   ON CONFLICT(email) DO UPDATE SET name=excluded.name,status='pending',consent_at=excluded.consent_at,consent_text=excluded.consent_text,
    confirmation_hash=excluded.confirmation_hash,confirmation_expires_at=excluded.confirmation_expires_at,last_requested_at=excluded.last_requested_at,
    send_window_start=CASE WHEN resource_subscribers.send_window_start<? THEN excluded.send_window_start ELSE resource_subscribers.send_window_start END,
    send_count=CASE WHEN resource_subscribers.send_window_start<? THEN 1 ELSE resource_subscribers.send_count+1 END,
    confirmed_at=NULL,email_state='sending'
   WHERE resource_subscribers.status!='active' AND resource_subscribers.last_requested_at<?
    AND (resource_subscribers.send_window_start<? OR resource_subscribers.send_count<3)`,email,name,now,now,resourceConsent,confirmHash,expires,unsubscribeToken,now,now,dayAgo,dayAgo,minuteAgo,dayAgo)
 ]);
 if(!results[2].meta.changes)throw new RequestError('Too many signup attempts. Please try again tomorrow.',429);
 await enrollCommunity(env,email,'resources');
 if(!results[3].meta.changes)return acknowledgement();
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(12000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'resource-confirm/'+confirmHash},body:JSON.stringify({from:env.NOTIFICATION_FROM,to:[email],subject:'Confirm your Secure By Design resource emails',text:'You asked to receive cybersecurity resources from Secure By Design.\n\nConfirm your email address here:\n'+origin(env)+'/resource-preferences#confirm/'+confirmToken+'\n\nThe link expires in 48 hours. This signup is separate from career conversations. You can unsubscribe from resource emails at any time.\n\nIf you did not request this, ignore this email. You will not be added to the resource list.'})});
  if(!response.ok)throw Error('Provider rejected confirmation');
  const receipt=await response.json();if(typeof receipt.id!=='string')throw Error('No receipt');
  await query(env,"UPDATE resource_subscribers SET email_state='accepted' WHERE email=? AND confirmation_hash=?",email,confirmHash).run();
 }catch{
  await query(env,"UPDATE resource_subscribers SET email_state='failed' WHERE email=? AND confirmation_hash=?",email,confirmHash).run();
  throw new RequestError('Your Community membership is active, but we could not confirm that the resource verification email was sent. Please wait a minute, then try again. You have not been added to the resource email list.',502);
 }
 return acknowledgement();
}

async function preferences(request,env){
 const data=await body(request);
 if(Object.keys(data).some(k=>!['action','token'].includes(k))||!['confirm','unsubscribe'].includes(data.action)||typeof data.token!=='string'||!/^[a-f0-9]{64}$/.test(data.token))throw new RequestError('This email link is invalid.');
 const now=new Date().toISOString();
 if(data.action==='confirm'){
  const hash=await digest(data.token);
  const result=await query(env,"UPDATE resource_subscribers SET status='active',confirmed_at=?,unsubscribed_at=NULL WHERE confirmation_hash=? AND status='pending' AND confirmation_expires_at>?",now,hash,now).run();
  if(!result.meta.changes){const row=await query(env,"SELECT status FROM resource_subscribers WHERE confirmation_hash=? AND status='active'",hash).first();if(!row)throw new RequestError('This confirmation link has expired or is no longer valid. Please sign up again.');}
  const subscriber=await query(env,"SELECT email FROM resource_subscribers WHERE confirmation_hash=? AND status='active'",hash).first();
  await enrollCommunity(env,subscriber.email,'resources',{verified:true});
  return json({membership:communityMembership,message:'Your email is confirmed. Your Community membership is active, and you are on the Secure By Design cybersecurity resource list.'});
 }
 const result=await query(env,"UPDATE resource_subscribers SET status='unsubscribed',unsubscribed_at=COALESCE(unsubscribed_at,?),confirmation_hash=NULL,confirmation_expires_at=NULL WHERE unsubscribe_token=?",now,data.token).run();
 if(!result.meta.changes)throw new RequestError('This unsubscribe link is invalid.');
 return json({message:'You have unsubscribed from resource emails. Your career conversation record, if you have one, is unchanged.'});
}

export async function resourcesApi(request,env){
 try{
  const url=new URL(request.url),path=url.pathname;
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
  if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return json({error:'Request origin could not be verified.'},403);
  if(path==='/api/resource-signups'&&request.method==='POST')return await signup(request,env);
  if(path==='/api/resource-preferences'&&request.method==='POST')return await preferences(request,env);
  if(!await isOwner(request,env))return json({error:'Sign in with the site owner account to view subscribers.'},403);
  if(path==='/api/resource-subscribers'&&request.method==='GET'){
   const status=url.searchParams.get('status')||'active',offset=Number(url.searchParams.get('offset')||0);
   if(!['active','pending','unsubscribed'].includes(status)||!Number.isSafeInteger(offset)||offset<0)throw new RequestError('Invalid subscriber filter.');
   const rows=await query(env,'SELECT email,name,status,created_at,consent_at,confirmed_at,unsubscribed_at,email_state FROM resource_subscribers WHERE status=? ORDER BY created_at DESC,email LIMIT 50 OFFSET ?',status,offset).all();
   const counts=await query(env,'SELECT status,count(*) AS count FROM resource_subscribers GROUP BY status').all();
   return json({subscribers:rows.results,counts:Object.fromEntries(counts.results.map(r=>[r.status,r.count])),emailConfigured:!!(env.RESEND_API_KEY&&env.NOTIFICATION_FROM)});
  }
  if(path==='/api/resource-subscribers/export'&&request.method==='GET'){
   const rows=await query(env,"SELECT email,name,confirmed_at,unsubscribe_token FROM resource_subscribers WHERE status='active' ORDER BY email LIMIT 10001").all();
   if(rows.results.length>10000)throw new RequestError('Contact the site administrator to export this larger subscriber list.');
   const csv=value=>'"'+(/^[\s]*[=+@\-]/.test(value)?"'":'')+String(value||'').replaceAll('"','""')+'"';
   const lines=[['email','name','confirmed_at','unsubscribe_url'],...rows.results.map(r=>[r.email,r.name,r.confirmed_at,origin(env)+'/resource-preferences#unsubscribe/'+r.unsubscribe_token])];
   return new Response('\uFEFF'+lines.map(row=>row.map(csv).join(',')).join('\r\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="confirmed-resource-subscribers.csv"','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }
  if(path==='/api/resource-subscribers/unsubscribe'&&request.method==='POST'){
   const data=await body(request);if(typeof data.email!=='string'||data.email.length>254)throw new RequestError('Invalid subscriber.');
   await query(env,"UPDATE resource_subscribers SET status='unsubscribed',unsubscribed_at=COALESCE(unsubscribed_at,?),confirmation_hash=NULL,confirmation_expires_at=NULL WHERE email=?",new Date().toISOString(),data.email.trim().toLowerCase()).run();
   return json({message:'Resource subscription stopped.'});
  }
  return json({error:'Not found.'},404);
 }catch(error){if(error instanceof RequestError)return json({error:error.message},error.status);console.error('resource_signup_unavailable');return json({error:'Resource signup is temporarily unavailable. Please try again.'},503);}
}
