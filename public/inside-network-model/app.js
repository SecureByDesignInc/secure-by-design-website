import {inventory} from './inventory.js';
import {scenarios,whatIfs,sequences,technical,sources,protocols} from './technical.js';
import {stepPolicy,gateText} from './flow-policy.js';
import {courses,systemCourses,processCourses} from './courses.js';
import {knowledgeChecks} from './knowledge-checks.js';
import {createClipRecorder} from './recorder.js';
import {describePacket} from './packets.js';
import {trafficRules,securityPractices} from './security.js';
import {createNetworkScene} from './scene.js';
import {vlans,buildArchitectureNodes,additionalControls,facilities,families} from './architecture.js';
import {mountSecurityDesign} from './security-ui.js';
import {locationText} from './data-center-layout.js';
import {createRelationshipView} from './relationship-scene.js';
import {relatedControlIds} from './relationship-model.js';
import {mountRelationshipExplorer} from './relationship-explorer.js';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nodes=buildArchitectureNodes(inventory.nodes);
const roomLocation=id=>locationText(id);
const systemOrder=[...vlans.flatMap(v=>v.ids),...nodes.filter(n=>!vlans.some(v=>v.ids.includes(n.id))).map(n=>n.id)];
Object.assign(inventory.controls,additionalControls);
let current=0,stepIndex=0,elapsed=0,speed=1,stepSeconds=10,selected='dc1',scene,relationships,relationshipBrowser,recorder,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,moving=playing,view='',ready=false,policy=null,connectionsOn=false,layout='logical';
const getNode=id=>nodes.find(n=>n.id===id),name=id=>getNode(id)?.name||facilities.find(f=>f.id===id)?.name||'Authorized operator';
const sourceLink=id=>sources[id]?`<a class="source-link" target="_blank" rel="noopener noreferrer" href="${sources[id][1]}">${esc(sources[id][0])}</a>`:'';
const dependencies=ids=>`<div class="dependency-list">${ids.map(id=>`<button data-system="${id}"><span>${esc(name(id))}</span><small>Inspect</small></button>`).join('')}</div>`;
const courseBlock=(keys,heading='Build this yourself')=>keys?.length?`<section class="course-links" aria-label="${esc(heading)}"><h3>${esc(heading)}</h3>${keys.map(key=>`<a href="${courses[key].href}" target="_top"><strong>${esc(courses[key].title)}</strong><span>${esc(courses[key].detail)}</span></a>`).join('')}</section>`:'';
const vlanOf=id=>vlans.find(v=>v.ids.includes(id))?.id;
const sameVlan=step=>!!step.from&&vlanOf(step.from)===vlanOf(step.to);
function motionLegend(step,p){
 if(p.kind==='manual')return step.walk?'The amber floor path is a person carrying approved media. It is not a network connection.':'Highlights mark a manual, offline process.';
 const local=sameVlan(step),route='rise into the overhead cable trays and ride them to the core switch';
 return [
  p.kind==='pending'?(local?'Requests stop at an amber gate at the destination’s host firewall: the rule is written but blocked until validated. Traffic inside one VLAN never reaches the core.':`Requests ${route} and stop at an amber gate: the rule is written but blocked until validated.`)
  :p.kind==='deny'?(local?'Requests stop at a red gate at the destination’s host firewall and are dropped with a red flash. Traffic inside one VLAN never reaches the core.':`Requests ${route}, pause for the rule check, and are dropped with a red flash: no exception matches, so default deny applies.`)
  :p.kind==='unreachable'?`Requests ${route}, pass the rule check, then fade at the destination: the service is permitted but does not answer.`
  :p.kind==='rejected'?'Requests and replies flow, then the client refuses the certificate.'
  :`Requests ${route}, pause for a rule check, and continue. The green badge names the rule that permits them.`,
  step.stream==='udp'?'Separate pulses are UDP datagrams.':step.stream==='either'?'Pulses with short trails: this protocol can use UDP or TCP.':'A steady stream is a TCP session.',
  (p.kind==='traffic'||p.kind==='rejected')&&step.reply!==false?'Smaller markers moving back are replies.':'',
  step.protection==='tls'&&p.kind==='traffic'?'The brighter sheath and lock mark a TLS-encrypted session.':p.kind==='rejected'?'The TLS handshake never completes, so no encrypted session is established.':step.protection==='signed'&&p.kind==='traffic'?'The seal marks signed content that is not encrypted.':'',
  'Select a moving packet to freeze it and see what it carries.'
 ].filter(Boolean).join(' ');
}
function showRelationship(context){relationshipBrowser?.close();relationships?.show(context);}
// Any playback change made by the viewer ends a recording and saves what was captured.
function endRecording(){if(recorder?.active)recorder.stop(true);}
function selectRelationship(action){if(action.type==='vlan')inspectVlan(action.id);else if(action.type==='facility')inspectFacility(action.id);else if(action.type==='practice')security.showPractice(action.id);else inspect(action.id,{reveal:false});}
const security=mountSecurityDesign({nodes,name,esc,architectureView,controlChips,inspect,showRelationship});
function bindSystems(root){root.querySelectorAll('[data-system]').forEach(button=>button.onclick=()=>inspect(button.dataset.system));}
function tab(which){for(const name of ['flow','system','architecture']){$(name+'Tab').setAttribute('aria-selected',String(name===which));$(name+'Tab').tabIndex=name===which?0:-1;$(name+'Panel').hidden=name!==which;}document.querySelector('.inspector').scrollTop=0;}
function setPlaying(on){playing=on&&moving;$('play').textContent=playing?'Pause sequence':'Play sequence';$('stagePlay').textContent=playing?'Pause':'Play';$('stagePlay').setAttribute('aria-label',playing?'Pause sequence':'Play sequence');$('play').setAttribute('aria-pressed',String(playing));$('sequenceState').textContent=playing?'Playing':'Paused';$('processPlayback').classList.toggle('is-playing',playing);}
function renderFlow(){
 const s=sequences[current],step=s.steps[stepIndex],p=policy||stepPolicy(step);
 $('flowPanel').innerHTML=`${ladder(s,stepIndex)}<span class="eyebrow">STEP ${String(stepIndex+1).padStart(2,'0')} / ${String(s.steps.length).padStart(2,'0')}</span><h2>${esc(step.title)}</h2><p>${esc(step.description)}</p><span class="protocol-badge">${esc(step.protocol)}</span><div class="connection"><div class="endpoint"><span>FROM</span>${step.from?`<button data-system="${step.from}">${esc(name(step.from))}</button>`:'<button type="button" disabled>Authorized operator</button>'}</div><hr><div class="endpoint"><span>TO</span><button data-system="${step.to}">${esc(name(step.to))}</button></div></div><div class="fact-grid"><div><span>TRANSPORT</span><strong>${esc(step.transport)}</strong></div><div><span>INITIATOR / PROCESS</span><strong>${esc(step.initiation)}</strong></div><div><span>PORT CONTEXT</span><strong>${esc(step.detail)}</strong></div><div><span>CONNECTION TYPE</span><strong>${step.manual?'Offline process':step.unverified?'Logical relationship':'Service request'}</strong></div><div class="policy-fact ${p.kind}"><span>POLICY DECISION</span><strong>${esc(p.label)}</strong></div><div><span>ON THE WIRE</span><strong>${esc(step.manual?'Approved media · no network':step.wire||'Not specified')}</strong></div></div><h3>What the line means</h3><p>${esc(step.note)}</p><h3>What the motion shows</h3><p>${esc(motionLegend(step,p))}</p>${p.kind!=='manual'?`<div class="packet-actions"><button type="button" data-inspect="request">Inspect a packet</button>${(p.kind==='traffic'||p.kind==='rejected')&&step.reply!==false?'<button type="button" data-inspect="reply">Inspect a reply</button>':''}</div>`:''}${step.test?`<div class="drill-test"><span>ACCEPTANCE TEST</span><strong>${esc(step.test)}</strong></div>`:''}${s.drill?drillScorecard(s):''}<h3>Systems in this sequence</h3>${dependencies(s.dependencies)}<details><summary>Sequence context</summary><p>${esc(s.assumption)}</p></details>${sourceLink(step.source)}${courseBlock(processCourses[s.id],'Learn the skills')}`;
 bindSystems($('flowPanel'));
 $('flowPanel').querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>inspectPacketFrom(b.dataset.inspect,b));
 $('flowPanel').querySelectorAll('.ladder-row').forEach(row=>{const go=()=>{endRecording();setPlaying(false);changeStep(Number(row.dataset.step));};row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};});
}
// A sequence (ladder) diagram of the whole process: who talks to whom, in order, and what the policy decided.
// It replaces the 3D relationship thumbnail while a walkthrough is shown.
const ladderColors={traffic:'#7fe0b7',pending:'#e6bc82',deny:'#ee9294',manual:'#e6bc82',unreachable:'#ee9294',rejected:'#ee9294'};
function ladder(s,currentStep){
 const ids=[];for(const st of s.steps)for(const id of [st.from||'operator',st.to])if(!ids.includes(id))ids.push(id);
 const W=320,colW=W/ids.length,top=40,rowH=46,H=top+rowH*s.steps.length+6,x=id=>colW*(ids.indexOf(id)+.5);
 const short=id=>id==='operator'?'Operator':id==='workstations'?'Workstations':name(id).replace(/^SBD-/,'');
 const fit=(text,width,size)=>{const max=Math.max(3,Math.floor(width/(size*.58)));return text.length>max?text.slice(0,max-1)+'…':text;};
 const head=ids.map(id=>`<text x="${x(id)}" y="16" text-anchor="middle" class="ladder-head">${esc(fit(short(id),colW-4,10))}</text><line x1="${x(id)}" y1="24" x2="${x(id)}" y2="${H-4}" class="ladder-life"/>`).join('');
 const rows=s.steps.map((st,i)=>{
  const p=stepPolicy(st),color=ladderColors[p.kind]||'#a8c7db',a=x(st.from||'operator'),b=x(st.to),y=top+rowH*i+26,dir=b>=a?1:-1,blocked=p.kind==='pending'||p.kind==='deny';
  const rule=p.kind==='manual'?'Offline':p.rule?.id==='DEFAULT-DENY'?'Default deny':p.rule?.id||'';
  const label=`${i+1} · ${st.short}${rule?` · ${rule}`:''}`;
  let mark='';
  if(a===b)mark=`<path d="M${a} ${y-6} h18 v12 h-14" fill="none" stroke="${color}" stroke-width="2"/><path d="M${a+4} ${y+2} l-5 4 l5 4" fill="none" stroke="${color}" stroke-width="2"/>${blocked?`<text x="${a+24}" y="${y+4}" class="ladder-x" fill="${color}">✕</text>`:''}`;
  else{
   const end=blocked?a+(b-a)*.6:b-dir*4,dash=p.kind==='manual'||p.kind==='unreachable'?' stroke-dasharray="5 4"':'';
   mark=`<line x1="${a}" y1="${y}" x2="${end}" y2="${y}" stroke="${color}" stroke-width="2"${dash}/>`;
   mark+=blocked?(p.kind==='deny'?`<text x="${end}" y="${y+4}" text-anchor="middle" class="ladder-x" fill="${color}">✕</text>`:`<line x1="${end}" y1="${y-7}" x2="${end}" y2="${y+7}" stroke="${color}" stroke-width="3"/>`)
    :`<path d="M${end-dir*6} ${y-5} L${end} ${y} L${end-dir*6} ${y+5}" fill="none" stroke="${color}" stroke-width="2"/>`;
   if((p.kind==='traffic'||p.kind==='rejected')&&st.reply!==false)mark+=`<line x1="${b-dir*4}" y1="${y+8}" x2="${a+dir*4}" y2="${y+8}" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 3" opacity=".75"/>`;
  }
  const center=a===b?a+40:(a+b)/2,width=a===b?colW*2:Math.abs(b-a)+colW*.8;
  return `<g class="ladder-row${i===currentStep?' current':''}" data-step="${i}" role="button" tabindex="0" aria-label="Step ${i+1}: ${esc(st.title)}. ${esc(p.label)}"><rect x="2" y="${top+rowH*i+2}" width="${W-4}" height="${rowH-4}" rx="7" class="ladder-bg"/><text x="${Math.min(W-6,Math.max(6,center))}" y="${y-9}" text-anchor="middle" class="ladder-label">${esc(fit(label,Math.min(W-12,Math.max(width,150)),10.5))}</text>${mark}</g>`;
 }).join('');
 return `<figure class="ladder" aria-label="Sequence diagram for ${esc(s.label)}"><figcaption><span>SEQUENCE</span><span class="ladder-key"><i style="background:#7fe0b7"></i>Permitted<i style="background:#e6bc82"></i>Pending or manual<i style="background:#ee9294"></i>Denied</span></figcaption><svg viewBox="0 0 ${W} ${H}" width="100%" role="presentation">${head}${rows}</svg></figure>`;
}
function drillScorecard(s){
 const rows=s.steps.map((st,i)=>{const p=stepPolicy(st),where=sameVlan(st)?'host firewall':'core';return `<li class="${p.kind}"${i===stepIndex?' aria-current="step"':''}><span>${String(i+1).padStart(2,'0')} · ${esc(st.short)}</span><strong>${p.kind==='pending'?'Blocked · pending':p.kind==='deny'?'Stopped':'Allowed'}</strong><small>${esc(p.rule?.id==='DEFAULT-DENY'?'Default deny':p.rule?.id||'')} · ${where}</small></li>`;});
 const stopped=s.steps.filter(st=>['deny','pending'].includes(stepPolicy(st).kind)).length;
 return `<h3>Drill scorecard</h3><p class="drill-summary"><strong>${stopped} of ${s.steps.length}</strong> attempts stopped.</p><ol class="drill-scorecard">${rows.join('')}</ol>`;
}
function renderSystem(){
 const n=getNode(selected);if(!n)return;
 const v=vlans.find(v=>v.ids.includes(selected));
 const t=technical[selected]||{purpose:n.known,services:[{name:n.role,port:'Listeners to define'}],dependencyText:'Define consumers, service settings, and permitted routes.',depends:[],verify:n.evidence};
 $('systemSelect').value=selected;
 $('systemPosition').textContent=`${systemOrder.indexOf(selected)+1} / ${systemOrder.length}`;
 $('systemContent').innerHTML=`<header class="system-heading"><span class="eyebrow">${v?`VLAN ${v.number} · ${esc(v.name)}`:'OFFLINE / NON-DOMAIN JOINED'}</span><h2>${esc(n.name)}</h2><p class="system-role">${esc(n.role)}</p></header><dl class="system-facts"><div><dt>${selected==='workstations'?'ADDRESS POOL':'IP ADDRESS'}</dt><dd>${esc(n.address||'Physically disconnected')}</dd></div><div><dt>${v?'SUBNET':'ACCESS'}</dt><dd>${esc(v?.subnet||'Local ceremony only')}</dd></div></dl><div class="equipment-location"><span>IN THE 3D ROOM</span><strong>${esc(roomLocation(selected))}</strong></div><p class="system-purpose">${esc(t.purpose)}</p><h3>Security controls</h3>${controlChips(n.controls)}<h3>Services & ports</h3><div class="system-services">${t.services.map(s=>`<div class="service-row"><b>${esc(s.name)}</b><span>${esc(s.port)}</span>${s.note?`<small>${esc(s.note)}</small>`:''}</div>`).join('')}</div><h3>Dependencies & boundaries</h3><p>${esc(t.dependencyText)}</p>${t.depends.length?dependencies(t.depends):''}${connectionsBlock(selected)}<h3>Security practices</h3><ul>${n.design.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><h3>Validation checkpoints</h3><ul>${t.verify.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><details><summary>Role & configuration</summary><p>${esc(n.known)}</p></details><details><summary>NIST control descriptions</summary>${n.controls.map(id=>`<p><strong>${id} · ${esc(inventory.controls[id][0])}</strong><br>${esc(inventory.controls[id][1])}</p>`).join('')}${sourceLink('nist')}</details><details><summary>Evidence to retain</summary><ul>${n.evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>${sourceLink(t.source)}${courseBlock(systemCourses[selected])}${security.systemNotes(selected)}`;
 bindSystems($('systemContent'));bindControls($('systemContent'));
 const toggle=$('connectionsToggle');if(toggle)toggle.onclick=()=>{if(!scene){toast('The 3D connection map needs 3D graphics (WebGL 2).');return;}connectionsOn=!connectionsOn;toggle.setAttribute('aria-pressed',String(connectionsOn));applyConnections();$('announce').textContent=connectionsOn?`Showing every rule for ${name(selected)} in 3D.`:'Connections hidden.';};
}
// ---- Connection map: every rule in the policy register that names a system ----
function connectionRows(id){
 const rows=[];
 for(const rule of trafficRules){const out=rule.from.includes(id),inn=rule.to.includes(id);if(!out&&!inn)continue;const pairs=[];if(out)for(const to of rule.to)pairs.push([id,to]);if(inn)for(const from of rule.from)if(!(out&&from===id))pairs.push([from,id]);rows.push({rule,pairs});}
 return rows;
}
function connectionPairs(id){const map=new Map();for(const {rule,pairs} of connectionRows(id))for(const [from,to] of pairs){const key=`${from}|${to}|${rule.status}`;if(!map.has(key))map.set(key,{from,to,status:rule.status,rules:[]});map.get(key).rules.push(rule.id);}return [...map.values()];}
function pairText(id,pairs){
 const list=ids=>ids.length>3?`${ids.slice(0,3).map(name).join(', ')} and ${ids.length-3} more`:ids.map(name).join(', ');
 if(pairs.some(([from,to])=>from===id&&to===id))return 'Between PCs in the pool';
 const outbound=pairs.filter(([from])=>from===id).map(([,to])=>to),inbound=pairs.filter(([,to])=>to===id).map(([from])=>from);
 return [outbound.length?`To ${list(outbound)}`:'',inbound.length?`From ${list(inbound)}`:''].filter(Boolean).join(' · ');
}
function connectionsBlock(id){
 if(id==='root')return '<h3>Connections</h3><p>No network connections. The offline root has no network interface in this design and works only through local ceremonies.</p>';
 const rows=connectionRows(id),groups=[['permit','Permitted'],['pending','Pending · blocked until validated'],['deny','Denied']];
 return `<h3>Connections</h3><div class="connections"><div class="connections-head"><p>${rows.length} ${rows.length===1?'rule names':'rules name'} this system. Everything else is denied by default.</p>${rows.length?`<button type="button" id="connectionsToggle" aria-pressed="${connectionsOn}">Show in 3D</button>`:''}</div>${groups.map(([status,label])=>{const items=rows.filter(r=>r.rule.status===status);return items.length?`<h4 class="connections-group ${status}">${label} <span>${items.length}</span></h4><ul class="connections-list">${items.map(({rule,pairs})=>`<li class="${status}"><b>${esc(rule.id)}</b><span>${esc(pairText(id,pairs))}</span><small>${esc(rule.service)} · ${esc(rule.transport)}</small></li>`).join('')}</ul>`:'';}).join('')}</div>`;
}
function applyConnections(){
 if(!scene)return;
 if(connectionsOn&&getNode(selected)&&selected!=='root')scene.showConnections(selected,connectionPairs(selected));
 else{scene.showConnections(null);scene.frame([selected]);}
}
// ---- Hover tooltips and packet inspection ----
let tipKey='';
function showHoverTip(info){
 const tip=$('hoverTip');
 if(!info||document.body.classList.contains('recording')){tip.hidden=true;tipKey='';return;}
 const key=info.packet?`packet:${info.packet}`:info.id;
 if(key===tipKey&&!tip.hidden){placeTip(tip,info);return;}
 tipKey=key;
 if(info.packet)tip.innerHTML=`<strong>${info.packet==='reply'?'Reply packet':'Request packet'}</strong><span>Select to freeze it and see what it carries</span>`;
 else{const n=getNode(info.id),f=facilities.find(f=>f.id===info.id);if(!n&&!f){tip.hidden=true;return;}
  tip.innerHTML=n?`<strong>${esc(n.id==='workstations'?'50 Windows PCs':n.name)}</strong><code>${esc(n.address||'No network address · offline')}</code><span>${esc(n.role)}</span>`:`<strong>${esc(f.name)}</strong><span>${info.id==='core'?'Routing between VLANs · default deny':'Offline process · no network link'}</span>`;}
 tip.hidden=false;tip.dataset.w=tip.offsetWidth;tip.dataset.h=tip.offsetHeight;placeTip(tip,info);
}
function placeTip(tip,info){
 const stage=$('viewport'),w=Number(tip.dataset.w),h=Number(tip.dataset.h);
 let x=info.x+16,y=info.y+18;if(x+w>stage.clientWidth-8)x=info.x-w-12;if(y+h>stage.clientHeight-8)y=info.y-h-12;
 tip.style.transform=`translate(${Math.round(Math.max(8,x))}px,${Math.round(Math.max(8,y))}px)`;
}
let packetReturnFocus=null;
function inspectPacketFrom(kind,button){
 if(!scene){toast('Packet inspection needs 3D graphics (WebGL 2).');return;}endRecording();setPlaying(false);packetReturnFocus=button;
 if(!scene.inspectPacket(kind)){packetReturnFocus=null;toast(kind==='reply'?'This step sends no reply to inspect.':'This step has no packet to inspect.');}
}
function showPacketCard(info){
 const card=$('packetCard');
 if(!info){const hadFocus=card.contains(document.activeElement);card.hidden=true;if(hadFocus)(packetReturnFocus||$('viewport').querySelector('canvas'))?.focus();packetReturnFocus=null;return;}
 endRecording();setPlaying(false);
 const s=sequences[current],step=s.steps[stepIndex],p=policy||stepPolicy(step);
 const d=describePacket({sequence:s,stepIndex,step,policy:p,info,name,address:id=>getNode(id)?.address,sameVlan:sameVlan(step)});
 card.innerHTML=`<div class="packet-card-head"><div><span class="eyebrow">${esc(d.title.toUpperCase())} · FROZEN</span><h2 id="packetTitle">${esc(d.app)}</h2></div><button type="button" class="packet-close" aria-label="Close packet details">✕</button></div><p class="packet-where">${esc(d.where)}</p><dl class="packet-layers">${d.layers.map(([layer,fields])=>`<div class="packet-layer"><dt>${esc(layer)}</dt>${fields.map(([k,v])=>`<dd><span>${esc(k)}</span><code>${esc(v)}</code></dd>`).join('')}</div>`).join('')}</dl><div class="packet-wire"><div><span>READABLE ON THE WIRE</span><p>${esc(d.readable)}</p></div><div><span>PROTECTED</span><p>${esc(d.protectedText)}</p></div></div><p class="packet-decision ${p.kind}"><span>POLICY</span>${esc(d.decision)}</p>${d.note?`<p class="packet-note">${esc(d.note)}</p>`:''}`;
 card.classList.toggle('left',info.x>info.width*.55);card.hidden=false;card.querySelector('.packet-close').onclick=()=>scene?.releasePacket();
 card.onkeydown=event=>{if(event.key==='Escape'){event.stopPropagation();scene?.releasePacket();}};
 if(packetReturnFocus)card.focus();
 $('announce').textContent=`Packet frozen. ${d.title}: ${d.summary}. ${d.decision}`;
}
// ---- Room and logical views; standard and cinematic looks ----
function onView(next,morphing){
 layout=next;$('viewToggle').setAttribute('aria-pressed',String(next==='logical'));
 if(morphing){$('announce').textContent=next==='logical'?'Topology on: when you choose a system, a VLAN, or a walkthrough step, its segments and the core switch float above the building.':'Topology hidden: the building only.';publish(view);if(!$('flowPanel').hidden)renderFlow();}
}
const lookKey='sbd-inside-network-look';
function setLook(name,{save=true}={}){
 if(!scene)return Promise.resolve();
 const done=scene.setTheme(name);document.body.classList.toggle('look-cinematic',name==='cinematic');$('lookToggle').setAttribute('aria-pressed',String(name==='cinematic'));
 if(save)try{localStorage.setItem(lookKey,name);}catch{}
 return done;
}
function inspect(id,{frame=true,reveal=true}={}){
 clearMarkers();if(facilities.some(f=>f.id===id)){inspectFacility(id);return;}
 if(!getNode(id))return;if(recorder?.active)recorder.stop(true);
 selected=id;setPlaying(false);renderSystem();tab('system');scene?.select(id,frame);if(connectionsOn)applyConnections();showRelationship({type:'system',id});
 const n=getNode(id),v=vlans.find(v=>v.ids.includes(id));
 $('sceneTitle').textContent=n.name;$('sceneCaption').textContent=n.role;
 document.querySelector('.flow-caption').classList.remove('is-step');$('stageDescription').textContent='';setProcessMode(false);
 $('stageKind').textContent='SELECTED SYSTEM';$('stageFlow').textContent=n.address||'Offline root CA';
 $('stageProtocol').textContent=v?`VLAN ${v.number} · ${v.name}`:'Physically disconnected · local access';
 $('announce').textContent=`Selected ${name(id)}. System details available.`;
 publish(`system=${id}`);
 if(reveal&&matchMedia('(max-width: 780px)').matches)$('systemInspector').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function controlChips(ids){return `<div class="control-chips">${ids.map(id=>`<button data-control="${esc(id)}" title="${esc(inventory.controls[id]?.[0])}">${esc(id)}</button>`).join('')}</div>`;}
function bindControls(root){root.querySelectorAll('[data-control]').forEach(b=>b.onclick=()=>inspectControl(b.dataset.control));}
// The traffic walkthroughs are optional: flow-only controls and the Flow details tab appear only while a process is shown.
function setProcessMode(on){document.body.classList.toggle('process-active',on);$('flowTab').hidden=!on;$('stepSystems').hidden=!on;document.querySelector('.flow-caption').classList.remove('step-complete');if(!on)scene?.setDescription?.('');if(!on)document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-current','false'));}
function openTraffic(){const section=$('trafficSection');if(!section.open)section.open=true;}
function architectureView(html,ids=[],relationship={type:'overview'}){document.querySelector('.flow-caption').classList.remove('is-step');setProcessMode(false);if(recorder?.active)recorder.stop(true);clearMarkers();setPlaying(false);tab('architecture');$('architectureContent').innerHTML=html;bindSystems($('architectureContent'));bindControls($('architectureContent'));scene?.highlight(ids);showRelationship(relationship);$('stageKind').textContent='NETWORK ARCHITECTURE';$('stageProtocol').textContent='Internal uplinks · permitted flows require explicit rules';$('announce').textContent=$('architectureContent').querySelector('h2')?.textContent||'Architecture selected';}
function inspectVlan(id){const v=vlans.find(v=>v.id===id);if(!v)return;architectureView(`<span class="eyebrow">VIRTUAL LOCAL AREA NETWORK ${v.number}</span><h2>${esc(v.name)}</h2><div class="address-card"><strong>${v.subnet}</strong></div><p>${esc(v.boundary)}</p><h3>Systems & addresses</h3>${v.ids.map(id=>`<button class="asset-row" data-system="${id}"><strong>${esc(name(id))}</strong><span>${esc(getNode(id).role)}</span><code>${getNode(id).address}</code></button>`).join('')}<h3>Key functions</h3><ul>${v.functions.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><h3>Control relationships</h3>${controlChips(v.controls)}`,v.ids,{type:'vlan',id});$('sceneTitle').textContent=`VLAN ${v.number} · ${v.name}`;$('sceneCaption').textContent=v.subnet;$('stageFlow').textContent=v.boundary;publish(`vlan=${v.number}`);}
function inspectControl(id){const c=inventory.controls[id];if(!c)return;const matched=nodes.filter(n=>n.controls.includes(id)||vlans.find(v=>v.ids.includes(n.id))?.controls.includes(id));const supporting=facilities.filter(f=>f.controls.includes(id));architectureView(`<span class="eyebrow">NIST SP 800-53 · REVISION 5</span><h2>${esc(id)} · ${esc(c[0])}</h2><p>${esc(c[1])}</p><h3>Related systems in this design</h3>${matched.length?dependencies(matched.map(n=>n.id)):'<p>This is a governance or process responsibility, not an individual server function.</p>'}${supporting.map(f=>`<h3>${esc(f.name)}</h3><p>${esc(f.detail)}</p>`).join('')}<h3>Control implementation</h3><p>Document the selected requirement, responsible owner, implementation, and supporting evidence.</p>${courseBlock(['rmf'],'Prepare it for authorization')}`,[...matched.map(n=>n.id),...supporting.map(f=>f.id)],{type:'control',id});$('sceneTitle').textContent=`${id} · ${c[0]}`;$('sceneCaption').textContent='Systems and processes associated with this control.';$('stageFlow').textContent=c[0];publish(`control=${encodeURIComponent(id)}`);}
function inspectFacility(id){const f=facilities.find(f=>f.id===id);architectureView(`<span class="eyebrow">ARCHITECTURE & OPERATIONS</span><h2>${esc(f.name)}</h2><p>${esc(f.detail)}</p><ul>${f.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><h3>Control relationships</h3>${controlChips(f.controls)}`,[id],{type:'facility',id});$('sceneTitle').textContent=f.name;$('sceneCaption').textContent=id==='core'?'Layer 3 routing · allow by exception':'Human-controlled process · no live network link';$('stageFlow').textContent=f.name;$('stageProtocol').textContent=id==='core'?'Internal switching and routing':'Controlled offline operations';publish(`facility=${id}`);}
function architectureOverview(){architectureView(`<span class="eyebrow">AIR-GAPPED ENTERPRISE</span><h2>Architecture at a glance</h2><p>A small air-gapped enterprise: a locked server room, an administration room, an office of 50 users, and a media room with an offline vault, all off one corridor. Choose a segment, a room, or a device and its part of the network topology floats above the building, with dashed tethers to where each system physically lives.</p><div class="address-card"><span>INTERNAL DOMAIN</span><strong>sbd.test</strong></div><h3>Boundary principles</h3><ul><li>No internet, cloud services, or external network connection.</li><li>Approved removable media under human control.</li><li>Offline, non-domain-joined root CA.</li><li>Three scoped administration seats on two machines, with MFA and session audit requirements.</li><li>One server each for Splunk, Tenable/Nessus, and Trellix ePO/DLP.</li><li>Default-deny policy, host isolation, and protected recovery procedures.</li></ul><details><summary>Equipment and hosting</summary><p>Equipment is vendor neutral. Servers run as virtual machines on seven hypervisor hosts (SBD-HV01–07) in racks R02–R04. Each domain controller has a host of its own (SBD-HV01, SBD-HV02), and the issuing CA runs with its template administration host on a third (SBD-HV03), so no CA shares a host with a domain controller; the root CA stays offline in the vault. Servers that talk within one VLAN share a host, so that traffic stays on its virtual switch. Two rack rows share a contained cold aisle with in-row cooling and UPS power.</p></details><h3>Core controls</h3>${controlChips(['SC-7','AC-4','AC-6','MP-7','CA-7'])}`);$('sceneTitle').textContent='Inside the network.';$('sceneCaption').textContent='Select a segment, a room, or a device: its part of the network rises above the building.';$('stageFlow').textContent='Select a segment or device to explore';publish('view=overview');}
function renderSteps(){
 const s=sequences[current];$('steps').style.setProperty('--step-count',s.steps.length);
 const stepLabel=step=>{const k=stepPolicy(step).kind;return k==='manual'?'OFFLINE PROCESS':k==='pending'?'BLOCKED · PENDING':k==='deny'?'DENIED':k==='unreachable'?'NO RESPONSE':k==='rejected'?'REJECTED':esc(step.protocol.split(' · ')[0]);};
 $('steps').innerHTML=s.steps.map((step,i)=>`<button data-step="${i}" aria-current="${i===stepIndex?'step':'false'}"><span class="step-number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(step.short)}</strong><small>${stepLabel(step)}</small></span><i class="step-progress"></i></button>`).join('');
 $('steps').querySelectorAll('button').forEach(b=>b.onclick=()=>{endRecording();setPlaying(false);changeStep(Number(b.dataset.step));});
}
function clearMarkers(){}
function changeStep(index){
 clearMarkers();
 const s=sequences[current],next=(index+s.steps.length)%s.steps.length;if(recorder?.beforeStep(next)===false)return;stepIndex=next;elapsed=0;document.querySelector('.flow-caption').classList.remove('step-complete');const step=s.steps[stepIndex];policy=stepPolicy(step);
 document.documentElement.style.setProperty('--accent',s.color);
 $('sceneTitle').textContent=s.title;$('sceneCaption').textContent=s.caption;
 $('stageKind').textContent={manual:'OFFLINE PROCESS',traffic:'PERMITTED SERVICE REQUEST',pending:'BLOCKED PENDING VALIDATION',deny:'DENIED BY POLICY',unreachable:'NO RESPONSE',rejected:'CERTIFICATE REJECTED'}[policy.kind];
 $('stageFlow').textContent=step.title;$('stageProtocol').textContent=step.protocol;
 // The step's narration and controls sit on the stage, next to the motion they describe.
 $('stageDescription').textContent=step.description;
 const endpoints=[step.from,step.to].filter((id,i,a)=>id&&getNode(id)&&a.indexOf(id)===i);
 $('stepSystems').innerHTML=`<span>In this step</span>${step.from?'':'<b>Authorized operator</b><i aria-hidden="true">→</i>'}${endpoints.map((id,i)=>`${i?'<i aria-hidden="true">→</i>':''}<button data-system="${id}">${esc(name(id))}</button>`).join('')}`;bindSystems($('stepSystems'));
 scene?.setDescription?.(`${s.label}, step ${stepIndex+1} of ${s.steps.length}: ${step.title}. ${policy.label}.`);$('stageCounter').textContent=`${stepIndex+1} / ${s.steps.length}`;document.querySelector('.flow-caption').classList.add('is-step');
 $('sequenceKicker').textContent=s.drill?'ATTACK DRILL / ACCEPTANCE TESTS':s.whatIf?`WHAT IF / ${s.label.toUpperCase()}`:`${String(current+1).padStart(2,'0')} / ${s.label.toUpperCase()}`;$('sequenceTitle').textContent=s.title;
 $('currentStepTitle').textContent=step.title;$('currentStepDescription').textContent=step.description;$('stepCounter').textContent=`Step ${stepIndex+1} of ${s.steps.length}`;
 setProcessMode(true);renderSteps();renderFlow();tab('flow');scene?.showStep(step,s.color,s.dependencies,policy,policy.kind==='manual'?null:gateText(policy,step));showRelationship({type:'flow',scenario:current,step:stepIndex});
 $('announce').textContent=`${s.label}, step ${stepIndex+1}: ${step.title}. ${policy.label}.`;
 publish(`process=${s.id}&step=${stepIndex+1}`);
}
function changeScenario(index,{fromRecorder=false}={}){if(recorder?.active&&!fromRecorder)recorder.stop(true);current=index;changeStep(0);document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.scenario)===index)));if(ready)renderKnowledgeCheck();}
const processDescriptions={signin:'Addressing, DNS & authentication',files:'Names, tickets & share access',updates:'Approved import & WSUS delivery',logs:'Collection, analysis & retention',license:'Client entitlement requests',trust:'Manual certificate ceremonies',web:'Names, certificates & HTTPS'};
$('scenarioButtons').innerHTML=scenarios.map((s,i)=>`<button aria-current="${i===0}" aria-controls="processPlayback" data-scenario="${i}" style="--process-color:${s.color}"><span class="process-card-title"><span class="process-number">${String(i+1).padStart(2,'0')}</span><strong>${esc(s.label)}</strong></span><span class="process-description">${esc(processDescriptions[s.id])}</span><span class="process-count">${s.steps.length} ${s.steps.length===1?'step':'steps'} <span aria-hidden="true">→</span></span></button>`).join('');
$('whatIfButtons').innerHTML=whatIfs.map((s,i)=>`<button aria-current="false" aria-controls="processPlayback" data-scenario="${scenarios.length+i}" style="--process-color:${s.color}"${s.drill?' class="drill-button"':''}>${esc(s.label)}</button>`).join('');
// Pause after each step by default, so the learner sets the pace; Auto-advance plays straight through.
const advanceKey='sbd-inside-network-auto-advance';let autoAdvance=false;try{autoAdvance=localStorage.getItem(advanceKey)==='on';}catch{}
function showAutoAdvance(){$('autoAdvance').setAttribute('aria-pressed',String(autoAdvance));$('autoAdvance').textContent=autoAdvance?'Auto-advance on':'Auto-advance off';}
showAutoAdvance();
$('autoAdvance').onclick=()=>{autoAdvance=!autoAdvance;showAutoAdvance();try{localStorage.setItem(advanceKey,autoAdvance?'on':'off');}catch{}};
function stepComplete(){
 elapsed=stepSeconds;const caption=document.querySelector('.flow-caption');if(caption.classList.contains('step-complete'))return;
 caption.classList.add('step-complete');const last=stepIndex===sequences[current].steps.length-1;
 $('sequenceState').textContent=last?'Process complete':'Step complete';
 $('announce').textContent=last?'Process complete. Choose another process or replay this one.':'Step complete. Select Next to continue.';
}
// Choosing a process brings the 3D stage into view (not the panel below it), so the motion plays where the learner is looking.
function revealStage(){const stage=document.querySelector('.stage'),r=stage.getBoundingClientRect();if(r.top>=0&&r.bottom<=innerHeight)return;stage.scrollIntoView({block:r.height>innerHeight?'start':'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{changeScenario(Number(b.dataset.scenario));setPlaying(moving);revealStage();});
// Opening the walkthroughs shows the processes; nothing plays until one is chosen.
$('trafficSection').addEventListener('toggle',reportHeight);
$('toolsMenu').onclick=()=>{const open=$('sceneTools').classList.toggle('open');$('toolsMenu').setAttribute('aria-expanded',String(open));};
$('sceneTools').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.id!=='legendToggle'&&matchMedia('(max-width: 780px)').matches){$('sceneTools').classList.remove('open');$('toolsMenu').setAttribute('aria-expanded','false');}});
$('stageFullscreen').onclick=()=>$('cinema').click();
$('legendToggle').onclick=()=>{const open=document.body.classList.toggle('show-key');$('legendToggle').setAttribute('aria-expanded',String(open));$('legendToggle').setAttribute('aria-pressed',String(open));};
$('stageBack').onclick=()=>$('back').click();$('stageNext').onclick=()=>$('next').click();$('stagePlay').onclick=()=>$('play').click();
for(const group of [...vlans.map(v=>({label:`VLAN ${v.number} · ${v.name}`,ids:v.ids})),{label:'Offline systems',ids:systemOrder.filter(id=>!vlans.some(v=>v.ids.includes(id)))}]){
 const options=document.createElement('optgroup');options.label=group.label;
 for(const id of group.ids){const n=getNode(id);options.append(new Option(`${n.name} · ${n.role}`,id));}
 $('systemSelect').append(options);
}
function moveSystem(delta){const index=systemOrder.indexOf(selected);inspect(systemOrder[(index+delta+systemOrder.length)%systemOrder.length]);}
$('previousSystem').onclick=()=>moveSystem(-1);$('nextSystem').onclick=()=>moveSystem(1);
$('showSystemDetails').onclick=()=>inspect(selected);
$('systemSelect').onchange=e=>inspect(e.target.value);
$('flowTab').onclick=()=>{endRecording();setPlaying(false);changeStep(stepIndex);};$('systemTab').onclick=()=>inspect(selected);
$('architectureTab').onclick=architectureOverview;
for(const name of ['system','flow','architecture'])$(name+'Tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=['system','flow','architecture'].filter(t=>!$(t+'Tab').hidden),other=tabs[(tabs.indexOf(name)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];$(other+'Tab').click();$(other+'Tab').focus();}};
$('back').onclick=()=>{endRecording();setPlaying(false);changeStep(stepIndex-1);};$('next').onclick=()=>{endRecording();setPlaying(false);changeStep(stepIndex+1);};
$('play').onclick=()=>{const wasPlaying=playing;endRecording();if(!moving)setMotion(true);const next=!wasPlaying;setPlaying(next);if(next)changeStep(stepIndex);};
$('speed').onchange=e=>{endRecording();speed=Number(e.target.value);scene?.setStepSeconds(stepSeconds/speed);};
function setMotion(on){moving=on;$('motion').textContent=on?'Motion on':'Motion off';$('motion').setAttribute('aria-pressed',String(on));scene?.setMotion(on);relationships?.setMotion(on);if(!on)setPlaying(false);}
$('motion').onclick=()=>{endRecording();setMotion(!moving);};
// Labels cycle: Focus (only the current step's systems during playback) → All → Off.
const labelModes={focus:['Labels: Focus','Labels: focus on the current step. Select to show all labels.'],all:['Labels: All','Labels: all shown. Select to hide labels.'],off:['Labels: Off','Labels: hidden. Select to focus labels on the current step.']};
let labelMode='focus';
$('labels').onclick=()=>{labelMode={focus:'all',all:'off',off:'focus'}[labelMode];$('labels').innerHTML=`<span class="tool-long">${labelModes[labelMode][0]}</span><span class="tool-short">Labels</span>`;$('labels').setAttribute('aria-label',labelModes[labelMode][1]);scene?.setLabelMode(labelMode);};
$('followToggle').onclick=()=>{const on=$('followToggle').getAttribute('aria-pressed')!=='true';$('followToggle').setAttribute('aria-pressed',String(on));scene?.setCameraMode(on?'guided':'wide');$('announce').textContent=on?'Follow packet on: the camera eases in on each step.':'Follow packet off: the camera stays on the whole step.';};
$('overview').onclick=architectureOverview;
$('reset').onclick=()=>{endRecording();setPlaying(false);changeStep(stepIndex);};
function cinema(on){document.body.classList.toggle('cinema',on);requestAnimationFrame(()=>{scene?.resize();relationships?.resize();scene?.frame(playing?sequences[current].dependencies:null);});}
$('cinema').onclick=()=>{cinema(true);document.documentElement.requestFullscreen?.().catch(()=>{});};$('exitCinema').onclick=()=>{cinema(false);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)cinema(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape')cinema(false);});
$('sourceLinks').innerHTML=Object.values(sources).map(([name,url])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${esc(name)}</a></li>`).join('');
$('protocolRows').innerHTML=protocols.map(([service,transport,meaning,source])=>`<tr><td>${esc(service)}</td><td>${esc(transport)}</td><td>${esc(meaning)}${sourceLink(source)}</td></tr>`).join('');
$('reference').onclick=()=>$('referenceDialog').showModal();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
function inspectFamily(family){if(!family){architectureOverview();return;}const ids=Object.keys(inventory.controls).filter(id=>id.startsWith(family+'-'));architectureView(`<span class="eyebrow">CONTROL FAMILY · REVISION 5</span><h2>${esc(families.find(f=>f[0]===family)[1])}</h2><p>Select a control to highlight its related systems and processes.</p>${ids.map(id=>`<div class="family-control">${controlChips([id])}<p>${esc(inventory.controls[id][0])}</p></div>`).join('')}`,relatedControlIds(family,{family:true}),{type:'family',id:family});$('sceneTitle').textContent=`${family} · Control relationships`;$('sceneCaption').textContent='Systems, processes, and control relationships.';$('stageFlow').textContent='Explore a control in the inspector';}
relationshipBrowser=mountRelationshipExplorer($('relationshipView'),{facilities,families,vlans,onOpen:()=>setPlaying(false),onSelect:choice=>{if(choice.type==='vlan')inspectVlan(choice.id);else if(choice.type==='family')inspectFamily(choice.id);else if(choice.type==='security')security.overview();else inspectFacility(choice.id);}});
relationships=createRelationshipView($('relationshipView'),{onSelect:selectRelationship,onMotion:setMotion,motion:moving});
renderSystem();changeScenario(0);setMotion(moving);setPlaying(playing);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)setMotion(false);});
window.addEventListener('pagehide',event=>{if(!event.persisted)relationships?.dispose();});
try{scene=createNetworkScene($('viewport'),nodes,inspect,()=>{if(!recorder?.active)setPlaying(false);},{onHover:showHoverTip,onPacket:showPacketCard,onView,onVlan:id=>inspectVlan(id)});}catch(e){console.error(e);$('loading').hidden=false;$('loading').innerHTML='<strong>3D graphics unavailable</strong><span>Use a browser with WebGL 2 and hardware acceleration.</span><span>All technical explanations remain available.</span>';}
// System Hub opens on the architecture explorer; traffic walkthroughs are optional, further down.
architectureOverview();
// Automated browser checks open the model with ?qa to reach the scene; nothing else uses this.
if(new URLSearchParams(location.search).has('qa'))window.insideNetworkQA={packets:()=>scene?.debugPackets()||[],project:id=>scene?.debugProject(id),labels:()=>scene?.debugLabels()||[],state:()=>scene?.debugState()};
let previous=performance.now();function tick(now){const dt=Math.min((now-previous)/1000,.1);previous=now;if(playing&&moving&&!document.hidden&&!document.querySelector('dialog[open]')&&!recorder?.holding){elapsed+=dt*speed;if(elapsed>=stepSeconds){if(autoAdvance||recorder?.active||document.body.classList.contains('cinema'))changeStep(stepIndex+1);else stepComplete();}}const bar=$('steps').querySelector('[aria-current=step] .step-progress');if(bar)bar.style.transform=`scaleX(${Math.min(1,elapsed/stepSeconds)})`;requestAnimationFrame(tick);}requestAnimationFrame(tick);

// Let the host page grow with the mobile inspector, without nested scrolling.
function reportHeight(){
 if(window.parent===window||document.body.classList.contains('cinema'))return;
 window.parent.postMessage({type:'sbd-network-height',mobile:true,height:Math.ceil(document.body.getBoundingClientRect().height)},window.location.origin);
}
new ResizeObserver(reportHeight).observe(document.body);
window.addEventListener('message',event=>{if(event.source===window.parent&&event.origin===window.location.origin&&event.data?.type==='sbd-network-request-height')reportHeight();});
window.addEventListener('resize',reportHeight);reportHeight();
let exporting=false,toastTimer;
function toast(message,clearAfter=3500){clearTimeout(toastTimer);$('toast').textContent=message;if(clearAfter)toastTimer=setTimeout(()=>$('toast').textContent='',clearAfter);}
$('export').onclick=async()=>{
 if(exporting)return;exporting=true;$('export').setAttribute('aria-busy','true');toast('Preparing 4K image…',0);
 try{if(!scene)throw new Error('No graphics');await scene.exportImage();toast('4K image downloaded');}
 catch{toast('Image export unavailable. Try presentation mode.');}
 finally{exporting=false;$('export').removeAttribute('aria-busy');}
};

// ---- Shareable links: #process=web&step=2, #system=dc1, #vlan=40, #control=SC-7 ----
// A hidden topology layer travels with the link: #process=web&step=2&topology=off (older layout=logical links show it)
const withLayout=hash=>layout==='physical'?(hash?`${hash}&topology=off`:'topology=off'):hash;
function publish(hash){
 view=hash;if(!ready)return;
 const full=withLayout(hash);
 if(location.hash.slice(1)!==full)history.replaceState(history.state,'',`${location.pathname}${location.search}#${full}`);
 if(window.parent!==window)window.parent.postMessage({type:'sbd-network-state',hash:full},window.location.origin);
}
function applyHash(raw){
 const params=new URLSearchParams(String(raw||'').replace(/^#/,''));
 if(scene){const wanted=params.get('topology')==='off'?'physical':'logical';if(scene.getView()!==wanted)scene.setView(wanted);}
 if(params.has('process')){const index=sequences.findIndex(s=>s.id===params.get('process'));if(index<0)return false;openTraffic();changeScenario(index);setPlaying(false);changeStep(Math.max(1,Math.min(sequences[index].steps.length,Number(params.get('step'))||1))-1);return true;}
 if(params.has('system')&&getNode(params.get('system'))){inspect(params.get('system'),{reveal:false});return true;}
 const vlan=vlans.find(v=>String(v.number)===params.get('vlan'));if(vlan){inspectVlan(vlan.id);return true;}
 if(params.has('control')&&Object.hasOwn(inventory.controls,params.get('control'))){inspectControl(params.get('control'));return true;}
 if(facilities.some(f=>f.id===params.get('facility'))){inspectFacility(params.get('facility'));return true;}
 if(params.get('view')==='overview'){architectureOverview();return true;}
 return false;
}
$('viewToggle').onclick=()=>{if(!scene){toast('The topology needs 3D graphics (WebGL 2).');return;}scene.setView(layout==='logical'?'physical':'logical');};
$('lookToggle').onclick=()=>{if(!scene){toast('The cinematic look needs 3D graphics (WebGL 2).');return;}endRecording();setLook(scene.getTheme()==='cinematic'?'standard':'cinematic');};
try{if(localStorage.getItem(lookKey)==='cinematic')setLook('cinematic',{save:false});}catch{}
applyHash(location.hash);ready=true;
if(window.parent!==window)window.parent.postMessage({type:'sbd-network-ready'},window.location.origin);
window.addEventListener('hashchange',()=>applyHash(location.hash));
window.addEventListener('message',event=>{if(event.source===window.parent&&event.origin===window.location.origin&&event.data?.type==='sbd-network-open'&&typeof event.data.hash==='string')applyHash(event.data.hash);});
$('copyLink').onclick=async()=>{
 const full=withLayout(view),url=`${location.origin}/inside-the-network${full?`#${full}`:''}`;
 try{await navigator.clipboard.writeText(url);toast('Link copied');}catch{toast(`Copy this link: ${url}`,9000);}
};

// ---- Knowledge checks (saved in this browser only) ----
const checksKey='sbd-inside-network-checks';
function savedChecks(){try{return JSON.parse(localStorage.getItem(checksKey)||'{}')||{};}catch{return {};}}
function renderKnowledgeCheck(){
 const s=sequences[current],questions=knowledgeChecks[s.id],box=$('knowledgeCheck');
 if(!questions){box.hidden=true;return;}
 box.hidden=false;box.open=false;
 const status=()=>{const answered=Object.keys(results).length,right=Object.values(results).filter(Boolean).length;$('knowledgeStatus').textContent=savedChecks()[s.id]&&!answered?'Completed':answered?`${right} of ${questions.length} correct`:`${questions.length} questions`;};
 const results={};
 $('knowledgeQuestions').innerHTML=questions.map((q,i)=>`<fieldset class="kc-question"><legend>${i+1}. ${esc(q.question)}</legend>${q.answers.map((a,j)=>`<label><input type="radio" name="kc-${s.id}-${i}" value="${j}" data-question="${i}"><span>${esc(a)}</span></label>`).join('')}<p class="kc-feedback" aria-live="polite"></p></fieldset>`).join('');
 $('knowledgeQuestions').querySelectorAll('input').forEach(input=>input.onchange=()=>{
  const i=Number(input.dataset.question),q=questions[i],right=Number(input.value)===q.correct,feedback=input.closest('fieldset').querySelector('.kc-feedback');
  results[i]=right;feedback.className=`kc-feedback ${right?'correct':'incorrect'}`;feedback.textContent=`${right?'Correct.':'Not quite.'} ${q.explanation}`;
  if(Object.keys(results).length===questions.length&&Object.values(results).every(Boolean)){try{localStorage.setItem(checksKey,JSON.stringify({...savedChecks(),[s.id]:true}));}catch{}}
  status();
 });
 status();
}
renderKnowledgeCheck();

// ---- Clip recording ----
let motionBeforeRecording=null;
recorder=createClipRecorder({
 getScene:()=>scene,sequences,toast,
 play:(index,options={})=>{motionBeforeRecording=moving;if(!moving)setMotion(true);speed=1;$('speed').value='1';stepSeconds=options.stepSeconds||10;scene?.setStepSeconds(stepSeconds);changeScenario(index,{fromRecorder:true});setPlaying(true);},
 look:{get:()=>scene?.getTheme()||'standard',set:name=>setLook(name,{save:false})},
 cardInfo:s=>{const key=processCourses[s.id]?.[0];return {course:key?courses[key].title:null};},
 // After the title card, the first step starts again from its source.
 restartStep:()=>{const s=sequences[current],step=s.steps[stepIndex],p=policy||stepPolicy(step);elapsed=0;scene?.showStep(step,s.color,s.dependencies,p,p.kind==='manual'?null:gateText(p,step));},
 current:()=>{const s=sequences[current],step=s.steps[stepIndex];return {sequence:s,step,stepIndex,policy:policy||stepPolicy(step),progress:Math.min(1,elapsed/stepSeconds)};},
 onState:on=>{document.body.classList.toggle('recording',on);$('record').disabled=on;$('announce').textContent=on?'Recording started. Use Stop to finish early.':'Recording finished.';if(on)$('recordingStop').focus();else{setPlaying(false);stepSeconds=10;scene?.setStepSeconds(stepSeconds/speed);if(motionBeforeRecording===false)setMotion(false);motionBeforeRecording=null;if(document.activeElement===document.body||document.activeElement===$('recordingStop'))$('record').focus();}}
});
$('record').onclick=()=>{if(!scene){toast('Clip recording needs 3D graphics (WebGL 2).');return;}recorder.open(current);};

// ---- Phone framing: keep the framed equipment clear of the stage overlays ----
// Labels in the 3D view keep clear of the HTML overlays on the stage.
function measureOverlays(){
 if(!scene)return;
 const stage=document.querySelector('.stage').getBoundingClientRect();
 scene.setReserved([...document.querySelectorAll('.stage-heading>*,.scene-tools,.flow-caption,.scene-key')].filter(el=>el.offsetParent!==null).map(el=>{const r=el.getBoundingClientRect();return {x:r.left-stage.left,y:r.top-stage.top,w:r.width,h:r.height};}).filter(r=>r.w>0&&r.h>0));
}
function measureInsets(){
 if(!scene)return;
 measureOverlays();
 const stage=document.querySelector('.stage').getBoundingClientRect();
 if(!stage.height||document.body.classList.contains('cinema')){scene.setInsets({top:0,bottom:0});return;}
 // Wider screens: keep the framed equipment above the step caption in the lower corner.
 if(!matchMedia('(max-width: 780px)').matches){const bottom=stage.bottom-document.querySelector('.flow-caption').getBoundingClientRect().top;scene.setInsets({top:0,bottom:Math.min(.3,Math.max(0,bottom/stage.height*.75))});return;}
 const top=Math.max(...['.stage-heading','.scene-tools'].map(s=>document.querySelector(s).getBoundingClientRect().bottom))-stage.top+10;
 const bottom=stage.bottom-document.querySelector('.flow-caption').getBoundingClientRect().top+10;
 scene.setInsets({top:Math.min(.45,Math.max(0,top/stage.height)),bottom:Math.min(.4,Math.max(0,bottom/stage.height))});
}
const insetObserver=new ResizeObserver(()=>requestAnimationFrame(measureInsets));
for(const element of document.querySelectorAll('.stage,.stage-heading,.scene-tools,.flow-caption'))insetObserver.observe(element);
