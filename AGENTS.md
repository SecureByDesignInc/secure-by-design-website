# Secure By Design network baseline

## Inside the Network presentation

System details are the initial explorer view. Keep the wider desktop inspector, prominent system identity/address/service information, and persistent system selector with previous/next navigation. On mobile, place the inspector immediately after the 3D stage. Give the six traffic processes prominent cards with short descriptions. Place the larger playback controls, step timeline, and current-step explanation immediately above the 3D stage on every screen size. Keep traffic sequences available without automatically switching away from system details on page load.

The user requested removing disclaimer-style presentation copy such as “Educational simulation · not live telemetry,” “Ports are examples, not a firewall rule set,” and repeated illustrative/unverified/planning labels from the network diagram. Keep concise technical requirements and unresolved configuration choices without claiming live telemetry or verified results. Retain NIST SP 800-53 security-control references, mappings, and technical verification checks. Remove the RMF lifecycle and RMF process teaching from Inside the Network; the independent RMF section owns that material. Do not restore the lifecycle strip, categorization walkthrough, or authorization-process copy in this diagram.

## Current shared header and footer placement

The latest header sizing gives the Secure By Design branding more prominence: 128px logo on desktop, 88px on narrow screens, compact 32px app-store artwork, and 32px-minimum social buttons with 16px icons. Keep these proportions in the shared React and generated Community headers.

The Get the app header contains only its heading and store badges. Do not add Request access or Create account / Sign in links within that header section; those links remain appropriate in the requested page content below.

Cyber Range is a request-access preview: retain the three-step Build your path flow, then show the choices and a Request access link to My Progress. Do not expose the dashboard, module links, lab launcher, or account signup prompt from this preview, including for returning visitors with saved profiles. Keep CYBER_RANGE_AVAILABLE false until the user authorizes launch. Replace public development-status wording with Request access links to /my-progress, referencing its Create account / Sign in option; requests do not automatically grant access. App download badges remain disabled.

Latest October 3 adjustment: keep app-store badges and social links in the header, with app-store badges above the social row. Do not move social links to the footer. Keep the app buttons disabled until launch is authorized. Place the Secure By Design logo to the left of its wordmark, with left-aligned branding and responsive sizing. This supersedes older logo-right instructions below. Apply the same arrangement to the generated Community shell.

The user's latest October 3 direction supersedes the earlier platform-color request: social links use Secure By Design styling, with cyan symbols, navy/blue gradient surfaces, light labels, and 12px corners matching the shared navigation. Keep the recognizable monochrome platform paths in `public/social/*-sbd.svg` and preserve all destinations. This applies to the shared React header and generated Community shell.

The user requested swapping the partner references with the social links on October 3, 2026. Place the social links beside company branding above navigation, wrapping beneath branding on smaller screens. Place Tenable Partner and Red Hat Partner in the footer where the social links were. This supersedes older partner-placement instructions below; preserve the official partner artwork and existing social destinations.

## Purchased-template design update

The user supplied the purchased SalesHookAI template ZIP and explicitly chose Secure By Design blue/cyan branding. This checkout is its integrated preview, superseding the older homepage and header visual specifications below. Preserve the purchased shader, gradient buttons, stacked reading tabs, and community cards in `components/saleshook/`, the home composition in `app/template-home.tsx`, and shared shell in `app/template-shared.css`. Keep long-form content and forms light for reading. See `docs/template-integration.md` for source provenance and validation. The independent blogs, brand voice, partner identities and control behavior, existing forms and backend authorization, and network/content rules still apply. Publish when the user asks. Arrange Secure By Design, Tenable Partner, and Red Hat Partner in three evenly spaced columns above navigation on desktop. Keep the logo to the right of the Secure By Design wordmark within its group. Wrap the branding and partner row on smaller screens. Do not restore the decorative mission badge above the homepage heading.

The user specified the following design baseline on September 8, 2026:

- The network is fully air-gapped.
- All transfers across the boundary are manual and human-controlled, using approved removable media. Do not design an automated transfer path or physical network connection across the air gap.
- The control catalog is NIST SP 800-53 Revision 5. SP 800-53B is a federal baseline reference; a SAP/JSIG selection requires the applicable CNSSI 1253, overlays, and AO-approved direction. Do not treat an SP 800-53B Moderate baseline alone as the JSIG baseline, or carry forward the original diagram's Revision 4 or data-diode annotations as current requirements.
- CIA impact levels are MLL: Moderate confidentiality, Low integrity, and Low availability.

Use this baseline when helping with the separate example system, its network architecture, evidence examples, and future labs. Distinguish the public website from the isolated network it describes. Do not assume internet or cloud connectivity inside that example network boundary.

The system profile and downloadable example brief reflect these decisions. The user's stated categorization is planning input, not evidence of a completed assessment or authorization.

