#!/usr/bin/env python3
"""Build the Network Authorization workbook and training package (course 2.1, RMF to ATO: all seven RMF steps).

Each course in public/grc-rmf-training/rmf/catalog-data.js (window.CATALOG_PARTS) gets, in public/grc-rmf-training/<folder>/:

  SecureByDesign-<folder>-Workbook.docx          the companion workbook: the course's one download
                                                 (owner request, 18 October 2026: Word only, no ZIP or PDF)
  workbook-cover.webp                            (--all) page 1, for the Compliance Hub tile

The workbooks use the Build the Network companion workbook design. scripts/rmf-workbook/template.docx is a
copy of one (course 1.7's); every paragraph, list and table below is a copy of one of its building blocks, so
fonts, colours, spacing, numbering, links and the footer carry over. The text comes from the same data the
course pages use (public/grc-rmf-training/rmf/*.js) and from content/videos.json. With --all, a PDF export made in a
temporary folder (never published) checks the layout and gives the cover and training.pages in content/videos.json.

  python3 scripts/prepare-rmf-workbooks.py          Word workbooks only
  python3 scripts/prepare-rmf-workbooks.py --all    workbooks, layout check, covers and page counts

Needs python-docx and lxml; --all also needs LibreOffice (soffice), poppler (pdftoppm, pdfinfo, pdftotext)
and Pillow.
"""
from __future__ import annotations

import copy
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'scripts/rmf-workbook/template.docx'
COPYRIGHT = '© 2026 Secure By Design Team LLC.'
SITE = 'https://securebydesigninc.com'
# A fixed timestamp keeps the ZIPs identical when nothing changed.

PREREQUISITES = {
    '2.1': [
        'Basic security and system administration knowledge. No commercial tool access is required.',
        'Your System Hub build from Build the Network (courses 1.1–1.19), or the supplied sample records; the samples are enough to complete the course.',
        'The governing direction for your practice: NIST SP 800-37 Revision 2 and, for a Special Access Program (SAP) system, the JSIG or successor your program directs. This course uses the public April 2016 JSIG.',
    ],
    '2.2': [
        'Course 2.1’s outputs: the scope and registration records, the draft System Security Plan with its categorization, the Security Controls Traceability Matrix, the draft Risk Assessment Report, and the continuous monitoring strategy.',
        'Your System Hub build, or the supplied sample records.',
        'The control and assessment procedure releases your authority has adopted (NIST SP 800-53 and SP 800-53A).',
    ],
    '2.3': [
        'Course 2.2’s outputs: the as-implemented System Security Plan and traceability matrix, the evidence index, the Security Assessment Plan and Report, the updated Risk Assessment Report, and the Plan of Action and Milestones.',
        'Course 2.1’s continuous monitoring strategy.',
        'Your System Hub build, or the supplied sample records.',
    ],
}
NEXT = {
    '2.1': 'That completes Risk Management Framework. Course 2.2, Body of Evidence, implements and assesses the controls you selected, starting from these outputs.',
    '2.2': 'That completes Body of Evidence. Course 2.3, Authorization to Operate, assembles the package, supports the authorizing official’s decision, and keeps the authorization current.',
    '2.3': 'That completes the Network Authorization path. Keep the package current through the monitoring strategy; only the authorizing official makes an authorization decision.',
}


def course_data() -> dict:
    script = (
        "const fs=require('fs'),vm=require('vm');const c={window:{}};"
        "for(const f of ['catalog-data.js','learning-data.js','network-data.js'])"
        "vm.runInNewContext(fs.readFileSync('public/grc-rmf-training/rmf/'+f,'utf8'),c);"
        "process.stdout.write(JSON.stringify(c.window));"
    )
    return json.loads(subprocess.run(['node', '-e', script], cwd=ROOT, check=True, capture_output=True, text=True).stdout)


def text_of(element) -> str:
    return ''.join(t.text or '' for t in element.iter(qn('w:t')))


