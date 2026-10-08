#!/usr/bin/env python3
"""Keep the configuration-course companion workbooks in step with the course content.

Each workbook, public/training/<id>/SecureByDesign-<id>-Workbook.docx, is edited in
place from two sources:

  content/configuration-courses.json  lessons (title, minutes, summary, objectives,
                                      steps, command, check, evidence, quizzes, recap,
                                      sources, next), prerequisites, labNote, sources
  content/videos.json -> courses      number, title, subtitle, description, outcomes,
                                      systems, tags, training.materialsEdition and
                                      training.updated

Text is replaced inside the existing runs, so every paragraph keeps its formatting.
When a list changes length (objectives, steps, command lines, prerequisites,
outcomes, sources, table rows) the script deep-copies or removes paragraphs of the
same kind, so styles, numbering and spacing carry over. Source lines stay working
hyperlinks. The script also sets the core document properties and the logo alt text.

The lesson count must not change: adding or removing a lesson needs a regenerated
workbook, and the script stops with an error instead of guessing. It also stops if a
workbook no longer has the layout described in map_* below.

Usage, from the repository root (needs python-docx and lxml):

  python3 scripts/sync-workbooks.py                     update every workbook
  python3 scripts/sync-workbooks.py dns-configuration   update selected courses
  python3 scripts/sync-workbooks.py --check             report text drift, write nothing
  python3 scripts/sync-workbooks.py --courses OLD.json --catalog OLD-videos.json --dir COPY

Then export each DOCX to a tagged PDF with LibreOffice, check the pages (no blank pages,
no heading left at the bottom of a page: see BREAK_BEFORE), and update training.pages in
content/videos.json and the page counts in content/training-resources.json if they changed:

  soffice --headless --convert-to \
    'pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}' \
    --outdir public/training/<id> public/training/<id>/SecureByDesign-<id>-Workbook.docx
"""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import difflib
import json
import re
import sys
from pathlib import Path

from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parent.parent

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
PIC_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
R_ID = "{%s}id" % R_NS

BRAND = "Secure By Design"
LOGO_ALT = "Secure By Design logo"
FOOTER_EDITION = re.compile(r"Course \S+ · Materials edition \S+")

LESSON_BLOCKS = [
    "In this lesson you will",
    "Follow the build",
    "Check your result",
    "Your record",
    "Think it through",
]
BEFORE_BLOCKS = ["Prerequisites", "What this course builds", "Systems in scope"]
CLOSE_BLOCKS = ["Lesson completion", "Open items carried forward", "Next in the learning path"]

# Lesson headings that start a new page. LibreOffice ignores keep-with-next when the
# paragraph after a heading moves to the next page whole (orphan control), which can
# strand the heading at the bottom of a PDF page; a "Think it through" question can also
# end up split from its answer lines. After exporting, check the PDFs; add
# (course id, lesson id, heading) here for such a page, and drop entries a later content
# edit no longer needs. Headings not listed get no forced break.
BREAK_BEFORE = {
    ("tiered-admin", "admin-hosts", "Your record"),
    ("tiered-admin", "logon-restrictions", "Think it through"),
}
# Paragraph properties that come before w:pageBreakBefore in w:pPr (schema order).
PPR_BEFORE_PAGE_BREAK = ("pStyle", "keepNext", "keepLines")


class LayoutError(Exception):
    """The workbook does not have the layout this script maps."""


def w(tag: str) -> str:
    return "{%s}%s" % (W_NS, tag)


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise LayoutError(message)


# --- reading paragraphs -------------------------------------------------------------


def para_text(el) -> str:
    return "".join(t.text or "" for t in el.iter(w("t")))


def text_runs(p) -> list:
    """Runs (direct or inside a hyperlink) that hold text, in document order."""
    return [r for r in p.iter(w("r")) if r.find(w("t")) is not None]


def p_style(el) -> str | None:
    if el.tag != w("p"):
        return None
    ps = el.find(w("pPr") + "/" + w("pStyle"))
    return ps.get(w("val")) if ps is not None else None


