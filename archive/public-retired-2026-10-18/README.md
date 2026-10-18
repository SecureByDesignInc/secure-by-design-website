# Retired public files — 18 October 2026

Moved out of `public/` because nothing live uses them any more. The paths mirror `public/`.

| File | What it was |
| --- | --- |
| `social/youtube-sbd.svg`, `tiktok-sbd.svg`, `instagram-sbd.svg`, `linkedin-sbd.svg`, `discord-sbd.svg` | The cyan monochrome symbols the header's Follow along pills showed from 3 October 2026. Replaced on 18 October 2026 by the owner's tile artwork, `public/social/<id>-sbd.png`, rendered by `lib/follow-along.mjs`. |

## Restoring

Move a file back to the same path under `public/`, for example `mv archive/public-retired-2026-10-18/social/youtube-sbd.svg public/social/`, and point `platformTile` in `lib/follow-along.mjs` back at `.svg` (with the 16px icon size in `app/template-shared.css`).
