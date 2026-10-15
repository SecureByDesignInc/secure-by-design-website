'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {
 issmReview,scaReview,riskCounts,compliance,PACKAGE_TYPES,PACKAGE_STAGES,DECISIONS,DECISION_SHORT,IMPLEMENTATION,COMPLIANCE,RESULTS,ROLES,SYSTEM_TYPES,LEVELS,
 PACKAGE_ROLES,ARTIFACT_KINDS,SEVERITY,RISK,POAM_STATUS,TERMS,controlTitle,providerById,catalogSource,acceptedEvidence,
} from '../../../lib/authorization/model.mjs';
import {Badge,Checklist,Field,Hat,decisionTone,formatDate,useCatalog,download,csv,type Act,type State,type Package} from './shared';

export default function PackageTab({state,act,busy,go}:{state:State;act:Act;busy:boolean;go:(tab:string)=>void}){
 const pkg=state.package;const [doc,setDoc]=useState<string|null>(null);
 const [draft,setDraft]=useState({type:pkg?.type||'assess_authorize',executiveSummary:pkg?.executiveSummary||'',assessorSummary:pkg?.assessorSummary||''});
 useEffect(()=>setDraft({type:pkg?.type||'assess_authorize',executiveSummary:pkg?.executiveSummary||'',assessorSummary:pkg?.assessorSummary||''}),[pkg?.id,pkg?.updatedAt]);
 const issm=issmReview(state),sca=scaReview(state),ready=[...issm,...sca].every(c=>c.ok);
 const dirty=!!pkg&&(draft.type!==pkg.type||draft.executiveSummary!==pkg.executiveSummary||draft.assessorSummary!==pkg.assessorSummary);
 const decided=state.packages.filter(p=>p.stage==='decided');const counts=riskCounts(state);
 return <>
  <Hat role="ISSM">Authorize. You assemble and submit; the reviews and the decision are automated in this practice workspace.</Hat>
  {!pkg&&decided[0]&&<section className="awx-section" id="awx-package-top"><h2>Latest decision</h2><ul className="awx-decisions"><DecisionCard pkg={decided[0]}/></ul><button type="button" onClick={()=>go('monitor')}>Go to continuous monitoring</button></section>}
  {!pkg?<section className="awx-section"><h2>{state.system.authorization?'Start the next package':'Start the authorization package'}</h2>
   <p className="awx-lead">The package brings together the system security plan, the assessment results, the POA&amp;M, and your executive summary for the Authorizing Official. {state.system.authorization?'A new package after a decision is a reauthorization (or a fresh assessment after a denial).':''}</p>
   <button type="button" className="reader-primary" disabled={busy} onClick={()=>void act('PUT','/package',{},{quiet:true})}>Start the package</button>
  </section>:<>
   <section className="awx-section" id="awx-package-top"><h2>Package <Badge tone={pkg.stage==='returned'?'warn':'neutral'}>{PACKAGE_STAGES[pkg.stage]}</Badge></h2>
    <Chain pkg={pkg}/>
    {pkg.stage==='returned'&&pkg.review&&<div className="awx-returned"><strong>{pkg.review.stage==='issm'?'The ISSM review':'The assessor review'} returned the package on {formatDate(pkg.review.at)}.</strong> Fix the items below and submit again.</div>}
    <div className="awx-grid"><Field label="Package type"><select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value})}>{Object.entries(PACKAGE_TYPES).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select></Field></div>
    <Field label="Executive summary (for the AO)" hint="The mission need, the assessed posture, significant weaknesses and their plans, and the decision you are requesting." wide><textarea rows={6} maxLength={8000} value={draft.executiveSummary} onChange={e=>setDraft({...draft,executiveSummary:e.target.value})}/></Field>
    <Field label="Security assessment report summary (assessor)" hint="What was assessed, the methods (examine, interview, test), significant results, limitations, and their effect on risk." wide><textarea rows={6} maxLength={8000} value={draft.assessorSummary} onChange={e=>setDraft({...draft,assessorSummary:e.target.value})}/></Field>
    <div className="awx-actions"><button type="button" disabled={busy||!dirty} onClick={()=>void act('PUT','/package',draft)}>{dirty?'Save the package':'Saved'}</button></div>
   </section>
   <section className="awx-section"><h2>Readiness</h2><p className="awx-lead">The same checks the reviewers run when you submit.</p>
    <h3 className="awx-subhead">ISSM review · completeness and consistency</h3><Checklist checks={issm} go={go}/>
    <h3 className="awx-subhead">Assessor review · assessment and weaknesses</h3><Checklist checks={sca} go={go}/>
    <div className="awx-risk"><span><b>{counts.cat1}</b> open CAT I</span><span><b>{counts.cat2}</b> open CAT II</span><span><b>{counts.cat3}</b> open CAT III</span><span><b>{state.poam.filter(p=>p.status==='risk_acceptance_requested').length}</b> risk acceptance requests</span></div>
    <button type="button" className="reader-primary awx-submit" disabled={busy||dirty} onClick={async()=>{
     if(!ready&&!confirm('Some checks are still open, so a reviewer will return the package. Submit anyway to see their comments?'))return;
     const next=await act('POST','/package/submit',undefined,{ok:s=>s.package?`${s.package.review?.stage==='sca'?'The assessor review':'The ISSM review'} returned the package. Their comments are below.`:`The Authorizing Official decided: ${DECISIONS[s.packages[0]?.decision?.decision||'']||'see below'}.`});
     if(next)setTimeout(()=>document.getElementById('awx-package-top')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }}>Submit the package</button>
    {dirty&&<p className="reader-note">Save the package before submitting.</p>}
   </section>
  </>}
  <section className="awx-section"><h2>Decision history</h2>{decided.length?<ul className="awx-decisions">{decided.map(p=><DecisionCard key={p.id} pkg={p}/>)}</ul>:<p className="awx-lead">No decisions yet.</p>}
   <p className="reader-note">Practice decision rules: an open CAT I or very high residual risk is denied; open CAT II and CAT III items with milestones become conditions; no open items earns a full ATO. Terms in this exercise: ATO {TERMS.ato/365} years, ATO with conditions {TERMS.ato_conditions} days, IATT {TERMS.iatt} days. A real AO weighs mission need and the organization’s risk tolerance, within their own authority.</p>
  </section>
  <section className="awx-section"><h2>Package documents</h2><p className="awx-lead">Generated from the workspace, like a GRC tool’s reports. Print to PDF for your portfolio.</p>
   <div className="awx-doc-buttons">
    <button type="button" onClick={()=>setDoc('ssp')}><b>System Security Plan</b><span>System, categorization, and every control’s implementation</span></button>
    <button type="button" onClick={()=>setDoc('sar')}><b>Security Assessment Report</b><span>Results by objective, findings, and the risk summary</span></button>
    <button type="button" onClick={()=>setDoc('boe')}><b>Body of Evidence index</b><span>Every artifact with its controls and review state</span></button>
    <button type="button" disabled={!state.system.authorization} onClick={()=>setDoc('decision')}><b>Authorization decision</b><span>{state.system.authorization?'The latest decision, term, and conditions':'Available after a decision'}</span></button>
    <button type="button" onClick={()=>download(`${state.system.profile.acronym||'system'}-traceability-matrix.csv`,traceability(state))}><b>Control traceability matrix (CSV)</b><span>Requirement → implementation → evidence → result</span></button>
   </div>
  </section>
  {doc&&<PrintDoc state={state} doc={doc} close={()=>setDoc(null)}/>}
 </>;
}