class Workbook:
    """A copy of the template with its body cleared, and the template's building blocks to fill it."""

    def __init__(self):
        self.doc = Document(str(TEMPLATE))
        body = self.doc.element.body
        items = [el for el in body.iterchildren() if el.tag != qn('w:sectPr')]
        expect = {3: 'COURSE 1.7', 11: 'START HERE', 12: 'Table of contents', 14: 'Before you start', 21: 'HOW TO USE IT', 24: 'Before you start', 26: 'Prerequisites', 30: 'What this course builds'}
        for index, start in expect.items():
            if not text_of(items[index]).startswith(start):
                sys.exit(f'scripts/rmf-workbook/template.docx changed: element {index} should start “{start}”')
        self.cover = [copy.deepcopy(el) for el in items[:10]]
        self.blocks = {
            'break': items[10], 'eyebrow': items[11], 'lead': items[13], 'toc': items[14], 'callout': items[21],
            'h1': items[24], 'h2': items[26], 'check': items[27], 'bullet': items[31], 'record': items[36],
        }
        numbered = next(el for el in items if el.tag == qn('w:p') and '<w:numId w:val="4"/>' in el.xml)
        body_text = next(el for el in items if text_of(el).startswith('Evidence to keep'))
        line = next(i for i, el in enumerate(items) if el.tag == qn('w:p') and '<w:pBdr>' in el.xml and '<w:shd' not in el.xml and not text_of(el).strip())
        link = next(el for el in items if '<w:hyperlink' in el.xml and 'r:id=' in el.xml)
        signoff = next(el for el in items if el.tag == qn('w:tbl') and text_of(el).startswith('LESSON'))
        self.blocks.update({'numbered': numbered, 'body': body_text, 'line': items[line], 'gap': items[line + 1], 'link': link, 'table3': signoff})
        self.blocks = {key: copy.deepcopy(value) for key, value in self.blocks.items()}
        numbering = self.doc.part.numbering_part.element
        self.numbered_abstract = next(n.find(qn('w:abstractNumId')).get(qn('w:val')) for n in numbering.findall(qn('w:num')) if n.get(qn('w:numId')) == '4')
        for el in items:
            body.remove(el)
        self.body = body
        self.sect = body.find(qn('w:sectPr'))
        self.bookmark = 100
        self.list_id = None

    # Building blocks -------------------------------------------------------------------------------------------
    def add(self, element):
        self.sect.addprevious(element)
        return element

    def clone(self, key):
        return copy.deepcopy(self.blocks[key])

    @staticmethod
    def set_text(element, value: str):
        runs = list(element.iter(qn('w:r')))
        texts = list(runs[0].iter(qn('w:t')))
        texts[0].text = value
        texts[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        for extra in texts[1:]:
            extra.getparent().remove(extra)
        for run in runs[1:]:
            run.getparent().remove(run)
        return element

    def para(self, key, value):
        return self.add(self.set_text(self.clone(key), value))

    def rich(self, key, parts):
        """A paragraph whose runs are [(text, bold)], copied from the block's first run."""
        element = self.clone(key)
        runs = list(element.iter(qn('w:r')))
        first = runs[0]
        for run in runs[1:]:
            run.getparent().remove(run)
        anchor = first
        for index, (value, bold) in enumerate(parts):
            run = first if index == 0 else copy.deepcopy(first)
            if index:
                anchor.addnext(run)
                anchor = run
            self.set_text_in_run(run, value)
            props = run.find(qn('w:rPr'))
            for tag in ('w:b', 'w:bCs'):
                found = props.find(qn(tag))
                if bold and found is None:
                    props.insert(1, OxmlElement(tag))
                elif not bold and found is not None:
                    props.remove(found)
        return self.add(element)

    @staticmethod
    def set_text_in_run(run, value):
        texts = list(run.iter(qn('w:t')))
        texts[0].text = value
        texts[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        for extra in texts[1:]:
            extra.getparent().remove(extra)

    def page(self, eyebrow):
        # The new page starts at its eyebrow line. A separate page-break paragraph would spill onto a blank
        # page whenever the previous page is exactly full.
        element = self.para('eyebrow', eyebrow)
        props = element.find(qn('w:pPr'))
        if props is None:
            props = OxmlElement('w:pPr')
            element.insert(0, props)
        style = props.find(qn('w:pStyle'))
        brk = OxmlElement('w:pageBreakBefore')
        if style is not None:
            style.addnext(brk)
        else:
            props.insert(0, brk)

    def heading(self, value, anchor):
        element = self.set_text(self.clone('h1'), value)
        start, end = element.find(qn('w:bookmarkStart')), element.find(qn('w:bookmarkEnd'))
        self.bookmark += 1
        start.set(qn('w:name'), anchor)
        start.set(qn('w:id'), str(self.bookmark))
        end.set(qn('w:id'), str(self.bookmark))
        return self.add(element)

    def toc(self, value, anchor):
        element = self.set_text(self.clone('toc'), value)
        element.find(qn('w:hyperlink')).set(qn('w:anchor'), anchor)
        return self.add(element)

    def callout(self, lead, value):
        element = self.clone('callout')
        runs = list(element.iter(qn('w:r')))
        self.set_text_in_run(runs[0], lead + '  ')
        self.set_text_in_run(runs[1], value)
        return self.add(element)

    def bullets(self, values, key='bullet'):
        for value in values:
            self.para(key, value)

    def numbered(self, items):
        """A numbered list that starts again at 1: [text] or [(label, text)]."""
        numbering = self.doc.part.numbering_part.element
        number = max(int(n.get(qn('w:numId'))) for n in numbering.findall(qn('w:num'))) + 1
        num = OxmlElement('w:num')
        num.set(qn('w:numId'), str(number))
        abstract = OxmlElement('w:abstractNumId')
        abstract.set(qn('w:val'), self.numbered_abstract)
        num.append(abstract)
        override = OxmlElement('w:lvlOverride')
        override.set(qn('w:ilvl'), '0')
        start = OxmlElement('w:startOverride')
        start.set(qn('w:val'), '1')
        override.append(start)
        num.append(override)
        numbering.append(num)
        for item in items:
            element = self.rich('numbered', [(item[0] + ' — ', True), (item[1], False)] if isinstance(item, (list, tuple)) else [(item, False)])
            element.find('.//' + qn('w:numId')).set(qn('w:val'), str(number))

    def lines(self, pairs=2):
        for _ in range(pairs):
            self.add(self.clone('line'))
            self.add(self.clone('gap'))

    def link(self, value, url):
        element = self.set_text(self.clone('link'), value)
        relation = self.doc.part.relate_to(url, RT.HYPERLINK, is_external=True)
        element.find(qn('w:hyperlink')).set(qn('r:id'), relation)
        return self.add(element)

    def record(self, rows, header=('RECORD', 'YOUR OBSERVATION')):
        """The two-column record table: header, then one row per prompt with an empty answer cell."""
        table = self.clone('record')
        trs = table.findall(qn('w:tr'))
        head, template = trs[0], trs[1]
        for cell, value in zip(head.findall(qn('w:tc')), header):
            self.set_text(cell, value)
        for tr in trs[1:]:
            table.remove(tr)
        for value in rows:
            tr = copy.deepcopy(template)
            self.set_text(tr.findall(qn('w:tc'))[0], value)
            table.append(tr)
        return self.add(table)

    def table(self, header, rows):
        """A table of any width, built from the three-column sign-off table."""
        table = self.clone('table3')
        grid = table.find(qn('w:tblGrid'))
        cols = grid.findall(qn('w:gridCol'))
        total = sum(int(c.get(qn('w:w'))) for c in cols)
        for c in cols:
            grid.remove(c)
        width = total // len(header)
        for _ in header:
            col = OxmlElement('w:gridCol')
            col.set(qn('w:w'), str(width))
            grid.append(col)
        trs = table.findall(qn('w:tr'))
        head, template = trs[0], trs[1]
        for tr in trs:
            table.remove(tr)

        def build(model, values):
            tr = copy.deepcopy(model)
            cells = tr.findall(qn('w:tc'))
            for cell in cells[1:]:
                tr.remove(cell)
            # Copy a cell that carries text formatting (an empty date cell has no run to copy).
            written = [cell for cell in cells if cell.find('.//' + qn('w:r')) is not None]
            plain = [cell for cell in written if cell.find('.//' + qn('w:b')) is None]
            prototype = cells[0] if model is head else (plain or written)[0]
            tr.remove(cells[0])
            for value in values:
                cell = copy.deepcopy(prototype)
                width_el = cell.find('.//' + qn('w:tcW'))
                if width_el is not None:
                    width_el.set(qn('w:w'), str(width))
                    width_el.set(qn('w:type'), 'dxa')
                self.set_text(cell, value)
                tr.append(cell)
            return tr

        table.append(build(head, header))
        for values in rows:
            table.append(build(template, values))
        return self.add(table)

    # Document-wide settings ------------------------------------------------------------------------------------
    def finish(self, course, part, path: Path):
        for paragraph in self.doc.sections[0].footer.paragraphs:
            for run in paragraph.runs:
                if 'Materials edition' in run.text:
                    run.text = re.sub(r'Course [\d.]+ · Materials edition [\d.]+', f'Course {course["number"]} · Materials edition {course["training"]["materialsEdition"]}', run.text)
        props = self.doc.core_properties
        props.title = f'{course["title"]} — companion workbook'
        props.subject = course['subtitle']
        props.author = 'Secure By Design'
        props.keywords = ', '.join(['Secure By Design', 'companion workbook', f'Course {course["number"]}', 'Network Authorization', 'RMF', 'NIST SP 800-37', 'JSIG', *course['tags']])
        props.comments = f'Materials edition {course["training"]["materialsEdition"]} · Updated {course["training"]["updated"]}'
        self.doc.save(str(path))


def write_workbook(data: dict, course: dict, part: dict, path: Path):
    modules = {m['id']: m for m in data['CATALOG']}
    learning = {m['id']: data['LEARNING'][i] for i, m in enumerate(data['CATALOG'])}
    network = {m['id']: data['RMF_NETWORK']['modules'][i] for i, m in enumerate(data['CATALOG'])}
    artifacts = {a['id']: a for a in data['ARTIFACTS']}
    ids = []
    for module_id in part['modules']:
        for artifact_id in learning[module_id]['artifacts']:
            if artifact_id not in ids:
                ids.append(artifact_id)
    ours = [artifacts[i] for i in ids]
    sources = data['RMF_SOURCES']
    n, t = course['number'], course['training']
    book = Workbook()

    # Cover: the template's own paragraphs with this course's text.
    cover = book.cover
    values = {3: f'COURSE {n}    /    COMPANION WORKBOOK', 4: course['title'], 5: course['subtitle'], 6: course['description'],
              7: f'MATERIALS EDITION {t["materialsEdition"]}    /    COURSE {n}', 8: f'Updated {t["updated"]}  ·  sbd-{part["folder"]}'}
    for index, element in enumerate(cover):
        if index in values:
            Workbook.set_text(element, values[index])
        book.add(element)

    # Contents.
    book.page('START HERE / YOUR LEARNING PATH')
    book.heading('Table of contents', 'contents')
    book.para('lead', 'Read each module alongside the interactive course. Use the record tables to write down what you actually produce — the workbook is your record, not the course.')
    book.toc('Before you start', 'before')
    book.toc('RMF steps, tasks, and outputs', 'steps')
    for module_id in part['modules']:
        book.toc(f'{module_id}  {modules[module_id]["title"]}', f'module-{module_id}')
    if part.get('capstone'):
        book.toc('Authorization to Operate package capstone', 'capstone')
    for value, anchor in (('Evidence starters', 'starters'), ('Knowledge check answers', 'answers'), ('Sources', 'sources'), ('Course review and sign-off', 'signoff')):
        book.toc(value, anchor)
    book.callout('HOW TO USE IT', 'Each module page has the same shape: its RMF step with the NIST SP 800-37 Rev. 2 and JSIG tasks and outputs, three short lessons, a worked example, the practice output, and a record table. Fill the tables from your own records — never from the sample values.')

    # Before you start.
    book.page(f'COURSE {n} / PREREQUISITES')
    book.heading('Before you start', 'before')
    book.para('lead', course['description'])
    book.para('h2', 'Prerequisites')
    book.bullets(PREREQUISITES[n], 'check')
    book.para('h2', 'What this course covers')
    book.bullets(course['outcomes'])
    book.para('h2', 'Practice artifacts in this course')
    book.bullets([f'{a["title"]} — {a["purpose"]}' for a in ours])

    # The step map.
    book.page(f'COURSE {n} / RMF STEP MAP')
    book.heading('RMF steps, tasks, and outputs', 'steps')
    book.para('lead', 'Each module follows one Risk Management Framework (RMF) step in NIST SP 800-37 Revision 2 order, with the matching tasks and outputs of the Joint Special Access Program Implementation Guide (JSIG), 11 April 2016.')
    span = lambda tasks: (tasks[0][0] + ('–' + tasks[-1][0] if len(tasks) > 1 else '')) if tasks else '—'
    book.table(['MODULE', 'RMF STEP', 'NIST', 'JSIG'], [[f'{i}  {modules[i]["title"]}', modules[i]['rmf']['step'], span(modules[i]['rmf']['nist']), span(modules[i]['rmf']['jsig'])] for i in part['modules']])
    book.callout('TWO DOCUMENTS, ONE SEQUENCE', 'NIST SP 800-37 Revision 2 has seven steps, starting with Prepare. The 2016 JSIG follows Revision 1’s six steps, from Categorize to Monitor, with SP 800-53 Revision 4 and CNSSI 1253 (March 2014). Confirm whether your program directs the JSIG, its successor, or other guidance.')

    # Modules.
    for module_id in part['modules']:
        m, l, r = modules[module_id], learning[module_id], modules[module_id]['rmf']
        unit = 'HOUR' if float(m['hours']) == 1 else 'HOURS'
        book.page(f'MODULE {module_id}  /  {m["phase"].upper()}  /  ABOUT {m["hours"]} {unit}')
        book.heading(m['title'], f'module-{module_id}')
        book.callout('WHY THIS MATTERS', m['outcome'])
        book.para('h2', 'The RMF step')
        book.rich('body', [('Who does the work  ', True), (r['roles'], False)])
        tasks = [f'NIST {task[0]} · {task[1]}' for task in r['nist']] + [f'JSIG Task {task[0]} · {task[1]}' for task in r['jsig']]
        if tasks:
            book.bullets(tasks)
        if m['phase'] == 'Prepare':
            book.para('body', 'The 2016 JSIG has no Prepare step.')
        book.para('h2', 'What this module produces')
        book.bullets(r['outputs'])
        if r['jsigOutputs']:
            book.rich('body', [('JSIG step outputs  ', True), ('; '.join(r['jsigOutputs']), False)])
        if r['difference']:
            book.callout('WHERE THE JSIG AND NIST DIFFER', r['difference'])
        book.para('h2', 'Learn')
        for label, lesson in zip(m['lessons'], l['learn']):
            book.rich('body', [(label + '  ', True), (lesson[0], True)])
            for paragraph in lesson[1:]:
                book.para('body', paragraph)
        book.para('h2', f'Worked example: {l["example"][0]}')
        book.numbered([tuple(step) for step in l['example'][1]])
        book.para('h2', 'Build')
        book.para('body', m['build'])
        book.rich('body', [('Practice artifacts  ', True), ('; '.join(artifacts[a]['title'] for a in l['artifacts']) + ' (see Evidence starters)', False)])
        book.para('h2', 'Think it through')
        book.para('body', m['prove'])
        book.lines(2)
        book.para('h2', 'Check your understanding')
        book.para('body', l['quiz'][0])
        book.bullets([f'{chr(65 + i)}. {answer}' for i, answer in enumerate(l['quiz'][1])])
        book.para('h2', 'Your record')
        book.record([f'{artifacts[a]["title"]} — location and version' for a in l['artifacts']] + ['Reviews or approvals recorded', 'Open questions carried forward'])
        book.callout('IN YOUR NETWORK', network[module_id]['caption'])
        for number in json.loads(m['sources']):
            title, _, url = sources[number - 1]
            book.link(f'[{number}] {title}', url)

    # Capstone (course 2.3).
    if part.get('capstone'):
        c = data['CAPSTONE']
        book.page(f'COURSE {n} / CAPSTONE  /  ABOUT 4 HOURS')
        book.heading('Authorization to Operate package capstone', 'capstone')
        book.para('lead', 'Assemble and defend the fictional enclave’s authorization package. Show where the evidence supports a conclusion, where it does not, and what happens next.')
        book.para('h2', 'Your submission')
        book.numbered(c['deliverables'])
        book.para('h2', c['scopeTitle'])
        book.rich('body', [(c['scopeControls'], True)])
        for paragraph in c['scopeText']:
            book.para('body', paragraph)
        book.para('h2', 'Scoring rubric')
        book.table(['CRITERION', 'POINTS', 'WHAT THE REVIEWER LOOKS FOR'], c['rubric'])
        book.add(book.clone('gap'))
        book.para('body', c['rubricNote'])
        book.para('h2', 'The review sequence')
        book.bullets([f'{label} — {title}: {text}' for label, title, text in c['sequence']])
        book.para('h2', 'Reviewer challenges')
        for question, _ in c['challenges']:
            book.rich('body', [(question, True)])
            book.lines(1)

    # Evidence starters.
    book.page(f'COURSE {n} / EVIDENCE STARTERS')
    book.heading('Evidence starters', 'starters')
    book.para('lead', 'Blank starters for the practice artifacts this course produces. Fill them from your own system. The interactive course shows a completed fictional example of each.')
    for a in ours:
        book.para('h2', a['title'])
        book.rich('body', [(a['kind'] + '  ', True), ('Owner: ' + a['owner'] + '. ' + a['purpose'], False)])
        if a.get('fields'):
            book.record([f'{name} — {guidance}' for name, guidance, _ in a['fields']], ('FIELD', 'YOUR ENTRY'))
        else:
            book.table([c.upper() for c in a['columns']], [a['template'], [''] * len(a['columns']), [''] * len(a['columns'])])
        book.add(book.clone('gap'))
        book.para('body', a['note'])

    # Answers.
    book.page(f'COURSE {n} / ANSWERS')
    book.heading('Knowledge check answers', 'answers')
    for module_id in part['modules']:
        question, answers, correct, explanation = learning[module_id]['quiz']
        book.rich('body', [(f'{module_id}  {question}', True)])
        book.rich('body', [(f'{chr(65 + correct)}. {answers[correct]}  ', True), (explanation, False)])
    if part.get('capstone'):
        book.para('h2', 'Reviewer challenge guidance')
        for question, guidance in data['CAPSTONE']['challenges']:
            book.rich('body', [(question + '  ', True), (guidance, False)])

    # Sources.
    book.page(f'COURSE {n} / SOURCES')
    book.heading('Sources', 'sources')
    book.para('lead', 'Choose the applicable authority and record the adopted versions before using a template. Module reference numbers correspond to these documents.')
    for number, (title, description, url) in enumerate(sources, 1):
        book.link(f'[{number}] {title}', url)
        book.para('body', description)

    # Close out.
    book.page(f'COURSE {n} / CLOSE OUT')
    book.heading('Course review and sign-off', 'signoff')
    book.para('lead', 'Before moving on, confirm each module left its outputs behind — and that what remains open is written down.')
    book.para('h2', 'Module completion')
    rows = [[f'{i}  {modules[i]["title"]}', '☐ yes', ''] for i in part['modules']]
    if part.get('capstone'):
        rows.append(['Capstone  Authorization to Operate package', '☐ yes', ''])
    book.table(['MODULE', 'OUTPUTS FILED', 'DATE'], rows)
    book.para('h2', 'Open items carried forward')
    book.lines(3)
    book.para('h2', 'Next in the learning path')
    book.para('body', NEXT[n])
    book.callout('KEEP IT HONEST', 'Course completion records learning activity. It is not a system authorization, an assessment result, or an approval by any authorizing official. Exercise records are fictional.')
    book.finish(course, part, path)


def export(course: dict, part: dict, data: dict, docx: Path):
    folder = docx.parent
    with tempfile.TemporaryDirectory() as home, tempfile.TemporaryDirectory() as work:
        subprocess.run(['soffice', '--headless', '--convert-to', 'pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}', '--outdir', work, str(docx)],
                       check=True, capture_output=True, env={**os.environ, 'HOME': home})
        pdf = Path(work) / docx.with_suffix('.pdf').name
        info = subprocess.run(['pdfinfo', str(pdf)], check=True, capture_output=True, text=True).stdout
        pages = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
        # Layout check: no blank pages, and no heading stranded at the bottom of a page.
        text = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], check=True, capture_output=True, text=True).stdout
        for number, page_text in enumerate(text.split('\f')[:-1], 1):
            lines = [line.strip() for line in page_text.splitlines() if line.strip() and COPYRIGHT not in line]
            if len(' '.join(lines)) < 60:
                print(f'  ! {pdf.name}: page {number} is nearly blank')
        subprocess.run(['pdftoppm', '-f', '1', '-l', '1', '-png', '-r', '150', str(pdf), f'{work}/cover'], check=True)
        from PIL import Image
        image = next(Path(work).glob('cover*.png'))
        Image.open(image).convert('RGB').resize((612, 792), Image.LANCZOS).save(folder / 'workbook-cover.webp', 'WEBP', quality=82)
    return pages


def main():
    everything = '--all' in sys.argv[1:]
    data = course_data()
    videos_path = ROOT / 'content/videos.json'
    library = json.loads(videos_path.read_text(encoding='utf-8'))
    for part in data['CATALOG_PARTS']:
        course = next(c for c in library['courses'] if c['id'] == part['id'])
        folder = ROOT / 'public/grc-rmf-training' / part['folder']
        folder.mkdir(parents=True, exist_ok=True)
        docx = folder / Path(course['training']['word']).name
        write_workbook(data, course, part, docx)
        if everything:
            course['training']['pages'] = export(course, part, data, docx)
            print(f'{course["number"]} {course["title"]}: {course["training"]["pages"]} pages')
        else:
            print(f'{course["number"]} {course["title"]}: {docx.relative_to(ROOT)}')
    if everything:
        videos_path.write_text(json.dumps(library, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
