'use client';
import {useEffect,useState} from 'react';
import ProviderButtons from './provider-buttons';
type Mode='create'|'signin'|'reset';
export default function AccountForm({existingEmail='',onSignedIn}:{existingEmail?:string;onSignedIn:()=>Promise<void>}){
 const [ready,setReady]=useState(false),[providerReturn,setProviderReturn]=useState('/my-progress');
 useEffect(()=>{setReady(true);
  // Send provider sign-ins straight to the page that asked for sign-in, when it is on this site.
  const requested=new URLSearchParams(location.search).get('returnTo');
  const here=new URL(location.href);for(const key of ['signin_error','signed_in','linked'])here.searchParams.delete(key);
  try{const target=requested?new URL(requested,location.origin):null;setProviderReturn(target&&target.origin===location.origin?target.pathname+target.search+target.hash:here.pathname+here.search);}catch{setProviderReturn(here.pathname+here.search);}
 },[]);
 const [mode,setMode]=useState<Mode>(existingEmail?'reset':'create');
 const [email,setEmail]=useState(existingEmail),[code,setCode]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState('');
 const [consent,setConsent]=useState(false),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 function changeMode(next:Mode){setMode(next);setSent(false);setCode('');setPassword('');setConfirmPassword('');setError('');setMessage('');}
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
  try{
   if(sent&&password!==confirmPassword)throw new Error('Your passwords do not match.');
   const action=mode==='signin'?'signin':sent?'verify':'request';
   const value=mode==='signin'?{email,password}:sent?{code,password,confirmPassword}:{email,consent,purpose:mode};
   const response=await fetch('/api/reader-auth/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)});
   const body=await response.json() as {error?:string;message?:string};
   if(!response.ok)throw new Error(body.error||'Please try again.');
   if(action==='request'){setSent(true);setMessage(body.message||'Check your email.');}
   else{setPassword('');setConfirmPassword('');await onSignedIn();}
  }catch(e){setError(e instanceof Error?e.message:'Sign-in failed. Please try again.')}finally{setBusy(false)}
 }
 return <section className="reader-welcome reader-auth" aria-labelledby="account-title" id="account">
  <h2 id="account-title">{sent?'Verify your email and set your password':mode==='signin'?'Welcome back.':mode==='reset'?'Set or reset your password.':'One account for your learning.'}</h2>
  <p>{existingEmail?'Add a password to your existing account. Your saved progress stays with you.':'Save completed training, materials, and your learning path across devices.'}</p>
  {!existingEmail&&!sent&&mode!=='reset'&&<ProviderButtons returnTo={providerReturn} onSignedIn={onSignedIn}/>}
  <p className="reader-app-note">The iOS app is in invitation-only testing through TestFlight. Invited testers can use this same account to sync learning between the website and app. Android is coming soon.</p>
  <div className="reader-auth-modes" role="group" aria-label="Account options">
   <button type="button" aria-pressed={mode==='create'} disabled={busy} onClick={()=>changeMode('create')}>Create account</button>
   <button type="button" aria-pressed={mode==='signin'} disabled={busy} onClick={()=>changeMode('signin')}>Sign in</button>
   <button type="button" aria-pressed={mode==='reset'} disabled={busy} onClick={()=>changeMode('reset')}>Set or reset password</button>
  </div>
  <form onSubmit={submit}><fieldset className="reader-account-form" disabled={!ready||busy}>
   {sent?<><p role="status">Enter the code sent to {email}.</p><label htmlFor="reader-code">8-digit email verification code</label><input id="reader-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,8))} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{8}" required autoFocus/><p className="reader-note">Use this browser to enter your code within 10 minutes.</p></>:<><label htmlFor="reader-email">Email address</label><input id="reader-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required/></>}
   {(sent||mode==='signin')&&<><label htmlFor="reader-password">{mode==='signin'?'Password':'Choose a password'}</label><input id="reader-password" type="password" autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==='signin'?undefined:15} maxLength={128} aria-describedby={sent?'password-help':undefined} required/>{sent&&<><p id="password-help" className="reader-note">Use 15–128 characters. A long, unique passphrase works well.</p><label htmlFor="reader-confirm">Confirm password</label><input id="reader-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={15} maxLength={128} required/></>}</>}
   {!sent&&<p className="reader-note">{mode==='signin'?'Signing in automatically includes Community membership.':'Submitting your email automatically enrolls you in Community. Verify your email and set a password to access your account.'} No payment details required.</p>}
   {!sent&&mode!=='signin'&&<label className="reader-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>Save my email address for my Community membership and my private Secure By Design learning account.</span></label>}
   <button className="reader-primary" disabled={busy}>{busy?'Please wait…':mode==='signin'?'Sign in':sent?(mode==='reset'?'Save password and sign in':'Create permanent account'):'Email me a verification code'}</button>
   {sent&&<button type="button" onClick={()=>changeMode(mode)}>Request a new code or change email</button>}
   {message&&<p role="status">{message}</p>}{error&&<p className="reader-error" role="alert">{error}</p>}
  </fieldset></form>
  <p className="reader-note">Sign in with Apple, Google, Microsoft, a passkey, or a verified email and password. Your account and saved progress remain when you sign out. Reading stays open to everyone. Creating an account does not subscribe you to emails or grant lab access.</p>
 </section>;
}
