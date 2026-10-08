import {checkPassword} from './reader-password.js';
import {digest,readAuthBody} from './reader-auth.js';
import {communityEnrollmentStatement,communityMembership,readerCommunityMembership} from './community-membership.js';
import {redeemAppHandoff} from './sign-in-methods.js';
import {deleteAccount} from './account-deletion.js';
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const tokenFrom=request=>/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization')||'')?.[1];
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');

export function nativeRequestAllowed(request){
 // This route never authenticates cookies. Native clients set no Origin, use
 // an explicit version header and bearer sessions. Keep browser auth separate.
 return !request.headers.has('origin') && !request.headers.has('sec-fetch-site') && request.headers.get('x-sbd-client')==='native-v1';
}
export async function getNativeReader(request,env){
 const token=tokenFrom(request);if(!token)return null;
 const account=await env.DB.prepare("SELECT a.id,a.email FROM reader_accounts a JOIN reader_sessions s ON s.account_id=a.id WHERE s.token_hash=? AND s.expires_at>? AND s.client_kind='native' AND (a.password_hash IS NOT NULL OR EXISTS (SELECT 1 FROM reader_identities i WHERE i.account_id=a.id) OR EXISTS (SELECT 1 FROM reader_passkeys p WHERE p.account_id=a.id))").bind(await digest(token),new Date().toISOString()).first();
 return account?{...account,emailVerified:true}:null;
}
async function issueNativeSession(env,accountId,email){
 const token=random(),now=new Date().toISOString(),expiresAt=new Date(Date.now()+12*3600000).toISOString();
 await env.DB.batch([
  communityEnrollmentStatement(env,email,'app',{accountId,verified:true}),
  env.DB.prepare('DELETE FROM reader_sessions WHERE expires_at<?').bind(now),
  env.DB.prepare("INSERT INTO reader_sessions (token_hash,account_id,expires_at,client_kind) VALUES (?,?,?,'native')").bind(await digest(token),accountId,expiresAt)
 ]);
 return {token,expiresAt,user:{id:accountId,email},membership:communityMembership};
}
export async function nativeAuthApi(request,env){
 if(!nativeRequestAllowed(request))return json({error:'Use the Secure By Design app for this request.'},403);
 if(!env.DB)return json({error:'Sign-in is temporarily unavailable.'},503);
 const route=new URL(request.url).pathname;
 try{
  if(route==='/api/native-auth/session'&&request.method==='GET'){
   const user=await getNativeReader(request,env);return user?json({user:{id:user.id,email:user.email},membership:await readerCommunityMembership(env,user,'app')}):json({error:'Sign in again to continue.'},401);
  }
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(route==='/api/native-auth/signout'){
   const token=tokenFrom(request);if(!token)return json({error:'Sign in again to continue.'},401);
   await env.DB.prepare("DELETE FROM reader_sessions WHERE token_hash=? AND client_kind='native'").bind(await digest(token)).run();
   return json({signedOut:true});
  }
  if(route==='/api/native-auth/exchange'){
   // Completes sign-in started in the system browser (Apple, Google, Microsoft, passkey, or password on the website).
   let data;try{data=await readAuthBody(request)}catch{return json({error:'Sign in again.'},400)}
   if(Object.keys(data).some(k=>!['code','verifier'].includes(k))||typeof data.code!=='string'||typeof data.verifier!=='string')return json({error:'Sign in again.'},400);
   const ip=request.headers.get('cf-connecting-ip');if(!ip)return json({error:'This request could not be verified.'},503);
   const now=new Date().toISOString(),expires=new Date(Date.now()+3600000).toISOString();
   const allowed=await env.DB.prepare('INSERT INTO reader_auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(await digest(`exchange-ip:${now.slice(0,13)}:${ip}`),expires,120).first();
   if(!allowed)return json({error:'Too many sign-in attempts. Try again in an hour.'},429);
   const account=await redeemAppHandoff(env,data.code,data.verifier);
   if(!account)return json({error:'That sign-in expired. Try again.'},400);
   return json(await issueNativeSession(env,account.id,account.email));
  }
  if(route==='/api/native-auth/delete-account'){
   const user=await getNativeReader(request,env);if(!user)return json({error:'Sign in again to continue.'},401);
   let data;try{data=await readAuthBody(request)}catch{return json({error:'Type DELETE to confirm.'},400)}
   if(data.confirm!=='DELETE')return json({error:'Type DELETE to confirm.'},400);
   await deleteAccount(env,user);
   return json({deleted:true});
  }
  if(route!=='/api/native-auth/signin')return json({error:'Not found.'},404);
  let data;try{data=await readAuthBody(request)}catch{return json({error:'Enter your email and password.'},400)}
  if(Object.keys(data).some(k=>!['email','password'].includes(k))||typeof data.email!=='string'||data.email.length>254||typeof data.password!=='string'||data.password.length>256)return json({error:'Enter your email and password.'},400);
  const email=data.email.trim().toLowerCase(),now=new Date().toISOString();
  const ip=request.headers.get('cf-connecting-ip');if(!ip)return json({error:'This request could not be verified.'},503);
  const expires=new Date(Date.now()+3600000).toISOString();
  await env.DB.prepare('DELETE FROM reader_auth_limits WHERE expires_at<?').bind(now).run();
  // Share the website's attempt counters so changing clients adds no guesses.
  for(const [key,max] of [[`signin-ip:${now.slice(0,13)}:${ip}`,30],[`signin-email:${now.slice(0,13)}:${email}`,10]]){
   const allowed=await env.DB.prepare('INSERT INTO reader_auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(await digest(key),expires,max).first();
   if(!allowed)return json({error:'Too many sign-in attempts. Try again in an hour or reset your password on the website.'},429);
  }
  const account=await env.DB.prepare('SELECT id,password_hash FROM reader_accounts WHERE email=?').bind(email).first();
  if(!await checkPassword(data.password,account?.password_hash))return json({error:'Email or password did not match. You can create an account or reset your password on the website.'},401);
  return json(await issueNativeSession(env,account.id,email));
 }catch{console.error('Native account operation failed');return json({error:'Sign-in is temporarily unavailable. Please try again.'},503)}
}
