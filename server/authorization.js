// ATO Package Builder API: /api/authorization/...
//
// Each signed-in learner keeps up to five practice systems and takes them through an authorization the
// way eMASS and Xacta 360 organize one: the system record, selected controls (implementation, then
// assessment), the Body of Evidence, the POA&M, a package that passes an ISSM review, an assessor review
// and an Authorizing Official decision, then continuous monitoring. The review rules live in
// lib/authorization/model.mjs and are shared with the page, so its readiness checks match this decision.
//
// Every system belongs to one account. Every route checks that ownership; nothing is shared.
import {getReader} from './reader-auth.js';
import {
 isControl,objectivesFor,IMPLEMENTATION,RESULTS,FREQUENCIES,SEVERITY,RISK,POAM_STATUS,POAM_SOURCES,ARTIFACT_KINDS,PACKAGE_ROLES,
 PACKAGE_TYPES,SYSTEM_TYPES,LEVELS,ROLES,TEMPLATES,providerById,submitProblems,validateProblems,runPackage,compliance,
 DECISIONS,TERMS,openPoam,phases,
} from '../lib/authorization/model.mjs';

const LIMITS={systems:5,controls:400,artifacts:300,poam:300,history:300,body:98304};
class Bad extends Error{constructor(message,status=400){super(message);this.status=status}}
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff'}});
const nowIso=()=>new Date().toISOString();
const json=(value,fallback)=>{try{return value==null?fallback:JSON.parse(value)}catch{return fallback}};

async function readBody(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Bad('Send JSON.',415);
 const reader=request.body?.getReader();if(!reader)return {};
 let bytes=0,text='';const decoder=new TextDecoder();
 while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>LIMITS.body){await reader.cancel();throw new Bad('That is too much text to save at once.',413)}text+=decoder.decode(value,{stream:true})}
 text+=decoder.decode();if(!text)return {};
 let data;try{data=JSON.parse(text)}catch{throw new Bad('Check the form and try again.')}
 if(!data||Array.isArray(data)||typeof data!=='object')throw new Bad('Check the form and try again.');
 return data;
}
// Field validators. Each returns the clean value or throws a message the page can show.
const str=(value,max,label)=>{if(value==null)return '';if(typeof value!=='string')throw new Bad(`${label} must be text.`);const v=value.replace(/\r\n/g,'\n').trim();if(v.length>max)throw new Bad(`${label} is too long (${max.toLocaleString('en-US')} characters at most).`);return v;};
const oneOf=(value,options,label)=>{if(!Object.prototype.hasOwnProperty.call(options,value))throw new Bad(`Choose a valid ${label}.`);return value;};
const date=(value,label)=>{if(value==null||value==='')return null;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||isNaN(Date.parse(value+'T00:00:00Z')))throw new Bad(`${label} must be a date.`);return value;};
const only=(data,keys)=>{const extra=Object.keys(data).filter(k=>!keys.includes(k));if(extra.length)throw new Bad('Unexpected field: '+extra[0]+'.');};
const controlIds=(value,label='controls')=>{if(!Array.isArray(value)||value.length>LIMITS.controls)throw new Bad(`Choose valid ${label}.`);const ids=[...new Set(value)];for(const id of ids)if(typeof id!=='string'||!isControl(id))throw new Bad(`${String(id).slice(0,20)} is not a NIST SP 800-53 Rev. 5 control.`);return ids;};

// Row mapping.
const systemRow=r=>({id:r.id,profile:json(r.profile,{}),authorization:json(r.current_decision,null),createdAt:r.created_at,updatedAt:r.updated_at});
const controlRow=r=>({controlId:r.control_id,implementationStatus:r.implementation_status,provider:r.provider,narrative:r.narrative,responsible:r.responsible,frequency:r.frequency,step:r.step,results:json(r.results,{}),assessorNotes:r.assessor_notes,returnComment:r.return_comment,reassessReason:r.reassess_reason,lastAssessedAt:r.last_assessed_at,updatedAt:r.updated_at});
const artifactRow=r=>({id:r.id,title:r.title,kind:r.kind,packageRole:r.package_role,description:r.description,content:r.content,location:r.location,version:r.version,artifactDate:r.artifact_date,controls:json(r.controls,[]),reviewState:r.review_state,reviewNote:r.review_note,createdAt:r.created_at,updatedAt:r.updated_at});
const poamRow=r=>({id:r.id,number:r.number,controlId:r.control_id,weakness:r.weakness,source:r.source,severity:r.severity,residualRisk:r.residual_risk,mitigations:r.mitigations,resources:r.resources,poc:r.poc,scheduledCompletion:r.scheduled_completion,milestones:json(r.milestones,[]),status:r.status,comments:r.comments,completedAt:r.completed_at,createdAt:r.created_at,updatedAt:r.updated_at});
const packageRow=r=>r&&({id:r.id,type:r.type,stage:r.stage,executiveSummary:r.executive_summary,assessorSummary:r.assessor_summary,review:json(r.review,null),decision:json(r.decision,null),snapshot:json(r.snapshot,null),submittedAt:r.submitted_at,decidedAt:r.decided_at,createdAt:r.created_at,updatedAt:r.updated_at});