def is_heading(el, level: int) -> bool:
    return p_style(el) == "Heading%d" % level


def is_list_item(el) -> bool:
    return p_style(el) == "ListParagraph" and el.find(w("pPr") + "/" + w("numPr")) is not None


def run_font(r) -> str | None:
    fonts = r.find(w("rPr") + "/" + w("rFonts"))
    return fonts.get(w("ascii")) if fonts is not None else None


def is_code(el) -> bool:
    if el.tag != w("p"):
        return False
    runs = text_runs(el)
    return len(runs) == 1 and run_font(runs[0]) == "Consolas"


def callout_label(el) -> str | None:
    """'WHY THIS MATTERS', 'REMEMBER', ... for a labelled two-run callout paragraph."""
    if el.tag != w("p"):
        return None
    runs = text_runs(el)
    if len(runs) != 2 or runs[0].find(w("rPr") + "/" + w("b")) is None:
        return None
    label = para_text(runs[0]).strip()
    return label if label and label == label.upper() else None


def link_of(el):
    """The external hyperlink element of a source line, or None."""
    if el.tag != w("p"):
        return None
    hl = el.find(w("hyperlink"))
    return hl if hl is not None and hl.get(R_ID) else None


def anchor_link_of(el):
    """The internal (bookmark) hyperlink of a table-of-contents entry, or None."""
    if el.tag != w("p"):
        return None
    hl = el.find(w("hyperlink"))
    return hl if hl is not None and hl.get(w("anchor")) else None


def is_answer_line(el) -> bool:
    return (
        el.tag == w("p")
        and el.find(w("pPr") + "/" + w("pBdr") + "/" + w("bottom")) is not None
        and para_text(el).strip() == ""
    )


def is_page_break(el) -> bool:
    if el.tag != w("p"):
        return False
    breaks = [b for b in el.iter(w("br")) if b.get(w("type")) == "page"]
    return bool(breaks) and para_text(el).strip() == ""


# --- writing paragraphs -------------------------------------------------------------


def set_run_text(r, text: str) -> None:
    ts = r.findall(w("t"))
    if ts[0].text != text:
        ts[0].text = text
    ts[0].set(XML_SPACE, "preserve")
    for extra in ts[1:]:
        r.remove(extra)


def set_text(p, text: str) -> None:
    runs = text_runs(p)
    expect(len(runs) == 1, "expected one text run in %r" % para_text(p)[:60])
    set_run_text(runs[0], text)


def set_labelled(p, label: str, text: str) -> None:
    expect(callout_label(p) == label, "expected a %s callout, found %r" % (label, para_text(p)[:60]))
    set_run_text(text_runs(p)[1], text)


def resize(items: list, count: int, what: str, insert_before=None) -> list:
    """Clone the last element (or remove from the end) until there are `count`.

    Clones are inserted after the last element, or before `insert_before`."""
    expect(bool(items), "no %s to use as a template" % what)
    expect(count > 0, "%s cannot be empty: the workbook would lose its template" % what)
    items = list(items)
    while len(items) < count:
        clone = copy.deepcopy(items[-1])
        if insert_before is not None:
            insert_before.addprevious(clone)
        else:
            items[-1].addnext(clone)
        items.append(clone)
    while len(items) > count:
        el = items.pop()
        el.getparent().remove(el)
    return items


def set_page_break_before(p, wanted: bool) -> None:
    ppr = p.find(w("pPr"))
    existing = ppr.find(w("pageBreakBefore"))
    if wanted and existing is None:
        anchor = None
        for child in ppr:
            if child.tag in {w(t) for t in PPR_BEFORE_PAGE_BREAK}:
                anchor = child
        element = ppr.makeelement(w("pageBreakBefore"), {})
        if anchor is None:
            ppr.insert(0, element)
        else:
            anchor.addnext(element)
    elif not wanted and existing is not None:
        ppr.remove(existing)


def sync_paragraphs(paras: list, texts: list, what: str) -> None:
    for p, text in zip(resize(paras, len(texts), what), texts):
        set_text(p, text)


