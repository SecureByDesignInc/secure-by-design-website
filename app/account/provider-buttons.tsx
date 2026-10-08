'use client';
import {useEffect,useState} from 'react';
import {passkeysSupported,signInWithPasskey} from './passkeys';

export type ProviderId='apple'|'google'|'microsoft';
export const providerNames:Record<ProviderId,string>={apple:'Apple',google:'Google',microsoft:'Microsoft'};
const order:ProviderId[]=['apple','google','microsoft'];
// Messages for ?signin_error= after a provider redirects back.
export const signInErrors:Record<string,string>={
 cancelled:'Sign-in was cancelled.',
 expired:'That sign-in took too long or was opened in another browser. Please try again.',
 failed:'We couldn’t complete that sign-in. Please try again or use another method.',
 unavailable:'That sign-in option isn’t available yet. Use another method.',
 busy:'Too many sign-in attempts. Please try again later.',
 signin_first:'Sign in first, then add another sign-in method.',
 reauth:'For your security, sign in again, then add the sign-in method.',
 linked_elsewhere:'That account is already linked to a different Secure By Design account.',
 unverified_email:'That account didn’t confirm your email address. Sign in another way, then add it in My Account.',
 unverified_microsoft:'Your work or school Microsoft account doesn’t confirm your email address to us. Sign in with your email, Apple, Google, or a passkey, then add Microsoft from My Account.',
};
export function ProviderLogo({id}:{id:ProviderId}){
 if(id==='apple')return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C4 18.38 2.96 15.57 2.96 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.62 0 2.89.06 4.38 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.95 4.45z"/></svg>;
 if(id==='google')return <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
 return <svg viewBox="0 0 21 21" width="18" height="18" aria-hidden="true"><rect width="10" height="10" fill="#f25022"/><rect x="11" width="10" height="10" fill="#7fba00"/><rect y="11" width="10" height="10" fill="#00a4ef"/><rect x="11" y="11" width="10" height="10" fill="#ffb900"/></svg>;
}
export const providerLabel=(id:ProviderId)=>id==='microsoft'?'Sign in with Microsoft':`Continue with ${providerNames[id]}`;
export function useProviders(){
 const [providers,setProviders]=useState<Record<ProviderId,boolean>|null>(null);
 useEffect(()=>{fetch('/api/sign-in/providers',{cache:'no-store'}).then(r=>r.json()).then((d:{providers:Record<ProviderId,boolean>})=>setProviders(d.providers)).catch(()=>setProviders({apple:false,google:false,microsoft:false}));},[]);
 return providers;
}
export function startUrl(id:ProviderId,returnTo:string,intent:'signin'|'link'='signin'){return `/api/sign-in/${id}/start?intent=${intent}&returnTo=${encodeURIComponent(returnTo)}`;}

export default function ProviderButtons({returnTo,onSignedIn}:{returnTo:string;onSignedIn:()=>Promise<void>|void}){
 const providers=useProviders();
 const [passkeys,setPasskeys]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setPasskeys(passkeysSupported());const code=new URLSearchParams(location.search).get('signin_error');if(code)setError(Object.prototype.hasOwnProperty.call(signInErrors,code)?signInErrors[code]:signInErrors.failed);},[]);
 const available=order.filter(id=>providers?.[id]);
 if(!available.length&&!passkeys)return error?<p className="reader-error" role="alert">{error}</p>:null;
 return <div className="sso" aria-label="Other ways to sign in">
  <div className="sso-buttons">
   {available.map(id=><a key={id} className={`sso-button sso-${id}`} href={startUrl(id,returnTo)}><ProviderLogo id={id}/><span>{providerLabel(id)}</span></a>)}
   {passkeys&&<button type="button" className="sso-button sso-passkey" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{if(await signInWithPasskey())await onSignedIn();}catch(e){setError(e instanceof Error?e.message:'Passkey sign-in failed.')}finally{setBusy(false)}}}>
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0 1 9-5.2"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M17.5 18v4M17.5 20.5h2"/></svg>
    <span>{busy?'Waiting for your passkey…':'Sign in with a passkey'}</span></button>}
  </div>
  {error&&<p className="reader-error" role="alert">{error}</p>}
  <p className="sso-divider"><span>or use your email</span></p>
 </div>;
}
