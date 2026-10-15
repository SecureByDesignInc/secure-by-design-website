'use client';
import {useState} from 'react';
import {
 ARTIFACT_KINDS,ARTIFACT_STATES,PACKAGE_ROLES,REQUIRED_PACKAGE_ROLES,SEVERITY,RISK,POAM_STATUS,POAM_SOURCES,poamProblems,compliance,controlTitle,
} from '../../../lib/authorization/model.mjs';
import {Badge,Field,Hat,artifactTone,severityTone,poamTone,formatDate,todayIso,download,csv,type Act,type Artifact,type Poam,type State} from './shared';

const blankArtifact={title:'',kind:'configuration',packageRole:'none',description:'',content:'',location:'',version:'1.0',artifactDate:todayIso(),controls:[] as string[]};
export function EvidenceTab({state,act,busy}:{state:State;act:Act;busy:boolean}){
 const [editing,setEditing]=useState<string|null>(null);const [filter,setFilter]=useState('all');
 const shown=state.artifacts.filter(a=>filter==='all'||a.reviewState===filter||(filter==='package'&&a.packageRole!=='none'));
 return <>
  <Hat role="ISSO, then the assessor">Body of Evidence. The ISSO adds and submits; the assessor accepts or rejects.</Hat>
  <section className="awx-section"><h2>Required package documents</h2>
   <ul className="awx-checks">{REQUIRED_PACKAGE_ROLES.map((role:string)=>{const doc=state.artifacts.find(a=>a.packageRole===role&&a.reviewState==='accepted')||state.artifacts.find(a=>a.packageRole===role);const ok=doc?.reviewState==='accepted';return <li key={role} className={ok?'ok':'open'}><span className="awx-check-mark" aria-hidden="true">{ok?'✓':'!'}</span><div><strong>{PACKAGE_ROLES[role]}</strong>{doc?<p>{doc.title} · {ARTIFACT_STATES[doc.reviewState]}</p>:<p>Not added yet. Add it below and choose this package role.</p>}</div></li>;})}</ul>
  </section>
  <section className="awx-section"><h2>Evidence <span className="awx-count">{state.artifacts.length}</span></h2>
   <p className="awx-lead">Record each artifact: what it shows, how and when it was produced, an excerpt, and where the full record is kept. The workspace stores the index and excerpts, not the files; keep the originals with your lab notes. Paste practice data only: no passwords, keys, or real organizations’ sensitive information. Changing reviewed evidence sends it back to Draft.</p>
   <div className="awx-filter" role="group" aria-label="Show">{[['all','All'],['draft','Draft'],['submitted','Awaiting review'],['accepted','Accepted'],['rejected','Rejected'],['package','Package documents']].map(([id,label])=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
   {editing==='new'?<ArtifactForm state={state} act={act} busy={busy} artifact={null} done={()=>setEditing(null)}/>:<button type="button" className="reader-primary awx-add-button" onClick={()=>setEditing('new')}>Add evidence</button>}
   <ul className="awx-cards">{shown.map(a=><li key={a.id}>{editing===a.id?<ArtifactForm state={state} act={act} busy={busy} artifact={a} done={()=>setEditing(null)}/>:<ArtifactCard a={a} act={act} busy={busy} edit={()=>setEditing(a.id)}/>}</li>)}</ul>
  </section>
 </>;
}
function ArtifactCard({a,act,busy,edit}:{a:Artifact;act:Act;busy:boolean;edit:()=>void}){
 const [note,setNote]=useState('');
 return <article className="awx-card">
  <header><h3>{a.title}</h3><Badge tone={artifactTone[a.reviewState]}>{ARTIFACT_STATES[a.reviewState]}</Badge></header>
  <p className="awx-card-meta">{ARTIFACT_KINDS[a.kind]}{a.packageRole!=='none'&&<> · <b>{PACKAGE_ROLES[a.packageRole]}</b></>} · v{a.version} · dated {formatDate(a.artifactDate)}</p>
  {a.description&&<p>{a.description}</p>}
  {a.controls.length>0&&<p className="awx-tags">{a.controls.map(id=><span key={id} title={controlTitle(id)}>{id}</span>)}</p>}
  {a.content&&<details><summary>Excerpt</summary><pre>{a.content}</pre></details>}
  {a.location&&<p className="awx-card-meta">Full record: {a.location}</p>}
  {a.reviewNote&&<p className={a.reviewState==='rejected'?'awx-returned':'awx-card-meta'}><b>Assessor:</b> {a.reviewNote}</p>}
  <div className="awx-actions">
   <button type="button" disabled={busy} onClick={edit}>Edit</button>
   {['draft','rejected'].includes(a.reviewState)&&<button type="button" className="reader-primary" disabled={busy} onClick={()=>void act('POST',`/artifacts/${a.id}/submit`,undefined,{ok:'Submitted for the assessor’s review.'})}>Submit for review</button>}
   <button type="button" className="awx-link awx-remove" disabled={busy} onClick={()=>{if(confirm(`Remove “${a.title}” from the Body of Evidence?`))void act('DELETE',`/artifacts/${a.id}`);}}>Remove</button>
  </div>
  {a.reviewState==='submitted'&&<div className="awx-review"><p className="awx-hat-inline">Assessor review</p>
   <Field label="Review note (required to reject)" wide><input value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder="Is it current, complete, and does it show what it claims?"/></Field>
   <div className="awx-actions"><button type="button" className="reader-primary" disabled={busy} onClick={()=>void act('POST',`/artifacts/${a.id}/review`,{decision:'accept',note},{ok:'Accepted into the Body of Evidence.'})}>Accept</button><button type="button" disabled={busy||note.trim().length<10} onClick={()=>void act('POST',`/artifacts/${a.id}/review`,{decision:'reject',note},{ok:'Rejected and returned to the ISSO.'})}>Reject</button></div>
  </div>}
 </article>;
}
function ArtifactForm({state,act,busy,artifact,done}:{state:State;act:Act;busy:boolean;artifact:Artifact|null;done:()=>void}){
 const [a,setA]=useState(artifact?{title:artifact.title,kind:artifact.kind,packageRole:artifact.packageRole,description:artifact.description,content:artifact.content,location:artifact.location,version:artifact.version,artifactDate:artifact.artifactDate||'',controls:artifact.controls}:blankArtifact);
 const set=(k:string,v:any)=>setA(x=>({...x,[k]:v}));
 return <form className="awx-card awx-card-form" onSubmit={async e=>{e.preventDefault();if(await act(artifact?'PATCH':'POST',artifact?`/artifacts/${artifact.id}`:'/artifacts',{...a,artifactDate:a.artifactDate||null}))done();}}>
  <h3>{artifact?'Edit evidence':'Add evidence'}</h3>
  <div className="awx-grid">
   <Field label="Title"><input required value={a.title} maxLength={160} onChange={e=>set('title',e.target.value)} placeholder="e.g., Audit policy GPO export"/></Field>
   <Field label="Type"><select value={a.kind} onChange={e=>set('kind',e.target.value)}>{Object.entries(ARTIFACT_KINDS).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
   <Field label="Package role"><select value={a.packageRole} onChange={e=>set('packageRole',e.target.value)}>{Object.entries(PACKAGE_ROLES).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
   <Field label="Date produced or collected"><input type="date" value={a.artifactDate} max={todayIso()} onChange={e=>set('artifactDate',e.target.value)}/></Field>
   <Field label="Version"><input value={a.version} maxLength={20} onChange={e=>set('version',e.target.value)}/></Field>
  </div>
  <Field label="What it shows and how it was produced" wide><textarea rows={3} maxLength={4000} value={a.description} onChange={e=>set('description',e.target.value)}/></Field>
  <Field label="Excerpt" hint="Paste the relevant lines: settings, a log sample, a table. Up to 20,000 characters." wide><textarea rows={6} maxLength={20000} className="awx-mono" value={a.content} onChange={e=>set('content',e.target.value)}/></Field>
  <Field label="Where the full record is kept" wide><input value={a.location} maxLength={400} onChange={e=>set('location',e.target.value)} placeholder="e.g., Lab share \\SBD-FS01\Evidence\AU, or package folder item 4"/></Field>
  <fieldset className="awx-chips"><legend className="awx-label">Controls this evidence supports</legend>{state.controls.map(c=><label key={c.controlId} title={controlTitle(c.controlId)}><input type="checkbox" checked={a.controls.includes(c.controlId)} onChange={e=>set('controls',e.target.checked?[...a.controls,c.controlId]:a.controls.filter(x=>x!==c.controlId))}/>{c.controlId}</label>)}{!state.controls.length&&<span className="reader-note">Add controls first.</span>}</fieldset>
  <div className="awx-actions"><button className="reader-primary" disabled={busy}>{artifact?'Save changes':'Add to the Body of Evidence'}</button><button type="button" onClick={done}>Cancel</button></div>
 </form>;
}

const later=(days:number)=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);
const blankPoam=()=>({controlId:'',weakness:'',source:'assessment',severity:'CAT II',residualRisk:'moderate',mitigations:'',resources:'',poc:'',scheduledCompletion:later(90),milestones:[{text:'',due:later(30),done:false}],status:'ongoing',comments:''});
export function PoamTab({state,act,busy}:{state:State;act:Act;busy:boolean}){
 const [editing,setEditing]=useState<string|null>(null);const [filter,setFilter]=useState('open');
 const shown=state.poam.filter(p=>filter==='all'||(filter==='open'?['ongoing','risk_acceptance_requested'].includes(p.status):p.status===filter));
 const uncovered=state.controls.filter(c=>compliance(c)==='non_compliant'&&!state.poam.some(p=>p.controlId===c.controlId&&p.status!=='completed'));
 const exportCsv=()=>download(`${state.system.profile.acronym||'system'}-POAM.csv`,csv([
  ['POA&M ID','Control','Weakness or deficiency','Source identifying the weakness','Severity','Residual risk','Mitigations','Resources required','Point of contact','Scheduled completion date','Milestones with completion dates','Status','Completion date','Comments'],
  ...state.poam.map(p=>[p.number,p.controlId||'',p.weakness,POAM_SOURCES[p.source],p.severity,RISK[p.residualRisk],p.mitigations,p.resources,p.poc,p.scheduledCompletion||'',p.milestones.map((m,i)=>`${i+1}. ${m.text} (${m.due||'no date'}${m.done?', done':''})`).join(' | '),POAM_STATUS[p.status],p.completedAt?.slice(0,10)||'',p.comments]),
 ]));
 return <>
  <Hat role="ISSO">Plan of Action and Milestones</Hat>
  {uncovered.length>0&&<p className="awx-returned">Non-compliant without an open POA&amp;M item: {uncovered.map(c=>c.controlId).join(', ')}.</p>}
  <section className="awx-section"><h2>POA&amp;M <span className="awx-count">{state.poam.filter(p=>['ongoing','risk_acceptance_requested'].includes(p.status)).length} open</span></h2>
   <p className="awx-lead">One item per weakness. CAT I must be corrected or mitigated before an ATO; open CAT II and CAT III items with credible milestones become conditions of the authorization. Request risk acceptance only with mitigations: the Authorizing Official decides.</p>
   <div className="awx-filter" role="group" aria-label="Show">{[['open','Open'],['completed','Completed'],['risk_accepted','Risk accepted'],['all','All']].map(([id,label])=><button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
   <div className="awx-actions">{editing==='new'?null:<button type="button" className="reader-primary" onClick={()=>setEditing('new')}>Open a POA&amp;M item</button>}{state.poam.length>0&&<button type="button" onClick={exportCsv}>Download POA&amp;M (CSV)</button>}</div>
   {editing==='new'&&<PoamForm state={state} act={act} busy={busy} item={null} done={()=>setEditing(null)}/>}
   <ul className="awx-cards">{shown.map(p=><li key={p.id}>{editing===p.id?<PoamForm state={state} act={act} busy={busy} item={p} done={()=>setEditing(null)}/>:<PoamCard p={p} act={act} busy={busy} edit={()=>setEditing(p.id)}/>}</li>)}</ul>
   {!shown.length&&<p className="awx-lead">Nothing here.</p>}
  </section>
 </>;
}
function PoamCard({p,act,busy,edit}:{p:Poam;act:Act;busy:boolean;edit:()=>void}){
 const done=p.milestones.filter(m=>m.done).length,problems=poamProblems(p);
 const overdue=['ongoing','risk_acceptance_requested'].includes(p.status)&&p.scheduledCompletion&&p.scheduledCompletion<todayIso();
 return <article className="awx-card">
  <header><h3>#{p.number}{p.controlId&&<> · {p.controlId}</>}</h3><span className="awx-badges"><Badge tone={severityTone[p.severity]}>{SEVERITY[p.severity]}</Badge><Badge tone={poamTone[p.status]}>{POAM_STATUS[p.status]}</Badge>{overdue&&<Badge tone="bad">Overdue</Badge>}</span></header>
  <p>{p.weakness||<em>No description yet.</em>}</p>
  <p className="awx-card-meta">{POAM_SOURCES[p.source]} · residual risk {RISK[p.residualRisk].toLowerCase()} · POC {p.poc||'—'} · due {formatDate(p.scheduledCompletion)} · milestones {done}/{p.milestones.length}</p>
  {p.mitigations&&<p className="awx-card-meta"><b>Mitigations:</b> {p.mitigations}</p>}
  {p.comments&&<p className="awx-card-meta awx-pre"><b>Comments:</b> {p.comments}</p>}
  {['ongoing','risk_acceptance_requested'].includes(p.status)&&problems.length>0&&<ul className="awx-problems">{problems.map((x:string)=><li key={x}>{x}</li>)}</ul>}
  <div className="awx-actions">
   <button type="button" disabled={busy} onClick={edit}>Edit</button>
   {p.status==='ongoing'&&<button type="button" disabled={busy} onClick={()=>{if(confirm(`Mark POA&M #${p.number} completed? Retest the control so its assessment reflects the fix.`))void act('PATCH',`/poam/${p.id}`,{status:'completed',milestones:p.milestones.map(m=>({...m,done:true}))});}}>Mark completed</button>}
   {p.status==='ongoing'&&<button type="button" className="awx-link awx-remove" disabled={busy} onClick={()=>{if(confirm(`Delete POA&M #${p.number}?`))void act('DELETE',`/poam/${p.id}`);}}>Delete</button>}
  </div>
 </article>;
}
function PoamForm({state,act,busy,item,done}:{state:State;act:Act;busy:boolean;item:Poam|null;done:()=>void}){
 const [p,setP]=useState<any>(item?{controlId:item.controlId||'',weakness:item.weakness,source:item.source,severity:item.severity,residualRisk:item.residualRisk,mitigations:item.mitigations,resources:item.resources,poc:item.poc,scheduledCompletion:item.scheduledCompletion||'',milestones:item.milestones,status:item.status,comments:item.comments}:blankPoam());
 const set=(k:string,v:any)=>setP((x:any)=>({...x,[k]:v}));
 const statuses=Object.entries(POAM_STATUS).filter(([k])=>k!=='risk_accepted'||item?.status==='risk_accepted');
 return <form className="awx-card awx-card-form" onSubmit={async e=>{e.preventDefault();if(await act(item?'PATCH':'POST',item?`/poam/${item.id}`:'/poam',{...p,controlId:p.controlId||null,scheduledCompletion:p.scheduledCompletion||null,milestones:p.milestones.filter((m:any)=>m.text.trim())}))done();}}>
  <h3>{item?`Edit POA&M #${item.number}`:'Open a POA&M item'}</h3>
  <div className="awx-grid">
   <Field label="Control"><select value={p.controlId} onChange={e=>set('controlId',e.target.value)}><option value="">Not tied to one control</option>{state.controls.map(c=><option key={c.controlId} value={c.controlId}>{c.controlId} · {controlTitle(c.controlId)}</option>)}</select></Field>
   <Field label="Source"><select value={p.source} onChange={e=>set('source',e.target.value)}>{Object.entries(POAM_SOURCES).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
   <Field label="Severity"><select value={p.severity} onChange={e=>set('severity',e.target.value)}>{Object.entries(SEVERITY).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
   <Field label="Residual risk"><select value={p.residualRisk} onChange={e=>set('residualRisk',e.target.value)}>{Object.entries(RISK).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
   <Field label="Point of contact"><input value={p.poc} maxLength={160} onChange={e=>set('poc',e.target.value)}/></Field>
   <Field label="Scheduled completion"><input type="date" value={p.scheduledCompletion} onChange={e=>set('scheduledCompletion',e.target.value)}/></Field>
   <Field label="Status"><select value={p.status} disabled={item?.status==='risk_accepted'} onChange={e=>set('status',e.target.value)}>{statuses.map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field>
  </div>
  <Field label="Weakness or deficiency" hint="What is wrong, where, and what the assessment observed." wide><textarea rows={3} maxLength={4000} value={p.weakness} onChange={e=>set('weakness',e.target.value)}/></Field>
  <Field label="Resources required" wide><input value={p.resources} maxLength={1000} onChange={e=>set('resources',e.target.value)} placeholder="People, hours, funding, equipment"/></Field>
  <Field label="Mitigations in place" hint="Required to request risk acceptance." wide><textarea rows={2} maxLength={4000} value={p.mitigations} onChange={e=>set('mitigations',e.target.value)}/></Field>
  <fieldset className="awx-milestones"><legend className="awx-label">Milestones</legend>
   {p.milestones.map((m:any,i:number)=><div key={i} className="awx-milestone">
    <input aria-label={`Milestone ${i+1}`} value={m.text} maxLength={500} placeholder="Milestone" onChange={e=>set('milestones',p.milestones.map((x:any,j:number)=>j===i?{...x,text:e.target.value}:x))}/>
    <input aria-label={`Milestone ${i+1} date`} type="date" value={m.due||''} onChange={e=>set('milestones',p.milestones.map((x:any,j:number)=>j===i?{...x,due:e.target.value||null}:x))}/>
    <label><input type="checkbox" checked={m.done} onChange={e=>set('milestones',p.milestones.map((x:any,j:number)=>j===i?{...x,done:e.target.checked}:x))}/>Done</label>
    <button type="button" className="awx-link" onClick={()=>set('milestones',p.milestones.filter((_:any,j:number)=>j!==i))}>Remove</button>
   </div>)}
   {p.milestones.length<20&&<button type="button" onClick={()=>set('milestones',[...p.milestones,{text:'',due:null,done:false}])}>Add a milestone</button>}
  </fieldset>
  <Field label="Comments" wide><textarea rows={2} maxLength={4000} value={p.comments} onChange={e=>set('comments',e.target.value)}/></Field>
  <div className="awx-actions"><button className="reader-primary" disabled={busy}>{item?'Save changes':'Open the item'}</button><button type="button" onClick={done}>Cancel</button></div>
 </form>;
}
