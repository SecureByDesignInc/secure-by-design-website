#!/usr/bin/env python3
"""Compose course 1.1, "Build and harden the identity foundation" (owner direction, 20 October 2026).

One-time migration, kept for the record. It merges the former courses 1.1 (DC01 + DC02, a hand-kept guide),
1.2 DNS, 1.3 domain time, 1.4 STIG measurement, 1.5 Group Policy hardening, 1.6 two-tier PKI, 1.7 DHCP and
1.8 tiered administration into one configuration course of eight parts, works the US design references in
(a new Active Directory design lesson, and a design check in the first lesson of every other part), and
renumbers the later build courses 1.9–1.19 to 1.2–1.12 everywhere their numbers appear in the content.

Writes: content/configuration-courses.json, content/course-guides/identity-foundation.json (the seven merged
guide files are removed), content/videos.json, content/training-progress.json, content/progress-moves.json,
and renumbers public/inside-network-model/courses.js and course 2.1's text. Workbooks, covers, guides and
checklists are regenerated afterwards by their own scripts.
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
C = ROOT / 'content'
NEW = 'identity-foundation'
UPDATED = '20 October 2026'
SITE = 'https://securebydesigninc.com'

PARTS = [  # (old course id, part title, old number)
    ('dc01-dc02', 'Domain controllers', 1),
    ('dns-configuration', 'DNS', 2),
    ('domain-time', 'Domain time', 3),
    ('stig-scap', 'Measure against the STIG', 4),
    ('harden-baseline', 'Harden with Group Policy', 5),
    ('two-tier-pki', 'Two-tier PKI', 6),
    ('dhcp', 'DHCP', 7),
    ('tiered-admin', 'Tiered administration', 8),
]
PREFIX = {'dc01-dc02': 'dc', 'dns-configuration': 'dns', 'domain-time': 'time', 'stig-scap': 'stig', 'harden-baseline': 'gpo', 'two-tier-pki': 'pki', 'dhcp': 'dhcp', 'tiered-admin': 'tier'}
MERGED = [p[0] for p in PARTS]
RENUMBER = {f'1.{n}': f'1.{n - 7}' for n in range(9, 20)}  # 1.9 → 1.2 … 1.19 → 1.12

# ---------- number and lesson references ----------
NUM = r'1\.\d{1,2}(?![\d.]*\d)'
SEP = r'(?:–|-| to |, and | and | or |, )'
COURSE_REF = re.compile(rf'\b([Cc])ourse(s?)( \(| )({NUM}(?:{SEP}{NUM})*)')
LESSON_REF = re.compile(r'\b([Ll])esson(s?) (\d{1,2})(?![\d.])((?:(?:–| to |, and | and | or |, )\d{1,2}(?![\d.]))*)')

def split_nums(text):
    nums = re.findall(r'1\.\d{1,2}', text)
    seps = re.findall(SEP, text)
    return nums, seps

def join(nums, seps, word):
    if len(nums) == 1: return f'{word} {nums[0]}'
    # keep the original separators between the mapped numbers
    out = nums[0]
    for s, n in zip(seps, nums[1:]): out += s + n
    return f'{word}s {out}'

def outside(text):
    """References from outside the merged course: 1.1–1.8 are course 1.1; later courses renumber."""
    def repl(m):
        cap, plural, gap, body = m.groups()
        nums, seps = split_nums(body)
        mapped = ['1.1' if int(n.split('.')[1]) <= 8 else RENUMBER.get(n, n) for n in nums]
        dedup = []
        for n in mapped:
            if not dedup or dedup[-1] != n: dedup.append(n)
        word = cap + 'ourse'
        if len(dedup) == 1: return f'{word}{gap}{dedup[0]}' if gap == ' (' else f'{word} {dedup[0]}'
        if '–' in seps or '-' in seps or ' to ' in seps: return f'{word}s{gap}{dedup[0]}–{dedup[-1]}'
        return f'{word}s{gap}' + ' and '.join([', '.join(dedup[:-1]), dedup[-1]]) if len(dedup) > 2 else f'{word}s{gap}{dedup[0]} and {dedup[1]}'
    return COURSE_REF.sub(repl, text)

def inside(text, offset):
    """References inside the merged course: old courses 1.1–1.8 are parts 1–8; lesson numbers shift by the part's offset."""
    def course(m):
        cap, plural, gap, body = m.groups()
        nums, seps = split_nums(body)
        olds = [int(n.split('.')[1]) for n in nums]
        if all(n <= 8 for n in olds):
            word = 'Part' if cap == 'C' else 'part'
            parts = [str(n) for n in olds]
            if len(parts) == 1: return f'{word}{gap}{parts[0]}' if gap == ' (' else f'{word} {parts[0]}'
            out = parts[0]
            for s, n in zip(seps, parts[1:]): out += s + n
            return f'{word}s{gap}{out}'
        return outside(m.group(0))
    def lesson(m):
        cap, plural, first, rest = m.groups()
        shift = lambda n: str(int(n) + offset)
        rest = re.sub(r'\d{1,2}', lambda x: shift(x.group(0)), rest)
        return f'{cap}esson{plural} {shift(first)}{rest}'
    text = COURSE_REF.sub(course, text)
    if offset: text = LESSON_REF.sub(lesson, text)
    return text.replace('this course', 'this part').replace('This course', 'This part')

