'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {TEMPLATES,DECISION_SHORT,authorizationStatus} from '../../../lib/authorization/model.mjs';
import {api,Badge,decisionTone,formatDate,type State,type System} from './shared';
import SystemView from './system-view';

type Summary=System&{controls:number;openPoam:number};
type List={user:{email:string}|null;systems:Summary[];limit?:number};
const readHash=()=>{const params=new URLSearchParams(typeof location==='undefined'?'':location.hash.slice(1));return {system:params.get('system'),tab:params.get('tab')||'overview'};};

export default function Workspace(){
 const [list,setList]=useState<List|null>(null);const [error,setError]=useState('');
 const [route,setRoute]=useState<{system:string|null;tab:string}>({system:null,tab:'overview'});
 const [state,setState]=useState<State|null>(null);const [loadingSystem,setLoadingSystem]=useState(false);
 const refreshList=useCallback(async()=>{try{setList(await api('GET',''));setError('')}catch(e){setError((e as Error).message)}},[]);
 useEffect(()=>{setRoute(readHash());void refreshList();const onHash=()=>setRoute(readHash());window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash);},[refreshList]);
 useEffect(()=>{
  if(!route.system||!list?.user){setState(null);return;}
  if(state?.system.id===route.system)return;
  setLoadingSystem(true);
  api('GET','/systems/'+route.system).then(s=>{setState(s);setError('')}).catch(e=>{setError((e as Error).message);setState(null)}).finally(()=>setLoadingSystem(false));
 },[route.system,list?.user,state?.system.id]);
 const go=(system:string|null,tab='overview')=>{const hash=system?`#system=${system}&tab=${tab}`:'#systems';if(location.hash!==hash)history.pushState(null,'',hash);setRoute({system,tab});window.scrollTo({top:0});};

 const intro=<header className="reader-heading awx-heading"><p className="eyebrow"><a href="/grc-rmf-training">GRC &amp; RMF TRAINING LIBRARY</a> · PRACTICE</p><h1>Authorization Workspace</h1><p>Take a system through an Authorization to Operate the way authorization teams do it in tools like eMASS and Xacta: register and categorize it, implement and assess its controls, build the Body of Evidence, track weaknesses in a POA&amp;M, and route the package through review to a decision.</p></header>;
 if(error&&!list)return <>{intro}<p className="reader-error" role="alert">{error} <button type="button" onClick={()=>void refreshList()}>Try again</button></p></>;
 if(!list)return <>{intro}<p className="reader-loading"><output>Loading your workspace…</output></p></>;
 if(!list.user)return <>{intro}<Landing/></>;
 if(route.system){
  if(state&&state.system.id===route.system)return <SystemView state={state} setState={setState} tab={route.tab} go={tab=>go(route.system,tab)} back={()=>{go(null);void refreshList();}} onDeleted={()=>{setState(null);go(null);void refreshList();}}/>;
  return <>{intro}{error?<p className="reader-error" role="alert">{error} <button type="button" onClick={()=>go(null)}>Back to your systems</button></p>:<p className="reader-loading"><output>{loadingSystem?'Opening the system…':'Loading…'}</output></p>}</>;
 }
 return <>{intro}<Systems list={list} open={id=>go(id)} created={s=>{setState(s);go(s.system.id,'overview');void refreshList();}}/></>;
}

function Landing(){
 const steps=[
  ['Register','Describe the system and its boundary, assign the roles, and categorize it from its information types.'],
  ['Implement','Select controls from NIST SP 800-53 Rev. 5, write implementation statements, and link the evidence that proves them.'],
  ['Assess','Switch to the assessor’s seat: record a result for every SP 800-53A objective and validate or return each control.'],
  ['Authorize','Plan every weakness in the POA&M, then route the package through the ISSM, the assessor, and the Authorizing Official.'],
  ['Monitor','Track the termination date, overdue milestones, changes, and reassessments. Export your SSP, SAR, and POA&M for your portfolio.'],
 ];
 return <section className="awx-landing" aria-label="What you will do">
  <ol className="awx-steps">{steps.map(([title,text],i)=><li key={title}><span>{String(i+1).padStart(2,'0')}</span><h2>{title}</h2><p>{text}</p></li>)}</ol>
  <div className="reader-welcome awx-signin">
   <h2>Sign in to start</h2>
   <p>Your systems are saved privately to your Secure By Design account, so you can pick up the package on any device. Nothing you enter is shared or published. Use practice or fictional details: never enter a real organization’s sensitive, controlled, or classified information.</p>
   <a className="reader-primary" href="/my-progress?returnTo=%2Fgrc-rmf-training%2Fworkspace#account">Create account or sign in</a>
   <p className="reader-note">New to authorization? Start with <a href="/grc-rmf-training/rmf/index.html#step/prepare">course 2.1, RMF to ATO</a>: each of its seven steps has the lessons, the same task here, and the templates it uses.</p>
  </div>
 </section>;
}

