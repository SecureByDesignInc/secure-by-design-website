# Live audit — https://securebydesigninc.com

Expected build: `4a4499455fd7dfd6dd8b39962495b9a8c5dad975` · 2026-10-08T13:21:47.245Z

| | Area | Check | Detail |
|---|---|---|---|
| ✅ | Hosting | apex serves the current main build | https://securebydesigninc.com → 200 commit 4a4499455fd7dfd6dd8b39962495b9a8c5dad975 (expected 4a4499455fd7dfd6dd8b39962495b9a8c5dad975) |
| ✅ | Hosting | www serves the current main build | https://www.securebydesigninc.com → 200 commit 4a4499455fd7dfd6dd8b39962495b9a8c5dad975 (expected 4a4499455fd7dfd6dd8b39962495b9a8c5dad975) |
| ✅ | Hosting | workers.dev serves the current main build | https://secure-by-design-website.securebydesign.workers.dev → 200 commit 4a4499455fd7dfd6dd8b39962495b9a8c5dad975 (expected 4a4499455fd7dfd6dd8b39962495b9a8c5dad975) |
| ✅ | Hosting | http:// redirects to https:// | 301 → https://securebydesigninc.com/ |
| ✅ | Hosting | Every static file in public/ is live and identical to main | 209/209 identical; 0 different; 0 missing |
| ❌ | Pages | Every known page returns 200 | /blog → 404; /blogs → 404; /resources → 404; /rmf-series → 404; /rmf-series/artifacts → 404; /rmf-series/controls → 404; /rmf-series/phases-and-evidence → 404; /rmf-series/prepare → 404; /rmf-series/system → 404; /rmf-series/other-approaches → 404; /rmf-series/concepts/dns → 404 |
| ✅ | Pages | Every sitemap URL returns 200 | 28 URLs; broken: none |
| ✅ | Decommissioned | Sitemap does not list decommissioned or redirected pages | none |
| ✅ | Redirects | /videos redirects to /training | 308 → /training |
| ✅ | Redirects | /learning-library redirects to /training | 308 → /training |
| ✅ | Redirects | /memberships redirects to /my-progress | 308 → /my-progress#memberships |
| ❌ | Redirects | /career-explorer redirects to /careers | 404 → null |
| ✅ | Decommissioned | /cyber-range returns not found | 404 |
| ✅ | Decommissioned | /how-to returns not found | 404 |
| ✅ | Decommissioned | /guides-and-labs returns not found | 404 |
| ✅ | Decommissioned | /careers returns not found | 404 |
| ✅ | Decommissioned | /career-explorer returns not found | 404 |
| ✅ | Decommissioned | /career-explorer/roles returns not found | 404 |
| ✅ | Decommissioned | /career-goals returns not found | 404 |
| ✅ | Decommissioned | /resources returns not found | 404 |
| ✅ | Decommissioned | /resource-options returns not found | 404 |
| ✅ | Security | Forged oai-* identity headers cannot open owner records | API 403, page 302 |
| ✅ | Security | HSTS header on pages | max-age=31536000 |
| ✅ | Pages | No broken internal links on crawled pages | 98 links checked; none broken |
| ✅ | Decommissioned | No page links to Cyber Range or Community/career pages | none |
| ✅ | Homepage | Start building your network section |  |
| ✅ | Homepage | A note from Secure By Design card |  |
| ✅ | Homepage | Note card follows Start building your network | positions 642 / 1538 |
| ❌ | Homepage | Navigation is Home / Inside the Network / Training Library / My Account only |  Follow along YouTube TikTok Instagram Discord  |
| ✅ | Training Library | Build the Network category |  |
| ✅ | Training Library | Network Authorization category |  |
| ✅ | Training Library | Share invitation (Learn it. Share it. Pay it forward.) |  |
| ✅ | Training Library | “Written training available” and “Open training” labels |  |
| ℹ️ | Training Library | Tiles in the first page of the catalog (server HTML) | 15 tiles before "Show more"; catalog has 15 entries |
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
| ✅ | Membership (Scenario A) | My Account shows “Recommended” |  |
| ✅ | Membership (Scenario A) | My Account shows “founding pricing for the first 100 members” |  |
| ✅ | Membership (Scenario A) | My Account shows “Build a portfolio employers can see.” |  |
| ✅ | Membership (Scenario A) | My Account shows “$267 per quarter” |  |
| ✅ | Membership (Scenario A) | My Account shows “The Guided portfolio track” |  |
| ✅ | Membership (Scenario A) | My Account shows “Resume and portfolio review” |  |
| ✅ | Membership (Scenario A) | My Account shows “1:1 session” |  |
| ✅ | Membership (Scenario A) | Paid tiers still say coming soon |  |
| ❌ | App labels | iOS invitation-only TestFlight beta / Android coming soon |  |
| ✅ | Inside the Network | Page heading and “Read the network as text” |  |
| ✅ | Closing invitation | “If this helped you, help someone else find it.” on guides (script served) |  |
| ✅ | Resources | All 64 training resources (workbooks, checklists, guides) download | all 200 |
| ✅ | Inside the Network | Live model has linuxMembers (Splunk, Nessus) and domainMembers |  |
| ✅ | Inside the Network | Live model gives the NPS role to SBD-DHCP01 (roleChanges) |  |
| ✅ | Inside the Network | Live model has policy rules F19 and F20 |  |
| ✅ | Training recommendations (Oct 6) | Sample domain standardized on sbd.test in the model | ok |
| ✅ | Training recommendations (Oct 6) | DC01/DC02 guide has the ports foundation, pktmon step, and model links |  |
| ✅ | Training recommendations (Oct 6) | Course lessons link to model steps (1.5 first lesson) |  |
| ✅ | Training recommendations (Oct 6) | RMF module 08 uses the attack drill |  |
| ✅ | Training recommendations (Oct 6) | DC01/DC02 workbook new edition (ports box, pktmon step) | "edition": "Materials edition 0.4" |

Files: 209/209 identical

## Routes
- 200 / — Secure By Design — Cybersecurity Starts with Curiosity
- 200 /training — Training Library | Secure By Design
- 200 /inside-the-network — Inside the Network | Secure By Design
- 200 /my-progress — My Account | Secure By Design
- 200 /account — My Account | Secure By Design
- 200 /about — Secure By Design — Cybersecurity Starts with Curiosity
- 404 /blog — Secure By Design — Cybersecurity &amp; System Administration
- 404 /blogs — Secure By Design — Cybersecurity &amp; System Administration
- 404 /resources — Secure By Design — Cybersecurity &amp; System Administration
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
- 200 /sitemap.xml — 
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
