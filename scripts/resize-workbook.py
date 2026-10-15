#!/usr/bin/env python3
"""Give a companion workbook the number of lesson pages its course has.

sync-workbooks.py fills a workbook from the course content but refuses to change the
lesson count. When a course gains or loses lessons — or a new course starts from a
sibling's workbook — run this first, then sync-workbooks.py:

  python3 scripts/resize-workbook.py public/training/<id>/SecureByDesign-<id>-Workbook.docx <lessons>
  python3 scripts/resize-workbook.py --from <template.docx> <new.docx> <lessons>

Lesson pages are added by deep-copying the last lesson page (with the page break that
follows it) and removed from the end, so styles, numbering and spacing carry over. The
table of contents gains or loses entries the same way. Bookmark ids are renumbered so
every bookmark stays unique; sync-workbooks.py then sets every text, link and bookmark
name from the course content.
"""

from __future__ import annotations

import argparse
import copy
import importlib.util
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("sync_workbooks", HERE / "sync-workbooks.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
w = sync.w


def body_sections(body) -> list:
    """[(elements, page_break_after or None)] for the body, split at page-break paragraphs."""
    sections, current = [], []
    for el in body:
        if el.tag == w("sectPr"):
            continue
        if sync.is_page_break(el):
            sections.append((current, el))
            current = []
        else:
            current.append(el)
    sections.append((current, None))
    return sections


def resize(path: Path, lessons: int) -> int:
    wb = sync.Workbook(path)
    body = wb.body
    sections = body_sections(body)
    have = len(sections) - 4
    sync.expect(have >= 1, "the workbook has no lesson pages")
    sync.expect(lessons >= 1, "a course needs at least one lesson")
    # Lesson pages are sections[3 : 3 + have]; the close-out page follows them.
    while have < lessons:
        last_elements, last_break = sections[3 + have - 1]
        close_elements, _ = sections[3 + have]
        anchor = close_elements[0]
        for el in last_elements:
            anchor.addprevious(copy.deepcopy(el))
        anchor.addprevious(copy.deepcopy(last_break))
        sections = body_sections(body)
        have += 1
    while have > lessons:
        elements, page_break = sections[3 + have - 1]
        for el in elements:
            body.remove(el)
        body.remove(page_break)
        sections = body_sections(body)
        have -= 1
    # Table of contents: introduction entry, one per lesson, close-out entry.
    contents = sections[1][0]
    entries = [p for p in contents if sync.anchor_link_of(p) is not None]
    sync.expect(len(entries) >= 3, "table of contents entries not found")
    while len(entries) < lessons + 2:
        clone = copy.deepcopy(entries[-2])
        entries[-2].addnext(clone)
        entries.insert(len(entries) - 1, clone)
    while len(entries) > lessons + 2:
        victim = entries.pop(-2)
        victim.getparent().remove(victim)
    # Unique bookmark ids (names are set by sync-workbooks.py).
    starts = list(body.iter(w("bookmarkStart")))
    ends = list(body.iter(w("bookmarkEnd")))
    mapping = {}
    for n, start in enumerate(starts, 1):
        old = start.get(w("id"))
        start.set(w("id"), str(n))
        mapping.setdefault(old, []).append(str(n))
    used = {}
    for end in ends:
        old = end.get(w("id"))
        options = mapping.get(old, [])
        index = used.get(old, 0)
        if index < len(options):
            end.set(w("id"), options[index])
            used[old] = index + 1
    wb.doc.save(str(path))
    return have


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--from", dest="template", type=Path, help="copy this workbook first")
    parser.add_argument("path", type=Path)
    parser.add_argument("lessons", type=int)
    args = parser.parse_args(argv)
    if args.template:
        args.path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(args.template, args.path)
    try:
        count = resize(args.path, args.lessons)
    except sync.LayoutError as error:
        print("%s: %s" % (args.path, error), file=sys.stderr)
        return 2
    print("%s: %d lesson pages" % (args.path, count))
    return 0


if __name__ == "__main__":
    sys.exit(main())