## Network-neutral RMF chapters

The user subsequently requested that all seven RMF steps and the series overview explain the guidance without assumptions about the network to which it will apply.

- Keep these chapters conversational and focused on decisions, responsibilities, and open-ended discussion questions.
- Do not impose the example system's topology, technology, staffing, transfers, CIA levels, control selection, findings, deadlines, or authorization outcome on the chapters.
- Use NIST SP 800-37 Revision 2 and the approved public 2016 JSIG with their edition and applicability distinctions. Keep detailed artifacts and BOE maintenance in the consolidated RMF Guide & Evidence. Clearly label its Secure By Design application examples; the chapter conversations remain network-neutral.
- NIST is the foundation driving the chapter conversations: SP 800-37 supplies the RMF and SP 800-53 the controls. Explain JSIG as SAP-specific implementation direction for that foundation, in conjunction with CNSSI 1253 and applicable DoD/SAP authority direction.
- Connect the NIST purpose to the corresponding JSIG instructions in each step instead of presenting two unrelated source summaries. Keep edition details secondary but explicit. Do not describe NIST as merely theoretical, JSIG as a universal configuration recipe, or Prepare as a step from the 2016 JSIG.
- Spell out acronyms on first use in explanatory content. The unified guide includes source documents once in its contents; do not duplicate the source panel for every phase.
- Keep the RMF chapters independent of the example network. Do not restore claims that every chapter follows its particular design.

## Independent blogs

The user wants the Compliance Blog and Technical Blog to remain independent.

- Keep separate article collections, reading paths, examples, and editorial focus.
- The Technical Blog explains technologies and their administration and security. Do not add RMF bridge callouts, control-mapping promotions, or links that make it part of the RMF reading sequence.
- The Compliance Blog covers mission, risk, control selection, accountability, assessment, authorization, and evidence. Explain system dependencies only as needed for those decisions; do not turn its chapters into technical tutorials or continuations of the Technical Blog's characters and project story.
- Keep article and sidebar recommendations within their own blog. Both blogs may remain accessible in the global navigation and as distinct destinations on the consolidated homepage.
- Use “Security Journal” at `/blogs` as the single global-navigation entry for discovering both blogs. Keep the Compliance Blog and Technical Blog as distinct paths within that hub, and preserve their existing independent routes and reading sequences.

## Home and About

- Home uses a compact pale blue “Cybersecurity starts with curiosity” banner with navy text and no repeated logo; the logo remains in the site header. The user removed The Goal section. “Be part of the community” at `/#community` follows the banner, then the reading paths at `/#start-reading`, then the author's condensed “That’s why I started Secure By Design” introduction at `/#about`. The future plans sit beside the reading paths on desktop and beneath them on smaller screens.
- Emphasize the two blog destinations with larger titles and prominent Explore links. Stack the blog cards beside a narrow right-hand “What’s coming next” panel on desktop; move the panel below them on smaller screens. Match the panel to the current homepage’s sans-serif headings, pale blue cards, rounded corners, readable text, and spacing. Keep Videos marked “In the works.” Present the Cyber Range learning-path pilot as live without implying that reader accounts grant lab access or that one-click AWS provisioning is available.
- Use a relaxed, conversational Secure By Design brand voice, centered on the reader and the site’s purpose rather than the author and welcome both seasoned professionals and newcomers. Keep the mission introduction condensed, with a smaller heading and tighter spacing so the blog destinations below draw attention. Use blog destinations rather than featured articles; mention future labs and videos briefly as plans.
- Keep `/about` as a permanent redirect to `/#about`, and direct About links to that homepage section. Do not restore a separate About navigation tab or duplicate About page.
- Preserve the clean cybersecurity and system administration direction and the user's logo. Do not invent credentials, testimonials, subscriber counts, or available labs and videos.
- The user confirmed participation in the Red Hat and Tenable partner programs. Display these relationships beside the company logo in the shared site header, above navigation; on narrow screens the partner logos wrap directly beneath the company branding. Include the same header on Community pages. Do not repeat the partner panel in the homepage body. Use the official, unmodified logo assets in `public/partners/` with separate Red Hat Partner and Tenable Partner labels. Preserve their colors, proportions, clear space, and explicitly sized image containers; do not invent partner tiers or certifications, recreate legacy partner badges, or imply sponsorship of the articles. Asset provenance is recorded in `docs/partner-branding.md`.

Partner banner content is shared in `content/partners.json`, ordered Tenable first and Red Hat second. Keep the header focused on the logos and partner labels; retain topic descriptions in the data without showing them in the compact header. Do not restore “Request available resources” controls beneath either partner. Preserve the official logo colors rather than recoloring on hover.

Match partner branding to the company logo section: use the same light header background, navy text, blue accents, and 40px logo containers. Keep the partner area compact and transparent with a subtle divider. Use the official light-background logo variants. Do not restore a dark banner, oversized cards, extra heading, accent top border, or panel shadow.

