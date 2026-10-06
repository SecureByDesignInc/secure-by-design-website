# Resource email signup

The Career conversations page offers independent Career conversation and Resource emails panels. Career submissions do not enroll people in resource emails and resource signups do not create career records.

Resource signups store a separate consent record in resource_subscribers. Email addresses are normalized to prevent duplicate entries. A subscriber stays pending until they receive a confirmation email through the existing Resend sender and press Confirm my signup on the linked page. Confirmation links expire after 48 hours. Opening a link alone has no effect, so email link scanners do not subscribe or unsubscribe recipients. Tokens are passed in URL fragments, not server query strings. Confirmation token hashes are stored in the database.

The public form uses the existing RESEND_API_KEY, NOTIFICATION_FROM, SITE_ORIGIN, and DB bindings. No new service secret is required. It fails clearly if email is not configured. Per-source and per-address limits bound confirmation emails. A delivery failure leaves the record pending, never active, and the visitor can request another confirmation later.

Owner management is at /resource-subscribers and linked from /career-records. Every private API checks the existing site owner identity. Lists show confirmed, pending, and unsubscribed records. The owner can stop a subscription and download only currently confirmed subscribers.

Resource delivery itself is not automated. Before sending selected resources, download a fresh confirmed list. Each CSV row includes an individual unsubscribe URL for that recipient, which must be included in any email sent using that row. Do not send to pending or unsubscribed entries. Do not publish the CSV, put recipients together in a visible To/CC field, or use an older export after people have unsubscribed. A future broadcast feature must recheck current status at send time and preserve per-recipient unsubscribe links.

The confirmation email is not a resource digest or marketing welcome campaign. Content selection and delivery cadence remain the owner's decisions.

Schema changes are additive in 0001_windy_mister_sinister.sql. Existing career tables and notification processing are unchanged. Focused tests use mocked email delivery and isolated SQLite databases; they do not send real subscriber email.
