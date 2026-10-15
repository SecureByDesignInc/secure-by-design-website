#!/usr/bin/env python3
"""Builds the Authorization Workspace's NIST SP 800-53 Rev. 5 control catalog.

Source: NIST's OSCAL content (github.com/usnistgov/oscal-content, nist.gov/SP800-53/rev5/json):
the Rev. 5 catalog and the SP 800-53B LOW / MODERATE / HIGH baseline profiles. NIST publications are
works of the U.S. Government and are not subject to copyright in the United States.

Usage: python3 scripts/build-control-catalog.py <folder holding the catalog and *_baseline_profile.json>

Writes
  public/authorization-workspace/controls-rev5.json  every active control and enhancement: title,
      statement and SP 800-53A assessment objectives, with parameters shown as
      [Assignment: ...] / [Selection: ...] the way the publication prints them (loaded on demand)
  content/authorization/control-index.json  id -> [title, family, baselines, objective ids] for the
      server's validation and the workspace's search (small enough to bundle)
"""
import json, os, re, sys

src = sys.argv[1]
catalog = json.load(open(os.path.join(src, 'NIST_SP-800-53_rev5_catalog.json')))['catalog']
version = catalog['metadata'].get('version', '')

def ids_in(profile):
    out = set()
    for imp in profile['profile']['imports']:
        for inc in imp.get('include-controls', []):
            out.update(inc.get('with-ids', []))
    return out

baselines = {}
for level in ('LOW', 'MODERATE', 'HIGH'):
    p = json.load(open(os.path.join(src, f'NIST_SP-800-53_rev5_{level}-baseline_profile.json')))
    baselines[level[0]] = ids_in(p)

def label(item):
    for p in item.get('props', []):
        if p['name'] == 'label' and p.get('class') not in ('zero-padded', 'sp800-53a'):
            return p['value']
    for p in item.get('props', []):
        if p['name'] == 'label':
            return p['value']
    return ''

def label53a(item):
    for p in item.get('props', []):
        if p['name'] == 'label' and p.get('class') == 'sp800-53a':
            return p['value']
    return label(item)

params = {}
def collect_params(ctl):
    for prm in ctl.get('params', []):
        params[prm['id']] = prm
    for sub in ctl.get('controls', []):
        collect_params(sub)

def render_param(pid, depth=0):
    prm = params.get(pid)
    if not prm:
        return '[Assignment: organization-defined value]'
    if 'select' in prm:
        sel = prm['select']
        how = 'one or more' if sel.get('how-many') == 'one-or-more' else ''
        choices = '; '.join(insert(c, depth + 1) for c in sel.get('choice', []))
        return f"[Selection{' (' + how + ')' if how else ''}: {choices}]"
    text = (prm.get('label') or (prm.get('guidelines') or [{}])[0].get('prose', 'value')).strip()
    if not text.startswith('organization-defined'):
        text = 'organization-defined ' + text
    return f'[Assignment: {text}]'

INSERT = re.compile(r'\{\{\s*insert:\s*param,\s*([^\s}]+)\s*\}\}')
LINK = re.compile(r'\[([^\]]+)\]\(#[^)]*\)')
def insert(text, depth=0):
    if depth > 4:
        return text
    return LINK.sub(r'\1', INSERT.sub(lambda m: render_param(m.group(1), depth), text or '')).strip()

def statement_lines(part, depth=0):
    lines = []
    prose = insert(part.get('prose', ''))
    lbl = label(part)
    if prose or lbl:
        lines.append([depth, lbl, prose])
    for sub in part.get('parts', []):
        if sub.get('name') == 'item':
            lines += statement_lines(sub, depth + 1)
    return lines

def objectives(part, out):
    for sub in part.get('parts', []):
        if sub.get('name') == 'assessment-objective':
            prose = insert(sub.get('prose', ''))
            if prose and not sub.get('parts'):
                out.append([label53a(sub), prose])
            elif prose:
                out.append([label53a(sub), prose])
            objectives(sub, out)
    return out

controls, index = [], {}
families = {}
def visit(ctl, family):
    status = next((p['value'] for p in ctl.get('props', []) if p['name'] == 'status'), '')
    if status == 'withdrawn':
        return
    cid = label(ctl)
    statement, objs = [], []
    for part in ctl.get('parts', []):
        if part.get('name') == 'statement':
            statement = statement_lines(part)
            if statement and not statement[0][1] and not statement[0][2]:
                statement = statement[1:]
        if part.get('name') == 'assessment-objective':
            objs = objectives(part, [])
            top = insert(part.get('prose', ''))
            if top and not objs:
                objs = [[label53a(part), top]]
    base = ''.join(level for level in 'LMH' if ctl['id'] in baselines[level])
    controls.append({'id': cid, 'title': ctl['title'], 'family': family, 'baselines': base,
                     'statement': statement, 'objectives': objs})
    index[cid] = [ctl['title'], family, base, [o[0] for o in objs]]
    for sub in ctl.get('controls', []):
        visit(sub, family)

for group in catalog['groups']:
    families[group['id'].upper()] = group['title']
    for ctl in group.get('controls', []):
        collect_params(ctl)
for group in catalog['groups']:
    for ctl in group.get('controls', []):
        visit(ctl, group['id'].upper())

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root, 'public/authorization-workspace'), exist_ok=True)
meta = {'source': 'NIST SP 800-53 Rev. 5 (OSCAL catalog ' + version + ') with SP 800-53A Rev. 5 assessment objectives and SP 800-53B baselines',
        'families': families}
with open(os.path.join(root, 'public/authorization-workspace/controls-rev5.json'), 'w') as f:
    json.dump({**meta, 'controls': controls}, f, separators=(',', ':'), ensure_ascii=False)
with open(os.path.join(root, 'content/authorization/control-index.json'), 'w') as f:
    json.dump({**meta, 'controls': index}, f, separators=(',', ':'), ensure_ascii=False)
print(len(controls), 'controls;', sum(len(c['objectives']) for c in controls), 'objectives')
