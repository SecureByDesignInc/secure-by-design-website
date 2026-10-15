#!/usr/bin/env python3
"""Draw the ATO Template Library cover (public/training/library/ato-templates-cover.webp).

The Configuration Hub shows a cover on every tile, normally the first page of a course workbook.
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
logo = Image.open(ROOT / 'public/grc-rmf-training/rmf/workbook-cover.webp').convert('RGB').crop((52, 52, 96, 96))
page.paste(logo, (52, 52))
draw.text((54, 99), 'Secure By Design', font=bold(17), fill=NAVY)
draw.text((54, 122), 'EDUCATE. EMPOWER. SECURE THE FUTURE.', font=regular(7), fill=MUTED)

draw.text((54, 175), 'TEMPLATES & REFERENCES   /   TEMPLATE LIBRARY', font=bold(8), fill=TEAL)
draw.text((52, 197), 'ATO Template', font=bold(33), fill=NAVY)
draw.text((52, 236), 'Library', font=bold(33), fill=NAVY)
draw.text((54, 283), 'Verified public sources, by RMF step', font=bold(15), fill=TEAL)

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

total = len(data['templates'])
count = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][total] if total < 10 else str(total)
intro = (f"{count} official source{'' if total == 1 else 's'} for building an authorization package, arranged by RMF step. Each one is "
         "verified as publicly released by its publisher, and every link opens the publisher's own copy. "
         "For instruction and practice: use your AO and PSO's current templates on a real system.")
y = 318
for line in wrap(intro, regular(10), 500):
    draw.text((54, y), line, font=regular(10), fill=BODY)
    y += 15

y += 18
draw.text((54, y), 'IN THIS LIBRARY', font=bold(8), fill=TEAL)
y += 18
# One line per entry: its RMF step, short title (before any comma) and publisher (the abbreviation in brackets).
steps = {g['id']: g['title'] for g in data['groups']}
for index, item in enumerate(data['templates']):
    gy = y + index * 18
    name = item['title'].split(',')[0]
    publisher = item['source'].split('(')[1].split(')')[0] if '(' in item['source'] else item['source']
    draw.text((54, gy), f"{index + 1:02d}", font=bold(8), fill=TEAL)
    draw.text((72, gy), f"{steps[item['group']]}  ·  {name}  ·  {publisher}", font=regular(8.5), fill=BODY)

from datetime import date
checked_on = date.fromisoformat(data['checked'])
checked = f'{checked_on.day} {checked_on:%B %Y}'
draw.text((54, 744), f'© 2026 Secure By Design Team LLC.   Reference library · Links checked {checked}', font=regular(7), fill=MUTED)
out = ROOT / 'public/training/library/ato-templates-cover.webp'
out.parent.mkdir(parents=True, exist_ok=True)
page.save(out, 'WEBP', quality=90)
print(f'Wrote {out.relative_to(ROOT)}')
