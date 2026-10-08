# Sign in with Apple, Google, Microsoft, and passkeys

Learners can sign in with a passkey, Apple, Google, Microsoft, or email and password, on the website
and in the app. Code: `server/sign-in-methods.js` (routes), `server/oidc.js` (providers and ID-token
checks), `server/webauthn.js` (passkeys), `app/account/provider-buttons.tsx`, `app/account/passkeys.ts`,
`app/my-progress/sign-in-methods.tsx`, and `app/app-sign-in` (the app's sign-in page).

- **Passkeys** need no setup. They work on securebydesigninc.com and www (relying party `securebydesigninc.com`).
- **Each provider button appears only after its keys are added** to the Cloudflare Worker. Until then it stays hidden.
- **Account rules:** a provider whose email is verified (Apple, Google, personal Microsoft accounts) reaches the
  account with that email, or creates one. Microsoft work and school accounts don't verify email addresses for
  other organizations, so they can't create or join an account by email; those learners sign in another way and
  link Microsoft from My Account. A provider account can be linked to only one Secure By Design account.
- **The app** opens `/app-sign-in` in the system browser with a PKCE challenge. After sign-in the page returns a
  one-time code to `securebydesign://auth`, and the app exchanges it with its verifier for a 12-hour session.

## Add the keys in Cloudflare

Cloudflare dashboard → **Workers & Pages** → **secure-by-design-website** → **Settings** → **Variables and Secrets** →
**Add**, type **Secret**. Add each value below, then **Deploy**. Secrets persist across GitHub deploys.

## Apple (Sign in with Apple on the web)

In https://developer.apple.com/account → **Certificates, Identifiers & Profiles**:

1. **Identifiers → App IDs →** `com.securebydesigninc.secureByDesignApp` → turn on **Sign In with Apple** → Save.
2. **Identifiers → + → Services IDs** → Description *Secure By Design website*, Identifier
   `com.securebydesigninc.web` → Continue → Register. Open it, turn on **Sign In with Apple** → **Configure**:
   - Primary App ID: the app's ID above
   - Domains and Subdomains: `securebydesigninc.com`
   - Return URLs: `https://securebydesigninc.com/api/sign-in/apple/callback`
3. **Keys → +** → name *Sign in with Apple*, turn on **Sign In with Apple** → Configure → primary App ID → Register.
   **Download the .p8 file** (only once) and note the **Key ID**.
4. Your **Team ID** is under Membership details.
5. **Private email relay:** Services → **Sign in with Apple for Email Communication** → Configure → add the address
   the site sends from (the `NOTIFICATION_FROM` sender on `notify.securebydesigninc.com`). Without this, Apple drops
   emails to learners who chose Hide My Email.

Secrets: `APPLE_CLIENT_ID` = `com.securebydesigninc.web`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` =
the whole .p8 file including the BEGIN/END lines.

## Google

In https://console.cloud.google.com:

1. Create a project named *Secure By Design*.
2. **Google Auth Platform** (APIs & Services → OAuth consent screen) → Get started:
   - App name *Secure By Design*, support email, audience **External**
   - Branding: home page `https://securebydesigninc.com`, privacy policy `https://securebydesigninc.com/privacy`,
     authorized domain `securebydesigninc.com`
   - Data access: scopes `openid` and `email` only (non-sensitive, no verification review needed)
   - Audience → **Publish app** (In production)
3. **Clients → Create client** → *Web application* → Authorized redirect URI
   `https://securebydesigninc.com/api/sign-in/google/callback` → Create. Copy the client ID and secret.

Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Microsoft

In https://entra.microsoft.com (sign in with the Microsoft account that will own the registration):

1. **App registrations → New registration**: name *Secure By Design*; supported account types
   **Accounts in any organizational directory and personal Microsoft accounts**; redirect URI platform **Web**,
   `https://securebydesigninc.com/api/sign-in/microsoft/callback` → Register. Copy the **Application (client) ID**.
2. **Certificates & secrets → New client secret** (up to 24 months; set a reminder to renew) → copy the **Value**.
3. Recommended: **Token configuration → Add optional claim → ID → `xms_edov`**, so work and school accounts whose
   email domain is verified can sign in directly.
4. Recommended for work and school accounts: **Branding & properties → Publisher verification** with a (free)
   Microsoft AI Cloud Partner Program ID. Many organizations only let staff consent to verified publishers.
   Personal Microsoft accounts work without it.

Secrets: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`.

## Check

Open https://securebydesigninc.com/my-progress signed out: each configured provider shows a button. Sign in with
it, then open **Account settings → Ways to sign in** to see it listed, add a passkey, or link another provider.
