# Course 1.2 dns-configuration (trimmed): notes

Five lessons, 110 minutes (1.8 h): `plan` 25, `zones` 20, `records` 20, `verify` 30, `troubleshoot` 15. All five keep their ids, text and quizzes. The `time` lesson moved to course 1.3, `domain-time`, with its id kept. See `../domain-time/notes.md` for the path-wide time decision and the cross-course items.

## What changed

- **course.json**
  - The `time` lesson is removed, along with the `time` and `w32tm` sources, which no DNS lesson cites.
  - The labNote no longer mentions time.
  - `verify.next` now points to lesson 5, `troubleshoot`.
  - `troubleshoot.next` now hands off to course 1.3, Configure domain time. It used to say "Course 1.3, Harden the baseline".
- **catalog.json**, starting from the current entry:
  - Title is now "Configure DNS", and the subtitle, description, tags, art labels and network label (VLAN 10 / NAME RESOLUTION) drop time.
  - The fourth outcome is now about troubleshooting, and the outcome summary was rewritten.
  - The time stage is gone. The troubleshoot stage's detail is now its lesson summary, without the old "— or, for a sign-in failure, the clock".
  - Estimated hours: 1.8.
- **dns-configuration.json** (guide):
  - The hero, book label ("DNS"), scene label, complete status and caption, and node descriptions no longer mention time.
  - The two UDP 123 flows are removed, and the remaining flows are re-indexed to five lessons.
  - The `time` entry is removed (it moved to the domain-time guide). Troubleshoot is now tagged "05 / TROUBLESHOOT", and its network caption is DNS-only.

## Cross-course items

- Every repository mention of "Configure DNS and time" or "DNS and time" needs updating:
  - `content/training-resources.json`
  - the `content/videos.json` category description
  - `public/inside-network-model/courses.js`
  - the two-tier-pki prerequisite
- The 16-page DNS workbook still holds its time pages; regenerate it with `scripts/sync-workbooks.py`.
- Saved progress for `training:dns-configuration:time` needs migrating to `training:domain-time:time`.

No new sources. Nothing I was unsure about.
