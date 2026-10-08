# Retired public files — 8 October 2026

These files were moved out of `public/` because nothing live uses them: no page the site serves, no build script, and no test refers to them. Removing them from `public/` keeps them off the deployed site (about 4.6 MB) without losing anything. The paths below mirror `public/`, so `career-explorer/app.js` here was `public/career-explorer/app.js`.

| File | What it was |
| --- | --- |
| `career-explorer/app.js`, `career-market.js`, `direction.js`, `job-data.js`, `roles.js` | Career Explorer scripts and job-market data, loaded only by `server/career-pages/career-explorer.html` (the `/career-explorer` page, offline since October 2026). |
| `community-careers.css` | Community page styles added by `server/community-page.js` to the offline `/careers` page. |
| `community-contribution.js` | "Share what you know" form script on the offline `/careers` page (`POST /api/community-contributions` now answers 410). |
| `resource-signup.js` | Resource email sign-up script on the offline `/careers` page (`POST /api/resource-signups` now answers 410). |
| `resources/career-goals-and-support.pdf` | Career Goals & Support download, linked only from `app/career-goals/worksheet.tsx` (`/career-goals` returns not found). |
| `labs/sbd-one-user-lab.yaml` | Cyber Range one-user lab template (Cyber Range is offline). |
| `secure-by-design.png` | Unused 1.8 MB brand image. |
| `architecture/secure-by-design-network.png` | The supplied reference network diagram (2.6 MB), not shown on any page; see README.md. |
| `app-stores/mac-app-store.svg`, `app-stores/microsoft-store.svg` | Store badges removed from `content/app-stores.json` (only App Store and Google Play remain). |

Kept in `public/` because something live still uses them: `career-explorer/explorer.css` (written by `scripts/prepare-career-explorer.mjs` during `pnpm dev`/`pnpm build`), `career-roles/` (read by `tests/career-roles.test.mjs`), `career-form.js` and `career-fields.js` (`tests/careers.test.mjs` expects `/career-form.js`; the owner page script `career-records.js` imports `career-fields.js`), and `career.css`, `career-shell.css`, `career-records.js`, `community-review.js`, `resource-subscribers.js` and `resource-preferences.js` (the owner record pages and the email preference page).

## Restoring

Move a file back to the same path under `public/`, for example:

```
mkdir -p public/career-explorer
mv archive/public-retired-2026-10-08/career-explorer/*.js public/career-explorer/
```

When the Community and Career Explorer pages relaunch, restore the Career Explorer scripts, `community-careers.css`, `community-contribution.js`, `resource-signup.js` and the career PDF together with the routes in `server/career-pages.js` and `app/career-goals/page.tsx`. Rebuild and check the pages before publishing.
