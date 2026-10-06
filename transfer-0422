import {EVENT, CONSENT_VERSION, CONSENT_TEXT} from './sequence.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});

/** SERVER ONLY. authenticate must verify the real account session on every call.
 * Never bind it to request JSON, email input, PostHog IDs, or unsigned claims.
 * The current adapter is for the existing same-origin cookie account service.
 */
export function createEnrollmentHandler({authenticate,db,sendEvent,enabled=false,origin='https://securebydesigninc.com',transport='browser'}) {
  return async function enroll(request) {
    try {
      if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
      if(transport==='native') {
        if(request.headers.has('origin')||request.headers.has('sec-fetch-site')||request.headers.get('x-sbd-client')!=='native-v1')return json({error:'Use the Secure By Design app for this request.'},403);
      } else if(transport!=='browser' || (request.method==='POST' && (request.headers.get('origin')!==origin || new URL(request.url).origin!==origin || request.headers.get('sec-fetch-site')==='cross-site')))return json({error:'Please reload and try again.'},403);
      const account=await authenticate(request);
      if(!account?.id || account.emailVerified!==true)return json({error:'Sign in with a verified account first.'},401);
      if(!enabled)return json({error:'Getting-started emails are not available yet.'},503);
      if(request.method==='GET'){
        const row=await db.prepare('SELECT state FROM app_email_enrollments WHERE account_id=? AND sequence=?').bind(account.id,EVENT).first();
        return json({enrollment:row?.state||'not_enrolled',consentVersion:CONSENT_VERSION,consentText:CONSENT_TEXT});
      }
      if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Invalid request.'},400);
      // Bound streamed input, including requests with no content-length header.
      const reader=request.body?.getReader();if(!reader)return json({error:'Consent is required.'},400);
      let text='',size=0;const decoder=new TextDecoder();
      while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return json({error:'Request too large.'},413)}text+=decoder.decode(value,{stream:true})}
      let body;try{body=JSON.parse(text+decoder.decode())}catch{return json({error:'Invalid request.'},400)}
      if(!body||Array.isArray(body)||Object.keys(body).some(k=>!['consent','consentVersion'].includes(k))||body.consent!==true||body.consentVersion!==CONSENT_VERSION)return json({error:'Please choose whether to receive the three-message series.'},400);
      const now=new Date().toISOString();
      // Atomic claim: two devices or repeated sign-ins cannot start two series.
      const claim=await db.prepare('INSERT INTO app_email_enrollments (account_id,sequence,consent_at,consent_version,consent_text,state,updated_at) VALUES (?,?,?,?,?,\'dispatching\',?) ON CONFLICT(account_id,sequence) DO NOTHING RETURNING account_id').bind(account.id,EVENT,now,CONSENT_VERSION,CONSENT_TEXT,now).first();
      if(!claim){
        const existing=await db.prepare('SELECT state FROM app_email_enrollments WHERE account_id=? AND sequence=?').bind(account.id,EVENT).first();
        return existing?.state==='accepted'?json({enrollment:'accepted',alreadyEnrolled:true}):json({enrollment:existing?.state||'review_required',error:'Your earlier request is being checked. It will not be sent twice.'},409);
      }
      try {
        await sendEvent({event:EVENT,email:account.email,payload:{sequence_version:CONSENT_VERSION}});
        await db.prepare("UPDATE app_email_enrollments SET state='accepted',updated_at=? WHERE account_id=? AND sequence=?").bind(new Date().toISOString(),account.id,EVENT).run();
        return json({enrollment:'accepted'},202);
      } catch {
        // /events/send has no documented idempotency contract. A timeout can
        // mean accepted. Retain the claim and require provider-log reconciliation
        // rather than silently retrying and generating duplicate sequences.
        await db.prepare("UPDATE app_email_enrollments SET state='review_required',updated_at=? WHERE account_id=? AND sequence=?").bind(new Date().toISOString(),account.id,EVENT).run();
        return json({enrollment:'review_required',error:'We could not confirm your email request. Please contact support; your request will not be sent twice.'},502);
      }
    }catch{return json({error:'Email preferences are temporarily unavailable.'},503)}
  };
}

export function resendEventSender(apiKey,fetcher=fetch) {
  return async event=>{
    if(!apiKey)throw Error('Email service unavailable');
    const response=await fetcher('https://api.resend.com/events/send',{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),
      headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},
      body:JSON.stringify(event),
    });
    if(response.status!==202)throw Error('Event not confirmed');
  };
}
