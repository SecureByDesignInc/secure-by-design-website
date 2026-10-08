# Sign-in live check

1 failed of 25

- ✅ providers endpoint — 200 {"providers":{"apple":false,"google":false,"microsoft":false},"passkeys":true} cache=private, no-store
- ✅ unconfigured provider start redirects with an error code — 303 /my-progress?signin_error=unavailable#account
- ✅ methods require a session — 401
- ✅ cross-site passkey request refused — 403
- ✅ cross-site delete refused — 403
- ✅ app exchange rejects an unknown code — 400 {"error":"That sign-in expired. Try again."}
- ✅ www redirects to apex keeping the query — 301 https://securebydesigninc.com/app-sign-in?challenge=abc
- ✅ my-progress shows passkey sign-in (390)
- ✅ provider buttons hidden until keys exist (390) — 0 shown
- ✅ no horizontal scroll on my-progress (390) — 0px
- ✅ app-sign-in shows the sign-in form (390)
- ✅ no horizontal scroll on app-sign-in (390) — 0px
- ✅ app-sign-in without a challenge explains itself (390)
- ✅ privacy mentions passkeys and self-service deletion (390)
- ✅ no page errors (390)
- ✅ my-progress shows passkey sign-in (1440)
- ✅ provider buttons hidden until keys exist (1440) — 0 shown
- ✅ no horizontal scroll on my-progress (1440) — 0px
- ✅ passkey options from the site — {"status":200,"body":{"publicKey":{"challenge":"sS3MOvfJkMAc-G3Rvdt7Ilu3lTqUZFcE3sEDlwLMYQQ","rpId":"securebydesigninc.com","userVerification":"required","timeout":300000,"allowCredentials":[]}}}
- ❌ my-progress 1440 — locator.waitFor: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.reader-error[role=alert], .reader-error').first() to be visible

- ✅ app-sign-in shows the sign-in form (1440)
- ✅ no horizontal scroll on app-sign-in (1440) — 0px
- ✅ app-sign-in without a challenge explains itself (1440)
- ✅ privacy mentions passkeys and self-service deletion (1440)
- ✅ no page errors (1440)
