// Secure By Design courses that teach how to build or authorize parts of this network.
// Build the Network path (1.1–1.12) builds every modeled system; Network Authorization (2.x) authorizes it.
export const courses={
 identity:{title:'1.1 · Build the identity foundation',detail:'Active Directory and DNS on Windows Server 2025',href:'/training/dc01-dc02/index.html'},
 dns:{title:'1.2 · Configure DNS',detail:'Name resolution for the domain',href:'/training/dns-configuration'},
 harden:{title:'1.3 · Harden the baseline',detail:'OU design, DISA GPOs & STIG/SCAP verification',href:'/training/harden-baseline'},
 pki:{title:'1.4 · Configure a Root CA & issuing CA',detail:'Two-tier PKI with an offline root',href:'/training/two-tier-pki'},
 segment:{title:'1.5 · Connect and segment the network',detail:'Core routing, default-deny ACLs & internal time',href:'/training/connect-segment'},
 pkiServices:{title:'1.6 · Finish the PKI services',detail:'pki.sbd.test publication & template administration',href:'/training/pki-services'},
 admin:{title:'1.7 · Addressing and tiered administration',detail:'DHCP, admin seats & where privilege may sign in',href:'/training/tiered-admin'},
 logging:{title:'1.8 · See everything: the logging pipeline',detail:'Collect, protect & analyze security records',href:'/training/logging-pipeline'},
 fleet:{title:'1.9 · Bring in the fleet',detail:'50 Windows 11 endpoints, managed from first boot',href:'/training/workstation-fleet'},
 patch:{title:'1.10 · Patch, protect, and watch for weakness',detail:'WSUS rings, approved sources, ePO & credentialed scanning',href:'/training/patch-protect'},
 services:{title:'1.11 · Stand up the business services',detail:'Files, database, licensing & web by documented paths',href:'/training/business-services'},
 recovery:{title:'1.12 · Prove you can recover',detail:'Backups with custody and a rehearsed restore',href:'/training/prove-recovery'},
 rmf:{title:'2.1–2.3 · Prepare the network for authorization',detail:'Risk Management Framework, Body of Evidence & Authorization to Operate',href:'/training/rmf/index.html'}
};
export const systemCourses={
 dc1:['identity','dns','harden','recovery'],dc2:['identity','dns','harden','recovery'],
 root:['pki'],subca:['pki','pkiServices'],templates:['pkiServices'],
 time:['segment'],dhcp:['admin','fleet'],jump:['admin'],jump1:['admin'],jump2:['admin'],
 syslog:['logging'],audit:['logging','recovery'],splunk:['logging'],
 workstations:['fleet'],
 wsus:['patch'],repo:['patch'],management:['patch'],epo:['patch'],nessus:['patch'],
 fs:['services'],sql:['services'],apps:['services'],web:['services']
};
export const processCourses={
 signin:['identity','dns'],files:['services'],updates:['patch'],logs:['logging'],license:['services'],
 trust:['pki','pkiServices'],web:['dns','pkiServices','services'],
 'dc-down':['identity','dns'],'cert-expired':['pki','pkiServices'],
 'pc-to-sql':['segment','services'],'peer-rdp':['segment','admin'],drill:['segment','admin','rmf']
};