## Scalable Community and Videos hubs

- Keep Community and Videos as independent top-level navigation destinations.
- Community at `/careers` grows through distinct participation paths: Career Goals & Support, Cybersecurity Resources, and Share What You Know. All three path selectors switch panels within the Community hub; the Career Goals panel then links into the full worksheet. Preserve the existing forms, APIs, and privacy boundaries when expanding it.
- Community and Career Explorer share `/careers`, with Community content first and the career-planning, role-directory entry, and job-market tools below. Keep one Community link in the shared navigation. `/career-explorer` redirects to `/careers`; role-directory and detail URLs remain valid. Preserve both sets of controls and their existing data and privacy behavior.
- Videos at `/videos` renders compact catalog tiles from `content/videos.json`. Expand each tile inline across the catalog width to contain its complete build explorer, embedded recording, and training resources. Keep one episode experience, 3D scene, and iframe mounted at a time; close it on search/topic changes or filter resets. Search the episode metadata, derive topic choices from real tags, show 12 initial matches with Show more, and retain a clear-filter empty state. Use each episode's `outcomeSummary`, `outcomes`, and scene metadata; `identity-dc` selects the current DC01/DC02 model, while unsupported scenes retain the written chapter explorer. Do not invent future content. The previous format tabs and short-clip collection were removed at the user's request. Keep the DC01/DC02 recording marked coming soon until its real YouTube ID is provided; its training materials are available now. The October 4 revision makes the collapsed tiles smaller while preserving the complete expanded experience and 44px opening controls. The user authorized publication of these catalog changes.
- Preserve honest publishing states for Videos. Do not invent videos or channel links before they exist.

## Consolidated RMF guidance

- The user removed “The example system · Coming soon” from the website. Do not restore its navigation, promotional sections, access requests, or holding-page content. Redirect `/rmf-series/system` permanently to `/rmf-series`. Keep the separate Inside the Network diagram and other RMF guidance available.

- The overview and Body of Evidence & Artifacts are now one structured resource, “RMF Guide & Evidence,” at `/rmf-series`. Keep full phase explanations and diagrams, responsibilities, artifacts, authorization-package guidance, and evidence maintenance together inside the guide. The homepage uses one combined Compliance Blog panel. Redirect `/rmf-series/phases-and-evidence` to the guide and preserve its phase anchors. Do not restore separate overview/evidence tabs or the removed “Find the source documents in Compliance” sentence. The source card is labeled “Source documents.”
- Present the Risk Management Framework and authorization package/evidence as one “RMF Guide & Evidence” entry in the Security Journal and on the homepage. Do not restore a separate authorization-package promotional link alongside the RMF entry. Keep the package and maintenance sections available inside the guide, including existing anchors and phase links.
- The user approved the public 11 April 2016 JSIG as the process source, with its six steps and Revision 4 / March 2014 CNSSI 1253 basis labeled explicitly.
- Identify Prepare as the addition from NIST SP 800-37 Revision 2. Keep this distinct from the site's Revision 5 design, and do not claim a verified current Revision 5 JSIG.
- Retain phase-specific document and section references as plain text; do not recreate Reference shelf sections.
- The user centralized source hyperlinks in the Compliance panel. Keep those document links prominent, and do not restore external source links in chapter prose, diagrams, or Body of Evidence & Artifacts. Preserve internal chapter and evidence navigation.
- The latest request consolidates all seven full chapter bodies, phase visuals, artifacts, authorization-package guidance, BOE maintenance, source documents, and the nine other-approach references into the single `/rmf-series` guide. Use a contents menu and phase subsection anchors. Remove the separate guide/other-approaches tabs and the duplicate seven-chapter reading path in Security Journal. Redirect old chapter URLs to their phase anchors and `/rmf-series/other-approaches` to `#other-approaches`. Preserve every phase’s discussion and handoff, NIST/JSIG distinctions, and existing `rmf:*` progress IDs; share progress state across the seven embedded sections.
- The user removed the guidance-edition callout from the top of Body of Evidence & Artifacts. Do not restore it; retain phase-specific source citations.

## Accepted site-wide design

- The user approved extending the homepage and Active Directory article preview across the whole website. Use `app/editorial.css` for the shared navy, cyan, and pale blue design, with bold sans-serif headings, rounded cards, pill navigation, and raised primary links. `app/home.css` holds the homepage layout.
- Keep the compact grid-backed homepage mission banner and its existing content. Other reading pages use dark navy introductions, readable white article bodies, and clear outlines or supporting navigation.
- Technical Blog begins with parent article cards, without a visible page heading. Keep children inside their parent series.
- Cyber Range uses a short local onboarding flow, personalized module order, device-local progress, and an owner-test AWS lab launcher. Preserve the clear distinction between the live pilot and future public accounts or one-click provisioning. Videos remain coming soon.
- Extending this design does not by itself authorize production deployment. Publish when the user asks.

