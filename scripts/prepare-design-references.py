#!/usr/bin/env python3
"""Build content/design-references.json from the owner's US-Source Infrastructure Design Reference Compendium
(docs/design-references/SBD-US-Infrastructure-Design-Reference-Compendium.pdf, assembled 19 October 2026).

The compendium is a LibreOffice Writer export: tables have no ruling lines and nested lists were flattened into
" - " runs, so this script rebuilds both from the text layer (pdfplumber). Output: one entry per infrastructure
service with its design reference (Part One) and its annotated source catalog (Part Two), plus the front matter.
Re-run after the owner supplies a revised compendium:  python3 scripts/prepare-design-references.py
"""

import json, re, sys, collections
import pdfplumber

from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PDF = str(ROOT / 'docs/design-references/SBD-US-Infrastructure-Design-Reference-Compendium.pdf')
BODY_X = 72          # left margin of body text
TABLE_X = 78         # first table column (cell padding 6)
RIGHT = 540          # right margin
LINE_PITCH = 13.7

def font_kind(ch):
    name = ch['fontname'].split('+')[-1]
    size = round(ch['size'])
    if name.startswith('Carlito-Bold'):
        return ('h1' if size >= 16 else 'h2') if size >= 14 else 'h3'
    if name.startswith('DejaVuSansMono'):
        return 'code'
    if name.startswith('Caladea-Bold'):
        return 'bold'
    if name.startswith('Caladea-Italic'):
        return 'italic'
    return 'text'

def spans_from_chars(chars):
    """Inline spans: [{t: text, b: bold, i: italic, c: code}] from a line's chars (sorted by x)."""
    out = []
    prev = None
    for ch in sorted(chars, key=lambda c: c['x0']):
        if not ch['text'].strip():
            prev = None; continue
        k = font_kind(ch)
        key = ('bold' if k in ('bold', 'h1', 'h2', 'h3') else 'text', k == 'italic', k == 'code')
        gap = ch['x0'] - prev['x1'] if prev else 0
        space = ' ' if prev and gap > 0.12 * ch['size'] else ''
        if out and out[-1]['k'] == key:
            out[-1]['t'] += space + ch['text']
        else:
            if out and space: out[-1]['t'] += ' '
            out.append({'k': key, 't': ch['text']})
        prev = ch
    spans = []
    for s in out:
        b, i, c = s['k']
        d = {'t': s['t']}
        if b == 'bold': d['b'] = True
        if i: d['i'] = True
        if c: d['c'] = True
        spans.append(d)
    return spans

def clusters(line):
    """Word clusters separated by wide gaps (table cells on one line)."""
    words = sorted(line['chars'], key=lambda c: c['x0'])
    groups = []
    cur = [words[0]]
    for ch in words[1:]:
        if ch['x0'] - cur[-1]['x1'] > 9 and ch['text'] != ' ' and cur[-1]['text'] != ' ':
            groups.append(cur); cur = [ch]
        else:
            cur.append(ch)
    groups.append(cur)
    cells = []
    for g in groups:
        g = [c for c in g if c['text'].strip() or True]
        text = ''.join(sp['t'] for sp in spans_from_chars(g)).strip()
        if not text: continue
        cells.append({'x0': min(c['x0'] for c in g if c['text'].strip()), 'x1': max(c['x1'] for c in g if c['text'].strip()), 'text': text, 'chars': g})
    return cells