def walk(obj, fn):
    if isinstance(obj, str): return fn(obj)
    if isinstance(obj, list): return [walk(x, fn) for x in obj]
    if isinstance(obj, dict): return {k: (v if k in ('id', 'url', 'href', 'guide', 'word', 'cover', 'checklistPage', 'youtubeId', 'from', 'to') else walk(v, fn)) for k, v in obj.items()}
    return obj

# ---------- design material (from the US design references, docs/design-references/) ----------
DESIGN_SOURCES = {
    'design-ad': ('Secure By Design · US design reference: Active Directory design', f'{SITE}/training/design/active-directory'),
    'design-dns': ('Secure By Design · US design reference: DNS design', f'{SITE}/training/design/dns'),
    'design-time': ('Secure By Design · US design reference: Time synchronization design', f'{SITE}/training/design/time'),
    'design-stig': ('Secure By Design · US design reference: DISA STIGs and GPO packages', f'{SITE}/training/design/disa-stigs'),
    'design-pki': ('Secure By Design · US design reference: PKI design', f'{SITE}/training/design/pki'),
    'design-dhcp': ('Secure By Design · US design reference: DHCP design', f'{SITE}/training/design/dhcp'),
}
CHECK = 'Check the design against US guidance'
ENRICH = {  # the first lesson of each part after the first: one design step, one question, the source
    'dns-configuration': ('design-dns',
        "The DNS design reference sets the baseline this part follows. Name the forest as a subdomain of a domain you have registered, or use ICANN's reserved .internal; never use .local or a single-label name. sbd.test uses a name reserved for testing, which suits a practice network only. Store the zones in Active Directory with secure-only updates, run at least two DNS servers on different hosts, and forward only to an approved upstream; this air-gapped network forwards nothing. The authorities differ in places: NIST SP 800-81r3 prefers dedicated DNS servers and advises against signing internal zones unless a policy requires it, while Microsoft runs DNS on domain controllers and the DISA DNS STIG requires DNSSEC, with NSEC3 on internal zones. Record which rule your build follows, and why.",
        {'question': 'Which forest name does the DNS design reference rule out?', 'answers': ['A subdomain of a domain you have registered', "ICANN's reserved .internal", '.local or a single-label name'], 'correct': 2, 'explanation': 'The reference recommends a name you control or .internal, and rules out .local and single-label names.'},
        'The DNS design follows the US design reference; record each deviation, such as the test-only sbd.test name.'),
    'domain-time': ('design-time',
        "The time design reference keeps the default Active Directory hierarchy: the forest-root PDC emulator, SBD-DC01, is the reliable source, and every other member follows the domain. Upstream counts differ by authority: CIS, NSA and CISA say at least two sources, Microsoft three or more, and RFC 8633 four or more; DoD systems must use USNO or another approved DoD source. This network is air-gapped and has no upstream, so record that as an accepted gap. Keep the Kerberos clock tolerance at 5 minutes, the default and the DISA requirement, and never let a virtualized domain controller take time from its host.",
        {'question': "Which system is the domain's time source?", 'answers': ['The forest-root PDC emulator, SBD-DC01', "Each member's hypervisor host", 'Whichever controller answers first'], 'correct': 0, 'explanation': 'The forest-root PDC emulator is the reliable source; everything else follows the domain hierarchy, and no domain controller takes time from its host.'},
        'The PDC emulator leads the hierarchy, and the air-gapped network records its missing upstream as a gap.'),
    'stig-scap': ('design-stig',
        "The DISA STIGs reference ties each rule to the Risk Management Framework: every STIG rule cites one or more CCIs, and each CCI breaks a NIST SP 800-53 control into one testable statement. NIST's National Checklist Program re-lists DISA's STIGs, with their SCAP content and the GPO package, beside CIS and vendor checklists. The unclassified STIGs, SCAP benchmarks, the GPO package, STIG Viewer and SCC are free downloads from the DoD Cyber Exchange (cyber.mil). Decide the baseline set for each system before you scan, so this part and the Group Policy part measure the same thing.",
        {'question': 'What links a STIG rule to a NIST SP 800-53 control?', 'answers': ['A CCI', 'Its CAT I severity', 'The name of its GPO'], 'correct': 0, 'explanation': 'Each STIG rule cites CCIs, and each CCI decomposes an SP 800-53 control into a single statement.'},
        'STIG rules cite CCIs, and CCIs trace to SP 800-53 controls; decide the baseline set before scanning.'),
    'harden-baseline': ('design-ad',
        "The Active Directory design reference says OUs exist for exactly two purposes, delegating administration and applying Group Policy, not replication. Redirect the default Users and Computers containers so new objects land where policy reaches them. Keep GPOs few and well scoped, and deliver baselines such as the DISA GPO package through GPOs linked to the right OUs, tested first. Block Inheritance hides policy and is discouraged; use Enforced sparingly, for settings that must apply.",
        {'question': 'Why does an OU exist in this design?', 'answers': ['To delegate administration and apply Group Policy', 'To control replication', 'To create a security boundary'], 'correct': 0, 'explanation': 'OUs serve delegation and Group Policy; the forest is the security boundary and sites control replication.'},
        'OUs serve delegation and Group Policy; baselines arrive as tested, well-scoped GPOs.'),
    'two-tier-pki': ('design-pki',
        "The PKI design reference agrees with this design: an offline standalone root and an online enterprise issuing CA. Add a policy tier only for a concrete policy, legal or delegation need. Set the CDP and AIA locations, HTTP first, before the first certificate is issued, renew CA certificates at half-life, and avoid delta CRLs on an offline root. Microsoft, CISA, NSA and DISA agree that AD CS is Tier 0: manage it only from Tier 0 seats with dedicated CA administrator accounts, and encrypt CA backups. CISA and NSA list a hardware security module for CA keys; record whether your lab uses one.",
        {'question': 'When must the CDP and AIA publication locations be set?', 'answers': ['Before the first certificate is issued', 'After the first CA renewal', 'Only when a CRL expires'], 'correct': 0, 'explanation': 'Every certificate carries those URLs, so they are fixed before the first certificate is issued.'},
        'The two-tier design matches the US guidance; AD CS is Tier 0 and its publication URLs are fixed first.'),
    'dhcp': ('design-dhcp',
        "The DHCP design reference places the service on dedicated domain-member servers authorized in Active Directory, never on a domain controller, because a DHCP service on a controller inherits its rights over AD-integrated DNS records. If DHCP registers names for clients, use one dedicated, non-privileged DNS credential on every DHCP server, enable Name Protection, keep the zones secure-only and keep DnsUpdateProxy empty. Message-level DHCP authentication is effectively unused, so protection against rogue servers belongs to the switch and the hypervisor (DHCP snooping and DHCP guard). Log the hostname, MAC address, IP address and time of every lease.",
        {'question': 'Why does DHCP not run on a domain controller in this design?', 'answers': ["It would inherit the controller's rights over AD-integrated DNS records", 'It needs more memory than a controller has', 'Domain controllers cannot lease addresses'], 'correct': 0, 'explanation': "A DHCP service on a domain controller registers DNS records with the controller's rights; a dedicated member server with a non-privileged credential avoids that."},
        'DHCP runs on a dedicated member server; rogue-server protection belongs to the switch and hypervisor.'),
    'tiered-admin': ('design-ad',
        "The Active Directory design reference treats the directory's control plane as Tier 0: the domain controllers, AD CS, and the accounts, groups and workstations that manage them. Administer each tier only from a device of equal or higher trust, the clean-source principle; put privileged accounts in Protected Users; and keep Tier 0 credentials off lower-tier systems. This part builds the administration seats that put those rules into practice.",
        {'question': 'What does the clean-source principle require?', 'answers': ['Administer a tier only from a device of equal or higher trust', 'Use one administrator account everywhere', 'Keep administration workstations off the domain'], 'correct': 0, 'explanation': 'A device that manages Tier 0 must be at least as trusted as Tier 0, so administration happens only from the Tier 0 seats.'},
        'Tier 0 is the control plane; administer it only from seats of equal or higher trust.'),
}
AD_DESIGN = {
    'lesson': {
        'id': 'design', 'title': 'Design the forest, domain and OUs', 'minutes': 30,
        'summary': "Before promoting anything, decide the structure every later part inherits. The forest is the security boundary, the domain is a replication and administrative boundary, OUs exist for delegation and Group Policy, and the directory's control plane is Tier 0. This lesson records those decisions from the Active Directory design reference, so the build that follows has a reason for each choice.",
        'steps': [
            "Active Directory Domain Services keeps one directory of users, computers and groups that every domain member trusts, and the domain controllers hold and replicate it. Everything later in this course, from DNS to tiered administration, depends on the decisions made here.",
            "Microsoft calls the forest the security and administrative boundary for everything in it: whoever controls one domain controller can reach every domain in the forest. Prefer a single forest unless a hard isolation or autonomy requirement forces another. This network uses one forest, sbd.test.",
            "A domain is a replication and administrative boundary, not a security boundary. Add domains only for replication, administration or policy reasons, never for isolation. The domain name is also a DNS name, so part 2 settles the namespace with this decision.",
            "Design OUs for two purposes only, delegating administration and applying Group Policy, not replication. Sketch the top level now (Tier 0, Admin, Servers, Workstations and Users) and plan to redirect the default containers; part 5 builds the structure and links the DISA baselines to it.",
            "List what controls the directory: both domain controllers, the PKI built in part 6, and the accounts, groups and workstations that manage them. That is Tier 0. Administer it only from devices of equal or higher trust; part 8 builds those seats. Write each decision and the authority behind it in the design record.",
        ],
        'command': "Get-ComputerInfo | Select-Object CsName, WindowsProductName, OsBuildNumber\nGet-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway\n# Nothing is promoted yet: save this starting state beside the design record.",
        'check': "Both planned controllers are standalone Windows Server systems with static addresses on VLAN 10, and no directory exists yet. The design record names one forest, one domain, the OU plan and the Tier 0 inventory, each with its reason and source.",
        'evidence': "Save the design record: the forest and domain decision, the OU plan, the Tier 0 inventory, and the authority behind each choice.",
        'sources': ['design-ad', 'ad-overview', 'group-policy', 'dc-security'],
        'objectives': ['Explain why the forest, not the domain, is the security boundary.', 'Plan OUs for delegation and Group Policy rather than replication.', 'Identify the systems and accounts that make up Tier 0.'],
        'quizzes': [
            {'question': 'Which is the security boundary in Active Directory?', 'answers': ['The domain', 'The forest', 'The OU'], 'correct': 1, 'explanation': 'Microsoft calls the forest the security and administrative boundary; a domain is a replication and administrative boundary only.'},
            {'question': 'What are OUs designed for here?', 'answers': ['Replication', 'Delegation and Group Policy', 'Isolating attackers'], 'correct': 1, 'explanation': 'OUs delegate administration and apply Group Policy; they neither control replication nor isolate anything.'},
            {'question': 'Which of these belongs to Tier 0?', 'answers': ['A domain controller', 'A member workstation', "A file share's users"], 'correct': 0, 'explanation': "The directory's control plane, starting with the domain controllers, is Tier 0."},
        ],
        'recap': ['One forest is the security boundary; one domain keeps replication simple.', 'OUs serve delegation and Group Policy; part 5 builds them.', "Tier 0 is the directory's control plane, administered only from the seats part 8 builds."],
        'next': 'Lesson 2 gives every system a purpose and places both controllers on VLAN 10.',
    },
    'extra': {
        'short': 'Design the forest', 'tag': '01 / DESIGN', 'status': 'DESIGN RECORDED',
        'stepTitles': ['Know what the directory is', 'Choose one forest', 'Keep one domain', 'Plan OUs for delegation and policy', 'Mark the Tier 0 boundary'],
        'mistake': "Adding a domain or a forest to separate teams that need no isolation. A domain is not a security boundary, and every extra forest or domain adds trusts, replication and administration to defend.",
        'network': 'Nothing is built yet. VLAN 10 is reserved for the two domain controllers, and the design record decides what they will hold.',
        'control': {'id': 'PL-8', 'name': 'Security and Privacy Architectures', 'phase': 'Prepare', 'body': "Document the architecture before building it: its boundaries, its structure and its protections, and how they meet the organization's security requirements. The design record is that document for the identity foundation.", 'question': 'Where does your design record show the forest boundary, the OU plan and the Tier 0 boundary, with the source behind each?'},
        'checklist': ['I recorded one forest and one domain, with the reason for each.', 'I sketched the OU plan for delegation and Group Policy.', 'I listed the Tier 0 systems, accounts and seats.'],
    },
}

