# Secure By Design

The editorial site at https://securebydesigninc.com, with independent Technical and Compliance blogs, a full RMF series, and planned Cyber Range and video resources.

## Design and behavior

Home combines the mission statement and About page. It leads with a compact “Cybersecurity starts with curiosity” blue banner and small logo, followed directly by the author's reason for creating Secure By Design at `/#about`, and links into the two independent blogs at `/#start-reading`. The Goal section is removed. Future labs and videos are mentioned briefly as planned resources. `/about` permanently redirects to `/#about`. About links point to that section, and there is no separate About item in the main navigation.

The Technical Blog shows the first article of each series and standalone posts. The Foundations parent article links to Parts 2–6, while child articles retain previous/next links and a return link to the parent’s series list. Article pages retain serif headlines, a centered reading column, and expandable contents. The white background, navy text, and restrained blue accents continue throughout the reading pages.

The Cyber Range login sits beside the heading on desktop and directly below it on mobile. It is an interface preview: nonempty fields open a sample workspace. No identity is authenticated, no data is sent to a login service or persisted, and no lab systems are started. The password is discarded after submission. Logout or refresh resets the preview. Live accounts and labs are marked coming soon.

Cyber Range (`/cyber-range`, with `/how-to` and `/guides-and-labs`) and the Community and career pages (`/careers`, `/career-explorer`, `/career-goals`, `/resources`) are offline until the owner relaunches them; they return the site’s not-found page and their source is retained. The `/cyber-range` page combines planned walkthroughs and sandbox exercises, reusing the existing login preview. The site navigation shows a single “Cyber Range” item. The former `/how-to` and `/guides-and-labs` addresses redirect to it. Each topic links to an existing background article; unfinished guides and labs remain marked as coming soon.

## Editing

- `app/page.tsx` and `app/home.css`: combined landing/About page and its responsive styling.
- `app/about/page.tsx`: permanent redirect to the homepage About section.
- `app/blog/page.tsx`: article archive.
- `app/post-preview.tsx`: shared headlines, excerpts, and article links.
- `app/blog-sidebar.tsx`: blog introduction, current series, and upcoming features.
- `app/layout.tsx` and `app/navigation.tsx`: shared masthead, navigation, footer, and public metadata.
- `app/globals.css`: typography, colors, layouts, and responsive breakpoints.
- `app/brand-glow.css`: subtle cyan, blue, and icy-white accents drawn from the logo, with opaque fallbacks for reduced-transparency, forced-color, and print modes.
- `app/article-page.tsx` and `app/case-diagram.tsx`: article layout, diagrams, and previous/next links.
- `content/*.md`: source writing. Edit Foundations metadata and reading order in `content/series.json`; edit standalone post metadata in `content/posts.json`. Standalone posts appear after the featured introduction and do not change the six-part series navigation.
- `content/articles.json`: generated content; rebuild after changing the Markdown.
- `content/cissp-domains.json`: shared CISSP domain names. Every entry in `series.json` and `posts.json` must specify a numeric `cisspDomain` from 1 to 8; content preparation rejects missing or invalid categories. Classify each new post by its main focus rather than inheriting its series category.
- `app/cyber-range/page.tsx` and `app/cyber-range/lab-access.tsx`: Cyber Range description and local login preview.
- `app/rmf-series/` and `content/rmf.ts`: RMF chapters and the system profile.
- `app/rmf-series/phases-and-evidence/` and `content/rmf-evidence.ts`: consolidated phase, artifact, responsibility, authorization-package, and evidence-maintenance guide.
- `app/technical-training/page.tsx`, `app/videos/training-hub.tsx` and `content/videos.json`: the Training Hub at `/technical-training` (the old `/training` and `/videos` addresses redirect), one library for every course, and the editable training/channel catalog.
- `app/grc-rmf-training/`: the ATO Package Builder Hub at `/grc-rmf-training`, with the ATO Package Builder at `/grc-rmf-training/workspace`. The ATO Template Library (`/grc-rmf-training/templates`) and course 2.1's static page (`public/grc-rmf-training/rmf/`) keep their addresses but belong to the Training Hub.

## Adding videos