def sync_code(paras: list, lines: list) -> None:
    """Command lines: one shaded paragraph per line. The last line carries the space
    after the block, so lines are added or removed in front of it."""
    expect(bool(paras) and bool(lines), "a lesson needs at least one command line")
    last, middle = paras[-1], paras[:-1]
    need = len(lines) - 1
    if need > len(middle) and not middle:
        template = copy.deepcopy(last)
        spacing = template.find(w("pPr") + "/" + w("spacing"))
        if spacing is not None:
            spacing.set(w("after"), "0")
        last.addprevious(template)
        middle = [template]
    if need > 0:
        middle = resize(middle, need, "command lines", insert_before=last)
    else:
        for el in middle:
            el.getparent().remove(el)
        middle = []
    for p, text in zip(middle + [last], lines):
        set_text(p, text)


def sync_rows(tbl, texts: list, what: str) -> None:
    """Set the first cell of each body row (after the header row) to `texts`."""
    rows = [tr for tr in tbl.findall(w("tr"))]
    expect(len(rows) >= 2, "%s table has no body rows" % what)
    for tr, text in zip(resize(rows[1:], len(texts), what + " rows"), texts):
        first_cell = tr.find(w("tc"))
        set_text(first_cell.find(w("p")), text)


# --- the workbook -------------------------------------------------------------------


class Workbook:
    def __init__(self, path: Path):
        self.path = path
        self.doc = Document(str(path))
        self.part = self.doc.part
        self.body = self.doc.element.body

    def link_refs(self, rid: str) -> int:
        return sum(1 for h in self.body.iter(w("hyperlink")) if h.get(R_ID) == rid)

    def set_link(self, p, title: str, url: str) -> None:
        hl = link_of(p)
        expect(hl is not None, "expected a source link, found %r" % para_text(p)[:60])
        rid = hl.get(R_ID)
        rel = self.part.rels.get(rid)
        expect(rel is not None and rel.is_external, "source link %s has no external target" % rid)
        if rel.target_ref != url:
            if self.link_refs(rid) > 1:  # a freshly cloned line still shares its template's target
                new_rid = self.part.rels._next_rId
                self.part.rels.add_relationship(RT.HYPERLINK, url, new_rid, is_external=True)
                hl.set(R_ID, new_rid)
            else:
                rel._target = url
        runs = text_runs(hl)
        expect(len(runs) == 1, "expected one text run in source link %r" % para_text(p)[:60])
        set_run_text(runs[0], title)

    def drop_unused_links(self) -> None:
        used = set()
        for el in self.doc.element.iter():
            for key, value in el.attrib.items():
                if key.startswith("{%s}" % R_NS):
                    used.add(value)
        for rid, rel in list(self.part.rels.items()):
            if rel.reltype == RT.HYPERLINK and rel.is_external and rid not in used:
                del self.part.rels[rid]

    def footers(self) -> list:
        return [rel.target_part.element for rel in self.part.rels.values() if rel.reltype == RT.FOOTER]

    def sections(self) -> list:
        """Body content split at the page-break paragraphs (which are left untouched)."""
        sections: list = [[]]
        for el in self.body:
            if el.tag == w("sectPr"):
                continue
            if is_page_break(el):
                sections.append([])
            else:
                sections[-1].append(el)
        return sections


def split_by_h2(section: list):
    head, blocks = [], []
    for el in section:
        if is_heading(el, 2):
            blocks.append((para_text(el), el, []))
        elif blocks:
            blocks[-1][2].append(el)
        else:
            head.append(el)
    return head, blocks


def number_text(value) -> str:
    return str(int(value)) if float(value).is_integer() else str(value)


# --- section mappings -------------------------------------------------------------


