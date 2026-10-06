// Career requests have one destination. Preserve old conversation bookmarks.
const communityLinks=[...document.querySelectorAll('[data-community-panel]')];
function selectCommunitySection(){
 if(location.hash==='#conversation'){location.replace('/careers#goals');return;}
 const selected=communityLinks.find(link=>link.hash===location.hash)||(!location.hash?communityLinks[0]:null);
 if(!selected)return;
 for(const link of communityLinks){const active=link===selected;document.getElementById(link.dataset.communityPanel).hidden=!active;if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
}
if(communityLinks.length){selectCommunitySection();window.addEventListener('hashchange',selectCommunitySection);}
const form=document.getElementById('resource-form');
form?.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button'),status=document.getElementById('resource-status');button.disabled=true;status.textContent='Requesting your confirmation email…';
 try{const response=await fetch('/api/resource-signups',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:form.elements.resourceName.value,email:form.elements.resourceEmail.value,consent:form.elements.resourceConsent.checked,website:form.elements.resourceWebsite.value})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Please try again.');status.textContent=data.message;form.reset();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
