'use client';
import {useEffect,useRef,useState} from 'react';
import {
 phases,issmReview,scaReview,monitoring,riskCounts,compliance,authorizationStatus,DECISION_SHORT,DECISIONS,PACKAGE_TYPES,ROLES,
 SYSTEM_TYPES,LEVELS,LEVEL_ORDER,highWater,FREQUENCIES,acceptedEvidence,daysUntil,
} from '../../lib/authorization/model.mjs';
import {api,Badge,Checklist,Field,Hat,decisionTone,formatDate,formatTime,type Act,type State,type Profile} from './shared';
import {ControlsTab,AssessmentTab} from './controls-views';
import {EvidenceTab,PoamTab} from './evidence-poam';
import PackageTab from './package-view';

export const TABS:[string,string][]=[['overview','Overview'],['system','System'],['controls','Controls'],['assessment','Assessment'],['evidence','Evidence'],['poam','POA&M'],['package','Package'],['monitor','Monitor'],['history','History']];

export default function SystemView({state,setState,tab,go,back,onDeleted}:{state:State;setState:(s:State)=>void;tab:string;go:(tab:string)=>void;back:()=>void;onDeleted:()=>void}){
 const [message,setMessage]=useState<{tone:'error'|'ok';text:string}|null>(null);const [busy,setBusy]=useState(false);
 const messageRef=useRef<HTMLParagraphElement>(null);const tabsRef=useRef<HTMLElement>(null);
 const current=TABS.some(([id])=>id===tab)?tab:'overview';
 const act:Act=async(method,path,body,options={})=>{
  setBusy(true);setMessage(null);
  try{
   const next=await api(method,`/systems/${state.system.id}${path}`,body);if(next?.system)setState(next);
   const ok=typeof options.ok==='function'?options.ok(next):options.ok;
   if(ok||!options.quiet)setMessage({tone:'ok',text:ok||'Saved.'});
   return next?.system?next:state;
  }
  catch(e){setMessage({tone:'error',text:(e as Error).message});setTimeout(()=>messageRef.current?.focus(),0);return null;}
  finally{setBusy(false);}
 };
 useEffect(()=>{tabsRef.current?.querySelector('[aria-current=page]')?.scrollIntoView({inline:'center',block:'nearest'});},[tab]);
 useEffect(()=>{if(message?.tone!=='ok')return;const t=setTimeout(()=>setMessage(null),message.text.length>20?6000:2500);return()=>clearTimeout(t);},[message]);
 const status=authorizationStatus(state.system);
 const p=state.system.profile;
 return <div className="awx-system" aria-busy={busy}>
  <div className="awx-system-head">
   <button type="button" className="awx-back" onClick={back}>← Your systems</button>
   <div className="awx-system-title"><p className="eyebrow">{p.acronym||'SYSTEM'} · v{p.version||'1.0'}</p><h1>{p.name}</h1></div>
   <div className="awx-system-status"><Badge tone={decisionTone[status]}>{DECISION_SHORT[status]}</Badge>{state.system.authorization?.terminationDate&&status!=='dato'&&<span>Terminates {formatDate(state.system.authorization.terminationDate)}</span>}</div>
  </div>
  <nav ref={tabsRef} className="awx-tabs" aria-label="Workspace sections">{TABS.map(([id,label])=><a key={id} href={`#system=${state.system.id}&tab=${id}`} aria-current={current===id?'page':undefined} onClick={e=>{e.preventDefault();go(id);}}>{label}</a>)}</nav>
  <p ref={messageRef} tabIndex={-1} className={message?(message.tone==='error'?'reader-error awx-message':'awx-saved awx-message'):'awx-message-empty'} role={message?.tone==='error'?'alert':'status'}>{message?.text}</p>
  <div className="awx-panel">
   {current==='overview'&&<Overview state={state} go={go}/>}
   {current==='system'&&<SystemTab state={state} act={act} busy={busy} onDeleted={onDeleted}/>}
   {current==='controls'&&<ControlsTab state={state} act={act} busy={busy} go={go}/>}
   {current==='assessment'&&<AssessmentTab state={state} act={act} busy={busy}/>}
   {current==='evidence'&&<EvidenceTab state={state} act={act} busy={busy}/>}
   {current==='poam'&&<PoamTab state={state} act={act} busy={busy}/>}
   {current==='package'&&<PackageTab state={state} act={act} busy={busy} go={go}/>}
   {current==='monitor'&&<MonitorTab state={state} act={act} busy={busy} go={go}/>}
   {current==='history'&&<HistoryTab state={state}/>}
  </div>
 </div>;
}

