#!/usr/bin/env python3
"""Draw a cover for each design reference tile (public/training/library/design-<id>-cover.webp).

The Training Hub shows a cover on every tile. The design references have no workbook, so this draws a matching
first page from content/design-references.json and content/videos.json: the same 612 x 792 page, logo, type and
colors as the workbook covers and the ATO Template Library cover. Re-run after the compendium or a tile's text
changes:  python3 scripts/prepare-design-covers.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
refs = json.loads((ROOT / 'content/design-references.json').read_text())
library = json.loads((ROOT / 'content/videos.json').read_text())
FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-{}.ttf'
regular = lambda size: ImageFont.truetype(FONT.format('Regular'), size)
bold = lambda size: ImageFont.truetype(FONT.format('Bold'), size)
NAVY, TEAL, BODY, MUTED = (26, 46, 66), (21, 94, 117), (70, 82, 96), (110, 120, 130)
logo = Image.open(ROOT / 'public/grc-rmf-training/rmf/workbook-cover.webp').convert('RGB').crop((52, 52, 96, 96))

def wrap(draw, text, font, width):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=font) > width:
            lines.append(line); line = word
        else:
            line = trial
    return lines + [line]

for service in refs['services']:
    tile = next(item for item in library['references'] if item['id'] == f"design-{service['id']}")
    page = Image.new('RGB', (612, 792), 'white')
    draw = ImageDraw.Draw(page)
    page.paste(logo, (52, 52))
    draw.text((54, 99), 'Secure By Design', font=bold(17), fill=NAVY)
    draw.text((54, 122), 'EDUCATE. EMPOWER. SECURE THE FUTURE.', font=regular(7), fill=MUTED)
    draw.text((54, 175), 'GOVERNMENT & VENDOR GUIDELINES   /   DESIGN REFERENCE', font=bold(8), fill=TEAL)
    y = 197
    for line in wrap(draw, tile['title'], bold(30), 500):
        draw.text((52, y), line, font=bold(30), fill=NAVY); y += 38
    y += 8
    for line in wrap(draw, tile['subtitle'], bold(14), 500):
        draw.text((54, y), line, font=bold(14), fill=TEAL); y += 20
    y += 14
    for line in wrap(draw, tile['description'], regular(10), 500):
        draw.text((54, y), line, font=regular(10), fill=BODY); y += 15
    y += 18
    areas = service['design']['areas'] if service['design'] else [b['text'] for b in service['catalog']['blocks'] if b['type'] == 'h2'][:8]
    draw.text((54, y), 'DESIGN AREAS' if service['design'] else 'IN THIS CATALOG', font=bold(8), fill=TEAL); y += 18
    for index, area in enumerate(areas):
        draw.text((54, y), f'{index + 1:02d}', font=bold(8), fill=TEAL)
        draw.text((72, y), area, font=regular(9), fill=BODY)
        y += 17
    draw.text((54, 744), f"© 2026 Secure By Design Team LLC.   Design reference · Compendium assembled {refs['assembled']}", font=regular(7), fill=MUTED)
    out = ROOT / 'public' / tile['training']['cover'].lstrip('/')
    out.parent.mkdir(parents=True, exist_ok=True)
    page.save(out, 'WEBP', quality=90)
    print(f'Wrote {out.relative_to(ROOT)}')
