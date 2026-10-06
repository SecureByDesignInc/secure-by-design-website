// Keep the Community and Career Explorer source templates independently editable.
// Compose one document so forms, navigation, and explorer tools share a page.
export function combineCommunityPage(community, explorer) {
  const mainPattern = /<main\b[^>]*>([\s\S]*?)<\/main>/;
  const communityContent = community.match(mainPattern)?.[1];
  const explorerContent = explorer.match(mainPattern)?.[1];
  if (!communityContent || !explorerContent) throw new Error('Community page content is missing');

  const sectionLinks = '<nav class="community-section-links" aria-label="On this page"><a href="#community">Community</a><a href="#career-explorer">Career Explorer <span aria-hidden="true">↓</span></a></nav>';
  const body = `<main id="main" class="community-career-page"><div id="community" class="career-hub">${sectionLinks}${communityContent}</div><section id="career-explorer" class="career-explorer-content" aria-labelledby="role-directory-title">${explorerContent.replace(/<h1\b/g, '<h2').replace(/<\/h1>/g, '</h2>').replace('<span>EXPLORE THE WORK</span>', '<span>CAREER EXPLORER</span>')}</section></main>`;
  const scripts = explorer.match(/<script\b[^>]*src="\/career-explorer\/[^"<>]+"[^>]*><\/script>/g) || [];
  return community
    .replace(mainPattern, () => body)
    .replace('Talk about your career, discover cybersecurity resources, or contribute to the community.', 'Join the community, share resources, plan your cybersecurity career, and explore roles and job markets.')
    .replace('</head>', '<link rel="stylesheet" href="/career-explorer/explorer.css"><link rel="stylesheet" href="/community-careers.css"><link rel="canonical" href="https://securebydesigninc.com/careers"></head>')
    .replace('</body>', () => scripts.join('') + '</body>');
}
