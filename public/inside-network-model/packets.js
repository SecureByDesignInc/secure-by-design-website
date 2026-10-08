// What one packet in each traffic step carries, in the layered style of a packet analyzer.
// Addresses come from the architecture; ports from the protocol references in technical.js.
// Example values (a client address from the pool, a dynamic port) are labeled as examples.
const domain='sbd.test';
const dnsQuery=(question,answer)=>({
 app:'Domain Name System (DNS)',request:`Standard query · ${question}`,reply:answer?`Standard query response · ${answer}`:null,
 readable:'Everything: the name asked for, the record type, and the answer. DNS is not encrypted in this design.',
 protected:'Nothing on the wire. Integrity depends on the internal DNS servers and the network path.'
});
const kerberos=(request,reply,readable)=>({
 app:'Kerberos',request,reply,readable,
 protected:'Tickets, session keys, and the encrypted proof of identity. The password itself never crosses the network.'
});
const asRequest='The realm, the user’s principal name, and the service requested (the ticket-granting service). The pre-authentication timestamp is encrypted.';
const tlsData=(inside,readable='Addresses, ports, and the server name in the TLS ClientHello. With TLS 1.2 the server certificate is visible too; TLS 1.3 encrypts it.')=>({
 app:'TLS',request:`Application data · ${inside}`,reply:'Application data · the encrypted response',readable,protected:'All application content: requests, responses, and any credentials.'
});
const undefinedTransport=what=>({
 app:'Not yet defined',request:`${what} · the method is still to be chosen`,reply:null,
 readable:'Unknown until the transport is chosen. The model does not guess ports or protocols.',
 protected:'Choose a protected method (for example, TLS with verified certificates) before the rule is validated.'
});
const synOnly=(service,port)=>({
 app:service,request:`TCP SYN · a connection attempt to port ${port}`,reply:null,syn:true,
 readable:'Addresses and ports. No application data is sent until a TCP handshake completes, and this one never does.',
 protected:'Nothing to protect: the session is never established.'
});
const dc1='SBD-DC01',locator=`SRV _ldap._tcp.dc._msdcs.${domain}`;
export const packetProfiles={
 'signin:0':{app:'Dynamic Host Configuration Protocol (DHCP)',request:'DHCPDISCOVER · broadcast from a client with no address yet',reply:null,srcAddress:'0.0.0.0 (no address yet)',dstAddress:'255.255.255.255 (broadcast)',srcPort:'68',dstPort:'67',
  readable:'The client’s hardware (MAC) address, its host name option, and the options it asks for.',protected:'Nothing. DHCP is not encrypted, which is why relay and scope settings need careful validation.',
  note:'A broadcast stays inside VLAN 80. The core’s DHCP relay forwards it to SBD-DHCP01 as unicast, under rule F04, and the lease comes from the 10.0.80.100–199 pool.'},
 'signin:1':dnsQuery(locator,`SRV records for ${dc1} and SBD-DC02`),
 'signin:2':kerberos(`AS-REQ · a user asks the Key Distribution Center for a ticket-granting ticket (realm ${domain.toUpperCase()})`,'AS-REP · the ticket-granting ticket, encrypted',asRequest),
 'signin:3':{app:'Lightweight Directory Access Protocol (LDAP)',request:'searchRequest · the computer object and its Group Policy links, after a Kerberos (SASL) bind',reply:'searchResEntry · the requested attributes',dstPort:'389',
  readable:'Addresses, ports, and the LDAP message framing. With a Kerberos bind, Windows seals the session, so the queries and results are not readable.',protected:'Queries and results: signed for integrity and sealed (encrypted) with the Kerberos session key. LDAPS on 636 would use TLS instead.',
  note:'Rule F03 permits the full directory profile for domain members. Group Policy files follow over SMB 445 from SYSVOL.'},
 'files:0':dnsQuery(`A SBD-FS01.${domain}`,'A 10.0.40.10'),
 'files:1':kerberos('TGS-REQ · the client presents its ticket-granting ticket and asks for a ticket to the file service on SBD-FS01','TGS-REP · a service ticket for SBD-FS01, encrypted','The realm and the name of the service requested. The client’s identity travels inside the encrypted ticket and authenticator.'),
 'files:2':{app:'SMB2',request:'CREATE · open a file on the approved share',reply:'CREATE response, then READ data',
  readable:'Without SMB encryption: commands, share and file names, and file contents. Signing proves integrity but does not hide content.',protected:'With SMB encryption enabled for the share: file names and contents. Whether to require it is a data-policy decision.'},
 'updates:1':tlsData('a request for update metadata (approvals and the files to fetch)'),
 'updates:2':{app:'HTTP',request:'GET · an approved update file from WSUS',reply:'200 OK · the signed update file',
  readable:'Everything: the URL, the headers, and the update file itself.',protected:'Integrity only: the package signature lets the client detect tampering before installing.'},
 'logs:0':{app:'WS-Management (WinRM) over HTTP',request:'Events · a batch of subscribed security events pushed to the collector',reply:null,dstPort:'5985',
  readable:'Addresses, ports, and the HTTP headers.',protected:'The event content: Kerberos authenticates both ends and encrypts the message body, even on port 5985.',
  note:'Source-initiated subscription (rule F17): the domain controller pushes; the collector never reaches into it.'},
 'logs:1':{...tlsData('syslog messages, framed as RFC 5425 specifies','Addresses, ports, and the TLS handshake.'),reply:null,note:'Delivery only. TCP acknowledges the data, but the collector sends no application reply.'},
 'logs:2':{...tlsData('forwarded events in Splunk’s forwarding protocol','Addresses, ports, and the TLS handshake.'),reply:null,dstPort:'9997',note:'Rule F10. The forwarder queues events if Splunk is down and replays them later.'},
 'logs:3':{app:'SMB 3',request:'WRITE · a dated archive file to the repository share',reply:null,dstPort:'445',
  readable:'With SMB 3 encryption: addresses, ports, and the session setup.',protected:'File names and archive contents. The archival account can write but not delete.',note:'Rule F11. Each archive is hashed and cataloged when it arrives.'},
 'license:0':{app:'Vendor licensing protocol',request:'License check · the client asks the licensing service for its entitlement',reply:'Entitlement response · granted or refused by the license manager',dstPort:'Registered vendor port (recorded per application)',
  readable:'Depends on the vendor protocol. At least the addresses and the registered port; some products also send license and host names in the clear.',protected:'Depends on the product. Record whether each vendor protocol encrypts or signs its messages when you register its port.',
  note:'Rule F12 permits each application’s registered vendor port to SBD-APPS01. The port is recorded per application, so the model shows no single number.'},
 'web:0':dnsQuery('A or AAAA · the web service’s internal name','A 10.0.40.40'),
 'web:1':{app:'TLS',request:'ClientHello · the browser offers TLS versions and ciphers and names the server it expects',reply:'ServerHello and certificate · issued by the internal issuing CA',
  readable:'Addresses, ports, the server name in the ClientHello, and the offered TLS versions and ciphers. With TLS 1.2 the certificate is visible; TLS 1.3 encrypts it.',protected:'Once the handshake completes, everything inside the session.'},
 'web:2':{app:'HTTP',request:'GET · the issuing CA’s CRL from pki.sbd.test',reply:'200 OK · the signed certificate revocation list',dstPort:'80',
  readable:'Everything: the URL and the list of revoked serial numbers. Nothing secret is in a CRL.',protected:'Integrity only: the issuing CA’s signature on the CRL lets the client detect tampering.',note:'Rule F18. Without this path, clients either fail validation or silently skip the revocation check.'},
 'web:3':tlsData('an HTTP request for the application'),
 'dc-down:0':{...dnsQuery(locator,null),note:'SBD-DC01 is down, so no response comes back. The client waits for its timeout, then tries its next DNS server.'},
 'dc-down:1':dnsQuery(locator,`SRV records for ${dc1} and SBD-DC02`),
 'dc-down:2':kerberos(`AS-REQ · to the Key Distribution Center on SBD-DC02 (realm ${domain.toUpperCase()})`,'AS-REP · the ticket-granting ticket, encrypted',asRequest),
 'cert-expired:0':dnsQuery('A or AAAA · the web service’s internal name','A 10.0.40.40'),
 'cert-expired:1':{app:'TLS',request:'ClientHello · the browser starts the handshake',reply:'ServerHello and certificate · its validity period has ended',
  readable:'The handshake. With TLS 1.2 the expired certificate is visible on the wire; TLS 1.3 encrypts it.',protected:'No application data is ever sent.',note:'The browser checks the dates, ends the handshake with a fatal alert (for example, certificate_expired), and closes the connection.'},
 'pc-to-sql:0':{...synOnly('SQL Server (TDS)','1433'),note:'No exception exists for workstation-to-SQL traffic, so default deny drops it at the core.'},
 'peer-rdp:0':{...synOnly('Remote Desktop Protocol (RDP)','3389'),note:'Both PCs share VLAN 80, so this never reaches the core. The destination’s host firewall refuses it (rule D02).'},
 'drill:0':{...synOnly('SQL Server (TDS)','1433'),note:'No exception exists for workstation-to-SQL traffic, so default deny drops it at the core.'},
 'drill:1':{...synOnly('Splunk Web','8000 (the product default)'),note:'No rule lets user workstations reach security-tool management, so default deny drops it at the core.'},
 'drill:2':{...synOnly('SMB','445'),note:'Same VLAN, so this never reaches the core. The destination’s host firewall refuses it (rule D01).'},
 'drill:3':{...synOnly('Remote Desktop Protocol (RDP)','3389'),note:'Same VLAN, so this never reaches the core. The destination’s host firewall refuses it (rule D02).'},
 'drill:4':{...synOnly('SQL Server (TDS)','1433'),note:'Both servers share VLAN 40, so the core never sees this. Rule F14 denies it: SBD-WEB01 has no database dependency, so SBD-SQL01’s host firewall refuses it. Only SBD-APPS01 may connect (F22).'},
 'drill:5':{...synOnly('Remote administration','—'),request:'TCP SYN · a remote administration connection attempt',dstPort:'Depends on the management tool',note:'ADMIN-PC01 manages user endpoints only. No rule lets it manage a domain controller, so default deny drops it at the core.'}
};

