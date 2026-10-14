# Training audit: what to do

The owner asked for an audit of every Secure By Design training course "for any inconsistencies, flaws, or inaccurate information", and chose: fix everything clear-cut, then report the judgment calls.

All course drafts are in /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/newcourses/<course id>/ (course.json, catalog.json, <id>.json guide content, notes.md). You OWN only the folders named in your assignment: edit only those. Read everything else freely (other drafts, the repository at /home/claude/secure-by-design-website), but don't edit other folders or the repository, and don't commit or push.

Read first, in this order:
1. /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/decisions.md — binding cross-course decisions and the final 1.1–1.19 path. Apply them in your courses.
2. /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/restructure-spec.md — facts to keep straight, lesson schema and style.
3. /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/guide-content-spec.md — rules for the guide JSON.
4. The repository's AGENTS.md (dated sections from October 8 on win, including the October 13 two-machine admin seats), EDITORIAL_STYLE.md, and content/inside-the-network.json (systems, addresses, VLANs, services, rule IDs).
5. Your courses' files and notes.md, then the neighbouring courses they build on or hand off to.

## Check every lesson for

1. **Technical accuracy.** Every command (real cmdlet/tool, correct parameters and syntax, safe in a lab, produces the evidence the lesson asks for), every claim about how a product behaves, ports and protocols, defaults, event IDs, file paths. NIST SP 800-53 Rev. 5 control IDs and their exact titles. DISA STIG rule IDs only where you're confident they're right; otherwise describe the requirement without an ID. Fix what's wrong; when unsure, check the official documentation (Microsoft Learn tools work well; cyber.mil is often unreachable).
2. **Quizzes.** The marked answer is actually right, the others are actually wrong, the explanation is accurate. Never just reorder answers.
3. **Consistency with the network** (Inside the Network): names, addresses, VLANs, rule IDs, which systems exist, the two-machine admin seats, vendor-agnostic hardware, no SBD-TIME01.
4. **Consistency across courses.** Every course number points at the right course (decisions.md table); prerequisites list what earlier courses really built; "next" lines and handoffs match the following course; in-course "lesson N" references are right; shared names, paths and artifacts match the owning course; decisions.md rules hold.
5. **Internal consistency.** Steps, objectives, check, evidence, command, recap and quizzes of each lesson agree; the catalog entry (title, subtitle, description, outcomes, stages = lesson titles/summaries, systems, estimatedHours = total minutes ÷ 60) matches the lessons; the guide JSON (step titles = steps in count and meaning, scene nodes/flows, control cards, checklists, mistakes) matches the lessons.
6. **Sources.** Real, official, on an allowed origin (decisions.md rule 9), and supporting what they're cited for. Drop or replace any that aren't.
7. **Style.** EDITORIAL_STYLE.md; brand "Secure By Design"; sentence case; no Windows release numbers anywhere (file names included); keep each file's existing punctuation style.

## Fixing

- Fix clear-cut problems directly in your folders: wrong facts or numbers, broken or unsafe commands, wrong quiz keys, inconsistent names, stale cross-references, decisions.md violations, guide/catalog mismatches.
- Keep lesson ids and lesson counts. Rewrite a lesson only where it's genuinely broken. Keep moved lessons' quizzes unless one is wrong.
- Don't make design decisions that belong to the owner (adding or removing systems, changing the security architecture, policy choices with real trade-offs). Record those as judgment calls.
- After editing, run `node /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/validate-draft.mjs <course id>` for each of your full courses and fix every error.

## Report

Write `audit.md` in each of your course folders:
- **Fixed** — one line per fix: where (lesson id / field) and what changed.
- **Judgment calls for the owner** — the issue, the options, your recommendation.
- **For other courses** — anything you found that must change in a folder you don't own (quote the text and say what it should become).

Then reply briefly: per course, the number of fixes, the most important ones, and the judgment calls. Usage limits are tight: work efficiently, verify only what you're unsure of, and keep tool calls lean.