async function ownSystem(env,accountId,id){
 if(typeof id!=='string'||!/^[0-9a-f-]{36}$/.test(id))throw new Bad('System not found.',404);
 const row=await env.DB.prepare('SELECT * FROM auth_systems WHERE id=? AND account_id=?').bind(id,accountId).first();
 if(!row)throw new Bad('System not found.',404);
 return systemRow(row);
}
async function loadState(env,system){
 const id=system.id;
 const [controls,artifacts,poam,packages,history]=await Promise.all([
  env.DB.prepare('SELECT * FROM auth_controls WHERE system_id=?').bind(id).all(),
  env.DB.prepare('SELECT * FROM auth_artifacts WHERE system_id=? ORDER BY created_at').bind(id).all(),
  env.DB.prepare('SELECT * FROM auth_poam WHERE system_id=? ORDER BY number').bind(id).all(),
  env.DB.prepare('SELECT * FROM auth_packages WHERE system_id=? ORDER BY created_at DESC').bind(id).all(),
  env.DB.prepare('SELECT at,role,action,subject,detail FROM auth_history WHERE system_id=? ORDER BY id DESC LIMIT ?').bind(id,LIMITS.history).all(),
 ]);
 const allPackages=packages.results.map(packageRow);
 const sort=(a,b)=>a.controlId.localeCompare(b.controlId,'en',{numeric:true});
 return {system,controls:controls.results.map(controlRow).sort(sort),artifacts:artifacts.results.map(artifactRow),poam:poam.results.map(poamRow),
  package:allPackages.find(p=>p.stage!=='decided')||null,packages:allPackages,history:history.results};
}
const log=(env,systemId,role,action,subject='',detail='')=>env.DB.prepare('INSERT INTO auth_history (system_id,at,role,action,subject,detail) VALUES (?,?,?,?,?,?)').bind(systemId,nowIso(),role,action,subject,String(detail).slice(0,2000));
const touch=(env,systemId)=>env.DB.prepare('UPDATE auth_systems SET updated_at=? WHERE id=?').bind(nowIso(),systemId);
const ISSO='ISSO (you)',ASSESSOR='Assessor (you)',ISSM_REVIEW='ISSM review',SCA_REVIEW='Assessor review',AO='Authorizing Official';

// --- System record -------------------------------------------------------------------------------
function cleanProfile(data,current){
 const allowed=['name','acronym','type','version','description','boundary','interconnections','roles','infoTypes','categorization','categorizationRationale','selectionRationale'];
 only(data,allowed);
 const p={...current};
 if('name' in data){p.name=str(data.name,120,'System name');if(!p.name)throw new Bad('Give the system a name.');}
 if('acronym' in data)p.acronym=str(data.acronym,30,'Acronym');
 if('type' in data)p.type=oneOf(data.type,SYSTEM_TYPES,'system type');
 if('version' in data)p.version=str(data.version,20,'Version');
 for(const [k,max] of [['description',6000],['boundary',8000],['interconnections',4000],['categorizationRationale',6000],['selectionRationale',6000]])if(k in data)p[k]=str(data[k],max,k==='categorizationRationale'?'Categorization rationale':k==='selectionRationale'?'Selection rationale':k[0].toUpperCase()+k.slice(1));
 if('roles' in data){
  if(!data.roles||typeof data.roles!=='object'||Array.isArray(data.roles))throw new Bad('Check the role assignments.');
  only(data.roles,Object.keys(ROLES));
  p.roles={...(p.roles||{})};for(const k of Object.keys(data.roles))p.roles[k]=str(data.roles[k],120,ROLES[k]);
 }
 if('infoTypes' in data){
  if(!Array.isArray(data.infoTypes)||data.infoTypes.length>20)throw new Bad('Add at most 20 information types.');
  p.infoTypes=data.infoTypes.map(t=>{if(!t||typeof t!=='object')throw new Bad('Check the information types.');only(t,['name','c','i','a']);
   const name=str(t.name,160,'Information type');if(!name)throw new Bad('Name each information type.');
   return {name,c:oneOf(t.c,LEVELS,'confidentiality impact'),i:oneOf(t.i,LEVELS,'integrity impact'),a:oneOf(t.a,LEVELS,'availability impact')};});
 }
 if('categorization' in data){
  const c=data.categorization;if(!c||typeof c!=='object'||Array.isArray(c))throw new Bad('Check the categorization.');only(c,['c','i','a']);
  p.categorization={};for(const k of ['c','i','a'])p.categorization[k]=c[k]?oneOf(c[k],LEVELS,'impact level'):null;
 }
 return p;
}
async function createSystem(env,accountId,data){
 only(data,['template','name']);
 const template=Object.prototype.hasOwnProperty.call(TEMPLATES,data.template)?TEMPLATES[data.template]:null;if(!template)throw new Bad('Choose a starting point.');
 const profile={...template.profile,roles:{},infoTypes:[],categorization:{c:null,i:null,a:null},categorizationRationale:'',selectionRationale:'',template:data.template};
 if(data.name!=null){const name=str(data.name,120,'System name');if(name)profile.name=name;}
 if(!profile.name)throw new Bad('Give the system a name.');
 // One registration per system (owner report, 15 October 2026): an account keeps one Secure By Design enclave
 // (enforced by the unique registration_key, so two requests at once cannot both succeed), and no two systems
 // share a name, so a repeated click cannot register the same system twice.
 const key=template.once?data.template:null;
 const onceMessage=`You already have the ${template.label}. Open it from Your systems.`;
 const existing=(await env.DB.prepare('SELECT profile,registration_key FROM auth_systems WHERE account_id=?').bind(accountId).all()).results;
 if(key&&existing.some(r=>r.registration_key===key))throw new Bad(onceMessage,409);
 const sameName=n=>String(n||'').trim().replace(/\s+/g,' ').toLowerCase();
 if(existing.some(r=>sameName(json(r.profile,{}).name)===sameName(profile.name)))throw new Bad(`You already have a system named ${profile.name}. Open it from Your systems, or choose another name.`,409);
 if(existing.length>=LIMITS.systems)throw new Bad(`You can keep up to ${LIMITS.systems} systems. Delete one to register another.`,409);
 const id=crypto.randomUUID(),now=nowIso();
 try{
  await env.DB.batch([
   env.DB.prepare('INSERT INTO auth_systems (id,account_id,profile,current_decision,created_at,updated_at,registration_key) VALUES (?,?,?,NULL,?,?,?)').bind(id,accountId,JSON.stringify(profile),now,now,key),
   ...template.controls.map(c=>env.DB.prepare('INSERT INTO auth_controls (system_id,control_id,updated_at) VALUES (?,?,?)').bind(id,c,now)),
   log(env,id,'System','Registered the system',profile.name,`Started from: ${template.label}.`),
  ]);
 }catch(error){if(key&&/UNIQUE/i.test(String(error?.message)))throw new Bad(onceMessage,409);throw error;}
 return id;
}