The catalog in `content/videos.json` pairs each episode with its interactive training guide, PDF, editable workbook, and complete download package. Channel links stay in `platforms` for the shared header. The Training Hub uses the `episodes`, `courses`, `references` and `collections` arrays; see `docs/video-catalog.md` for its fields and publishing checklist.

The DC01/DC02 episode has training available and a recording marked coming soon. Set its `youtubeId` to the actual published video's 11-character ID to show the inline YouTube player. Leave it null until then. Add verified chapter timestamps in seconds to enable chapter-start playback. No video ID, duration, or recording is fabricated.

Write like one person talking a friend through a technical topic. Keep contractions, direct explanations, and practical examples while retaining accurate technical terms. Avoid forced slang, invented personal credentials, and unsupported claims. Preserve the user's wording, named people, example systems, and existing draft labels unless asked to change them.

The former `/blog/inside-active-directory` address redirects to `/blog/what-is-active-directory`, the merged introductory article. All six articles and their reading order remain available. The site has no CMS, newsletter service, live account system, or running lab infrastructure.

## CISSP categories

These are editorial mappings of each post’s main subject to the [ISC2 CISSP exam outline](https://www.isc2.org/certifications/cissp/cissp-certification-exam-outline), reviewed September 8, 2026. Domain names appear on the main post listings, individual article headers, and the Foundations parent’s follow-up list. Display names omit “CISSP” and domain numbers; the numeric mapping remains in the content metadata.

| Post | Primary domain | Reason |
| --- | --- | --- |
| What Is Active Directory? | 5 — Identity and Access Management | Domain identity, authentication, and access. |
| Understanding Domains, Forests, OUs, and Trusts | 5 — Identity and Access Management | Organizing identities, delegated permissions, and authentication relationships. |
| Users, Groups, and Permissions | 5 — Identity and Access Management | Authorization and the access lifecycle. |
| Group Policy | 7 — Security Operations | Configuration management and controlled changes. |
| Replication and FSMO Roles | 7 — Security Operations | Maintaining availability and planning recovery. |
| Securing Active Directory | 7 — Security Operations | Privileged administration, logging, changes, and recovery. |
| Active Directory Certificate Services | 3 — Security Architecture and Engineering | PKI, certificate authorities, keys, and trust. |

## Local development and publishing

### Independent blogs

The Technical Blog (`/blog`) and Compliance Blog (`/rmf-series`) have independent content and reading paths. Technical posts cover technologies, administration, and security. RMF chapters cover governance decisions, scope, impacts, controls, assessment, authorization, and evidence. Keep article and sidebar recommendations within their own blog; global navigation, the homepage, and About can list both as separate destinations. The RMF DNS page is a dependency and evidence review, not a technical tutorial.

### Body of Evidence & Artifacts

The single “Body of Evidence & Artifacts” navigation item replaces both former evidence-library and control-catalog tabs and their promotions. Chapter and system links point into the consolidated guide. Former index and detail addresses redirect to its relevant phase; no retired sample-document or control-catalog content is rendered.

The user selected the public JSIG dated 11 April 2016 as the process source. Identify its six steps, Revision 4 catalog, and March 2014 CNSSI 1253 basis accurately. Prepare is separately sourced to NIST SP 800-37 Revision 2. Secure By Design retains Revision 5, manual air-gap transfers, and MLL as its design baseline. Do not represent the 2016 JSIG control set as a verified current Revision 5 SAP baseline. The guide distinguishes the submitted SSP (including SCTM, ConMon, RAR), SAR, and POA&M from the later authorization decision, and covers ongoing maintenance and preservation of prior evidence.

Run `node scripts/check-rmf.mjs` against the retained local server to check active routes, legacy redirects, phase anchors, navigation, and separation of the blogs.

### ATO Package Builder

`/grc-rmf-training/workspace` lets a signed-in learner take a practice system through an ATO the way eMASS and Xacta 360 organize one: system record and categorization, controls with the control approval chain, the Body of Evidence, the POA&M, the package approval chain to an automated, clearly labeled practice AO decision, and continuous monitoring. Rules are in `lib/authorization/model.mjs` (shared by the API in `server/authorization.js` and the page), data in the `auth_*` D1 tables (`drizzle/0014_authorization_workspace.sql`), and the NIST SP 800-53 Rev. 5 catalog is generated by `scripts/build-control-catalog.py`. See `docs/grc-rmf-training/workspace.md`; tests are in `tests/authorization.test.mjs`.

### Analytics

The website uses two analytics services.

**Cloudflare Web Analytics** counts page views and page speed (the owner's choice, 8 October 2026; Plausible was cancelled). Cloudflare injects its cookieless beacon at the edge, so there is no Cloudflare analytics code in this repository. Keep `https://static.cloudflareinsights.com` in the Content Security Policy's `script-src` and `https://cloudflareinsights.com` in `connect-src` (`server/security-headers.js` and `public/_headers`).

**PostHog**, cookieless and with no consent banner (the owner's choice, October 2026), records clicks, downloads, channel clicks (`channel_click`: YouTube, TikTok, Instagram, LinkedIn, Discord and the iOS app), time on page and scroll depth. It is set up as follows:

- `server/analytics.js` holds all of it. It proxies PostHog under `/sbd-e/`, removes sign-in cookies before forwarding, and serves `/sbd-e/init.js` with Cloudflare's coarse location. It also adds that script to public pages the Worker renders, wired in `server/index.js`.
- Static guides in `public/` load the same script from the end of `public/training/account-progress.js`. The DC01/DC02 guide (course 1.1) doesn't yet: its `account-progress.js` is also inside the course 1.1 download, and `tests/training-packages.test.mjs` checks that the two copies match. Add the loader there when the course 1.1 download is next rebuilt.
- Everything is same-origin, so no Content Security Policy changes are needed.
- Account, sign-in, `/app-auth/` and `/api/` pages are never tagged, and query strings (except `utm_*` and `ref`) are stripped before sending.
- PostHog does not run for browsers that send Global Privacy Control or Do Not Track.
- It is off until the Worker has a `POSTHOG_KEY` secret, set in the Cloudflare dashboard.
- PostHog's project must have "Cookieless server hash mode" turned on.
- Never call `identify()` or turn on session replay while there is no consent banner.

Keep the privacy policy's "Website analytics" section accurate when either service changes. App analytics are opt-in (PostHog), separate from the website's.

### Conversational RMF chapters

All seven chapters and their overview summaries live in `content/rmf.ts`. The shared `app/rmf-series/chapter.tsx` renders the reading layout, phase-specific source links, discussion questions, and previous/next navigation. The explicit Prepare route and the generic stage route both use it. Keep the explanations network-neutral: do not prescribe a topology, technology, impact level, staffing model, finding, or authorization outcome. Discussion prompts invite readers to explain their reasoning and identify information that would change their decisions.

NIST drives the chapter discussions: SP 800-37 supplies the RMF and SP 800-53 the controls. Each chapter then explains how JSIG adds implementation direction for DoD SAP networks and systems, alongside CNSSI 1253 and the applicable authority's requirements. `RmfGuidanceContext` keeps that relationship consistent across the overview and chapters, with the 2016/Revision 4 distinction in a secondary edition note. Prepare remains explicitly attributed to NIST SP 800-37 Revision 2.

The separate RMF system profile and evidence-guide examples retain the air-gapped, manual-transfer, Revision 5, MLL baseline. The supplied reference diagram is preserved at `archive/public-retired-2026-10-08/architecture/secure-by-design-network.png` (it is not published); its data-diode and Revision 4 annotations are superseded planning notes. The editable example brief remains at `public/resources/secure-by-design-prepare-brief.md`. These example assets are not prerequisites or assumed answers for the general chapters. The former custom Prepare illustrations and working brief are no longer embedded in its chapter.

Use Node.js 22.13 or later and pnpm. Run `pnpm install`, then `pnpm dev`. Run `pnpm build` for a production build. Markdown content is prepared automatically before development and production builds.

Editing or running a local preview does not change the live site. Publishing happens when a pull request is merged to `main`: GitHub Actions builds, tests and deploys to the owner's Cloudflare Worker (see `.github/workflows/deploy.yml`). Keep credentials out of files and Git configuration. `.openai/hosting.json` is left from the retired ChatGPT Sites project; the build still reads its binding names.

The separate `secure-by-design-ai-concept` folder contains the reviewed design history and its local preview. Apply future approved changes to this production source before publishing.