def map_cover(section: list, cid: str, entry: dict) -> None:
    expect(len(section) == 10, "cover: expected 10 paragraphs, found %d" % len(section))
    logo, brand, _tagline, eyebrow, title, subtitle, description, edition, updated, _name = section
    expect(logo.find(".//" + w("drawing")) is not None, "cover: the first paragraph should hold the logo")
    expect(para_text(brand) == BRAND, "cover: brand line not found")
    expect(para_text(eyebrow).startswith("COURSE "), "cover: course line not found")
    expect(para_text(edition).startswith("MATERIALS EDITION "), "cover: edition line not found")
    expect(para_text(updated).startswith("Updated "), "cover: updated line not found")
    number = entry["number"]
    training = entry["training"]
    set_text(eyebrow, "COURSE %s    /    COMPANION WORKBOOK" % number)
    set_text(title, entry["title"])
    set_text(subtitle, entry["subtitle"])
    set_text(description, entry["description"])
    set_text(edition, "MATERIALS EDITION %s    /    COURSE %s" % (training["materialsEdition"], number))
    set_text(updated, "Updated %s  ·  sbd-%s" % (training["updated"], cid))
    for doc_pr in logo.iter("{%s}docPr" % WP_NS):
        if not doc_pr.get("descr"):
            doc_pr.set("descr", LOGO_ALT)
    for nv_pr in logo.iter("{%s}cNvPr" % PIC_NS):
        if not nv_pr.get("descr"):
            nv_pr.set("descr", LOGO_ALT)


def map_contents(section: list, lessons: list) -> None:
    expect(len(section) >= 5, "contents: section too short")
    _eyebrow, h1, _intro, *entries, how = section
    expect(is_heading(h1, 1) and para_text(h1) == "Table of contents", "contents: heading not found")
    expect(callout_label(how) == "HOW TO USE IT", "contents: HOW TO USE IT callout not found")
    expect(all(anchor_link_of(p) is not None for p in entries), "contents: unexpected paragraph among entries")
    expect(len(entries) == len(lessons) + 2, "contents: %d entries for %d lessons" % (len(entries), len(lessons)))
    for n, (p, lesson) in enumerate(zip(entries[1:-1], lessons), 1):
        set_text(p, "%02d  %s" % (n, lesson["title"]))
        anchor_link_of(p).set(w("anchor"), "lesson-" + lesson["id"])


def map_before(section: list, course: dict, entry: dict) -> None:
    head, blocks = split_by_h2(section)
    expect(len(head) == 3, "before you start: expected eyebrow, heading and lab note")
    eyebrow, h1, lab_note = head
    expect(para_text(h1) == "Before you start", "before you start: heading not found")
    expect([b[0] for b in blocks] == BEFORE_BLOCKS, "before you start: sections are %r" % [b[0] for b in blocks])
    set_text(eyebrow, "COURSE %s / PREREQUISITES" % entry["number"])
    set_text(lab_note, course["labNote"])
    prerequisites, outcomes, systems = (b[2] for b in blocks)
    expect(all(is_list_item(p) for p in prerequisites), "before you start: prerequisites are not a list")
    expect(all(is_list_item(p) for p in outcomes), "before you start: outcomes are not a list")
    expect(len(systems) == 1 and systems[0].tag == w("tbl"), "before you start: systems table not found")
    sync_paragraphs(prerequisites, course["prerequisites"], "prerequisites")
    sync_paragraphs(outcomes, entry["outcomes"], "outcomes")
    sync_rows(systems[0], ["%s — name, address, OS build" % s for s in entry["systems"]], "systems")