// --- Controls (the control approval chain) ---------------------------------------------------------
async function getControl(env,systemId,controlId){
 const row=await env.DB.prepare('SELECT * FROM auth_controls WHERE system_id=? AND control_id=?').bind(systemId,controlId).first();
 if(!row)throw new Bad('That control is not in this system’s scope.',404);
 return controlRow(row);
}
async function updateControl(env,state,controlId,data){
 only(data,['implementationStatus','provider','narrative','responsible','frequency']);
 const c=await getControl(env,state.system.id,controlId);const next={...c};
 if('implementationStatus' in data)next.implementationStatus=oneOf(data.implementationStatus,IMPLEMENTATION,'implementation status');
 if('provider' in data){next.provider=data.provider?data.provider:null;if(next.provider&&!providerById(next.provider))throw new Bad('Choose a listed provider.');}
 if(next.provider&&!providerById(next.provider)?.offers(controlId))throw new Bad(`${providerById(next.provider).name} does not provide ${controlId}.`);
 if(!['inherited','hybrid'].includes(next.implementationStatus))next.provider=null;
 if('narrative' in data)next.narrative=str(data.narrative,8000,'Implementation statement');
 if('responsible' in data)next.responsible=str(data.responsible,160,'Responsible role');
 if('frequency' in data)next.frequency=oneOf(data.frequency,FREQUENCIES,'assessment frequency');
 // Changing what was submitted sends the control back through the chain (the assessor's results stay as notes).
 const changed=['implementationStatus','provider','narrative','responsible'].some(k=>next[k]!==c[k]);
 const reopened=changed&&['submitted','assessed'].includes(c.step);
 const step=reopened?'draft':c.step;
 await env.DB.batch([
  env.DB.prepare('UPDATE auth_controls SET implementation_status=?,provider=?,narrative=?,responsible=?,frequency=?,step=?,updated_at=? WHERE system_id=? AND control_id=?').bind(next.implementationStatus,next.provider,next.narrative,next.responsible,next.frequency,step,nowIso(),state.system.id,controlId),
  ...(reopened?[log(env,state.system.id,ISSO,'Changed a submitted control',controlId,'The control returned to In progress. Submit it again for assessment.')]:[]),
  touch(env,state.system.id),
 ]);
}
async function submitControl(env,state,controlId){
 const c=state.controls.find(x=>x.controlId===controlId);if(!c)throw new Bad('That control is not in this system’s scope.',404);
 if(!['draft','returned'].includes(c.step))throw new Bad('This control is already with the assessor.',409);
 const problems=submitProblems(state,c);if(problems.length)throw new Bad(problems.join(' '),422);
 // Fully inherited controls are assessed by their provider, so they complete the chain on submission.
 const inherited=c.implementationStatus==='inherited';
 await env.DB.batch([
  env.DB.prepare('UPDATE auth_controls SET step=?,return_comment=NULL,last_assessed_at=CASE WHEN ? THEN ? ELSE last_assessed_at END,updated_at=? WHERE system_id=? AND control_id=?').bind(inherited?'assessed':'submitted',inherited?1:0,nowIso(),nowIso(),state.system.id,controlId),
  log(env,state.system.id,ISSO,inherited?'Recorded an inherited control':'Submitted a control for assessment',controlId,inherited?`Inherited from ${providerById(c.provider).name}.`:IMPLEMENTATION[c.implementationStatus]),
  touch(env,state.system.id),
 ]);
}
async function saveResults(env,state,controlId,data){
 only(data,['results','assessorNotes']);
 const c=state.controls.find(x=>x.controlId===controlId);if(!c)throw new Bad('That control is not in this system’s scope.',404);
 if(!['submitted','assessed'].includes(c.step))throw new Bad('The ISSO has to submit this control before it can be assessed.',409);
 if(c.implementationStatus==='inherited')throw new Bad('Inherited controls are assessed by their provider.',409);
 const valid=new Set(objectivesFor(controlId));const results={};
 if(data.results!=null){
  if(typeof data.results!=='object'||Array.isArray(data.results))throw new Bad('Check the assessment results.');
  for(const [id,r] of Object.entries(data.results)){
   if(!valid.has(id))throw new Bad(`${id.slice(0,30)} is not an assessment objective of ${controlId}.`);
   if(!r||typeof r!=='object')throw new Bad('Check the assessment results.');only(r,['result','note']);
   if(!r.result&&!r.note)continue;
   results[id]={result:r.result?oneOf(r.result,RESULTS,'result'):null,note:str(r.note,2000,'Observation')};
  }
 }
 const notes=str(data.assessorNotes,6000,'Assessment notes');
 const reopened=c.step==='assessed';
 await env.DB.batch([
  env.DB.prepare('UPDATE auth_controls SET results=?,assessor_notes=?,step=?,updated_at=? WHERE system_id=? AND control_id=?').bind(JSON.stringify(results),notes,'submitted',nowIso(),state.system.id,controlId),
  ...(reopened?[log(env,state.system.id,ASSESSOR,'Reopened an assessed control',controlId,'Results changed. Validate the control again.')]:[]),
  touch(env,state.system.id),
 ]);
}
async function validateControl(env,state,controlId){
 const c=state.controls.find(x=>x.controlId===controlId);if(!c)throw new Bad('That control is not in this system’s scope.',404);
 if(c.step!=='submitted')throw new Bad('Only a control that is with the assessor can be validated.',409);
 const problems=validateProblems(c);if(problems.length)throw new Bad(problems.join(' '),422);
 const result=compliance({...c,step:'assessed'});
 await env.DB.batch([
  env.DB.prepare('UPDATE auth_controls SET step=?,last_assessed_at=?,reassess_reason=NULL,updated_at=? WHERE system_id=? AND control_id=?').bind('assessed',nowIso(),nowIso(),state.system.id,controlId),
  log(env,state.system.id,ASSESSOR,'Validated a control',controlId,{compliant:'Compliant',non_compliant:'Non-compliant: open a POA&M item for each weakness.',not_applicable:'Not applicable'}[result]||result),
  touch(env,state.system.id),
 ]);
}
async function returnControl(env,state,controlId,data){
 only(data,['comment']);
 const c=state.controls.find(x=>x.controlId===controlId);if(!c)throw new Bad('That control is not in this system’s scope.',404);
 if(!['submitted','assessed'].includes(c.step))throw new Bad('Only a control that is with the assessor can be returned.',409);
 const comment=str(data.comment,2000,'Comment');if(comment.length<10)throw new Bad('Tell the ISSO what needs to change.');
 await env.DB.batch([
  env.DB.prepare('UPDATE auth_controls SET step=?,return_comment=?,updated_at=? WHERE system_id=? AND control_id=?').bind('returned',comment,nowIso(),state.system.id,controlId),
  log(env,state.system.id,ASSESSOR,'Returned a control for rework',controlId,comment),touch(env,state.system.id),
 ]);
}