## Reader accounts

Reader accounts use verified email and password sign-in with private server-stored progress. Account creation, sign-in, recovery, and the dashboard share `/my-progress`; `/account` redirects there. Require password setup for permanent accounts, preserve existing account IDs and progress, and describe app continuity as a feature available when the app launches. See the password/account validation and native-app integration notes in `docs/reader-accounts.md`. Do not switch readers to ChatGPT sign-in. Keep the existing ChatGPT-based owner administration separate. Account signup does not subscribe readers to marketing or grant lab access. Preserve explicit import of browser-only learning progress and server-side session ownership checks. See `docs/reader-accounts.md`.


## Episode 01 training branding

The confirmed copyright owner for Episode 01 training materials is Secure By Design Team LLC. Materials edition 0.3, updated 4 October 2026, is published across the 12-page PDF/Word workbook, interactive guide, notices page, and ZIP. Keep the copyright/edition footer and linked notices beside the expanded catalog downloads. The guide retains instructional lesson version 0.1.0 and its existing local-progress key for saved-record compatibility. Include notices.html and the complete THREE-LICENSE.txt in package rebuilds; refresh the manifest hashes and ZIP together. Do not publish the separate attorney-review branding worksheets or add unconfirmed trademark registration claims. Preserve the compact catalog tile dimensions.

The user requested stronger prominence for training materials. Keep resources first in the expanded episode and before the recording in both DOM and visual order; retain the full interactive network below. The latest October 4 direction replaces cost references with sharing invitations: "Learn it. Share it. Pay it forward." in the introduction, "Learn it. Share it." on material badges, and "Pay it forward" beside the catalog material types. Keep the View materials opening button, compact collapsed tile dimensions, and copyright/notices links.

The user removed the Mac App Store and Microsoft Store header badges. Keep only App Store for iPhone & iPad and Google Play for Android in content/app-stores.json, arranged as a centered two-column pair under Get the app. Preserve the launch gate and disabled state until real listings are supplied and launch is authorized. Regenerate the Community headers and career-shell.css from the shared source so this remains consistent across the site.

The compact message beneath the training downloads is "Pay us back by sharing our content." with "Share Secure By Design. Your recommendation is our reward." and a "Pass it on" button. The latest direction makes every Pass it on action share only https://securebydesigninc.com/, including the training panel, native sharing, clipboard copying, and manual links. Sharing is optional; downloads remain available directly. Preserve this concise copy and the sharing invitation on material badges.

Keep a compact Pass it on button beside About in the shared footer, including generated Community shells. Remove the decorative arrow beside About Secure By Design. Every sharing action uses the fixed homepage URL, regardless of page, query, or fragment; page-specific sharing is superseded. Both React and static footers share public/footer-share.mjs for markup and behavior, with homepageShareUrl also used by the training panel. Preserve native sharing, cancellation, and clipboard/manual-copy fallback.

## RMF training catalog publication

The user approved publication of the RMF, Body of Evidence, and ATO training catalog on October 4, 2026, and explicitly requested its tile immediately after the Windows Server tile. Keep the RMF course in `content/videos.json` under `courses`, anchored after `dc01-dc02`, within the existing Videos training catalog. Preserve the compact tiles and single expanded experience. Course entries use the course materials panel and do not invent recordings or technical network scenes. The RMF tile must show “Video coming soon” alongside its available training materials until a real recording is supplied. The complete interactive course and Word catalog live at `/training/rmf/index.html`; this is distinct from the consolidated reference guide at `/rmf-series`. Keep the original Windows Server episode and materials intact.

Use the full course title “Risk Management Framework, Body of Evidence & Authorization to Operate” in the training catalog. The user clarified that the first Windows Server training will grow to cover the steps used to build Inside the Network; the second course teaches how to prepare that same system for authorization. Make this relationship explicit in the tile and course introduction. Apply the practice work to that shared example system while keeping general RMF reference chapters network-neutral.

## Training Library naming

The user renamed Videos to Training Library on October 4, 2026. Use Training Library in the shared navigation, page metadata, page label, homepage, sidebar, and training return links. Retain the existing `/videos` URL and regenerate the Community navigation from `content/navigation.json`. This naming supersedes earlier references to Videos as the destination name. Training materials are available; keep each unpublished recording labeled Video coming soon, and do not label the whole Training Library as coming soon.

## Public social links

The user requested removal of their GitHub link on October 5, 2026. Keep GitHub out of the public social links in `content/videos.json`, the shared React header, and the generated Community shells. Preserve the remaining social destinations. This supersedes earlier instructions to preserve every social destination.

## Security Journal temporarily offline

