import './prepare-career-shell.mjs';
import './prepare-career-explorer.mjs';
import './prepare-network-text.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../content/', import.meta.url);
const series = JSON.parse(readFileSync(new URL('series.json', root), 'utf8'));
const standalone = JSON.parse(readFileSync(new URL('posts.json', root), 'utf8'));
const cisspDomains = JSON.parse(readFileSync(new URL('cissp-domains.json', root), 'utf8'));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function inline(value) {
  const tokens = [];
  const protect = html => `\u0000${tokens.push(html)-1}\u0000`;
  let text = value.replace(/`([^`]+)`/g, (_,code) => protect('<code>'+escape(code)+'</code>'));
  text = text.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_,label,url) => {
    if (!/^https:\/\//.test(url) && !/^\/(?!\/)/.test(url)) throw new Error('Unsupported content link: '+url);
    return protect('<a href="'+escape(url)+'">'+escape(label)+'</a>');
  });
  return escape(text).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\u0000(\d+)\u0000/g,(_,index)=>tokens[Number(index)]);
}
function preparePost(post) {
  if (!Number.isInteger(post.cisspDomain) || !Object.hasOwn(cisspDomains, post.cisspDomain)) throw new Error('Choose a valid primary CISSP domain for '+post.slug);
  const cisspDomainLabel = cisspDomains[post.cisspDomain];
  const md = readFileSync(new URL(post.file,root),'utf8').replaceAll('\r\n','\n');
  const toc = [];
  const ids = new Set();
  const html = md.trim().split(/\n\s*\n/).slice(1).map(block => {
    const heading = block.match(/^(#{1,3}) (.+)$/);
    if (heading) {
      const level = heading[1].length;
      const id = heading[2].toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/ +/g,'-');
      if (ids.has(id)) throw new Error('Duplicate heading in '+post.slug+': '+id);
      ids.add(id);
      if (level === 2) toc.push({id,title:heading[2]});
      return `<h${level} id="${id}">${inline(heading[2])}</h${level}>`;
    }
    if (block.startsWith('- ')) return '<ul>'+block.split('\n').map(line=>'<li>'+inline(line.slice(2))+'</li>').join('')+'</ul>';
    return '<p>'+inline(block.replaceAll('\n',' '))+'</p>';
  }).join('\n');
  const split = html.indexOf('<h2');
  return {...post,cisspDomainLabel,minutes:Math.ceil(md.split(/\s+/).length/190),intro:split<0?html:html.slice(0,split),body:split<0?'':html.slice(split),html,toc};
}
const foundations = series.map((post,index) => preparePost({...post,seriesName:'Active Directory Foundations',number:index+1,draft:post.draft??index>0}));
const independentPosts = standalone.map(post => preparePost({...post,seriesName:null,number:null,draft:post.draft??true}));
const posts = [foundations[0], ...independentPosts, ...foundations.slice(1)];
if (new Set(posts.map(post => post.slug)).size !== posts.length) throw new Error('Duplicate article slug');
writeFileSync(new URL('articles.json',root),JSON.stringify(posts,null,2));
writeFileSync(new URL('article-progress.json',root),JSON.stringify(posts.map(({slug,title})=>({slug,title})),null,2));
writeFileSync(new URL('active-directory.json',root),JSON.stringify({html:posts[0].html,toc:posts[0].toc}));
console.log(`Prepared ${posts.length} complete articles.`);
