# Footer social links

Profiles remain in `content/videos.json`. The shared React footer and six generated Community footers use local Simple Icons 15.0.0 assets for YouTube, TikTok, Instagram, and X. Icons were retrieved from `https://cdn.jsdelivr.net/npm/simple-icons@15.0.0/icons/`; their supplied license is in `public/social/LICENSE.md`.

Social links preserve native new-tab navigation, visible names, 44px targets, and keyboard focus. The cyan hover effect lifts by 2px and is disabled with reduced motion.

## Analytics

The existing site-specific Plausible tracker is configured for `securebydesigninc.com` with outbound tracking enabled. Tagged footer links send the existing `Outbound Link: Click` event and the destination URL, with `platform` and `placement=footer` properties. Plausible's tagged-event handling skips its automatic outbound handler, avoiding duplicate outbound counts. No simulated counters or tracking panels appear on the website.

Find counts in Plausible's Goals tab under `Outbound Link: Click`, filtering by each social destination URL. Custom property reporting depends on the account's available features; destination URL reporting uses the existing outbound goal.

Standalone Community pages load `public/social-analytics.js` before the same Plausible tracker. Their initialization disables automatic pageviews, outbound links, downloads, and form submissions; only explicitly tagged social links trigger events. Source URLs omit queries and fragments, and referrers are removed. The Community content policy allows the exact existing tracker path and event endpoint without enabling inline scripts.

Reference: https://plausible.io/docs/custom-event-goals and https://plausible.io/docs/outbound-link-click-tracking