function Systems({list,open,created}:{list:List;open:(id:string)=>void;created:(s:State)=>void}){
 // An account keeps one of each "once" template (the Secure By Design enclave): once registered, that choice
 // shows as already added with a link to open it. The server enforces the same rule (server/authorization.js).
 const registered=(id:string)=>list.systems.find(s=>s.profile.template===id);
 const available=(id:string)=>!((TEMPLATES as any)[id]?.once&&registered(id));
 const [template,setTemplate]=useState(()=>available('sbd-enclave')?'sbd-enclave':'blank');const [name,setName]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const sending=useRef(false);
 useEffect(()=>{if(!available(template))setTemplate('blank');});
 const full=list.systems.length>=(list.limit||5);
 async function register(e:React.FormEvent){
  e.preventDefault();
  // A second tap while the first request is in flight is ignored, so one click registers one system.
  if(sending.current||!available(template))return;
  sending.current=true;setBusy(true);setError('');
  try{created(await api('POST','/systems',{template,...(name.trim()?{name:name.trim()}:{})}))}catch(err){setError((err as Error).message)}finally{sending.current=false;setBusy(false)}
 }
 return <>
  {list.systems.length>0&&<section className="awx-section" aria-labelledby="awx-systems"><h2 id="awx-systems">Your systems</h2>
   <ul className="awx-system-list">{list.systems.map(s=>{const status=authorizationStatus(s);return <li key={s.id}><button type="button" onClick={()=>open(s.id)}>
    <span className="awx-system-name">{s.profile.name}<small>{s.profile.acronym}</small></span>
    <span className="awx-system-meta"><Badge tone={decisionTone[status]}>{DECISION_SHORT[status]}</Badge><span>{s.controls} controls</span><span>{s.openPoam} open POA&amp;M</span>{s.authorization?.terminationDate&&status!=='dato'&&<span>Terminates {formatDate(s.authorization.terminationDate)}</span>}</span>
   </button></li>})}</ul>
  </section>}
  <section className="awx-section awx-register" aria-labelledby="awx-register"><h2 id="awx-register">{list.systems.length?'Register another system':'Register your first system'}</h2>
   {full?<p className="reader-note">You can keep up to {list.limit||5} systems. Delete one (System tab) to register another.</p>:
   <form onSubmit={register}>
    <fieldset className="awx-templates"><legend className="awx-label">Start from</legend>
     {Object.entries(TEMPLATES).map(([id,t]:[string,any])=>{const existing=available(id)?null:registered(id);return existing
      ?<div key={id} className="awx-template-added"><strong>{t.label}</strong><span>Already in your systems. You keep one, so your work stays in one place.</span><button type="button" onClick={()=>open(existing.id)}>Open {existing.profile.name}</button></div>
      :<label key={id} className={template===id?'selected':''}><input type="radio" name="template" value={id} checked={template===id} onChange={()=>setTemplate(id)}/><strong>{t.label}</strong><span>{t.detail}</span></label>})}
    </fieldset>
    <label className="awx-field"><span className="awx-label">System name{template==='sbd-enclave'?' (optional)':''}</span><input value={name} maxLength={120} onChange={e=>setName(e.target.value)} placeholder={template==='sbd-enclave'?'Secure By Design Enclave':'Name the system'} required={template==='blank'}/></label>
    {error&&<p className="reader-error" role="alert">{error}</p>}
    <button className="reader-primary" disabled={busy||!available(template)}>{busy?'Registering…':'Register the system'}</button>
   </form>}
  </section>
  <p className="reader-note awx-signed-in">Signed in as {list.user?.email}. <a href="/my-progress">My Account</a></p>
 </>;
}