function Overview({state,go}:{state:State;go:(tab:string)=>void}){
 const steps=phases(state),counts=riskCounts(state);
 const byCompliance=state.controls.reduce((m:Record<string,number>,c)=>{const k=compliance(c);m[k]=(m[k]||0)+1;return m;},{});
 const accepted=state.artifacts.filter(a=>a.reviewState==='accepted').length;
 const checks=[...issmReview(state),...scaReview(state)].filter(c=>!c.ok);
 const alerts=state.system.authorization?monitoring(state):[];
 const auth=state.system.authorization;
 return <>
  {/* Each phase opens the same RMF step in course 2.1 "RMF to ATO" (public/training/rmf/), with its lessons and templates. */}
  <ol className="awx-phases" aria-label="RMF lifecycle">{steps.map((s:any,i:number)=><li key={s.id} className={s.done?'done':''}><a href={`/training/rmf/index.html#step/${s.id}`} title={`${s.label}: lessons and templates in course 2.1`}><span>{s.done?'✓':i+1}</span>{s.label}<small>Learn this step</small></a></li>)}</ol>
  <div className="awx-stats">
   <button type="button" onClick={()=>go('controls')}><strong>{state.controls.length}</strong><span>controls in scope</span><small>{byCompliance.compliant||0} compliant · {byCompliance.non_compliant||0} non-compliant · {byCompliance.inherited||0} inherited · {byCompliance.not_assessed||0} not assessed</small></button>
   <button type="button" onClick={()=>go('evidence')}><strong>{accepted}<em>/{state.artifacts.length}</em></strong><span>evidence accepted</span><small>{state.artifacts.filter(a=>a.reviewState==='submitted').length} awaiting review</small></button>
   <button type="button" onClick={()=>go('poam')}><strong>{counts.open}</strong><span>open POA&amp;M items</span><small>{counts.cat1} CAT I · {counts.cat2} CAT II · {counts.cat3} CAT III</small></button>
   <button type="button" onClick={()=>go('package')}><strong className="awx-stat-word">{state.package?(state.package.stage==='returned'?'Returned':'Drafting'):auth?DECISION_SHORT[authorizationStatus(state.system)]:'Not started'}</strong><span>authorization package</span><small>{auth?`Last decision ${formatDate(auth.decidedAt)}`:'No decision yet'}</small></button>
  </div>
  {alerts.length>0&&<section className="awx-section"><h2>Needs attention</h2><ul className="awx-alerts">{alerts.slice(0,6).map((a:any,i:number)=><li key={i} className={'awx-alert-'+a.level}><span>{a.text}</span><button type="button" className="awx-link" onClick={()=>go(a.tab)}>Open</button></li>)}</ul></section>}
  <section className="awx-section"><h2>{checks.length?'What the reviewers will look for next':'Ready for review'}</h2>
   {checks.length?<><p className="awx-lead">These are the checks the ISSM and the assessor run when you submit the package. Work through them in any order.</p><Checklist checks={checks.slice(0,6)} go={go}/>{checks.length>6&&<p className="reader-note">{checks.length-6} more on the Package tab.</p>}</>:<p className="awx-lead">Every ISSM and assessor check passes. Submit the package on the Package tab for the Authorizing Official’s decision.</p>}
  </section>
  <details className="awx-explainer"><summary>How this workspace maps to eMASS and Xacta</summary>
   <div><p><strong>System record.</strong> Like registering a system in eMASS or creating a project in Xacta 360: identity, boundary, roles, information types and categorization.</p>
   <p><strong>Control approval chain.</strong> The ISSO writes the implementation and submits each control; the assessor records a result for every SP 800-53A objective and validates it or returns it for rework. Changing a submitted control sends it back through the chain.</p>
   <p><strong>Body of Evidence.</strong> Artifacts are linked to the controls they prove and reviewed before they count. The authorization boundary diagram, inventory, and ports, protocols and services list are required package documents.</p>
   <p><strong>POA&amp;M.</strong> Every non-compliant control needs an item with a severity, residual risk, point of contact, resources, milestones and a scheduled completion date. Only the Authorizing Official can accept risk.</p>
   <p><strong>Package approval chain.</strong> The package moves from the ISSM’s completeness review to the assessor’s review to the AO’s decision, and comes back with comments whenever a check fails. In this practice workspace the ISSM, assessor review and AO steps are automated with transparent rules; you play the ISSO and the assessor.</p>
   <p><strong>Continuous monitoring.</strong> After the decision: the termination date, conditions, annual review, overdue milestones, reassessment schedules, changes, and reauthorization.</p>
   <p className="reader-note">This is an original Secure By Design practice tool modeled on how these platforms organize the work. It is not affiliated with DISA or Telos and does not copy either product.</p></div>
  </details>
 </>;
}

