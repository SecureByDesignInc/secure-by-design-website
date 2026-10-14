# Course 1.9 linux-repository and trimmed 1.13 patch-protect: notes

## linux-repository (1.8): five lessons, 165 minutes (2.8 h)

| Lesson | Id | Minutes |
|---|---|---|
| Design the repository and its trust | `repo-design` (new) | 25 |
| Build and harden SBD-REPO01 | `repo-build` (new) | 40 |
| Mirror, verify, and publish a snapshot | `repo` (moved from patch-protect, id kept) | 35 |
| Configure the Linux clients | `repo-consumers` (new) | 30 |
| Keep it current and prove it | `repo-prove` (new) | 35 |

Moved lesson `repo`: its first quiz (snapshot date as version) is kept unchanged. The second quiz (how the one-source rule is enforced) moved word for word to `repo-consumers`, where that topic now lives. The third quiz (the assessable record, "no SCAP content") no longer fits, because REPO01 now gets a real SCAP baseline. It is replaced by a question on hash versus signature.

## patch-protect (1.13): five lessons, 130 minutes (2.2 h)

The lessons are `design` 20, `wsus` 30, `mgmt` 25, `epo` 30 and `nessus` 25. `repo` is removed. Other changes:
- Prerequisites, the lab note, catalog, guide scene and lessons were updated. REPO01 stays in the scene as an existing system.
- The `redhat` source is dropped.
- Course numbers are renumbered (1.3→1.4/1.5, 1.5→1.7, 1.6→1.9–1.11, 1.7→1.12, 1.9→1.14).
- `design`: the F19 row is now confirmed, not added. It already lists WEB01.
- `nessus` step 1: NESSUS01 applies the course 1.9 client configuration. The Linux servers, REPO01 included, allow SSH 22 from 10.0.50.20 (F15).
- `nessus` step 4: REPO01 gets a scheduled rescan instead of a "config-export" baseline.
- Five systems became four ("this course's four new systems").

## Cross-course conflicts (need changes elsewhere)

1. **Inside the Network: REPO01 has no time path.** `public/inside-network-model/security.js` has `rule('F09',except(domainMembers,'dc1'),…)`, and `repo` is not in `domainMembers`. The traffic matrix row F09 therefore omits SBD-REPO01, even though AGENTS.md (Oct 8) says "every other domain member follows the domain hierarchy (F09…)". `repo-design` step 4 and `repo-build` step 2 tell the learner to add SBD-REPO01 to F09 as a chrony client of both DCs. The model should add `repo` to F09's sources, as F01 already does through `networked`, and the matrix and plan should be regenerated. Otherwise course 1.3 `time-members` must state the same exception.
2. **Course 1.3 domain-time (`time-members`).** The spec says to "check … how SBD-REPO01 … gets its time". Per item 1 the model gives it no path. The 1.3 writer should say that REPO01 (course 1.9, not domain-joined) uses chrony to both DCs over a register row that 1.8 adds.
   - **Root distance.** A PDC emulator serving from its local clock advertises `LocalClockDispersion` 10 s by default (Microsoft Learn, W32Time registry reference). chrony's default `maxdistance` is 3 s (chrony.conf(5)), so chrony marks both DCs unusable. 1.8 tells the learner to set `maxdistance 16` and record why. The alternative is lowering DC01's `LocalClockDispersion` (`w32tm /config /LocalClockDispersion:<s>`) in course 1.3, which would serve every Linux member: SPLUNK01, NESSUS01, WEB01. The 1.3 writer should pick one approach for the whole path, and 1.8 should then match it.
