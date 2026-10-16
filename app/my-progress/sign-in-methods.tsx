'use client';
import {useCallback,useEffect,useState} from 'react';
import {ProviderLogo,providerNames,signInErrors,startUrl,type ProviderId} from '../account/provider-buttons';
import {addPasskey,passkeysSupported} from '../account/passkeys';

type Methods={email:string;password:boolean;identities:{provider:ProviderId;subject:string;email:string|null;createdAt:string}[];passkeys:{id:string;label:string|null;createdAt:string;lastUsedAt:string|null}[];providers:Record<ProviderId,boolean>};
const day=(value:string|null)=>value?new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
const order:ProviderId[]=['apple','google','microsoft'];
// Sensitive changes need a recent sign-in. Sign out and come back here through the sign-in form.
async function signInAgain(returnTo:string){try{await fetch('/api/reader-auth/signout',{method:'POST'});}finally{location.assign('/my-progress?returnTo='+encodeURIComponent(returnTo)+'#account');}}
export function ReauthNotice({message,returnTo='/my-progress#account-settings'}:{message:string;returnTo?:string}){return <p className="reader-error" role="alert">{message} <button type="button" onClick={()=>void signInAgain(returnTo)}>Sign in again</button></p>;}

export default function SignInMethods(){
 const [methods,setMethods]=useState<Methods|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[reauth,setReauth]=useState(false);
 const [supportsPasskeys,setSupportsPasskeys]=useState(false);
 const load=useCallback(async()=>{try{const r=await fetch('/api/sign-in/methods',{cache:'no-store'});if(r.ok)setMethods(await r.json());}catch{setError('Sign-in methods are unavailable right now.')}},[]);
 useEffect(()=>{setSupportsPasskeys(passkeysSupported());void load();
  const params=new URLSearchParams(location.search),linked=params.get('linked') as ProviderId|null,failed=params.get('signin_error');
  if(linked&&providerNames[linked])setMessage(`${providerNames[linked]} is now linked. You can use it to sign in.`);
  if(failed==='reauth')setReauth(true);else if(failed)setError(Object.prototype.hasOwnProperty.call(signInErrors,failed)?signInErrors[failed]:signInErrors.failed);
 },[load]);
 async function remove(body:{kind:'identity';provider:ProviderId;subject:string}|{kind:'passkey';id:string}){
  setBusy(true);setError('');setMessage('');setReauth(false);
  try{const r=await fetch('/api/sign-in/methods/remove',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(d.reauth){setReauth(true);return;}if(!r.ok)throw new Error(d.error);setMethods(m=>m?{...m,...d}:m);setMessage('Removed.');}
  catch(e){setError(e instanceof Error&&e.message?e.message:'Could not remove that method.')}finally{setBusy(false)}
 }
 if(!methods)return null;
 const linked=new Set(methods.identities.map(i=>i.provider));
 const addable=order.filter(id=>methods.providers[id]&&!linked.has(id));
 return <section className="sign-in-methods" aria-labelledby="sign-in-methods-title">
  <h3 id="sign-in-methods-title">Ways to sign in</h3>
  <ul className="sign-in-method-list">
   <li><span className="method-icon" aria-hidden="true">✉</span><div><strong>Email and password</strong><span>{methods.password?methods.email:'No password set · you can set one with “Set or reset password”'}</span></div></li>
   {methods.identities.map(i=><li key={i.provider+i.subject}><span className="method-icon"><ProviderLogo id={i.provider}/></span><div><strong>{providerNames[i.provider]}</strong><span>{i.email||'Linked'} · added {day(i.createdAt)}</span></div><button type="button" disabled={busy} onClick={()=>void remove({kind:'identity',provider:i.provider,subject:i.subject})}>Remove</button></li>)}
   {methods.passkeys.map(p=><li key={p.id}><span className="method-icon" aria-hidden="true">🔑</span><div><strong>Passkey · {p.label||'Passkey'}</strong><span>Added {day(p.createdAt)}{p.lastUsedAt?` · last used ${day(p.lastUsedAt)}`:''}</span></div><button type="button" disabled={busy} onClick={()=>void remove({kind:'passkey',id:p.id})}>Remove</button></li>)}
  </ul>
  <div className="sign-in-method-add">
   {supportsPasskeys&&<button type="button" className="reader-primary" disabled={busy} onClick={async()=>{setBusy(true);setError('');setMessage('');try{if(await addPasskey()){await load();setMessage('Passkey added. Next time, choose “Sign in with a passkey”.');}}catch(e){const text=e instanceof Error?e.message:'Could not add a passkey.';if(/sign in again/i.test(text))setReauth(true);else setError(text);}finally{setBusy(false)}}}>Add a passkey</button>}
   {addable.map(id=><a key={id} className={`sso-button sso-${id}`} href={startUrl(id,'/my-progress#account-settings','link')}><ProviderLogo id={id}/><span>Link {providerNames[id]}</span></a>)}
  </div>
  <p className="reader-note">A passkey uses your device’s screen lock (Face ID, Touch ID, fingerprint, or PIN). Your fingerprint or face never leaves your device.</p>
  {message&&<p role="status">{message}</p>}{error&&<p className="reader-error" role="alert">{error}</p>}
  {reauth&&<ReauthNotice message="For your security, sign in again to change how you sign in."/>}
 </section>;
}

export function DeleteAccount(){
 const [open,setOpen]=useState(false),[typed,setTyped]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reauth,setReauth]=useState(false);
 return <section id="delete-account" className="reader-privacy reader-delete" aria-labelledby="delete-account-title">
  <h2 id="delete-account-title">Delete your account</h2>
  <p>This permanently deletes your account, sign-in methods, saved progress, saved materials, learning activity, Community record, and email preferences. It can’t be undone.</p>
  {open?<form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/sign-in/delete-account',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirm:typed})});const d=await r.json();if(d.reauth){setReauth(true);setBusy(false);return;}if(!r.ok)throw new Error(d.error);location.assign('/?account=deleted');}catch(err){setError(err instanceof Error&&err.message?err.message:'Could not delete your account.');setBusy(false)}}}>
   <label htmlFor="delete-confirm">Type DELETE to confirm</label>
   <input id="delete-confirm" value={typed} onChange={e=>setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters"/>
   <div className="reader-actions"><button disabled={busy||typed!=='DELETE'}>{busy?'Deleting…':'Delete my account permanently'}</button><button type="button" disabled={busy} onClick={()=>{setOpen(false);setTyped('')}}>Cancel</button></div>
   {error&&<p className="reader-error" role="alert">{error}</p>}
   {reauth&&<ReauthNotice message="For your security, sign in again before deleting your account."/>}
  </form>:<button type="button" onClick={()=>setOpen(true)}>Delete my account…</button>}
 </section>;
}
