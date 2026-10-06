const el=id=>document.getElementById(id);let offset=0;
const labels={active:'Confirmed',pending:'Awaiting confirmation',unsubscribed:'Unsubscribed'};
async function list(){
 el('subscriber-status').textContent='Loading subscribers…';
 try{const response=await fetch('/api/resource-subscribers?status='+el('subscriber-filter').value+'&offset='+offset);const data=await response.json();if(!response.ok)throw Error(data.error);
  el('subscriber-summary').textContent=`${data.counts.active||0} confirmed · ${data.counts.pending||0} awaiting confirmation · ${data.counts.unsubscribed||0} unsubscribed`;
  const list=el('subscriber-list');list.replaceChildren();
  for(const row of data.subscribers){const card=document.createElement('article');card.className='subscriber-card';const name=document.createElement('h2');name.textContent=row.name||row.email;const email=document.createElement('p');email.textContent=row.email;const status=document.createElement('p');status.className='small';status.textContent=labels[row.status]+(row.confirmed_at?' · Confirmed '+new Date(row.confirmed_at).toLocaleDateString():' · Requested '+new Date(row.created_at).toLocaleDateString())+(row.email_state==='failed'?' · Confirmation email failed':'');card.append(name,email,status);
   if(row.status!=='unsubscribed'){const stop=document.createElement('button');stop.type='button';stop.className='secondary-button';stop.textContent='Unsubscribe';stop.setAttribute('aria-label','Unsubscribe '+row.email);stop.onclick=async()=>{stop.disabled=true;try{const r=await fetch('/api/resource-subscribers/unsubscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:row.email})});if(!r.ok)throw Error('Could not unsubscribe this address.');await listSubscribers();}catch(error){el('subscriber-status').textContent=error.message;stop.disabled=false;}};card.append(stop);}list.append(card);}
  if(!data.subscribers.length)list.textContent='No '+labels[el('subscriber-filter').value].toLowerCase()+' subscribers yet.';
  const total=data.counts[el('subscriber-filter').value]||0;el('subscriber-previous').disabled=offset===0;el('subscriber-next').disabled=offset+50>=total;el('subscriber-page').textContent=total?`${offset+1}–${Math.min(offset+50,total)} of ${total}`:'0 subscribers';el('subscriber-status').textContent=data.emailConfigured?'':'Email is not configured. Public signups will remain unavailable until it is connected.';
 }catch(error){el('subscriber-status').textContent=error.message||'Subscribers are temporarily unavailable.';}
}
const listSubscribers=list;
el('subscriber-filter').onchange=()=>{offset=0;list();};el('subscriber-refresh').onclick=list;el('subscriber-previous').onclick=()=>{offset=Math.max(0,offset-50);list();};el('subscriber-next').onclick=()=>{offset+=50;list();};await list();
