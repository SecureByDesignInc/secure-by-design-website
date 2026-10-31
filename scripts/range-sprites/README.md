# Cyber Range sprite sets

The Range draws an operator from a sprite set when one exists (app/cyber-range/avatars.js, `SPRITES`), otherwise from
the vector figure. Sets are rendered in Blender (5.0, the `bpy` module or the app) as cel-shaded frames with ink lines:

1. `python operator_build.py all` builds the operator, keys idle, attack, hit, down, victory and command, and renders
   the frames to `$SBD_SPRITES` (default /home/claude/sprites) at 512x768, plus the .blend file.
2. `python make_sheets.py` turns each action's frames into one WebP strip at half size and writes manifest.json.
3. Copy the strips to public/range-app/sprites/<operator>/ and the manifest's frames, w, h and fps into `SPRITES`.

ttl_zero (the Network resident) is the first set, 30 October 2026.
