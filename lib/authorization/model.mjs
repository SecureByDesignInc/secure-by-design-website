// ATO Package Builder: the shared vocabulary and review rules.
//
// The workspace models how authorization teams manage an Authorization to
// Operate: a system record, selected controls with implementation and assessment results, a Body of
// Evidence linked to those controls, a Plan of Action and Milestones (POA&M), approval chains for each
// control and for the package, and the decision with its termination date and continuous monitoring.
// It is an original Secure By Design teaching tool, not a copy of either product.
//
// The same rules run on the server (the authoritative review and decision) and in the browser (the
// readiness checks a learner sees before submitting), so the two can never disagree.
import index from '../../content/authorization/control-index.json' with {type:'json'};

export const catalogSource=index.source;
export const families=index.families;
export const controlIndex=index.controls; // id -> [title, family, baselines, objective ids]
export const isControl=id=>Object.prototype.hasOwnProperty.call(controlIndex,id);
export const objectivesFor=id=>isControl(id)?controlIndex[id][3]:[];
export const controlTitle=id=>isControl(id)?controlIndex[id][0]:id;

export const IMPLEMENTATION={planned:'Planned',implemented:'Implemented',inherited:'Inherited',hybrid:'Hybrid (shared)',not_applicable:'Not applicable'};
export const RESULTS={satisfied:'Satisfied',other_than_satisfied:'Other than satisfied',not_applicable:'Not applicable'};
export const CONTROL_STEPS={draft:'In progress',submitted:'With the assessor',returned:'Returned for rework',assessed:'Assessed'};
export const COMPLIANCE={not_assessed:'Not assessed',compliant:'Compliant',non_compliant:'Non-compliant',not_applicable:'Not applicable',inherited:'Inherited'};
export const SEVERITY={'CAT I':'CAT I · High','CAT II':'CAT II · Medium','CAT III':'CAT III · Low'};
export const RISK={very_low:'Very low',low:'Low',moderate:'Moderate',high:'High',very_high:'Very high'};
export const RISK_ORDER=['very_low','low','moderate','high','very_high'];
export const POAM_STATUS={ongoing:'Ongoing',risk_acceptance_requested:'Risk acceptance requested',risk_accepted:'Risk accepted',completed:'Completed'};
export const POAM_SOURCES={assessment:'Control assessment',scan:'Vulnerability scan',stig:'STIG / SCAP check',review:'Audit or log review',other:'Other'};
export const ARTIFACT_KINDS={policy:'Policy',procedure:'Procedure',plan:'Plan',diagram:'Diagram',inventory:'Inventory',configuration:'Configuration export',scan:'Scan or checklist result',log:'Log or record sample',report:'Report',interview:'Interview or observation record',other:'Other'};
export const ARTIFACT_STATES={draft:'Draft',submitted:'Awaiting review',accepted:'Accepted',rejected:'Rejected'};
export const PACKAGE_ROLES={none:'Supporting evidence',boundary_diagram:'Authorization boundary diagram',inventory:'Hardware and software inventory',pps:'Ports, protocols, and services',data_flow:'Data flow diagram'};
export const REQUIRED_PACKAGE_ROLES=['boundary_diagram','inventory','pps'];
export const PACKAGE_TYPES={assess_authorize:'Assess and authorize',reauthorization:'Reauthorization',iatt:'Interim authorization to test'};
export const PACKAGE_STAGES={draft:'Being prepared',returned:'Returned for rework',decided:'Decision made'};
export const DECISIONS={ato:'Authorization to Operate',ato_conditions:'Authorization to Operate with conditions',iatt:'Interim Authorization to Test',dato:'Denial of Authorization to Operate'};
export const DECISION_SHORT={ato:'ATO',ato_conditions:'ATO with conditions',iatt:'IATT',dato:'DATO',expired:'Expired',none:'Not yet authorized'};
// Practice terms for this exercise. A real Authorizing Official and governing authority set the term.
export const TERMS={ato:1095,ato_conditions:365,iatt:90};
export const FREQUENCIES={monthly:['Monthly',30],quarterly:['Quarterly',91],semiannual:['Every six months',182],annual:['Annually',365],triennial:['Once per authorization (three years)',1095]};
export const SYSTEM_TYPES={enclave:'Enclave',major_application:'Major application',platform_it:'Platform IT',general_support:'General support system'};
export const LEVELS={low:'Low',moderate:'Moderate',high:'High'};
export const LEVEL_ORDER=['low','moderate','high'];
export const ROLES={owner:'System owner',ao:'Authorizing Official (AO)',issm:'Information System Security Manager (ISSM)',isso:'Information System Security Officer (ISSO)',sca:'Security control assessor (SCA)'};

