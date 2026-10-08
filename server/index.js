import {contributionsApi} from './contributions.js';
import {resourcesApi} from './resources.js';
import website from 'vinext/server/fetch-handler';
import {api} from './careers.js';
import {careerPage} from './career-pages.js';
import {careerRolePage} from './career-role-pages.js';
import {readerProgressApi} from './reader-progress.js';
import {readerAuthApi} from './reader-auth.js';
import {nativeProgressApi} from './native-progress.js';
import {nativeActivityApi} from './native-activity.js';
import {nativeAuthApi} from './native-auth.js';
import {nativeOnboardingApi} from './native-onboarding.js';
import {signInApi} from './sign-in-methods.js';
import {hsts,protect} from './security-headers.js';
// Only the default export may leave this file: the Workers runtime treats every named export of the
// entry module as an entrypoint and refuses to start if one isn't a handler.
// The site now runs on its own Cloudflare Worker. ChatGPT Sites used to inject the oai-authenticated-* identity
// headers; nothing does now, so any such header comes from the client and must not be trusted.
function withoutPlatformIdentity(request){
 const names=[...request.headers.keys()].filter(name=>name.startsWith('oai-'));
 if(!names.length)return request;
 const headers=new Headers(request.headers);for(const name of names)headers.delete(name);
 return new Request(request,{headers});
}
const securityTxt='Contact: mailto:support@securebydesigninc.com\nExpires: 2027-09-30T00:00:00.000Z\nPreferred-Languages: en\nCanonical: https://securebydesigninc.com/.well-known/security.txt\n';
const localHosts=new Set(['localhost','127.0.0.1','[::1]']);
const redirect=(location,https)=>new Response(null,{status:301,headers:{location,...(https?{'strict-transport-security':hsts}:{})}});
// Retired Community forms (careers, contributions, resource sign-ups) are closed until relaunch: no new
// personal data, no email. Owner reads and the email-preference links in sent emails keep working.
const retiredForms=new Set(['/api/career-submissions','/api/community-contributions','/api/resource-signups']);
async function route(request,env,ctx){
 const path=new URL(request.url).pathname;
 // Vulnerability-report contact (RFC 9116). public/.well-known/security.txt normally answers first.
 if(path==='/.well-known/security.txt'||path==='/security.txt')return new Response(securityTxt,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=86400'}});
 if(request.method==='POST'&&retiredForms.has(path.replace(/\/$/,'')))return Response.json({error:'This form is closed for now. Nothing was submitted.'},{status:410,headers:{'cache-control':'no-store'}});
 if(/^\/api\/native-activity(\/|$)/.test(path))return nativeActivityApi(request,env);
 if(/^\/api\/native-progress(\/|$)/.test(path))return nativeProgressApi(request,env);
 if(/^\/api\/native-auth(\/|$)/.test(path))return nativeAuthApi(request,env);
 if(path==='/api/native-onboarding')return nativeOnboardingApi(request,env);
 if(/^\/api\/sign-in(\/|$)/.test(path))return signInApi(request,env);
 if(/^\/api\/reader-auth(\/|$)/.test(path))return readerAuthApi(request,env);
 if(/^\/api\/reader-progress(\/|$)/.test(path))return readerProgressApi(request,env);
 if(/^\/api\/community-contributions(\/|$)/.test(path))return contributionsApi(request,env,ctx);
 if(/^\/api\/resource-(signups|subscribers|preferences)(\/|$)/.test(path))return resourcesApi(request,env);
 if(/^\/api\/career-(submissions|records|notifications)(\/|$)/.test(path))return api(request,env,ctx);
 const rolePage=careerRolePage(request);if(rolePage)return rolePage;
 const page=await careerPage(request,env);if(page)return page;
 return website.fetch(request,env,ctx);
}
export default {async fetch(incoming,env,ctx){
 const url=new URL(incoming.url),https=url.protocol==='https:';
 // Send plain-HTTP visitors to HTTPS (Cloudflare's Always Use HTTPS setting does the same at the edge).
 if(url.protocol==='http:'&&!localHosts.has(url.hostname)){url.protocol='https:';return redirect(url.toString(),false);}
 // One canonical host keeps sign-in cookies, passkeys, and provider callbacks on securebydesigninc.com.
 if(url.hostname==='www.securebydesigninc.com'){url.hostname='securebydesigninc.com';return redirect(url.toString(),https);}
 return protect(await route(withoutPlatformIdentity(incoming),env,ctx),https);
}};
