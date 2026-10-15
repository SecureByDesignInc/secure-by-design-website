# Course 1.9 linux-repository: audit (14 October 2026)

Five lessons, now 170 minutes (2.8 h); `repo-prove` went from 35 to 40 minutes because it gained a staging step. The validator passes.

## Fixed

- **prerequisites[0]**: now lists what earlier courses really provide here: course 1.3's chrony file, and course 1.6's root certificate with the hash 1.6 recorded.
- **prerequisites[1]**: the data disk is mounted at `/srv`, holding `/srv/repo`, `/srv/incoming` and `/srv/repo-records`. It used to say `/srv/repo`, which contradicted `repo-build` step 1 and broke the same-file-system rename in `repo` step 4.
- **labNote**: now says the course stages SCC for Linux and the distribution STIG benchmark for every Linux server (decisions table; rule 5).
- **repo-design step 1**: the consumer course numbers were interim ("SBD-NESSUS01 in 1.13, SBD-WEB01 in 1.14"). They are now SBD-SPLUNK01 1.12, SBD-WEB01 1.18, and SBD-NESSUS01 "when course 1.17, coming soon, arrives" (rule 1, mentioned once). Nessus no longer appears as arriving media; SCC for Linux is named as hashed vendor media.
- **repo-design step 2**: the chosen distribution must have a DISA SCAP benchmark that SCC for Linux supports. The SCC page lists only certain RHEL, Ubuntu, SUSE and Oracle releases.
- **repo-design step 4**: "add SBD-REPO01 to F09" became "add SBD-REPO01's own time row", which matches course 1.3 ("course 1.9 adds its time row").
- **repo-design quiz 1 explanation**: SBD-SPLUNK01 arrives in course 1.12, not 1.11.
- **repo-build step 2** (rule 2): course 1.3's chrony file is now always applied before the first package update: only the two controllers, `maxdistance 16`, and no pool, sourcedir or allow line. The hypervisor's time synchronization is off. The old "if both controllers are unusable, set maxdistance 16" condition is gone.
- **repo-build step 1**: install only from the verified media until REPO01 serves itself. Any package the image lacks (chrony, the web server) comes signature-checked with the first crossing.
- **repo-build step 3, command, check, evidence, objective 1, recap, sources**: the course 1.6 root CA goes into REPO01's system trust store, ready for course 1.10's syslog over TLS. It is exported from SBD-ADMIN-SRV01's Trusted Root store with `Export-Certificate` (DER), its SHA-256 is compared with 1.6's record, and it is installed with `update-ca-trust` (RHEL family) or `update-ca-certificates` from a PEM `.crt` (Ubuntu). Three sources were added and checked: `redhat-trust` (RHEL 9, Using shared system certificates; accepts PEM or DER in `/etc/pki/ca-trust/source/anchors/`), `ca-certificates` (update-ca-certificates(8); PEM with a `.crt` extension) and `export-cert` (Export-Certificate; the default for a single certificate is DER CERT).
- **repo-build command**: new chrony check, `grep -E '^(pool|server|sourcedir|allow|maxdistance)'`, so the check proves the 1.3 lines.
- **repo-consumers summary, step 5, recap; catalog stage**: "courses 1.12, 1.14 and 1.14" now reads courses 1.12 and 1.18. Step 5 now:
  - names `/srv/repo-records/client` (the path the command and later courses use);
  - says the package is applied after the 1.3 chrony file and before a server's first package update;
  - drops the dependency on SBD-NESSUS01.
- **repo-prove step 1**: "Course 1.14 adopts this cadence into its software rule" was wrong. 1.14 leaves Linux to this course and schedules its Windows crossing on the same monthly run, and the text now says that.
- **repo-prove steps 3–4** (one step became two; rule 5):
  - Stage the Linux assessment set once for every Linux server: SCC for Linux, the distribution's SCAP benchmark, the distribution STIG and the Apache 2.4 UNIX STIGs. It is checksummed, carried across, and checked again into `C:\Staging\DISA\linux` on SBD-ADMIN-SRV01.
  - Scan the same way everywhere: copy over Tier 1 SSH, check the hashes, install as the readme directs, and run as root with course 1.4's profile. Results go to `C:\Evidence\linux-repository\baseline\SBD-REPO01`, and the checklist lives on SBD-ADMIN-SRV01.
  - The unverified `/opt/scc/cscc` is now `sudo <SCC install directory>/cscc` ("path and options from the SCC readme").
- **repo-prove command**: adds the staged-set hash check and the folder it needs before `scp`. Hashing is now recursive: `Get-FileHash …\*` skips subfolders, so the baseline would have been left out.
- **repo-prove step 5, evidence, objective 3, recap, next**: the handoff mentions the root in the trust store. "Handoff to course 1.9" became 1.10 (evidence, objective, guide checklist), and "That completes course 1.8" became 1.9.
- **Guide**:
  - `completeCaption`: "courses 1.12, 1.14 and 1.18" became 1.12 and 1.18.
  - `repo-build`: step titles 2–3 and checklist items 1–2 now cover the chrony file, time sync off and the root trust.
  - `repo-prove`: five step titles to match the split, plus the checklist (handoff to 1.10) and the network caption.
  - Apostrophes are normalized to the file's straight style.
- **catalog**: the stages are re-synced with the lesson summaries, and the description mentions the SCC for Linux set. estimatedHours stays 2.8.

## Judgment calls for the owner

