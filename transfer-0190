# Career role directory — internal maintenance

The directory at `/career-explorer/roles` extends the existing Career Explorer. It does not replace the journey tools or labor-market information. The initial reference snapshot was checked on September 15, 2026 and includes 77 work roles in seven categories.

## Private provenance

The research reference is DON COOL's DCWF role directory and public JSON endpoint used by its own frontend. The exact per-role URLs and source snapshot hashes are recorded in `provenance.json`. Keep this directory outside public assets. Neither this document nor the provenance manifest is imported by the runtime. Public pages and data must not include the reference site's name, links, or source footers, per the owner's request.

The public directory now includes 58 roles in five categories; Data/AI and Software Engineering are excluded, including their detail assets. Framework names, public code badges, and competency identifiers are not displayed. Numeric codes remain internal route keys. Qualification scopes (Navy or Marine Corps) and proficiency levels remain visible because they determine what the mappings mean. These are not universal hiring requirements. No source logo or endorsement claim is used. No Secure By Design article or learning-activity recommendations are included in the role directory.

## Import process

Run `scripts/refresh-career-reference.py` manually to download reference snapshots into ignored `work/career-reference/` and invoke the importer. Network access is needed only for an explicit refresh. Ordinary development and production builds are offline and use the checked-in public JSON snapshot.

`scripts/import-career-roles.py <snapshot-directory>` accepts `basic-info.json`, `qualifications.json`, and `tksa.json`. It strips HTML, removes external URLs, and emits a public catalog plus one JSON file per role. The server imports the catalog for titles, descriptions, and links; the browser loads only the selected role's details. Source certificate prose is not republished.

## Content rules

- Pending qualification notices override stale rows in the underlying qualification dataset. Twenty-one roles in the current public selection are pending and do not expose certification mappings.
- Proficiency codes 40, 41, and 42 mean Basic, Intermediate, and Advanced. Keep the service scope separate.
- Credential entries with `moc_qual_servicetype` of `0` are retired; exclude them from current certification search and lists, and label them if retained in the historical disclosure.
- Remove duplicate qualification rows by credential key/status within each service and proficiency. Do not merge qualification levels or service scopes.
- Do not publish raw experience-year fields: the reference frontend uses program-specific conditional-alternative guidance instead. The page tells readers to confirm the applicable experience rules with their organization.
- Missing mappings, competencies, or named certifications must remain explicit. Do not invent substitutes.
- Validate qualification mappings against the source snapshot and run `node --test tests/career-roles.test.mjs` after updates. Inspect the desktop and mobile role pages, pending states, and empty searches.

## Integration

`server/career-role-pages.js` handles the directory and `/career-explorer/roles/:code`, with 404s for unknown roles, a canonical URL, unique titles, and escaped descriptions. It reuses the existing shared header/footer. Browser interactions are in `public/career-roles/directory.js`. Styling is scoped to `#sbd-explorer`.

Production packaging contains `dist` only. Do not include research snapshots, this internal directory, credentials, `.env` files, or source maps in public static assets.