The user reversed the Learning Library consolidation and requested that Security Journal be retained but removed from the website for now. This supersedes earlier instructions to publish Journal navigation, reading panels, and article/reference pages.

- Restore the compact Training Library at `/videos`, including the Windows Server episode and subsequent RMF course. `/learning-library` redirects to `/videos`; the combined catalog has been withdrawn.
- Keep Security Journal out of navigation, homepage panels, discovery links, onboarding invitations, and visible progress collections. Its `/blog`, `/blogs`, and `/rmf-series` routes and descendants return not found while unpublished. Do not leave direct article URLs publicly readable.
- Preserve the Journal source and its original reading/progress IDs. A verified source archive is stored at `archive/security-journal-2026-10-04.zip`, with restoration notes beside it. Do not delete archived teaching content or private saved progress. Restore publication only when the user asks.
- Minimal article progress metadata may remain in the retained catalog for backend compatibility. Do not bundle complete Journal prose into the public progress dashboard. Show only currently available learning-path entries and continue accepting the original stored Journal identifiers.
- The separate training packages remain available. Remove navigation to unpublished Journal pages from their interactive guides and refresh the DC01/DC02 package manifest and ZIP together; preserve its PDF, Word, copyright notices, edition, and learning progress key.

## Uniform Training Library tiles

The user requires the second training tile and every future published tile to match the first Windows Server tile's compact collapsed size. Use the shared EpisodeTile component and collapsed selectors in `app/videos/videos.css` for all entries; do not add per-course dimensions or stretch rows to the tallest title. Preserve the existing responsive equal-width grid and mobile width cap, the 124px artwork, a single kicker line, two title lines, a single subtitle line, two common availability statuses, and the 44px View materials button. Long text is visually abbreviated in the collapsed tile while its full text stays in the DOM, accessible opening label, title tooltip, and expanded content. Additional course duration/status details appear when expanded. Expanded materials and interactive scenes remain full-size and unclipped. Apply this shared sizing to future catalog entries rather than enlarging individual tiles.

## Native training companion 0.2.0

The approved app update follows the published Training Library with Home, Training, Explore, and My Progress. Shared course IDs and materials are in content/training-progress.json and content/training-resources.json, generated by the native repository importer from this Site. Preserve older native lesson IDs and guest preferences. Native progress uses the same verified reader account with a separate bearer session and explicit guest import; see docs/reader-accounts.md. The guide account panel saves only learning status and bookmarks, never local evidence notes. Keep public store badges gated until real listings and launch authorization exist.

## Membership plans

The user approved publishing Community, Builder, and Guided on October 5, 2026. The latest October 5 request consolidates memberships into `/my-progress`: keep one My Account navigation entry, with progress/account controls and publicly visible membership options on the same page. `/memberships` permanently redirects to `/my-progress#memberships`; homepage and optional learning invitations target that section. In the native app, use the My Account tab for the full comparison rather than a separate Memberships screen. Community includes existing content and app rewards at $0. Builder is planned at $20/month or $180/year (25% annual savings), Guided at $99/month. Keep paid benefits marked coming soon until delivery and checkout are explicitly implemented; selecting details must never create a subscription or imply enrollment. Preserve optional sharing, account access, and progress. The app carries an identical copy of `content/membership-plans.json`.

The user's latest October 5, 2026 correction attributes the membership and onboarding notes to “Secure By Design”. Use that exact name, including spaces and without “Team”, instead of the earlier SecureByDesign Team, Jon, or Jon Mifflin attribution. Preserve plural wording and SBD initials where applicable.

The consolidated progress and membership destination is named “My Account” at the user’s request. Preserve `/my-progress` and existing account-return URLs for compatibility; the website navigation, page title, and native tab use My Account.

## Realistic data-center appearance

The user requested keeping Inside the Network’s interactive 3D motion while showing recognizable infrastructure equipment. Preserve the cutaway server room, rack-mounted equipment, switch ports and cabling, workstation area, separate offline root and backup storage, and service-to-room location links. Retain all system identities, traffic scenarios, controls, camera interactions, reduced-motion handling, and 4K export. Equipment is unbranded because specific hardware makes/models and virtualization host assignments were not supplied. Do not invent those as established inventory or add network links to offline equipment.

## Automatic Community membership

The user requested automatic Community enrollment wherever a visitor submits their email. Accepted account setup requests, successful website/app sign-in, resource signups, career requests, and community contributions create one normalized-email record in `community_memberships`. Show clear enrollment wording before submission and the authenticated status in My Account. Never capture unfinished typing or treat an email submission as authentication. Link membership to a reader account only after server-verified ownership; preserve account verification, passwords, rate limits, guest progress import, and private-record authorization. Community membership is separate from resource-email consent, the optional onboarding email sequence, paid plans, and lab access. Retries must not duplicate membership or override an email unsubscribe.

## Related training categories