def read_lines(page):
    lines = []
    for ln in page.extract_text_lines(return_chars=True):
        chars = [c for c in ln['chars']]
        text = ln['text']
        if not text.strip(): continue
        kinds = collections.Counter(font_kind(c) for c in chars if c['text'].strip())
        main = kinds.most_common(1)[0][0]
        total = sum(kinds.values()) or 1
        if main == 'code': main = 'text'   # inline code only; the compendium has no code blocks
        if main in ('bold', 'italic'): main = 'text'
        lines.append({'top': ln['top'], 'bottom': ln['bottom'], 'x0': ln['x0'], 'x1': ln['x1'], 'text': text, 'chars': chars, 'kind': main})
    # Inline code sits on a different baseline (11 pt mono inside 12 pt text), so pdfplumber may split one printed
    # line in two; merge lines whose tops are within 5 pt.
    merged = []
    for l in sorted(lines, key=lambda l: (l['top'], l['x0'])):
        if merged and abs(l['top'] - merged[-1]['top']) < 5:
            m = merged[-1]
            m['chars'] = sorted(m['chars'] + l['chars'], key=lambda c: c['x0'])
            m['x0'] = min(m['x0'], l['x0']); m['x1'] = max(m['x1'], l['x1']); m['top'] = min(m['top'], l['top'])
            m['text'] = ''.join(sp['t'] for sp in spans_from_chars(m['chars']))
            kinds = collections.Counter(font_kind(c) for c in m['chars'] if c['text'].strip())
            main = kinds.most_common(1)[0][0]
            m['kind'] = 'text' if main in ('code', 'bold', 'italic') else main
        else:
            merged.append(l)
    lines = merged
    # drop running footers/headers (page numbers etc.)
    return [l for l in lines if l['top'] < 745 and l['top'] > 55]

def is_table_line(line, in_table):
    cells = clusters(line)
    if line['kind'] in ('h1', 'h2', 'h3'): return False
    if len(cells) >= 2 and abs(line['x0'] - TABLE_X) < 2: return True
    if in_table and line['x0'] > TABLE_X + 20 and not line['text'].lstrip().startswith(('•', '◦', '-')): return True
    if in_table and len(cells) >= 2: return True
    return False

def build_table(tlines):
    # column starts: cluster x0 values, merged within 5pt
    starts = sorted(c['x0'] for ln in tlines for c in clusters(ln))
    cols = []
    for x in starts:
        if not cols or x - cols[-1][-1] > 5: cols.append([x])
        else: cols[-1].append(x)
    colx = [min(c) for c in cols]
    # rows by vertical gap
    rows = []
    prev = None
    for ln in tlines:
        if prev is None or ln['top'] - prev['top'] > LINE_PITCH + 2.3:
            rows.append([])
        rows[-1].append(ln)
        prev = ln
    def col_of(x):
        return min(range(len(colx)), key=lambda i: abs(colx[i] - x))
    table = []
    for row in rows:
        cells = [[] for _ in colx]
        for ln in row:
            for c in clusters(ln):
                cells[col_of(c['x0'])].append(c)
        out = []
        for i, frags in enumerate(cells):
            right = colx[i + 1] - 6 if i + 1 < len(colx) else RIGHT
            text = ''
            for f in frags:
                piece = f['text']
                if text and text[-1:].isalpha() and piece[:1].islower() and prev_x1 >= right - 9:
                    text += piece          # a long word wrapped mid-word at the column edge
                elif text:
                    text += ' ' + piece
                else:
                    text = piece
                prev_x1 = f['x1']
            out.append(text)
        table.append(out)
    # drop empty columns
    keep = [i for i in range(len(colx)) if any(r[i] for r in table)]
    table = [[r[i] for i in keep] for r in table]
    return table

def join_para(parts):
    """Join wrapped lines of one paragraph into spans, merging at line breaks with a space."""
    spans = []
    for idx, line in enumerate(parts):
        s = spans_from_chars(line['chars'])
        if idx and spans:
            # a hyphen-free mid-word wrap never happens in body text at this width, so join with a space
            spans[-1]['t'] += ' '
        for sp in s:
            if spans and spans[-1].get('b') == sp.get('b') and spans[-1].get('i') == sp.get('i') and spans[-1].get('c') == sp.get('c'):
                spans[-1]['t'] += sp['t']
            else:
                spans.append(dict(sp))
    for sp in spans: sp['t'] = re.sub(r'[ \t]+', ' ', sp['t'])
    return spans