def map_lesson(wb: Workbook, section: list, n: int, lesson: dict, course: dict) -> None:
    where = "lesson %02d" % n
    sources = course["sources"]
    head, blocks = split_by_h2(section)
    expect(len(head) == 3, "%s: expected eyebrow, heading and WHY THIS MATTERS" % where)
    eyebrow, h1, why = head
    expect(para_text(eyebrow).startswith("LESSON "), "%s: eyebrow not found" % where)
    expect(is_heading(h1, 1), "%s: heading not found" % where)
    expect([b[0] for b in blocks] == LESSON_BLOCKS, "%s: sections are %r" % (where, [b[0] for b in blocks]))
    objectives, steps, check, record, think = (b[2] for b in blocks)

    expect(all(is_list_item(p) for p in objectives), "%s: objectives are not a list" % where)
    expect(all(is_list_item(p) for p in steps), "%s: steps are not a list" % where)
    expect(len(check) >= 2 and all(is_code(p) for p in check[:-1]), "%s: command lines not found" % where)
    expect(callout_label(check[-1]) == "WHAT SUCCESS LOOKS LIKE", "%s: success callout not found" % where)
    expect(len(record) == 2 and record[1].tag == w("tbl"), "%s: evidence and record table not found" % where)
    expect(para_text(record[0]).startswith("Evidence to keep: "), "%s: evidence line not found" % where)
    remember = [i for i, el in enumerate(think) if callout_label(el) == "REMEMBER"]
    expect(len(remember) == 1, "%s: REMEMBER callout not found" % where)
    question, answer_lines = think[0], think[1 : remember[0]]
    expect(all(is_answer_line(el) or para_text(el).strip() == "" for el in answer_lines), "%s: answer lines" % where)
    links = think[remember[0] + 1 :]
    expect(bool(links) and all(link_of(p) is not None for p in links), "%s: source links not found" % where)

    for name, heading, _content in blocks:
        set_page_break_before(heading, (course["id"], lesson["id"], name) in BREAK_BEFORE)
    set_text(eyebrow, "LESSON %02d  /  ABOUT %s MIN" % (n, number_text(lesson["minutes"])))
    set_text(h1, lesson["title"])
    for bookmark in h1.iter(w("bookmarkStart")):
        bookmark.set(w("name"), "lesson-" + lesson["id"])
    set_labelled(why, "WHY THIS MATTERS", lesson["summary"])
    sync_paragraphs(objectives, lesson["objectives"], "%s objectives" % where)
    sync_paragraphs(steps, lesson["steps"], "%s steps" % where)
    sync_code(check[:-1], lesson["command"].split("\n"))
    set_labelled(check[-1], "WHAT SUCCESS LOOKS LIKE", lesson["check"])
    set_text(record[0], "Evidence to keep: " + lesson["evidence"])
    set_text(question, lesson["quizzes"][0]["question"])
    set_labelled(think[remember[0]], "REMEMBER", "  ".join(lesson["recap"]))
    missing = [sid for sid in lesson["sources"] if sid not in {s["id"] for s in sources}]
    expect(not missing, "%s: unknown source ids %r" % (where, missing))
    # Same order as the guide (app/videos/configuration-guide.tsx): course order.
    lesson_sources = [s for s in sources if s["id"] in lesson["sources"]]
    for p, source in zip(resize(links, len(lesson_sources), "%s sources" % where), lesson_sources):
        wb.set_link(p, source["title"], source["url"])


def map_close(section: list, course: dict, entry: dict) -> None:
    head, blocks = split_by_h2(section)
    expect(len(head) == 3, "close-out: expected eyebrow, heading and introduction")
    eyebrow, h1, _intro = head
    expect(para_text(h1) == "Course review and sign-off", "close-out: heading not found")
    expect([b[0] for b in blocks] == CLOSE_BLOCKS, "close-out: sections are %r" % [b[0] for b in blocks])
    completion, _open_items, next_block = (b[2] for b in blocks)
    expect(len(completion) == 1 and completion[0].tag == w("tbl"), "close-out: completion table not found")
    expect(len(next_block) == 2 and callout_label(next_block[1]) == "KEEP IT HONEST", "close-out: next text not found")
    lessons = course["lessons"]
    set_text(eyebrow, "COURSE %s / CLOSE OUT" % entry["number"])
    sync_rows(completion[0], ["%02d  %s" % (n, l["title"]) for n, l in enumerate(lessons, 1)], "completion")
    set_text(next_block[0], lessons[-1]["next"])


def map_footer(wb: Workbook, entry: dict) -> None:
    replacement = "Course %s · Materials edition %s" % (entry["number"], entry["training"]["materialsEdition"])
    found = 0
    for footer in wb.footers():
        for t in footer.iter(w("t")):
            if t.text and FOOTER_EDITION.search(t.text):
                t.text = FOOTER_EDITION.sub(replacement, t.text)
                found += 1
    expect(found == 1, "footer: expected one course/edition line, found %d" % found)


