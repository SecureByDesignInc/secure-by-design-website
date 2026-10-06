# App store launch controls

The shared header shows official App Store, Google Play, Mac App Store, and Microsoft Store badge artwork beside the social links. All four controls are native disabled buttons while the app is in development. There are no navigable download URLs in that state, including with JavaScript disabled.

`content/app-stores.json` owns the launch configuration. `storeUrl` identifies each real storefront, not an app listing. Add the app's actual published URL to each `listingUrl`, then set `enabled` to true only when the user authorizes launch. Each badge becomes an external link only if its URL matches the corresponding store's listing format; missing or invalid destinations stay disabled. Rebuild and publish to activate changes. Never substitute another app's listing or invent an app ID.

React and generated Community pages share `lib/app-stores.mjs`. No web-app button is shown because a public web-app URL has not been supplied.

Official assets, downloaded October 3, 2026 without altering the artwork:

- https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg
- https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-mac-app-store.svg
- https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png
- https://get.microsoft.com/images/en-us%20dark.svg

The coming-soon notice is separate from the badge artwork. Preserve the original colors, aspect ratios, and clear space.
