#!/usr/bin/env python3
"""Build each Training Library tile's one download (owner request, 9 October 2026).

Configuration courses: public/training/<id>/SecureByDesign-<id>-Learning-Package.zip holds
START-HERE.txt, the workbook (PDF and Word), configuration-checklist.md, and
Verification-Commands.txt. Run `node scripts/prepare-checklists.mjs` first: it writes the three
text files from content/configuration-courses.json and content/videos.json.

Course 1.1: writes Verification-Commands.txt from public/training/dc01-dc02/lesson.json, then
refreshes package-manifest.json and SecureByDesign-DC01-DC02-Learning-Package.zip, the offline
copy of the interactive guide with its workbook.

The archives are reproducible: fixed member order, and every timestamp is the course's
training.updated date at noon, so unchanged inputs give archives with identical contents.
tests/training-packages.test.mjs fails when a ZIP no longer matches the files beside it.

Usage, from the repository root: python3 scripts/prepare-training-packages.py
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
CATALOG = json.loads((ROOT / 'content' / 'videos.json').read_text(encoding='utf-8'))


def stamp(updated: str) -> tuple[int, int, int, int, int, int]:
    day = dt.datetime.strptime(updated, '%d %B %Y')
    return (day.year, day.month, day.day, 12, 0, 0)


def write_zip(path: Path, members: list[tuple[str, bytes]], when) -> None:
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, data in members:
            info = zipfile.ZipInfo(name, date_time=when)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compresslevel=9)


def local(url_path: str) -> Path:
    assert url_path.startswith('/training/'), url_path
    return PUBLIC / url_path.lstrip('/')


def configuration_packages() -> int:
    built = 0
    for course in CATALOG['courses']:
        if course.get('kind') != 'configuration':
            continue
        cid, training = course['id'], course['training']
        folder = PUBLIC / 'training' / cid
        package = local(training['package'])
        assert package == folder / f'SecureByDesign-{cid}-Learning-Package.zip', package
        names = ['START-HERE.txt', Path(training['pdf']).name, Path(training['word']).name,
                 Path(training['checklist']).name, 'Verification-Commands.txt']
        members = []
        for name in names:
            path = folder / name
            if not path.exists():
                raise SystemExit(f'{cid}: {name} is missing; run node scripts/prepare-checklists.mjs first')
            members.append((name, path.read_bytes()))
        write_zip(package, members, stamp(training['updated']))
        built += 1
    return built


def identity_commands(lesson: dict, training: dict) -> str:
    lines = [
        'SECURE BY DESIGN - ' + lesson['title'].upper(),
        f"Course 1.1 | Materials edition {training['materialsEdition']} | Updated {training['updated']}",
        'Sample: sbd.test; SBD-DC01 10.0.10.10 and SBD-DC02 10.0.10.11 on VLAN 10, gateway 10.0.10.1',
        'Read-only checks. Run them on the controllers (later, from the Tier 0 administration host)',
        'with the Windows Server tools and access they need. Review every result; nothing in this',
        'file runs by itself.',
        '',
    ]
    for chapter in lesson['chapters']:
        lines += [chapter['title'], chapter['command'], '', 'Expected observations: ' + chapter['expected'], '']
    return '\n'.join(lines).rstrip('\n') + '\n'


def identity_package() -> None:
    episode = next(item for item in CATALOG['episodes'] if item['id'] == 'dc01-dc02')
    training = episode['training']
    folder = PUBLIC / 'training' / 'dc01-dc02'
    lesson = json.loads((folder / 'lesson.json').read_text(encoding='utf-8'))
    (folder / 'Verification-Commands.txt').write_text(identity_commands(lesson, training), encoding='utf-8')
    names = ['index.html', 'lesson.json', Path(training['word']).name, Path(training['pdf']).name, 'START-HERE.txt',
             'THREE-LICENSE.txt', 'Verification-Commands.txt', 'notices.html', 'account-progress.js']
    manifest_path = folder / 'package-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    edition = training['materialsEdition']
    manifest.update({
        'version': f'{edition}.0',
        'materialsEdition': edition,
        'updated': dt.datetime.strptime(training['updated'], '%d %B %Y').date().isoformat(),
    })
    manifest['components']['workbook'] = {'edition': f'Materials edition {edition}', 'pages': training['pages']}
    manifest['files'] = []
    for name in names:
        data = (folder / name).read_bytes()
        manifest['files'].append({'name': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    members = [(name, (folder / name).read_bytes()) for name in names + ['package-manifest.json']]
    write_zip(local(training['package']), members, stamp(training['updated']))


if __name__ == '__main__':
    identity_package()
    count = configuration_packages()
    print(f'Prepared the course 1.1 learning package and {count} configuration-course packages.')
