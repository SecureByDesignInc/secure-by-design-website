// Keep secondary navigation inside the relationship tool, one group at a time.
export function mountRelationshipExplorer(root,{facilities,families,vlans=[],onSelect,onOpen}){
 const toggle=root.querySelector('#relationshipExplore');
 const panel=root.querySelector('#relationshipExplorer');
 const content=root.querySelector('#relationshipContent');
 const motion=root.querySelector('[data-relationship-motion]');
 let category=null;
 const categories=[
  {id:'segments',label:'Network segments',description:`${vlans.length} VLANs and what lives on each`},
  {id:'infrastructure',label:'Infrastructure & security',description:'Switching, offline operations, and security practices'},
  {id:'controls',label:'Security controls',description:'Explore NIST control families and their relationships'}
 ];
 function button(label,description,activate){
  const el=document.createElement('button');el.type='button';el.className='relationship-choice';
  const title=document.createElement('strong');title.textContent=label;el.append(title);
  if(description){const text=document.createElement('span');text.textContent=description;el.append(text);}
  el.onclick=activate;return el;
 }
 function focusFirst(){panel.querySelector('.relationship-choice')?.focus({preventScroll:true});}
 function choose(choice){close();onSelect(choice);root.querySelector('[data-relationship-title]').focus({preventScroll:true});}
 function render(){
  panel.replaceChildren();
  const header=document.createElement('div');header.className='relationship-explorer-heading';
  if(category){const back=document.createElement('button');back.type='button';back.textContent='‹ Back';back.onclick=()=>{category=null;render();focusFirst();};header.append(back);}
  const title=document.createElement('h3');title.textContent=categories.find(c=>c.id===category)?.label||'What would you like to explore?';header.append(title);panel.append(header);
  const choices=document.createElement('div');choices.className='relationship-choices';panel.append(choices);
  if(!category){for(const c of categories)choices.append(button(c.label,c.description,()=>{category=c.id;render();focusFirst();}));}
  else if(category==='segments'){for(const v of vlans){const b=button(`VLAN ${v.number} · ${v.name}`,v.subnet,()=>choose({type:'vlan',id:v.id}));b.style.setProperty('--node-color',v.color);b.classList.add('segment-choice');choices.append(b);}}
  else if(category==='infrastructure'){
   for(const f of facilities)choices.append(button(f.name,null,()=>choose({type:'facility',id:f.id})));
   choices.append(button('Security design & policies',null,()=>choose({type:'security'})));
  }else for(const [id,label] of families)choices.append(button(`${id} · ${label}`,null,()=>choose({type:'family',id})));
 }
 function close({focus=false}={}){
  if(panel.hidden)return;
  panel.hidden=true;content.hidden=false;if(motion)motion.hidden=false;
  toggle.setAttribute('aria-expanded','false');toggle.textContent='Explore';toggle.setAttribute('aria-label','Explore network segments, infrastructure, and security controls');
  if(focus)toggle.focus({preventScroll:true});
 }
 function open(){
  onOpen();category=null;render();content.hidden=true;if(motion)motion.hidden=true;panel.hidden=false;
  toggle.setAttribute('aria-expanded','true');toggle.textContent='Close';toggle.setAttribute('aria-label','Close exploration choices');focusFirst();
 }
 toggle.onclick=()=>panel.hidden?open():close({focus:true});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();close({focus:true});}});
 return {close};
}
