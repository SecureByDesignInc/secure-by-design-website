# Build the Linux repository on SBD-REPO01 — configuration checklist

Secure By Design · Edition 1.0 · 14 October 2026

SBD-REPO01 is the Linux side's one road for operating-system packages, built before any Linux server exists so that SBD-SPLUNK01 (course 1.12) patches from it from its first day. It also stages the Linux assessment set, SCC for Linux and the distribution's STIG benchmark, that every Linux server is scanned with. Every Linux server in the lab runs a Red Hat Enterprise Linux–family distribution, so the commands use dnf, rpm, firewalld and update-ca-trust; choose one release for every Linux server and follow it throughout.

## Before you start

- [ ] Complete courses 1.1–1.8: the domain with DNS and course 1.3's time design with its chrony file, the course 1.4 media procedure and DISA tooling, course 1.6's root certificate and the hash it recorded, and the tiered administration plane, with SBD-ADMIN-SRV01 as the Tier 1 seat.
- [ ] Provision a virtual machine for SBD-REPO01 on VLAN 70 (10.0.70.20) with a separate data disk for /srv (it holds /srv/repo, /srv/incoming and /srv/repo-records), and install media for the one Red Hat Enterprise Linux–family release your Linux servers will use, with the vendor's published checksum.
- [ ] Have an approved connected system that can reach the distribution's repositories (for Red Hat Enterprise Linux, a registered system of the same release and architecture) and the removable-media procedure for carrying the mirror across.

## Design the repository and its trust

- [ ] Write the repository's job: the only source of operating-system packages for the domain-joined Linux servers (SBD-SPLUNK01 in course 1.12, SBD-WEB01 in course 1.18, and SBD-NESSUS01 when course 1.17, coming soon, arrives) and for SBD-REPO01 itself. Application software, such as Splunk in course 1.12 and SCC for Linux in lesson 5, still arrives as hashed vendor media; anything else is a documented exception, never a second source.
- [ ] Choose one Red Hat Enterprise Linux–family distribution and major release for every Linux server, one with a published DISA STIG and a SCAP benchmark that SCC for Linux supports, so there is one mirror to feed and one benchmark to scan against. Mirror only its operating-system repositories for one architecture: BaseOS and AppStream. Third-party repositories stay out.
- [ ] Decide the trust anchor: the vendor's signing keys. Get each key file, read its fingerprint, and compare it with the vendor's published value through a second channel before anything is published; the fingerprints go into the snapshot catalog. Each published mirror is a dated snapshot, and that date is the repository's version.
- [ ] Place it as the System Hub does: SBD-REPO01 at 10.0.70.20 on VLAN 70, not domain-joined, administered over SSH 22 from SBD-ADMIN-SRV01 only (rule A02, Tier 1). Confirm the register rows: the Linux servers to REPO01 on HTTP 80 (F19), REPO01 to both domain controllers for DNS (F01), and REPO01's syslog over TLS to the collector (F07, enabled when course 1.10 builds it). Rule F09 lists only domain members for time, so add SBD-REPO01's own time row, to both controllers on UDP 123, with an owner and a reason, as course 1.3 planned.

**Commands:**

```
# On SBD-ADMIN-SRV01: start the evidence folder and confirm no record exists yet
New-Item -ItemType Directory -Force C:\Evidence\linux-repository | Out-Null
Resolve-DnsName SBD-REPO01.sbd.test -Server 10.0.10.10 -ErrorAction SilentlyContinue   # expected: no answer yet
# On the approved connected system: read each upstream signing key's fingerprint
gpg --show-keys --with-fingerprint /etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release   # or the distribution's own key file
```

**Verify:** The design names the consumers, the one distribution and the repositories mirrored; each upstream key's fingerprint matches the vendor's published value; and the register carries F19, F01, F07 and SBD-REPO01's added time row, each with an owner.

**Evidence:** Keep the repository design (job, consumers, distribution, repositories, snapshot naming), the verified key fingerprints with where you checked them, and the register rows that name SBD-REPO01.

Notes / result / date: __________________________

## Build and harden SBD-REPO01

