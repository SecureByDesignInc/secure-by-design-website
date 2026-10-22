// ATO Package Builder API for signed-in readers: /api/authorization/...
// The routes, rules and limits live in lib/authorization/api.mjs, shared with the browser copy the page uses when a
// learner works without an account (owner direction, 21 October 2026). Here the reader comes from the session cookie
// and the data from D1.
import {getReader} from './reader-auth.js';
import {authorizationHandler,authorizationLimits} from '../lib/authorization/api.mjs';

export {authorizationLimits};
export async function authorizationApi(request,env){
 let reader;try{reader=await getReader(request,env)}catch{return Response.json({error:'The workspace is unavailable. Please try again.'},{status:503,headers:{'cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff'}})}
 return authorizationHandler(request,env,reader);
}
