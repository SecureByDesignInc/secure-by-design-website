# Footer social links

Profiles remain in `content/videos.json`. The shared React footer and six generated Community footers use local Simple Icons 15.0.0 assets for YouTube, TikTok, Instagram, and X. Icons were retrieved from `https://cdn.jsdelivr.net/npm/simple-icons@15.0.0/icons/`; their supplied license is in `public/social/LICENSE.md`.

Social links preserve native new-tab navigation, visible names, 44px targets, and keyboard focus. The cyan hover effect lifts by 2px and is disabled with reduced motion.

## Analytics

Plausible was cancelled on October 8, 2026, and its tracker, event tagging, `public/social-analytics.js` and Content-Security-Policy entries were removed.

Analytics returned in October 2026 as cookieless PostHog, deliberately chosen and running alongside Cloudflare Web Analytics (`server/analytics.js`). Social links are still plain outbound links with no tagging in the markup. A single click listener in the analytics script records clicks to YouTube, TikTok, Instagram, LinkedIn, Discord, and TestFlight or the App Store as `channel_click` events.

Everything loads from this site under `/sbd-e/`, so the policies in `server/security-headers.js` and `public/_headers` need no changes. `server/career-pages.js` and `server/career-role-pages.js` set their own policies. Those need to allow `script-src 'self'` and same-site connections (`connect-src`, or `default-src 'self'` when `connect-src` is absent).
