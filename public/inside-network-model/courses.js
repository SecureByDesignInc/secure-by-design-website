// Secure By Design courses that teach how to build or authorize parts of this network.
// Build the Network path (1.1–1.12) builds every modeled system; Network Authorization (2.x) authorizes it. Course 1.1
// (20 October 2026) holds what courses 1.1–1.8 taught, in eight parts; each system links to its part.
// Courses 1.9 and 1.10 are coming soon: they link to their topic group in the Training Hub until their material exists.
export const courses={
 identity:{title:'1.1 · Part 1 · Domain controllers',detail:'Two Active Directory domain controllers on Windows Server, on VLAN 10',href:'/training/identity-foundation/?part=dc'},
 dns:{title:'1.1 · Part 2 · DNS',detail:"Service discovery, zones, records & troubleshooting",href:'/training/identity-foundation/?part=dns'},
 time:{title:'1.1 · Part 3 · Domain time',detail:"The Windows Time hierarchy, the PDC emulator & chrony",href:'/training/identity-foundation/?part=time'},
 stig:{title:'1.1 · Part 4 · Measure against the STIG',detail:"DISA STIGs, SCAP scans & STIG Viewer checklists",href:'/training/identity-foundation/?part=stig'},
 harden:{title:'1.1 · Part 5 · Harden with Group Policy',detail:"OU design, Group Policy processing & DISA GPOs proven by rescan",href:'/training/identity-foundation/?part=gpo'},
 pki:{title:'1.1 · Part 6 · Two-tier PKI',detail:"Offline root, issuing CA, pki.sbd.test publication & templates",href:'/training/identity-foundation/?part=pki'},
 dhcp:{title:'1.1 · Part 7 · DHCP',detail:"Workstation leases, secure name registration & an audited lease trail",href:'/training/identity-foundation/?part=dhcp'},
 admin:{title:'1.1 · Part 8 · Tiered administration',detail:"Admin seats, the tier rules & where privilege may sign in",href:'/training/identity-foundation/?part=tier'},
 repo:{title:'1.2 · Build the Linux repository on SBD-REPO01',detail:"Mirrored, signature-verified package snapshots for the Linux servers",href:'/training/linux-repository'},
 logging:{title:'1.3 · Collect the record on SBD-SYSLOG01',detail:"Design the logging pipeline and build its collector",href:'/training/logging-pipeline'},
 archive:{title:'1.4 · Protect the record on SBD-AUDIT01',detail:"Keep the audit record intact, even from its administrators",href:'/training/audit-repository'},
 analysis:{title:'1.5 · Analyze the record in SBD-SPLUNK01',detail:"Search a working copy, harden it, own the alerts, prove the chain",href:'/training/splunk-analysis'},
 fleet:{title:'1.6 · Bring in the fleet',detail:"50 Windows endpoints, managed from first boot",href:'/training/workstation-fleet'},
 patch:{title:'1.7 · Deliver Windows updates from SBD-WSUS01',detail:"Air-gapped WSUS: offline import, four rings & Group Policy targeting",href:'/training/patch-protect'},
 inventory:{title:'1.8 · Keep the living inventory on SBD-MGMT01',detail:"Component inventory, discovery sources & monthly reconciliation",href:'/training/management-server'},
 protection:{title:'1.9 · Endpoint protection on SBD-EPO01 (coming soon)',detail:"Managed agents, protection policy & DLP from one console",href:'/technical-training#endpoint'},
 scanning:{title:'1.10 · Credentialed scanning with SBD-NESSUS01 (coming soon)',detail:"Scoped scan accounts, findings triage & the standing cadence",href:'/technical-training#ops'},
 services:{title:'1.11 · Stand up the business services',detail:"Files, database, licensing & web — by documented paths",href:'/training/business-services'},
 recovery:{title:'1.12 · Prove you can recover',detail:"Backups with custody, one rehearsed restore & the closing record",href:'/training/prove-recovery'},
 rmf:{title:'2.1–2.3 · Prepare the network for authorization',detail:'Risk Management Framework, Body of Evidence & Authorization to Operate',href:'/grc-rmf-training/rmf/index.html'}
};
export const systemCourses={
 dc1:['identity','dns','time','stig','harden','recovery'],dc2:['identity','dns','time','stig','harden','recovery'],
 root:['pki'],subca:['pki'],templates:['pki'],
 dhcp:['dhcp','fleet'],jump:['admin'],jump1:['admin'],jump2:['admin'],
 syslog:['logging'],audit:['archive','recovery'],splunk:['analysis'],
 workstations:['fleet'],
 wsus:['patch'],repo:['repo'],management:['inventory'],epo:['protection'],nessus:['scanning'],
 fs:['services'],sql:['services'],apps:['services'],web:['services']
};
export const processCourses={
 signin:['identity','dns'],files:['services'],updates:['patch','repo'],logs:['logging','archive','analysis'],license:['services'],
 trust:['pki'],web:['dns','pki','services'],
 'dc-down':['identity','dns','time'],'cert-expired':['pki'],
 'pc-to-sql':['services'],'peer-rdp':['fleet','admin'],drill:['fleet','admin','services','rmf']
};
