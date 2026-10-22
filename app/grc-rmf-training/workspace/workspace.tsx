'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {TEMPLATES,DECISION_SHORT,authorizationStatus} from '../../../lib/authorization/model.mjs';
import {api,Badge,decisionTone,formatDate,isVisitor,setVisitor,type State,type System} from './shared';
import SystemView from './system-view';

type Summary=System&{controls:number;openPoam:number};
type List={user:{email:string|null}|null;systems:Summary[];limit?:number};
const readHash=()=>{const params=new URLSearchParams(typeof location==='undefined'?'':location.hash.slice(1));return {system:params.get('system'),tab:params.get('tab')||'overview'};};

export default function Workspace(){
 const [list,setList]=useState<List|null>(null);const [error,setError]=useState('');
 const [route,setRoute]=useState<{system:string|null;tab:string}>({system:null,tab:'overview'});
 const [state,setState]=useState<State|null>(null);const [loadingSystem,setLoadingSystem]=useState(false);
 const refreshList=useCallback(async()=>{try{
  let next=await api('GET','');
  // Owner direction, 21 October 2026: a visitor without an account uses every feature, in this page only.
  if(!next.user&&!isVisitor()){setVisitor(true);next=await api('GET','');}
  setList(next);setError('');
 }catch(e){setError((e as Error).message)}},[]);
 // Visitor work lasts for this visit only, so ask before the page closes on registered systems.
 useEffect(()=>{
  const warn=(e:BeforeUnloadEvent)=>{if(isVisitor()&&list?.systems.length){e.preventDefault();e.returnValue='';}};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[list?.systems.length]);
 useEffect(()=>{setRoute(readHash());void refreshList();const onHash=()=>setRoute(readHash());window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash);},[refreshList]);
 useEffect(()=>{
  if(!route.system||!list?.user){setState(null);return;}
  if(state?.system.id===route.system)return;
  setLoadingSystem(true);
  api('GET','/systems/'+route.system).then(s=>{setState(s);setError('')}).catch(e=>{setError((e as Error).message);setState(null)}).finally(()=>setLoadingSystem(false));
 },[route.system,list?.user,state?.system.id]);
 const go=(system:string|null,tab='overview')=>{const hash=system?`#system=${system}&tab=${tab}`:'#systems';if(location.hash!==hash)history.pushState(null,'',hash);setRoute({system,tab});window.scrollTo({top:0});};

 const intro=<header className="reader-heading awx-heading"><p className="eyebrow"><a href="/grc-rmf-training">ATO PACKAGE BUILDER HUB</a> · PRACTICE</p><h1>ATO Package Builder</h1><p>Take a system through an Authorization to Operate the way authorization teams do it: register and categorize it, implement and assess its controls, build the Body of Evidence, track weaknesses in a POA&amp;M, and route the package through review to a decision.</p></header>;
 if(error&&!list)return <>{intro}<p className="reader-error" role="alert">{error} <button type="button" onClick={()=>void refreshList()}>Try again</button></p></>;
 if(!list)return <>{intro}<p className="reader-loading"><output>Loading the ATO Package Builder…</output></p></>;
 if(route.system){
  if(state&&state.system.id===route.system)return <SystemView state={state} setState={setState} tab={route.tab} go={tab=>go(route.system,tab)} back={()=>{go(null);void refreshList();}} onDeleted={()=>{setState(null);go(null);void refreshList();}}/>;
  return <>{intro}{error?<p className="reader-error" role="alert">{error} <button type="button" onClick={()=>go(null)}>Back to your systems</button></p>:<p className="reader-loading"><output>{loadingSystem?'Opening the system…':'Loading…'}</output></p>}</>;
 }
 return <>{intro}<Systems list={list} open={id=>go(id)} created={s=>{setState(s);go(s.system.id,'overview');void refreshList();}}/></>;
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
  {isVisitor()
   ?<p className="reader-note awx-signed-in awx-visitor">You’re using the builder without an account, so your work lasts until you leave or reload this page. To keep it, <a href="/my-progress?returnTo=%2Fgrc-rmf-training%2Fworkspace#account">sign in or create a free account</a> first.</p>
   :<p className="reader-note awx-signed-in">Signed in as {list.user?.email}. Your systems are saved to your account. <a href="/my-progress">My Account</a></p>}
 </>;
}
