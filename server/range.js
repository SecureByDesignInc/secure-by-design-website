// Cyber Range API for the Worker: /api/range/... (owner direction, 26 October 2026). The routes, rules and limits
// live in lib/range/api.mjs; here the reader comes from the session cookie (a visitor is null and still gets the
// public routes) and the data from D1. The content is read once at build time.
import {getReader} from './reader-auth.js';
import {createRangeApi,rangeLimits} from '../lib/range/api.mjs';
import systems from '../content/range/systems.json' with {type:'json'};
import residents from '../content/range/residents.json' with {type:'json'};
import questions from '../content/range/questions.json' with {type:'json'};

export {rangeLimits};
const handler=createRangeApi({systems,residents,questions});
export async function rangeApi(request,env){
 let reader=null;
 try{reader=await getReader(request,env)}catch{return Response.json({error:'The Range is unavailable. Please try again.'},{status:503,headers:{'cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff'}})}
 return handler(request,env,reader);
}
