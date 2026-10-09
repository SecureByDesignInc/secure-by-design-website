// Secure By Design courses that teach how to build or authorize parts of this network.
// Build the Network path (1.1–1.10) builds every modeled system; Network Authorization (2.x) authorizes it.
export const courses={
 identity:{title:'1.1 · Build the identity foundation',detail:'Two Active Directory domain controllers on Windows Server 2025',href:'/training/dc01-dc02/index.html'},
 dns:{title:'1.2 · Configure DNS and time',detail:'Service discovery, name resolution & the domain time hierarchy',href:'/training/dns-configuration'},
 harden:{title:'1.3 · Harden the baseline',detail:'OU design, DISA GPOs & STIG/SCAP verification',href:'/training/harden-baseline'},
 pki:{title:'1.4 · Configure the two-tier PKI',detail:'Offline root, issuing CA, pki.sbd.test publication & templates',href:'/training/two-tier-pki'},
 admin:{title:'1.5 · Addressing and tiered administration',detail:'DHCP, admin seats & where privilege may sign in',href:'/training/tiered-admin'},
 logging:{title:'1.6 · See everything: the logging pipeline',detail:'Collect, protect & analyze security records',href:'/training/logging-pipeline'},
 fleet:{title:'1.7 · Bring in the fleet',detail:'50 Windows 11 endpoints, managed from first boot',href:'/training/workstation-fleet'},
 patch:{title:'1.8 · Patch, protect, and watch for weakness',detail:'WSUS rings, approved sources, ePO & credentialed scanning',href:'/training/patch-protect'},
 services:{title:'1.9 · Stand up the business services',detail:'Files, database, licensing & web by documented paths',href:'/training/business-services'},
 recovery:{title:'1.10 · Prove you can recover',detail:'Backups with custody and a rehearsed restore',href:'/training/prove-recovery'},
 rmf:{title:'2.1–2.3 · Prepare the network for authorization',detail:'Risk Management Framework, Body of Evidence & Authorization to Operate',href:'/training/rmf/index.html'}
};
export const systemCourses={
 dc1:['identity','dns','harden','recovery'],dc2:['identity','dns','harden','recovery'],
 root:['pki'],subca:['pki'],templates:['pki'],
 dhcp:['admin','fleet'],jump:['admin'],jump1:['admin'],jump2:['admin'],
 syslog:['logging'],audit:['logging','recovery'],splunk:['logging'],
 workstations:['fleet'],
 wsus:['patch'],repo:['patch'],management:['patch'],epo:['patch'],nessus:['patch'],
 fs:['services'],sql:['services'],apps:['services'],web:['services']
};
export const processCourses={
 signin:['identity','dns'],files:['services'],updates:['patch'],logs:['logging'],license:['services'],
 trust:['pki'],web:['dns','pki','services'],
 'dc-down':['identity','dns'],'cert-expired':['pki'],
 'pc-to-sql':['services'],'peer-rdp':['fleet','admin'],drill:['fleet','admin','services','rmf']
};
