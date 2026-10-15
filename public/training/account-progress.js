(() => {
 'use strict';
 // Opened from disk: no account service. Guides that reserve the panel in their HTML drop it here.
 if(location.protocol==='file:'){document.querySelector('.sbd-account-progress')?.remove();return}
 // Account progress is separate from browser-local lab observations and exports.
 // Configuration course guides (1.2–1.10) name their course, guide bookmark and first lesson on the reserved panel.
 const named=document.querySelector('.sbd-account-progress[data-course]')?.dataset;
 const dc=location.pathname.includes('/dc01-dc02/'),lessons=dc||!!named;
 // The Network Authorization course (2.1, /training/rmf/) names only its guide bookmark: its modules come from #catalog/NN
 // and keep the training:rmf-boe-ato:NN progress IDs. Saving tells the course page (sbd-progress-changed) to refresh its steps.
 const reserved=document.querySelector('.sbd-account-progress')?.dataset;
 const course=named?.course||(dc?'dc01-dc02':'rmf-boe-ato'),guide=named?.guide||reserved?.guide||(dc?'dc-guide':'rmf-guide');
 // Reuse a panel the page reserved in its HTML (so nothing shifts when this deferred script runs).
 const panel=document.querySelector('.sbd-account-progress')||document.createElement('section');panel.className='sbd-account-progress';panel.setAttribute('aria-label','Account learning progress');
 const style=document.createElement('style');style.textContent='.sbd-account-progress{max-width:1440px;margin:20px auto;padding:20px 24px;border:1px solid #284359;border-radius:14px;background:#102437;color:#eff7ff;font:14px/1.6 Arial,sans-serif}.sbd-account-progress p{margin:6px 0 12px}.sbd-account-progress button,.sbd-account-progress a{display:inline-block;min-height:44px;margin:4px 10px 4px 0;padding:10px 14px;border:1px solid #6cc7d8;border-radius:8px;background:transparent;color:#b8f2fb;font:inherit;text-decoration:none;cursor:pointer}.sbd-account-progress button:disabled{opacity:.6}.sbd-account-progress button:focus-visible,.sbd-account-progress a:focus-visible{outline:3px solid #ffbf69;outline-offset:3px}.sbd-account-progress [role=status]{color:#b8f2fb}';document.head.append(style);
 const anchor=document.querySelector(lessons?'.hero':'.intro');if(!panel.isConnected){if(anchor)anchor.after(panel);else document.body.prepend(panel);}
 let data=null,error='',busy=false;
 const unit=()=>lessons?(window.SBD_CURRENT_UNIT||named?.unit||'prepare'):(/^#catalog\/(\d{2})/.exec(location.hash)?.[1]||null);
 const el=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node};
 function render(){
  panel.replaceChildren(el('strong','Continue across the website and app'));
  panel.append(el('p','Save learning progress and this guide to your account. Lab observations and evidence exports stay in this browser.'));
  if(error){const status=el('p',error);status.setAttribute('role','status');panel.append(status)}
  if(!data){const b=el('button','Load account progress');b.onclick=refresh;panel.append(b);return}
  if(!data.user){const a=el('a','Sign in to save progress');a.href='/my-progress?returnTo='+encodeURIComponent(location.pathname+location.hash);a.target='_top';panel.append(a);return}
  const current=unit(),id=current?`training:${course}:${current}`:null;
  const record=data.records.find(item=>item.id===id);
  if(id){const status=el('p',record?.status==='completed'?'This learning unit is complete.':record?'This learning unit is in progress.':'This learning unit is not started.');status.setAttribute('role','status');panel.append(status);
   const later=el('button','Save for later');later.disabled=busy||!!record;later.onclick=()=>save('/'+encodeURIComponent(id),{status:'in_progress'});panel.append(later);
   const complete=el('button',record?.status==='completed'?'Mark incomplete':'Mark learning unit complete');complete.disabled=busy;complete.onclick=()=>save('/'+encodeURIComponent(id),{status:record?.status==='completed'?'in_progress':'completed'});panel.append(complete);
  }else panel.append(el('p','Open a course module to save its learning progress.'));
  const saved=data.bookmarks?.some(item=>item.id===guide&&item.saved);const bookmark=el('button',saved?'Remove guide from saved':'Save this guide');bookmark.disabled=busy;bookmark.onclick=()=>save('/bookmarks/'+guide,{saved:!saved});panel.append(bookmark);
  const link=el('a','My Account →');link.href='/my-progress';link.target='_top';panel.append(link);
 }
 async function refresh(){try{const response=await fetch('/api/reader-progress',{cache:'no-store'});if(!response.ok)throw Error();data=await response.json();error=''}catch{error='Account progress is unavailable. Your lesson and local evidence are still available.'}render()}
 async function save(path,body){busy=true;error='';render();try{const response=await fetch('/api/reader-progress'+path,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw Error();await refresh();window.dispatchEvent(new Event('sbd-progress-changed'))}catch{error='Could not save account progress. Please try again.'}finally{busy=false;render()}}
 window.addEventListener('hashchange',render);window.addEventListener('sbd-learning-unit',render);window.addEventListener('focus',refresh);render();refresh();
})();
