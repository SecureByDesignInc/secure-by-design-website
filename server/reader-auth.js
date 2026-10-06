import {validPassword,hashPassword,checkPassword} from './reader-password.js';
import {communityEnrollmentStatement,communityMembership,enrollCommunity} from './community-membership.js';
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
export const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const local=request=>['localhost','127.0.0.1'].includes(new URL(request.url).hostname);
const name=(request,kind)=>local(request)?'sbd_local_'+kind:'__Host-sbd_'+kind;
function cookie(request,kind){const entries=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name(request,kind)+'='));return entries.length===1?entries[0].split('=')[1]:''}
const setCookie=(request,kind,value,age)=>`${name(request,kind)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${local(request)?'':'; Secure'}`;
const json=(data,status=200,cookieValue)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff',...(cookieValue?{'set-cookie':cookieValue}:{})}});
export async function readAuthBody(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('Send the form as JSON.');
 const reader=request.body?.getReader();if(!reader)throw new Error('Complete the form.');let bytes=0,text='';const decoder=new TextDecoder();
 while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2048){await reader.cancel();throw new Error('The form is too large.')}text+=decoder.decode(value,{stream:true})}
 const data=JSON.parse(text+decoder.decode());if(!data||Array.isArray(data)||typeof data!=='object')throw new Error('Complete the form.');return data;
}
export async function getReader(request,env){
 const token=cookie(request,'reader');if(!/^[a-f0-9]{64}$/.test(token))return null;
 if(!env.DB)throw new Error('Reader storage unavailable');
 return env.DB.prepare("SELECT a.id,a.email,a.password_hash IS NULL AS needsPassword FROM reader_accounts a JOIN reader_sessions s ON s.account_id=a.id WHERE s.token_hash=? AND s.expires_at>? AND s.client_kind='browser'").bind(await digest(token),new Date().toISOString()).first();
}
async function signedIn(request,env,accountId,email){
 const session=random();await env.DB.batch([
  communityEnrollmentStatement(env,email,'account',{accountId,verified:true}),
  env.DB.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').bind(await digest(session),accountId,new Date(Date.now()+30*86400000).toISOString())
 ]);
 return json({signedIn:true,membership:communityMembership},200,setCookie(request,'reader',session,30*86400));
}
async function rate(env,key,max,expires){const row=await env.DB.prepare('INSERT INTO reader_auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(key,expires,max).first();return !!row}
export async function readerAuthApi(request,env){
 const url=new URL(request.url),route=url.pathname;
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Reload this page and try again.'},403);
 if(!env.DB)return json({error:'Accounts are temporarily unavailable.'},503);
 try{
  const now=new Date().toISOString();
  if(route==='/api/reader-auth/signout'){
   const token=cookie(request,'reader');if(token)await env.DB.prepare('DELETE FROM reader_sessions WHERE token_hash=?').bind(await digest(token)).run();
   return json({signedOut:true},200,setCookie(request,'reader','',0));
  }
  let data;try{data=await readAuthBody(request)}catch{return json({error:'Check the form and try again.'},400)}
  if(route==='/api/reader-auth/signin'){
   if(Object.keys(data).some(k=>!['email','password'].includes(k))||typeof data.email!=='string'||data.email.length>254||typeof data.password!=='string'||data.password.length>256)return json({error:'Enter your email and password.'},400);
   const email=data.email.trim().toLowerCase(),ip=request.headers.get('cf-connecting-ip')||(local(request)?'local-test':null);
   if(!ip)return json({error:'This request could not be verified.'},503);
   await env.DB.prepare('DELETE FROM reader_auth_limits WHERE expires_at<?').bind(now).run();
   const expires=new Date(Date.now()+3600000).toISOString();
   for(const [key,max] of [[`signin-ip:${now.slice(0,13)}:${ip}`,30],[`signin-email:${now.slice(0,13)}:${email}`,10]])if(!await rate(env,await digest(key),max,expires))return json({error:'Too many sign-in attempts. Please try again in an hour or use password recovery.'},429);
   const account=await env.DB.prepare('SELECT id,password_hash FROM reader_accounts WHERE email=?').bind(email).first();
   if(!await checkPassword(data.password,account?.password_hash))return json({error:'Email or password did not match. If you previously used email codes, choose Set or reset password.'},401);
   return await signedIn(request,env,account.id,email);
  }
  if(route==='/api/reader-auth/request'){
   if(Object.keys(data).some(k=>!['email','consent','purpose'].includes(k))||data.consent!==true||!['create','reset'].includes(data.purpose||'create')||typeof data.email!=='string'||data.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))return json({error:'Enter a valid email and agree to save your account and progress.'},400);
   if(!env.RESEND_API_KEY||!env.NOTIFICATION_FROM)return json({error:'Email sign-in is temporarily unavailable. Please try again later.'},503);
   const email=data.email.trim().toLowerCase(),ip=request.headers.get('cf-connecting-ip')||(local(request)?'local-test':null);
   if(!ip)return json({error:'This request could not be verified.'},503);
   const hour=now.slice(0,13),expires=new Date(Date.now()+3600000).toISOString();
   await env.DB.batch([env.DB.prepare('DELETE FROM reader_auth_limits WHERE expires_at<?').bind(now),env.DB.prepare('DELETE FROM reader_challenges WHERE expires_at<?').bind(now),env.DB.prepare('DELETE FROM reader_sessions WHERE expires_at<?').bind(now)]);
   for(const [key,max] of [[`ip:${hour}:${ip}`,10],[`email:${hour}:${email}`,5],[`minute:${now.slice(0,16)}:${email}`,1]])if(!await rate(env,await digest(key),max,expires))return json({error:'Please wait before requesting another code. Too many attempts may require waiting an hour.'},429);
   const challenge=random();const value=crypto.getRandomValues(new Uint32Array(1))[0];const code=String(value%100000000).padStart(8,'0');
   await env.DB.prepare('INSERT INTO reader_challenges (id,email,code_hash,attempts,expires_at,purpose) VALUES (?,?,?,0,?,?)').bind(challenge,email,await digest(challenge+':'+code),new Date(Date.now()+600000).toISOString(),data.purpose||'create').run();
   try{const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(12000),headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'reader-signin/'+challenge},body:JSON.stringify({from:env.NOTIFICATION_FROM,to:[email],subject:'Your Secure By Design verification code',text:`Your Secure By Design verification code is:\n\n${code}\n\nEnter this code in the browser where you requested it. It expires in 10 minutes and can be used once.\n\nUse this code to verify your email and create or reset your account password. Your password is required to sign in and save learning progress. It does not subscribe you to resource emails.\n\nIf you did not request this code, ignore this email. Do not share the code.`})});if(!response.ok)throw Error();}catch{await env.DB.prepare('DELETE FROM reader_challenges WHERE id=?').bind(challenge).run();return json({error:'The verification email could not be sent. Please wait a minute and try again.'},502)}
   await enrollCommunity(env,email,'account');
   return json({membership:communityMembership,message:'Your Community membership is included. Check your email for an 8-digit code to finish setting up account access. It expires in 10 minutes.'},202,setCookie(request,'challenge',challenge,600));
  }
  if(route==='/api/reader-auth/verify'){
   const challenge=cookie(request,'challenge');if(!/^[a-f0-9]{64}$/.test(challenge)||Object.keys(data).some(k=>!['code','password','confirmPassword'].includes(k))||typeof data.code!=='string'||!/^\d{8}$/.test(data.code))return json({error:'Enter the 8-digit code in the browser where you requested it.'},400);
   if(!validPassword(data.password)||data.password!==data.confirmPassword)return json({error:'Choose a password of 15–128 characters and enter the same password twice.'},400);
   const attempt=await env.DB.prepare('UPDATE reader_challenges SET attempts=attempts+1 WHERE id=? AND attempts<5 AND expires_at>? RETURNING id').bind(challenge,now).first();
   if(!attempt)return json({error:'This code has expired or has too many attempts. Request a new code.'},400);
   const verified=await env.DB.prepare('DELETE FROM reader_challenges WHERE id=? AND code_hash=? AND expires_at>? RETURNING email,purpose').bind(challenge,await digest(challenge+':'+data.code),now).first();
   if(!verified)return json({error:'That code did not match. Check your email and try again.'},400);
   const passwordHash=await hashPassword(data.password);
   const account=verified.purpose==='reset'
    ? await env.DB.prepare('UPDATE reader_accounts SET password_hash=? WHERE email=? RETURNING id').bind(passwordHash,verified.email).first()
    : await env.DB.prepare('INSERT INTO reader_accounts (id,email,created_at,password_hash) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash WHERE reader_accounts.password_hash IS NULL RETURNING id').bind(crypto.randomUUID(),verified.email,now,passwordHash).first();
   if(!account)return json({error:verified.purpose==='reset'?'No account is available to reset. Choose Create account.':'This account already has a password. Sign in or choose Set or reset password.'},409);
   await env.DB.batch([env.DB.prepare('DELETE FROM reader_sessions WHERE account_id=?').bind(account.id),env.DB.prepare('DELETE FROM reader_challenges WHERE email=?').bind(verified.email)]);
   return await signedIn(request,env,account.id,verified.email);
  }
  return json({error:'Not found.'},404);
 }catch{console.error('Reader account operation failed');return json({error:'Accounts are temporarily unavailable. Please try again.'},503)}
}