// The nine controls the RMF course's capstone uses as its practice scope.
export const PRACTICE_CONTROLS=['AC-2','AU-2','AU-3','AU-6','AU-12','CM-6','RA-5','SI-2','CP-9'];

// Common control providers the practice system can inherit from. Each one's assurance (the provider's own
// authorization) is valid for a period counted from the day the learner registers the system; personnel
// security's has already lapsed, so inheriting from it without asking for current assurance gets flagged.
export const PROVIDERS=[
 {id:'sbd-facilities',name:'SBD Facilities & Physical Security',detail:'The building and data-center room that house the enclave: physical access, visitors, power, fire protection, temperature and humidity.',offers:id=>/^PE-/.test(id),validDays:730},
 {id:'sbd-governance',name:'SBD Security Governance Office',detail:'Organization-wide policies and procedures (the -1 controls), security awareness and role-based training, and rules of behavior.',offers:id=>/^[A-Z]{2}-1$/.test(id)||/^AT-[234]$/.test(id)||id==='PL-4',validDays:540},
 {id:'sbd-personnel',name:'SBD Personnel Security',detail:'Screening, access agreements, termination and transfer, and sanctions.',offers:id=>/^PS-[2-9]$/.test(id),validDays:-30},
];
export const providerById=id=>PROVIDERS.find(p=>p.id===id);
const DAY=86400000;
const day=value=>value?Date.parse(value):NaN;
// Whole calendar days (UTC) from today until a YYYY-MM-DD date: 0 on the day itself, negative after it.
export const daysUntil=(date,now=Date.now())=>Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(new Date(now).toISOString().slice(0,10)+'T00:00:00Z'))/DAY);
export function providerValidThrough(system,providerId){
 const provider=providerById(providerId);if(!provider)return null;
 const renewed=system?.profile?.providerRenewals?.[providerId];
 if(renewed)return renewed;
 return new Date(day(system.createdAt)+provider.validDays*DAY).toISOString().slice(0,10);
}
export const providerCurrent=(system,providerId,now=Date.now())=>{const through=providerValidThrough(system,providerId);return !!through&&day(through+'T23:59:59Z')>=now;};

const SBD_BOUNDARY=`Everything inside the air-gapped Secure By Design network shown in the System Hub:
- VLAN 10 Domain controllers (10.0.10.0/24): SBD-DC01, SBD-DC02
- VLAN 20 Identity & services (10.0.20.0/24): SBD-DHCP01, SBD-SYSLOG01, SBD-WSUS01
- VLAN 30 PKI infrastructure (10.0.30.0/24): SBD-SUBCA01, SBD-PKI-MGMT01 (the offline root CA, SBD-ROOTCA01, stays powered off between ceremonies)
- VLAN 40 Servers & data (10.0.40.0/24): SBD-FS01, SBD-SQL01, SBD-APPS01, SBD-WEB01
- VLAN 50 Security & monitoring (10.0.50.0/24): SBD-SPLUNK01, SBD-NESSUS01, SBD-EPO01, SBD-AUDIT01
- VLAN 60 Tiered administration (10.0.60.0/24): AdminJumpBox01, SBD-ADMIN-SRV01, SBD-ADMIN-PC01
- VLAN 70 Management tools (10.0.70.0/24): SBD-MGMT01, SBD-REPO01
- VLAN 80 User workstations (10.0.80.0/24): the client endpoints
- The core router, switch stack, and hypervisor hosts SBD-HV01 to SBD-HV07`;
export const TEMPLATES={
 'sbd-enclave':{label:'Secure By Design enclave',detail:'The network you build in courses 1.1–1.19 and explore in the System Hub. Starts with the capstone’s nine practice controls; you categorize it and do the rest.',profile:{
  name:'Secure By Design Enclave',acronym:'SBD-ENCLAVE',type:'enclave',version:'1.0',
  description:'A small Windows Server and Red Hat Enterprise Linux enclave providing directory, certificate, file, database, application, web, logging, and security-monitoring services to its users. It is the practice system built in the Secure By Design Build the Network courses.',
  boundary:SBD_BOUNDARY,
  interconnections:'None. The network is air-gapped. Every transfer across the boundary is manual and human-controlled, using approved removable media.',
 },controls:PRACTICE_CONTROLS,once:true},
 blank:{label:'Blank system',detail:'Register any system you are studying. You add its description, boundary, and controls yourself.',profile:{name:'',acronym:'',type:'enclave',version:'1.0',description:'',boundary:'',interconnections:''},controls:[]},
};

