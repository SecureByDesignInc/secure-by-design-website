import posts from '../content/articles.json';
type Post = (typeof posts)[number];

export default function PostPreview({post, featured = false}: {post: Post; featured?: boolean}) {
  const Heading = featured ? 'h1' : 'h2';
  const opening = (post.intro.match(/<p>[\s\S]*?<\/p>/g) ?? []).slice(0, 2).join('');
  return <article className={'post-entry' + (featured ? ' featured-entry' : '')}>
    {featured && <p className="feed-kicker">Technical Blog · Featured article</p>}
    <p className="entry-meta"><span>{post.cisspDomainLabel}</span><span aria-hidden="true">·</span><span>{post.minutes} min read</span></p>
    <Heading><a href={'/blog/' + post.slug}>{post.title}</a></Heading>
    {featured ? <>
      <p className="entry-byline">By Secure By Design</p>
      <div className="entry-excerpt" dangerouslySetInnerHTML={{__html: opening}}/>
    </> : <p className="entry-description">{post.description}</p>}
    <div className="entry-footer"><a className="text-link" href={'/blog/' + post.slug}>Continue reading <span aria-hidden="true">→</span></a><span>{post.seriesName ? post.number === 1 ? post.seriesName : `${post.seriesName} · Part ${post.number}` : post.topic}</span></div>
  </article>;
}
