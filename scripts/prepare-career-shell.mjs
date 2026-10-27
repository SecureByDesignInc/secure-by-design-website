import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {renderAppStores} from '../lib/app-stores.mjs';
import {renderFooterShare} from '../public/footer-share.mjs';
import {renderFollowAlong,renderFooterConnect} from '../lib/follow-along.mjs';
const postcss=createRequire(import.meta.resolve('vite'))('postcss');
const root=new URL('../',import.meta.url);
const partners=JSON.parse(readFileSync(new URL('content/partners.json',root),'utf8'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const bookingConfig=JSON.parse(readFileSync(new URL('content/booking.json',root),'utf8'));
const platforms=JSON.parse(readFileSync(new URL('content/videos.json',root),'utf8')).platforms;
// Owner direction, 26 October 2026: App availability and Follow along (ending with Book a call) are in the
// footer, not the header, matching the React layout.
const appStores=JSON.parse(readFileSync(new URL('content/app-stores.json',root),'utf8'));
const connectMarkup=renderFooterConnect(renderAppStores(appStores,'footer'),renderFollowAlong(platforms,bookingConfig,'footer'));
// Analytics were removed on October 8, 2026 (the Plausible subscription ended).
const stripTracking=html=>html.replace('<script defer src="/social-analytics.js"></script><script defer src="https://plausible.io/js/pa-oaHacw7Jud9vPNgvEaoem.js"></script>','');
const partnerMarkup='<div class="footer-partners" role="group" aria-label="Partner programs">'+partners.map(partner=>{
 return `<span class="footer-partner"><span class="footer-partner-logo"><img src="${escape(partner.logo)}" width="${partner.width}" height="${partner.height}" alt=""></span><span class="footer-partner-name">${escape(partner.label)}</span></span>`;
}).join('')+'</div>';
const pages=['careers','career-explorer','career-records','resource-subscribers','resource-preferences','community-contributions'];
for(const name of pages){
 const file=new URL('server/career-pages/'+name+'.html',root);const html=readFileSync(file,'utf8');
 if(!/<div class="site-header-identity">/.test(html))throw new Error('Shared header missing: '+name);
 const current=['career-explorer','careers'].includes(name)?'/careers':'';
 const links=JSON.parse(readFileSync(new URL('content/navigation.json',root),'utf8'));
 const navigation='<nav aria-label="Main navigation">'+links.map(([href,label])=>`<a href="${href}" class="nav-link"${href===current?' aria-current="page"':''}>${escape(label)}</a>`).join('')+'</nav>';
 const footerPattern=/<footer class="site-footer container">[\s\S]*?<\/footer>/;
 if(!footerPattern.test(html))throw new Error('Shared footer missing: '+name);
 const footer='<footer class="site-footer container"><div class="footer-top"><a href="/" class="footer-brand">Secure By Design<span>© 2026</span></a>'+connectMarkup+'</div><div class="footer-bottom">'+partnerMarkup+'<div class="footer-actions"><a href="/#about">About Secure By Design</a><a href="/privacy">Privacy</a>'+renderFooterShare()+'</div></div></footer>';
 // The header keeps only the branding and the navigation; drop the connect block older shells carried in the header.
 const headerConnectPattern=/<div class="header-connect">[\s\S]*?<\/nav><\/div>/;
 const updated=html.replace(headerConnectPattern,'').replace(/<nav aria-label="Main navigation">[\s\S]*?<\/nav>/,navigation).replace(footerPattern,footer);
 if(/header-connect|header-socials|header-app-stores/.test(updated))throw new Error('Header connect block left behind: '+name);
 const shared=updated.includes('src="/footer-share-boot.mjs"')?updated:updated.replace('</body>','<script type="module" src="/footer-share-boot.mjs"></script></body>');
 writeFileSync(file,stripTracking(shared));
}
const include=s=>/^(?:\*|:root|body|a|a:hover)$/.test(s)||/^body\.site-editorial$/.test(s)||/\.(?:site-header|site-footer|brand(?:-logo|-wordmark)?|footer-brand|container|skip-link)(?![\w-])/.test(s)||/^body\.site-editorial [ab][^,]*:focus-visible$/.test(s);
const out=postcss.root();
for(const file of ['app/globals.css','app/brand-glow.css','app/editorial.css']){
 const css=postcss.parse(readFileSync(new URL(file,root),'utf8'));
 function copy(from,to){for(const node of from.nodes||[]){
  if(node.type==='rule'){
   const selectors=node.selectors.filter(include);
   if(selectors.length)to.append(node.clone({selector:selectors.join(', ')}));
  }else if(node.type==='atrule'&&['media','supports'].includes(node.name)){
   const group=node.clone({nodes:[]});copy(node,group);if(group.nodes.length)to.append(group);
  }
 }}copy(css,out);
}
writeFileSync(new URL('public/career-shell.css',root),'/* Generated from the shared website styles. Run prepare-content to refresh. */\n'+out.toString()+'\n'+readFileSync(new URL('app/template-shared.css',root),'utf8'));
