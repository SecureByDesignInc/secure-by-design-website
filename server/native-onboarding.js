import {getNativeReader,nativeRequestAllowed} from './native-auth.js';
import {createEnrollmentHandler,resendEventSender} from './onboarding/enrollment.mjs';
export function nativeOnboardingApi(request,env){
 if(!nativeRequestAllowed(request))return Response.json({error:'Use the Secure By Design app for this request.'},{status:403,headers:{'cache-control':'no-store'}});
 return createEnrollmentHandler({
  authenticate:req=>getNativeReader(req,env),db:env.DB,
  sendEvent:resendEventSender(env.RESEND_AUTOMATIONS_API_KEY),
  enabled:env.APP_ONBOARDING_EMAIL_ENABLED==='true'&&!!env.RESEND_AUTOMATIONS_API_KEY,
  transport:'native'
 })(request);
}
