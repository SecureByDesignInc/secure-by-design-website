export const EVENT = 'sbd.app.onboarding.v1';
export const CONSENT_VERSION = 'app-onboarding-v1';
export const CONSENT_TEXT = 'Email me three getting-started messages from Secure By Design: a welcome, a learning tip after 3 days, and a feedback request after 7 days. I can unsubscribe at any time.';

// Template aliases are stable; create and publish them before enabling this flow.
export const messages = [
  {key: 'welcome', alias: 'sbd-app-welcome-v1', subject: 'A small first step with Secure By Design',
    paragraphs: ['Welcome to Secure By Design. You do not need to learn everything at once.', 'Open the app and choose one path: Active Directory, Security Monitoring, or Risk Management Framework. Try the first lesson and its knowledge check at your own pace.', 'What are you hoping to get better at? Reply to this email and tell us.'],
    link: 'https://securebydesigninc.com/technical-training', label: 'Explore the Technical Training Library'},
  {key: 'tip', alias: 'sbd-app-learning-tip-v1', subject: 'Keep your useful cybersecurity references together',
    paragraphs: ['A small habit can make your next learning session easier.', 'In the app, open Resources and bookmark one reference that you want to come back to. Use the Saved filter to find it again.', 'The current app preview keeps lesson progress and bookmarks on your device. Choose one small next step and build from there.'],
    link: 'https://securebydesigninc.com/technical-training', label: 'Find something to explore'},
  {key: 'feedback', alias: 'sbd-app-feedback-v1', subject: 'What should Secure By Design help you learn next?',
    paragraphs: ['What would make Secure By Design more useful to you?', 'Reply with one topic you want explained, something that felt confusing, or an improvement you would like to see. You can also suggest an idea or vote on our feedback board.', 'Board posts are public, so keep personal or confidential information out. Thanks for helping shape what comes next.'],
    link: 'https://securebydesign.userjot.com/', label: 'Share an idea'},
];

const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderTemplate(message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(message.subject)}</title></head><body style="margin:0;background:#050b14;color:#f3f7ff;font:16px/1.7 Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#102237;border:1px solid #23374b;border-radius:24px"><tr><td style="padding:32px;background:#17344f;background:linear-gradient(135deg,#284f70,#17344f,#102237);border-radius:24px 24px 0 0"><p style="margin:0;color:#83dcfa;font-weight:bold">SECURE BY DESIGN</p><h1 style="font-size:27px;line-height:1.3;margin-bottom:0">${escape(message.subject)}</h1></td></tr><tr><td style="padding:16px 32px 32px">${message.paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}<p><a href="${escape(message.link)}" style="display:inline-block;background:#83dcfa;color:#050b14;border-radius:12px;padding:12px 20px;font-weight:bold;text-decoration:none">${escape(message.label)}</a></p><p>Secure By Design</p><p style="font-size:13px;color:#aebdd0">You requested the three-message app getting-started series. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#83dcfa">Unsubscribe</a> from these emails at any time.</p></td></tr></table></td></tr></table></body></html>`;
}

export function automationDefinition() {
  const steps = [{key:'start',type:'trigger',config:{event_name:EVENT}}];
  const connections = [];
  let previous = 'start';
  for (const [index, message] of messages.entries()) {
    if (index) {
      const key = `wait_${message.key}`;
      steps.push({key,type:'delay',config:{duration:index===1?'3 days':'4 days'}});
      connections.push({from:previous,to:key}); previous=key;
    }
    const gate=`consent_${message.key}`;
    steps.push({key:gate,type:'condition',config:{type:'rule',field:'contact.unsubscribed',operator:'eq',value:false}});
    connections.push({from:previous,to:gate});
    steps.push({key:message.key,type:'send_email',config:{template:{id:message.alias},reply_to:'support@securebydesigninc.com'}});
    connections.push({from:gate,to:message.key,type:'condition_met'});
    // A terminal delay gives the false branch a valid destination without
    // sending anything or changing the contact's subscription preferences.
    const end=`end_${message.key}`;
    steps.push({key:end,type:'delay',config:{duration:'1 second'}});
    connections.push({from:gate,to:end,type:'condition_not_met'});
    previous=message.key;
  }
  return {name:'Secure By Design — App getting started',status:'disabled',steps,connections};
}
