(() => {
 'use strict';
 // Course guides (1.1–1.19) register window.SBD_GUIDE before this deferred script runs. For a signed-in learner this
 // keeps the guide's notes, checks, answers and completed lessons in the account (/api/reader-progress/guide/<id>,
 // owner request 18 October 2026) and marks each completed lesson in the account's progress, which the app reads.
 // Configuration course guides name their course, guide bookmark and first lesson on the reserved panel.
 const named=document.querySelector('.sbd-account-progress[data-course]')?.dataset;
 const dc=location.pathname.includes('/dc01-dc02/'),lessons=dc||!!named;
 // The Network Authorization course (2.1, /grc-rmf-training/rmf/) names only its guide bookmark: its modules come from #catalog/NN
 // and keep the training:rmf-boe-ato:NN progress IDs. Saving tells the course page (sbd-progress-changed) to refresh its steps.
 const reserved=document.querySelector('.sbd-account-progress')?.dataset;
 const course=named?.course||(dc?'dc01-dc02':'rmf-boe-ato'),guide=named?.guide||reserved?.guide||(dc?'dc-guide':'rmf-guide');
 const G=lessons?window.SBD_GUIDE:null;
 // Reuse a panel the page reserved in its HTML (so nothing shifts when this deferred script runs).
 const panel=document.querySelector('.sbd-account-progress')||document.createElement('section');panel.className='sbd-account-progress';panel.setAttribute('aria-label','Account learning progress');
 const style=document.createElement('style');style.textContent='.sbd-account-progress{max-width:1440px;margin:20px auto;padding:20px 24px;border:1px solid #284359;border-radius:14px;background:#102437;color:#eff7ff;font:14px/1.6 Arial,sans-serif}.sbd-account-progress p{margin:6px 0 12px}.sbd-account-progress button,.sbd-account-progress a{display:inline-block;min-height:44px;margin:4px 10px 4px 0;padding:10px 14px;border:1px solid #6cc7d8;border-radius:8px;background:transparent;color:#b8f2fb;font:inherit;text-decoration:none;cursor:pointer}.sbd-account-progress button:disabled{opacity:.6}.sbd-account-progress button:focus-visible,.sbd-account-progress a:focus-visible{outline:3px solid #ffbf69;outline-offset:3px}.sbd-account-progress [role=status]{color:#b8f2fb}';document.head.append(style);
 const anchor=document.querySelector(lessons?'.hero':'.intro');if(!panel.isConnected){if(anchor)anchor.after(panel);else document.body.prepend(panel);}
 let data=null,error='',busy=false;
 // Guide sync: 'loading' | 'saving' | 'saved' | 'error'.
 let sync='',loaded=false,timer=null,inflight=false;
 const unit=()=>lessons?(window.SBD_CURRENT_UNIT||named?.unit||'prepare'):(/^#catalog\/(\d{2})/.exec(location.hash)?.[1]||null);
 const el=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node};
 const lessonWork=(s,id)=>!!String(s.notes?.[id]||'').trim()||Object.entries(s.checks||{}).some(([k,v])=>v&&k.startsWith(id+'-'))||Object.keys(s.answers||{}).some(k=>k===id||k.startsWith(id+'-'));
 const hasWork=s=>!!s&&((s.completed||[]).length>0||(G?.lessons||[]).some(id=>lessonWork(s,id)));
 const syncText=()=>({loading:'Loading your saved work…',saving:'Saving to your account…',saved:'Saved to your account.',error:'Could not reach your account. Your work is saved in this browser and will be saved to your account when the connection returns.'})[sync]||'';
 function setSync(next){sync=next;window.SBD_GUIDE_SYNC_NOTE=next==='saved'||next==='saving'?'Saved to your account.':'';
  if(window.SBD_GUIDE_SYNC_NOTE)for(const id of ['storage-note','save-status']){const node=document.getElementById(id);if(node)node.textContent=window.SBD_GUIDE_SYNC_NOTE}
  render()}
 function render(){
  panel.replaceChildren(el('strong','Continue across the website and app'));
  panel.append(el('p',G?(data?.user?'Your notes, checks, answers, and completed lessons save to your account, so you can pick up on any browser or in the app.':'Sign in to save your notes, checks, answers, and completed lessons to your account, on the website and in the app.'):'Save learning progress and this guide to your account.'));
  if(error){const status=el('p',error);status.setAttribute('role','status');panel.append(status)}
  if(!data){const b=el('button','Load account progress');b.onclick=refresh;panel.append(b);return}
  if(!data.user){const a=el('a','Sign in to save progress');a.href='/my-progress?returnTo='+encodeURIComponent(location.pathname+location.hash);a.target='_top';panel.append(a);return}
  if(G){if(sync){const status=el('p',syncText());status.setAttribute('role','status');panel.append(status)}}
  else{
   const current=unit(),id=current?`training:${course}:${current}`:null;
   const record=data.records.find(item=>item.id===id);
   if(id){const status=el('p',record?.status==='completed'?'This learning unit is complete.':record?'This learning unit is in progress.':'This learning unit is not started.');status.setAttribute('role','status');panel.append(status);
    const later=el('button','Save for later');later.disabled=busy||!!record;later.onclick=()=>save('/'+encodeURIComponent(id),{status:'in_progress'});panel.append(later);
    const complete=el('button',record?.status==='completed'?'Mark incomplete':'Mark learning unit complete');complete.disabled=busy;complete.onclick=()=>save('/'+encodeURIComponent(id),{status:record?.status==='completed'?'in_progress':'completed'});panel.append(complete);
   }else panel.append(el('p','Open a course module to save its learning progress.'));
  }
  const saved=data.bookmarks?.some(item=>item.id===guide&&item.saved);const bookmark=el('button',saved?'Remove guide from saved':'Save this guide');bookmark.disabled=busy;bookmark.onclick=()=>save('/bookmarks/'+guide,{saved:!saved});panel.append(bookmark);
  const link=el('a','My Account →');link.href='/my-progress';link.target='_top';panel.append(link);
 }
 const put=(path,body,keepalive=false)=>fetch('/api/reader-progress'+path,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body),keepalive});
 // The newer copy wins: the guide stamps savedAt on every change in either place.
 async function pull(){
  if(!G||inflight||timer)return;
  if(!loaded)setSync('loading');
  try{
   const response=await fetch('/api/reader-progress/guide/'+encodeURIComponent(G.id),{cache:'no-store'});if(!response.ok)throw Error();
   const remote=(await response.json()).state,local=G.get();
   let ok=true;
   if(remote&&(!hasWork(local)||(remote.savedAt||0)>(local.savedAt||0))){if(!G.apply(remote)&&hasWork(local))ok=await push()}
   else if(hasWork(local)&&(!remote||(local.savedAt||0)>(remote.savedAt||0)))ok=await push();
   loaded=true;if(ok){setSync('saved');await records()}
  }catch{setSync('error')}
 }
 async function push(){
  clearTimeout(timer);timer=null;inflight=true;setSync('saving');
  try{const response=await put('/guide/'+encodeURIComponent(G.id),{state:G.get()});if(!response.ok)throw Error();setSync('saved');await records();return true}
  catch{setSync('error');return false}finally{inflight=false}
 }
 // Completed lessons become completed progress records; a lesson with work in it is in progress.
 async function records(){
  if(!data?.user)return;const s=G.get(),current=new Map(data.records.map(item=>[item.id,item.status]));let changed=false;
  for(const lesson of G.lessons){
   const id=`training:${G.course}:${lesson}`,want=s.completed.includes(lesson)?'completed':lessonWork(s,lesson)?'in_progress':null,have=current.get(id);
   const status=want==='completed'?(have==='completed'?null:'completed'):have==='completed'?'in_progress':want&&!have?'in_progress':null;
   if(!status)continue;
   try{const response=await put('/'+encodeURIComponent(id),{status});if(response.ok){changed=true;const row=data.records.find(item=>item.id===id);if(row)row.status=status;else data.records.push({id,status})}}catch{}
  }
  if(changed)window.dispatchEvent(new Event('sbd-progress-changed'));
 }
 async function refresh(){try{const response=await fetch('/api/reader-progress',{cache:'no-store'});if(!response.ok)throw Error();data=await response.json();error=''}catch{error='Account progress is unavailable. Your lesson and notes are still saved in this browser.'}render();if(G&&data?.user)await pull()}
 async function save(path,body){busy=true;error='';render();try{const response=await put(path,body);if(!response.ok)throw Error();await refresh();window.dispatchEvent(new Event('sbd-progress-changed'))}catch{error='Could not save account progress. Please try again.'}finally{busy=false;render()}}
 if(G){
  window.addEventListener('sbd-guide-saved',()=>{if(!data?.user||!loaded)return;clearTimeout(timer);timer=setTimeout(push,1200)});
  // Leaving the page with a change still waiting: send it now.
  addEventListener('pagehide',()=>{if(timer&&data?.user){clearTimeout(timer);timer=null;put('/guide/'+encodeURIComponent(G.id),{state:G.get()},true).catch(()=>{})}});
 }
 window.addEventListener('hashchange',render);window.addEventListener('sbd-learning-unit',render);window.addEventListener('focus',refresh);render();refresh();
})();
// Cookieless analytics (server/analytics.js). Files in public/ don't pass through the Worker, so static
// guides load the analytics script here. Skipped when the page already has it or is opened from disk.
(() => {
 if(location.protocol==='file:'||document.querySelector('script[src="/sbd-e/init.js"]'))return;
 const s=document.createElement('script');s.src='/sbd-e/init.js';s.defer=true;document.head.appendChild(s);
})();