def first_sentence(text):
    m = re.match(r'(.+?[.!?])(\s|$)', text or '')
    return m.group(1) if m else (text or '')

def fit_scene(scene):
    """The guide's 3D scene holds at most five systems per row. The DNS lookup viewpoint and the VLAN 80 test client
    become one test client; the console viewpoint (administration before part 8) is dropped; SBD-DHCP01 moves to the front row."""
    nodes = {n['id']: n for n in scene['nodes']}
    member = nodes['member']
    member.update({'name': 'TEST CLIENT', 'button': 'Test client', 'sub': 'Lookups · VLAN 80 leases',
                   'title': 'Test client · where lookups and leases are proven',
                   'description': 'Where the build is tested from. In parts 2 and 3 it stands for any domain member that lists both controllers for DNS and follows the domain time; part 7 makes it the disposable VLAN 80 client, outside the domain, that proves the DHCP relay, the options and secure name registration.'})
    flows = []
    for f in scene['flows']:
        if 'console' in (f['from'], f['to']): continue
        f = dict(f)
        if f['from'] == 'test': f['from'] = 'member'
        if f['to'] == 'test': f['to'] = 'member'
        flows.append(f)
    scene['flows'] = flows
    scene['nodes'] = [n for n in scene['nodes'] if n['id'] not in ('console', 'test')]
    for n in scene['nodes']:
        if n['id'] == 'dhcp': n['row'] = 'front'
    return scene

