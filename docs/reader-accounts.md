# Reader accounts and progress

`/my-progress` is the single account and learning dashboard. `/account` redirects there for older links. Signup, password sign-in, email verification, and password recovery stay on this page. New permanent accounts require a verified email address and a 15–128-character password. Accounts and progress persist beyond the 30-day session lifetime.

Existing email-code users keep their account IDs and all progress. Signed-in users without a password see a setup prompt; signed-out users select **Set or reset password**, verify their email, and choose a password. Creating an account cannot overwrite an already configured password. Recovery revokes older sessions and outstanding verification challenges. Passwordless account creation/sign-in through the old verify endpoint is no longer possible.

Passwords use native scrypt with a random 128-bit salt, N=16384, r=8, p=5, and a 256-bit derived key. Only the encoded hash is stored. Comparisons use timingSafeEqual; unknown accounts perform the same KDF work. Sign-in attempts have durable per-IP and per-email hourly limits. Passwords are never sent through email or returned by the API. The implementation uses Workers' existing nodejs_compat flag and needs no new dependencies or secrets.

Email codes remain browser-bound, hashed at rest, single-use, valid for ten minutes, and limited to five guesses. Email requests retain IP, email/hour, and email/minute limits. Requests use the existing RESEND_API_KEY and NOTIFICATION_FROM. Sessions use random 256-bit tokens stored as hashes, a production __Host- HttpOnly Secure SameSite cookie, and an absolute 30-day expiry. Mutations require the same Origin; caller-supplied account IDs and platform identity headers never grant reader access. Owner administration stays separate.

Migration 0005 only adds a nullable password_hash column to existing accounts and a purpose column with a constant default to challenges. It preserves all reader and progress records.

## App continuity

The page describes using the same account to resume on the app **when it launches**. Durable account IDs and server progress remain shared foundations. The native preview now has a separate bearer-session API for optional account sign-in and consented onboarding email; cloud progress synchronization is still unfinished and is not claimed by the app.

`/api/native-auth/signin` accepts existing verified reader-account passwords and returns a random 256-bit bearer token with a 12-hour absolute expiry. The token is stored only as a SHA-256 digest on the server and only in memory in the native preview. The app never stores passwords or tokens in shared preferences, analytics, or progress exports. `/session` verifies identity, and `/signout` revokes that bearer token. Browser cookies cannot authorize native requests, and a native token cannot be reused as a browser session. Native routes reject Origin/Sec-Fetch-Site headers and require X-SBD-Client: native-v1; this header is a transport boundary, not authentication. The bearer token remains the authority. Password guessing shares the existing website IP/email limits, and website password recovery revokes all native and browser sessions through the same session table. Existing browser Origin checks are unchanged.

Migration 0006 adds a constant-default `client_kind` column, preserving all existing sessions as browser sessions, and the app email enrollment table. `/api/native-onboarding` requires a verified native bearer session and separate explicit consent. APP_ONBOARDING_EMAIL_ENABLED must be exactly true to enroll; it is off by default. The Resend integration is server-only and uses a separate RESEND_AUTOMATIONS_API_KEY secret. The existing RESEND_API_KEY remains dedicated to transactional website emails; it cannot enable native enrollment. Login alone never enrolls a contact in the getting-started email sequence. See native app PR #3 for the templates and sequence; provider activation and live email/unsubscribe validation are still required.

## Validation

Run `node --test tests/reader-progress.test.mjs tests/native-account.test.mjs` for account ownership, password requirements, signup, legacy migration, native/browser isolation, consent, deduplication, shared rate limiting, reset, revocation, code replay/expiry, and persistence. Run `node tests/reader-password-worker.mjs` for signup, web/native scrypt sign-in, logout, wrong-password rejection, and progress restoration in an isolated actual Workers runtime with D1 and simulated outbound email. These tests create no production accounts or real emails.

References: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Workers crypto support](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [OWASP recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Native training progress (0.2.0)

Native sign-in now returns the stable account ID. The app explicitly connects account progress and stores each account cache separately from guest progress. An optional confirmed import copies guest completions/bookmarks; signing out restores the untouched guest collection. Session tokens remain memory-only.

`POST /api/native-progress` accepts bounded arrays of known lesson/status and resource/saved pairs under the existing native bearer boundary. Ownership comes only from the verified session. Course IDs match the website; the nine earlier app lesson IDs use a `native:` prefix. Upserts are transactional; delayed starts cannot downgrade completed units. Bookmark removals persist as tombstones. The app keeps pending writes during connection failures and retries on resume or Sync now.

Migration 0007 adds reader_bookmarks without changing existing account or progress tables. Browser bookmark updates use the existing same-origin reader-progress API. My Progress includes both published training courses and saved materials; unpublished Journal IDs remain stored and excluded from discovery. Guide account controls sync learning status only: lab observations, answers, checks, and exported evidence stay browser-local.

## Native streaks and rewards (0.4.0)

`POST /api/native-activity` uses the same native bearer/session boundary. It accepts at most 12 `{day,lessonId,review,perfect}` entries and an `after` cursor in the existing 2 KiB request limit. Only known app lesson IDs, real calendar dates (2020 onward, at most the next UTC day for local time zones), and booleans are accepted; caller-controlled ownership and XP totals are rejected. All entries validate before a transactional batch. The server derives each date/lesson key and merges duplicate events without multiplying rewards. Responses contain at most 64 rows with an ordered continuation cursor.

Migration 0008 adds `reader_learning_activity` and its account/key primary index without rewriting existing tables. The native client derives streaks, freeze inventory, XP, quests, and achievements from this private activity history; historical lesson statuses are not backdated. Guest activity imports only through the existing explicit user action. The website progress UI and training guides do not award native streak days. No social ranking, contact discovery, push notification, or email enrollment is added.

Validate with `node --test tests/native-activity.test.mjs tests/native-progress.test.mjs tests/native-account.test.mjs tests/reader-progress.test.mjs`.

## Automatic Community enrollment (the free Community account)

Migration 0009 adds `community_memberships`, keyed by trimmed, lowercase email, with the original join time/source and a nullable reader-account reference. There are no membership tiers (owner request, 16 October 2026): every account is a free Community account. These records do not create an authentication session, lab entitlement, resource-email subscription, or getting-started email enrollment.

Accepted account verification-code requests, successful website/native sign-in, resource signup, career requests, and community contributions enroll automatically. Forms disclose enrollment before submission. No enrollment runs on typing or blur. Repeated submissions preserve one membership and its join date. Career/contribution records, notification outboxes, and memberships commit atomically; validation and rate-limit rejections create no membership. Resource-email delivery can fail after a valid resource signup is stored: Community membership remains active and the error explains that only the resource confirmation failed.

Account verification or authenticated sign-in links the email membership to its reader account. Resource email confirmation can mark the email verified but cannot grant account access. Existing authenticated readers receive Community membership when loading My Account or their native session, without touching their progress or email preferences. Authenticated account responses include `membership: {plan: 'community', status: 'active'}`; the dashboard/session also returns `joinedAt`. There is no public membership lookup by email. The currently installed native app uses the shared sign-in service and accepts the additive response field without needing a new binary.

Validation: `node --test tests/community-membership.test.mjs tests/native-account.test.mjs tests/reader-progress.test.mjs`. The membership suite uses an isolated SQLite database and simulated email to cover all entry points, repeat submissions, verified account linking, native sign-in, email unsubscribe preservation, rejected forms, rate limits, and transaction rollback.