3. **logging-pipeline (1.9) `collector-prove` step 3:** "trust the course 1.6 chain". REPO01 is not domain-joined, so the SBD root certificate must be placed in its system trust store by hand (`update-ca-trust` or `update-ca-certificates`). F07 is outbound from REPO01, so its host firewall needs no new inbound rule. Also: "install rsyslog's TLS module … from its own approved package set". That matches: 1.8 `repo-consumers` checks that `rsyslog-gnutls` resolves from the snapshot.
4. **business-services (1.14) `design` step 2:** "Course 1.9's repository row named only those two because WEB01 did not exist yet." F19 now lists SPLUNK01, NESSUS01 and WEB01 from the start, in 1.8 and in the model. Replace the sentence with "confirm F19 (course 1.9) already lists SBD-WEB01". Its `apps-web` quiz explanation says "the one approved source the 1.8 rule named". The rule is now written in 1.8 and adopted by 1.13, so this still reads correctly.
5. **business-services (1.14) `apps-web` step 2** and its quiz on "the Linux pattern: hardened configuration exported and hashed" and "The router, the repository, and now the web tier: no SCAP automation". REPO01 now has a SCAP baseline (SCC with the distribution's STIG benchmark) plus manual Apache STIG items. The "repository has no SCAP" comparison should go.
6. **splunk-analysis (1.11) and patch-protect (1.13):** both should apply the client package filed in `/srv/repo-records/client` (1.8 `repo-consumers` step 5) before a Linux server's first update. 1.13 now says so. 1.11 `analysis-plan` should too.
7. **SSH for the scanner (1.13):** REPO01 is not domain-joined. NESSUS01's Linux scan credential therefore needs a local account on REPO01, in the SSH `AllowGroups` group or a scanner group added to it, plus a firewalld rule for 10.0.50.20. 1.13 `nessus` step 1 mentions the firewall rule. The local account is implied but not spelled out.
8. **Old 1.8 text elsewhere.** `workstation-fleet` final `next` reads "Course 1.9 keeps the fleet alive: updates…". This should now point to 1.13. Its own `next` will change anyway, because 1.12 is followed by 1.13.

## Sources added (all checked this session)

- reposync (dnf-plugins-core docs): checked with WebFetch. It confirms that `--download-metadata` leaves the copy "instantly usable as a repository", and that `--gpgcheck` deletes packages that fail and exits 1.
- createrepo_c (GitHub): checked. It covers modifyrepo_c.
- Red Hat "Managing software with the DNF tool" (RHEL 9): checked.
- Red Hat Product Signing Keys: checked. It publishes fingerprints and `rpm --checksig`.
- debmirror(1): checked. It confirms `--keyring`, gpgv Release verification, `--method`, `--i18n` and `--rsync-extra`.
- apt-secure(8): checked. It covers the Release → Packages → .deb hash chain.
- sources.list(5): checked. It covers the deb822 fields, Signed-By and Check-Valid-Until.
- Apache 2.4 Security Tips: checked.
- sshd_config(5) (OpenBSD): checked.
- chrony.conf(5): checked. The default `maxdistance` is 3 s; `iburst` and `makestep` are confirmed.
- firewalld documentation: checked.
- Add-DnsServerResourceRecordA (Microsoft Learn): checked.

The reused DISA sources (`disa-scap`, `disa-library`, `disa-tools`), `filehash` and NIST `controls` come from the course 1.4 draft and the repository. They were not re-fetched. The shell proxy blocks most of these hosts, so all checks went through WebFetch or Microsoft Learn.

## Unsure

- **SCC for Linux path `/opt/scc/cscc`.** This is from knowledge of SCC 5.x. I could not open the DISA readme to confirm it. The command line says "SCC for Linux" so learners can adapt it.
- **Distribution neutrality.** Lessons name the RHEL family (dnf) and Ubuntu (apt) as the two forms and ask the learner to choose one family for all Linux servers. Both have DISA STIGs.
   - On the RHEL family, mirroring needs a registered connected system of the same release, which the prerequisites state. Rocky and Alma mirror the same way with their own keys.
   - Ubuntu repositories: the release, `-updates` and `-security` pockets of `main` only. Ubuntu Pro/ESM content is out of scope. Universe is excluded, so the learner must confirm needed packages (for example `rsyslog-gnutls`, which is in main) exist. `repo-consumers` step 4 does this check.
- **Guide controls.** I used CM-7 Least Functionality, CM-6 Configuration Settings, SI-7 Software, Firmware, and Information Integrity, CM-11 User-installed Software and SI-2 Flaw Remediation. These titles are as I know them from Rev. 5. They were not re-fetched, because csrc.nist.gov is blocked from the shell.
- **The `media` viewpoint node was removed** from the 1.8 scene. Flows cannot have an `offline` path to anything except the root CA. Media crossings are described in the network captions instead.