def parse(first_page=6, last_page=186):
    pdf = pdfplumber.open(PDF)
    blocks = []
    pending = None     # current paragraph/list item lines
    pkind = None       # 'p' | 'li' | 'code'
    tlines = []
    in_run = False     # inside a table, carried across page breaks
    def flush():
        nonlocal pending, pkind, tlines
        if tlines:
            blocks.append({'type': 'table', 'rows': build_table(tlines)}); tlines = []
        if pending:
            if pkind == 'code':
                blocks.append({'type': 'code', 'text': '\n'.join(l['text'] for l in pending)})
            elif pkind == 'cont':
                spans = join_para(pending)
                tgt = blocks[-1]['spans']
                tgt[-1]['t'] += ' '
                for sp in spans:
                    if tgt[-1].get('b') == sp.get('b') and tgt[-1].get('i') == sp.get('i') and tgt[-1].get('c') == sp.get('c'): tgt[-1]['t'] += sp['t']
                    else: tgt.append(dict(sp))
            else:
                spans = join_para(pending)
                text = ''.join(s['t'] for s in spans)
                m = re.match(r'^([•◦▪\-–]|\d{1,2}\.)\s+', text)
                if pkind == 'li' and m:
                    marker = m.group(1)
                    # strip the marker from the first span
                    spans[0]['t'] = spans[0]['t'][len(m.group(0)):] if spans[0]['t'].startswith(m.group(0)) else spans[0]['t']
                    if not spans[0]['t']: spans = spans[1:]
                    blocks.append({'type': 'li', 'ordered': marker[0].isdigit(), 'level': pending[0]['level'], 'spans': spans})
                else:
                    blocks.append({'type': 'p', 'spans': spans})
            pending = None; pkind = None
    for pno in range(first_page - 1, last_page):
        page = pdf.pages[pno]
        lines = read_lines(page)
        # table lines: anchors (two or more cells starting at the table margin), plus the lines that sit inside
        # a run of anchors or directly above the first anchor (a wrapped header cell).
        anchor = [len(clusters(l)) >= 2 and abs(l['x0'] - TABLE_X) < 2 and l['kind'] not in ('h1', 'h2', 'h3') for l in lines]
        tflag = list(anchor)
        for i, l in enumerate(lines):
            if anchor[i]: in_run = True; continue
            if l['kind'] in ('h1', 'h2', 'h3') or l['x0'] < TABLE_X - 1:
                in_run = False; continue
            bullet = l['text'].lstrip().startswith(('•', '◦', '▪'))
            # a wrapped header cell sits one or two lines above the header's anchor line
            below = any(j < len(lines) and anchor[j] and lines[j]['top'] - l['top'] < (j - i) * (LINE_PITCH + 3) for j in (i + 1, i + 2))
            if (in_run and not bullet) or below: tflag[i] = True
            else: in_run = False
        page_start = True
        prev = None
        for li, ln in enumerate(lines):
            text = ln['text'].strip()
            kind = ln['kind']
            in_table = bool(tlines)
            ln['is_table'] = tflag[li]
            if kind in ('h1', 'h2', 'h3'):
                flush()
                # headings may wrap: merge with the previous heading block if the previous block is a heading on the previous line
                if blocks and blocks[-1]['type'] == kind and prev and prev['kind'] == kind and ln['top'] - prev['top'] < 24:
                    blocks[-1]['text'] += ' ' + text
                else:
                    blocks.append({'type': kind, 'text': text})
                prev = ln; continue
            if ln['is_table']:
                if pending: flush()
                if not tlines and page_start and blocks and blocks[-1]['type'] == 'table':
                    tlines = ['CONTINUE']  # the previous page's table continues: merged in flush()
                    tlines = []
                    continuing = True
                tlines.append(ln); prev = ln; page_start = False; continue
            elif in_table:
                flush()
            if kind == 'code':
                if pkind != 'code': flush(); pending = []; pkind = 'code'
                pending.append(ln); prev = ln; continue
            marker = re.match(r'^([•◦▪\-–]|\d{1,2}\.)\s', text)
            gap = (ln['top'] - prev['top']) if prev else 99
            new_para = gap > LINE_PITCH + 4.5 or prev is None
            if page_start and not marker and ln['x0'] <= BODY_X + 1 and blocks and blocks[-1]['type'] in ('p', 'li') and not pending:
                last = ''.join(sp['t'] for sp in blocks[-1]['spans']).rstrip()
                if last and last[-1] not in '.:;!?)' or text[:1].islower():
                    # the previous page ended mid-paragraph: continue it
                    pending = [ln]; pkind = 'cont'; prev = ln; page_start = False; continue
            page_start = False
            if marker and ln['x0'] > BODY_X + 6:
                flush(); pending = [ln]; pkind = 'li'
                ln['level'] = 0 if ln['x0'] < BODY_X + 30 else 1
            elif pending and not new_para:
                pending.append(ln)
            elif pending and pkind == 'li' and ln['x0'] > BODY_X + 6 and gap <= LINE_PITCH + 4.5:
                pending.append(ln)
            else:
                flush(); pending = [ln]; pkind = 'p'
            prev = ln
        flush()
    return blocks