export const highWater=infoTypes=>{
 const out={};for(const k of ['c','i','a'])out[k]=(infoTypes||[]).reduce((max,t)=>LEVEL_ORDER.indexOf(t[k])>LEVEL_ORDER.indexOf(max)?t[k]:max,null);
 return out;
};
const filled=(text,min=1)=>typeof text==='string'&&text.trim().length>=min;

// A control's compliance follows its implementation status and the assessor's results.
export function compliance(control){
 if(control.implementationStatus==='not_applicable')return control.step==='assessed'?'not_applicable':'not_assessed';
 if(control.implementationStatus==='inherited')return 'inherited';
 if(control.step!=='assessed')return 'not_assessed';
 const results=Object.values(control.results||{}).map(r=>r.result);
 if(control.implementationStatus==='planned'||results.includes('other_than_satisfied'))return 'non_compliant';
 return 'compliant';
}
// What the assessor must record before a control can be marked assessed.
export const needsLocalAssessment=control=>control.implementationStatus!=='inherited';
export function missingResults(control){
 if(!needsLocalAssessment(control))return [];
 if(control.implementationStatus==='not_applicable')return [];
 return objectivesFor(control.controlId).filter(id=>!control.results?.[id]?.result);
}
export const needsEvidence=control=>['implemented','hybrid'].includes(control.implementationStatus);
export const acceptedEvidence=(state,controlId)=>state.artifacts.filter(a=>a.reviewState==='accepted'&&a.controls.includes(controlId));
export const openPoam=item=>['ongoing','risk_acceptance_requested'].includes(item.status);

// Why a control can't go to the assessor yet (the control approval chain's first hop).
export function submitProblems(state,control){
 const problems=[];
 if(control.implementationStatus==='not_applicable'){if(!filled(control.narrative,20))problems.push('Explain why this control does not apply.');return problems;}
 if(['inherited','hybrid'].includes(control.implementationStatus)&&!providerById(control.provider))problems.push('Choose the common control provider.');
 if(control.implementationStatus==='inherited')return problems;
 if(!filled(control.narrative,40))problems.push('Write an implementation statement (at least a few sentences) describing how this system meets the control.');
 if(!filled(control.responsible))problems.push('Name who is responsible for operating this control.');
 if(control.implementationStatus==='planned'){if(!state.poam.some(p=>p.controlId===control.controlId))problems.push('A planned control needs a POA&M item that says when it will be implemented.');}
 else if(!state.artifacts.some(a=>a.controls.includes(control.controlId)&&a.reviewState!=='rejected'))problems.push('Link at least one piece of evidence that shows the control is implemented.');
 return problems;
}
// Why the assessor can't validate yet (the control approval chain's second hop).
export function validateProblems(control){
 const problems=[];const missing=missingResults(control);
 if(missing.length)problems.push(`Record a result for every assessment objective (${missing.length} still open).`);
 for(const [id,r] of Object.entries(control.results||{}))if(r.result==='other_than_satisfied'&&!filled(r.note,10))problems.push(`Describe what you observed for ${id} (other than satisfied).`);
 return problems;
}
export const poamProblems=item=>{
 const problems=[];
 if(!filled(item.weakness,15))problems.push('Describe the weakness.');
 if(!filled(item.poc))problems.push('Name a point of contact.');
 if(!filled(item.resources))problems.push('State the resources required.');
 if(!item.scheduledCompletion)problems.push('Set a scheduled completion date.');
 if(!item.milestones?.length)problems.push('Add at least one milestone with a date.');
 if(item.status==='risk_acceptance_requested'&&!filled(item.mitigations,15))problems.push('Describe the mitigations that support the risk acceptance request.');
 return problems;
};

