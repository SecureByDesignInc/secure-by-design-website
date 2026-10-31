import json, os, glob
from PIL import Image
SRC = '/home/claude/sprites'
OUT = '/home/claude/proto/sheets'
os.makedirs(OUT, exist_ok=True)
SCALE = 0.5
FPS = {'idle': 6, 'attack': 12, 'hit': 12, 'down': 12, 'victory': 12, 'command': 1}
manifest = {}
previews = []
for action in ['idle', 'attack', 'hit', 'down', 'victory', 'command']:
    files = sorted(glob.glob(f'{SRC}/{action}/f_*.png'))
    if not files:
        continue
    frames = [Image.open(f).convert('RGBA') for f in files]
    w, h = frames[0].size
    tw, th = int(w * SCALE), int(h * SCALE)
    sheet = Image.new('RGBA', (tw * len(frames), th), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.alpha_composite(fr.resize((tw, th), Image.LANCZOS), (i * tw, 0))
    path = f'{OUT}/{action}.webp'
    sheet.save(path, 'WEBP', quality=88, method=6)
    manifest[action] = {'frames': len(frames), 'w': tw, 'h': th, 'fps': FPS[action], 'bytes': os.path.getsize(path)}
    previews.append((action, frames))
    print(action, len(frames), 'frames', os.path.getsize(path) // 1024, 'KB')
json.dump(manifest, open(f'{OUT}/manifest.json', 'w'), indent=1)
# review sheet: every frame of every action, small, on the Range ground
cols = max(len(f) for _, f in previews)
tw, th = 128, 192
bg = Image.new('RGBA', (cols * tw, len(previews) * th), (7, 21, 33, 255))
for r, (action, frames) in enumerate(previews):
    for i, fr in enumerate(frames):
        bg.alpha_composite(fr.resize((tw, th), Image.LANCZOS), (i * tw, r * th))
bg.convert('RGB').save(f'{OUT}/review_all.png')
print('review', bg.size)
