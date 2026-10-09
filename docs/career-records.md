# Career records

The existing learning module remains at `/`. `/careers` collects the revised background and career-goals form. `/career-records` is an owner-only review area. API authorization uses a My Account session for the `OWNER_EMAIL` address that signed in within the last 12 hours; any other account gets 403, and client-supplied `oai-*` headers are ignored. The public forms are closed (POST returns 410) until relaunch.

Structured responses, submission dates, review status, check-in dates, and owner notes are stored in the Site's D1 database. The intake is not an appointment scheduler. Check-in dates do not currently generate reminder emails. Form drafts stay in memory until submitted. Private records are never embedded in static assets.

## Deployment settings

Set `OWNER_EMAIL` to the email of the owner's My Account login, not automatically to the notification inbox. Set `SITE_ORIGIN` to `https://securebydesigninc.com`. The notification recipient is intentionally fixed to the user's requested `support@securebydesigninc.com` on the server.

Email uses the Resend HTTPS API. Before activating email:

1. Create a Resend account and verify a sending domain you control. Follow https://resend.com/docs/dashboard/domains/introduction. Use the DNS records Resend supplies; do not invent or overwrite unrelated records.
2. Create a sending API key. Store it as the secret `RESEND_API_KEY` in the Worker's settings in Cloudflare, never in source or chat.
3. Set `NOTIFICATION_FROM` to an address on that verified sending domain. It need not be the receiving support mailbox.
4. Secrets apply to the running Worker immediately; code changes deploy when merged to `main`.
5. Open the private records area and send a test email. Confirm receipt in the support inbox, then send pending notifications. Provider acceptance alone does not establish inbox delivery.

Source references: https://resend.com/docs/api-reference/emails/send-email and https://resend.com/docs/dashboard/emails/idempotency-keys.

## Notification behavior

Record and outbox insertion are atomic. Email failure never discards an accepted submission. Configured notifications are attempted after storage, with up to three bounded retries for transient failures. Failed or unconfigured notifications remain visible in the private review area and can be retried there. No separate background scheduler is claimed. Notification email contains only a private review link, not the submitted answers.

Each notification uses the same provider idempotency key for retries. Uncertain attempts older than 23 hours require provider review instead of automatic resend, because the provider's deduplication window is limited. Do not reset those records without checking provider delivery history.

## Development

`node scripts/build.mjs` generates the ESM Worker and its embedded public assets. `pnpm db:generate` produces Drizzle migrations. Migrations are packaged and applied by Sites at deployment, never by runtime request handlers. `node --test tests/careers.test.mjs` uses SQLite to test storage, access controls, validation, transaction rollback, stale-update protection, and mocked email retries. The local preview database is separate from production.

Before making the Site public, verify the owner allowlist setting and both visitor/owner routes on the deployed version. Changing Site access is a separate owner decision. The form explains that Jon keeps the responses for career conversations and goal follow-up.