// --- Body of Evidence --------------------------------------------------------------------------------
function cleanArtifact(data,current={}){
 only(data,['title','kind','packageRole','description','content','location','version','artifactDate','controls']);
 const a={...current};
 if('title' in data||!current.title){a.title=str(data.title,160,'Title');if(!a.title)throw new Bad('Give the evidence a title.');}
 if('kind' in data||!current.kind)a.kind=oneOf(data.kind,ARTIFACT_KINDS,'evidence type');
 if('packageRole' in data)a.packageRole=oneOf(data.packageRole||'none',PACKAGE_ROLES,'package role');else a.packageRole??='none';
 if('description' in data)a.description=str(data.description,4000,'Description');
 if('content' in data)a.content=str(data.content,20000,'Excerpt');
 if('location' in data)a.location=str(data.location,400,'Where the full record is kept');
 if('version' in data)a.version=str(data.version,20,'Version')||'1.0';
 if('artifactDate' in data)a.artifactDate=date(data.artifactDate,'Evidence date');
 if('controls' in data)a.controls=controlIds(data.controls);
 a.controls??=[];a.description??='';a.content??='';a.location??='';a.version??='1.0';a.artifactDate??=null;
 return a;
}
const artifactBinds=a=>[a.title,a.kind,a.packageRole,a.description,a.content,a.location,a.version,a.artifactDate,JSON.stringify(a.controls)];
async function getArtifact(env,systemId,id){
 const row=await env.DB.prepare('SELECT * FROM auth_artifacts WHERE id=? AND system_id=?').bind(id,systemId).first();
 if(!row)throw new Bad('Evidence not found.',404);return artifactRow(row);
}

// --- POA&M ---------------------------------------------------------------------------------------------
function cleanPoam(data,current={},scope=[]){
 only(data,['controlId','weakness','source','severity','residualRisk','mitigations','resources','poc','scheduledCompletion','milestones','status','comments']);
 const p={...current};
 if('controlId' in data){p.controlId=data.controlId||null;if(p.controlId&&!scope.includes(p.controlId))throw new Bad('Choose a control that is in this system’s scope.');}
 if('weakness' in data)p.weakness=str(data.weakness,4000,'Weakness');
 if('source' in data)p.source=oneOf(data.source,POAM_SOURCES,'source');
 if('severity' in data)p.severity=oneOf(data.severity,SEVERITY,'severity');
 if('residualRisk' in data)p.residualRisk=oneOf(data.residualRisk,RISK,'residual risk');
 for(const [k,max,label] of [['mitigations',4000,'Mitigations'],['resources',1000,'Resources'],['poc',160,'Point of contact'],['comments',4000,'Comments']])if(k in data)p[k]=str(data[k],max,label);
 if('scheduledCompletion' in data)p.scheduledCompletion=date(data.scheduledCompletion,'Scheduled completion');
 if('milestones' in data){
  if(!Array.isArray(data.milestones)||data.milestones.length>20)throw new Bad('Add at most 20 milestones.');
  p.milestones=data.milestones.map(m=>{if(!m||typeof m!=='object')throw new Bad('Check the milestones.');only(m,['text','due','done']);
   const text=str(m.text,500,'Milestone');if(!text)throw new Bad('Describe each milestone.');
   return {text,due:date(m.due,'Milestone date'),done:m.done===true};});
 }
 if('status' in data){p.status=oneOf(data.status,POAM_STATUS,'status');if(p.status==='risk_accepted'&&current.status!=='risk_accepted')throw new Bad('Only the Authorizing Official can accept risk. Request acceptance; the AO decides when you submit the package.');}
 p.controlId??=null;p.weakness??='';p.source??='assessment';p.severity??='CAT II';p.residualRisk??='moderate';p.mitigations??='';p.resources??='';p.poc??='';p.scheduledCompletion??=null;p.milestones??=[];p.status??='ongoing';p.comments??='';
 return p;
}
const poamBinds=p=>[p.controlId,p.weakness,p.source,p.severity,p.residualRisk,p.mitigations,p.resources,p.poc,p.scheduledCompletion,JSON.stringify(p.milestones),p.status,p.comments];

