import posts from '../content/articles.json';
export function PostMeta() {
  return <div className="post-meta"><span>{posts[0].cisspDomainLabel}</span><span>{posts[0].minutes} min read</span></div>;
}

export function ArticlePreview() {
  return <article className="article-preview">
    <PostMeta/>
    <h2><a href="/blog/what-is-active-directory">What Is Active Directory?</a></h2>
    <p>{posts[0].description}</p>
    <a href="/blog/what-is-active-directory" className="text-link">Read the article →</a>
  </article>;
}