1. **Ubuntu bootstrap.** REPO01 has to install chrony and Apache before its own repository exists. The RHEL family's full installation image carries both. Some Ubuntu Server images may carry neither, since chrony isn't installed by default on every release. The lesson now says to bring such packages signature-checked with the first crossing, but that runs part of lesson 3 before lesson 2.
   - Options: keep both distribution forms with that note, or standardize every Linux server on the RHEL family.
   - **Recommendation**: standardize on the RHEL family. One bootstrap, broad SCC/DISA benchmark support, and `reposync --download-metadata` keeps vendor metadata intact.
2. **SCC for Linux command path.** The official pages reachable from here (NIWC's SCC page, cyber.mil) don't document the install path or the name of the CLI binary. The lesson now uses `<SCC install directory>/cscc` and points to the readme.
   - **Recommendation**: confirm the path against the SCC readme of the release you stage and put it back. Course 1.12 must match.
3. **HTTP opened now for consumers that don't exist yet**, SBD-NESSUS01 (coming soon) included. The host firewall mirrors F19, which lists all three. The alternative is to open only SBD-SPLUNK01 and SBD-WEB01 and let each later course add its server.
   - **Recommendation**: keep it, because it matches the register row.
4. **Where the Linux assessment set lives.** I chose `C:\Staging\DISA\linux` on SBD-ADMIN-SRV01, the Tier 1 seat that administers every Linux server. Confirm, or name another place, and courses 1.12 and 1.18 follow it.

## For other courses

- **Inside the Network**: F09's sources omit SBD-REPO01, because `security.js` has `rule('F09', except(domainMembers,'dc1'), …)` and `repo` isn't a domain member. Courses 1.3 and 1.9 have the learner add a REPO01 time row, to both DCs on UDP 123. Add a matching row (or `repo` in F09) to the model and regenerate the matrix, plan and text version.
- **logging-pipeline (1.10) `collector-prove` step 3**: "trust the course 1.6 chain" should become "the course 1.6 root, which course 1.9 placed in REPO01's system trust store". Configure rsyslog's TLS to use the system bundle and check the collector's certificate name.
- **splunk-analysis (1.12)** (rule 5):
  - prerequisites[2] stages "the SCC for Linux and DISA STIG content lesson 5 scans with". Reuse course 1.9's set in `C:\Staging\DISA\linux` on SBD-ADMIN-SRV01 instead; only the Splunk Enterprise STIG is staged here.
  - `prove` step 5 and its command: replace `sudo /opt/scc/cscc` with 1.9's procedure (copy over SSH, check hashes, `sudo <SCC install directory>/cscc`). Keep the session under `C:\Evidence\splunk-analysis\baseline\SBD-SPLUNK01`.
  - Its "the SBD chain in the system trust store" is right, but SPLUNK01 is Linux, so the root gets there by hand, as in 1.9 `repo-build` step 3.
- **business-services (1.18)**:
  - `design` step 2: "Course 1.8's repository row named only those two because WEB01 did not exist yet" should become "F19 (course 1.9) already lists SBD-WEB01".
  - `apps-web` quiz: "the one approved source the 1.8 rule named" should say 1.9.
  - `apps-web` step and quiz: "the Linux pattern: hardened configuration exported and hashed" and "no SCAP automation" should become a SCAP baseline with SCC for Linux and the distribution benchmark from course 1.9's set, scanned the 1.9 way, plus the Apache STIGs as manual items.
  - "as SBD-SPLUNK01 and SBD-NESSUS01 are joined": NESSUS01 is coming soon, so cite SPLUNK01 (course 1.12).
  - WEB01 also needs the 1.3 chrony file before it joins, 1.9's client package before its first update, and the root by hand.

## Owner decisions applied (14 October 2026)

- D1 (Red Hat family only): prerequisites and labNote now name a Red Hat Enterprise Linux–family release (dnf, rpm, firewalld, update-ca-trust); every Ubuntu/apt form removed.
- D1: lesson 1 mirrors BaseOS and AppStream only; the Ubuntu keyring fingerprint command removed.
- D1: lesson 2 chrony path is /etc/chrony.conf only; root CA goes to /etc/pki/ca-trust/source/anchors + update-ca-trust (verified with trust list); Apache is httpd; SELinux labelling stated as enforcing; ufw and the update-ca-certificates command removed; the systemd-resolved listener example replaced with "loopback-only listeners, if any".
- D1: lesson 3 debmirror mirroring, gpgv/InRelease checks and the Ubuntu commands removed; reposync + rpm -K remain complete.
- D1: lesson 4 deb822 sources file, Signed-By, ubuntu.sources, Check-Valid-Until and the apt command block removed; step 3 now covers install-media .repo entries and subscription-manager; quiz 3 rewritten for gpgcheck=1 only (key unchanged, answer index 2).
- D1: lesson 5 rollback note now "dnf history undo or dnf downgrade" (apt removed).
- D1: Debian sources debmirror, apt-secure, sources-list and ca-certificates dropped from the course and every lesson; lesson 1 now cites redhat-dnf, lesson 4 redhat-keys.
- D1: catalog outcome 1 names one Red Hat Enterprise Linux–family distribution.
- D13: the "course 1.3 one-second threshold" removed from lesson 2 step, command, check and the guide checklist; verification now shows a small, steady offset.
- D15: SCC for Linux path kept as `<SCC install directory>/cscc`; not confirmable from official DISA content (search returned nothing).
