# Live audit — https://securebydesigninc.com

Expected build: `b8ddb31fb21b77e42526a8354d8d3164a205d80c` · 2026-10-08T05:15:10.938Z

| | Area | Check | Detail |
|---|---|---|---|
| ✅ | Hosting | apex serves the current main build | https://securebydesigninc.com → 200 commit b8ddb31fb21b77e42526a8354d8d3164a205d80c (expected b8ddb31fb21b77e42526a8354d8d3164a205d80c) |
| ✅ | Hosting | www serves the current main build | https://www.securebydesigninc.com → 200 commit b8ddb31fb21b77e42526a8354d8d3164a205d80c (expected b8ddb31fb21b77e42526a8354d8d3164a205d80c) |
| ✅ | Hosting | workers.dev serves the current main build | https://secure-by-design-website.securebydesign.workers.dev → 200 commit b8ddb31fb21b77e42526a8354d8d3164a205d80c (expected b8ddb31fb21b77e42526a8354d8d3164a205d80c) |
| ❌ | Hosting | http:// redirects to https:// | 200 → null |
| ✅ | Hosting | Every static file in public/ is live and identical to main | 208/208 identical; 0 different; 0 missing |
| ❌ | Pages | Every known page returns 200 | /blog → 404; /blogs → 404; /rmf-series → 404; /rmf-series/artifacts → 404; /rmf-series/controls → 404; /rmf-series/phases-and-evidence → 404; /rmf-series/prepare → 404; /rmf-series/system → 404; /rmf-series/other-approaches → 404; /rmf-series/concepts/dns → 404; /sitemap.xml → 404 |
| ❌ | Pages | Every sitemap URL returns 200 | 0 URLs; broken: none |
| ✅ | Decommissioned | Sitemap does not list decommissioned or redirected pages | none |
| ✅ | Redirects | /videos redirects to /training | 308 → /training |
| ✅ | Redirects | /learning-library redirects to /training | 308 → /training |
| ✅ | Redirects | /memberships redirects to /my-progress | 308 → /my-progress#memberships |
| ✅ | Redirects | /career-explorer redirects to /careers | 308 → https://securebydesigninc.com/careers |
| ℹ️ | Decommissioned | /cyber-range direct-URL status (informational) | 200 |
| ℹ️ | Decommissioned | /careers direct-URL status (informational) | 200 |
| ℹ️ | Decommissioned | /career-goals direct-URL status (informational) | 200 |
| ℹ️ | Decommissioned | /how-to direct-URL status (informational) | 308 → /cyber-range |
| ℹ️ | Decommissioned | /guides-and-labs direct-URL status (informational) | 308 → /cyber-range |
| ℹ️ | Decommissioned | /community-contributions direct-URL status (informational) | 302 → https://securebydesigninc.com/signin-with-chatgpt?return_to=%2Fcommunity-contributions |
| ✅ | Pages | No broken internal links on crawled pages | 176 links checked; none broken |
| ❌ | Decommissioned | No page links to Cyber Range or Community/career pages | /career-goals from /resources, /career-goals, /careers; /careers from /resources, /career-goals, /careers, /career-explorer/roles; /career-explorer/explorer.css from /careers; /career-explorer/roles from /careers, /career-explorer/roles, /career-explorer/roles/321, /career-explorer/roles/311; /career-explorer/roles/321 from /career-explorer/roles, /career-explorer/roles/321; /career-explorer/roles/311 from /career-explorer/roles, /career-explorer/roles/311; /career-explorer/roles/312 from /career-explorer/roles, /career-explorer/roles/312; /career-explorer/roles/111 from /career-explorer/roles |
| ✅ | Homepage | Start building your network section |  |
| ✅ | Homepage | A note from Secure By Design card |  |
| ✅ | Homepage | Note card follows Start building your network | positions 642 / 1538 |
| ❌ | Homepage | Navigation is Home / Inside the Network / Training Library / My Account only |  Follow along YouTube TikTok Instagram Discord  |
| ✅ | Training Library | Build the Network category |  |
| ✅ | Training Library | Network Authorization category |  |
| ✅ | Training Library | Share invitation (Learn it. Share it. Pay it forward.) |  |
| ✅ | Training Library | “Written training available” and “Open training” labels |  |
| ℹ️ | Training Library | Tiles in the first page of the catalog (server HTML) | 12 tiles before "Show more"; catalog has 15 entries |
| ✅ | Courses | 1.2 Configure DNS: all 5 lessons on the live page | edition 1.0 |
| ✅ | Courses | 1.4 Configure a Root CA & issuing CA: all 6 lessons on the live page | edition 1.0 |
| ✅ | Courses | 1.3 Harden the baseline: all 6 lessons on the live page | edition 1.0 |
| ✅ | Courses | 1.5 Connect and segment the network: all 7 lessons on the live page | edition 1.1 |
| ✅ | Courses | 1.6 Finish the PKI services: all 5 lessons on the live page | edition 1.0 |
| ✅ | Courses | 1.7 Addressing and tiered administration: all 6 lessons on the live page | edition 1.1 |
| ✅ | Courses | 1.8 See everything: the logging pipeline: all 6 lessons on the live page | edition 1.1 |
| ✅ | Courses | 1.9 Bring in the fleet: all 7 lessons on the live page | edition 1.1 |
| ✅ | Courses | 1.10 Patch, protect, and watch for weakness: all 6 lessons on the live page | edition 1.1 |
| ✅ | Courses | 1.11 Stand up the business services: all 5 lessons on the live page | edition 1.0 |
| ✅ | Courses | 1.12 Prove you can recover: all 6 lessons on the live page | edition 1.1 |
| ✅ | Architecture courses | New lesson “Protect the router's own management” is live |  |
| ✅ | Architecture courses | New lesson “Admit only enrolled devices with 802.1X” is live |  |
| ✅ | Architecture courses | New lesson “Carry the copies to the offline cabinet” is live |  |
| ✅ | Architecture courses | /training/logging-pipeline mentions Linux + SBD-AUDIT01 |  |
| ✅ | Architecture courses | /training/patch-protect mentions Nessus + Linux |  |
| ✅ | Architecture courses | /training/workstation-fleet mentions SBD-DHCP01 + NPS |  |
| ✅ | My Account | Continue learning leads the signed-in page (text present) |  |
| ✅ | My Account | Membership options Community / Builder / Guided |  |
| ℹ️ | My Account | Guided tier text (informational) | Guided is monthly. All prices are in USD. Available now Community Build a daily learning habit. $ 0 No payment details required. Current learning paths and courses Existing downloads and references Streaks, XP, quests and achievements in the app Progress sync with an optional account Continue with Community Coming soon · planned benefits Builder Turn lessons into projects. $ 20 / month $20 billed monthl |
| ❌ | App labels | iOS invitation-only TestFlight beta / Android coming soon |  |
| ✅ | Inside the Network | Page heading and “Read the network as text” |  |
| ✅ | Closing invitation | “If this helped you, help someone else find it.” on guides (script served) |  |
| ✅ | Resources | All 64 training resources (workbooks, checklists, guides) download | all 200 |
| ✅ | Inside the Network | Live model has linuxMembers (Splunk, Nessus) and domainMembers |  |
| ✅ | Inside the Network | Live model gives the NPS role to SBD-DHCP01 (roleChanges) |  |
| ✅ | Inside the Network | Live model has policy rules F19 and F20 |  |
| ❌ | Training recommendations (Oct 6) | Sample domain standardized on sbd.test in the model | SecureByDesign.internal still in app.js, packets.js |
| ✅ | Training recommendations (Oct 6) | “What Is Active Directory?” uses sbd.test as the internal domain |  |
| ❌ | Training recommendations (Oct 6) | DC01/DC02 workbook new edition (ports box, pktmon step) | "edition": "Materials edition 0.3" |

