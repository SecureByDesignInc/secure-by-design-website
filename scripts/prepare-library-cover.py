#!/usr/bin/env python3
"""Draw the ATO Template Library cover (public/training/library/ato-templates-cover.webp).

The Training Library shows a cover on every tile, normally the first page of a course workbook.
The template library has no workbook, so this draws a matching first page from
content/ato-templates.json: the same 612 x 792 page, logo, type and colors as the workbook covers.
Re-run after changing the library's counts or groups:  python3 scripts/prepare-library-cover.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'content/ato-templates.json').read_text())
FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-{}.ttf'
regular = lambda size: ImageFont.truetype(FONT.format('Regular'), size)
bold = lambda size: ImageFont.truetype(FONT.format('Bold'), size)
NAVY, TEAL, BODY, MUTED = (26, 46, 66), (21, 94, 117), (70, 82, 96), (110, 120, 130)

page = Image.new('RGB', (612, 792), 'white')
draw = ImageDraw.Draw(page)
# The logo block from a workbook cover, so the brand mark is identical.
logo = Image.open(ROOT / 'public/training/rmf-body-of-evidence/workbook-cover.webp').convert('RGB').crop((52, 52, 96, 96))
page.paste(logo, (52, 52))
draw.text((54, 99), 'Secure By Design', font=bold(17), fill=NAVY)
draw.text((54, 122), 'EDUCATE. EMPOWER. SECURE THE FUTURE.', font=regular(7), fill=MUTED)

draw.text((54, 175), 'TEMPLATES & REFERENCES   /   TEMPLATE LIBRARY', font=bold(8), fill=TEAL)
draw.text((52, 197), 'ATO Template', font=bold(33), fill=NAVY)
draw.text((52, 236), 'Library', font=bold(33), fill=NAVY)
draw.text((54, 283), 'The DoD SAP / JSIG templates, step by step', font=bold(15), fill=TEAL)

def wrap(text, font, width):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=font) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + [line]

posted = sum(t['status'] in ('hosted', 'adapted') for t in data['templates'])
intro = (f"{posted} Word and Excel templates to download, arranged by RMF step, with official sources for "
         "the rest of the Body of Evidence. They follow the JSIG of 11 April 2016 with its 2018 errata "
         "and are adapted for instruction and practice. Use your AO and PSO's current templates on a real system.")
y = 318
for line in wrap(intro, regular(10), 500):
    draw.text((54, y), line, font=regular(10), fill=BODY)
    y += 15

y += 18
draw.text((54, y), 'IN THIS LIBRARY', font=bold(8), fill=TEAL)
y += 18
groups = [g for g in data['groups'] if any(t['group'] == g['id'] for t in data['templates'])]
half = (len(groups) + 1) // 2
for index, group in enumerate(groups):
    count = sum(t['group'] == group['id'] for t in data['templates'])
    column, row = divmod(index, half)
    x, gy = 54 + column * 255, y + row * 16
    draw.text((x, gy), f"{index + 1:02d}", font=bold(8), fill=TEAL)
    draw.text((x + 18, gy), f"{group['title']}  ·  {group['abbr']}  ·  {count}", font=regular(8.5), fill=BODY)

from datetime import date
checked_on = date.fromisoformat(data['checked'])
checked = f'{checked_on.day} {checked_on:%B %Y}'
draw.text((54, 744), f'© 2026 Secure By Design Team LLC.   Template library · Links checked {checked}', font=regular(7), fill=MUTED)
out = ROOT / 'public/training/library/ato-templates-cover.webp'
out.parent.mkdir(parents=True, exist_ok=True)
page.save(out, 'WEBP', quality=90)
print(f'Wrote {out.relative_to(ROOT)}')
