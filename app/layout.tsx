import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Navigation from './navigation';
import FooterShare from './footer-share';
import partners from '../content/partners.json';
import videoLibrary from '../content/videos.json';
import appStores from '../content/app-stores.json';
import { renderAppStores } from '../lib/app-stores.mjs';
import './globals.css';
import './brand-glow.css';
import './editorial.css';
import './template-shared.css';
import './reader-progress.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const mono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata:Metadata={title:{default:'Secure By Design — Cybersecurity & System Administration',template:'%s | Secure By Design'},description:'Let’s work through cybersecurity, identity, and system administration with clear explanations and examples you can follow.',icons:{icon:[{url:'/brand-lock.svg',type:'image/svg+xml'}]},metadataBase:new URL('https://securebydesigninc.com')};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en">
    <head>
    </head>
    <body className={sans.variable+' '+mono.variable+' site-editorial'}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header container">
        <div className="site-header-identity">
          <a href="/" className="brand" aria-label="Secure By Design home"><img className="brand-logo" src="/brand-lock.svg" width="72" height="72" alt=""/><span className="brand-wordmark"><span><strong>Secure</strong> By Design</span><small>Educate. Empower. Secure the future.</small></span></a>
          <div className="header-connect">
          <div dangerouslySetInnerHTML={{__html: renderAppStores(appStores)}} />
          <nav className="header-socials" aria-label="Follow Secure By Design">
            <span>Follow along</span>
            <div>{videoLibrary.platforms.filter(platform => platform.channelUrl).map(platform => <a key={platform.id} href={platform.channelUrl} target="_blank" rel="noopener noreferrer" aria-label={`Secure By Design on ${platform.name} (opens in a new tab)`}><img className="header-social-icon" src={`/social/${platform.id}-sbd.svg`} width="22" height="22" alt="" />{platform.name}</a>)}
            </div>
          </nav>
          </div>
        </div>
        <Navigation/>
      </header>
      {children}
      <footer className="site-footer container">
        <a href="/" className="footer-brand">Secure By Design<span>© 2026</span></a>
        <div className="footer-partners" role="group" aria-label="Partner programs">
          {partners.map(partner => <span key={partner.id} className="footer-partner">
            <span className="footer-partner-logo"><img src={partner.logo} width={partner.width} height={partner.height} alt="" /></span>
            <span className="footer-partner-name">{partner.label}</span>
          </span>)}
        </div>
        <div className="footer-actions"><a href="/#about">About Secure By Design</a><a href="/privacy">Privacy</a><FooterShare /></div>
      </footer>
    </body>
  </html>;
}