def split_dash_lists(blocks):
    """Writer flattened nested Markdown lists into ' - ' runs inside paragraphs. Rebuild them as list items."""
    out = []
    for blk in blocks:
        if blk['type'] not in ('p', 'li'):
            out.append(blk); continue
        text = ''.join(s['t'] for s in blk['spans'])
        if text.count(' - ') < 2 and not (text.count(' - ') == 1 and re.match(r'^[^:]{3,60}: - ', text)):
            out.append(blk); continue
        # split on ' - ' even when the separator straddles two spans
        chars = [(c, i) for i, sp in enumerate(blk['spans']) for c in sp['t']]
        full = ''.join(c for c, _ in chars)
        cuts = [m.start() for m in re.finditer(r' - ', full)]
        segments = []
        start = 0
        for cut in cuts + [len(full)]:
            seg = []
            for c, i in chars[start:cut]:
                sp = blk['spans'][i]
                key = (sp.get('b', False), sp.get('i', False), sp.get('c', False))
                if seg and seg[-1]['_k'] == key: seg[-1]['t'] += c
                else:
                    d = {'t': c, '_k': key}
                    if key[0]: d['b'] = True
                    if key[1]: d['i'] = True
                    if key[2]: d['c'] = True
                    seg.append(d)
            for d in seg: d.pop('_k', None)
            segments.append(seg)
            start = cut + 3
        segs = [seg for seg in segments if ''.join(s['t'] for s in seg).strip()]
        lead = segs[0]; items = segs[1:]
        lead_text = ''.join(s['t'] for s in lead).strip()
        base = blk.get('level', 0)
        if blk['type'] == 'li':
            out.append({'type': 'li', 'ordered': blk.get('ordered', False), 'level': base, 'spans': lead})
            base += 1
        elif lead_text.endswith(':') and len(lead_text) < 80:
            out.append({'type': 'p', 'spans': [{'t': lead_text, 'b': True}], 'lead': True})
        else:
            out.append({'type': 'p', 'spans': lead})
        level = base
        for seg in items:
            t = ''.join(s['t'] for s in seg).strip()
            labelled = seg and seg[0].get('b') and seg[0]['t'].rstrip().endswith(':')
            if t.endswith(':') and len(t) < 60:
                out.append({'type': 'li', 'ordered': False, 'level': base, 'spans': [{'t': t, 'b': True}]})
                level = base + 1
            elif labelled:
                out.append({'type': 'li', 'ordered': False, 'level': base, 'spans': seg})
                level = base
            else:
                out.append({'type': 'li', 'ordered': False, 'level': level, 'spans': seg})
    return out