// --- Package and decision ------------------------------------------------------------------------------
async function savePackage(env,state,data){
 only(data,['type','executiveSummary','assessorSummary']);
 const current=state.package;const now=nowIso();
 const type=data.type!=null?oneOf(data.type,PACKAGE_TYPES,'package type'):current?.type||(state.system.authorization?.decision&&state.system.authorization.decision!=='dato'?'reauthorization':'assess_authorize');
 const exec=data.executiveSummary!=null?str(data.executiveSummary,8000,'Executive summary'):current?.executiveSummary||'';
 const sar=data.assessorSummary!=null?str(data.assessorSummary,8000,'Assessment summary'):current?.assessorSummary||'';
 if(current){
  await env.DB.batch([env.DB.prepare('UPDATE auth_packages SET type=?,executive_summary=?,assessor_summary=?,updated_at=? WHERE id=?').bind(type,exec,sar,now,current.id),touch(env,state.system.id)]);
 }else{
  // A new package carries the last summaries forward so a reauthorization starts from the previous text.
  const last=state.packages[0];
  await env.DB.batch([
   env.DB.prepare('INSERT INTO auth_packages (id,system_id,type,stage,executive_summary,assessor_summary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),state.system.id,type,'draft',data.executiveSummary!=null?exec:last?.executiveSummary||'',data.assessorSummary!=null?sar:last?.assessorSummary||'',now,now),
   log(env,state.system.id,'ISSM (you)','Started an authorization package','',PACKAGE_TYPES[type]),touch(env,state.system.id),
  ]);
 }
}
async function submitPackage(env,state){
 if(!state.package)throw new Bad('Start the package first.',409);
 const pkg=state.package,now=Date.now(),iso=nowIso();
 const outcome=runPackage(state,now);
 const statements=[log(env,state.system.id,'ISSM (you)','Submitted the package',PACKAGE_TYPES[pkg.type])];
 const review={at:iso,stage:outcome.stage,issm:outcome.issm,sca:outcome.sca};
 if(!outcome.passed){
  const failed=(outcome.stage==='issm'?outcome.issm:outcome.sca).filter(c=>!c.ok);
  statements.push(
   env.DB.prepare('UPDATE auth_packages SET stage=?,review=?,submitted_at=?,updated_at=? WHERE id=?').bind('returned',JSON.stringify(review),iso,iso,pkg.id),
   ...(outcome.stage==='sca'?[log(env,state.system.id,ISSM_REVIEW,'Passed the package to the assessor','','The package is complete.')]:[]),
   log(env,state.system.id,outcome.stage==='issm'?ISSM_REVIEW:SCA_REVIEW,'Returned the package for rework','',failed.map(c=>`${c.label}: ${c.detail}`).join(' | ')),
  );
  await env.DB.batch([...statements,touch(env,state.system.id)]);
  return;
 }
 const d=outcome.decision;
 const decision={...d,decisionLabel:DECISIONS[d.decision],decidedAt:iso,packageId:pkg.id,packageType:pkg.type,termDays:TERMS[d.decision]||null};
 const snapshot={controls:state.controls.map(c=>({controlId:c.controlId,implementationStatus:c.implementationStatus,compliance:compliance(c)})),
  poam:state.poam.map(p=>({number:p.number,controlId:p.controlId,severity:p.severity,status:p.status})),artifacts:state.artifacts.filter(a=>a.reviewState==='accepted').length};
 for(const r of d.riskDecisions){
  statements.push(env.DB.prepare("UPDATE auth_poam SET status=?,comments=CASE WHEN comments='' THEN ? ELSE comments||char(10)||? END,updated_at=? WHERE id=? AND system_id=?").bind(r.accepted?'risk_accepted':'ongoing',`AO: ${r.reason}`,`AO: ${r.reason}`,iso,r.id,state.system.id));
  statements.push(log(env,state.system.id,AO,r.accepted?'Accepted a risk':'Declined a risk acceptance request',`POA&M #${r.number}`,r.reason));
 }
 const authorization={decision:d.decision,decidedAt:iso,terminationDate:d.terminationDate,conditions:d.conditions,reasons:d.reasons,packageId:pkg.id,packageType:pkg.type};
 statements.push(
  log(env,state.system.id,ISSM_REVIEW,'Passed the package to the assessor','','The package is complete.'),
  log(env,state.system.id,SCA_REVIEW,'Recommended the package to the AO','',`Open weaknesses: ${state.poam.filter(openPoam).length}.`),
  env.DB.prepare('UPDATE auth_packages SET stage=?,review=?,decision=?,snapshot=?,submitted_at=COALESCE(submitted_at,?),decided_at=?,updated_at=? WHERE id=?').bind('decided',JSON.stringify(review),JSON.stringify(decision),JSON.stringify(snapshot),iso,iso,iso,pkg.id),
  env.DB.prepare('UPDATE auth_systems SET current_decision=?,updated_at=? WHERE id=?').bind(JSON.stringify(authorization),iso,state.system.id),
  log(env,state.system.id,AO,'Made the authorization decision',DECISIONS[d.decision],[...d.reasons,d.terminationDate?`Terminates ${d.terminationDate}.`:''].filter(Boolean).join(' ')),
 );
 await env.DB.batch(statements);
}

// --- Router ----------------------------------------------------------------------------------------------
export async function authorizationApi(request,env){
 const url=new URL(request.url),parts=url.pathname.replace(/\/$/,'').split('/').slice(3).map(s=>{try{return decodeURIComponent(s)}catch{return '\u0000'}});
 const method=request.method;
 let reader;try{reader=await getReader(request,env)}catch{return reply({error:'The workspace is unavailable. Please try again.'},503)}
 if(!reader){
  if(method==='GET'&&!parts.length)return reply({user:null,systems:[]});
  if(method==='GET'&&parts.length===1&&parts[0]==='progress')return reply({user:null,system:null,steps:[]});
  return reply({error:'Sign in to use the ATO Package Builder.'},401);
 }
 if(!env.DB)return reply({error:'The workspace is unavailable. Please try again.'},503);
 if(method!=='GET'&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return reply({error:'This request could not be verified. Reload the page and try again.'},403);
 const accountId=reader.id;
 try{
  if(!parts.length){
   if(method!=='GET')throw new Bad('Method not allowed.',405);
   const rows=await env.DB.prepare('SELECT s.*,(SELECT count(*) FROM auth_controls c WHERE c.system_id=s.id) AS controls,(SELECT count(*) FROM auth_poam p WHERE p.system_id=s.id AND p.status IN (\'ongoing\',\'risk_acceptance_requested\')) AS open_poam FROM auth_systems s WHERE s.account_id=? ORDER BY s.created_at').bind(accountId).all();
   return reply({user:{email:reader.email},limit:LIMITS.systems,systems:rows.results.map(r=>({...systemRow(r),controls:r.controls,openPoam:r.open_poam}))});
  }
  // Course 2.1 "RMF to ATO" (public/grc-rmf-training/rmf/app.js) and My Progress show where the learner's Secure By Design
  // enclave stands on each RMF step, from the same phases() checks the workspace uses.
  if(parts[0]==='progress'&&parts.length===1){
   if(method!=='GET')throw new Bad('Method not allowed.',405);
   const row=await env.DB.prepare("SELECT * FROM auth_systems WHERE account_id=? AND registration_key='sbd-enclave'").bind(accountId).first();
   if(!row)return reply({user:{email:reader.email},system:null,steps:[]});
   const system=systemRow(row),state=await loadState(env,system);
   return reply({user:{email:reader.email},system:{id:system.id,name:system.profile.name,acronym:system.profile.acronym},steps:phases(state)});
  }
  if(parts[0]!=='systems')throw new Bad('Not found.',404);
  if(parts.length===1){
   if(method!=='POST')throw new Bad('Method not allowed.',405);
   const id=await createSystem(env,accountId,await readBody(request));
   return reply(await loadState(env,await ownSystem(env,accountId,id)),201);
  }
  const system=await ownSystem(env,accountId,parts[1]);
  const sid=system.id,[,,section,itemId,action]=parts;
  const state=()=>loadState(env,system);
  const done=async(status=200)=>reply(await loadState(env,await ownSystem(env,accountId,sid)),status);
  if(!section){
   if(method==='GET')return reply(await state());
   if(method==='PATCH'){
    const profile=cleanProfile(await readBody(request),system.profile);
    await env.DB.batch([env.DB.prepare('UPDATE auth_systems SET profile=?,updated_at=? WHERE id=?').bind(JSON.stringify(profile),nowIso(),sid)]);
    return done();
   }
   if(method==='DELETE'){
    await env.DB.batch(['auth_history','auth_packages','auth_poam','auth_artifacts','auth_controls'].map(t=>env.DB.prepare(`DELETE FROM ${t} WHERE system_id=?`).bind(sid)).concat(env.DB.prepare('DELETE FROM auth_systems WHERE id=? AND account_id=?').bind(sid,accountId)));
    return reply({deleted:true});
   }
   throw new Bad('Method not allowed.',405);
  }
  if(section==='controls'){
   if(!itemId){
    if(method!=='POST')throw new Bad('Method not allowed.',405);
    const data=await readBody(request);only(data,['ids']);
    const s=await state(),have=new Set(s.controls.map(c=>c.controlId));
    const add=controlIds(data.ids).filter(id=>!have.has(id));
    if(!add.length)throw new Bad('Those controls are already in scope.',409);
    if(have.size+add.length>LIMITS.controls)throw new Bad(`A system can have up to ${LIMITS.controls} controls in this workspace.`,409);
    const now=nowIso();
    await env.DB.batch([...add.map(id=>env.DB.prepare('INSERT INTO auth_controls (system_id,control_id,updated_at) VALUES (?,?,?)').bind(sid,id,now)),log(env,sid,ISSO,'Added controls to scope','',add.join(', ')),touch(env,sid)]);
    return done(201);
   }
   if(!isControl(itemId))throw new Bad('That control is not in this system’s scope.',404);
   if(!action){
    if(method==='PATCH'){await updateControl(env,await state(),itemId,await readBody(request));return done();}
    if(method==='DELETE'){
     await getControl(env,sid,itemId);
     await env.DB.batch([env.DB.prepare('DELETE FROM auth_controls WHERE system_id=? AND control_id=?').bind(sid,itemId),log(env,sid,ISSO,'Removed a control from scope',itemId),touch(env,sid)]);
     return done();
    }
    throw new Bad('Method not allowed.',405);
   }
   if(action==='results'&&method==='PUT'){await saveResults(env,await state(),itemId,await readBody(request));return done();}
   if(method!=='POST')throw new Bad('Method not allowed.',405);
   if(action==='submit'){await submitControl(env,await state(),itemId);return done();}
   if(action==='validate'){await validateControl(env,await state(),itemId);return done();}
   if(action==='return'){await returnControl(env,await state(),itemId,await readBody(request));return done();}
   throw new Bad('Not found.',404);
  }
  if(section==='providers'&&action==='renew'&&method==='POST'){
   const provider=providerById(itemId);if(!provider)throw new Bad('Provider not found.',404);
   const through=new Date(Date.now()+365*86400000).toISOString().slice(0,10);
   const profile={...system.profile,providerRenewals:{...(system.profile.providerRenewals||{}),[provider.id]:through}};
   await env.DB.batch([env.DB.prepare('UPDATE auth_systems SET profile=?,updated_at=? WHERE id=?').bind(JSON.stringify(profile),nowIso(),sid),log(env,sid,ISSO,'Received current provider assurance',provider.name,`The provider supplied a current assurance letter, valid through ${through}. Keep a copy in the Body of Evidence.`)]);
   return done();
  }
  if(section==='artifacts'){
   if(!itemId){
    if(method!=='POST')throw new Bad('Method not allowed.',405);
    const a=cleanArtifact(await readBody(request));
    const s=await state();if(s.artifacts.length>=LIMITS.artifacts)throw new Bad(`A system can hold up to ${LIMITS.artifacts} pieces of evidence here.`,409);
    const scope=new Set(s.controls.map(c=>c.controlId));const outside=a.controls.filter(id=>!scope.has(id));if(outside.length)throw new Bad(`${outside.join(', ')} ${outside.length===1?'is':'are'} not in this system’s scope.`);
    const id=crypto.randomUUID(),now=nowIso();
    await env.DB.batch([env.DB.prepare('INSERT INTO auth_artifacts (id,system_id,title,kind,package_role,description,content,location,version,artifact_date,controls,review_state,review_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,\'draft\',\'\',?,?)').bind(id,sid,...artifactBinds(a),now,now),log(env,sid,ISSO,'Added evidence',a.title,a.controls.join(', ')),touch(env,sid)]);
    return done(201);
   }
   const current=await getArtifact(env,sid,itemId);
   if(!action){
    if(method==='PATCH'){
     const a=cleanArtifact(await readBody(request),current);
     const scope=new Set((await state()).controls.map(c=>c.controlId));const outside=a.controls.filter(id=>!scope.has(id)&&!current.controls.includes(id));if(outside.length)throw new Bad(`${outside.join(', ')} ${outside.length===1?'is':'are'} not in this system’s scope.`);
     const changed=['title','kind','packageRole','description','content','location','version','artifactDate'].some(k=>a[k]!==current[k]);
     const reopen=changed&&['submitted','accepted'].includes(current.reviewState);
     await env.DB.batch([env.DB.prepare('UPDATE auth_artifacts SET title=?,kind=?,package_role=?,description=?,content=?,location=?,version=?,artifact_date=?,controls=?,review_state=?,updated_at=? WHERE id=?').bind(...artifactBinds(a),reopen?'draft':current.reviewState,nowIso(),itemId),...(reopen?[log(env,sid,ISSO,'Changed reviewed evidence',a.title,'It returned to Draft. Submit it for review again.')]:[]),touch(env,sid)]);
     return done();
    }
    if(method==='DELETE'){await env.DB.batch([env.DB.prepare('DELETE FROM auth_artifacts WHERE id=?').bind(itemId),log(env,sid,ISSO,'Removed evidence',current.title),touch(env,sid)]);return done();}
    throw new Bad('Method not allowed.',405);
   }
   if(method!=='POST')throw new Bad('Method not allowed.',405);
   if(action==='submit'){
    if(!['draft','rejected'].includes(current.reviewState))throw new Bad('This evidence is already submitted.',409);
    if(current.description.length<20)throw new Bad('Describe what this evidence shows and how it was produced before submitting it.',422);
    if(!current.content&&!current.location)throw new Bad('Add an excerpt or say where the full record is kept.',422);
    if(!current.artifactDate)throw new Bad('Date the evidence: when was it produced or collected?',422);
    if(!current.controls.length&&current.packageRole==='none')throw new Bad('Link the evidence to the controls it supports, or mark it as a package document.',422);
    await env.DB.batch([env.DB.prepare("UPDATE auth_artifacts SET review_state='submitted',updated_at=? WHERE id=?").bind(nowIso(),itemId),log(env,sid,ISSO,'Submitted evidence for review',current.title),touch(env,sid)]);
    return done();
   }
   if(action==='review'){
    const data=await readBody(request);only(data,['decision','note']);
    if(current.reviewState!=='submitted')throw new Bad('Only submitted evidence can be reviewed.',409);
    const decision=oneOf(data.decision,{accept:1,reject:1},'review decision'),note=str(data.note,2000,'Review note');
    if(decision==='reject'&&note.length<10)throw new Bad('Say why the evidence was rejected.');
    await env.DB.batch([env.DB.prepare('UPDATE auth_artifacts SET review_state=?,review_note=?,updated_at=? WHERE id=?').bind(decision==='accept'?'accepted':'rejected',note,nowIso(),itemId),log(env,sid,ASSESSOR,decision==='accept'?'Accepted evidence':'Rejected evidence',current.title,note),touch(env,sid)]);
    return done();
   }
   throw new Bad('Not found.',404);
  }
  if(section==='poam'){
   const s=await state(),scope=s.controls.map(c=>c.controlId);
   if(!itemId){
    if(method!=='POST')throw new Bad('Method not allowed.',405);
    const p=cleanPoam(await readBody(request),{},scope);
    if(s.poam.length>=LIMITS.poam)throw new Bad(`A system can hold up to ${LIMITS.poam} POA&M items here.`,409);
    const number=(s.poam.reduce((m,x)=>Math.max(m,x.number),0))+1,now=nowIso();
    await env.DB.batch([env.DB.prepare('INSERT INTO auth_poam (id,system_id,number,control_id,weakness,source,severity,residual_risk,mitigations,resources,poc,scheduled_completion,milestones,status,comments,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),sid,number,...poamBinds(p),now,now),log(env,sid,ISSO,'Opened a POA&M item',`#${number}${p.controlId?' · '+p.controlId:''}`,`${p.severity}: ${p.weakness.slice(0,200)}`),touch(env,sid)]);
    return done(201);
   }
   const current=s.poam.find(p=>p.id===itemId);if(!current)throw new Bad('POA&M item not found.',404);
   if(method==='PATCH'){
    const p=cleanPoam(await readBody(request),current,scope);
    const completed=p.status==='completed'&&current.status!=='completed';
    await env.DB.batch([env.DB.prepare('UPDATE auth_poam SET control_id=?,weakness=?,source=?,severity=?,residual_risk=?,mitigations=?,resources=?,poc=?,scheduled_completion=?,milestones=?,status=?,comments=?,completed_at=?,updated_at=? WHERE id=?').bind(...poamBinds(p),p.status==='completed'?(current.completedAt||nowIso()):null,nowIso(),itemId),
     ...(p.status!==current.status?[log(env,sid,ISSO,completed?'Completed a POA&M item':'Changed a POA&M item’s status',`#${current.number}`,POAM_STATUS[p.status])]:[]),touch(env,sid)]);
    return done();
   }
   if(method==='DELETE'){
    if(current.status!=='ongoing')throw new Bad('Keep completed and risk-accepted items: they are part of the record.',409);
    await env.DB.batch([env.DB.prepare('DELETE FROM auth_poam WHERE id=?').bind(itemId),log(env,sid,ISSO,'Deleted a POA&M item',`#${current.number}`),touch(env,sid)]);
    return done();
   }
   throw new Bad('Method not allowed.',405);
  }
  if(section==='package'){
   if(!itemId&&method==='PUT'){await savePackage(env,await state(),await readBody(request));return done();}
   if(itemId==='submit'&&method==='POST'){await submitPackage(env,await state());return done();}
   throw new Bad('Not found.',404);
  }
  if(section==='changes'&&!itemId&&method==='POST'){
   const data=await readBody(request);only(data,['description','controls']);
   const description=str(data.description,2000,'Change description');if(description.length<15)throw new Bad('Describe the change.');
   const ids=controlIds(data.controls||[]);const s=await state();const scope=new Set(s.controls.map(c=>c.controlId));
   const outside=ids.filter(id=>!scope.has(id));if(outside.length)throw new Bad(`${outside.join(', ')} ${outside.length===1?'is':'are'} not in scope.`);
   const reason=`Change on ${nowIso().slice(0,10)}: ${description.slice(0,300)}`;
   await env.DB.batch([...ids.map(id=>env.DB.prepare("UPDATE auth_controls SET reassess_reason=?,step=CASE WHEN step='assessed' AND implementation_status<>'inherited' THEN 'submitted' ELSE step END,updated_at=? WHERE system_id=? AND control_id=?").bind(reason,nowIso(),sid,id)),log(env,sid,ISSO,'Recorded a change','',`${description}${ids.length?` · Affects ${ids.join(', ')}`:''}`),touch(env,sid)]);
   return done(201);
  }
  if(section==='annual-review'&&!itemId&&method==='POST'){
   const data=await readBody(request);only(data,['notes']);
   const notes=str(data.notes,4000,'Review notes');if(notes.length<20)throw new Bad('Summarize what the review covered and found.');
   if(!system.authorization?.decision||system.authorization.decision==='dato')throw new Bad('The annual review starts after the system is authorized.',409);
   const profile={...system.profile,lastAnnualReview:nowIso()};
   await env.DB.batch([env.DB.prepare('UPDATE auth_systems SET profile=?,updated_at=? WHERE id=?').bind(JSON.stringify(profile),nowIso(),sid),log(env,sid,'ISSM (you)','Completed the annual security review','',notes)]);
   return done();
  }
  throw new Bad('Not found.',404);
 }catch(error){
  if(error instanceof Bad)return reply({error:error.message},error.status);
  console.error('Authorization workspace failed',error);
  return reply({error:'That could not be saved. Please try again.'},503);
 }
}
export const authorizationLimits=LIMITS;
