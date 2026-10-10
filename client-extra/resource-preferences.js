const title=document.getElementById('preference-title'),message=document.getElementById('preference-message'),button=document.getElementById('preference-button');
const match=location.hash.match(/^#(confirm|unsubscribe)\/([a-f0-9]{64})$/);
if(!match){title.textContent='Email preferences';message.textContent='Use the confirmation or unsubscribe link from a Secure By Design email.';}
else{
 const [,action,token]=match;
 title.textContent=action==='confirm'?'Confirm resource emails':'Unsubscribe from resource emails';
 message.textContent=action==='confirm'?'Confirm that you would like to receive cybersecurity resources from Secure By Design. This is separate from career conversations.':'Stop receiving cybersecurity resource emails from Secure By Design. Your career conversation record will stay as it is.';
 button.hidden=false;button.textContent=action==='confirm'?'Confirm my signup':'Unsubscribe';
 button.onclick=async()=>{button.disabled=true;try{const r=await fetch('/api/resource-preferences',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,token})});const data=await r.json();if(!r.ok)throw Error(data.error||'Please try again.');message.textContent=data.message;button.hidden=true;history.replaceState(null,'',location.pathname);title.textContent=action==='confirm'?'You’re on the list':'You’re unsubscribed';}catch(error){message.textContent=error.message;button.disabled=false;}};
}
