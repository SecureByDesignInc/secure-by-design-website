# Secure By Design website handoff

This private repository contains the website source retrieved on October 6, 2026 from the existing Secure By Design Sites project. Source commit: `a7e90f0c6566a9e57c8b659961ec11f3a473ee07`.

Read `AGENTS.md` for the current content and design requirements, and `README.md` for project documentation. The latest dated instructions supersede older requirements where explicitly stated.

## Development

Use Node.js 22.13 or later and pnpm. Install dependencies with `pnpm install`, start with `pnpm dev`, and build with `pnpm build`. The project uses React, Vinext/Vite, and Cloudflare Workers. The Sites Vite plugin is retained; setup in another environment may require access to that dependency and the Sites integration.

- `app/`, `components/`: pages and interface components.
- `content/`, `public/`: course content, images, standalone training packages, and the interactive network.
- `server/`, `drizzle/`: server handlers and database schema/migrations.
- `tests/`, `scripts/`, `docs/`: checks, content generation, and documentation.
- `archive/`: retained unpublished Security Journal material.

## Hosting and data

The live website is https://securebydesigninc.com. It runs on the owner's own Cloudflare account: the Worker `secure-by-design-website` (custom domains securebydesigninc.com and www), its D1 database, and the DNS zone. Merges to `main` build, test and deploy through `.github/workflows/deploy.yml` using the repository's Cloudflare secrets; pull requests run the build, tests and the Browser check first. Don't create a replacement production site or change the domain without the owner requesting it.

The original ChatGPT Sites projects were retired on 8 October 2026 after the move; their data was copied into the Cloudflare D1 database. `.openai/hosting.json` and the Sites Vite plugin remain only because the build reads binding names from them. Runtime secrets (`RESEND_API_KEY`, `OWNER_EMAIL`, sign-in provider keys) live in the Worker's settings in Cloudflare, never in the repository.

The native app reads its courses and the Inside the Network reference from `/app/content/v1.json`, which the build generates from this repository; installed apps pick up each deploy without an App Store release. Keep lesson and material IDs stable and see `docs/native-app-content.md` before changing the feed.

This repository is now the website's source of truth; it began as a source snapshot of the Sites project with a fresh GitHub history.
