'use client';
// Opened by the Secure By Design app in the system browser (ASWebAuthenticationSession / Custom Tabs).
// After the learner signs in here, a one-time code goes back to the app, which proves it started the
// request with its PKCE verifier before it receives a session.
import {useEffect,useState} from 'react';
import {useReaderProgress} from '../reader-progress';
import AccountForm from '../account/sign-in';

export default function AppSignIn(){
 const {data,error:loadError,refresh}=useReaderProgress();
 const [challenge,setChallenge]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const value=new URLSearchParams(location.search).get('challenge');setChallenge(value&&/^[A-Za-z0-9_-]{43}$/.test(value)?value:'');},[]);
 async function continueToApp(){
  setBusy(true);setError('');
  try{const r=await fetch('/api/sign-in/app-handoff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({challenge})});const d=await r.json();if(!r.ok)throw new Error(d.error);location.assign(d.redirect);}
  catch(e){setError(e instanceof Error&&e.message?e.message:'Could not return to the app. Try again.');setBusy(false);}
 }
 if(loadError)return <p className="reader-error" role="alert">{loadError} <button onClick={()=>void refresh()}>Try again</button></p>;
 if(challenge===null||!data)return <p><output>Loading…</output></p>;
 if(!challenge)return <section className="reader-welcome"><h1>Open sign-in from the app</h1><p>This page signs you in to the Secure By Design app. Open the app, go to My Account, and choose Sign in.</p></section>;
 return <>
  <header className="reader-heading"><p className="eyebrow">SECURE BY DESIGN APP</p><h1>Sign in to the app</h1><p>Use the same account as the website. Your progress and saved materials stay in sync.</p></header>
  {data.user&&!data.user.needsPassword?<section className="reader-welcome" aria-labelledby="continue-title">
   <h2 id="continue-title">Continue as {data.user.email}?</h2>
   <p>The Secure By Design app will open signed in to this account. Only continue if you just chose <strong>Sign in</strong> in the Secure By Design app.</p>
   <div className="reader-actions"><button className="reader-primary" disabled={busy} onClick={()=>void continueToApp()}>{busy?'Opening the app…':'Continue to the app'}</button>
   <button disabled={busy} onClick={async()=>{await fetch('/api/reader-auth/signout',{method:'POST'});await refresh();}}>Use a different account</button></div>
   {error&&<p className="reader-error" role="alert">{error}</p>}
  </section>:<AccountForm existingEmail={data.user?.email} onSignedIn={refresh}/>}
 </>;
}