- [ ] Install the chosen distribution's minimal server profile from install media whose hash matches the vendor's published checksum, with a separate file system mounted at /srv, sized for at least two snapshots plus growth: /srv/repo is the web root, /srv/incoming receives each crossing, and /srv/repo-records holds the catalog. Set the name SBD-REPO01.sbd.test and the static address 10.0.70.20/24, with the core's VLAN 70 interface (10.0.70.1 in this sample) as gateway and both domain controllers as DNS servers. Because REPO01 cannot register itself in DNS, the DNS owner adds its A record (and PTR, if the reverse zone exists) from AdminJumpBox01. Install only from that verified media until SBD-REPO01 serves its own snapshot; if the image lacks a package this lesson needs, such as chrony or the web server, bring it signature-checked with the first crossing (lesson 3) and install it from that copy.
- [ ] Apply course 1.3's chrony file before the first package update, and turn off the hypervisor's time synchronization for the VM, so the domain controllers are its only clock: /etc/chrony.conf names only the two controllers, server SBD-DC01.sbd.test iburst and server SBD-DC02.sbd.test iburst, with maxdistance 16 and no pool, other server, sourcedir or allow line, and reaches both controllers over the time row added in lesson 1. Check that chronyc sources shows one controller selected (^*) and the other usable, with a small, steady offset; the maxdistance line is what admits controllers that serve their own clock, as course 1.3 explains.
- [ ] Create a named local account for each administrator in one admin group with sudo, lock root's password, and copy each administrator's SSH public key from SBD-ADMIN-SRV01. In a drop-in that sorts before the distribution's own (for example /etc/ssh/sshd_config.d/10-sbd.conf, because the first value read wins), set PermitRootLogin no, PasswordAuthentication no and AllowGroups to that group. Over your first SSH session, add the course 1.6 root certificate to the system trust store, because a server outside the domain gets it from no Group Policy: export it from SBD-ADMIN-SRV01's Trusted Root store, check its SHA-256 against the hash course 1.6 recorded, copy it across, place it in /etc/pki/ca-trust/source/anchors and run update-ca-trust, ready for course 1.10's syslog over TLS.
- [ ] Install Apache (httpd) and give it one site: Listen 10.0.70.20:80, DocumentRoot /srv/repo, Options FollowSymLinks with no Indexes, AllowOverride None, only GET and HEAD allowed, everything outside /srv/repo denied, ServerTokens Prod, ServerSignature Off and TraceEnable Off. Remove the welcome page, autoindex and user directories; with SELinux enforcing, label /srv/repo httpd_sys_content_t with semanage fcontext so restorecon keeps it. The repository files stay owned by root and read-only to the web server.
- [ ] Make the host firewall the register's copy. With firewalld, create a zone for 10.0.60.20 that allows only ssh and a zone for SBD-SPLUNK01, SBD-NESSUS01 and SBD-WEB01 (10.0.50.10, 10.0.50.20, 10.0.40.40) that allows only http, with no services left in the default zone. Adding those consumers now, before they exist, is safe because F19 already approves them.

**Commands:**

```
hostnamectl; ip -4 addr show
grep -E '^(pool|server|sourcedir|allow|maxdistance)' /etc/chrony.conf   # both controllers and maxdistance 16, nothing else
chronyc sources -v; chronyc tracking   # ^* one controller, ^+ or ^- the other; System time offset small and steady
sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication|allowgroups) '
# On SBD-ADMIN-SRV01: export the course 1.6 root and compare its hash with course 1.6's record, then copy it over
Get-ChildItem Cert:\LocalMachine\Root | Where-Object Subject -like '*<root CA name>*' | Export-Certificate -FilePath C:\Evidence\linux-repository\sbd-root.cer
Get-FileHash -Algorithm SHA256 C:\Evidence\linux-repository\sbd-root.cer
scp C:\Evidence\linux-repository\sbd-root.cer <your-account>@SBD-REPO01.sbd.test:/tmp/
# On SBD-REPO01: the same fingerprint, then the system trust store
openssl x509 -inform der -in /tmp/sbd-root.cer -noout -fingerprint -sha256
sudo cp /tmp/sbd-root.cer /etc/pki/ca-trust/source/anchors/ && sudo update-ca-trust
trust list --filter=ca-anchors | grep -i '<root CA name>'   # expected: the SBD root
apachectl -S        # expected: one site on 10.0.70.20:80
ss -tlnp            # expected: 22 and 80, plus loopback-only listeners, if any
firewall-cmd --get-active-zones
firewall-cmd --list-all --zone=public   # expected: no services
curl -sI http://SBD-REPO01.sbd.test/ | head -1   # expected: 403, no directory listing
```

