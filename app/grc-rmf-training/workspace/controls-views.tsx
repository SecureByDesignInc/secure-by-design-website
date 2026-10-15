'use client';
import {useEffect,useMemo,useState} from 'react';
import {
 controlIndex,families,IMPLEMENTATION,RESULTS,CONTROL_STEPS,COMPLIANCE,FREQUENCIES,PROVIDERS,providerById,providerValidThrough,providerCurrent,
 compliance,submitProblems,validateProblems,objectivesFor,controlTitle,PRACTICE_CONTROLS,
} from '../../../lib/authorization/model.mjs';
import {Badge,Field,Hat,complianceTone,stepTone,artifactTone,formatDate,useCatalog,type Act,type Control,type State} from './shared';

const sortIds=(a:string,b:string)=>a.localeCompare(b,'en',{numeric:true});
function Statement({id}:{id:string}){
 const {catalog,failed}=useCatalog();
 if(failed)return <p className="reader-note">The control text could not be loaded. Check your connection and reopen the control.</p>;
 const c=catalog?.get(id);if(!catalog)return <p className="reader-loading">Loading the control text…</p>;if(!c)return null;
 return <details className="awx-statement"><summary>Control statement · NIST SP 800-53 Rev. 5</summary><ol>{c.statement.map(([depth,label,text],i)=><li key={i} style={{marginLeft:`${Math.max(0,depth-1)*1.1}rem`}}>{label&&<b>{label} </b>}{text}</li>)}</ol></details>;
}