The latest October 5 request groups related Training Library tiles while retaining their uniform compact size and inline expansion. Build the Network contains the existing identity build, Configure DNS, and Configure a Root CA & issuing CA. Authorize the Network contains the existing RMF course. This grouping supersedes the earlier requirement that RMF immediately follow the first tile. Preserve all existing course numbers and progress identifiers. Category, topic, and search filters combine; changing any filter closes the single expanded experience.

The configuration courses share `content/configuration-courses.json` between the expanded tile, standalone `/training/[slug]` guides, and native importer. Keep their real Markdown checklists, verification steps, source documentation, quizzes, and shared My Account progress IDs consistent. Continue the existing sbd.test training example without claiming those choices are verified deployed inventory. The two-tier PKI course uses a disconnected workgroup standalone root and a domain-joined enterprise issuing CA, with controlled manual removable-media transfer. Videos remain coming soon.

## Approved website learning update — October 5, 2026

The user approved all five website suggestions: place a compact Start building your network section immediately after the homepage hero; group existing compact expandable training into Network Foundations, Certificates & Trust, and Network Authorization; lead signed-in My Account with Continue Learning, progress and saved materials before account settings and membership; label iOS as invitation-only TestFlight beta and Android coming soon; use Written training available / Video coming soon and Open training. This supersedes earlier placement, category-label, View materials, and app-launch-copy instructions. Preserve store launch gates, private account behavior, all course/progress identifiers, and existing materials. No public TestFlight enrollment link is available.

## Inside the Network reference and traffic placement — October 5, 2026

Place Follow the traffic beneath the 3D explorer (after the mobile system inspector), with playback controls remaining above the 3D stage. Consolidate Technical sources and Protocol reference into one Protocols & technical sources dialog opened from the existing bottom reference location. Preserve the full protocol table, technical source links, architecture explanation, license, and traffic interactions. This supersedes the previous traffic-choice placement above the graphic.

## Inside the Network screenshot corrections — October 5, 2026

The user's screenshot clarification moves the entire playback panel (sequence controls, step timeline, and current-step explanation) below Follow the traffic, on desktop and mobile. Consolidate Core switch stack, Controlled media handling, Offline backup & recovery, and Security design & policies into one Infrastructure & security dropdown beside Choose a control family. Remove the NETWORK TOPOLOGY toolbar label. Preserve all four destinations and their existing behavior. This supersedes the earlier requirement to keep playback above the stage.

## Quiet VLAN sidebar — October 5, 2026

Incorporate VLAN navigation alongside the data center as a collapsed Network segments disclosure at the top of the existing inspector, replacing the separate full-width VLAN strip. Use a compact two-column list with subtle color markers; selecting a VLAN retains the existing scene highlighting and architecture details, collapses the list, and returns focus to its summary. On mobile it sits with the inspector beneath the 3D stage. Preserve the recent Follow the traffic → playback order and consolidated toolbar menus.

## Interactive relationship companion — October 5, 2026

Inside the Network includes a compact 3D Relationship view in the inspector beside the data-center scene. Keep it synchronized with VLAN, equipment, infrastructure, security-practice, NIST control/family, policy, and traffic-step selections. Derive its content from the shared inventory and security register; clickable objects and matching keyboard buttons inspect the corresponding entities. Dotted associations/membership are distinct from permitted packet motion, pending/denied flows stop at a gate, and offline operations use manual-process highlights without animated network traffic. Honor the common Motion toggle, reduced motion, visibility, and WebGL fallback. Keep the main room prominent, the Network segments disclosure collapsed by default, and the established toolbar/reference/traffic order.

## Consolidated exploration — October 5, 2026

The user's latest screenshot request removes the standalone Infrastructure & security and Choose a control family menus above the data center. Their complete content now lives behind one Explore button within the existing Relationship view. Reveal either infrastructure/security or control families one group at a time, then return to the same 3D view on selection. Preserve every destination, scene synchronization, keyboard access, Back/Close/Escape behavior, and the quiet default layout. This supersedes the earlier requirement to keep the two toolbar dropdowns side by side.


## Unified network build category — October 5, 2026

The latest Training Library screenshot request consolidates Certificates & Trust into the first category, now named Build the Network. Keep the tiles ordered Build the identity foundation, Configure DNS, then Configure a Root CA & issuing CA in the same responsive grid, with PKI immediately beside DNS when space permits. Use the existing network-build category ID, preserve course numbers, progress IDs, compact dimensions and inline expansion, and keep Network Authorization separate. Update the homepage category labels to match. This supersedes the earlier three-category Network Foundations / Certificates & Trust / Network Authorization arrangement.

## Share invitation and authorization parts — October 5, 2026

Make the Training Library introduction’s “Learn it. Share it. Pay it forward.” invitation a working share button using the existing TrainingShare component in compact form. Keep native sharing, cancellation, clipboard/manual fallback, and the fixed https://securebydesigninc.com/ homepage URL consistent with other share actions.

