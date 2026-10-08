'use client';
import {useState} from 'react';
import Link from 'next/link';
import {activeProgressCatalog,filterActiveProgressRecords} from '../../content/progress-catalog';
import {useReaderProgress} from '../reader-progress';
import {bookmarkCatalog} from '../../content/bookmark-catalog';
import AccountForm from '../account/sign-in';
import MembershipPlans from '../memberships/plans';
import SignInMethods,{DeleteAccount} from './sign-in-methods';
export default function ProgressDashboard(){
 const {data,error,busy,refresh,save,saveBookmark,clear}=useReaderProgress();const [confirm,setConfirm]=useState(false);const [signOutError,setSignOutError]=useState(false);
 const records=filterActiveProgressRecords(data?.records||[]),completed=records.filter(item=>item.status==='completed');
 const resume=records.filter(item=>item.status==='in_progress').sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];const next=activeProgressCatalog.find(item=>item.id===resume?.id);
 async function signedIn(){
  await refresh();
  const returnTo=new URLSearchParams(location.search).get('returnTo');
  if(returnTo){try{const destination=new URL(returnTo,location.origin);if(destination.origin===location.origin&&!['/account','/my-progress'].includes(destination.pathname))location.assign(destination.pathname+destination.search+destination.hash);}catch{/* Stay on My Account for invalid destinations. */}}
 }
 return <><header className="reader-heading"><p className="eyebrow">KEEP LEARNING</p><h1>My Account</h1><p>Your learning, account, and membership options in one place.</p></header>
 <nav className="reader-section-links" aria-label="My Account sections"><a href="#progress">Continue learning</a>{data?.user&&<><a href="#saved-materials">Saved materials</a><a href="#account-settings">Account settings</a></>}<a href="#memberships">Membership</a></nav>

 <section id="progress" className="reader-progress-section" aria-label="Progress and account">
 {error&&<p className="reader-error" role="alert">{error} <button onClick={()=>void refresh()}>Try again</button></p>}
 {!data&&!error&&<p><output>Loading your progress…</output></p>}
 {data&&(!data.user||data.user.needsPassword)&&<AccountForm existingEmail={data.user?.email} onSignedIn={signedIn}/>}
 {data?.user&&!data.user.needsPassword&&<p className="reader-app-note">Pick up where you left off across devices. In the Secure By Design app, sign in with this account and connect progress to sync completed lessons and saved materials.</p>}
 {data?.user&&<><section className="reader-resume" aria-labelledby="resume-title"><span>{next?'Continue learning':'Start learning'}</span><h2 id="resume-title">{next?.title||'Find something to explore.'}</h2><Link href={next?.href||'/training'}>{next?'Continue →':'Explore the Training Library →'}</Link></section><div className="reader-summary"><section><span>Completed</span><strong>{completed.length}</strong><p>learning modules</p></section><section><span>In progress</span><strong>{records.length-completed.length}</strong><p>saved for your next visit</p></section></div>
 <section id="saved-materials" className="reader-collection"><div className="reader-collection-heading"><h2>Saved materials</h2></div>{bookmarkCatalog.filter(item=>data.bookmarks?.some(saved=>saved.id===item.id&&saved.saved)).length?<ul>{bookmarkCatalog.filter(item=>data.bookmarks?.some(saved=>saved.id===item.id&&saved.saved)).map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link><button disabled={busy} onClick={()=>void saveBookmark(item.id,false)}>Remove from saved</button></li>)}</ul>:<p>Save course materials in a training guide or in the app to keep them here.</p>}</section>
 {['Network build','Network authorization'].map(group=>{const items=activeProgressCatalog.filter(item=>item.group===group);const count=items.filter(item=>completed.some(record=>record.id===item.id)).length;return <section className="reader-collection" key={group}><div className="reader-collection-heading"><h2>{group}</h2><span>{count} of {items.length} complete</span></div><progress max={items.length} value={count} aria-label={`${group}: ${count} of ${items.length} complete`}/><ul>{items.map(item=>{const record=records.find(row=>row.id===item.id);return <li key={item.id}><div><Link href={item.href}>{item.title}</Link><span>{record?.status==='completed'?'Completed':record?'In progress':'Not started'}</span></div><button disabled={busy} onClick={()=>void save(item.id,record?.status==='completed'?'in_progress':'completed')}>{record?.status==='completed'?'Mark incomplete':'Mark complete'}</button></li>})}</ul><Link href="/training">Open the Training Library →</Link></section>})}

 <section className="reader-collection"><div className="reader-collection-heading"><h2>Keep exploring</h2></div><p>Find interactive training and companion materials in the Training Library.</p><Link href="/training">Explore the Training Library →</Link></section>
 <section id="account-settings" className="reader-account-settings" aria-labelledby="account-settings-title"><h2 id="account-settings-title">Account settings</h2><div className="reader-account"><span>Signed in as {data.user.email}</span><button disabled={busy} onClick={async()=>{try{const response=await fetch("/api/reader-auth/signout",{method:"POST"});if(response.ok)location.assign("/my-progress");else setSignOutError(true)}catch{setSignOutError(true)}}}>Sign out</button></div>
 {signOutError&&<p role="alert">Could not sign out. Please try again.</p>}<SignInMethods/><section className="reader-privacy"><h2>Your progress, your choice.</h2><p>Completion is your own record of learning. It is not a certification or a record of lab assessment results.</p>{confirm?<><p>Clear all saved progress and your learning-path preferences? This cannot be undone.</p><div className="reader-actions"><button disabled={busy} onClick={async()=>{if(await clear())setConfirm(false)}}>Yes, clear my progress</button><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></div></>:<button onClick={()=>setConfirm(true)}>Clear my saved progress</button>}</section><DeleteAccount/></section></>}
 </section>
 <aside className="reader-membership-summary" aria-label="Community membership"><div><h2>{data?.membership?.status==='active'?'Community membership · Active':'Community is included.'}</h2><p>{data?.membership?.status==='active'?'You’re enrolled in Community. Learn it. Share it. Pay it forward.':'Submit your email through any signup or community form to join Community automatically. Sign in to see your membership and save your learning.'}</p></div><a href="#memberships">View membership options</a></aside>
 <section id="memberships" className="reader-memberships membership-page" aria-labelledby="membership-options-title" tabIndex={-1}><MembershipPlans /></section>
 </>;
}