def main():
    courses = json.loads((C / 'configuration-courses.json').read_text())
    by_id = {c['id']: c for c in courses}
    episode = json.loads((ROOT / 'public/training/dc01-dc02/lesson.json').read_text())
    ep_scene = json.loads((ROOT / 'public/training/dc01-dc02/scene.json').read_text())
    library = json.loads((C / 'videos.json').read_text())

    # Part material: (lessons, extras, sources, scene) per old course, in configuration-course form.
    parts = []
    for cid, title, n in PARTS:
        if cid == 'dc01-dc02':
            lessons, extras = [], {}
            status = {c['id']: c['status'] for c in ep_scene['chapters']}
            chs = episode['chapters']
            for k, ch in enumerate(chs):
                nxt = f"Lesson {k + 2}: {chs[k + 1]['title']}." if k + 1 < len(chs) else 'Course 1.2 configures DNS on both controllers.'
                lessons.append({
                    'id': ch['id'], 'title': ch['title'], 'minutes': 30, 'summary': f"{ch['outcome']} {ch['intro']}",
                    'steps': [body for _, body in ch['steps']], 'command': ch['command'], 'check': ch['expected'],
                    'evidence': ch['evidencePrompt'], 'sources': ch['sources'], 'objectives': [ch['outcome']],
                    'quizzes': [{'question': ch['quiz']['prompt'], 'answers': ch['quiz']['answers'], 'correct': ch['quiz']['correct'], 'explanation': ch['quiz']['feedback']}],
                    'recap': [x for x in (ch['outcome'], first_sentence(ch['expected']), first_sentence(ch['mistake'])) if x], 'next': nxt,
                })
                control = dict(ch['control']); control['id'] = control['id'].split(' / ')[0]
                control.setdefault('question', ch['evidencePrompt'])
                checklist = (ch['checklist'] + ['I saved the evidence for this lesson.'] * 3)[:3]
                extras[ch['id']] = {'short': ch['short'][:28], 'tag': ch['tag'], 'status': status.get(ch['id'], 'IN PROGRESS'), 'stepTitles': [t for t, _ in ch['steps']],
                                    'mistake': ch['mistake'], 'network': ch['network'], 'control': control, 'checklist': checklist}
            sources = episode['sources']
            scene = ep_scene['scene']
        else:
            c = by_id[cid]; g = json.loads((C / 'course-guides' / f'{cid}.json').read_text())
            lessons, extras, sources, scene = c['lessons'], g['lessons'], c['sources'], g['scene']
        parts.append({'id': cid, 'title': title, 'n': n, 'lessons': lessons, 'extras': extras, 'sources': sources, 'scene': scene})

    # Sources: one list; an id reused with another URL gets the part's prefix.
    merged_sources, url_of, remap = [], {}, {}
    def add_source(sid, title, url, prefix):
        if sid in url_of and url_of[sid] != url:
            sid2 = f'{prefix}-{sid}'
        else:
            sid2 = sid
        if sid2 not in url_of:
            url_of[sid2] = url; merged_sources.append({'id': sid2, 'title': title, 'url': url})
        return sid2
    for sid, (title, url) in DESIGN_SOURCES.items(): add_source(sid, title, url, 'design')
    for p in parts:
        remap[p['id']] = {s['id']: add_source(s['id'], s['title'], s['url'], PREFIX[p['id']]) for s in p['sources']}

    # Lessons, guide extras and the 3D scene, in part order.
    lessons, extras, offsets = [], {}, {}
    d_lesson = dict(AD_DESIGN['lesson']); d_lesson['id'] = 'dc-design'; d_lesson['part'] = f"Part 1 · {PARTS[0][1]}"
    d_lesson['sources'] = [remap['dc01-dc02'].get(s, s) for s in d_lesson['sources']]
    lessons.append(d_lesson); extras['dc-design'] = AD_DESIGN['extra']
    for p in parts:
        offset = len(lessons); offsets[p['id']] = offset
        fix = lambda t, o=offset: inside(t, o)
        for k, l in enumerate(p['lessons']):
            nl = walk(json.loads(json.dumps(l)), fix)
            pre = PREFIX[p['id']]
            nl['id'] = l['id'] if l['id'] == pre or l['id'].startswith(pre + '-') else f"{pre}-{l['id']}"
            nl['part'] = f"Part {p['n']} · {p['title']}"
            nl['sources'] = [remap[p['id']][s] for s in l['sources']]
            ex = walk(json.loads(json.dumps(p['extras'][l['id']])), fix)
            word = (ex['tag'].split('/', 1)[1].strip() if '/' in ex['tag'] else ex['tag'])
            ex['tag'] = f"{len(lessons) + 1:02d} / {word}"
            if k == 0 and p['id'] in ENRICH:
                src, step, quiz, recap = ENRICH[p['id']]
                nl['steps'] = nl['steps'] + [step]; ex['stepTitles'] = ex['stepTitles'] + [CHECK]
                nl['quizzes'] = nl['quizzes'] + [quiz]; nl['recap'] = nl['recap'] + [recap]
                nl['sources'] = nl['sources'] + [src]; nl['minutes'] = nl.get('minutes', 25) + 10
            lessons.append(nl); extras[nl['id']] = ex
    # The 3D scene: one node per system (first appearance wins), flows joined per pair and label.
    nodes, node_by_name, flows = [], {}, {}
    def scene_part(scene, cid, offset):
        idmap = {}
        for node in scene['nodes']:
            nn = walk(json.loads(json.dumps(node)), lambda t: inside(t, offset))
            if node['name'] in node_by_name:
                idmap[node['id']] = node_by_name[node['name']]['id']; continue
            nid = node['id'] if not any(x['id'] == node['id'] for x in nodes) else f"{PREFIX[cid]}-{node['id']}"
            nn['id'] = nid; nn['from'] = node.get('from', 0) + offset
            nn['existing'] = False
            nodes.append(nn); node_by_name[node['name']] = nn; idmap[node['id']] = nid
        for f in scene.get('flows', []):
            a = idmap.get(f['from'], f['from']); b = idmap.get(f['to'], f['to'])
            key = (a, b, f.get('label'))
            ls = [i + offset for i in f['lessons']]
            if key in flows: flows[key]['lessons'] = sorted(set(flows[key]['lessons'] + ls))
            else: flows[key] = {**walk(json.loads(json.dumps(f)), lambda t: inside(t, offset)), 'from': a, 'to': b, 'lessons': ls}
    for p in parts: scene_part(p['scene'], p['id'], offsets[p['id']])  # the design lesson comes first, so part 1 starts at lesson 2
    scene = {
        'tag': 'IDENTITY FOUNDATION · VLANS 10, 30, 60, 80',
        'label': 'Interactive 3D lesson network for the identity foundation: SBD-DC01 and SBD-DC02 on VLAN 10, the offline root CA, the issuing CA and publication host on VLAN 30, the DHCP server for VLAN 80, and the administration seats on VLAN 60, joined through the core.',
        'completeStatus': 'FOUNDATION IN SERVICE',
        'completeCaption': 'Both domain controllers hold the sbd.test directory and DNS and keep the domain on time; they are measured against the STIG and hardened with Group Policy. The two-tier PKI issues their certificates, DHCP serves VLAN 80 with secure DNS updates, and Tier 0 is administered only from its own seats. Every later course builds on this foundation.',
        'nodes': nodes, 'flows': list(flows.values()),
    }
    scene = fit_scene(scene)

    # The course entry.
    minutes = sum(l.get('minutes', 25) for l in lessons)
    tiered = by_id['tiered-admin']; dns = by_id['dns-configuration']
    prerequisites = [
        "Use an isolated Windows Server practice environment. The network's routing and default-deny segmentation are in place, with the access control list (ACL) register that records every permitted path.",
        'Provision each part\'s systems when the part begins: two Windows Server virtual machines for SBD-DC01 (10.0.10.10) and SBD-DC02 (10.0.10.11) on different hosts, then the PKI systems (part 6), the DHCP server (part 7) and the administration seats (part 8).',
        "Work at each server's VM console with an authorized administrator account until part 8 builds AdminJumpBox01; after that, administration happens from the Tier 0 seats.",
        'Have an approved connected system and the removable-media procedure for bringing downloaded DISA content and other software into the lab.',
    ]
    course = {'id': NEW, 'prerequisites': prerequisites, 'labNote': dns['labNote'], 'sources': merged_sources, 'lessons': lessons}
    courses = [c for c in courses if c['id'] not in MERGED]
    courses = [walk(c, outside) for c in courses]
    courses.insert(0, course)
    (C / 'configuration-courses.json').write_text(json.dumps(courses, ensure_ascii=False, indent=2) + '\n')

    guide = {
        'id': NEW,
        'hero': {'title': 'Build and harden', 'accent': 'the identity foundation.', 'text': 'Design the directory, then build it: SBD-DC01 and SBD-DC02 with DNS and domain time, measured against the STIG and hardened with Group Policy, a two-tier PKI, DHCP, and tiered administration. Each part opens with its design decisions from the US design references. Follow the build, explore the dependencies, and keep the evidence.'},
        'book': ['WINDOWS', 'SERVER', '', 'IDENTITY'],
        'sample': [['Domain', 'sbd.test'], ['SBD-DC01', '10.0.10.10 / 24 · PDC emulator'], ['SBD-DC02', '10.0.10.11 / 24'], ['PKI', 'SBD-ROOTCA01 (offline) · SBD-SUBCA01 · pki.sbd.test'], ['DHCP', 'SBD-DHCP01 · VLAN 80'], ['Admin seats', 'AdminJumpBox01 · SBD-ADMIN-SRV01 · VLAN 60'], ['Parts', '8 parts · ' + str(len(lessons)) + ' lessons']],
        'scene': scene, 'lessons': extras,
    }
    (C / 'course-guides' / f'{NEW}.json').write_text(json.dumps(guide, ensure_ascii=False, indent=2) + '\n')
    for cid in MERGED[1:]:
        (C / 'course-guides' / f'{cid}.json').unlink(missing_ok=True)
    for path in (C / 'course-guides').glob('*.json'):
        if path.stem == NEW: continue
        path.write_text(json.dumps(walk(json.loads(path.read_text()), outside), ensure_ascii=False, indent=2) + '\n')

    # The catalog: one course replaces eight; later courses renumber.
    template = next(c for c in library['courses'] if c['id'] == 'two-tier-pki')
    old_systems = []
    for cid in MERGED:
        e = next((x for x in library['episodes'] + library['courses'] if x['id'] == cid), None)
        for s in (e or {}).get('systems', []):
            name = f'SBD-{s}' if re.fullmatch(r'DC0\d', s) else s
            if name not in old_systems: old_systems.append(name)
    entry = {k: template[k] for k in template if k not in ('stages', 'afterEpisode')}
    entry.update({
        'id': NEW, 'number': '1.1', 'categoryOrder': 1, 'categoryId': 'network-build', 'kind': 'configuration',
        'title': 'Build and harden the identity foundation',
        'subtitle': 'AD DS, DNS, time, STIG hardening, PKI, DHCP & tiered administration',
        'description': "Design the identity foundation with the US design references, then build it end to end: promote SBD-DC01 and SBD-DC02, configure DNS and domain time, measure both controllers against the DISA STIG and harden them with Group Policy, build the two-tier PKI, stand up DHCP for VLAN 80 with secure DNS updates, and move administration onto tiered seats. Eight parts, each opening with its design decisions and closing with evidence for your portfolio.",
        'tags': ['Windows Server', 'Active Directory', 'DNS', 'DISA STIG', 'Group Policy', 'PKI', 'DHCP', 'Tiered administration'],
        'systems': old_systems, 'topic': 'Identity',
        'artLabels': ['AD DS · DNS · Time', 'STIG · Group Policy', 'PKI · DHCP · Tier 0'],
        'outcomeSummary': 'One forest on two healthy domain controllers, with DNS, domain time, a measured and hardened baseline, a two-tier PKI, DHCP and tiered administration, each designed against US guidance and proven with evidence.',
        'outcomes': ['Design the forest, namespace, time hierarchy and PKI against US guidance', 'Build and verify SBD-DC01, SBD-DC02, DNS and domain time', 'Measure against the DISA STIG and harden with Group Policy', 'Build the two-tier PKI, DHCP and tiered administration'],
        'networkLabel': 'Identity foundation · VLANs 10, 30, 60 and 80',
        'moduleCount': len(lessons), 'lessonCount': len(lessons), 'estimatedHours': round(minutes / 60, 1),
        'training': {'guide': f'/training/{NEW}', 'materialsEdition': '1.0', 'updated': UPDATED, 'checklistPage': f'/training/{NEW}/checklist',
                     'word': f'/training/{NEW}/SecureByDesign-{NEW}-Workbook.docx', 'pages': template['training'].get('pages', 0), 'cover': f'/training/{NEW}/workbook-cover.webp'},
    })
    library['episodes'] = [e for e in library['episodes'] if e['id'] not in MERGED]
    library['courses'] = [c for c in library['courses'] if c['id'] not in MERGED]
    for c in library['courses'] + library['episodes']:
        if c.get('number') in RENUMBER:
            c['number'] = RENUMBER[c['number']]
            if c.get('categoryId') == 'network-build': c['categoryOrder'] = int(c['number'].split('.')[1])
    library = walk(library, outside)
    library['courses'].insert(0, entry)
    # Topic groups: the foundation is its own group; hardening and access folded into it.
    groups = {g['id']: g for g in library.get('collections', [])}
    groups['identity'].update({'title': 'Identity foundation', 'description': 'Directory, DNS, time, STIG hardening, PKI, DHCP and tiered administration, in one course.', 'entries': [NEW]})
    for g in groups.values():
        g['entries'] = [e for e in g['entries'] if e not in MERGED or e == NEW]
    library['collections'] = [g for g in library['collections'] if g['id'] != 'harden' and g['entries']]
    for ref in library.get('references', []):
        for r in ref.get('training', {}).get('relatedResources', []):
            m = re.search(r'#course/([a-z0-9-]+)$', r['href'])
            if m and m.group(1) in MERGED:
                r['href'] = f'/technical-training#course/{NEW}'
        rr, seen = [], set()
        for r in ref.get('training', {}).get('relatedResources', []):
            if r['href'] in seen: continue
            seen.add(r['href']); rr.append(r)
        if 'training' in ref and 'relatedResources' in ref['training']:
            ref['training']['relatedResources'] = rr
            for r in rr:
                if r['href'].endswith(f'#course/{NEW}'):
                    r['title'] = 'Apply it in course 1.1, Build and harden the identity foundation'; r['detail'] = 'The build course this design reference supports'
    (C / 'videos.json').write_text(json.dumps(library, ensure_ascii=False, indent=2) + '\n')

    # Progress: the merged course's lessons; saved progress moves from the old lesson IDs.
    progress = json.loads((C / 'training-progress.json').read_text())
    keep = [p for p in progress if p['id'].split(':')[1] not in MERGED]
    first = next(i for i, p in enumerate(progress) if p['id'].split(':')[1] in MERGED)
    mine = [{'id': f'training:{NEW}:{l["id"]}', 'title': l['title'], 'href': f'/training/{NEW}#{l["id"]}', 'group': 'Network build'} for l in lessons]
    progress = keep[:first] + mine + keep[first:]
    (C / 'training-progress.json').write_text(json.dumps(progress, ensure_ascii=False, indent=2) + '\n')
    moves = json.loads((C / 'progress-moves.json').read_text())
    new_ids = {}
    for p in parts:
        for l in p['lessons']:
            pre = PREFIX[p['id']]
            new_ids[f"training:{p['id']}:{l['id']}"] = f"training:{NEW}:" + (l['id'] if l['id'] == pre or l['id'].startswith(pre + '-') else f"{pre}-{l['id']}")
    moves['moved'] = {old: new_ids.get(target, target) for old, target in moves['moved'].items()}
    moves['moved'].update(new_ids)
    (C / 'progress-moves.json').write_text(json.dumps(moves, ensure_ascii=False, indent=2) + '\n')

    # Text that lives outside content/: the System Hub's course map and course 2.1.
    for rel in ['public/inside-network-model/courses.js', 'public/grc-rmf-training/rmf/catalog-data.js', 'public/grc-rmf-training/rmf/learning-data.js']:
        path = ROOT / rel
        path.write_text(outside(path.read_text()))
    print(f'{NEW}: {len(lessons)} lessons, {round(minutes / 60, 1)} h, {len(merged_sources)} sources, {len(nodes)} scene systems, {len(scene["flows"])} flows')

if __name__ == '__main__':
    main()
