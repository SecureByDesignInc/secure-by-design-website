import training from './training-resources.json' with {type:'json'};
// Retired training items (single files replaced by each course's one download) stay valid IDs for
// records saved before 9 October 2026, but My Account no longer lists them.
export const bookmarkCatalog= [...training.map(item=>({id:item.id,title:item.title,href:item.url,...(item.retired?{retired:true}:{})})),
 {id:'ms-ad',title:'Active Directory fundamentals',href:'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview'},
 {id:'nist-rmf',title:'The Risk Management Framework',href:'https://csrc.nist.gov/projects/risk-management/about-rmf'},
 {id:'splunk',title:'Security monitoring with Splunk',href:'https://help.splunk.com/en/splunk-enterprise/get-started/overview/9.1/about-splunk-enterprise/about-splunk-enterprise'},
 // Community is offline: the ID stays valid for saved records, but My Account doesn't list a page that returns 404.
 {id:'career',title:'Community · Career Goals & Support',href:'/careers#goals',retired:true},
 {id:'video',title:'Secure By Design on YouTube',href:'https://www.youtube.com/channel/UCItxo3KJms-IuQKdFzFXqRg'},
];