const transportOf=step=>step.stream==='udp'?'UDP':step.stream==='either'?'TCP or UDP':'TCP';
const portOf=step=>{const m=String(step.detail||'').match(/\b(\d{2,5})\b/);return m?m[1]:null;};
const exampleClient='10.0.80.117 (example from the 10.0.80.100–199 pool)';
/**
 * Builds the inspector card for one frozen packet.
 * info: {kind:'request'|'reply', where:'before-core'|'core'|'after-core'|'gate'|'path'}
 */
export function describePacket({sequence,stepIndex,step,policy,info,name,address,sameVlan=false}){
 const profile=packetProfiles[`${sequence.id}:${stepIndex}`]||undefinedTransport(step.protocol);
 const reply=info.kind==='reply';
 const client=step.from==='workstations'?exampleClient:address(step.from)||name(step.from);
 const server=step.to==='workstations'?(step.from==='workstations'?'10.0.80.142 (another PC in the pool, example)':exampleClient):address(step.to)||name(step.to);
 const src=profile.srcAddress||client,dst=profile.dstAddress||server;
 const port=profile.dstPort||portOf(step)||'Not defined',dynamic='Dynamic client port (example: 51734)';
 const srcPort=profile.srcPort||dynamic,dstPort=profile.dstPort||port;
 const where={
  'before-core':reply?`Leaving ${name(step.to)}, heading back through the core`:`Leaving ${name(step.from)}, heading for the core switch`,
  core:'At the core switch: the rule check',
  'after-core':reply?`Past the core, returning to ${name(step.from)}`:`Past the core, on its way to ${name(step.to)}`,
  gate:sameVlan?`At ${name(step.to)}’s host firewall: about to be refused`:'At the core’s enforcement point: about to be dropped',
  path:sameVlan?'Switched inside the VLAN, without crossing the core':'On the wire'
 }[info.where]||'On the wire';
 const decision={
  traffic:`Permitted by ${policy.rule?.id}${policy.rule?.purpose?` · ${policy.rule.purpose}`:''}.`,
  pending:`${policy.rule?.id&&policy.rule.id!=='UNDEFINED'?policy.rule.id:'No rule yet'} is written but blocked until it is validated, so this packet is dropped.`,
  deny:policy.rule?.id==='DEFAULT-DENY'?'No exception matches, so default deny (SC-7(5)) drops it.':`Rule ${policy.rule?.id} denies it: ${policy.rule?.purpose||'explicitly blocked'}.`,
  unreachable:`Permitted by ${policy.rule?.id}, but ${name(step.to)} is down, so nothing answers.`,
  rejected:`Permitted by ${policy.rule?.id}. The client then rejects the server’s expired certificate.`
 }[policy.kind]||policy.label;
 return {
  title:reply?'Reply packet':profile.syn?'Connection attempt':'Request packet',app:profile.app,
  summary:reply?profile.reply||'Response':profile.request,
  where,
  layers:[
   ['Internet Protocol',[['Source',reply?dst:src],['Destination',reply?src:dst]]],
   [transportOf(step)==='TCP or UDP'?'TCP or UDP':transportOf(step),[['Source port',reply?dstPort:srcPort],['Destination port',reply?srcPort:dstPort]]],
   [profile.app,[[reply?'Response':'Message',reply?profile.reply||'Response':profile.request]]]
  ],
  readable:profile.readable,protectedText:profile.protected,decision,note:profile.note||''
 };
}
