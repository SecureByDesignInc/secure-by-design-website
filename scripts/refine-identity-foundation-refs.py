#!/usr/bin/env python3
"""Second pass of the course 1.1 merge (owner direction, 20 October 2026), kept for the record.

compose-identity-foundation.py turned every reference to the former courses 1.1–1.8 in the later courses into
"course 1.1", so some sentences named course 1.1 two or three times. This pass rewrites those references from the
original text instead: within one text, the first reference names the course and its part ("course 1.1, part 7");
later references name only the part ("part 7", "part 6's root certificate"). "Complete courses 1.1–1.8" reads
"Complete course 1.1". It only replaces text that the first pass produced unchanged, so later edits are kept.
"""
import json, re, sys
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('compose', ROOT / 'scripts/compose-identity-foundation.py')
compose = importlib.util.module_from_spec(spec); spec.loader.exec_module(compose)
COURSE_REF, split_nums, RENUMBER = compose.COURSE_REF, compose.split_nums, compose.RENUMBER

MIXED_SETS_SEEN = True

def refine(text):
    seen = False
    def repl(m):
        nonlocal seen
        cap, plural, gap, body = m.groups()
        nums, seps = split_nums(body)
        olds = [int(n.split('.')[1]) for n in nums]
        before = text[max(0, m.start() - 12):m.start()]
        after = text[m.end():m.end() + 2]
        possessive = after in ("'s", '’s')
        attributive = bool(re.search(r'\b[Tt]he $', before))
        complete = bool(re.search(r'\b[Cc]omplete $', before))
        if not all(n <= 8 for n in olds):
            if any(n <= 8 for n in olds) and MIXED_SETS_SEEN: seen = True  # "courses 1.1–1.2" already names course 1.1
            return compose.outside(m.group(0))  # mixed with later courses: the first pass's wording
        if len(olds) == 1:
            parts = f'part {olds[0]}'
        else:
            out = str(olds[0])
            for s, n in zip(seps, olds[1:]): out += s + n.__str__()
            parts = f'parts {out}'
        if complete or olds == list(range(1, 9)):
            seen = True
            return f'{cap}ourse{gap if gap == " (" else " "}1.1'
        if not seen:
            seen = True
            if possessive or attributive:
                return f'{cap}ourse{gap if gap == " (" else " "}1.1'
            return f'{cap}ourse{gap if gap == " (" else " "}1.1, {parts}'
        word = parts if cap == 'c' else parts[0].upper() + parts[1:]
        return f'({word}' if gap == ' (' else word
    return COURSE_REF.sub(repl, text)

def previous(orig):
    """This pass's first wording (before a mixed range like "courses 1.1–1.2" counted as naming course 1.1)."""
    global MIXED_SETS_SEEN
    MIXED_SETS_SEEN = False
    try: return refine(orig)
    finally: MIXED_SETS_SEEN = True

def pair(orig, cur, stats):
    """Walk the original and current structures together; replace strings the first pass produced unchanged."""
    if isinstance(orig, str) and isinstance(cur, str):
        if COURSE_REF.search(orig) and (compose.outside(orig) == cur or previous(orig) == cur):
            new = refine(orig)
            if new != cur: stats['changed'] += 1
            return new
        if COURSE_REF.search(orig) and compose.outside(orig) != cur: stats['kept'] += 1
        return cur
    if isinstance(orig, list) and isinstance(cur, list) and len(orig) == len(cur):
        return [pair(o, c, stats) for o, c in zip(orig, cur)]
    if isinstance(orig, dict) and isinstance(cur, dict):
        return {k: (pair(orig[k], v, stats) if k in orig else v) for k, v in cur.items()}
    return cur

def main():
    orig_root = Path(sys.argv[1])  # a copy of the content before the merge
    stats = {'changed': 0, 'kept': 0}
    cur = json.loads((ROOT / 'content/configuration-courses.json').read_text())
    orig = {c['id']: c for c in json.loads((orig_root / 'content/configuration-courses.json').read_text())}
    cur = [pair(orig[c['id']], c, stats) if c['id'] in orig else c for c in cur]
    (ROOT / 'content/configuration-courses.json').write_text(json.dumps(cur, ensure_ascii=False, indent=2) + '\n')
    for path in (orig_root / 'content/course-guides').glob('*.json'):
        target = ROOT / 'content/course-guides' / path.name
        if not target.exists(): continue
        target.write_text(json.dumps(pair(json.loads(path.read_text()), json.loads(target.read_text()), stats), ensure_ascii=False, indent=2) + '\n')
    lib = json.loads((ROOT / 'content/videos.json').read_text())
    olib = json.loads((orig_root / 'content/videos.json').read_text())
    for key in ('courses', 'references', 'categories'):
        by = {e['id']: e for e in olib.get(key, [])}
        lib[key] = [pair(by[e['id']], e, stats) if e['id'] in by else e for e in lib.get(key, [])]
    (ROOT / 'content/videos.json').write_text(json.dumps(lib, ensure_ascii=False, indent=2) + '\n')
    for rel in ['public/grc-rmf-training/rmf/catalog-data.js', 'public/grc-rmf-training/rmf/learning-data.js']:
        o = (orig_root / rel).read_text(); c = (ROOT / rel).read_text()
        literal = r'"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|//[^\\n]*'
        if compose.outside(o) == c or re.sub(literal, lambda m: previous(m.group(0)), o) == c:
            # refine each string literal on its own, so "first mention" resets per text
            # each string literal and each comment line is its own text, so "first mention" resets for each
            new = re.sub(r'"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|//[^\n]*', lambda m: refine(m.group(0)), o)
            (ROOT / rel).write_text(new)
            stats['changed'] += int(new != c)
    print(stats)

if __name__ == '__main__':
    main()