const check=(id,ok,label,detail,tab,refs=[])=>({id,ok:!!ok,label,detail:ok?'':detail,tab,refs});
// The ISSM's quality review: is the package complete and internally consistent?
export function issmReview(state,now=Date.now()){
 const {system,controls,artifacts,poam}=state,profile=system.profile||{},roles=profile.roles||{},pkg=state.package||{};
 const out=[];
 const missingRoles=Object.keys(ROLES).filter(k=>!filled(roles[k]));
 out.push(check('roles',!missingRoles.length,'Every authorization role is assigned',`Name the ${missingRoles.map(k=>ROLES[k]).join(', ')} on the System tab.`,'system'));
 const same=n=>filled(n)&&[roles.isso,roles.owner].some(o=>filled(o)&&o.trim().toLowerCase()===n.trim().toLowerCase());
 out.push(check('independence',!missingRoles.includes('sca')&&!same(roles.sca),'The assessor is independent','The security control assessor must be someone other than the ISSO or system owner who implement and document the controls (CA-2(1)).','system'));
 out.push(check('description',filled(profile.description,80)&&filled(profile.boundary,80),'The system description and authorization boundary are written','Describe the system and list everything inside its authorization boundary.','system'));
 const hw=highWater(profile.infoTypes),cat=profile.categorization||{};
 const catSet=['c','i','a'].every(k=>LEVELS[cat[k]]);
 const below=['c','i','a'].filter(k=>catSet&&hw[k]&&LEVEL_ORDER.indexOf(cat[k])<LEVEL_ORDER.indexOf(hw[k]));
 out.push(check('categorization',catSet&&(profile.infoTypes||[]).length&&filled(profile.categorizationRationale,40)&&!below.length,'The system is categorized with a rationale',below.length?`The categorization is lower than its information types for ${below.map(k=>({c:'confidentiality',i:'integrity',a:'availability'})[k]).join(', ')}. Raise it to at least the highest impact of any information type, or revisit the information types.`:'Add the information types, choose the confidentiality, integrity and availability impacts, and explain why.','system'));
 out.push(check('selection',controls.length&&filled(profile.selectionRationale,40),'The control selection is justified',controls.length?'Explain how the selected controls were chosen and tailored (Controls tab).':'Select the controls in scope.','controls'));
 const notSubmitted=controls.filter(c=>['draft','returned'].includes(c.step));
 out.push(check('implementation',controls.length&&!notSubmitted.length,'Every control has been submitted to the assessor',`Finish and submit ${notSubmitted.length} control${notSubmitted.length===1?'':'s'}.`,'controls',notSubmitted.map(c=>c.controlId)));
 const noEvidence=controls.filter(c=>needsEvidence(c)&&!acceptedEvidence(state,c.controlId).length);
 out.push(check('evidence',!noEvidence.length,'Every implemented control has accepted evidence',`Link accepted evidence to ${noEvidence.map(c=>c.controlId).join(', ')}.`,'evidence',noEvidence.map(c=>c.controlId)));
 const missingDocs=REQUIRED_PACKAGE_ROLES.filter(role=>!artifacts.some(a=>a.packageRole===role&&a.reviewState==='accepted'));
 out.push(check('documents',!missingDocs.length,'The required package documents are in the Body of Evidence',`Add and accept the ${missingDocs.map(r=>PACKAGE_ROLES[r].toLowerCase()).join('; ')}.`,'evidence'));
 const lapsed=controls.filter(c=>['inherited','hybrid'].includes(c.implementationStatus)&&c.provider&&!providerCurrent(system,c.provider,now));
 out.push(check('inheritance',!lapsed.length,'Inherited controls rely on current provider assurance',`${[...new Set(lapsed.map(c=>providerById(c.provider)?.name))].join(', ')}: the assurance has lapsed. Request current assurance (Controls tab) or implement the controls locally: ${lapsed.map(c=>c.controlId).join(', ')}.`,'controls',lapsed.map(c=>c.controlId)));
 const badPoam=poam.filter(p=>openPoam(p)&&poamProblems(p).length);
 out.push(check('poam',!badPoam.length,'Every open POA&M item is complete',`Complete POA&M item${badPoam.length===1?'':'s'} ${badPoam.map(p=>'#'+p.number).join(', ')}: point of contact, resources, milestones, and a scheduled completion date.`,'poam'));
 out.push(check('summary',filled(pkg.executiveSummary,80),'The executive summary is written','Summarize the mission, the assessed posture, open risk, and what you are asking the AO to decide (Package tab).','package'));
 return out;
}
// The assessor's review: is the assessment complete, and does every weakness have a plan?
export function scaReview(state,now=Date.now()){
 const {controls,artifacts,poam}=state,pkg=state.package||{};
 const out=[];
 const unassessed=controls.filter(c=>c.step!=='assessed');
 out.push(check('assessed',controls.length&&!unassessed.length,'Every control has been assessed',`Assess and validate ${unassessed.map(c=>c.controlId).join(', ')} (Assessment tab).`,'assessment',unassessed.map(c=>c.controlId)));
 const unexplained=controls.filter(c=>['submitted','assessed'].includes(c.step)&&validateProblems(c).length);
 out.push(check('results',!unexplained.length,'Every result is recorded and explained',`Finish the results for ${unexplained.map(c=>c.controlId).join(', ')}.`,'assessment',unexplained.map(c=>c.controlId)));
 const unplanned=controls.filter(c=>compliance(c)==='non_compliant'&&!poam.some(p=>p.controlId===c.controlId&&p.status!=='completed'));
 out.push(check('weaknesses',!unplanned.length,'Every non-compliant control has a POA&M item',`Open a POA&M item for ${unplanned.map(c=>c.controlId).join(', ')}.`,'poam',unplanned.map(c=>c.controlId)));
 const stale=artifacts.filter(a=>a.reviewState==='accepted'&&a.artifactDate&&now-day(a.artifactDate)>365*DAY);
 out.push(check('currency',!stale.length,'The evidence is current',`Replace or re-date evidence older than a year: ${stale.map(a=>a.title).join(', ')}.`,'evidence'));
 out.push(check('sar',filled(pkg.assessorSummary,80),'The assessment summary (SAR) is written','Summarize what was assessed, how, the significant results, and their effect on risk (Package tab).','package'));
 return out;
}
export const riskCounts=state=>{
 const open=state.poam.filter(openPoam);
 return {open:open.length,cat1:open.filter(p=>p.severity==='CAT I').length,cat2:open.filter(p=>p.severity==='CAT II').length,cat3:open.filter(p=>p.severity==='CAT III').length,accepted:state.poam.filter(p=>p.status==='risk_accepted').length,completed:state.poam.filter(p=>p.status==='completed').length};
};
// The Authorizing Official's decision. These are practice rules that model a common pattern; a real AO
// weighs mission need against the organization's risk tolerance, within their own authority.
export function aoDecision(state,now=Date.now()){
 const pkg=state.package||{};const reasons=[],riskDecisions=[];
 for(const item of state.poam.filter(p=>p.status==='risk_acceptance_requested')){
  const residual=RISK_ORDER.indexOf(item.residualRisk||'moderate');
  if(item.severity==='CAT I')riskDecisions.push({id:item.id,number:item.number,accepted:false,reason:'A CAT I weakness has to be corrected or mitigated; the AO will not accept it as is.'});
  else if(!filled(item.mitigations,15))riskDecisions.push({id:item.id,number:item.number,accepted:false,reason:'No mitigations are described, so there is nothing to base the acceptance on.'});
  else if(item.severity==='CAT II'&&residual>RISK_ORDER.indexOf('moderate'))riskDecisions.push({id:item.id,number:item.number,accepted:false,reason:'The residual risk is above moderate. Reduce it further before asking for acceptance.'});
  else riskDecisions.push({id:item.id,number:item.number,accepted:true,reason:`Accepted: ${item.severity} with mitigations and ${RISK[item.residualRisk||'moderate'].toLowerCase()} residual risk.`});
 }
 const accepted=new Set(riskDecisions.filter(r=>r.accepted).map(r=>r.id));
 const open=state.poam.filter(p=>openPoam(p)&&!accepted.has(p.id));
 const cat1=open.filter(p=>p.severity==='CAT I'),veryHigh=open.filter(p=>p.residualRisk==='very_high');
 let decision;
 if(cat1.length){decision='dato';reasons.push(`${cat1.length} open CAT I weakness${cat1.length===1?'':'es'} (${cat1.map(p=>'#'+p.number).join(', ')}). Correct or mitigate them, retest, and resubmit.`);}
 else if(veryHigh.length){decision='dato';reasons.push(`Very high residual risk remains on ${veryHigh.map(p=>'#'+p.number).join(', ')}.`);}
 else if(pkg.type==='iatt'){decision='iatt';reasons.push('Testing only, with no operational data, for the term below.');}
 else if(open.length){decision='ato_conditions';reasons.push(open.length===1?'The open weakness and its POA&M milestones become the condition of this authorization.':`${open.length} open weaknesses with POA&M milestones become the conditions of this authorization.`);}
 else {decision='ato';reasons.push('No open weaknesses remain. The residual risk is accepted.');}
 if(accepted.size)reasons.push(`${accepted.size} risk acceptance request${accepted.size===1?'':'s'} approved.`);
 const term=TERMS[decision];
 const terminationDate=term?new Date(now+term*DAY).toISOString().slice(0,10):null;
 const conditions=decision==='dato'?[]:open.map(p=>`POA&M #${p.number} (${p.controlId||'general'}): ${p.weakness.slice(0,140)} · complete by ${p.scheduledCompletion}`).concat(decision==='iatt'?['Testing only. No operational or production data.']:[]);
 return {decision,terminationDate,reasons,conditions,riskDecisions};
}
// The whole chain, as the server runs it on submission.
export function runPackage(state,now=Date.now()){
 const issm=issmReview(state,now);
 if(issm.some(c=>!c.ok))return {stage:'issm',passed:false,issm,sca:null,decision:null};
 const sca=scaReview(state,now);
 if(sca.some(c=>!c.ok))return {stage:'sca',passed:false,issm,sca,decision:null};
 return {stage:'ao',passed:true,issm,sca,decision:aoDecision(state,now)};
}