**Verify:** SBD-REPO01 resolves to 10.0.70.20 and, with course 1.3's chrony file and the hypervisor's time synchronization off, syncs from a domain controller with a small, stable offset; sshd refuses root and passwords and admits only the admin group; the system trust store holds the course 1.6 root, its hash matching course 1.6's record; only TCP 22 and 80 listen; the firewall admits SSH from 10.0.60.20 alone and HTTP from the three registered consumers alone; and the web root returns 403 instead of a listing.

**Evidence:** Keep the install media hash, the chrony file with its sources and tracking output, the root certificate's hash compared with course 1.6's record, the effective sshd settings, the Apache site and listener output, the firewall zones, and the administrator account list (names only, no keys or passwords).

Notes / result / date: __________________________

## Mirror, verify, and publish a snapshot

- [ ] On the approved connected system, mirror into a dated directory. From a registered system of the same release, run dnf reposync with --download-metadata, which keeps the vendor's own repository metadata (including groups and modules) so the copy is usable as a repository as it stands, and --gpgcheck, which deletes any package whose signature fails and exits non-zero.
- [ ] If you trim the set instead of mirroring it whole, the vendor metadata no longer matches the files: rebuild it with createrepo_c (and add module metadata back with modifyrepo_c) and rely on gpgcheck on every client, because your rebuilt metadata carries no vendor signature. Then write a SHA-256 manifest of every file, hash the manifest itself, and carry both across under the course 1.4 media procedure.
- [ ] On SBD-REPO01, copy the set and its manifest into /srv/incoming, outside the web root, and check the set against the manifest. Then verify signatures independently of the connected side: rpm -K on every package, against the keys verified in lesson 1 (rpm --import those key files first if rpm -q gpg-pubkey does not list them). One failure stops publication and becomes a finding.
- [ ] Publish: move the set to /srv/repo/snapshots/<date> (a rename on the same file system), restore its SELinux labels, and switch the current link to it with an atomic rename so clients never see a half-copied mix. The previous snapshot stays in place for rollback.
- [ ] Add the snapshot to the catalog in /srv/repo-records, outside the web root: date, repositories, upstream key fingerprints, manifest hash, transfer record, who published it, and its status (current, previous or retired). Copy the catalog and manifest to C:\Evidence\linux-repository on SBD-ADMIN-SRV01 and hash them.

**Commands:**

```
# Connected side: keep vendor metadata, delete anything whose signature fails
dnf reposync --repoid=<baseos-repo-id> --repoid=<appstream-repo-id> --download-metadata --gpgcheck -p /srv/stage/2026-10-13
cd /srv/stage/2026-10-13 && find . -type f -print0 | sort -z | xargs -0 sha256sum > ../SHA256SUMS-2026-10-13.txt
# On SBD-REPO01, after the crossing:
cd /srv/incoming/2026-10-13 && sha256sum -c --quiet ../SHA256SUMS-2026-10-13.txt   # expected: no output
find . -name '*.rpm' -print0 | xargs -0 rpm -K | grep -v 'digests signatures OK'   # expected: no output
mv /srv/incoming/2026-10-13 /srv/repo/snapshots/ && restorecon -R /srv/repo/snapshots/2026-10-13
ln -sfn snapshots/2026-10-13 /srv/repo/current.new && mv -T /srv/repo/current.new /srv/repo/current
```

**Verify:** The manifest check and the signature check both pass with no exceptions, /srv/repo/current points at the new dated snapshot, the previous snapshot (if any) is untouched, and the catalog entry carries the fingerprints and manifest hash.

