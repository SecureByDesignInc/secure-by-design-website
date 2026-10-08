# Footer social links

Profiles remain in `content/videos.json`. The shared React footer and six generated Community footers use local Simple Icons 15.0.0 assets for YouTube, TikTok, Instagram, and X. Icons were retrieved from `https://cdn.jsdelivr.net/npm/simple-icons@15.0.0/icons/`; their supplied license is in `public/social/LICENSE.md`.

Social links preserve native new-tab navigation, visible names, 44px targets, and keyboard focus. The cyan hover effect lifts by 2px and is disabled with reduced motion.

## Analytics

None. The owner cancelled Plausible on October 8, 2026, and its tracker, event tagging, `public/social-analytics.js`, and Content-Security-Policy entries were removed. Social links are plain outbound links. If analytics return, add the provider deliberately and update the Content-Security-Policy in `server/career-pages.js` and `server/career-role-pages.js`.