def map_properties(wb: Workbook, entry: dict) -> None:
    props = wb.doc.core_properties
    updated = dt.datetime.strptime(entry["training"]["updated"], "%d %B %Y")
    stamp = updated.replace(hour=12)  # midday UTC keeps the calendar date in most time zones
    props.title = "%s — companion workbook" % entry["title"]
    props.subject = entry["subtitle"]
    props.author = BRAND
    props.last_modified_by = BRAND
    props.keywords = ", ".join([BRAND, "companion workbook", "Course " + entry["number"]] + entry.get("tags", []))
    props.created = stamp
    props.modified = stamp


# --- text extraction (for --check and reports) ---------------------------------------


def extract_text(wb: Workbook) -> list:
    lines = []
    for el in wb.body:
        if el.tag == w("p"):
            line = para_text(el)
            hl = link_of(el)
            if hl is not None:
                line += "  <%s>" % wb.part.rels[hl.get(R_ID)].target_ref
            lines.append(line)
        elif el.tag == w("tbl"):
            for tr in el.iter(w("tr")):
                cells = [" / ".join(para_text(p) for p in tc.findall(w("p"))) for tc in tr.findall(w("tc"))]
                lines.append(" | ".join(cells))
    for footer in wb.footers():
        lines.append("[footer] " + para_text(footer))
    return lines


def sync_workbook(path: Path, course: dict, entry: dict) -> tuple:
    wb = Workbook(path)
    before = extract_text(wb)
    lessons = course["lessons"]
    sections = wb.sections()
    expect(
        len(sections) == len(lessons) + 4,
        "the workbook has %d lesson pages but the course has %d lessons; regenerate it"
        % (len(sections) - 4, len(lessons)),
    )
    map_cover(sections[0], course["id"], entry)
    map_contents(sections[1], lessons)
    map_before(sections[2], course, entry)
    for n, (section, lesson) in enumerate(zip(sections[3:-1], lessons), 1):
        map_lesson(wb, section, n, lesson, course)
    map_close(sections[-1], course, entry)
    map_footer(wb, entry)
    map_properties(wb, entry)
    wb.drop_unused_links()
    return wb, before, extract_text(wb)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("ids", nargs="*", help="course ids to update (default: every configuration course)")
    parser.add_argument("--courses", type=Path, default=ROOT / "content" / "configuration-courses.json")
    parser.add_argument("--catalog", type=Path, default=ROOT / "content" / "videos.json")
    parser.add_argument("--dir", type=Path, default=ROOT / "public" / "training",
                        help="folder holding <id>/SecureByDesign-<id>-Workbook.docx")
    parser.add_argument("--check", action="store_true",
                        help="write nothing; exit 1 if any workbook text differs from the content")
    parser.add_argument("--diff", action="store_true", help="print each workbook's text diff")
    args = parser.parse_args(argv)

    courses = {c["id"]: c for c in json.loads(args.courses.read_text(encoding="utf-8"))}
    catalog = {c["id"]: c for c in json.loads(args.catalog.read_text(encoding="utf-8"))["courses"]}
    ids = args.ids or list(courses)
    unknown = [i for i in ids if i not in courses or i not in catalog]
    if unknown:
        parser.error("unknown course ids: %s" % ", ".join(unknown))

    drift = False
    for cid in ids:
        path = args.dir / cid / ("SecureByDesign-%s-Workbook.docx" % cid)
        try:
            wb, before, after = sync_workbook(path, courses[cid], catalog[cid])
        except LayoutError as error:
            print("%s: %s" % (cid, error), file=sys.stderr)
            return 2
        diff = list(difflib.unified_diff(before, after, "before", "after", lineterm="", n=0))
        changed = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
        removed = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))
        status = "up to date" if not diff else "%d lines changed or added, %d replaced or removed" % (changed, removed)
        print("%s: %s" % (cid, status))
        if args.diff and diff:
            print("\n".join(diff))
        drift = drift or bool(diff)
        if not args.check:
            wb.doc.save(str(path))
    return 1 if args.check and drift else 0


if __name__ == "__main__":
    sys.exit(main())
