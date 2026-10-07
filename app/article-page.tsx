import {ReadingProgress} from './reader-progress';
import posts from '../content/articles.json';
import CaseDiagram from './case-diagram';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/ui/collapsible';
type Post = (typeof posts)[number];
export default function ArticlePage({post}:{post:Post}) {
  const seriesPosts=post.seriesName?posts.filter(item=>item.seriesName===post.seriesName):[];
  const position=seriesPosts.findIndex(item=>item.slug===post.slug);
  const previous=position>0?seriesPosts[position-1]:undefined;
  const next=position>=0?seriesPosts[position+1]:undefined;
  const seriesParent=seriesPosts[0];
  const isSeriesParent=position===0&&seriesPosts.length>1;
  const isFoundationsIntroduction=post.slug==='what-is-active-directory';
  return <main id="main" className={'container editorial-article'+(post.title.length>40?' long-title':'')}>
    <header className="article-header">
      <a href={position>0?'/blog/'+seriesParent.slug:'/blog'} className="back-link">← {position>0?post.seriesName:'Technical Blog'}</a>
      <div className="post-meta"><span>{post.cisspDomainLabel}</span>{post.seriesName&&post.number!==1&&<span>Part {post.number} of {seriesPosts.length}</span>}<span>{post.minutes} min read</span></div>
      <h1>{post.title}</h1><p className="article-deck">{post.description}</p>
      <p className="byline">Secure By Design · {post.seriesName??post.topic}</p>
      {isSeriesParent&&<p className="series-shortcut"><a href="#continue-learning">Explore the rest of the series ↓</a></p>}
    </header>
    <div className="article-layout">
      <Collapsible className="article-contents" defaultOpen>
        <CollapsibleTrigger className="contents-trigger">In this article <span aria-hidden="true">⌄</span></CollapsibleTrigger>
        <CollapsibleContent className="article-contents-panel" keepMounted>
          <nav className="contents-links" aria-label="On this page">{post.toc.map(item=><a key={item.id} href={'#'+item.id}>{item.title}</a>)}<a href="#continue-learning">{isSeriesParent?'More in this series':'Keep going'}</a></nav>
        </CollapsibleContent>
      </Collapsible>
      <article className="article-body">
        <div className="article-text" dangerouslySetInnerHTML={{__html:post.intro}}/>
        <CaseDiagram slug={isFoundationsIntroduction?'inside-active-directory':post.slug}/>
        <div className="article-text" dangerouslySetInnerHTML={{__html:post.body}}/>
        <ReadingProgress id={"article:"+post.slug} path={"/blog/"+post.slug}/>
        <nav className="continue-reading" aria-label="Continue learning">
          <h2 id="continue-learning">{isSeriesParent?'Continue the Foundations series':next?'Keep going':post.seriesName?'That’s the Foundations series':'Keep exploring'}</h2>
          {isSeriesParent?<ol className="series-article-list" start={2}>{seriesPosts.slice(1).map(part=><li key={part.slug}><a href={'/blog/'+part.slug}>{part.title}</a><span className="series-domain">{part.cisspDomainLabel}</span></li>)}</ol>:next?<a className="next-article" href={'/blog/'+next.slug}><span>Next · Part {next.number}</span><strong>{next.title}</strong><span className="text-link">Read the next post →</span></a>:post.seriesName?<p>Want to go back over something? Pick another post, or take a look at the guides and labs planned for the Cyber Range.</p>:<p>Want to revisit the directory, identities, and permissions behind this setup? Start with <a href="/blog/what-is-active-directory">Active Directory Foundations</a>.</p>}
          <div className="series-return">{previous&&<a href={'/blog/'+previous.slug}>← Previous article</a>}{position>0&&<a href={'/blog/'+seriesParent.slug+'#continue-learning'}>All parts in this series</a>}<a href="/blog">Back to Technical Blog</a></div>
        </nav>
        <p className="range-note">Put these ideas into practice in the <a href="/training">Training Library</a>.</p>
      </article>
    </div>
  </main>;
}