function SystemTab({state,act,busy,onDeleted}:{state:State;act:Act;busy:boolean;onDeleted:()=>void}){
 const [p,setP]=useState<Profile>(state.system.profile);const [confirm,setConfirm]=useState('');
 useEffect(()=>setP(state.system.profile),[state.system.profile]);
 const set=(k:keyof Profile,v:any)=>setP(x=>({...x,[k]:v}));
 const hw=highWater(p.infoTypes),dirty=JSON.stringify(p)!==JSON.stringify(state.system.profile);
 const save=()=>act('PATCH','',{name:p.name,acronym:p.acronym,type:p.type,version:p.version,description:p.description,boundary:p.boundary,interconnections:p.interconnections,roles:p.roles,infoTypes:p.infoTypes,categorization:p.categorization,categorizationRationale:p.categorizationRationale});
 const levels=(value:string|null,onChange:(v:string)=>void,label:string,blank=false)=><select aria-label={label} value={value||''} onChange={e=>onChange(e.target.value)}>{blank&&<option value="">Choose…</option>}{Object.entries(LEVELS).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select>;
 return <form className="awx-form" onSubmit={e=>{e.preventDefault();void save();}}>
  <Hat role="ISSO, with the system owner">Prepare and Categorize</Hat>
  <section className="awx-section"><h2>Identity</h2><div className="awx-grid">
   <Field label="System name"><input value={p.name} maxLength={120} required onChange={e=>set('name',e.target.value)}/></Field>
   <Field label="Acronym"><input value={p.acronym} maxLength={30} onChange={e=>set('acronym',e.target.value)}/></Field>
   <Field label="System type"><select value={p.type} onChange={e=>set('type',e.target.value)}>{Object.entries(SYSTEM_TYPES).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
   <Field label="Version or release"><input value={p.version} maxLength={20} onChange={e=>set('version',e.target.value)}/></Field>
  </div></section>
  <section className="awx-section"><h2>Description and boundary</h2>
   <Field label="System description" hint="The mission it supports, its users, and what it does." wide><textarea rows={5} maxLength={6000} value={p.description} onChange={e=>set('description',e.target.value)}/></Field>
   <Field label="Authorization boundary" hint="Everything inside the boundary: systems, networks, and components." wide><textarea rows={9} maxLength={8000} value={p.boundary} onChange={e=>set('boundary',e.target.value)}/></Field>
   <Field label="Interconnections and external services" wide><textarea rows={3} maxLength={4000} value={p.interconnections} onChange={e=>set('interconnections',e.target.value)}/></Field>
  </section>
  <section className="awx-section"><h2>Roles</h2><p className="awx-lead">Use fictional names or your study group’s. The assessor has to be someone other than the ISSO and system owner.</p><div className="awx-grid">
   {Object.entries(ROLES).map(([k,label])=><Field key={k} label={label as string}><input value={p.roles?.[k]||''} maxLength={120} onChange={e=>set('roles',{...p.roles,[k]:e.target.value})}/></Field>)}
  </div></section>
  <section className="awx-section"><h2>Categorization</h2><p className="awx-lead">List the information types the system processes (NIST SP 800-60) with their provisional impacts. The system’s impact for each objective is at least the highest of its information types.</p>
   <div className="awx-infotypes">{p.infoTypes.map((t,i)=><div key={i} className="awx-infotype">
    <input aria-label={`Information type ${i+1}`} value={t.name} maxLength={160} placeholder="Information type" onChange={e=>set('infoTypes',p.infoTypes.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
    {(['c','i','a'] as const).map(k=><span key={k} className="awx-cia"><small>{k.toUpperCase()}</small>{levels(t[k],v=>set('infoTypes',p.infoTypes.map((x,j)=>j===i?{...x,[k]:v}:x)),`${{c:'Confidentiality',i:'Integrity',a:'Availability'}[k]} for information type ${i+1}`)}</span>)}
    <button type="button" className="awx-link" onClick={()=>set('infoTypes',p.infoTypes.filter((_,j)=>j!==i))}>Remove</button>
   </div>)}
   {p.infoTypes.length<20&&<button type="button" onClick={()=>set('infoTypes',[...p.infoTypes,{name:'',c:'low',i:'low',a:'low'}])}>Add an information type</button>}</div>
   <div className="awx-categorization">{(['c','i','a'] as const).map(k=>{const label={c:'Confidentiality',i:'Integrity',a:'Availability'}[k];const low=hw[k]&&p.categorization[k]&&LEVEL_ORDER.indexOf(p.categorization[k])<LEVEL_ORDER.indexOf(hw[k]);return <Field key={k} label={label} hint={hw[k]?`Highest information type: ${LEVELS[hw[k]]}${low?' — raise this to at least that':''}`:undefined}>{levels(p.categorization[k],v=>set('categorization',{...p.categorization,[k]:v||null}),label,true)}</Field>;})}</div>
   <Field label="Categorization rationale" hint="Why these impacts: what would happen to the mission if information were disclosed, changed, or unavailable." wide><textarea rows={4} maxLength={6000} value={p.categorizationRationale} onChange={e=>set('categorizationRationale',e.target.value)}/></Field>
  </section>
  <div className="awx-sticky-save"><button className="reader-primary" disabled={busy||!dirty}>{dirty?'Save the system record':'Saved'}</button>{dirty&&<button type="button" onClick={()=>setP(state.system.profile)}>Discard changes</button>}</div>
  <section className="awx-section awx-danger"><h2>Delete this system</h2><p>Deletes the system and everything in it: controls, evidence, POA&amp;M, packages and history. This cannot be undone.</p>
   <Field label={`Type ${state.system.profile.name} to confirm`}><input value={confirm} onChange={e=>setConfirm(e.target.value)}/></Field>
   <button type="button" disabled={busy||confirm!==state.system.profile.name} onClick={async()=>{try{await api('DELETE',`/systems/${state.system.id}`);onDeleted();}catch(e){alert((e as Error).message)}}}>Delete the system</button>
  </section>
 </form>;
}

function MonitorTab({state,act,busy,go}:{state:State;act:Act;busy:boolean;go:(tab:string)=>void}){
 const auth=state.system.authorization;const [change,setChange]=useState('');const [affected,setAffected]=useState<string[]>([]);const [review,setReview]=useState('');
 if(!auth)return <><Hat role="ISSO and ISSM">Monitor</Hat><section className="awx-section"><h2>Continuous monitoring starts after the decision</h2><p className="awx-lead">Once the Authorizing Official decides, this tab tracks the termination date, the conditions, the annual review, overdue POA&amp;M milestones, controls due for reassessment, provider assurance, and changes to the system.</p><button type="button" onClick={()=>go('package')}>Go to the package</button></section></>;
 const status=authorizationStatus(state.system),alerts=monitoring(state);
 const days=auth.terminationDate?daysUntil(auth.terminationDate):null;
 const term=auth.terminationDate?Math.max(1,Math.round((Date.parse(auth.terminationDate)-Date.parse(auth.decidedAt))/86400000)):null;
 return <>
  <Hat role="ISSO and ISSM">Monitor</Hat>
  <section className={'awx-section awx-decision awx-decision-'+status}><p className="eyebrow">Current authorization</p><h2>{status==='expired'?'Expired':DECISIONS[auth.decision]}</h2>
   <p>Decided {formatDate(auth.decidedAt)} · {PACKAGE_TYPES[auth.packageType]}{auth.terminationDate&&<> · terminates {formatDate(auth.terminationDate)}</>}</p>
   {days!=null&&term&&status!=='dato'&&<div className="awx-meter" role="img" aria-label={days>=0?`${days} days remaining`:'Expired'}><span style={{width:`${Math.min(100,Math.max(0,100*days/term))}%`}}/></div>}
   {days!=null&&status!=='dato'&&<p className="awx-days">{days>=0?`${days} day${days===1?'':'s'} remaining`:`Expired ${-days} days ago`}</p>}
   <ul>{auth.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul>
   {auth.conditions.length>0&&<><h3>Conditions</h3><ul>{auth.conditions.map((c,i)=><li key={i}>{c}</li>)}</ul></>}
   <button type="button" className="reader-primary" disabled={busy||!!state.package} onClick={async()=>{if(await act('PUT','/package',{},{quiet:true}))go('package');}}>{state.package?'A package is already open':status==='dato'?'Start a new package':'Start reauthorization'}</button>
  </section>
  <section className="awx-section"><h2>Needs attention</h2>{alerts.length?<ul className="awx-alerts">{alerts.map((a:any,i:number)=><li key={i} className={'awx-alert-'+a.level}><span>{a.text}</span><button type="button" className="awx-link" onClick={()=>go(a.tab)}>Open</button></li>)}</ul>:<p className="awx-lead">Nothing is overdue.</p>}</section>
  <section className="awx-section"><h2>Reassessment schedule</h2><p className="awx-lead">Each control’s assessment frequency is set on the Controls tab. Inherited controls follow their provider’s schedule.</p>
   <ul className="awx-rows">{state.controls.map(c=>{const f=FREQUENCIES[c.frequency];const next=c.lastAssessedAt&&f?new Date(Date.parse(c.lastAssessedAt)+f[1]*86400000).toISOString().slice(0,10):null;return <li key={c.controlId}><strong>{c.controlId}</strong><span>{f?f[0]:c.frequency}</span><span>Last assessed {formatDate(c.lastAssessedAt)}</span><span>{c.reassessReason?<Badge tone="warn">Reassess after change</Badge>:next?`Next ${formatDate(next)}`:'—'}</span></li>;})}</ul>
  </section>
  <section className="awx-section"><h2>Record a change</h2><p className="awx-lead">A new server, a changed flow, a new version: record it and choose the controls it affects. They go back to the assessor for reassessment. Significant changes may need a new authorization decision.</p>
   <Field label="What changed" wide><textarea rows={3} maxLength={2000} value={change} onChange={e=>setChange(e.target.value)}/></Field>
   <fieldset className="awx-chips"><legend className="awx-label">Affected controls</legend>{state.controls.map(c=><label key={c.controlId}><input type="checkbox" checked={affected.includes(c.controlId)} onChange={e=>setAffected(e.target.checked?[...affected,c.controlId]:affected.filter(x=>x!==c.controlId))}/>{c.controlId}</label>)}</fieldset>
   <button type="button" disabled={busy||change.trim().length<15} onClick={async()=>{if(await act('POST','/changes',{description:change,controls:affected})){setChange('');setAffected([]);}}}>Record the change</button>
  </section>
  {status!=='dato'&&<section className="awx-section"><h2>Annual security review</h2><p className="awx-lead">Last completed: {formatDate(state.system.profile.lastAnnualReview||auth.decidedAt)}. Review the controls, POA&amp;M, evidence currency and changes, and record what you found.</p>
   <Field label="Review summary" wide><textarea rows={3} maxLength={4000} value={review} onChange={e=>setReview(e.target.value)}/></Field>
   <button type="button" disabled={busy||review.trim().length<20} onClick={async()=>{if(await act('POST','/annual-review',{notes:review}))setReview('');}}>Complete the annual review</button>
  </section>}
  <section className="awx-section"><h2>Evidence currency</h2><ul className="awx-rows">{state.controls.filter(c=>['implemented','hybrid'].includes(c.implementationStatus)).map(c=>{const ev=acceptedEvidence(state,c.controlId);const newest=ev.map(a=>a.artifactDate).filter(Boolean).sort().at(-1);return <li key={c.controlId}><strong>{c.controlId}</strong><span>{ev.length} accepted</span><span>Newest {formatDate(newest)}</span></li>;})}</ul></section>
 </>;
}

function HistoryTab({state}:{state:State}){
 return <><Hat role="anyone with access">Audit trail</Hat><section className="awx-section"><h2>History</h2><p className="awx-lead">Every submission, review, return, decision and change, newest first (last 300 entries).</p>
  <ol className="awx-history">{state.history.map((h,i)=><li key={i}><time dateTime={h.at}>{formatTime(h.at)}</time><div><strong>{h.action}</strong>{h.subject&&<span className="awx-history-subject">{h.subject}</span>}<small>{h.role}</small>{h.detail&&<p>{h.detail}</p>}</div></li>)}</ol>
 </section></>;
}
