// Short checks per traffic process, in the same format as the configuration course quizzes.
export const knowledgeChecks={
 signin:[
  {question:'Once the workstation has its network settings, how does it find a domain controller?',answers:['It broadcasts to every server on VLAN 10','It asks internal DNS for the domain’s service records','It reads the address from its Kerberos ticket','It asks the offline root CA'],correct:1,explanation:'Domain controllers register service (SRV) records in DNS. Clients query internal DNS to find them, which is why domain members must use the internal DNS servers.'},
  {question:'What does the workstation receive from the Key Distribution Center when it authenticates?',answers:['A ticket-granting ticket','An IP address lease','A server certificate','Group Policy files'],correct:0,explanation:'The KDC on the domain controller issues a ticket-granting ticket. The client later uses it to request service tickets; authentication alone does not grant access to resources.'},
  {question:'In this design, why does the DHCP request stop at the core switch?',answers:['The DHCP server is offline','Workstations use static addresses','Its relay rule (F04) is still pending validation, and unmatched traffic is denied by default','DHCP traffic is always encrypted'],correct:2,explanation:'Rule F04 is written but stays blocked until the relay and scope settings are validated. With default deny, nothing crosses the core without an approved exception.'}
 ],
 files:[
  {question:'Which port does SMB use to reach SBD-FS01?',answers:['TCP 3389','UDP 53','TCP 445','TCP 443'],correct:2,explanation:'SMB uses TCP 445. Rule F05 permits it from the workstations to the file server only.'},
  {question:'Kerberos has authenticated the user. What still decides whether they can open the file?',answers:['Share and file system permissions on SBD-FS01','The core switch','DNS','The DHCP lease'],correct:0,explanation:'Authentication proves who the user is. The file server’s share and file system permissions decide what that user may open.'}
 ],
 updates:[
  {question:'How do Windows updates get into this air-gapped network?',answers:['WSUS downloads them from Microsoft Update','An authorized person imports approved media through a controlled process','Workstations download them directly','The offline root CA forwards them'],correct:1,explanation:'There is no internet path. Update material crosses the air gap on approved media, with custody records, scanning, and signature checks, before WSUS distributes it.'},
  {question:'WSUS sends update content over HTTP on port 8530. What protects that content?',answers:['TLS encryption','Kerberos tickets','The DHCP relay','Digital signatures on the update packages'],correct:3,explanation:'TLS on 8531 protects the metadata connection. Content on 8530 is not encrypted, but the packages are signed, so tampering is detected.'}
 ],
 logs:[
  {question:'Which port does syslog over TLS use?',answers:['UDP 514','TCP 6514','TCP 443','TCP 1433'],correct:1,explanation:'RFC 5425 assigns TCP 6514 to syslog over TLS. Plain syslog commonly uses UDP 514, without encryption or delivery guarantees.'},
  {question:'Why do the Splunk and archive deliveries stop at the core?',answers:['Their ingestion methods aren’t chosen yet, so rules F10 and F11 stay blocked','Splunk only accepts UDP','The audit repository is offline','Logs never leave VLAN 20'],correct:0,explanation:'Until the forwarding and archive methods are selected and validated, there is nothing specific to permit. Pending rules stay blocked.'}
 ],
 license:[
  {question:'Why doesn’t the model show a port for the license check?',answers:['License servers never use the network','The port is classified','The licensing vendor and its protocol haven’t been identified','Licensing uses the SMB port'],correct:2,explanation:'Licensing protocols are product-specific. The model doesn’t guess a port; rule F12 stays pending until the vendor’s requirements are documented.'},
  {question:'What happens to traffic that doesn’t match any approved exception?',answers:['It is denied by default','It is allowed and logged','It is redirected to Splunk','It waits until a rule is written'],correct:0,explanation:'Default deny (SC-7(5)) means only documented, approved exceptions can pass. Everything else is blocked.'}
 ],
 trust:[
  {question:'How does the offline root CA sign the issuing CA’s certificate?',answers:['Over a dedicated network link','In a controlled offline ceremony, with artifacts carried on approved media','Through the jump box','Automatically through Group Policy'],correct:1,explanation:'The root never connects to a network. The signing request and the signed certificate move on approved media, carried by authorized people.'},
  {question:'Why keep the root CA offline?',answers:['To save power','Because it has no operating system','To protect the trust anchor’s private key from network attacks','Because clients never need its certificate'],correct:2,explanation:'If the root key were compromised, every certificate beneath it would be untrustworthy. Keeping it offline removes network attack paths. Clients still trust its certificate, which is distributed in advance.'}
 ],
 web:[
  {question:'When the browser checks SBD-WEB01’s certificate, how does it trust the offline root?',answers:['It connects to the offline root','It uses the root certificate already installed on the client','It asks the core switch','It trusts any certificate on the internal network'],correct:1,explanation:'Trust anchors are distributed in advance. Validation happens on the client, so the root can stay offline.'},
  {question:'Which port does HTTPS use here?',answers:['TCP 80','TCP 8531','UDP 53','TCP 443'],correct:3,explanation:'HTTPS uses TCP 443. Rule F13 permits the workstations to reach SBD-WEB01 on it.'},
  {question:'The TLS session is up. What decides what the user can see in the application?',answers:['The application’s own authentication and authorization','The TLS certificate','The core switch','DNS'],correct:0,explanation:'TLS protects the connection. The application still has to authenticate users and authorize each request.'}
 ],
 drill:[
  {question:'Why does the web server’s attempt to reach SQL never reach the core switch?',answers:['The core is offline','Both servers are in VLAN 40, so the traffic is switched inside the VLAN and the host firewall must enforce policy','SQL only accepts UDP','The web server has no network address'],correct:1,explanation:'Traffic between hosts on the same VLAN never crosses the routed boundary. That is why the design adds host firewalls inside VLANs 40, 50, 60, and 80.'},
  {question:'Which rule stops a compromised PC from opening remote desktop to its neighbour?',answers:['F13','Default deny at the core','D02, enforced by the destination’s host firewall','F05'],correct:2,explanation:'Rule D02 denies peer RDP (and D01 denies peer SMB). Both PCs share VLAN 80, so the destination’s host firewall does the enforcing.'},
  {question:'An endpoint administrator’s session is stolen. Why can’t it be used to manage a domain controller?',answers:['Domain controllers have no management ports','Tiered administration: ADMIN-PC01 may manage user endpoints only, and nothing permits it to reach a DC','The core blocks all administration','MFA is turned off'],correct:1,explanation:'Separate administration hosts and scoped accounts mean one stolen session reaches one tier. Unmatched traffic falls to default deny.'}
 ]
};