function Chain({pkg}:{pkg:Package}){
 const r=pkg.review;
 const state=(stage:string)=>{
  if(!r)return 'waiting';
  if(stage==='issm')return r.issm.every(c=>c.ok)?'passed':'returned';
  if(stage==='sca')return !r.sca?'waiting':r.sca.every(c=>c.ok)?'passed':'returned';
  return 'waiting';
 };
 const label={waiting:'Waiting',passed:'Passed',returned:'Returned'} as Record<string,string>;
 return <ol className="awx-chain" aria-label="Package approval chain">
  <li className="passed"><b>ISSM (you)</b><span>Assembles and submits</span></li>
  {[['issm','ISSM review','Completeness'],['sca','Assessor review','Assessment and weaknesses'],['ao','Authorizing Official','Decision']].map(([id,name,what])=><li key={id} className={state(id)}><b>{name}</b><span>{what} · {label[state(id)]}</span></li>)}
 </ol>;
}

function DecisionCard({pkg}:{pkg:Package}){
 const d=pkg.decision!;
 return <li className={'awx-decision awx-decision-'+d.decision}>
  <header><Badge tone={decisionTone[d.decision]}>{DECISION_SHORT[d.decision]}</Badge><strong>{DECISIONS[d.decision]}</strong></header>
  <p className="awx-card-meta">{PACKAGE_TYPES[pkg.type]} · decided {formatDate(pkg.decidedAt)}{d.terminationDate&&<> · terminates {formatDate(d.terminationDate)}</>}</p>
  <ul>{d.reasons.map((x,i)=><li key={i}>{x}</li>)}</ul>
  {d.conditions.length>0&&<details><summary>Conditions ({d.conditions.length})</summary><ul>{d.conditions.map((x,i)=><li key={i}>{x}</li>)}</ul></details>}
  {d.riskDecisions.length>0&&<details><summary>Risk acceptance decisions ({d.riskDecisions.length})</summary><ul>{d.riskDecisions.map(x=><li key={x.id}>POA&amp;M #{x.number}: {x.reason}</li>)}</ul></details>}
 </li>;
}

function traceability(state:State){
 return csv([['Control','Title','Implementation status','Provider','Responsible','Implementation statement','Evidence (accepted)','Compliance','Objectives satisfied','Objectives other than satisfied','POA&M'],
  ...state.controls.map(c=>{const results=Object.values(c.results||{});return [c.controlId,controlTitle(c.controlId),IMPLEMENTATION[c.implementationStatus],providerById(c.provider)?.name||'',c.responsible,c.narrative,acceptedEvidence(state,c.controlId).map(a=>a.title).join(' | '),COMPLIANCE[compliance(c)],results.filter(r=>r.result==='satisfied').length,results.filter(r=>r.result==='other_than_satisfied').length,state.poam.filter(p=>p.controlId===c.controlId).map(p=>`#${p.number} ${POAM_STATUS[p.status]}`).join(' | ')];})]);
}

// Printable documents. While one is open, the page prints only the document.
function PrintDoc({state,doc,close}:{state:State;doc:string;close:()=>void}){
 const {catalog}=useCatalog(doc==='sar');
 useEffect(()=>{document.body.classList.add('awx-printing');const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};window.addEventListener('keydown',onKey);return()=>{document.body.classList.remove('awx-printing');window.removeEventListener('keydown',onKey);};},[close]);
 const p=state.system.profile,auth=state.system.authorization;
 const title={ssp:'System Security Plan',sar:'Security Assessment Report',boe:'Body of Evidence Index',decision:'Authorization Decision'}[doc]||'';
 const head=<header className="awx-doc-head"><p>Secure By Design practice exercise · not an official authorization record</p><h1>{title}</h1><h2>{p.name}{p.acronym&&` (${p.acronym})`} · version {p.version}</h2><p>Generated {formatDate(new Date().toISOString())}</p></header>;
 let body:ReactNode=null;
 if(doc==='ssp')body=<>
  <h3>1. System identification</h3><dl><dt>Type</dt><dd>{SYSTEM_TYPES[p.type]}</dd>{Object.entries(ROLES).map(([k,v])=><div key={k}><dt>{v as string}</dt><dd>{p.roles?.[k]||'—'}</dd></div>)}</dl>
  <h3>2. System description</h3><p className="awx-pre">{p.description}</p>
  <h3>3. Authorization boundary</h3><p className="awx-pre">{p.boundary}</p><h4>Interconnections</h4><p className="awx-pre">{p.interconnections||'—'}</p>
  <h3>4. Categorization</h3><table><thead><tr><th>Information type</th><th>C</th><th>I</th><th>A</th></tr></thead><tbody>{p.infoTypes.map((t,i)=><tr key={i}><td>{t.name}</td><td>{LEVELS[t.c]}</td><td>{LEVELS[t.i]}</td><td>{LEVELS[t.a]}</td></tr>)}<tr><th>System</th><th>{LEVELS[p.categorization.c||'']||'—'}</th><th>{LEVELS[p.categorization.i||'']||'—'}</th><th>{LEVELS[p.categorization.a||'']||'—'}</th></tr></tbody></table><p className="awx-pre">{p.categorizationRationale}</p>
  <h3>5. Control selection</h3><p className="awx-pre">{p.selectionRationale}</p><p>Catalog: {catalogSource}.</p>
  <h3>6. Control implementation</h3>{state.controls.map(c=><section key={c.controlId} className="awx-doc-control"><h4>{c.controlId} {controlTitle(c.controlId)}</h4><p><b>Status:</b> {IMPLEMENTATION[c.implementationStatus]}{c.provider&&` · inherited from ${providerById(c.provider)?.name}`} · <b>Responsible:</b> {c.responsible||'—'}</p><p className="awx-pre">{c.narrative||'—'}</p><p><b>Evidence:</b> {acceptedEvidence(state,c.controlId).map(a=>a.title).join('; ')||'—'}</p></section>)}
 </>;
 if(doc==='sar'){const counts=riskCounts(state);body=<>
  <h3>1. Summary</h3><p className="awx-pre">{state.package?.assessorSummary||state.packages[0]?.assessorSummary||'—'}</p><p><b>Assessor:</b> {p.roles?.sca||'—'}</p>
  <h3>2. Results</h3><table><thead><tr><th>Control</th><th>Compliance</th><th>Last assessed</th></tr></thead><tbody>{state.controls.map(c=><tr key={c.controlId}><td>{c.controlId} {controlTitle(c.controlId)}</td><td>{COMPLIANCE[compliance(c)]}</td><td>{formatDate(c.lastAssessedAt)}</td></tr>)}</tbody></table>
  <h3>3. Results by objective</h3>{state.controls.filter(c=>c.implementationStatus!=='inherited').map(c=>{const obj=new Map(catalog?.get(c.controlId)?.objectives||[]);return <section key={c.controlId} className="awx-doc-control"><h4>{c.controlId} {controlTitle(c.controlId)}</h4><ul>{Object.entries(c.results||{}).map(([id,r])=><li key={id}><b>{id}</b> {obj.get(id)||''} — <b>{RESULTS[r.result||'']||'Not recorded'}</b>{r.note&&`: ${r.note}`}</li>)}</ul>{c.assessorNotes&&<p className="awx-pre"><b>Notes:</b> {c.assessorNotes}</p>}</section>;})}
  <h3>4. Findings and risk</h3><p>{counts.open} open ({counts.cat1} CAT I, {counts.cat2} CAT II, {counts.cat3} CAT III) · {counts.accepted} risk accepted · {counts.completed} completed.</p>
  <table><thead><tr><th>#</th><th>Control</th><th>Weakness</th><th>Severity</th><th>Residual risk</th><th>Status</th><th>Due</th></tr></thead><tbody>{state.poam.map(x=><tr key={x.id}><td>{x.number}</td><td>{x.controlId||'—'}</td><td>{x.weakness}</td><td>{SEVERITY[x.severity]}</td><td>{RISK[x.residualRisk]}</td><td>{POAM_STATUS[x.status]}</td><td>{x.scheduledCompletion||'—'}</td></tr>)}</tbody></table>
 </>;}
 if(doc==='boe')body=<table><thead><tr><th>Artifact</th><th>Type</th><th>Package role</th><th>Date</th><th>Version</th><th>Controls</th><th>Review</th><th>Location</th></tr></thead><tbody>{state.artifacts.map(a=><tr key={a.id}><td>{a.title}</td><td>{ARTIFACT_KINDS[a.kind]}</td><td>{a.packageRole==='none'?'—':PACKAGE_ROLES[a.packageRole]}</td><td>{a.artifactDate||'—'}</td><td>{a.version}</td><td>{a.controls.join(', ')||'—'}</td><td>{a.reviewState}</td><td>{a.location||'—'}</td></tr>)}</tbody></table>;
 if(doc==='decision'&&auth)body=<>
  <p><b>Decision:</b> {DECISIONS[auth.decision]}</p><p><b>Date:</b> {formatDate(auth.decidedAt)}{auth.terminationDate&&<> · <b>Authorization termination date:</b> {formatDate(auth.terminationDate)}</>}</p>
  <p><b>Package:</b> {PACKAGE_TYPES[auth.packageType]} · <b>Authorizing Official:</b> {p.roles?.ao||'—'}</p>
  <h3>Basis</h3><ul>{auth.reasons.map((x,i)=><li key={i}>{x}</li>)}</ul>
  {auth.conditions.length>0&&<><h3>Conditions</h3><ol>{auth.conditions.map((x,i)=><li key={i}>{x}</li>)}</ol></>}
  <p>The decision was produced by the workspace’s practice rules from the package as submitted. It demonstrates the process and carries no authority.</p>
 </>;
 return <div className="awx-print-doc" role="dialog" aria-modal="true" aria-label={title}>
  <div className="awx-print-bar"><button type="button" className="reader-primary" onClick={()=>window.print()}>Print or save as PDF</button><button type="button" onClick={close}>Close</button></div>
  <article className="awx-doc">{head}{body}</article>
 </div>;
}
