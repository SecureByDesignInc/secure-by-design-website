import contributions from './career-pages/community-contributions.html?raw';
import subscribers from './career-pages/resource-subscribers.html?raw';
import preferences from './career-pages/resource-preferences.html?raw';
import explorer from './career-pages/career-explorer.html?raw';
import form from './career-pages/careers.html?raw';
import records from './career-pages/career-records.html?raw';
import {isOwner} from './careers.js';
import {combineCommunityPage} from './community-page.js';
const community=combineCommunityPage(form,explorer);
const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'"};
export function careerPage(request,env){
 const path=new URL(request.url).pathname.replace(/\/$/,'');
 if(!['/community-contributions','/community-contributions.html','/careers','/career-explorer','/career-records','/resource-subscribers','/resource-preferences','/careers.html','/career-explorer.html','/career-records.html','/resource-subscribers.html','/resource-preferences.html'].includes(path))return null;
 // The public Community pages are offline until relaunch (October 2026); the site's not-found page answers.
 // Owner record pages and the email preference page stay available.
 if(['/careers','/career-explorer'].includes(path))return null;
 if(path.endsWith('.html'))return new Response('Not found',{status:404,headers});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
 if(path==='/career-explorer')return Response.redirect(new URL('/careers'+new URL(request.url).search,request.url),308);
 if(['/career-records','/resource-subscribers','/community-contributions'].includes(path)){
  if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(new URL('/signin-with-chatgpt?return_to='+encodeURIComponent(path),request.url),302);
  if(!isOwner(request,env))return new Response('Only the site owner can open these records.',{status:403,headers});
 }
 return new Response(request.method==='HEAD'?null:({'/community-contributions':contributions,'/careers':community,'/career-records':records,'/resource-subscribers':subscribers,'/resource-preferences':preferences})[path],{headers});
}