**Evidence:** Keep the manifest and its hash, the transfer record, the clean signature-check output, the catalog entry, and the hashes of the copies filed on SBD-ADMIN-SRV01.

Notes / result / date: __________________________

## Configure the Linux clients

- [ ] Write one source definition that names SBD-REPO01.sbd.test, so DNS carries it (F01): /etc/yum.repos.d/sbd-repo01.repo has one section per repository with baseurl=http://SBD-REPO01.sbd.test/current/<repo-id>/, gpgcheck=1 and gpgkey=file:///etc/pki/rpm-gpg/<vendor key>.
- [ ] Trust only the keys verified in lesson 1, installed from local files and never fetched from the repository at install time: whoever could change the repository could then change the key too. List the trusted keys (rpm -q gpg-pubkey) and remove any key nothing needs with rpm -e.
- [ ] Remove or disable every other source: set enabled=0 in every other .repo file, including any install-media entry, and where subscription-manager is installed, stop it managing repositories (subscription-manager config --rhsm.manage_repos=0), so it cannot write its own definitions back.
- [ ] Prove it on SBD-REPO01 itself, which follows the same rule: apply the files, refresh the metadata with no errors or warnings, and confirm that a package you will need in course 1.10, rsyslog-gnutls, resolves from the SBD-REPO01 source. A Failed to fetch line or a missing package is a gap in the mirror to fix before any server depends on it.
- [ ] Package the source file, the key files and a short apply-and-verify sheet in /srv/repo-records/client, hash them, and file them as the configuration every Linux server applies, courses 1.12 and 1.18 when they build SBD-SPLUNK01 and SBD-WEB01: after course 1.3's chrony file and before the server's first package update.

**Commands:**

```
dnf repolist --all                 # expected: only the sbd-repo01 repositories enabled
rpm -q gpg-pubkey --qf '%{NAME}-%{VERSION}-%{RELEASE}\t%{SUMMARY}\n'
dnf makecache && dnf info rsyslog-gnutls | grep -Ei '^(repository|from repo)'   # expected: from the sbd-repo01 repositories
# Hash the client package for the later courses
sha256sum /srv/repo-records/client/*
```

**Verify:** On SBD-REPO01 the package manager lists SBD-REPO01 as its only source, trusts only the verified keys, refreshes without errors, and resolves rsyslog-gnutls from the snapshot; the client package is hashed and filed.

**Evidence:** Keep the source listing, the trusted key list, the refresh output, the package's source line, and the client package with its hashes.

Notes / result / date: __________________________

## Keep it current and prove it

- [ ] Write the cadence: a new snapshot crosses on a fixed schedule (monthly is a common sample value), plus an expedited crossing when the vendor publishes a critical security fix. Keep the current and previous snapshots, retire older ones in the catalog, and name who approves each crossing. Course 1.14 later carries Windows updates on the same monthly run.
- [ ] Rehearse change control with the next snapshot: publish it as in lesson 3, refresh SBD-REPO01's own client and confirm it sees the new content, then switch current back to the previous snapshot and confirm the client follows. Rolling back stops a bad snapshot from spreading, but it does not uninstall anything; a server that already updated needs dnf history undo or dnf downgrade there. Record both switches in the catalog.
- [ ] Stage the Linux assessment set once, for every Linux server: SCC for Linux for your distribution and architecture, the DISA STIG SCAP benchmark for the distribution, and, for the manual items, the distribution's STIG and the Apache Server 2.4 UNIX STIGs. Check SCC against DISA's published checksum on the connected side, hash every file into connected-side-hashes.csv, carry the set under the course 1.4 media procedure, and check it again into C:\Staging\DISA\linux on SBD-ADMIN-SRV01: the Tier 1 copy that courses 1.12 and 1.18 scan their Linux servers with.
- [ ] Scan every Linux server the same way, starting with SBD-REPO01: copy SCC and the benchmark over your Tier 1 SSH session, check their hashes there, install SCC as its readme directs, and run it as root with the benchmark and the profile course 1.4 recorded. Copy the session back to C:\Evidence\linux-repository\baseline\SBD-REPO01, answer the manual items, Apache's included, in a STIG Viewer checklist for SBD-REPO01 on SBD-ADMIN-SRV01, and classify every open item as in course 1.4: fix now, deviation candidate or POA&M candidate. Plain HTTP on F19 is a deviation candidate, justified by signed content.
- [ ] File the assessable record in C:\Evidence\linux-repository with hashes: the design, the snapshot catalog, the client package, the baseline results and checklist, and the administration record of who changed what. Write the handoff to course 1.10: SBD-REPO01 is running, rsyslog-gnutls is in its snapshot, the SBD root is in its trust store, and its syslog over TLS (F07) is waiting for the collector.