def merge_tables(blocks):
    out = []
    for blk in blocks:
        if blk['type'] == 'table' and out and out[-1]['type'] == 'table' and blk['rows'] and out[-1]['rows']:
            prev = out[-1]
            rows = blk['rows']
            if len(rows[0]) == len(prev['rows'][0]):
                if rows[0] == prev['rows'][0]: rows = rows[1:]            # repeated header
                if rows and not rows[0][0].strip() and prev['rows']:    # a row that wrapped onto the next page
                    last = prev['rows'][-1]
                    prev['rows'][-1] = [(a + ' ' + b).strip() if b else a for a, b in zip(last, rows[0])]
                    rows = rows[1:]
                prev['rows'].extend(rows)
                continue
        out.append(blk)
    return out

def tidy(blocks):
    for blk in blocks:
        if blk['type'] == 'table':
            blk['rows'] = [[re.sub(r'\s+', ' ', c).strip() for c in r] for r in blk['rows']]
        for sp in blk.get('spans', []):
            sp['t'] = re.sub(r'\s+', ' ', sp['t'])
        if 'spans' in blk:
            # keep spaces outside code runs so inline code renders tight
            fixed = []
            for sp in blk['spans']:
                if sp.get('c'):
                    lead, core, tail = sp['t'][:len(sp['t']) - len(sp['t'].lstrip())], sp['t'].strip(), sp['t'][len(sp['t'].rstrip()):]
                    if lead: fixed.append({'t': lead})
                    if core: fixed.append({**sp, 't': core})
                    if tail: fixed.append({'t': tail})
                else:
                    fixed.append(sp)
            merged = []
            for sp in fixed:
                if merged and not sp.get('c') and not merged[-1].get('c') and merged[-1].get('b') == sp.get('b') and merged[-1].get('i') == sp.get('i'):
                    merged[-1]['t'] += sp['t']
                else:
                    merged.append(sp)
            blk['spans'] = [sp for sp in merged if sp['t']]
            if blk['spans']:
                blk['spans'][0]['t'] = blk['spans'][0]['t'].lstrip()
                blk['spans'][-1]['t'] = blk['spans'][-1]['t'].rstrip()
    return blocks

def sections(blocks):
    """Split on h1 headings; the front matter before the first h1 is 'overview'."""
    secs = [{'title': 'Overview', 'blocks': []}]
    for blk in blocks:
        if blk['type'] == 'h1':
            secs.append({'title': blk['text'], 'blocks': []})
        else:
            secs[-1]['blocks'].append(blk)
    return secs

def outline(secs):
    for i, sec in enumerate(secs):
        print(f'[{i}] {sec["title"]}  ({len(sec["blocks"])} blocks)')
        for blk in sec['blocks']:
            if blk['type'] == 'h2': print('     -', blk['text'][:90])

# ---------- services ----------
SERVICES = [
  {'id': 'active-directory', 'title': 'Active Directory design', 'subtitle': 'Forest, domain, OU, trust, Group Policy and tiering design', 'topic': 'Active Directory',
   'design': 'Part I', 'catalog': 'Reference Collection: Active Directory', 'courses': ['dc01-dc02', 'harden-baseline', 'tiered-admin']},
  {'id': 'dns', 'title': 'DNS design', 'subtitle': 'Namespace, zones, resolution, dynamic update, DNSSEC and logging design', 'topic': 'DNS',
   'design': 'Part II', 'catalog': 'Reference Collection: DNS', 'courses': ['dns-configuration']},
  {'id': 'time', 'title': 'Time synchronization design', 'subtitle': 'The time hierarchy, upstream sources, Kerberos skew and virtualized controllers', 'topic': 'Time',
   'design': 'Part III', 'catalog': 'Reference Collection: NTP', 'courses': ['domain-time']},
  {'id': 'pki', 'title': 'PKI design', 'subtitle': 'CA hierarchy, cryptography, validity, revocation, templates and CA protection', 'topic': 'PKI',
   'design': 'Part IV', 'catalog': 'Reference Collection: Certificate Authority', 'courses': ['two-tier-pki']},
  {'id': 'dhcp', 'title': 'DHCP design', 'subtitle': 'Placement, availability, scopes, options, DNS integration, hardening and logging', 'topic': 'DHCP',
   'design': 'Part V', 'catalog': 'DHCP for Windows/Enterprise Environments', 'courses': ['dhcp']},
  {'id': 'disa-stigs', 'title': 'DISA STIGs and GPO packages', 'subtitle': 'DISA’s artifacts and tooling, and the guidance around them', 'topic': 'STIGs',
   'design': None, 'catalog': 'DISA STIGs and DISA STIG GPO Packages', 'courses': ['stig-scap', 'harden-baseline']},
]