Files: 208/208 identical

## Routes
- 200 / — Secure By Design — Cybersecurity Starts with Curiosity
- 200 /training — Training Library | Secure By Design
- 200 /inside-the-network — Inside the Network | Secure By Design
- 200 /my-progress — My Account | Secure By Design
- 200 /account — My Account | Secure By Design
- 200 /about — Secure By Design — Cybersecurity Starts with Curiosity
- 404 /blog — Secure By Design — Cybersecurity &amp; System Administration
- 404 /blogs — Secure By Design — Cybersecurity &amp; System Administration
- 200 /resources — Career Goals &amp; Support | Secure By Design
- 404 /rmf-series — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/artifacts — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/controls — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/phases-and-evidence — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/prepare — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/system — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/other-approaches — Secure By Design — Cybersecurity &amp; System Administration
- 404 /rmf-series/concepts/dns — Secure By Design — Cybersecurity &amp; System Administration
- 200 /inside-network-model/model.html — Inside the Network | Secure By Design
- 200 /training/dc01-dc02/index.html — Build the identity foundation | Secure By Design
- 200 /training/rmf/index.html — Risk Management Framework, Body of Evidence &amp; Authorization to Operate | Secure By Design
- 404 /sitemap.xml — Secure By Design — Cybersecurity &amp; System Administration
- 200 /robots.txt — 
- 200 /training/dns-configuration — Configure DNS | Secure By Design
- 200 /training/dns-configuration/checklist — Configure DNS — configuration checklist | Secure By Design
- 200 /training/two-tier-pki — Configure a Root CA &amp; issuing CA | Secure By Design
- 200 /training/two-tier-pki/checklist — Configure a Root CA &amp; issuing CA — configuration checklist | Secure By Design
- 200 /training/harden-baseline — Harden the baseline | Secure By Design
- 200 /training/harden-baseline/checklist — Harden the baseline — configuration checklist | Secure By Design
- 200 /training/connect-segment — Connect and segment the network | Secure By Design
- 200 /training/connect-segment/checklist — Connect and segment the network — configuration checklist | Secure By Design
- 200 /training/pki-services — Finish the PKI services | Secure By Design
- 200 /training/pki-services/checklist — Finish the PKI services — configuration checklist | Secure By Design
- 200 /training/tiered-admin — Addressing and tiered administration | Secure By Design
- 200 /training/tiered-admin/checklist — Addressing and tiered administration — configuration checklist | Secure By Design
- 200 /training/logging-pipeline — See everything: the logging pipeline | Secure By Design
- 200 /training/logging-pipeline/checklist — See everything: the logging pipeline — configuration checklist | Secure By Design
- 200 /training/workstation-fleet — Bring in the fleet | Secure By Design
- 200 /training/workstation-fleet/checklist — Bring in the fleet — configuration checklist | Secure By Design
- 200 /training/patch-protect — Patch, protect, and watch for weakness | Secure By Design
- 200 /training/patch-protect/checklist — Patch, protect, and watch for weakness — configuration checklist | Secure By Design
- 200 /training/business-services — Stand up the business services | Secure By Design
- 200 /training/business-services/checklist — Stand up the business services — configuration checklist | Secure By Design
- 200 /training/prove-recovery — Prove you can recover | Secure By Design
- 200 /training/prove-recovery/checklist — Prove you can recover — configuration checklist | Secure By Design