Network Authorization now has three compact, expandable tiles: Risk Management Framework (02A, modules 01–04), Body of Evidence (02B, modules 05–09), and Authorization to Operate (02C, modules 10–12 plus the four hour capstone). They open their relevant modules and resources in the existing complete course. Preserve all twelve original training:rmf-boe-ato progress IDs, course materials, the full Word catalog, and shared evidence workspace. Keep the original rmf-boe-ato catalog key for the first part and add distinct keys for the latter two; this supersedes the single combined tile. Derive study-hour and lesson counts from the actual module catalog, and retain Written training available / Video coming soon and the common tile sizing.

## Note placement and closing invitations — October 5, 2026

The user approved the full “A note from Secure By Design” card immediately after the homepage’s Start building your network section and before Community. Read its text from content/membership-plans.json so it stays consistent with the retained My Account note. Avoid duplicating the full card throughout the Training Library.

At the end of the identity, DNS, PKI, and authorization guides, use the short invitation “If this helped you, help someone else find it.” with a working Pass it on button. Configuration guides show it on the final lesson; identity shows it on the final chapter; authorization shows it at the end of each part (modules 04, 09, 12) and the capstone. Sharing remains optional and uses the fixed homepage URL with native sharing and copy/manual fallbacks. The source copy and behavior are in public/footer-share.mjs; scripts/prepare-training-sharing.py regenerates the standalone classic scripts and refreshes the DC01/DC02 manifest and ZIP, including local sharing assets. Preserve course progress, notes, workbooks, copyright, and materials editions.

## Inside the Network review — October 6, 2026

The user asked Claude to apply its suggested Inside the Network improvements. Control titles now match the official NIST SP 800-53 Rev. 5 catalog; control enhancements use NIST's “Base | Enhancement” form (IA-2(1), SC-8(1), and SC-28(1) had been paraphrased, and SC-8(1) / SC-28(1) are otherwise identical). The protocol reference and both domain controllers list the core client-to-DC services from Microsoft's port references: Kerberos password change 464, LDAP TCP/UDP 389, global catalog 3268/3269, SMB 445 for Group Policy and SYSVOL, RPC 135 plus the dynamic range, W32Time UDP 123, and AD Web Services TCP 9389 for administration hosts. Traffic rules, policy decisions, and the six processes are unchanged. SBD-REPO01 no longer carries the ePO/DLP single-instance sentence copied from another system.

Export 4K uses a Blob download, so large images are not lost to data-URL limits, and its message reports the actual result (“4K image downloaded” or the existing unavailable message). Scene labels use mipmapped textures for legibility. The unused pre-October 3 `model.js` was removed. `/inside-the-network` now has a page-level heading and a collapsed “Read the network as text” section below the frame, generated by `scripts/prepare-network-text.mjs` (run through `prepare-content.mjs`) into `content/inside-the-network.json` from the same model modules. Keep that section collapsed and below the frame so the quiet layout is unchanged. Run `node scripts/check-network-browser.mjs` (requires Playwright) for browser coverage.

The user then approved a seventh traffic process, “Use a web app” (07), which supersedes the six-process count above. It uses only flows the policy register already permits: DNS to the domain controllers (F01), then HTTPS on TCP 443 to SBD-WEB01 (F13). The steps are resolve the name, verify the server certificate against the internal PKI, and request the application. Revocation endpoints and any web-to-SQL dependency remain undefined or blocked. SBD-WEB01 now has system details for its HTTPS listener. The process cards show seven across on wide screens, four and three on medium screens, and two columns on phones, with the last card spanning the row.

## Inside the Network motion and learning features — October 6, 2026

The user approved all ten of Claude's recommendations for Inside the Network and its 3D motion. `flow-policy.js` maps every teaching step to the policy register, and the main room now shows that decision. Permitted steps show their rule (for example “F13 · PERMIT”) at the core. Pending rules (F03, F04, F10, F11, F12) stop at an amber gate, and denials stop at a red gate: at the core for routed traffic, or at the destination's host firewall within a VLAN. Each step carries `stream` (udp/tcp/either), `protection` (tls/signed/none), `wire`, and optional `reply:false`. Replies return as smaller markers, UDP shows as pulses, and TLS sessions show a brighter sheath and lock. WSUS 8530 content shows “Signed · not encrypted”. Policy labels keep a constant on-screen size.

The user approved an amber floor “custody walk” for manual transfers (update import and the root CA ceremony). A carried media case follows a floor path, labeled as carried by hand with no network link. This supersedes the earlier highlight-only treatment for offline steps in the main room. It never draws a network link to the offline root, and the relationship view keeps its manual-process highlights.

