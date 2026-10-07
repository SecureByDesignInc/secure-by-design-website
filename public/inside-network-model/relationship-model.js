import {inventory} from './inventory.js';
import {vlans,facilities,families,additionalControls,buildArchitectureNodes} from './architecture.js';
import {technical,sequences} from './technical.js';
import {securityPractices,evaluateFlow,policyStatus} from './security.js';
import {stepPolicy} from './flow-policy.js';

// These are relationships in the existing design, not additional equipment.
const systems=buildArchitectureNodes(inventory.nodes);
const controls={...inventory.controls,...additionalControls};
const unique=values=>[...new Set(values)];
const segment=id=>vlans.find(v=>v.ids.includes(id));
const colors={association:'#729bad',traffic:'#79dece',manual:'#e6bc82',pending:'#e6bc82',deny:'#ee9294',failed:'#f0a983'};
const item=(key,label,short,type,color,action)=>({key,label,short,type,color,action});
function entity(id){
 const v=vlans.find(v=>v.id===id);
 if(v)return item(v.id,`VLAN ${v.number} · ${v.name}`,`VLAN ${v.number}`,'segment',v.color,{type:'vlan',id});
 const n=systems.find(n=>n.id===id);
 if(n)return item(id,n.name,id==='workstations'?'50 PCs':n.name.replace(/^SBD-/,'').replace('AdminJumpBox','Admin '),id==='workstations'||id.startsWith('jump')?'desktop':id==='root'?'offline':'server',segment(id)?.color||colors.manual,{type:'system',id});
 const f=facilities.find(f=>f.id===id);
 if(f)return item(id,f.name,id==='core'?'Core':id==='media'?'Media':'Backup',id==='core'?'switch':'media',f.color,{type:'facility',id});
 if(id==='operator')return item(id,'Authorized operator','Operator','operator',colors.manual);
 throw new Error(`Unknown relationship entity: ${id}`);
}
const edge=(from,to,kind='association',label='Related systems')=>({from,to,kind,label,color:colors[kind]});
function graph(title,caption,legend,nodes,edges=[],layout='hub'){
 return {title,caption,legend,nodes,edges,layout};
}
function grouped(ids){
 const remaining=new Set(ids),result=[];
 for(const v of vlans){const members=v.ids.filter(id=>remaining.has(id));if(!members.length)continue;
  const n=entity(v.id);n.label+=` · ${members.length} related ${members.length===1?'system':'systems'}`;result.push(n);members.forEach(id=>remaining.delete(id));
 }
 for(const id of remaining)result.push(entity(id));
 return result;
}
function mapping(title,ids,caption,short='Controls'){
 const hub=item('mapping',title,short,'shield','#a9badc');
 const members=unique(ids).length>7?grouped(unique(ids)):unique(ids).map(entity);
 return graph(title,caption,'Dotted lines show associations', [hub,...members],members.map(n=>edge(hub.key,n.key)));
}
export function relatedControlIds(prefix,{family=false}={}){
 const matches=id=>family?id.startsWith(prefix+'-'):id===prefix;
 return unique([...systems.filter(n=>n.controls.some(matches)||segment(n.id)?.controls.some(matches)).map(n=>n.id),...facilities.filter(f=>f.controls.some(matches)).map(f=>f.id)]);
}
function systemView(id){
 const n=entity(id),deps=unique(technical[id]?.depends||[]);
 if(id==='root')return graph(n.label,'Local certificate ceremony with approved media. The root remains physically disconnected.','Amber marks a manual process',[entity('operator'),n],[edge('operator',id,'manual','Local ceremony')],'flow');
 if(deps.length)return graph(n.label,'Explore the documented dependencies. Select equipment to inspect it in the data center.',deps.includes('root')?'Amber: manual certificate handling · dotted: dependency':'Dotted lines show dependencies',[n,...deps.map(entity)],deps.map(dep=>edge(id,dep,dep==='root'?'manual':'association',dep==='root'?'Manual certificate handling':'Dependency')));
 const v=segment(id);
 return graph(n.label,technical[id]?.purpose||systems.find(n=>n.id===id).role,'Dotted line shows segment membership',[n,...(v?[entity(v.id)]:[])],v?[edge(id,v.id,'association','Segment membership')]:[]);
}
function vlanView(id){
 const v=vlans.find(v=>v.id===id);
 return graph(`VLAN ${v.number} · ${v.name}`,v.boundary,'Dotted lines show segment membership',[entity(v.id),...v.ids.map(entity)],v.ids.map(id=>edge(v.id,id,'association','Segment membership')));
}
function processView(id){
 if(id==='core')return graph('Core switch stack','Eight internal segments meet at the routing boundary. Each permitted service requires an explicit exception.','Dotted lines show routing boundaries',[entity('core'),...vlans.map(v=>entity(v.id))],vlans.map(v=>edge('core',v.id,'association','Routing boundary')));
 const media=id==='media';
 const stages=media?[
  item('approval','Approve source and media','Approve','shield',colors.manual),
  item('validate','Scan and validate content','Validate','shield',colors.manual),
  item('custody','Record custody','Record','record',colors.manual),
  entity('operator')
 ]:[
  item('copies','Protect recovery material','Protect','server','#86c4f1'),
  entity('backup'),
  item('restore','Test restoration','Restore','server','#86c4f1')
 ];
 return graph(media?'Controlled media handling':'Offline backup & recovery',media?'Inbound: approve, validate, record custody, then import through an authorized operator. Outbound handling requires its own release approval.':'Protect offline copies and rehearse restoration. Recovery follows a human-controlled procedure.','Amber steps show a manual procedure',stages,stages.slice(1).map((n,i)=>edge(stages[i].key,n.key,'manual','Manual procedure')),'process');
}
function flowView(context){
 const step=sequences[context.scenario].steps[context.step];
 const from=step.from||'operator',to=step.to,policy=stepPolicy(step);
 const kind=policy.kind==='unreachable'||policy.kind==='rejected'?'failed':policy.kind;
 const legend={manual:'Manual handling · no network connection',traffic:'Moving markers show the service request',pending:'Service relationship · blocked pending validation',deny:'Denied by policy',unreachable:'Permitted · the destination does not respond',rejected:'Permitted · the client refuses the certificate'}[policy.kind];
 return graph(step.title,`${step.protocol} · ${policy.label}`,legend,unique([from,to]).map(entity),[edge(from,to,kind,step.protocol)],'flow');
}
export function relationshipModel(context={type:'overview'}){
 switch(context.type){
  case 'system':return systemView(context.id);
  case 'vlan':return vlanView(context.id);
  case 'facility':return processView(context.id);
  case 'control':return mapping(`${context.id} · ${controls[context.id][0]}`,relatedControlIds(context.id),'Explore the systems and operating processes associated with this control.',context.id);
  case 'family':return mapping(`${context.id} · ${families.find(f=>f[0]===context.id)[1]}`,relatedControlIds(context.id,{family:true}),'Select a segment or process to explore its relationship to this control family.',context.id);
  case 'practice':{const p=securityPractices.find(p=>p.id===context.id);return mapping(p.title,p.ids,p.design,'Practice');}
  case 'security':{
   const hub=item('security','Security design','Security','shield','#a9badc');
   const members=securityPractices.map((p,i)=>item(`practice-${p.id}`,p.title,`Priority ${i+1}`,'shield','#91adc8',{type:'practice',id:p.id}));
   return graph('Security design & policies','Select a priority to see its related systems and required practices.','Dotted lines show security priorities',[hub,...members],members.map(n=>edge(hub.key,n.key)));
  }
  case 'flow':return flowView(context);
  case 'policy':{
   const r=evaluateFlow(context.from,context.to,context.service),kind=r.status==='permit'?'traffic':r.status;
   return graph(context.service,`${policyStatus[r.status]} · ${r.purpose}`,r.status==='permit'?'Moving markers show permitted traffic':policyStatus[r.status],unique([context.from,context.to]).map(entity),[edge(context.from,context.to,kind,context.service)],'flow');
  }
  default:return graph('Connected by design','Select a segment, system, or security control to explore its relationships.','Dotted lines show internal segment boundaries',[entity('core'),...vlans.map(v=>entity(v.id))],vlans.map(v=>edge('core',v.id,'association','Segment boundary')));
 }
}