// Course 2.1 "RMF to ATO" (public/grc-rmf-training/rmf/catalog-data.js window.RMF_STEPS) groups its modules by these same
// steps. A step is complete when its modules are marked complete (training:rmf-boe-ato:NN) and phases() passes for it.
// tests/video-catalog.test.mjs keeps this map equal to the course.
export const COURSE_STEP_MODULES={prepare:['01','02'],categorize:['03'],select:['04'],implement:['05','06'],assess:['07','08','09'],authorize:['10','11'],monitor:['12']};
// Where the system stands in the RMF lifecycle.
export function phases(state,now=Date.now()){
 const {system,controls,artifacts}=state,p=system.profile||{};
 const authorized=authorizationStatus(system,now);
 const steps=[
  ['prepare','Prepare',Object.keys(ROLES).every(k=>filled(p.roles?.[k]))&&filled(p.description,80)&&filled(p.boundary,80)],
  ['categorize','Categorize',['c','i','a'].every(k=>LEVELS[p.categorization?.[k]]&&LEVEL_ORDER.indexOf(p.categorization[k])>=LEVEL_ORDER.indexOf(highWater(p.infoTypes)[k]))&&(p.infoTypes||[]).length>0&&filled(p.categorizationRationale,40)],
  ['select','Select',controls.length>0&&filled(p.selectionRationale,40)],
  ['implement','Implement',controls.length>0&&controls.every(c=>!['draft','returned'].includes(c.step))&&artifacts.some(a=>a.reviewState==='accepted')],
  ['assess','Assess',controls.length>0&&controls.every(c=>c.step==='assessed')],
  ['authorize','Authorize',['ato','ato_conditions','iatt'].includes(system.authorization?.decision)],
  ['monitor','Monitor',['ato','ato_conditions','iatt'].includes(authorized)],
 ];
 return steps.map(([id,label,done])=>({id,label,done}));
}
export function authorizationStatus(system,now=Date.now()){
 const auth=system.authorization;
 if(!auth?.decision)return 'none';
 if(auth.decision!=='dato'&&auth.terminationDate&&day(auth.terminationDate+'T23:59:59Z')<now)return 'expired';
 return auth.decision;
}
// Continuous monitoring: what needs attention after the decision.
export function monitoring(state,now=Date.now()){
 const {system,controls,artifacts,poam}=state,auth=system.authorization||{};
 const items=[];
 if(auth.terminationDate){
  const days=daysUntil(auth.terminationDate,now);
  if(days<0)items.push({level:'high',text:`The authorization expired ${-days} day${days===-1?'':'s'} ago. Start reauthorization.`,tab:'package'});
  else if(days<=120)items.push({level:'medium',text:`The authorization terminates in ${days} day${days===1?'':'s'} (${auth.terminationDate}). Start reauthorization in time for the review.`,tab:'package'});
 }
 if(auth.decidedAt&&!['dato'].includes(auth.decision)){
  const last=Math.max(day(auth.decidedAt),day(system.profile?.lastAnnualReview)||0);
  const due=new Date(last+365*DAY);
  if(due.getTime()<now)items.push({level:'medium',text:`The annual security review was due ${due.toISOString().slice(0,10)}.`,tab:'monitor',action:'review'});
 }
 for(const p of poam.filter(openPoam)){
  if(p.scheduledCompletion&&day(p.scheduledCompletion+'T23:59:59Z')<now)items.push({level:p.severity==='CAT I'?'high':'medium',text:`POA&M #${p.number} passed its scheduled completion date (${p.scheduledCompletion}).`,tab:'poam'});
  for(const m of p.milestones||[])if(!m.done&&m.due&&day(m.due+'T23:59:59Z')<now)items.push({level:'low',text:`POA&M #${p.number} milestone overdue: ${m.text} (due ${m.due}).`,tab:'poam'});
 }
 for(const c of controls){
  if(c.reassessReason)items.push({level:'medium',text:`${c.controlId} needs reassessment: ${c.reassessReason}`,tab:'assessment'});
  else if(c.step==='assessed'&&c.lastAssessedAt&&FREQUENCIES[c.frequency]&&day(c.lastAssessedAt)+FREQUENCIES[c.frequency][1]*DAY<now)items.push({level:'low',text:`${c.controlId} is due for its ${FREQUENCIES[c.frequency][0].toLowerCase()} reassessment.`,tab:'assessment'});
 }
 for(const id of [...new Set(controls.filter(c=>['inherited','hybrid'].includes(c.implementationStatus)&&c.provider).map(c=>c.provider))]){
  const through=providerValidThrough(system,id),left=daysUntil(through,now);
  if(left<0)items.push({level:'high',text:`${providerById(id).name}: provider assurance lapsed on ${through}.`,tab:'controls'});
  else if(left<=60)items.push({level:'low',text:`${providerById(id).name}: provider assurance ends ${through}.`,tab:'controls'});
 }
 for(const a of artifacts)if(a.reviewState==='accepted'&&a.artifactDate&&now-day(a.artifactDate)>365*DAY)items.push({level:'low',text:`Evidence older than a year: ${a.title}.`,tab:'evidence'});
 const order={high:0,medium:1,low:2};
 return items.sort((x,y)=>order[x.level]-order[y.level]);
}
