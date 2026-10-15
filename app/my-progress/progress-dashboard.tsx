'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {activeProgressCatalog,filterActiveProgressRecords} from '../../content/progress-catalog';
import {useReaderProgress} from '../reader-progress';
import {bookmarkCatalog} from '../../content/bookmark-catalog';
import AccountForm from '../account/sign-in';
import MembershipPlans from '../memberships/plans';
import SignInMethods,{DeleteAccount,ReauthNotice} from './sign-in-methods';
import {safeReturnPath} from '../account/safe-return';
import {COURSE_STEP_MODULES} from '../../lib/authorization/model.mjs';

// Course 2.1 "RMF to ATO" by RMF step: module completions plus the ATO Package Builder check for the learner's
// Secure By Design enclave (/api/authorization/progress). Owner direction, 15 October 2026: one progress record.
type StepProgress={user:unknown;system:{id:string;name:string}|null;steps:{id:string;label:string;done:boolean}[]};
function AuthorizationSteps({completed}:{completed:{id:string}[]}){
 const [data,setData]=useState<StepProgress|null>(null);
 useEffect(()=>{fetch('/api/authorization/progress',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setData).catch(()=>setData(null));},[]);
 const labels:Record<string,string>={prepare:'Prepare',categorize:'Categorize',select:'Select',implement:'Implement',assess:'Assess',authorize:'Authorize',monitor:'Monitor'};
 const rows=Object.entries(COURSE_STEP_MODULES).map(([id,modules],i)=>{
  const done=modules.filter(m=>completed.some(r=>r.id===`training:rmf-boe-ato:${m}`)).length,workspace=data?.steps.find(s=>s.id===id)?.done===true;
  return {id,number:i+1,label:labels[id],done,total:modules.length,workspace,complete:done===modules.length&&workspace};
 });
 const complete=rows.filter(r=>r.complete).length;
 return <section className="reader-collection reader-rmf-steps" aria-labelledby="rmf-steps-title"><div className="reader-collection-heading"><h2 id="rmf-steps-title">RMF to ATO by step</h2><span>{complete} of {rows.length} steps complete</span></div>
  <progress max={rows.length} value={complete} aria-label={`RMF to ATO: ${complete} of ${rows.length} steps complete`}/>
  <p>A step is complete when its modules are marked complete and the ATO Package Builder check passes on {data?.system?<strong>{data.system.name}</strong>:'your Secure By Design enclave'}.{!data?.system&&<> <Link href="/grc-rmf-training/workspace">Register it in the workspace →</Link></>}</p>
  <ol>{rows.map(r=><li key={r.id} className={r.complete?'is-complete':''}><Link href={`/grc-rmf-training/rmf/index.html#step/${r.id}`}>{r.complete?'✓ ':''}Step {r.number} · {r.label}</Link><span>Modules {r.done}/{r.total} · Package Builder {r.workspace?'✓':'to do'}</span></li>)}</ol>
 </section>;
}
export default function ProgressDashboard(){
 const {data,error,busy,refresh,save,saveBookmark,clear}=useReaderProgress();const [confirm,setConfirm]=useState(false);const [signOutError,setSignOutError]=useState(false);
 const records=filterActiveProgressRecords(data?.records||[]),completed=records.filter(item=>item.status==='completed');
 const resume=records.filter(item=>item.status==='in_progress').sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];const next=activeProgressCatalog.find(item=>item.id===resume?.id);
 async function signedIn(){
  await refresh();
  const returnTo=new URLSearchParams(location.search).get('returnTo');
  // Only paths on this site; anything else (another origin, "//host", "/.//host") stays on My Account.
  const destination=safeReturnPath(returnTo);
  if(destination&&!['/account','/my-progress'].includes(new URL(destination,location.origin).pathname))location.assign(destination);
 }
 return <><header className="reader-heading"><p className="eyebrow">KEEP LEARNING</p><h1>My Account</h1><p>Your learning, account, and membership options in one place.</p></header>
 <nav className="reader-section-links" aria-label="My Account sections"><a href="#progress">Continue learning</a>{data?.user&&<><a href="#saved-materials">Saved materials</a><a href="#account-settings">Account settings</a></>}<a href="#memberships">Membership</a></nav>

 <section id="progress" className="reader-progress-section" aria-label="Progress and account">
 {error&&<p className="reader-error" role="alert">{error} <button onClick={()=>void refresh()}>Try again</button></p>}
 {!data&&!error&&<p className="reader-loading"><output>Loading your progress…</output></p>}
 {data&&(!data.user||data.user.needsPassword)&&<AccountForm existingEmail={data.user?.email} onSignedIn={signedIn}/>}
 {data?.user&&!data.user.needsPassword&&<p className="reader-app-note">Pick up where you left off across devices. In the Secure By Design app, sign in with this account and connect progress to sync completed lessons and saved materials.</p>}
 {data?.user&&<><section className="reader-resume" aria-labelledby="resume-title"><span>{next?'Continue learning':'Start learning'}</span><h2 id="resume-title">{next?.title||'Find something to explore.'}</h2><Link href={next?.href||'/technical-training'}>{next?'Continue →':'Explore the Configuration Hub →'}</Link></section><div className="reader-summary"><section><span>Completed</span><strong>{completed.length}</strong><p>learning modules</p></section><section><span>In progress</span><strong>{records.length-completed.length}</strong><p>saved for your next visit</p></section></div>
 <section id="saved-materials" className="reader-collection"><div className="reader-collection-heading"><h2>Saved materials</h2></div>{bookmarkCatalog.filter(item=>!('retired' in item)&&data.bookmarks?.some(saved=>saved.id===item.id&&saved.saved)).length?<ul>{bookmarkCatalog.filter(item=>!('retired' in item)&&data.bookmarks?.some(saved=>saved.id===item.id&&saved.saved)).map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link><button disabled={busy} onClick={()=>void saveBookmark(item.id,false)}>Remove from saved</button></li>)}</ul>:<p>Save course materials in a training guide or in the app to keep them here.</p>}</section>
 <AuthorizationSteps completed={completed}/>
 {['Network build','Network authorization'].map(group=>{const items=activeProgressCatalog.filter(item=>item.group===group);const count=items.filter(item=>completed.some(record=>record.id===item.id)).length;return <section className="reader-collection" key={group}><div className="reader-collection-heading"><h2>{group}</h2><span>{count} of {items.length} complete</span></div><progress max={items.length} value={count} aria-label={`${group}: ${count} of ${items.length} complete`}/><ul>{items.map(item=>{const record=records.find(row=>row.id===item.id);return <li key={item.id}><div><Link href={item.href}>{item.title}</Link><span>{record?.status==='completed'?'Completed':record?'In progress':'Not started'}</span></div><button disabled={busy} onClick={()=>void save(item.id,record?.status==='completed'?'in_progress':'completed')}>{record?.status==='completed'?'Mark incomplete':'Mark complete'}</button></li>})}</ul>{group==='Network authorization'?<Link href="/grc-rmf-training">Open the Compliance Hub →</Link>:<Link href="/technical-training">Open the Configuration Hub →</Link>}</section>})}

 <section className="reader-collection"><div className="reader-collection-heading"><h2>Keep exploring</h2></div><p>Find interactive training and companion materials in the Configuration Hub.</p><Link href="/technical-training">Explore the Configuration Hub →</Link><p>Practicing authorization? The Compliance Hub has the RMF to ATO course, the ATO Package Builder and the ATO Template Library.</p><Link href="/grc-rmf-training">Explore the Compliance Hub →</Link></section>
 <section id="account-settings" className="reader-account-settings" aria-labelledby="account-settings-title"><h2 id="account-settings-title">Account settings</h2><div className="reader-account"><span>Signed in as {data.user.email}</span><button disabled={busy} onClick={async()=>{try{const response=await fetch("/api/reader-auth/signout",{method:"POST"});if(response.ok)location.assign("/my-progress");else setSignOutError(true)}catch{setSignOutError(true)}}}>Sign out</button></div>
 {signOutError&&<p role="alert">Could not sign out. Please try again.</p>}<OwnerReauth/><SignInMethods/><section className="reader-privacy"><h2>Your progress, your choice.</h2><p>Completion is your own record of learning. It is not a certification or a record of lab assessment results.</p>{confirm?<><p>Clear all saved progress and your learning-path preferences? This cannot be undone.</p><div className="reader-actions"><button disabled={busy} onClick={async()=>{if(await clear())setConfirm(false)}}>Yes, clear my progress</button><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></div></>:<button onClick={()=>setConfirm(true)}>Clear my saved progress</button>}</section><DeleteAccount/></section></>}
 </section>
 <section id="memberships" className="reader-memberships membership-page" aria-labelledby="membership-options-title" tabIndex={-1}><MembershipPlans /></section>
 </>;
}

// Owner record pages send the owner here when their sign-in is more than 12 hours old.
function OwnerReauth(){
 const [returnTo,setReturnTo]=useState<string|null>(null);
 useEffect(()=>{const params=new URLSearchParams(location.search);if(params.get('owner_reauth')==='1')setReturnTo(safeReturnPath(params.get('returnTo')));},[]);
 return returnTo?<ReauthNotice message="For your security, sign in again to open the owner records." returnTo={returnTo}/>:null;
}
