#!/usr/bin/env python3
"""Draw the ATO Template Library cover (public/training/library/ato-templates-cover.webp).

The Training Hub shows a cover on every tile, normally the first page of a course workbook.
The template library has no workbook, so this draws a matching first page from
content/ato-templates.json: the same 612 x 792 page, logo, type and colors as the workbook covers.
Re-run after changing the library's entries, samples or groups:  python3 scripts/prepare-library-cover.py
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
official = data['templates']
draw.text((54, 283), 'Verified public sources, by RMF step' if official else 'Training samples, by RMF step', font=bold(15), fill=TEAL)

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

total = len(official)
count = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][total] if total < 10 else str(total)
# Owner direction, 21 October 2026: while the official sources are revised, every RMF step's are coming soon, and the
# cover lists the steps and the training samples instead of publishers.
intro = (f"{count} official source{'' if total == 1 else 's'} for building an authorization package, arranged by RMF step. Each one is "
         "verified as publicly released by its publisher, and every link opens the publisher's own copy. "
         "For instruction and practice: use your AO and PSO's current templates on a real system.") if official else (
         "Templates for building an authorization package, arranged by RMF step. Official sources for each step are coming soon; "
         "the Secure By Design training samples are ready now. For instruction and practice with fictional data: "
         "use your AO and PSO's current templates on a real system.")
y = 318
for line in wrap(intro, regular(10), 500):
    draw.text((54, y), line, font=regular(10), fill=BODY)
    y += 15

y += 18
steps = {g['id']: g['title'] for g in data['groups']}
if official:
    draw.text((54, y), 'IN THIS LIBRARY', font=bold(8), fill=TEAL)
    y += 18
    # One line per entry: its RMF step, short title (before any comma) and publisher (the abbreviation in brackets).
    for index, item in enumerate(official):
        gy = y + index * 18
        name = item['title'].split(',')[0]
        publisher = item['source'].split('(')[1].split(')')[0] if '(' in item['source'] else item['source']
        draw.text((54, gy), f"{index + 1:02d}", font=bold(8), fill=TEAL)
        draw.text((72, gy), f"{steps[item['group']]}  ·  {name}  ·  {publisher}", font=regular(8.5), fill=BODY)
else:
    AMBER = (176, 112, 18)
    draw.text((54, y), 'OFFICIAL SOURCES BY RMF STEP', font=bold(8), fill=TEAL)
    y += 18
    # No numbers here: Authorize has no section, so a count would not match the RMF step numbers.
    for group in data['groups']:
        draw.text((54, y), '–', font=bold(8), fill=TEAL)
        draw.text((72, y), group['title'], font=regular(8.5), fill=BODY)
        draw.text((200, y), 'COMING SOON', font=bold(7.5), fill=AMBER)
        y += 18
    y += 14
    draw.text((54, y), 'SECURE BY DESIGN TRAINING SAMPLES', font=bold(8), fill=TEAL)
    y += 18
    for index, item in enumerate(data['samples']):
        draw.text((54, y), f"{index + 1:02d}", font=bold(8), fill=TEAL)
        draw.text((72, y), f"{steps[item['group']]}  ·  {item['title']}", font=regular(8.5), fill=BODY)
        y += 18

if data.get('checked'):
    from datetime import date
    checked_on = date.fromisoformat(data['checked'])
    footer = f'Reference library · Links checked {checked_on.day} {checked_on:%B %Y}'
else:
    footer = 'Reference library · Training samples are not official forms'
draw.text((54, 744), f'© 2026 Secure By Design Team LLC.   {footer}', font=regular(7), fill=MUTED)
out = ROOT / 'public/training/library/ato-templates-cover.webp'
out.parent.mkdir(parents=True, exist_ok=True)
page.save(out, 'WEBP', quality=90)
print(f'Wrote {out.relative_to(ROOT)}')