Four what-if sequences reuse existing systems and rules: DC01 is down (no response, then DC02), certificate expired (permitted by F13, then refused by the client), a PC tries SQL (default deny), and PC-to-PC remote desktop (D02 host-firewall deny). They appear as a compact “What if…” row under the seven process cards. The main scene stops rendering while off screen. On phones it uses a steeper camera and keeps the framed equipment clear of the stage overlays.

Shareable links use `#process=<id>&step=<n>`, `#system=<id>`, `#vlan=<number>`, `#control=<ID>`, `#facility=<id>`, or `#view=overview`. They work on `/inside-the-network`, which relays the hash to the frame and mirrors the model's state back to the page URL, and on `model.html`. A Copy link button copies the canonical page URL. System, process, and control views link to the existing identity, DNS, PKI, and RMF courses (`courses.js`, opened in the top window).

Each of the seven processes has a 2–3 question “Check your understanding” disclosure in the playback panel (`knowledge-checks.js`, using the course quiz format). Completion is stored only in the browser. It is not yet connected to My Account, because that requires new progress-catalog IDs, server validation, and dashboard grouping; add that only when the owner requests it.

Record clip (`recorder.js`) records one process or what-if from its first step, at 1920 × 1080 or 1080 × 1920. Captions and branding are optional. It saves H.264 MP4 when the browser supports it and WebM otherwise, with the WebM duration written into the file. Export 4K is unchanged.

## Inside the Network visual and interaction upgrade — October 6, 2026

The user approved all ten of Claude's visual and functional recommendations for the 3D motion graphic. These supersede earlier label and traffic-route descriptions where they differ.

- **See-through equipment.** Racks, cabinets, and walls that stand between the camera and the active systems fade to a see-through, dithered look (`equipment.batch` keeps a per-instance fade). Nothing is removed from the room.
- **Cable-tray traffic.** Routed traffic rises into the overhead cable trays, rides them to the core switch, pauses there for a visible rule check (a green ripple when permitted), and then continues along the trays to its destination. Blocked packets hold at the gate and then break apart with a red or amber flash. Traffic within one VLAN never reaches the core. It passes through the rack's own switch, and the destination's host firewall enforces policy.
- **Readable equipment.** Rack names (VLAN, rack code, and segment name) stay readable in the full-room view. Crowded labels step up on thin leader lines instead of overlapping, and labels avoid the stage's text overlays. Server names and addresses appear for active, hovered, or nearby systems. Servers carry simple, unbranded role icons on their faceplates.
- **Hover and packet inspection.** Hovering equipment outlines it and shows its name, address, and role. Selecting a moving packet freezes the motion and opens a packet card with addresses, ports, the protocol message, what is readable on the wire, and the policy decision (`packets.js`). Inspect buttons in the flow details give keyboard access. Example values, such as a client address from the pool or a dynamic port, are labeled as examples.
- **Connection map.** System details list every rule in the policy register that names the system: permitted, pending, and denied. “Show in 3D” draws them as arcs: solid green for permitted, dashed amber for pending, and dashed red for denied.
- **Attack drill.** A sixth what-if, “Attack drill”, replays six acceptance tests from the security design. The steps are PC → SQL, PC → Splunk management, peer SMB (D01), peer RDP (D02), web → SQL (F14 pending, enforced by the host firewall), and ADMIN-PC01 → DC01 management. Every attempt is stopped, and a scorecard and the acceptance test text appear in the flow details. Splunk Web's port is the product default (8000) and must be confirmed; management protocols still need validation.
- **Logical view.** The “Logical view” toggle morphs the room into VLAN islands around the core switch, with the same traffic, gates, and packets. The offline root, media handling, and backup sit in a separate dashed offline area with no uplink. Links can carry `&layout=logical`.
- **Cinematic look.** An optional “Cinematic” toggle darkens the room and makes traffic and status lights glow. Bloom is used on large screens and in recordings only. The standard look remains the default, and the choice is remembered in the browser.
- **Better clips.** Record clip adds a step length of 4, 6, 8, or 10 seconds, title and end cards, a close-up “follow the packet” camera, and an optional cinematic look.

## Inside the Network learning pass — October 7, 2026

The user approved the learning pass from Claude's 3D graphic review. Choosing a process brings the stage into view instead of scrolling to the panel below it; the stage caption carries the step narration, play/pause, back/next, and a step counter. Traffic lines have a fixed pixel width, packets keep a minimum on-screen size and draw over equipment, and pulsing rings mark each step's endpoints. The default camera is the guided shot plan (“Follow packet”): establishing shot, ease in to follow the packet, return after its first trip; viewer drags or zooms take over for that step, and reduced motion keeps static framing. During a step only its systems, segments, core, and gate keep labels, and other equipment is dimmed; Labels cycles Focus / All / Off. Labels widen to fit their text rather than compressing it. Keep these behaviors when revising the scene.
