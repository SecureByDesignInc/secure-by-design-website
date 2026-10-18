import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {renderAppStores} from '../lib/app-stores.mjs';
import {renderFooterShare} from '../public/footer-share.mjs';
import {renderBookingLink} from '../lib/booking.mjs';
const postcss=createRequire(import.meta.resolve('vite'))('postcss');
const root=new URL('../',import.meta.url);
const partners=JSON.parse(readFileSync(new URL('content/partners.json',root),'utf8'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const bookingMarkup=renderBookingLink(JSON.parse(readFileSync(new URL('content/booking.json',root),'utf8')),'footer');
const platforms=JSON.parse(readFileSync(new URL('content/videos.json',root),'utf8')).platforms;
const appMarkup=renderAppStores(JSON.parse(readFileSync(new URL('content/app-stores.json',root),'utf8')));
const socialMarkup='<nav class="header-socials" aria-label="Follow Secure By Design"><span>Follow along</span><div>'+platforms.filter(platform=>platform.channelUrl).map(platform=>`<a href="${escape(platform.channelUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Secure By Design on ${escape(platform.name)} (opens in a new tab)"><img class="header-social-icon" src="/social/${escape(platform.id)}-sbd.svg" width="22" height="22" alt=""><span class="header-social-label">${escape(platform.name)}</span></a>`).join('')+'</div></nav>';
// Analytics were removed on October 8, 2026 (the Plausible subscription ended).
const stripTracking=html=>html.replace('<script defer src="/social-analytics.js"></script><script defer src="https://plausible.io/js/pa-oaHacw7Jud9vPNgvEaoem.js"></script>','');
const partnerMarkup='<div class="footer-partners" role="group" aria-label="Partner programs">'+partners.map(partner=>{
 return `<span class="footer-partner"><span class="footer-partner-logo"><img src="${escape(partner.logo)}" width="${partner.width}" height="${partner.height}" alt=""></span><span class="footer-partner-name">${escape(partner.label)}</span></span>`;
}).join('')+'</div>';
const pages=['careers','career-explorer','career-records','resource-subscribers','resource-preferences','community-contributions'];
for(const name of pages){
 const file=new URL('server/career-pages/'+name+'.html',root);const html=readFileSync(file,'utf8');
 const pattern=/<nav class="header-socials"[^>]*>[\s\S]*?<\/nav>|<div class="header-partners"[^>]*>[\s\S]*?<\/div>/;
 if(!pattern.test(html))throw new Error('Shared header links missing: '+name);
 const current=['career-explorer','careers'].includes(name)?'/careers':'';
 const links=JSON.parse(readFileSync(new URL('content/navigation.json',root),'utf8'));
 const navigation='<nav aria-label="Main navigation">'+links.map(([href,label])=>`<a href="${href}" class="nav-link"${href===current?' aria-current="page"':''}>${escape(label)}</a>`).join('')+'</nav>';
 const footerPattern=/<footer class="site-footer container">[\s\S]*?<\/footer>/;
 if(!footerPattern.test(html))throw new Error('Shared footer missing: '+name);
 const footer='<footer class="site-footer container"><a href="/" class="footer-brand">Secure By Design<span>© 2026</span></a>'+partnerMarkup+'<div class="footer-actions"><a href="/#about">About Secure By Design</a>'+bookingMarkup+'<a href="/privacy">Privacy</a>'+renderFooterShare()+'</div></footer>';
 const connect='<div class="header-connect">'+appMarkup+socialMarkup+'</div>';
 const connectPattern=/<div class="header-connect">[\s\S]*?(?:<\/section>|<\/nav>)<\/div>/;
 const updated=(connectPattern.test(html)?html.replace(connectPattern,connect):html.replace(pattern,connect)).replace(/<nav aria-label="Main navigation">[\s\S]*?<\/nav>/,navigation).replace(footerPattern,footer);
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
