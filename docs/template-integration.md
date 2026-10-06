# Purchased SalesHookAI template integration

This checkout contains the purchased-template integration for Secure By Design. It is the source for the approved blue/cyan redesign, centered branding, and logo to the right of the wordmark.

## Source and scope

- Source: user-supplied `saleshookai-landing-page-2-v1.zip`, purchased from Pantokrator on 21st.dev.
- Archive SHA-256: `00ba7571244d8910b8bbe1ca9b54b25d0ad65d082f9db27347b0d86e91f21140`.
- Production starting commit: `ef87ea977f5a5910c763a08cf96acf5804845054` (Site version 46).
- User confirmed Secure By Design blue/cyan branding.

The actual purchased shader, gradient button, and draggable card stack are adapted in `components/saleshook/`. The purchased stacked tabs and intersection reveal patterns were adapted with accessible keyboard semantics, stable reading order, and reduced-motion support. The source's gradient-button property animations and pearl surface styles are in `app/saleshook-effects.css`, recolored blue/cyan.

The homepage follows the template's hero, interactive product-preview, card-stack, and closing content composition, using Secure By Design's own content and destinations. Sales quotes, artificial intelligence demo, pricing, return-on-investment calculations, promotional testimonials, unrelated logos, sales dashboard images, and stub authentication are not part of this site's product and were not imported. No synthetic testimonials or customer statistics were added.

The existing application, lockfile, routes, content, authorization rules, and server APIs remain in place. New dependencies are limited to the imported template components. Article surfaces and forms remain light for readability, with the shared blue/cyan header, footer, and introductions. The Community shell is generated from the same shared style source as the React pages. Partner assets and their existing resource controls remain unchanged in behavior.

## Preview and validation

Local preview: `http://localhost:3003/` while the development server runs. All internal links use the integration checkout; they do not send readers back to production. Existing protected records and signup/notification behavior remain server-backed. Production database contents and email credentials were not copied into this local preview.

Validated the production build and TypeScript check, the 24 existing backend/routing tests, desktop and mobile layouts, all seven phase selectors, reading tabs and keyboard control, community card navigation, community tabs and four-field intake, and reduced motion. Browser submission checks use an intercepted response and do not send email or create records. Decorative WebGL loads separately after hydration and is omitted for reduced motion.

Publish only when the user requests it, using this checkout and the existing Site ID in `.openai/hosting.json`. The production database schema and service configuration are unchanged.