**Commands:**

```
# On SBD-REPO01: promote the next snapshot, then rehearse rollback
readlink /srv/repo/current
ln -sfn snapshots/2026-11-10 /srv/repo/current.new && mv -T /srv/repo/current.new /srv/repo/current
ln -sfn snapshots/2026-10-13 /srv/repo/current.new && mv -T /srv/repo/current.new /srv/repo/current   # rollback
# On SBD-ADMIN-SRV01: no output means every staged file is on the connected-side list
(Get-ChildItem C:\Staging\DISA\linux\* -File -Exclude *.csv | Get-FileHash -Algorithm SHA256).Hash | Where-Object { $_ -notin (Import-Csv C:\Staging\DISA\linux\connected-side-hashes.csv).Hash }
scp C:\Staging\DISA\linux\<SCC for Linux package> C:\Staging\DISA\linux\<STIG benchmark> <your-account>@SBD-REPO01.sbd.test:/tmp/
# On SBD-REPO01: the same hashes, then SCC's command-line scanner as root (path and options from the SCC readme)
sha256sum /tmp/<SCC for Linux package> /tmp/<STIG benchmark>
sudo <SCC install directory>/cscc
# On SBD-ADMIN-SRV01: collect the session and the record, then hash everything
New-Item -ItemType Directory -Force C:\Evidence\linux-repository\baseline | Out-Null
scp -r <your-account>@SBD-REPO01.sbd.test:<SCC session folder> C:\Evidence\linux-repository\baseline\SBD-REPO01
scp -r <your-account>@SBD-REPO01.sbd.test:/srv/repo-records/* C:\Evidence\linux-repository\
Get-ChildItem C:\Evidence\linux-repository -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\linux-repository-hashes.csv -NoTypeInformation
```

**Verify:** The cadence is written with an approver, the promotion and the rollback both show in the catalog and in the client's view, the Linux assessment set sits checked in C:\Staging\DISA\linux on SBD-ADMIN-SRV01, SBD-REPO01 has a first baseline with every open item classified, and the record and handoff are filed with hashes.

**Evidence:** Keep the cadence, the catalog showing promotion and rollback, the Linux assessment set's hash check, the SCC results and STIG Viewer checklist, the classified findings, the administration record, the hash list, and the handoff note to course 1.10.

Notes / result / date: __________________________

## Sources

- [DNF plugins · reposync](https://dnf-plugins-core.readthedocs.io/en/latest/reposync.html)
- [createrepo_c · repository metadata tools](https://github.com/rpm-software-management/createrepo_c)
- [Red Hat · Managing software with the DNF tool](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_software_with_the_dnf_tool/index)
- [Red Hat · Product signing keys](https://access.redhat.com/security/team/key)
- [Red Hat · Using shared system certificates](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/securing_networks/using-shared-system-certificates_securing-networks)
- [Apache HTTP Server 2.4 · Security tips](https://httpd.apache.org/docs/2.4/misc/security_tips.html)
- [OpenSSH · sshd_config(5)](https://man.openbsd.org/sshd_config)
- [chrony · chrony.conf(5)](https://chrony-project.org/doc/latest/chrony.conf.html)
- [firewalld · documentation](https://firewalld.org/documentation/)
- [Microsoft · Add-DnsServerResourceRecordA](https://learn.microsoft.com/en-us/powershell/module/dnsserver/add-dnsserverresourcerecorda)
- [Microsoft · Export-Certificate](https://learn.microsoft.com/en-us/powershell/module/pki/export-certificate)
- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · STIGs document library](https://www.cyber.mil/stigs/downloads)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [Microsoft · Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
