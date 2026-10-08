# Bring in the fleet — configuration checklist

Secure By Design · Edition 1.1 · 7 October 2026

Fifty endpoints join a network that is finally ready for them: addressed by DHCP, landed by OU redirect, hardened by policy at first boot, certified by autoenrollment, and watched by the pipeline from their first sign-in. The sample names run SBD-PC01 through SBD-PC50; match them to your own plan.

## Before you start

- [ ] Complete courses 1.5–1.8: routed network, working PKI services, DHCP with its relay, the tiered admin plane, and the logging pipeline.
- [ ] Prepare a patched Windows 11 reference image (or template) for the fifty endpoints, obtained through the approved offline media process.
- [ ] Confirm the Workstations OU, the container redirects from course 1.3, and the DISA Windows 11 STIG policies from the GPO package are ready to link.
- [ ] Provision a Windows Server 2025 VM for SBD-NPS01 (10.0.20.50), and confirm the access switch for VLAN 80 supports 802.1X port authentication.

## Prepare the fleet rollout

- [ ] Finalize the Windows 11 reference image: current patches via the approved media process, no preinstalled extras, and a generalized state so each clone takes its own identity. Record the image version and hash — it is the fleet's common ancestor and belongs in evidence.
- [ ] Write the naming and rollout plan: SBD-PC01–SBD-PC50, addressed by the course 1.7 DHCP scope, joined in waves (pilot of three, then batches) rather than all fifty at once.
- [ ] Create a dedicated domain-join account delegated only the create-computer-objects right on the Workstations OU — no broader privilege rides along with fifty join operations. The course 1.3 redirect already guarantees machines land in that OU.
- [ ] Link the DISA Windows 11 STIG policies from the course 1.3 package to the Workstations OU now, so the very first pilot boots into the hardened state — and note that Windows 11's own secure defaults will already satisfy some checks, just as Server 2025 did.

**Verify:** The image is hashed and recorded, the join account holds only the delegated right on the Workstations OU, and the STIG links show on that OU before any machine exists in it.

**Evidence:** Keep the image record with its hash, the naming and wave plan, the delegation report for the join account, and the OU's GPO inheritance output.

Notes / result / date: __________________________

## Join the pilot and inspect first boot

- [ ] Deploy SBD-PC01 through SBD-PC03 from the image into VLAN 80, let each take its DHCP lease, and join sbd.test with the delegated account — nothing about the join should require a privileged credential.
- [ ] Per machine, verify the inheritance chain: the computer object sits in the Workstations OU (the redirect working), gpresult shows the STIG policies applied, and the secure dynamic DNS record exists on both DCs.
- [ ] Confirm the deny side still holds: a pilot machine cannot reach another pilot machine's SMB or RDP, and cannot open anything toward VLAN 60 — the course 1.5 rules apply to the fleet automatically.
- [ ] Find the three joins in the logging pipeline: the domain controller events for the computer-account creations should already be on the collector and searchable in analysis — the first machines this network has watched arrive.

**Verify:** All three pilots sit in the Workstations OU with STIG policy applied and DNS registered, peer SMB/RDP fails as designed, and the join events are visible in analysis.

**Evidence:** Keep each pilot's placement, gpresult, and DNS proof; the peer-deny output; and the analysis search showing the three computer-account creations.

Notes / result / date: __________________________

## Manage local administrators with Windows LAPS

- [ ] Extend the directory schema for Windows LAPS (Update-LapsADSchema) and grant the Workstations OU's computers the right to update their own password attributes — a one-time Tier 0 action, performed from the jump host and recorded like any schema change.
- [ ] Grant read access on the managed passwords to the Tier 2 admin group only — exactly the people SBD-ADMIN-PC01 exists for — and nobody else; the tier model decides who may know an endpoint's local secret.
- [ ] Create the LAPS GPO on the Workstations OU: managed built-in administrator, the password complexity and age the plan sets, and post-authentication reset so a used password does not live on.
- [ ] On a pilot, confirm the policy applied, retrieve the password from the admin seat, use it once, and watch rotation — one cycle, fully observed, is the proof the other forty-nine inherit.

**Verify:** The schema holds the LAPS attributes, only the Tier 2 group can read passwords, the policy shows on the pilots, and one retrieve-use-rotate cycle is recorded.

**Evidence:** Keep the schema-change record, the permission delegation, the LAPS policy report, and the observed rotation cycle.

Notes / result / date: __________________________

## Autoenroll the fleet's certificates

