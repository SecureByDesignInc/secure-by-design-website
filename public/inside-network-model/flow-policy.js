// Connects each teaching step to the model's policy register, so motion and labels
// show what this design actually permits, blocks pending validation, or denies.
import {trafficRules,evaluateFlow,policyStatus} from './security.js';

export function serviceFor(step){
 const protocol=step.protocol.toLowerCase();
 if(protocol.includes('management'))return 'Management';
 if(protocol.includes('kerberos'))return 'Kerberos';
 if(protocol.includes('dns'))return 'DNS';
 if(protocol.includes('dhcp'))return 'DHCP';
 if(protocol.includes('ldap'))return 'Directory';
 if(protocol.includes('smb'))return 'SMB';
 if(protocol.includes('wsus')||step.to==='wsus')return 'WSUS';
 if(protocol.includes('syslog'))return 'Syslog TLS';
 if(protocol.includes('https'))return 'HTTPS';
 if(protocol.includes('rdp'))return 'RDP';
 if(protocol.includes('sql'))return 'SQL';
 return null;
}

/**
 * kind: traffic (permitted), pending (blocked pending validation), deny, manual (offline, no network session),
 * unreachable (permitted but the destination does not answer), rejected (permitted, then refused by an endpoint).
 */
export function stepPolicy(step){
 if(step.manual||step.from==='root'||step.to==='root')return {kind:'manual',rule:null,label:'Offline process · no network session'};
 const from=step.from,to=step.to,service=serviceFor(step);
 const rules=trafficRules.filter(r=>r.from.includes(from)&&r.to.includes(to));
 let rule=rules.find(r=>r.service===service)||(rules.length===1&&!service?rules[0]:null);
 if(!rule&&service){const decision=evaluateFlow(from,to,service);if(decision.status==='deny')rule=decision;}
 const status=step.unverified?'pending':rule?.status||'deny';
 const id=rule?.id||'DEFAULT-DENY';
 if(status==='deny')return {kind:'deny',rule:{...(rule||{}),id,status:'deny'},label:`${id==='DEFAULT-DENY'?'Default deny':id} · ${policyStatus.deny}`};
 if(status==='pending')return {kind:'pending',rule:rule?{...rule,status:'pending'}:{id:'UNDEFINED',status:'pending'},label:`${rule?.id||'No rule yet'} · ${policyStatus.pending}`};
 if(step.outcome==='unreachable')return {kind:'unreachable',rule,label:`${rule.id} · Permitted, but no response`};
 if(step.outcome==='rejected')return {kind:'rejected',rule,label:`${rule.id} · Permitted, then refused by the client`};
 return {kind:'traffic',rule,label:`${rule.id} · ${policyStatus.permit}`};
}

/** Short label shown in 3D at the enforcement point. */
export function gateText(policy,step){
 if(policy.kind==='pending')return [policy.rule.id==='UNDEFINED'?'NO RULE YET':`${policy.rule.id} · PENDING`,'Blocked until validated'];
 if(policy.kind==='deny')return step.from===step.to?[`${policy.rule.id} · HOST FIREWALL`,'Denied on the destination']:[policy.rule.id==='DEFAULT-DENY'?'DEFAULT DENY':`${policy.rule.id} · DENY`,'No matching exception'];
 return [`${policy.rule.id} · PERMIT`,policy.rule.service||'Explicit exception'];
}
