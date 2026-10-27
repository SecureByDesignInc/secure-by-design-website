import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Navigation from './navigation';
import FooterShare from './footer-share';
import partners from '../content/partners.json';
import videoLibrary from '../content/videos.json';
import appStores from '../content/app-stores.json';
import { renderAppStores } from '../lib/app-stores.mjs';
import bookingConfig from '../content/booking.json';
import { renderFollowAlong } from '../lib/follow-along.mjs';
import { siteSharePreview } from './share-preview';
import './globals.css';
import './brand-glow.css';
import './editorial.css';
import './template-shared.css';
import './reader-progress.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const mono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata:Metadata={title:{default:'Secure By Design — Cybersecurity & System Administration',template:'%s | Secure By Design'},description:'Let’s work through cybersecurity, identity, and system administration with clear explanations and examples you can follow.',icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'}],apple:[{url:'/apple-touch-icon.png',sizes:'180x180'}]},metadataBase:new URL('https://securebydesigninc.com'),...siteSharePreview('Secure By Design — Cybersecurity & System Administration','Let’s work through cybersecurity, identity, and system administration with clear explanations and examples you can follow.')};
// Owner direction, 26 October 2026: App availability and Follow along (which ends with Book a call) live in the
// footer, not the header. 27 October 2026: "Secure By Design © 2026" takes the place of "About Secure By Design"
// in the footer's links and appears nowhere else in the footer. Their markup is shared with the generated Community shells (scripts/prepare-career-shell.mjs).
const footerConnect=renderAppStores(appStores,'footer')+renderFollowAlong(videoLibrary.platforms,bookingConfig,'footer');
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en">
    <head>
    </head>
    <body className={sans.variable+' '+mono.variable+' site-editorial'}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header container">
        <div className="site-header-identity">
          <a href="/" className="brand"><img className="brand-logo" src="/brand-lock.svg" width="72" height="72" alt=""/><span className="brand-wordmark"><span><strong>Secure</strong> By Design</span><small>Educate. Empower. Secure the future.</small></span></a>
        </div>
        <Navigation/>
      </header>
      {children}
      <footer className="site-footer container">
        <div className="footer-connect" dangerouslySetInnerHTML={{__html: footerConnect}} />
        <div className="footer-bottom">
          <div className="footer-partners" role="group" aria-label="Partner programs">
            {partners.map(partner => <span key={partner.id} className="footer-partner">
              <span className="footer-partner-logo"><img src={partner.logo} width={partner.width} height={partner.height} alt="" /></span>
              <span className="footer-partner-name">{partner.label}</span>
            </span>)}
          </div>
          <div className="footer-actions"><a href="/">Secure By Design © 2026</a><a href="/privacy">Privacy</a><FooterShare /></div>
        </div>
      </footer>
    </body>
  </html>;
}