def find(secs, prefix):
    return next((s for s in secs if s['title'].startswith(prefix)), None)

def design_areas(sec):
    """The numbered design areas: h2 headings "N. Title" (h3 "N.N Title" when a part keeps them under one h2)."""
    areas = [b['text'] for b in sec['blocks'] if b['type'] == 'h2' and re.match(r'^\d+\. ', b['text'])]
    skip = ('TL;DR', 'Authoritative', 'Where authorities', 'Caveats', 'Design areas')
    areas = [a for a in areas if not any(k in a for k in skip)]
    if not areas:
        areas = [b['text'] for b in sec['blocks'] if b['type'] == 'h3' and re.match(r'^\d+\.\d+ ', b['text'])]
    return [re.sub(r'^\d+(\.\d+)?\.? ', '', a) for a in areas]

def source_count(sec):
    """Rows of the authoritative source table(s), header excluded."""
    n = 0
    for b in sec['blocks']:
        if b['type'] == 'table' and b['rows'] and any(h.lower().startswith('publisher') for h in b['rows'][0]):
            n += sum(1 for r in b['rows'][1:] if any(c.strip() for c in r))
    return n

def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:60]

def add_ids(blocks):
    seen = set()
    for b in blocks:
        if b['type'] in ('h2', 'h3'):
            base = slug(b['text']); s = base; k = 2
            while s in seen: s = f'{base}-{k}'; k += 1
            seen.add(s); b['id'] = s
    return blocks

