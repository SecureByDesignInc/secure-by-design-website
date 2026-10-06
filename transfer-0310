const form=document.getElementById('contribution-form');
function createSubmissionId(){
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes].map(value=>value.toString(16).padStart(2,'0'));
 return hex.slice(0,4).join('')+'-'+hex.slice(4,6).join('')+'-'+hex.slice(6,8).join('')+'-'+hex.slice(8,10).join('')+'-'+hex.slice(10).join('');
}
let submissionId=typeof crypto.randomUUID==='function'?crypto.randomUUID():createSubmissionId();
const kind=form.elements.kind,link=form.elements.resourceUrl;
function setLink(){link.required=kind.value==='resource';document.getElementById('contribution-url-hint').textContent=link.required?'(required for a resource)':'(optional)';}
kind.addEventListener('change',setLink);setLink();
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button'),status=document.getElementById('contribution-status');button.disabled=true;status.textContent='Saving your contribution…';
 try{const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;data.submissionId=submissionId;const response=await fetch('/api/community-contributions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'Please try again.');status.textContent='Thank you. Your Community membership is active, and your contribution has been saved for review. Reference: '+result.id;form.reset();setLink();submissionId=typeof crypto.randomUUID==='function'?crypto.randomUUID():createSubmissionId();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
