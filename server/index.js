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
import {federalJobsApi} from './federal-jobs.js';
import {authorizationApi} from './authorization.js';
import {hsts,protect} from './security-headers.js';
import trainingProgress from '../content/training-progress.json' with {type:'json'};
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
// Apple app links: the Secure By Design app (team PZK2PZT6KP) may open /app-auth/* and receive sign-in callbacks there.
const appId='PZK2PZT6KP.com.securebydesigninc.secureByDesignApp';
const appSiteAssociation=JSON.stringify({applinks:{details:[{appIDs:[appId],components:[{'/':'/app-auth/*',comment:'Sign-in hand-off back to the Secure By Design app'}]}]},webcredentials:{apps:[appId]}});
// Shown only if a sign-in callback opens in a browser instead of the app: one tap hands the one-time code to the app.
// The code expires in two minutes and is useless without the PKCE verifier the app holds.
function appCallbackPage(url){
 const code=url.searchParams.get('code')||'';
 const valid=/^[A-Za-z0-9_-]{16,128}$/.test(code);
 const body=valid?`<h1>Return to the Secure By Design app</h1><p>If the app didn't open on its own, tap the button. The link works once and expires in two minutes.</p><p><a class="button" href="securebydesign://auth?code=${code}">Open the app</a></p>`:`<h1>Open sign-in from the app</h1><p>This page finishes signing in to the Secure By Design app. Open the app, go to My Account, and choose Sign in.</p>`;
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Return to the app | Secure By Design</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.25rem;color:#0b2e4e;line-height:1.5}h1{font-size:1.5rem}.button{display:inline-block;min-height:44px;padding:.75rem 1.25rem;border-radius:.6rem;background:#1269b9;color:#fff;text-decoration:none;font-weight:600}</style></head><body>${body}</body></html>`,{status:valid?200:400,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'}});
}
const localHosts=new Set(['localhost','127.0.0.1','[::1]']);
const redirect=(location,https)=>new Response(null,{status:301,headers:{location,...(https?{'strict-transport-security':hsts}:{})}});
// Retired Community forms (careers, contributions, resource sign-ups) are closed until relaunch: no new
// personal data, no email. Owner reads and the email-preference links in sent emails keep working.
const retiredForms=new Set(['/api/career-submissions','/api/community-contributions','/api/resource-signups']);
// October 2026 library restructure: course 1.5 (connect-segment) was removed, and course 1.6 (pki-services)
// merged into course 1.4 (two-tier-pki). Old links land on the Configuration Hub or the merged course.
// Two libraries (15 October 2026): the Training Library became the Configuration Hub at /technical-training,
// and Network Authorization (course, ATO Package Builder, ATO Template Library) moved to the GRC & RMF Training
// Library at /grc-rmf-training. Old addresses land there; browsers keep the #fragment (#catalog/NN, #system=…).
const keepQuery=(target,url)=>{const next=new URL(target,url);next.search=url.search;return next.toString();};
function retiredCourse(url){
 const path=url.pathname;
 if(path==='/training'||path==='/training/')return keepQuery('/technical-training',url);
 if(path==='/authorization-workspace'||path==='/authorization-workspace/')return keepQuery('/grc-rmf-training/workspace',url);
 if(path.startsWith('/authorization-workspace/'))return keepQuery('/grc-rmf-training/workspace/'+path.slice('/authorization-workspace/'.length),url);
 if(path==='/training/ato-templates'||path==='/training/ato-templates/')return keepQuery('/grc-rmf-training/templates',url);
 if(/^\/training\/connect-segment(\/|$)/.test(path))return new URL('/technical-training',url).toString();
 if(/^\/training\/pki-services(\/|$)/.test(path)){
  const merged=new URL(path.replace(/^\/training\/pki-services\/SecureByDesign-pki-services-Workbook\./,'/training/two-tier-pki/SecureByDesign-two-tier-pki-Workbook.').replace(/^\/training\/pki-services/,'/training/two-tier-pki'),url);
  merged.search=url.search;return merged.toString();
 }
 // Network Authorization split (October 2026): the combined RMF Word catalog became one workbook per course. The
 // old download, which the app's saved materials still link to, lands on the course 2.1 workbook.
 if(path==='/training/rmf/Secure_By_Design_RMF_Training_Catalog.docx')return new URL('/grc-rmf-training/rmf/SecureByDesign-rmf-Workbook.docx',url).toString();
 if(path==='/training/rmf/catalog-cover.webp')return new URL('/grc-rmf-training/rmf/workbook-cover.webp',url).toString();
 const rmf=/^\/training\/rmf(?:\/(.*))?$/.exec(path);
 if(rmf)return keepQuery('/grc-rmf-training/rmf/'+(rmf[1]||''),url);
 // Network Authorization became one course (15 October 2026): the former 2.2 and 2.3 pages and their downloads land on
 // course 2.1 "RMF to ATO". Browsers keep the #catalog/NN or #evidence/<id> fragment, which the course page opens.
 const merged=/^\/training\/(rmf-body-of-evidence|rmf-authorization-to-operate)(?:\/(.*))?$/.exec(path);
 if(merged){
  const file=merged[2]||'',ext=/-Workbook\.(docx|pdf)$/.exec(file)?.[1];
  const target=ext?`/grc-rmf-training/rmf/SecureByDesign-rmf-Workbook.${ext}`:file.endsWith('-Learning-Package.zip')?'/grc-rmf-training/rmf/SecureByDesign-rmf-Learning-Package.zip':file==='workbook-cover.webp'?'/grc-rmf-training/rmf/workbook-cover.webp':'/grc-rmf-training/rmf/index.html';
  return new URL(target,url).toString();
 }
 // The Live Threat Map moved onto the homepage (15 October 2026); old links land on that section.
 if(path==='/threat-map'||path==='/threat-map/')return new URL('/#threat-map',url).toString();
 return null;
}
// Course guides 1.2–1.10 are static pages at /training/<id>/ (scripts/prepare-course-guides.mjs). Cloudflare's
// static assets normally add the trailing slash first; this covers anything that reaches the Worker. Browsers keep
// the #lesson fragment across the redirect.
const courseGuides=new Set(trainingProgress.map(item=>/^\/training\/([a-z0-9-]+)#/.exec(item.href)?.[1]).filter(Boolean));
function courseGuide(url){
 const match=/^\/training\/([a-z0-9-]+)$/.exec(url.pathname);
 return match&&courseGuides.has(match[1])?new URL(`/training/${match[1]}/${url.search}`,url).toString():null;
}
async function route(request,env,ctx){
 const path=new URL(request.url).pathname;
 const moved=retiredCourse(new URL(request.url));if(moved)return redirect(moved,false);
 const guide=courseGuide(new URL(request.url));if(guide)return redirect(guide,false);
 // Vulnerability-report contact (RFC 9116). public/.well-known/security.txt normally answers first.
 if(path==='/.well-known/apple-app-site-association'||path==='/apple-app-site-association')return new Response(appSiteAssociation,{headers:{'content-type':'application/json','cache-control':'public, max-age=3600'}});
 if(path==='/app-auth/callback')return appCallbackPage(new URL(request.url));
 if(path==='/.well-known/security.txt'||path==='/security.txt')return new Response(securityTxt,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=86400'}});
 if(request.method==='POST'&&retiredForms.has(path.replace(/\/$/,''))){try{await request.body?.cancel();}catch{}return Response.json({error:'This form is closed for now. Nothing was submitted.'},{status:410,headers:{'cache-control':'no-store'}});}
 if(/^\/api\/native-activity(\/|$)/.test(path))return nativeActivityApi(request,env);
 if(/^\/api\/native-progress(\/|$)/.test(path))return nativeProgressApi(request,env);
 if(/^\/api\/native-auth(\/|$)/.test(path))return nativeAuthApi(request,env);
 if(path==='/api/native-onboarding')return nativeOnboardingApi(request,env);
 if(/^\/api\/sign-in(\/|$)/.test(path))return signInApi(request,env);
 if(path==='/api/community/federal-jobs')return federalJobsApi(request,env,ctx);
 if(/^\/api\/reader-auth(\/|$)/.test(path))return readerAuthApi(request,env);
 if(/^\/api\/reader-progress(\/|$)/.test(path))return readerProgressApi(request,env);
 if(/^\/api\/authorization(\/|$)/.test(path))return authorizationApi(request,env);
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