export function ControlsTab({state,act,busy,go}:{state:State;act:Act;busy:boolean;go:(tab:string)=>void}){
 const [open,setOpen]=useState<string|null>(null);const [filter,setFilter]=useState('all');
 const [rationale,setRationale]=useState(state.system.profile.selectionRationale||'');
 useEffect(()=>setRationale(state.system.profile.selectionRationale||''),[state.system.profile.selectionRationale]);
 const shown=state.controls.filter(c=>filter==='all'||(filter==='todo'?['draft','returned'].includes(c.step):c.step===filter));
 return <>
  <Hat role="ISSO">Select and Implement</Hat>
  <section className="awx-section"><h2>Control selection</h2>
   <p className="awx-lead">The catalog is NIST SP 800-53 Rev. 5. A SP 800-53B baseline is a federal reference starting point; a national security or SAP system selects from CNSSI 1253 with its overlays, as directed by its authority. Record how you chose and tailored the set.</p>
   <Field label="Selection and tailoring rationale" wide><textarea rows={4} maxLength={6000} value={rationale} onChange={e=>setRationale(e.target.value)}/></Field>
   <button type="button" disabled={busy||rationale===(state.system.profile.selectionRationale||'')} onClick={()=>void act('PATCH','',{selectionRationale:rationale})}>Save the rationale</button>
   <AddControls state={state} act={act} busy={busy}/>
  </section>
  <Providers state={state} act={act} busy={busy}/>
  <section className="awx-section"><h2>Controls in scope <span className="awx-count">{state.controls.length}</span></h2>
   <div className="awx-filter" role="group" aria-label="Show">{[['all','All'],['todo','To do'],['submitted','With the assessor'],['assessed','Assessed']].map(([id,label])=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
   {!state.controls.length&&<p className="awx-lead">No controls yet. Add them above.</p>}
   <ul className="awx-control-list">{shown.map(c=><li key={c.controlId} className={open===c.controlId?'open':''}>
    <button type="button" className="awx-control-row" aria-expanded={open===c.controlId} onClick={()=>setOpen(open===c.controlId?null:c.controlId)}>
     <span className="awx-control-id">{c.controlId}</span><span className="awx-control-title">{controlTitle(c.controlId)}</span>
     <span className="awx-control-badges"><Badge tone="muted">{IMPLEMENTATION[c.implementationStatus]}</Badge><Badge tone={stepTone[c.step]}>{CONTROL_STEPS[c.step]}</Badge><Badge tone={complianceTone[compliance(c)]}>{COMPLIANCE[compliance(c)]}</Badge></span>
    </button>
    {open===c.controlId&&<ControlEditor key={c.updatedAt} state={state} control={c} act={act} busy={busy} go={go}/>}
   </li>)}</ul>
  </section>
 </>;
}

function AddControls({state,act,busy}:{state:State;act:Act;busy:boolean}){
 const [query,setQuery]=useState('');const [family,setFamily]=useState('');const [picked,setPicked]=useState<string[]>([]);
 const have=useMemo(()=>new Set(state.controls.map(c=>c.controlId)),[state.controls]);
 const matches=useMemo(()=>{
  const q=query.trim().toLowerCase();if(!q&&!family)return [];
  return Object.entries(controlIndex as Record<string,[string,string,string,string[]]>).filter(([id,[title,fam]])=>!have.has(id)&&(!family||fam===family)&&(!q||id.toLowerCase().includes(q)||title.toLowerCase().includes(q))).sort(([a],[b])=>sortIds(a,b)).slice(0,40);
 },[query,family,have]);
 const baseline=(level:string)=>Object.entries(controlIndex as Record<string,[string,string,string,string[]]>).filter(([id,v])=>v[2].includes(level)&&!have.has(id)).map(([id])=>id);
 const practice=PRACTICE_CONTROLS.filter((id:string)=>!have.has(id));
 return <details className="awx-add"><summary>Add controls</summary><div>
  <div className="awx-grid">
   <Field label="Search by number or title"><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="AC-17, audit, backup…"/></Field>
   <Field label="Family"><select value={family} onChange={e=>setFamily(e.target.value)}><option value="">All families</option>{Object.entries(families as Record<string,string>).map(([id,name])=><option key={id} value={id}>{id} · {name}</option>)}</select></Field>
  </div>
  {matches.length>0&&<ul className="awx-pick">{matches.map(([id,[title,,base]])=><li key={id}><label><input type="checkbox" checked={picked.includes(id)} onChange={e=>setPicked(e.target.checked?[...picked,id]:picked.filter(x=>x!==id))}/><b>{id}</b> {title}{base&&<small> · 800-53B {base.split('').join('/')}</small>}</label></li>)}</ul>}
  {(query||family)&&!matches.length&&<p className="reader-note">No controls match that are not already in scope.</p>}
  <div className="awx-actions">
   <button type="button" className="reader-primary" disabled={busy||!picked.length} onClick={async()=>{if(await act('POST','/controls',{ids:picked}))setPicked([]);}}>Add {picked.length||''} selected</button>
   {practice.length>0&&<button type="button" disabled={busy} onClick={()=>void act('POST','/controls',{ids:practice})}>Add the capstone’s nine practice controls</button>}
   {(['L','M','H'] as const).map(level=>{const ids=baseline(level);return ids.length>0&&<button key={level} type="button" disabled={busy} onClick={()=>{if(confirm(`Add ${ids.length} controls from the SP 800-53B ${({L:'Low',M:'Moderate',H:'High'})[level]} baseline? That is a lot of work to implement and assess; the capstone uses nine.`))void act('POST','/controls',{ids});}}>Add the {({L:'Low',M:'Moderate',H:'High'})[level]} baseline ({ids.length})</button>;})}
  </div>
 </div></details>;
}

function Providers({state,act,busy}:{state:State;act:Act;busy:boolean}){
 return <details className="awx-section awx-providers"><summary><h2>Common control providers</h2></summary>
  <p className="awx-lead">Inherit a control when another authorized provider operates it for you. You rely on the provider’s current assurance, so an inherited control is only as good as that assurance.</p>
  <ul className="awx-rows">{PROVIDERS.map((p:any)=>{const through=providerValidThrough(state.system,p.id),current=providerCurrent(state.system,p.id);const used=state.controls.filter(c=>c.provider===p.id).map(c=>c.controlId);return <li key={p.id} className="awx-provider">
   <div><strong>{p.name}</strong><p>{p.detail}</p>{used.length>0&&<small>Inherited here: {used.join(', ')}</small>}</div>
   <div className="awx-provider-status"><Badge tone={current?'good':'bad'}>{current?`Assurance current to ${formatDate(through)}`:`Assurance lapsed ${formatDate(through)}`}</Badge>{!current&&<button type="button" disabled={busy} onClick={()=>void act('POST',`/providers/${p.id}/renew`,undefined,{ok:`${p.name} supplied current assurance.`})}>Request current assurance</button>}</div>
  </li>;})}</ul>
 </details>;
}

function ControlEditor({state,control,act,busy,go}:{state:State;control:Control;act:Act;busy:boolean;go:(tab:string)=>void}){
 const [c,setC]=useState(control);
 const providers=PROVIDERS.filter((p:any)=>p.offers(control.controlId));
 const dirty=['implementationStatus','provider','narrative','responsible','frequency'].some(k=>(c as any)[k]!==(control as any)[k]);
 const problems=submitProblems(state,c);
 const evidence=state.artifacts.filter(a=>a.controls.includes(control.controlId));
 const poam=state.poam.filter(p=>p.controlId===control.controlId);
 const save=()=>act('PATCH',`/controls/${control.controlId}`,{implementationStatus:c.implementationStatus,provider:['inherited','hybrid'].includes(c.implementationStatus)?c.provider:null,narrative:c.narrative,responsible:c.responsible,frequency:c.frequency});
 return <div className="awx-editor">
  {control.returnComment&&control.step==='returned'&&<p className="awx-returned"><strong>Returned by the assessor:</strong> {control.returnComment}</p>}
  {control.reassessReason&&<p className="awx-returned"><strong>Reassessment needed.</strong> {control.reassessReason}</p>}
  <Statement id={control.controlId}/>
  <div className="awx-grid">
   <Field label="Implementation status"><select value={c.implementationStatus} onChange={e=>setC({...c,implementationStatus:e.target.value})}>{Object.entries(IMPLEMENTATION).map(([k,v])=><option key={k} value={k} disabled={['inherited','hybrid'].includes(k)&&!providers.length}>{v as string}{['inherited','hybrid'].includes(k)&&!providers.length?' (no provider offers this control)':''}</option>)}</select></Field>
   {['inherited','hybrid'].includes(c.implementationStatus)&&<Field label="Common control provider"><select value={c.provider||''} onChange={e=>setC({...c,provider:e.target.value||null})}><option value="">Choose…</option>{providers.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
   <Field label="Assessment frequency"><select value={c.frequency} onChange={e=>setC({...c,frequency:e.target.value})}>{Object.entries(FREQUENCIES).map(([k,v])=><option key={k} value={k}>{(v as [string,number])[0]}</option>)}</select></Field>
   {c.implementationStatus!=='inherited'&&<Field label="Responsible role"><input value={c.responsible} maxLength={160} onChange={e=>setC({...c,responsible:e.target.value})} placeholder="e.g., ISSO and Tier 1 administrators"/></Field>}
  </div>
  {c.implementationStatus!=='inherited'&&<Field label={c.implementationStatus==='not_applicable'?'Why this control does not apply':c.implementationStatus==='hybrid'?'Implementation statement (the part this system operates)':'Implementation statement'} hint={c.implementationStatus==='planned'?'Describe how it will be implemented. A planned control needs a POA&M item.':'Describe how this system meets each part of the control: who, what, where, and how often. Avoid restating the requirement.'} wide><textarea rows={6} maxLength={8000} value={c.narrative} onChange={e=>setC({...c,narrative:e.target.value})}/></Field>}
  {c.provider&&!providerCurrent(state.system,c.provider)&&<p className="awx-returned">{providerById(c.provider)?.name}’s assurance has lapsed. Request current assurance under Common control providers, or implement the control locally.</p>}
  <div className="awx-linked"><strong>Evidence</strong>{evidence.length?<ul>{evidence.map(a=><li key={a.id}>{a.title} <Badge tone={artifactTone[a.reviewState]}>{a.reviewState}</Badge></li>)}</ul>:<span> None linked yet.</span> }<button type="button" className="awx-link" onClick={()=>go('evidence')}>Add or link evidence</button></div>
  {poam.length>0&&<div className="awx-linked"><strong>POA&amp;M</strong><ul>{poam.map(p=><li key={p.id}>#{p.number} {p.weakness.slice(0,90)}</li>)}</ul></div>}
  <div className="awx-actions">
   <button type="button" disabled={busy||!dirty} onClick={()=>void save()}>{dirty?'Save':'Saved'}</button>
   {['draft','returned'].includes(control.step)&&<button type="button" className="reader-primary" disabled={busy||dirty||problems.length>0} onClick={()=>void act('POST',`/controls/${control.controlId}/submit`,undefined,{ok:c.implementationStatus==='inherited'?`${control.controlId} recorded as inherited.`:`${control.controlId} is with the assessor.`})}>{c.implementationStatus==='inherited'?'Record as inherited':'Submit to the assessor'}</button>}
   <button type="button" className="awx-link awx-remove" disabled={busy} onClick={()=>{if(confirm(`Remove ${control.controlId} from scope? Its implementation and results are deleted.`))void act('DELETE',`/controls/${control.controlId}`);}}>Remove from scope</button>
  </div>
  {['draft','returned'].includes(control.step)&&(dirty?<p className="reader-note">Save your changes before submitting.</p>:problems.length>0&&<ul className="awx-problems">{problems.map((p:string)=><li key={p}>{p}</li>)}</ul>)}
  {control.step==='submitted'&&<p className="reader-note">With the assessor. Open the Assessment tab to record results. Changing the implementation sends it back to In progress.</p>}
 </div>;
}

export function AssessmentTab({state,act,busy}:{state:State;act:Act;busy:boolean}){
 const queue=state.controls.filter(c=>['submitted','assessed'].includes(c.step));
 const waiting=state.controls.filter(c=>['draft','returned'].includes(c.step)).length;
 const [open,setOpen]=useState<string|null>(null);
 const reviewQueue=state.artifacts.filter(a=>a.reviewState==='submitted').length;
 return <>
  <Hat role="Security control assessor">Assess. Stay independent: judge the evidence, not the intent.</Hat>
  <section className="awx-section"><h2>Assessment queue <span className="awx-count">{queue.filter(c=>c.step==='submitted').length} to assess</span></h2>
   <p className="awx-lead">For each objective, examine documents, interview the people who operate the control, and test it. Record Satisfied only when the evidence supports it; describe what you observed for anything else. {waiting>0&&`${waiting} control${waiting===1?' is':'s are'} still with the ISSO.`} {reviewQueue>0&&`${reviewQueue} piece${reviewQueue===1?' of evidence awaits':'s of evidence await'} your review on the Evidence tab.`}</p>
   {!queue.length&&<p className="awx-lead">Nothing has been submitted for assessment yet.</p>}
   <ul className="awx-control-list">{queue.map(c=><li key={c.controlId} className={open===c.controlId?'open':''}>
    <button type="button" className="awx-control-row" aria-expanded={open===c.controlId} onClick={()=>setOpen(open===c.controlId?null:c.controlId)}>
     <span className="awx-control-id">{c.controlId}</span><span className="awx-control-title">{controlTitle(c.controlId)}</span>
     <span className="awx-control-badges">{c.reassessReason&&<Badge tone="warn">Reassess</Badge>}<Badge tone={stepTone[c.step]}>{CONTROL_STEPS[c.step]}</Badge><Badge tone={complianceTone[compliance(c)]}>{COMPLIANCE[compliance(c)]}</Badge></span>
    </button>
    {open===c.controlId&&<AssessControl key={c.updatedAt} state={state} control={c} act={act} busy={busy}/>}
   </li>)}</ul>
  </section>
 </>;
}

function AssessControl({state,control,act,busy}:{state:State;control:Control;act:Act;busy:boolean}){
 const {catalog}=useCatalog();
 const [results,setResults]=useState(control.results);const [notes,setNotes]=useState(control.assessorNotes);const [comment,setComment]=useState('');
 const objectives:string[]=objectivesFor(control.controlId);
 const text=new Map(catalog?.get(control.controlId)?.objectives||[]);
 const dirty=JSON.stringify(results)!==JSON.stringify(control.results)||notes!==control.assessorNotes;
 const problems=validateProblems({...control,results});
 const evidence=state.artifacts.filter(a=>a.controls.includes(control.controlId));
 if(control.implementationStatus==='inherited')return <div className="awx-editor"><p>Inherited from {providerById(control.provider)?.name}. The provider assesses this control; you rely on its assurance (current to {formatDate(providerValidThrough(state.system,control.provider))}).</p></div>;
 const set=(id:string,patch:object)=>setResults(r=>({...r,[id]:{result:null,note:'',...r[id],...patch}}));
 return <div className="awx-editor">
  <div className="awx-claim"><strong>Implementation ({IMPLEMENTATION[control.implementationStatus]})</strong><p>{control.narrative||'—'}</p><small>Responsible: {control.responsible||'—'}</small></div>
  <div className="awx-linked"><strong>Evidence</strong>{evidence.length?<ul>{evidence.map(a=><li key={a.id}><span>{a.title}</span> <Badge tone={artifactTone[a.reviewState]}>{a.reviewState}</Badge>{a.content&&<details><summary>Excerpt</summary><pre>{a.content}</pre></details>}{a.location&&<small> · Full record: {a.location}</small>}</li>)}</ul>:<span> None linked.</span>}</div>
  {control.implementationStatus==='not_applicable'?<p className="reader-note">Marked not applicable: “{control.narrative}”. Validate if you agree, or return it.</p>:
  <fieldset className="awx-objectives"><legend>Assessment objectives · NIST SP 800-53A Rev. 5 <button type="button" className="awx-link" onClick={()=>setResults(r=>Object.fromEntries(objectives.map(id=>[id,{result:'satisfied',note:'',...r[id],...(r[id]?.result?{}:{result:'satisfied'})}])))}>Mark the rest satisfied</button></legend>
   {objectives.map(id=><div key={id} className={'awx-objective '+(results[id]?.result||'')}>
    <p><b>{id}</b> {text.get(id)||(catalog?'':'…')}</p>
    <div className="awx-result" role="radiogroup" aria-label={`Result for ${id}`}>{Object.entries(RESULTS).map(([k,v])=><label key={k}><input type="radio" name={`${control.controlId}-${id}`} checked={results[id]?.result===k} onChange={()=>set(id,{result:k})}/>{v as string}</label>)}</div>
    {results[id]?.result&&results[id]?.result!=='satisfied'&&<input aria-label={`Observation for ${id}`} className="awx-note" value={results[id]?.note||''} maxLength={2000} placeholder="What did you observe?" onChange={e=>set(id,{note:e.target.value})}/>}
   </div>)}
  </fieldset>}
  <Field label="Assessment notes (methods, samples, limitations)" wide><textarea rows={3} maxLength={6000} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
  <div className="awx-actions">
   <button type="button" disabled={busy||!dirty} onClick={()=>void act('PUT',`/controls/${control.controlId}/results`,{results,assessorNotes:notes})}>{dirty?'Save results':'Saved'}</button>
   {control.step==='submitted'&&<button type="button" className="reader-primary" disabled={busy||dirty||problems.length>0} onClick={()=>void act('POST',`/controls/${control.controlId}/validate`,undefined,{ok:s=>{const v=s.controls.find(x=>x.controlId===control.controlId);return `${control.controlId} validated: ${v?COMPLIANCE[compliance(v)]:'done'}.`;}})}>Validate</button>}
  </div>
  {control.step==='submitted'&&!dirty&&problems.length>0&&<ul className="awx-problems">{problems.map((p:string)=><li key={p}>{p}</li>)}</ul>}
  {control.step==='assessed'&&<p className="reader-note">Validated {formatDate(control.lastAssessedAt)}: {COMPLIANCE[compliance(control)]}.{compliance(control)==='non_compliant'&&' Each weakness needs a POA&M item.'}</p>}
  <details className="awx-return"><summary>Return to the ISSO for rework</summary>
   <Field label="What needs to change" wide><textarea rows={2} maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></Field>
   <button type="button" disabled={busy||comment.trim().length<10} onClick={async()=>{if(await act('POST',`/controls/${control.controlId}/return`,{comment},{ok:`${control.controlId} returned to the ISSO.`}))setComment('');}}>Return the control</button>
  </details>
 </div>;
}
