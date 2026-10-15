'use client';
import {useEffect,useState,type ReactNode} from 'react';

// The workspace state as the API returns it (server/authorization.js).
export type Control={controlId:string;implementationStatus:string;provider:string|null;narrative:string;responsible:string;frequency:string;step:string;results:Record<string,{result:string|null;note:string}>;assessorNotes:string;returnComment:string|null;reassessReason:string|null;lastAssessedAt:string|null;updatedAt:string};
export type Artifact={id:string;title:string;kind:string;packageRole:string;description:string;content:string;location:string;version:string;artifactDate:string|null;controls:string[];reviewState:string;reviewNote:string;createdAt:string;updatedAt:string};
export type Milestone={text:string;due:string|null;done:boolean};
export type Poam={id:string;number:number;controlId:string|null;weakness:string;source:string;severity:string;residualRisk:string;mitigations:string;resources:string;poc:string;scheduledCompletion:string|null;milestones:Milestone[];status:string;comments:string;completedAt:string|null;createdAt:string;updatedAt:string};
export type Check={id:string;ok:boolean;label:string;detail:string;tab:string;refs:string[]};
export type Decision={decision:string;terminationDate:string|null;reasons:string[];conditions:string[];riskDecisions:{id:string;number:number;accepted:boolean;reason:string}[];decisionLabel?:string;decidedAt?:string;packageType?:string};
export type Package={id:string;type:string;stage:string;executiveSummary:string;assessorSummary:string;review:{at:string;stage:string;issm:Check[];sca:Check[]|null}|null;decision:Decision|null;snapshot:any;submittedAt:string|null;decidedAt:string|null;createdAt:string;updatedAt:string};
export type Profile={name:string;acronym:string;type:string;version:string;description:string;boundary:string;interconnections:string;roles:Record<string,string>;infoTypes:{name:string;c:string;i:string;a:string}[];categorization:{c:string|null;i:string|null;a:string|null};categorizationRationale:string;selectionRationale:string;providerRenewals?:Record<string,string>;lastAnnualReview?:string;template?:string};
export type System={id:string;profile:Profile;authorization:(Decision&{decidedAt:string;packageId:string;packageType:string})|null;createdAt:string;updatedAt:string};
export type State={system:System;controls:Control[];artifacts:Artifact[];poam:Poam[];package:Package|null;packages:Package[];history:{at:string;role:string;action:string;subject:string;detail:string}[]};
// Runs a workspace call and returns the new state (null when it failed; the page shows the error).
export type Act=(method:string,path:string,body?:unknown,options?:{quiet?:boolean;ok?:string|((next:State)=>string)})=>Promise<State|null>;

export async function api(method:string,path:string,body?:unknown){
 const response=await fetch('/api/authorization'+path,{method,credentials:'same-origin',headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 let data:any=null;try{data=await response.json()}catch{}
 if(!response.ok)throw new Error(data?.error||'That could not be saved. Please try again.');
 return data;
}

// The full control text (statements and SP 800-53A objectives) is about 850 KB, so it loads only when needed.
type CatalogControl={id:string;title:string;family:string;baselines:string;statement:[number,string,string][];objectives:[string,string][]};
let catalogPromise:Promise<Map<string,CatalogControl>>|null=null;
export function useCatalog(enabled=true){
 const [catalog,setCatalog]=useState<Map<string,CatalogControl>|null>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{
  if(!enabled||catalog)return;
  catalogPromise??=fetch('/authorization-workspace/controls-rev5.json').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>new Map((d.controls as CatalogControl[]).map(c=>[c.id,c])));
  catalogPromise.then(setCatalog).catch(()=>{catalogPromise=null;setFailed(true)});
 },[enabled,catalog]);
 return {catalog,failed};
}

export const formatDate=(value?:string|null)=>{if(!value)return '—';const d=new Date(value.length===10?value+'T12:00:00Z':value);return isNaN(d.getTime())?value:d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});};
export const formatTime=(value:string)=>new Date(value).toLocaleString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
export const todayIso=()=>new Date().toISOString().slice(0,10);

export function Badge({tone='neutral',children}:{tone?:string;children:ReactNode}){return <span className={`awx-badge awx-badge-${tone}`}>{children}</span>;}
export const stepTone:Record<string,string>={draft:'neutral',submitted:'info',returned:'warn',assessed:'good'};
export const complianceTone:Record<string,string>={not_assessed:'neutral',compliant:'good',non_compliant:'bad',not_applicable:'muted',inherited:'info'};
export const artifactTone:Record<string,string>={draft:'neutral',submitted:'info',accepted:'good',rejected:'bad'};
export const severityTone:Record<string,string>={'CAT I':'bad','CAT II':'warn','CAT III':'info'};
export const poamTone:Record<string,string>={ongoing:'warn',risk_acceptance_requested:'info',risk_accepted:'muted',completed:'good'};
export const decisionTone:Record<string,string>={ato:'good',ato_conditions:'warn',iatt:'info',dato:'bad',expired:'bad',none:'neutral'};

export function Field({label,hint,children,wide}:{label:string;hint?:string;children:ReactNode;wide?:boolean}){
 return <label className={'awx-field'+(wide?' awx-wide':'')}><span className="awx-label">{label}</span>{children}{hint&&<small className="awx-hint">{hint}</small>}</label>;
}
export function Hat({role,children}:{role:string;children?:ReactNode}){
 return <p className="awx-hat"><span>You are working as</span><strong>{role}</strong>{children&&<span className="awx-hat-note">{children}</span>}</p>;
}
export function Checklist({checks,go}:{checks:Check[];go:(tab:string)=>void}){
 return <ul className="awx-checks">{checks.map(c=><li key={c.id} className={c.ok?'ok':'open'}>
  <span className="awx-check-mark" aria-hidden="true">{c.ok?'✓':'!'}</span>
  <div><strong>{c.label}</strong><span className="sr-only">{c.ok?' (done)':' (needs work)'}</span>{!c.ok&&<p>{c.detail}</p>}</div>
  {!c.ok&&<button type="button" className="awx-link" onClick={()=>go(c.tab)}>Open</button>}
 </li>)}</ul>;
}
// Downloads a text file the page builds (CSV exports).
export function download(name:string,text:string,type='text/csv'){
 const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const csv=(rows:(string|number|null|undefined)[][])=>rows.map(r=>r.map(v=>{const s=v==null?'':String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(',')).join('\r\n')+'\r\n';
