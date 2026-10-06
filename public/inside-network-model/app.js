import {inventory} from './inventory.js';
import {scenarios,technical,sources,protocols} from './technical.js';
import {createNetworkScene} from './scene.js';
import {vlans,buildArchitectureNodes,additionalControls,facilities,families} from './architecture.js';
import {mountSecurityDesign} from './security-ui.js';
import {dataCenterLayout} from './data-center-layout.js';
import {createRelationshipView} from './relationship-scene.js';
import {relatedControlIds} from './relationship-model.js';
import {mountRelationshipExplorer} from './relationship-explorer.js';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nodes=buildArchitectureNodes(inventory.nodes);
const roomLayout=dataCenterLayout(vlans);
function roomLocation(id){
 const zone=roomLayout.find(zone=>zone.ids.includes(id));
 if(!zone)return 'Offline root cabinet';
 if(zone.kind==='rack')return `${zone.rack} · Server position ${zone.ids.indexOf(id)+1}`;
 return zone.kind==='desks'?'Administration work area':'Windows 11 workstation area';
}
const systemOrder=[...vlans.flatMap(v=>v.ids),...nodes.filter(n=>!vlans.some(v=>v.ids.includes(n.id))).map(n=>n.id)];
Object.assign(inventory.controls,additionalControls);
let current=0,stepIndex=0,elapsed=0,speed=1,selected='dc1',scene,relationships,relationshipBrowser,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,moving=playing;
const getNode=id=>nodes.find(n=>n.id===id),name=id=>getNode(id)?.name||facilities.find(f=>f.id===id)?.name||'Authorized operator';
const sourceLink=id=>sources[id]?`<a class="source-link" target="_blank" rel="noopener noreferrer" href="${sources[id][1]}">${esc(sources[id][0])}</a>`:'';
const dependencies=ids=>`<div class="dependency-list">${ids.map(id=>`<button data-system="${id}"><span>${esc(name(id))}</span><small>Inspect</small></button>`).join('')}</div>`;
function showRelationship(context){relationshipBrowser?.close();relationships?.show(context);}
function selectRelationship(action){if(action.type==='vlan')inspectVlan(action.id);else if(action.type==='facility')inspectFacility(action.id);else if(action.type==='practice')security.showPractice(action.id);else inspect(action.id,{reveal:false});}
const security=mountSecurityDesign({nodes,name,esc,architectureView,controlChips,inspect,showRelationship});
function bindSystems(root){root.querySelectorAll('[data-system]').forEach(button=>button.onclick=()=>inspect(button.dataset.system));}
function tab(which){for(const name of ['flow','system','architecture']){$(name+'Tab').setAttribute('aria-selected',String(name===which));$(name+'Tab').tabIndex=name===which?0:-1;$(name+'Panel').hidden=name!==which;}document.querySelector('.inspector').scrollTop=0;}
function setPlaying(on){playing=on&&moving;$('play').textContent=playing?'Pause sequence':'Play sequence';$('play').setAttribute('aria-pressed',String(playing));$('sequenceState').textContent=playing?'Playing':'Paused';$('processPlayback').classList.toggle('is-playing',playing);}
function renderFlow(){
 const s=scenarios[current],step=s.steps[stepIndex];
 $('flowPanel').innerHTML=`<span class="eyebrow">STEP ${String(stepIndex+1).padStart(2,'0')} / ${String(s.steps.length).padStart(2,'0')}</span><h2>${esc(step.title)}</h2><p>${esc(step.description)}</p><span class="protocol-badge">${esc(step.protocol)}</span><div class="connection"><div class="endpoint"><span>FROM</span>${step.from?`<button data-system="${step.from}">${esc(name(step.from))}</button>`:'<button type="button" disabled>Authorized operator</button>'}</div><hr><div class="endpoint"><span>TO</span><button data-system="${step.to}">${esc(name(step.to))}</button></div></div><div class="fact-grid"><div><span>TRANSPORT</span><strong>${esc(step.transport)}</strong></div><div><span>INITIATOR / PROCESS</span><strong>${esc(step.initiation)}</strong></div><div><span>PORT CONTEXT</span><strong>${esc(step.detail)}</strong></div><div><span>CONNECTION TYPE</span><strong>${step.manual?'Offline process':step.unverified?'Logical relationship':'Service request'}</strong></div></div><h3>What the line means</h3><p>${esc(step.note)}</p><h3>Systems in this sequence</h3>${dependencies(s.dependencies)}<details><summary>Sequence context</summary><p>${esc(s.assumption)}</p></details>${sourceLink(step.source)}`;
 bindSystems($('flowPanel'));
}
function renderSystem(){
 const n=getNode(selected);if(!n)return;
 const v=vlans.find(v=>v.ids.includes(selected));
 const t=technical[selected]||{purpose:n.known,services:[{name:n.role,port:'Listeners to define'}],dependencyText:'Define consumers, service settings, and permitted routes.',depends:[],verify:n.evidence};
 $('systemSelect').value=selected;
 $('systemPosition').textContent=`${systemOrder.indexOf(selected)+1} / ${systemOrder.length}`;
 $('systemContent').innerHTML=`<header class="system-heading"><span class="eyebrow">${v?`VLAN ${v.number} · ${esc(v.name)}`:'OFFLINE / NON-DOMAIN JOINED'}</span><h2>${esc(n.name)}</h2><p class="system-role">${esc(n.role)}</p></header><dl class="system-facts"><div><dt>${selected==='workstations'?'ADDRESS POOL':'IP ADDRESS'}</dt><dd>${esc(n.address||'Physically disconnected')}</dd></div><div><dt>${v?'SUBNET':'ACCESS'}</dt><dd>${esc(v?.subnet||'Local ceremony only')}</dd></div></dl><div class="equipment-location"><span>IN THE 3D ROOM</span><strong>${esc(roomLocation(selected))}</strong></div><p class="system-purpose">${esc(t.purpose)}</p><h3>Security controls</h3>${controlChips(n.controls)}<h3>Services & ports</h3><div class="system-services">${t.services.map(s=>`<div class="service-row"><b>${esc(s.name)}</b><span>${esc(s.port)}</span>${s.note?`<small>${esc(s.note)}</small>`:''}</div>`).join('')}</div><h3>Dependencies & boundaries</h3><p>${esc(t.dependencyText)}</p>${t.depends.length?dependencies(t.depends):''}<h3>Security practices</h3><ul>${n.design.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><h3>Validation checkpoints</h3><ul>${t.verify.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><details><summary>Role & configuration</summary><p>${esc(n.known)}</p></details><details><summary>NIST control descriptions</summary>${n.controls.map(id=>`<p><strong>${id} · ${esc(inventory.controls[id][0])}</strong><br>${esc(inventory.controls[id][1])}</p>`).join('')}${sourceLink('nist')}</details><details><summary>Evidence to retain</summary><ul>${n.evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>${sourceLink(t.source)}${security.systemNotes(selected)}`;
 bindSystems($('systemContent'));bindControls($('systemContent'));
}
function inspect(id,{frame=true,reveal=true}={}){
 clearMarkers();if(facilities.some(f=>f.id===id)){inspectFacility(id);return;}
 selected=id;setPlaying(false);renderSystem();tab('system');scene?.select(id,frame);showRelationship({type:'system',id});
 const n=getNode(id),v=vlans.find(v=>v.ids.includes(id));
 $('sceneTitle').textContent=n.name;$('sceneCaption').textContent=n.role;
 $('stageKind').textContent='SELECTED SYSTEM';$('stageFlow').textContent=n.address||'Offline root CA';
 $('stageProtocol').textContent=v?`VLAN ${v.number} · ${v.name}`:'Physically disconnected · local access';
 $('announce').textContent=`Selected ${name(id)}. System details available.`;
 if(reveal&&matchMedia('(max-width: 780px)').matches)$('systemInspector').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function controlChips(ids){return `<div class="control-chips">${ids.map(id=>`<button data-control="${esc(id)}" title="${esc(inventory.controls[id]?.[0])}">${esc(id)}</button>`).join('')}</div>`;}
function bindControls(root){root.querySelectorAll('[data-control]').forEach(b=>b.onclick=()=>inspectControl(b.dataset.control));}
function architectureView(html,ids=[],relationship={type:'overview'}){clearMarkers();setPlaying(false);tab('architecture');$('architectureContent').innerHTML=html;bindSystems($('architectureContent'));bindControls($('architectureContent'));scene?.highlight(ids);showRelationship(relationship);$('stageKind').textContent='NETWORK ARCHITECTURE';$('stageProtocol').textContent='Internal uplinks · permitted flows require explicit rules';$('announce').textContent=$('architectureContent').querySelector('h2')?.textContent||'Architecture selected';}
function inspectVlan(id){const v=vlans.find(v=>v.id===id);if(!v)return;architectureView(`<span class="eyebrow">VIRTUAL LOCAL AREA NETWORK ${v.number}</span><h2>${esc(v.name)}</h2><div class="address-card"><strong>${v.subnet}</strong></div><p>${esc(v.boundary)}</p><h3>Systems & addresses</h3>${v.ids.map(id=>`<button class="asset-row" data-system="${id}"><strong>${esc(name(id))}</strong><span>${esc(getNode(id).role)}</span><code>${getNode(id).address}</code></button>`).join('')}<h3>Key functions</h3><ul>${v.functions.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><h3>Control relationships</h3>${controlChips(v.controls)}`,v.ids,{type:'vlan',id});$('sceneTitle').textContent=`VLAN ${v.number} · ${v.name}`;$('sceneCaption').textContent=v.subnet;$('stageFlow').textContent=v.boundary;$('vlanLegend').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vlan===id)));}
function inspectControl(id){const c=inventory.controls[id];if(!c)return;const matched=nodes.filter(n=>n.controls.includes(id)||vlans.find(v=>v.ids.includes(n.id))?.controls.includes(id));const supporting=facilities.filter(f=>f.controls.includes(id));architectureView(`<span class="eyebrow">NIST SP 800-53 · REVISION 5</span><h2>${esc(id)} · ${esc(c[0])}</h2><p>${esc(c[1])}</p><h3>Related systems in this design</h3>${matched.length?dependencies(matched.map(n=>n.id)):'<p>This is a governance or process responsibility, not an individual server function.</p>'}${supporting.map(f=>`<h3>${esc(f.name)}</h3><p>${esc(f.detail)}</p>`).join('')}<h3>Control implementation</h3><p>Document the selected requirement, responsible owner, implementation, and supporting evidence.</p>`,[...matched.map(n=>n.id),...supporting.map(f=>f.id)],{type:'control',id});$('sceneTitle').textContent=`${id} · ${c[0]}`;$('sceneCaption').textContent='Systems and processes associated with this control.';$('stageFlow').textContent=c[0];}
function inspectFacility(id){const f=facilities.find(f=>f.id===id);architectureView(`<span class="eyebrow">ARCHITECTURE & OPERATIONS</span><h2>${esc(f.name)}</h2><p>${esc(f.detail)}</p><ul>${f.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><h3>Control relationships</h3>${controlChips(f.controls)}`,[id],{type:'facility',id});$('sceneTitle').textContent=f.name;$('sceneCaption').textContent=id==='core'?'Layer 3 routing · allow by exception':'Human-controlled process · no live network link';$('stageFlow').textContent=f.name;$('stageProtocol').textContent=id==='core'?'Internal switching and routing':'Controlled offline operations';}
function architectureOverview(){architectureView(`<span class="eyebrow">AIR-GAPPED ENTERPRISE</span><h2>Architecture at a glance</h2><p>Explore server cabinets, a two-switch network rack, administration desks, and the workstation area. Select equipment to see the services it represents and follow a request through the room.</p><div class="address-card"><span>INTERNAL DOMAIN</span><strong>SecureByDesign.internal</strong></div><h3>Boundary principles</h3><ul><li>No internet, cloud services, or external network connection.</li><li>Approved removable media under human control.</li><li>Offline, non-domain-joined root CA.</li><li>Three scoped administration hosts with MFA and session audit requirements.</li><li>One server each for Splunk, Tenable/Nessus, and Trellix ePO/DLP.</li><li>Default-deny policy, host isolation, and protected recovery procedures.</li></ul><details><summary>Equipment and hosting</summary><p>The room uses unbranded equipment to represent the existing systems. Rack positions organize this view; hardware makes, models, and virtualization host assignments have not been specified.</p></details><h3>Core controls</h3>${controlChips(['SC-7','AC-4','AC-6','MP-7','CA-7'])}`);$('sceneTitle').textContent='Inside the data center.';$('sceneCaption').textContent='Server racks, network equipment, and separate offline operations.';$('stageFlow').textContent='Select a segment or device to explore';$('vlanLegend').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));}
function renderSteps(){
 const s=scenarios[current];$('steps').style.setProperty('--step-count',s.steps.length);
 $('steps').innerHTML=s.steps.map((step,i)=>`<button data-step="${i}" aria-current="${i===stepIndex?'step':'false'}"><span class="step-number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(step.short)}</strong><small>${step.manual?'OFFLINE PROCESS':step.unverified?'TRANSPORT TO DEFINE':esc(step.protocol.split(' · ')[0])}</small></span><i class="step-progress"></i></button>`).join('');
 $('steps').querySelectorAll('button').forEach(b=>b.onclick=()=>{setPlaying(false);changeStep(Number(b.dataset.step));});
}
function clearMarkers(){document.querySelectorAll('#vlanLegend button').forEach(b=>b.setAttribute('aria-pressed','false'));}
function changeStep(index){
 clearMarkers();
 const s=scenarios[current];stepIndex=(index+s.steps.length)%s.steps.length;elapsed=0;const step=s.steps[stepIndex];
 document.documentElement.style.setProperty('--accent',s.color);
 $('sceneTitle').textContent=s.title;$('sceneCaption').textContent=s.caption;
 $('stageKind').textContent=step.manual?'OFFLINE PROCESS':step.unverified?'SERVICE INTEGRATION':'SERVICE REQUEST';
 $('stageFlow').textContent=step.title;$('stageProtocol').textContent=step.protocol;
 $('sequenceKicker').textContent=`${String(current+1).padStart(2,'0')} / ${s.label.toUpperCase()}`;$('sequenceTitle').textContent=s.title;
 $('currentStepTitle').textContent=step.title;$('currentStepDescription').textContent=step.description;$('stepCounter').textContent=`Step ${stepIndex+1} of ${s.steps.length}`;
 renderSteps();renderFlow();tab('flow');scene?.showStep(step,s.color,s.dependencies);showRelationship({type:'flow',scenario:current,step:stepIndex});
 $('announce').textContent=`${s.label}, step ${stepIndex+1}: ${step.title}.`;
}
function changeScenario(index){current=index;changeStep(0);$('scenarioButtons').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));}
const processDescriptions={signin:'Addressing, DNS & authentication',files:'Names, tickets & share access',updates:'Approved import & WSUS delivery',logs:'Collection, analysis & retention',license:'Client entitlement requests',trust:'Manual certificate ceremonies'};
$('scenarioButtons').innerHTML=scenarios.map((s,i)=>`<button aria-current="${i===0}" aria-controls="processPlayback" data-scenario="${i}" style="--process-color:${s.color}"><span class="process-card-title"><span class="process-number">${String(i+1).padStart(2,'0')}</span><strong>${esc(s.label)}</strong></span><span class="process-description">${esc(processDescriptions[s.id])}</span><span class="process-count">${s.steps.length} ${s.steps.length===1?'step':'steps'} <span aria-hidden="true">→</span></span></button>`).join('');
$('scenarioButtons').querySelectorAll('button').forEach(b=>b.onclick=()=>{changeScenario(Number(b.dataset.scenario));setPlaying(moving);$('processPlayback').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
for(const group of [...vlans.map(v=>({label:`VLAN ${v.number} · ${v.name}`,ids:v.ids})),{label:'Offline systems',ids:systemOrder.filter(id=>!vlans.some(v=>v.ids.includes(id)))}]){
 const options=document.createElement('optgroup');options.label=group.label;
 for(const id of group.ids){const n=getNode(id);options.append(new Option(`${n.name} · ${n.role}`,id));}
 $('systemSelect').append(options);
}
function moveSystem(delta){const index=systemOrder.indexOf(selected);inspect(systemOrder[(index+delta+systemOrder.length)%systemOrder.length]);}
$('previousSystem').onclick=()=>moveSystem(-1);$('nextSystem').onclick=()=>moveSystem(1);
$('showSystemDetails').onclick=()=>inspect(selected);
$('systemSelect').onchange=e=>inspect(e.target.value);
$('flowTab').onclick=()=>{setPlaying(false);changeStep(stepIndex);};$('systemTab').onclick=()=>inspect(selected);
$('architectureTab').onclick=architectureOverview;
for(const name of ['system','flow','architecture'])$(name+'Tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=['system','flow','architecture'],other=tabs[(tabs.indexOf(name)+(e.key==='ArrowRight'?1:2))%3];$(other+'Tab').click();$(other+'Tab').focus();}};
$('back').onclick=()=>{setPlaying(false);changeStep(stepIndex-1);};$('next').onclick=()=>{setPlaying(false);changeStep(stepIndex+1);};
$('play').onclick=()=>{if(!moving)setMotion(true);const next=!playing;setPlaying(next);if(next)changeStep(stepIndex);};
$('speed').onchange=e=>{speed=Number(e.target.value);};
function setMotion(on){moving=on;$('motion').textContent=on?'Motion on':'Motion off';$('motion').setAttribute('aria-pressed',String(on));scene?.setMotion(on);relationships?.setMotion(on);if(!on)setPlaying(false);}
$('motion').onclick=()=>setMotion(!moving);
$('labels').onclick=()=>{const on=$('labels').getAttribute('aria-pressed')!=='true';$('labels').setAttribute('aria-pressed',String(on));scene?.setLabels(on);};
$('overview').onclick=architectureOverview;
$('reset').onclick=()=>{setPlaying(false);changeStep(stepIndex);};
function cinema(on){document.body.classList.toggle('cinema',on);requestAnimationFrame(()=>{scene?.resize();relationships?.resize();scene?.frame(playing?scenarios[current].dependencies:null);});}
$('cinema').onclick=()=>{cinema(true);document.documentElement.requestFullscreen?.().catch(()=>{});};$('exitCinema').onclick=()=>{cinema(false);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)cinema(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape')cinema(false);});
$('sourceLinks').innerHTML=Object.values(sources).map(([name,url])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${esc(name)}</a></li>`).join('');
$('protocolRows').innerHTML=protocols.map(([service,transport,meaning,source])=>`<tr><td>${esc(service)}</td><td>${esc(transport)}</td><td>${esc(meaning)}${sourceLink(source)}</td></tr>`).join('');
$('reference').onclick=()=>$('referenceDialog').showModal();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('vlanLegend').innerHTML=vlans.map(v=>`<button data-vlan="${v.id}" aria-pressed="false" style="--vlan-color:${v.color}"><b>VLAN ${v.number}</b><span>${esc(v.name)}</span><code>${v.subnet}</code></button>`).join('');
$('vlanCount').textContent=`${vlans.length} VLANs`;
$('vlanLegend').querySelectorAll('button').forEach(b=>b.onclick=()=>{inspectVlan(b.dataset.vlan);$('vlanPanel').open=false;$('vlanToggle').focus();});
$('vlanPanel').addEventListener('keydown',event=>{if(event.key==='Escape'&&$('vlanPanel').open){event.stopPropagation();$('vlanPanel').open=false;$('vlanToggle').focus();}});
function inspectFamily(family){if(!family){architectureOverview();return;}const ids=Object.keys(inventory.controls).filter(id=>id.startsWith(family+'-'));architectureView(`<span class="eyebrow">CONTROL FAMILY · REVISION 5</span><h2>${esc(families.find(f=>f[0]===family)[1])}</h2><p>Select a control to highlight its related systems and processes.</p>${ids.map(id=>`<div class="family-control">${controlChips([id])}<p>${esc(inventory.controls[id][0])}</p></div>`).join('')}`,relatedControlIds(family,{family:true}),{type:'family',id:family});$('sceneTitle').textContent=`${family} · Control relationships`;$('sceneCaption').textContent='Systems, processes, and control relationships.';$('stageFlow').textContent='Explore a control in the inspector';}
relationshipBrowser=mountRelationshipExplorer($('relationshipView'),{facilities,families,onOpen:()=>setPlaying(false),onSelect:choice=>{if(choice.type==='family')inspectFamily(choice.id);else if(choice.type==='security')security.overview();else inspectFacility(choice.id);}});
relationships=createRelationshipView($('relationshipView'),{onSelect:selectRelationship,onMotion:setMotion,motion:moving});
renderSystem();changeScenario(0);setMotion(moving);setPlaying(playing);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)setMotion(false);});
window.addEventListener('pagehide',event=>{if(!event.persisted)relationships?.dispose();});
try{scene=createNetworkScene($('viewport'),nodes,inspect,()=>setPlaying(false));}catch(e){console.error(e);$('loading').hidden=false;$('loading').innerHTML='<strong>3D graphics unavailable</strong><span>Use a browser with WebGL 2 and hardware acceleration.</span><span>All technical explanations remain available.</span>';}
inspect(selected,{frame:false,reveal:false});
let previous=performance.now();function tick(now){const dt=Math.min((now-previous)/1000,.1);previous=now;if(playing&&moving&&!document.hidden&&!document.querySelector('dialog[open]')){elapsed+=dt*speed;if(elapsed>=10)changeStep(stepIndex+1);}const bar=$('steps').querySelector('[aria-current=step] .step-progress');if(bar)bar.style.transform=`scaleX(${elapsed/10})`;requestAnimationFrame(tick);}requestAnimationFrame(tick);

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
