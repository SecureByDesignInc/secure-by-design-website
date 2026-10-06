const paths: Record<string, {label:string;steps:{title:string;detail:string}[];caption:string}> = {
  'active-directory-certificate-services': {
    label:'From Jon’s certificate request to Dylan’s connection',
    steps:[{title:'Request',detail:'The portal requests a certificate for its public key.'},{title:'Issue',detail:'The CA evaluates the request and signs the certificate.'},{title:'Present',detail:'The portal uses the certificate in its TLS connection.'},{title:'Validate',detail:'Dylan’s client checks the certificate and the server’s proof of key possession.'}],
    caption:'Issuance and connection validation are separate jobs. The portal keeps its private key protected, and the client needs an appropriate trust configuration.'
  },
  'inside-active-directory': {
    label:'Three jobs behind Dylan’s request',
    steps:[{title:'Find a service',detail:'DNS locates domain services.'},{title:'Verify an identity',detail:'SBD-DC01 or SBD-DC02 handles domain authentication.'},{title:'Evaluate file access',detail:'SBD-FS01 checks the Pokemon request.'}],
    caption:'This is the simplified online path. Dylan’s workstation contacts the services it needs, and the project files stay on the file server.'
  },
  'users-groups-and-permissions': {
    label:'Dylan’s access path',
    steps:[{title:'Dylan',detail:'Employee account'},{title:'Pokemon contributors',detail:'Global security group'},{title:'Pokemon Modify',detail:'Domain local security group'},{title:'Pokemon folder',detail:'Resource permissions'}],
    caption:'Follow the memberships to the permission. The file server still checks what Dylan is asking to do.'
  },
  'understanding-group-policy': {
    label:'From Jon’s setting to Dylan’s workstation',
    steps:[{title:'Configure',detail:'Workstation Baseline GPO'},{title:'Scope',detail:'Link to the Staging OU'},{title:'Apply',detail:'Client processes applicable settings'},{title:'Verify',detail:'Observe the test workstation'}],
    caption:'Jon starts with a small test group. Creating the GPO is one step; checking what the workstation receives is another.'
  }
};
export default function CaseDiagram({slug}:{slug:string}) {
  if(slug==='replication-and-fsmo-roles') return <figure className="case-diagram"><figcaption>Two writable controllers, shared responsibilities</figcaption><div className="replication-diagram"><div><strong>SBD-DC01</strong><span>Local directory database</span></div><span className="replication-arrow" aria-label="Directory changes replicate in both directions">↔</span><div><strong>SBD-DC02</strong><span>Local directory database</span></div></div><p>Each controller keeps its own data and shares directory changes with the other. That still doesn’t give us a historical backup.</p></figure>;
  const diagram=paths[slug];
  if(!diagram)return null;
  return <figure className="case-diagram"><figcaption>{diagram.label}</figcaption><ol className="concept-steps">{diagram.steps.map((step,index)=><li key={step.title}><span className="step-number">{index+1}</span><strong>{step.title}</strong><span>{step.detail}</span></li>)}</ol><p>{diagram.caption}</p></figure>;
}
