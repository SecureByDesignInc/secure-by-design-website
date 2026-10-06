// Existing Secure By Design courses that teach how to build or authorize parts of this network.
export const courses={
 identity:{title:'Build the identity foundation',detail:'Active Directory and DNS on Windows Server 2025',href:'/training/dc01-dc02/index.html'},
 dns:{title:'Configure DNS',detail:'Name resolution for the domain',href:'/training/dns-configuration'},
 pki:{title:'Configure a Root CA & issuing CA',detail:'Two-tier PKI with an offline root',href:'/training/two-tier-pki'},
 rmf:{title:'Prepare the network for authorization',detail:'Risk Management Framework, Body of Evidence & Authorization to Operate',href:'/training/rmf/index.html'}
};
export const systemCourses={dc1:['identity','dns'],dc2:['identity','dns'],subca:['pki'],root:['pki'],templates:['pki']};
export const processCourses={signin:['identity','dns'],trust:['pki'],web:['dns','pki'],'dc-down':['identity','dns'],'cert-expired':['pki']};