# ---------- wording (owner direction, 20 October 2026) ----------
# The design references are framed as "Government & Vendor Guidelines", not as US sources. These rewrite the
# compendium's framing (titles, scope labels, "what the US authorities say") and keep the factual statements where
# "US" is a legal or provenance detail: the copyright status of US government works, where a document is hosted,
# a co-author's nationality.
WORDING = [
    (r'What the US authorities say:', 'What the government and vendor guidelines say:'),
    (r'What US authorities say\.', 'What the government and vendor guidelines say.'),
    (r'Where the US authorities consistently agree:', 'Where the authorities consistently agree:'),
    (r'\bThe US authorities agree', 'The authorities agree'),
    (r'\bUS authorities agree', 'The authorities agree'),
    (r'None of the US authorities endorse', 'None of the authorities reviewed endorse'),
    (r'\bwhat each US authority recommends', 'what each authority recommends'),
    (r'\bNo US authority reviewed', 'No authority reviewed'),
    (r'\bNo US authority', 'No authority reviewed'),
    (r'\bNo US source recommends', 'No source reviewed recommends'),
    (r'\bno US-government body', 'no government body reviewed'),
    (r'\bThere is no US-government mandate', 'There is no government mandate'),
    (r'\bno US-government source', 'no government source reviewed'),
    (r'\bNo US-government guidance yet', 'No government guidance yet'),
    (r'\bNo US government source verified here', 'No government source verified here'),
    (r'\bThe US guidance baseline', 'The guidance baseline'),
    (r'\bthe US guidance baseline', 'the guidance baseline'),
    (r'\bUS guidance on ', 'Government and vendor guidance on '),
    (r'\bUS government guidance agrees', 'Government guidance agrees'),
    (r'Part (I{1,3}|IV|V) — US Design Reference:', r'Part \1 — Design Reference:'),
    (r'US-Only Reference Collection:', 'Reference Collection:'),
    (r'US Reference Collection:', 'Reference Collection:'),
    (r'US-Source Design Reference', 'Government & Vendor Guidelines Design Reference'),
    (r'Consolidated US-source landscape', 'Consolidated source landscape'),
    (r'Section B — US government and standards guidance', 'Section B — Government and standards guidance'),
    (r'organized by design area, US sources only,', 'organized by design area, government and vendor guidelines only,'),
    (r'^US sources only\.\s*$', 'Government and vendor guidelines only.'),
    (r'^US sources only:\s*$', 'Government and vendor guidelines only:'),
    (r'scoped to US sources', 'scoped to government and vendor guidelines'),
    (r'plus US government guidance', 'plus government guidance'),
    (r'the US-based IETF and ICANN', 'the IETF and ICANN'),
    (r'Non-US government source sections', "Other governments' source sections"),
    (r'\bnon-US government guidance', "other governments' guidance"),
    (r'A separate standalone US DNS source document', 'A separate standalone DNS source document'),
    (r'the two US documents that', 'the two government documents that'),
    (r', US federal mandates,', ', federal mandates,'),
    (r'Clearly-labeled US-company practitioner research', 'Clearly labeled practitioner research'),
    (r'US-company practitioner research', 'Practitioner research'),
    (r'^US practitioner \(', 'Practitioner ('),
    (r'practitioner, non- ?governmental, US company\)', 'practitioner, non-governmental)'),
    (r'\(non-governmental, US-origin\)', '(non-governmental)'),
    (r'Treated here as a US \(CISA/NSA\) source', 'Treated here as a CISA/NSA source'),
    (r'as a CISA/NSA \(US\) source', 'as a CISA/NSA source'),
    (r'co- ?authorship counts as the US source', 'co-authorship counts as the source'),
    (r'co- ?authorship is treated as the US source', 'co-authorship is treated as the source'),
    (r'^Publisher \(US\)$', 'Publisher'),
    (r'\b(NIST|CISA|OMB|NSA|CIS) \(US\)', r'\1'),
    (r'\(Center for Internet Security, US nonprofit\)', '(Center for Internet Security, nonprofit)'),
    (r'\bDISA \(US DoD\)', 'DISA (DoD)'),
    (r'B2\. CISA / OMB / NSA \(US\)', 'B2. CISA / OMB / NSA'),
    (r'US-Only Verified Reference Collection', 'Verified Reference Collection'),
    (r'A US-Only Reference Collection', 'A Reference Collection'),
    (r'edge of the US-only scope', 'edge of this scope'),
    (r'\bThe defensible US-source baseline', 'The defensible baseline'),
    (r'\bThe US government baseline', 'The government baseline'),
    (r'\bThe US design baseline', 'The design baseline'),
    (r'\bThe US baseline', 'The baseline'),
    (r'^Government baseline \(US\):', 'Government baseline:'),
    (r'\bNone among US authorities', 'None among the authorities reviewed'),
    (r'\bnone among US authorities', 'none among the authorities reviewed'),
    (r'\bno US authority', 'no authority reviewed'),
    (r'\bNo US government source reviewed', 'No government source reviewed'),
    (r'\bNo US government body', 'No government body'),
    (r'\bNo US-government DHCP standard', 'No government DHCP standard'),
    (r'\bno dedicated US-government', 'no dedicated government'),
    (r'\bNo US-gov DHCP baseline', 'No government DHCP baseline'),
    (r'Microsoft or US-gov page', 'Microsoft or government page'),
    (r'\bB7\. US practitioner \(non-governmental\) research', 'B7. Practitioner (non-governmental) research'),
    (r'\bUS practitioner sources', 'Practitioner sources'),
    (r'\bUS practitioner research', 'practitioner research'),
    (r'\(US practitioner\)', '(practitioner)'),
    (r'\(US company; non-governmental research\)', '(non-governmental research)'),
    (r'— US company, practitioner research', '— practitioner research'),
    (r'\(US company; NON- ?GOVERNMENTAL\)', '(NON-GOVERNMENTAL)'),
    (r'\bCIS \(US nonprofit\)', 'CIS (nonprofit)'),
    (r'Section B: US government and standards guidance', 'Section B: Government and standards guidance'),
    (r'\(US standards anchor: ', '(standards anchor: '),
    (r'in IETF and US government guidance', 'in IETF and government guidance'),
    (r'The authenticated US government options', 'The authenticated government options'),
    (r'only US- ?government-documented answer', 'only government-documented answer'),
    (r'\bUS-government authenticated options', 'Government authenticated options'),
    (r'no US- ?government standing', 'no government standing'),
    (r'not a US-government source', 'not a government source'),
    (r'not US government\.', 'not a government source.'),
    (r'Current \(US- ?government context\)', 'Current (government context)'),
    (r'no non-US government sources were used', "no other governments' sources were used"),
    (r'Section B — Related US government and standards guidance', 'Section B — Related government and standards guidance'),
    (r'These are free US government publications and', 'These are free government publications and'),
]
def reword(text):
    for pattern, repl in WORDING:
        text = re.sub(pattern, repl, text)
    return text
