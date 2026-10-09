// Reference-derived planning topology, not a deployed inventory or approved rule set.
export const vlans = [
 {id:'v10',number:10,name:'Domain controllers',subnet:'10.0.10.0/24',color:'#70b7ff',x:-30,z:-19,w:18,d:15,ids:['dc1','dc2'],functions:['Directory authentication','Internal DNS and global catalog','Directory and SYSVOL replication'],controls:['AC-2','AC-6','IA-2','SC-7','CP-9'],boundary:'Restrict directory administration; allow only documented identity and DNS dependencies.'},
 {id:'v20',number:20,name:'Identity & services',subnet:'10.0.20.0/24',color:'#94d779',x:-10,z:-19,w:18,d:15,ids:['dhcp','syslog','wsus'],functions:['DHCP scopes and reservations','Central log collection','Offline Windows update distribution'],controls:['CM-6','CM-8','SI-2','AU-12'],boundary:'Define DHCP relay and approved update and collection routes. No internet upstream.'},
 {id:'v30',number:30,name:'PKI infrastructure',subnet:'10.0.30.0/24',color:'#bf9dff',x:10,z:-19,w:18,d:15,ids:['subca','templates'],functions:['Certificate issuance','Enrollment policy and templates','Internal revocation publication'],controls:['SC-12','SC-17','IA-5','AC-6'],boundary:'Only the issuing services join this segment. The offline root has no switch connection.'},
 {id:'v40',number:40,name:'Servers & data',subnet:'10.0.40.0/24',color:'#ff9b81',x:30,z:-19,w:18,d:15,ids:['fs','sql','apps','web'],functions:['File shares','Database services for the application tier','Licensing, application API, and internal web services'],controls:['AC-3','AC-6','SC-8(1)','SC-28(1)','CP-9'],boundary:'Authorize each client-to-service path. The fleet reaches SBD-WEB01 (F13), SBD-WEB01 calls the application API on SBD-APPS01 (F21), and only SBD-APPS01 reaches SBD-SQL01 (F22); web-to-SQL is denied (F14). Licensing uses each application’s registered vendor port (F12). All four servers share this VLAN, so host firewalls enforce these rows.'},
 {id:'v50',number:50,name:'Security & monitoring',subnet:'10.0.50.0/24',color:'#65deeb',x:-27,z:14,w:21,d:17,ids:['splunk','nessus','epo','audit'],functions:['Event analysis and retention','Vulnerability management','Endpoint protection and DLP'],controls:['AU-6','AU-9','AU-11','RA-5','SI-3','SI-4'],boundary:'Scope scanners and agents explicitly. Protect audit records and separate security administration.'},
 {id:'v60',number:60,name:'Administrative access',subnet:'10.0.60.0/24',color:'#f7c477',x:-3,z:14,w:14,d:15,ids:['jump'],functions:['Dedicated administrator sessions','Privileged MFA','Session logging and change control'],controls:['AC-2','AC-6','IA-2(1)','AU-12','SC-7(15)'],boundary:'Permit only approved targets and protocols. This is not universal access to every management tier.'},
 {id:'v70',number:70,name:'Management tools',subnet:'10.0.70.0/24',color:'#acbdce',x:16,z:14,w:20,d:15,ids:['management','repo'],functions:['Configuration and asset inventory','Approved Linux packages','System maintenance and recovery planning'],controls:['CM-2','CM-3','CM-6','CM-8','SI-2','CP-10'],boundary:'Constrain publishers and management identities. Validate packages brought in on approved media.'}
];
export const addresses={dc1:'10.0.10.10',dc2:'10.0.10.11',dhcp:'10.0.20.10',syslog:'10.0.20.20',wsus:'10.0.20.30',subca:'10.0.30.20',templates:'10.0.30.30',fs:'10.0.40.10',sql:'10.0.40.20',apps:'10.0.40.30',web:'10.0.40.40',splunk:'10.0.50.10',nessus:'10.0.50.20',epo:'10.0.50.30',audit:'10.0.50.40',jump:'10.0.60.10',management:'10.0.70.10',repo:'10.0.70.20'};
export const addedSystems=[
 {id:'templates',name:'SBD-PKI-MGMT01',role:'Certificate template administration',controls:['SC-17','IA-5','AC-6'],known:'Certificate templates are directory objects. This host provides the administrative tools to manage them.',design:['Separate enrollment approval from template administration.','Review template permissions and certificate purposes.'],evidence:['Template export and permission review.','Enrollment approval and denial tests.']},
 {id:'web',name:'SBD-WEB01',role:'Internal Apache web server · Linux, domain-joined',controls:['AC-3','CM-6','SC-8(1)'],known:'Linux with Apache, joined to the domain with SSSD like Splunk and Nessus. Serves the internal web application over HTTPS and calls the application API on SBD-APPS01; it has no database dependency.',design:['Permit only approved internal consumers; call the application API on SBD-APPS01, never the database.','Harden the web service and maintain trusted certificates; patch from SBD-REPO01 and send syslog over TLS.'],evidence:['Service configuration and approved flow matrix.','TLS, access-control, and web-to-SQL denial tests.']},
 {id:'management',name:'SBD-MGMT01',role:'Management tools server',controls:['CM-2','CM-3','CM-8','AC-6'],known:'Management tools. Define administrative accounts, permitted targets, and protocols.',design:['Maintain an approved configuration baseline and inventory.','Track changes and constrain management scope.'],evidence:['Configuration baseline and asset register.','Approved change records and access reviews.']}
];
export const additionalControls={
 'IA-5':['Authenticator Management','Manage credentials throughout their lifecycle.'],
 'CM-2':['Baseline Configuration','Maintain an approved system configuration baseline.'],
 'CM-3':['Configuration Change Control','Review, approve, document, and monitor controlled changes.'],
 'CM-8':['System Component Inventory','Maintain a current and accountable component inventory.'],
 'MP-4':['Media Storage','Protect and control access to stored media.'],
 'MP-5':['Media Transport','Protect media and maintain accountability during transport.'],
 'MP-6':['Media Sanitization','Sanitize media before release or reuse as required.'],
 'MP-7':['Media Use','Restrict the use of media according to policy.'],
 'CP-2':['Contingency Plan','Document continuity and recovery responsibilities and procedures.'],
 'CP-10':['System Recovery and Reconstitution','Restore the system to a known state after disruption.'],
 'CA-2':['Control Assessments','Assess controls with documented scope, methods, and results.'],
 'CA-5':['Plan of Action and Milestones','Track corrective actions, milestones, and progress.'],
 'CA-6':['Authorization','Obtain and maintain the required authorization decision.'],
 'CA-7':['Continuous Monitoring','Monitor controls and changes to inform ongoing risk decisions.'],
 'IR-4':['Incident Handling','Prepare for and manage the incident response process.']
};
export const families=[['AC','Access control'],['IA','Identification & authentication'],['AU','Audit & accountability'],['CM','Configuration management'],['SC','System & communications protection'],['SI','System & information integrity'],['RA','Risk assessment'],['MP','Media protection'],['CP','Contingency planning'],['CA','Assessment, authorization & monitoring'],['IR','Incident response']];
export const facilities=[
 {id:'core',name:'Core switch stack',color:'#7bddf0',controls:['SC-7','SC-7(5)','AC-4','CM-6'],detail:'Internal Layer 3 switching and inter-VLAN routing. Access control lists enforce documented exceptions; segmentation alone does not establish enforcement.',items:['Two core switches; validate redundancy and failover.','Review source, destination, service, and business purpose for every allowed flow.','Back up configurations and test permitted and denied paths.']},
 {id:'media',name:'Controlled media handling',color:'#eeb978',controls:['MP-7','MP-5','MP-4','SI-3','AC-4','AU-12'],detail:'Inbound: approve source and media, scan and validate content, record custody, then let an authorized operator import it. Outbound: approve release, review content and destination, record the export, then physically carry the approved media.',items:['No cable, data diode, or automatic transfer crosses the air gap.','Use write protection where appropriate to the approved procedure.','Keep inbound and outbound handling distinct; sanitize media under MP-6.']},
 {id:'backup',name:'Offline backup & recovery',color:'#86c4f1',controls:['CP-2','CP-9','CP-9(1)','CP-10','MP-4'],detail:'Keep protected offline copies of required information, system configurations, and recovery material. Define retention, custody, recovery priorities, and restoration responsibilities.',items:['Test backup integrity and usability.','Exercise restoration, including keys and dependencies.','Record results and resolve recovery gaps.']}
];
// Strengthened example design. These choices describe the model, not applied device settings.
Object.assign(vlans.find(v=>v.id==='v60'),{name:'Tiered administration',w:18,ids:['jump','jump1','jump2'],boundary:'Separate identity/PKI, server, and endpoint administrative hosts and accounts. Host rules deny cross-tier management; sharing this VLAN does not grant access.'});
vlans.push({id:'v80',number:80,name:'User workstations',subnet:'10.0.80.0/24',color:'#6ebde9',x:-26,z:36,w:19,d:13,ids:['workstations'],functions:['50 Windows 11 endpoints','Internal identity, files, and approved updates','Host firewall blocks peer management'],controls:['AC-3','AC-6','CM-6','CM-7','SC-7'],boundary:'Dedicated client segment. Block peer SMB/RDP and direct administrative access; allow documented identity and resource dependencies only.'});
Object.assign(addresses,{jump1:'10.0.60.20',jump2:'10.0.60.30',workstations:'10.0.80.100–199'});
addedSystems.push(
 {id:'jump1',name:'SBD-ADMIN-SRV01',role:'Server administration only',controls:['AC-5','AC-6','IA-2(1)','AU-12'],known:'Dedicated privileged workstation for approved member-server targets. Separate operator roles further restrict security tools and protected audit storage.',design:['Separate privileged accounts from identity and endpoint administration.','Require offline-compatible MFA, named targets, and session auditing.'],evidence:['Target allowlist and effective host rules.','Cross-tier denial and MFA tests.']},
 {id:'jump2',name:'SBD-ADMIN-PC01',role:'Endpoint administration only',controls:['AC-5','AC-6','IA-2(1)','AU-12'],known:'Dedicated privileged workstation for the 50 client endpoints. No AD, CA, or server administrative sessions.',design:['Use scoped endpoint-admin identities and managed local credentials.','Deny direct management from ordinary user workstations.'],evidence:['Endpoint scope and privileged account review.','Server and identity management denial tests.']}
);
Object.assign(additionalControls,{
 'CM-7':['Least Functionality','Limit system capabilities, services, and software to required functions.'],
 'AC-5':['Separation of Duties','Separate conflicting responsibilities and permissions.'],
 'AU-5':['Response to Audit Logging Process Failures','Detect and respond to audit logging failures.'],
 'AU-8':['Time Stamps','Record audit timestamps with defined precision and time-zone context.'],
 'SC-45':['System Time Synchronization','Synchronize system clocks within the approved time hierarchy.'],
 'SI-7':['Software, Firmware, and Information Integrity','Check integrity and respond to unauthorized changes.'],
 'CP-4':['Contingency Plan Testing','Exercise recovery procedures and address weaknesses.'],
 'IR-3':['Incident Response Testing','Exercise incident handling and incorporate lessons learned.']
});
facilities.find(f=>f.id==='core').items=['Default deny between VLANs; explicit source, destination, service, purpose, and owner for exceptions.','Host firewalls also enforce isolation within VLANs 40, 50, 60, and 80.','The VLAN 80 DHCP relay (F04) forwards client broadcasts to SBD-DHCP01; verify relay and scope settings after changes.','Test allowed sessions and blocked lateral movement; back up approved rules.'];
facilities.find(f=>f.id==='backup').items=['Test restoration of AD/DNS, PKI, files, SQL, and network configuration.','Splunk, Tenable/Nessus, and Trellix ePO/DLP each remain one server: no cluster or standby.','Protect each platform’s configuration, required data, keys, and recovery material; validate vendor-supported recovery.','Define downtime, recovery point and recovery time targets; rehearse loss of each platform.'];
// Architecture review, October 2026: Tier 0 scope and the baseline controls the design already supports.
// Splunk and Nessus run on Linux and are domain-joined; no systems were added.
vlans.find(v=>v.id==='v10').controls.push('SC-22','SC-23');
vlans.find(v=>v.id==='v50').controls.push('SI-4(4)');
vlans.find(v=>v.id==='v80').controls.push('IA-2(2)','IA-3');
vlans.find(v=>v.id==='v80').functions.push('802.1X port admission; unknown devices go to quarantine VLAN 90');
vlans.find(v=>v.id==='v20').functions.push('802.1X port admission (NPS role on SBD-DHCP01)');
Object.assign(additionalControls,{
 'AU-2':['Event Logging','Identify the event types the system logs and why they support investigations.'],
 'AU-3':['Content of Audit Records','Record what happened, when and where, the source, the outcome, and who was involved.'],
 'AU-9(4)':['Access by Subset of Privileged Users','Limit management of audit logging to a defined subset of privileged users.'],
 'IA-3':['Device Identification and Authentication','Identify and authenticate devices before they connect.'],
 'IA-2(2)':['Multi-factor Authentication to Non-privileged Accounts','Require multi-factor authentication for non-privileged accounts.'],
 'AC-6(5)':['Privileged Accounts','Restrict privileged accounts to defined personnel or roles.'],
 'SC-13':['Cryptographic Protection','Use the required types of cryptography for each protection need.'],
 'SC-22':['Architecture and Provisioning for Name/Address Resolution Service','Make name resolution fault tolerant, with separated roles.'],
 'SC-23':['Session Authenticity','Protect the authenticity of communication sessions.'],
 'SI-4(2)':['Automated Tools and Mechanisms for Real-time Analysis','Analyze events in near real time with automated tools.'],
 'SI-4(4)':['Inbound and Outbound Communications Traffic','Monitor communications traffic for unusual or unauthorized activity.'],
 'PL-2':['System Security and Privacy Plans','Document the system, its boundary, its controls, and its risk decisions.'],
 'RA-7':['Risk Response','Respond to findings from assessments, monitoring, and audits in line with organizational risk tolerance.']
});
families.push(['PL','Planning']);
{
 const core=facilities.find(f=>f.id==='core');
 core.controls.push('AC-6','AU-12');
 core.items.push('Management plane: switch management only on VLAN 100 from AdminJumpBox01, named administrator accounts, switch syslog (including denies) to SBD-SYSLOG01, and versioned configuration backups.');
 const backup=facilities.find(f=>f.id==='backup');
 backup.items.push('Backup path: each server writes to a protected local backup volume; custodians carry DC, CA, and audit backups here under the media custody procedure. There is no network path to this facility.','Document the single-instance design in the system security plan, with backups as its mitigation (PL-2): one server each suits the small network and modest resource needs. The risk response records the remaining risk (RA-7), and only the authorizing official accepts it (CA-6); track restore gaps in the POA&M (CA-5).');
 backup.controls.push('CA-5','PL-2','RA-7','CA-6');
}
// Roles added to existing systems (no new servers): NPS runs on SBD-DHCP01 for 802.1X port admission, and SBD-APPS01
// hosts the application API as the only SQL consumer (three-tier design: SBD-WEB01 → SBD-APPS01 → SBD-SQL01).
const roleChanges={apps:n=>({role:'License server + application API',known:'License server and application tier. It runs the vendor licensing service for approved clients (F12) and the application API that SBD-WEB01 calls over HTTPS (F21), and it is the only registered SQL consumer (F22).',design:[...n.design,'Accept application API calls from SBD-WEB01 only, and connect to SBD-SQL01 under a managed service identity with least-privilege database roles.'],evidence:[...n.evidence,'Application API and encrypted SQL connection tests from the registered callers.']}),sql:()=>({known:'SQL server for the application tier. SBD-APPS01 is its only registered consumer (TCP 1433 with TLS, F22); SBD-WEB01 is explicitly denied (F14), and no workstation path exists.'}),dc1:n=>({known:'Primary domain controller with AD and DNS. In this design it holds the PDC emulator role, so it is the domain\'s authoritative time source: it serves time from its own clock, and every other member follows the domain hierarchy (F09).',controls:[...new Set([...n.controls,'AU-8','SC-45'])],design:[...n.design,'Serve domain time as the reliable source from its own clock; turn off hypervisor time synchronization for the domain controller VMs.','Define how the clock is checked against an approved reference and corrected, its drift threshold, and its fallback, without an external network connection.'],evidence:[...n.evidence,'Time design, scheduled drift checks and corrections, and time hierarchy test results.']}),dhcp:n=>({role:'DHCP server + NPS (802.1X)',controls:[...n.controls,'IA-3'],known:'Windows Server with two roles: DHCP for the VLAN 80 pool, and Network Policy Server for 802.1X port admission (EAP-TLS with machine certificates). NPS handles port admission only; router logins stay named local accounts.',design:[...n.design,'Require machine certificates from the issuing CA; no password-based EAP. Unknown devices go to quarantine VLAN 90.'],evidence:[...n.evidence,'Network policy export and admission tests: enrolled PC admitted, unknown device quarantined.']}),audit:n=>({role:n.role+' · Windows, domain-joined'})};
export function buildArchitectureNodes(existing){return [...existing,...addedSystems].map(n=>({...n,...(roleChanges[n.id]?.(n)||{}),...(n.id==='jump'?{role:'Tier 0 administration only',known:'Dedicated Tier 0 administrative host for AD, DNS, PKI, and every system that can control them: the core switch, the hypervisor hosts, and the DC-facing scopes of WSUS, ePO, Nessus, and Splunk. No member-server or endpoint administration.',design:['Use separate Tier 0 admin accounts and offline-compatible MFA.','Restrict targets to Tier 0 systems and scopes; root CA ceremonies remain local.'],evidence:['Privileged target allowlist and account reviews.','MFA, audit, and cross-tier denial tests.']}:{}),zone:vlans.find(v=>v.ids.includes(n.id))?.id||n.zone,address:addresses[n.id]||null}));}
