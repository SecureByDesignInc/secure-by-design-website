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
// The site now runs on its own Cloudflare Worker. ChatGPT Sites used to inject the oai-authenticated-* identity
// headers; nothing does now, so any such header comes from the client and must not be trusted.
function withoutPlatformIdentity(request){
 const names=[...request.headers.keys()].filter(name=>name.startsWith('oai-'));
 if(!names.length)return request;
 const headers=new Headers(request.headers);for(const name of names)headers.delete(name);
 return new Request(request,{headers});
}
const localHosts=new Set(['localhost','127.0.0.1','[::1]']);
const hsts='max-age=31536000';
async function route(request,env,ctx){
 const path=new URL(request.url).pathname;
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
 return careerRolePage(request)||careerPage(request,env)||website.fetch(request,env,ctx);
}
export default {async fetch(incoming,env,ctx){
 const url=new URL(incoming.url);
 // Send plain-HTTP visitors to HTTPS (Cloudflare's Always Use HTTPS setting does the same at the edge).
 if(url.protocol==='http:'&&!localHosts.has(url.hostname)){url.protocol='https:';return Response.redirect(url.toString(),301);}
 // One canonical host keeps sign-in cookies, passkeys, and provider callbacks on securebydesigninc.com.
 if(url.hostname==='www.securebydesigninc.com'){url.hostname='securebydesigninc.com';return Response.redirect(url.toString(),301);}
 const response=await route(withoutPlatformIdentity(incoming),env,ctx);
 if(url.protocol!=='https:'||response.headers.has('strict-transport-security'))return response;
 try{response.headers.set('strict-transport-security',hsts);return response;}
 catch{const copy=new Response(response.body,response);copy.headers.set('strict-transport-security',hsts);return copy;}
}};