def reword_blocks(blocks):
    for b in blocks:
        if 'text' in b: b['text'] = reword(b['text'])
        for sp in b.get('spans', []): sp['t'] = reword(sp['t'])
        if b['type'] == 'table': b['rows'] = [[reword(c) for c in r] for r in b['rows']]
    return blocks

if __name__ == '__main__':
    blocks = reword_blocks(tidy(merge_tables(split_dash_lists(parse(6, 186)))))
    secs = sections(blocks)
    for sec in secs: sec['title'] = reword(sec['title'])
    out = {'source': 'SBD-US-Infrastructure-Design-Reference-Compendium.pdf', 'assembled': '19 October 2026', 'overview': add_ids(secs[0]['blocks']), 'services': []}
    for svc in SERVICES:
        design = find(secs, svc['design']) if svc['design'] else None
        catalog = find(secs, svc['catalog'])
        if svc['design'] and not design: raise SystemExit(f"design section missing for {svc['id']}")
        if not catalog: raise SystemExit(f"catalog section missing for {svc['id']}")
        entry = {k: v for k, v in svc.items() if k not in ('design', 'catalog')}
        entry['design'] = {'title': design['title'], 'areas': design_areas(design), 'blocks': add_ids(design['blocks'])} if design else None
        entry['catalog'] = {'title': catalog['title'], 'blocks': add_ids(catalog['blocks'])}
        entry['stats'] = {'areas': len(entry['design']['areas']) if design else 0, 'sources': source_count(design) if design else source_count(catalog)}
        out['services'].append(entry)
    path = ROOT / 'content/design-references.json'
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    # The catalog tiles carry only what the Training Hub needs: counts and the design-area links (not the 800 KB of text).
    vpath = ROOT / 'content/videos.json'
    library = json.loads(vpath.read_text(encoding='utf-8'))
    for entry in out['services']:
        tile = next((item for item in library.get('references', []) if item['id'] == f"design-{entry['id']}"), None)
        if not tile: continue
        tile['stats'] = entry['stats']
        if entry['design']:
            heads = [b for b in entry['design']['blocks'] if b['type'] in ('h2', 'h3') and b.get('id') and re.sub(r'^\d+(\.\d+)?\.? ', '', b['text']) in entry['design']['areas']]
            tile['areas'] = [{'title': re.sub(r'^\d+(\.\d+)?\.? ', '', b['text']), 'anchor': b['id']} for b in heads]
        else:
            tile['areas'] = [{'title': re.sub(r'^\d+\.? ', '', b['text']), 'anchor': b['id']} for b in entry['catalog']['blocks'] if b['type'] == 'h2' and b.get('id')]
    vpath.write_text(json.dumps(library, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for e in out['services']: print(e['id'], e['stats'], len(e['design']['blocks']) if e['design'] else 0, len(e['catalog']['blocks']))
    print('wrote', path, path.stat().st_size, 'bytes')