- [ ] Through the course 1.6 change process, update the SBD Computer Authentication template's autoenrollment permission from the pilot group to the Workstations OU's computers — the change record names the widening and its approver.
- [ ] Confirm the autoenrollment policy already applies through the Workstations OU, refresh policy on the pilots, and watch certificates arrive with no human in the loop.
- [ ] On an enrolled endpoint, run the full verification: the chain must reach the approved root, and the AIA and CDP fetches must answer live from pki.sbd.test through the course 1.5 register row.
- [ ] Record the issuing CA's view: the issued-certificate log now shows the fleet enrolling — volume the CA was designed for, finally arriving, and itself a record worth sampling into evidence.

**Verify:** Pilot endpoints enroll hands-free at policy refresh, verification passes with live publication retrieval, and the CA's issued log reflects the fleet with the widened template version.

**Evidence:** Keep the template change record, an endpoint's certificate details, the urlfetch output, and a sample of the CA's issued log.

Notes / result / date: __________________________

## Admit only enrolled devices with 802.1X

- [ ] Build SBD-NPS01 in the Servers OU and register it in Active Directory. Give it a server certificate with the Server Authentication purpose from the issuing CA, and treat it as Tier 0: it admits devices and, later, authenticates network administrators, so it is managed only from AdminJumpBox01.
- [ ] Add the VLAN 80 access switch as a RADIUS client with a long, unique shared secret, then create the network policy: wired 802.1X, EAP-TLS only, machine certificates that chain to the approved root and carry the Client Authentication purpose, from the Domain Computers group.
- [ ] Create quarantine VLAN 90 with no gateway and no routes, and set the access ports to require 802.1X with VLAN 90 as the failure and guest VLAN. Push the wired 802.1X client settings to the Workstations OU by Group Policy (Wired AutoConfig, EAP-TLS, the approved root as the trusted CA).
- [ ] Add register row F19 with its owner, move the router's administrator logins to RADIUS through SBD-NPS01 as course 1.5 planned, and confirm NPS grant and denial events reach the course 1.8 collector.

**Verify:** An enrolled pilot authenticates and gets its normal VLAN 80 lease; an unenrolled test laptop lands in VLAN 90 and reaches nothing; NPS logs both outcomes, and they appear in the collector.

**Evidence:** Keep the network policy export, the RADIUS client list (without the secret), the port configuration, both test results with their NPS events, and the F19 register row.

Notes / result / date: __________________________

## Scale to fifty and prove by sample

- [ ] Deploy the remaining machines in the planned waves, watching the DHCP scope's utilization and the join events arriving in analysis as each wave lands — the pipeline is now the rollout's progress bar.
- [ ] Define the sample before checking it: for example one machine per wave plus any machine that logged an error — then run the pilot's full set on each sampled host (OU, policy, DNS, LAPS, certificate, 802.1X admission, peer-deny).
- [ ] Write the sample rule down: one failed check in the sample widens the sample; a repeated failure stops the rollout and becomes a finding. A sample without a failure rule is a formality.
- [ ] Extend the course 1.8 forwarding subscription to the Workstations OU so all fifty endpoints report their security events — and confirm fleet sign-ins now appear in the analyst's searches.

**Verify:** Fifty computer objects sit in the Workstations OU, scope utilization matches the rollout, every sampled host passes the full check set, and fleet events flow through the pipeline.

**Evidence:** Keep the wave log, the sample definition with its failure rule, the per-sample check results, and the widened subscription proof.

Notes / result / date: __________________________

## Delta scan the fleet and hand off

- [ ] Run SCC with the Windows 11 STIG benchmark against the sampled endpoints — the same sample set as lesson 6 — and note how much the pre-linked policies and the OS defaults already satisfy, exactly as the server baselines taught.
- [ ] Rescan what changed: the DCs (schema and LAPS attributes), the issuing CA (fleet enrollment volume), and SBD-DHCP01 (a scope now in full use); attribute each delta to its lesson.
- [ ] Assemble the fleet inventory — names, image ancestry, certificate thumbprints, sample status — as the course's closing artifact; course 1.10's management tooling will take ownership of keeping it current.
- [ ] Write the handoff: the fleet exists, watched and hardened, but updates itself not at all — patching, endpoint protection, and vulnerability coverage are precisely what wave 5 builds next.

**Verify:** Sampled endpoints hold dated Windows 11 baselines, the infrastructure rescans carry attributed deltas, and the fleet inventory is complete and filed.

**Evidence:** Finish the checklist: endpoint baselines, infrastructure rescans, the fleet inventory, and the handoff note to course 1.10.

Notes / result / date: __________________________
