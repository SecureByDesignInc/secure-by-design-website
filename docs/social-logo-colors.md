# Social button logo assets

**18 October 2026:** the owner replaced the cyan symbols with their own Secure By Design tile artwork. The active assets are now `public/social/<id>-sbd.png` (YouTube, TikTok, Instagram, LinkedIn, Discord) plus `book-a-call-sbd.png` for the Book a call pill: 96px PNGs cut from the owner's labeled 1024px tiles (trimmed at the tile edge, squared, Lanczos-resized), shown at 20px on desktop and 18px on phones. `lib/follow-along.mjs` renders the row for the React header and the Community shells. The retired `-sbd.svg` symbols are in `archive/public-retired-2026-10-18/social/`. The notes below describe the earlier treatments.

The header keeps the current social order and destinations. The owner's latest October 3, 2026 request supersedes the earlier platform-color treatment: use the website's own navy/blue surfaces, cyan (#77d9ef) symbols, pale labels, and 12px corners. The `-sbd.svg` assets reuse the existing monochrome logo paths; the shared shell generator provides the same treatment to standalone Community pages.

The earlier full-color assets are retained as unused reference files with their original provenance:

- YouTube: https://api.iconify.design/logos/youtube-icon.svg — red mark with white play triangle.
- TikTok: https://api.iconify.design/logos/tiktok-icon.svg — cyan and pink accents; the core uses white for the dark header.
- Instagram: https://api.iconify.design/skill-icons/instagram.svg — gradient app symbol with white camera glyph.
- Discord: https://api.iconify.design/logos/discord-icon.svg — Blurple mark (#5865F2).
- LinkedIn (added October 14, 2026): monochrome LinkedIn mark from the CC0 Simple Icons collection, drawn directly in the cyan `linkedin-sbd.svg`; no full-color variant.

The Logos collection is CC0; the Instagram asset is from the MIT-licensed Skill Icons collection. Brand marks remain their owners' trademarks. See public/social/LICENSE.md and public/social/SKILL-ICONS-LICENSE.txt.

Active assets use separate `-sbd.svg` paths to avoid stale cached platform-color images. No color filters are applied.
