// Link previews (Open Graph and X/Twitter cards) and the canonical address for a page.
// Every share button sends the homepage, but people also paste course links into Discord, LinkedIn,
// Slack and messages; this gives each page a title, a summary and the brand card image.
export const shareImage = { url: '/og/secure-by-design.jpg', width: 1200, height: 630, alt: 'Secure By Design — Educate. Empower. Secure the future.' };

// Site-wide defaults for the root layout. No canonical or og:url here: Next-style metadata is inherited,
// so a canonical set in the layout would tell search engines every page is the homepage.
export function siteSharePreview(title: string, description: string) {
  return {
    openGraph: { type: 'website' as const, siteName: 'Secure By Design', locale: 'en_US', title, description, images: [shareImage] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [shareImage.url] },
  };
}

// A page's own preview and canonical address.
export function sharePreview(title: string, description: string, path: string) {
  return {
    alternates: { canonical: path },
    openGraph: { type: 'website' as const, siteName: 'Secure By Design', locale: 'en_US', title, description, url: path, images: [shareImage] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [shareImage.url] },
  };
}
