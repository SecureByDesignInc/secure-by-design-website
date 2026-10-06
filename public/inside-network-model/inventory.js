export const inventory = {
  "source": "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  "controls": {
    "AC-2": [
      "Account Management",
      "Manage account approval, changes, review, and removal."
    ],
    "AC-3": [
      "Access Enforcement",
      "Enforce approved access permissions at each resource."
    ],
    "AC-4": [
      "Information Flow Enforcement",
      "Enforce authorized flows between systems and security boundaries."
    ],
    "AC-6": [
      "Least Privilege",
      "Limit user, service, and administrative permissions to their tasks."
    ],
    "IA-2": [
      "Identification and Authentication (Organizational Users)",
      "Identify and authenticate organizational users."
    ],
    "IA-2(1)": [
      "Identification and Authentication (Organizational Users) | Multi-factor Authentication to Privileged Accounts",
      "Require multiple factors for privileged account access."
    ],
    "SC-7": [
      "Boundary Protection",
      "Monitor and control communications at managed boundaries."
    ],
    "SC-7(5)": [
      "Boundary Protection | Deny by Default — Allow by Exception",
      "Allow documented traffic exceptions and deny other network traffic."
    ],
    "SC-7(15)": [
      "Boundary Protection | Networked Privileged Accesses",
      "Use a dedicated managed interface for privileged network access."
    ],
    "SC-8(1)": [
      "Transmission Confidentiality and Integrity | Cryptographic Protection",
      "Use cryptography to protect transmitted information's confidentiality and/or integrity, as selected."
    ],
    "SC-12": [
      "Cryptographic Key Establishment and Management",
      "Manage key generation, protection, distribution, use, and retirement."
    ],
    "SC-17": [
      "Public Key Infrastructure Certificates",
      "Issue and manage certificates under a defined certificate policy."
    ],
    "SC-28(1)": [
      "Protection of Information at Rest | Cryptographic Protection",
      "Use cryptography to protect designated information at rest."
    ],
    "AU-6": [
      "Audit Record Review, Analysis, and Reporting",
      "Review records, analyze findings, and report relevant events."
    ],
    "AU-9": [
      "Protection of Audit Information",
      "Protect audit records and tools from unauthorized access, changes, and deletion."
    ],
    "AU-11": [
      "Audit Record Retention",
      "Retain records for an organization-defined period and support later investigations."
    ],
    "AU-12": [
      "Audit Record Generation",
      "Generate the audit events selected for the system."
    ],
    "CM-6": [
      "Configuration Settings",
      "Define, implement, and manage documented security settings."
    ],
    "RA-5": [
      "Vulnerability Monitoring and Scanning",
      "Find vulnerabilities, analyze results, and remediate according to risk."
    ],
    "SI-2": [
      "Flaw Remediation",
      "Identify and correct flaws; test and deploy security updates within defined time frames."
    ],
    "SI-3": [
      "Malicious Code Protection",
      "Implement, update, and operate malicious-code protection mechanisms."
    ],
    "SI-4": [
      "System Monitoring",
      "Monitor for attacks and unauthorized activity and analyze the results."
    ],
    "CP-9": [
      "System Backup",
      "Back up required information and protect the backup copies."
    ],
    "CP-9(1)": [
      "System Backup | Testing for Reliability and Integrity",
      "Test backup reliability and information integrity."
    ]
  },
  "nodes": [
    {
      "id": "dc1",
      "name": "SBD-DC01",
      "role": "AD DS + DNS",
      "zone": "identity",
      "controls": [
        "AC-2",
        "IA-2",
        "AC-6"
      ],
      "known": "Listed as the primary domain controller with AD and DNS. FSMO ownership, writability, and replication configuration have not been provided.",
      "design": [
        "Protect identity administration from lower-trust workstation sessions.",
        "Restrict directory and DNS changes; monitor privileged changes.",
        "Test directory recovery and replication health."
      ],
      "evidence": [
        "Account and privilege reviews; AD/DNS configuration.",
        "Replication checks, audited changes, and recovery exercise records."
      ]
    },
    {
      "id": "dc2",
      "name": "SBD-DC02",
      "role": "AD DS + DNS",
      "zone": "identity",
      "controls": [
        "AC-2",
        "IA-2",
        "CP-9"
      ],
      "known": "Listed as the secondary domain controller with AD and DNS. This label does not establish a passive standby role or identify the PDC emulator.",
      "design": [
        "Verify the intended replication and DNS redundancy design.",
        "Apply the same privileged-access protections as SBD-DC01.",
        "Keep tested backups; replication alone is not a backup."
      ],
      "evidence": [
        "Replication and DNS failover tests.",
        "Domain controller backup and restoration evidence."
      ]
    },
    {
      "id": "subca",
      "name": "SBD-SUBCA01",
      "role": "Issuing certificate authority",
      "zone": "identity",
      "controls": [
        "SC-12",
        "SC-17",
        "AC-6"
      ],
      "known": "Subordinate / issuing CA. CA type, domain membership, certificate templates, and publication endpoints are not specified.",
      "design": [
        "Constrain enrollment rights and permitted certificate purposes.",
        "Protect CA private keys and separate CA administration.",
        "Define certificate revocation, CRL/AIA publication, and recovery procedures."
      ],
      "evidence": [
        "Certificate policy, enrollment permissions, and issuance logs.",
        "Key protection and certificate-revocation tests."
      ]
    },
    {
      "id": "dhcp",
      "name": "SBD-DHCP01",
      "role": "DHCP server",
      "zone": "services",
      "controls": [
        "CM-6",
        "AC-6",
        "AU-12"
      ],
      "known": "Dynamic Host Configuration Protocol server. Scopes, failover, and cross-subnet relay configuration are not provided.",
      "design": [
        "Define approved scopes, reservations, DNS options, and lease policy.",
        "Restrict administrative changes and monitor lease events.",
        "Plan relay behavior explicitly if clients occupy separate VLANs."
      ],
      "evidence": [
        "Approved DHCP settings and administrative access review.",
        "Lease logs and client addressing tests."
      ]
    },
    {
      "id": "fs",
      "name": "SBD-FS01",
      "role": "File share server",
      "zone": "services",
      "controls": [
        "AC-3",
        "AC-6",
        "SC-28(1)"
      ],
      "known": "File share server. Shares, data sensitivity, access groups, and encryption settings are not provided.",
      "design": [
        "Grant share and filesystem permissions through approved roles.",
        "Protect sensitive data in transit and at rest according to policy.",
        "Back up data and test restoration of both data and permissions."
      ],
      "evidence": [
        "Share and filesystem access reviews and denial tests.",
        "Encryption configuration and restoration evidence."
      ]
    },
    {
      "id": "apps",
      "name": "SBD-APPS01",
      "role": "License server",
      "zone": "services",
      "controls": [
        "AC-3",
        "AC-6",
        "CM-6"
      ],
      "known": "License server. No application-hosting role or SQL dependency has been assumed.",
      "design": [
        "Expose only the vendor-required licensing services to approved clients.",
        "Restrict service identity and administrative privileges.",
        "Document vendor ports, configuration, and recovery requirements."
      ],
      "evidence": [
        "Vendor-supported flow matrix and configuration.",
        "Service account permissions and approved client list."
      ]
    },
    {
      "id": "sql",
      "name": "SBD-SQL01",
      "role": "SQL server",
      "zone": "services",
      "controls": [
        "AC-3",
        "AC-6",
        "SC-8(1)",
        "SC-28(1)"
      ],
      "known": "SQL server. Consumers, instances, databases, and connection ports have not been specified. No workstation-to-SQL or license-server-to-SQL path is assumed.",
      "design": [
        "Allow only identified consumers and approved management paths.",
        "Use narrowly scoped database roles and protect sensitive data.",
        "Test database, key, and configuration recovery together."
      ],
      "evidence": [
        "Database permission reviews and approved consumer matrix.",
        "Transport, storage, key-management, and restore test evidence."
      ]
    },
    {
      "id": "syslog",
      "name": "SBD-SYSLOG01",
      "role": "Log message server",
      "zone": "operations",
      "controls": [
        "AU-12",
        "AU-9",
        "SC-8(1)"
      ],
      "known": "Log-message collection server. Sources, collection agents, transport, and routing to Splunk or the audit repository remain to be confirmed.",
      "design": [
        "Collect the defined event types from supported sources.",
        "Use protected transport where supported and required.",
        "Monitor delivery failures, time alignment, and collector capacity."
      ],
      "evidence": [
        "Source-to-collector tests and event coverage.",
        "Transport settings and log-delivery failure alerts."
      ]
    },
    {
      "id": "audit",
      "name": "SBD-AUDIT01",
      "role": "Audit log repository",
      "zone": "operations",
      "controls": [
        "AU-9",
        "AU-11"
      ],
      "known": "Audit log repository. Retention, tamper protection, backup, and ingestion routes are not yet specified.",
      "design": [
        "Separate log administration from administration of audited systems.",
        "Define retention and protect against unauthorized alteration or deletion.",
        "Test search, export, and recovery of retained records."
      ],
      "evidence": [
        "Repository permissions and retention configuration.",
        "Integrity checks and retrieval tests."
      ]
    },
    {
      "id": "splunk",
      "name": "SBD-SPLUNK01",
      "role": "Splunk SIEM",
      "zone": "operations",
      "controls": [
        "AU-6",
        "SI-4"
      ],
      "known": "Splunk SIEM server. A server name alone does not establish log coverage, detection rules, or a response process.",
      "design": [
        "Validate relevant source coverage and detection logic.",
        "Assign review and investigation responsibilities.",
        "Test alerts and escalation; manage false positives and gaps."
      ],
      "evidence": [
        "Detection tests, log coverage, and review records.",
        "Investigation tickets and escalation procedures."
      ]
    },
    {
      "id": "epo",
      "name": "SBD-EPO01",
      "role": "Trellix ePO + DLP",
      "zone": "operations",
      "controls": [
        "AC-4",
        "SI-3",
        "SI-4"
      ],
      "known": "Trellix ePO and DLP management server. Agent deployment, protection modules, licensing, and policy enforcement are not verified.",
      "design": [
        "Restrict who can change or disable endpoint and DLP policies.",
        "Verify the relevant agents and protection modules are installed and enforcing policy.",
        "Test policy updates, health reporting, and authorized data-flow restrictions."
      ],
      "evidence": [
        "Agent coverage and policy enforcement tests.",
        "Management access reviews and alert/investigation records."
      ]
    },
    {
      "id": "workstations",
      "name": "50 Windows 11 PCs",
      "role": "User workstations × 50",
      "zone": "users",
      "controls": [
        "CM-6",
        "AC-6",
        "SI-2",
        "SI-3"
      ],
      "known": "Fifty Windows 11 user workstations, displayed as one selectable group. Individual hostnames and domain-join status were not provided.",
      "design": [
        "Apply approved hardening and minimize local administrative access.",
        "Deploy and verify patching, protection, and required logging.",
        "Use separate protected workflows for privileged administration."
      ],
      "evidence": [
        "Configuration and patch compliance reports.",
        "Endpoint protection coverage and local administrator reviews."
      ]
    },
    {
      "id": "jump",
      "name": "AdminJumpBox01",
      "role": "Admin management system",
      "zone": "admin",
      "controls": [
        "AC-6",
        "IA-2(1)",
        "SC-7(15)"
      ],
      "known": "Administrative management system. Its permitted management tier, MFA, session controls, and target scope have not been provided.",
      "design": [
        "Define permitted targets before enabling management routes.",
        "Use privileged MFA and dedicated administrative identities.",
        "Keep identity/PKI administration separate from lower-trust management paths."
      ],
      "evidence": [
        "Approved management scope, routing policy, and MFA tests.",
        "Privileged access reviews and session audit records."
      ]
    },
    {
      "id": "wsus",
      "name": "SBD-WSUS01",
      "role": "Windows update service",
      "zone": "maintenance",
      "controls": [
        "SI-2",
        "CM-6"
      ],
      "known": "Windows Server Update Services server. Upstream source, approval rings, client groups, and signing configuration remain unspecified.",
      "design": [
        "Approve and test updates before deployment.",
        "Verify update provenance, integrity, and delivery settings.",
        "Track missing updates, failures, exceptions, and remediation deadlines."
      ],
      "evidence": [
        "Update approvals and testing records.",
        "Client patch reports and exception reviews."
      ]
    },
    {
      "id": "repo",
      "name": "SBD-REPO01",
      "role": "Linux repository server",
      "zone": "maintenance",
      "controls": [
        "SI-2",
        "AC-6",
        "CM-6"
      ],
      "known": "Linux repository server. Package consumers, repository content, upstream sources, and signing practices are not provided.",
      "design": [
        "Restrict repository publication and synchronize only approved sources.",
        "Validate package signatures and document trust and key changes.",
        "Monitor repository changes and protect credentials."
      ],
      "evidence": [
        "Repository configuration and signature verification tests.",
        "Publisher permissions and change history."
      ]
    },
    {
      "id": "nessus",
      "name": "SBD-NESSUS01",
      "role": "Tenable / Nessus",
      "zone": "maintenance",
      "controls": [
        "RA-5",
        "AC-6"
      ],
      "known": "Vulnerability management server. Scan scopes, schedules, credentials, and agents are not specified.",
      "design": [
        "Authorize target scope and constrain scanner access and credentials.",
        "Analyze findings and track remediation and exceptions.",
        "Rescan to validate fixes; exclude the offline root from network scans."
      ],
      "evidence": [
        "Authorized scan plan and credential protection settings.",
        "Findings, remediation records, and validation scans."
      ]
    },
    {
      "id": "root",
      "name": "SBD-ROOTCA01",
      "role": "Offline root CA · workgroup",
      "zone": "offline",
      "controls": [
        "SC-12",
        "SC-17",
        "CP-9"
      ],
      "known": "Offline, non-domain-joined root certificate authority. It has no live network edges in this diagram.",
      "design": [
        "Keep routine operation disconnected from all network segments.",
        "Use a controlled offline ceremony for subordinate signing and root CRL publication.",
        "Protect private keys, backup media, and physical access; test recovery."
      ],
      "evidence": [
        "Key ceremony and certificate policy records.",
        "Physical/media controls and protected recovery tests."
      ]
    }
  ],
  "chapters": [
    {
      "id": "identity",
      "title": "Directory, DNS, and addressing",
      "text": "Illustrative client requests reach AD/DNS and DHCP. Confirm domain membership, DNS design, replication, and DHCP relay requirements before implementing routes.",
      "nodes": [
        "workstations",
        "dc1",
        "dc2",
        "dhcp"
      ],
      "edges": [
        [
          "workstations",
          "dc1",
          "Directory / DNS requests"
        ],
        [
          "workstations",
          "dc2",
          "Directory / DNS requests"
        ],
        [
          "workstations",
          "dhcp",
          "Addressing exchange; relay may be required"
        ]
      ],
      "selected": "dc1",
      "kind": "service",
      "tags": "AC-2 · IA-2 · CM-6"
    },
    {
      "id": "pki",
      "title": "Keep the root offline; issue through the subordinate",
      "text": "The root signs the subordinate through a controlled offline process. No live root connection is drawn. Certificate enrollment and revocation publication paths still need definition.",
      "nodes": [
        "root",
        "subca"
      ],
      "edges": [],
      "selected": "root",
      "kind": "pki",
      "tags": "SC-12 · SC-17"
    },
    {
      "id": "services",
      "title": "Permit only documented business service paths",
      "text": "These example paths reach file and licensing services. SQL clients are unconfirmed, so no client-to-database dependency has been invented.",
      "nodes": [
        "workstations",
        "fs",
        "apps",
        "sql"
      ],
      "edges": [
        [
          "workstations",
          "fs",
          "Approved file-share requests"
        ],
        [
          "workstations",
          "apps",
          "Approved licensing requests"
        ]
      ],
      "selected": "sql",
      "kind": "service",
      "tags": "AC-3 · AC-6 · SC-8(1)"
    },
    {
      "id": "admin",
      "title": "Define a protected management scope",
      "text": "The jump box is inventoried; its target scope is not. Establish separate trust levels for identity/PKI, server, and endpoint administration before drawing management routes.",
      "nodes": [
        "jump",
        "dc1",
        "dc2",
        "subca"
      ],
      "edges": [],
      "selected": "jump",
      "kind": "admin",
      "tags": "AC-6 · IA-2(1) · SC-7(15)"
    },
    {
      "id": "patch",
      "title": "Control software delivery and validate remediation",
      "text": "The workstation-to-WSUS request is illustrative. Linux repository consumers and update-source routes must be confirmed; they are not implied by proximity.",
      "nodes": [
        "workstations",
        "wsus",
        "repo"
      ],
      "edges": [
        [
          "workstations",
          "wsus",
          "Approved update requests"
        ]
      ],
      "selected": "wsus",
      "kind": "maintenance",
      "tags": "SI-2 · CM-6"
    },
    {
      "id": "protect",
      "title": "Verify endpoint policy and vulnerability coverage",
      "text": "Example policy and scan relationships show the intended functions. They do not confirm installed agents, scanning permissions, or coverage of all systems.",
      "nodes": [
        "workstations",
        "epo",
        "nessus"
      ],
      "edges": [
        [
          "epo",
          "workstations",
          "Logical policy distribution; initiation is product-dependent"
        ],
        [
          "nessus",
          "workstations",
          "Authorized scan activity; scope and credentials pending"
        ]
      ],
      "selected": "epo",
      "kind": "maintenance",
      "tags": "AC-4 · SI-3 · RA-5"
    },
    {
      "id": "logs",
      "title": "Collect, protect, and analyze security records",
      "text": "This view proposes one collection pattern: repository logs to SYSLOG, collection to SIEM, and an audit archive copy. Confirm forwarding, agent, API, and archive behavior before adoption.",
      "nodes": [
        "repo",
        "syslog",
        "splunk",
        "audit"
      ],
      "edges": [
        [
          "repo",
          "syslog",
          "Example Linux log delivery"
        ],
        [
          "syslog",
          "splunk",
          "Proposed SIEM ingestion"
        ],
        [
          "syslog",
          "audit",
          "Proposed archive copy"
        ]
      ],
      "selected": "audit",
      "kind": "logs",
      "tags": "AU-6 · AU-9 · AU-11 · SI-4"
    },
    {
      "id": "recover",
      "title": "Complete the recovery design",
      "text": "Backup infrastructure was not listed. These systems need documented recovery procedures and tested backups; no fictional backup server has been added.",
      "nodes": [
        "dc1",
        "dc2",
        "subca",
        "root",
        "fs",
        "sql",
        "audit"
      ],
      "edges": [],
      "selected": "dc2",
      "kind": "recovery",
      "tags": "CP-9 · CP-9(1)"
    }
  ],
  "colors": {
    "identity": "#bfaaff",
    "services": "#79b8ff",
    "operations": "#9bd9e7",
    "users": "#79b8ff",
    "admin": "#f7c67c",
    "maintenance": "#7fe0b7",
    "offline": "#f7c67c"
  },
  "flowColors": {
    "service": "#79b8ff",
    "pki": "#bfaaff",
    "admin": "#f7c67c",
    "maintenance": "#7fe0b7",
    "logs": "#c6afff",
    "recovery": "#f7c67c"
  }
};
