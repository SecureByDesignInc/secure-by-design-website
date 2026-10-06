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

The live website is https://securebydesigninc.com and is hosted through the existing ChatGPT Sites project identified by `.openai/hosting.json`. This GitHub copy is for source collaboration. GitHub changes do not automatically publish to the existing website. Coordinate integration and publishing through the existing Sites workflow; do not create a replacement production site or change the domain without the owner requesting it.

This handoff contains source and static assets, not the live D1 database, reader accounts, private submissions, deployment credentials, or runtime secrets. `.env.example` contains blank/example configuration. Configure secrets through the appropriate hosting environment. Some server features require Cloudflare/Sites bindings and environment variables.

This is a source snapshot with a fresh GitHub history, not an automatic bidirectional sync. The application code was not changed or rebuilt for this transfer. The generated TypeScript build cache was omitted.
