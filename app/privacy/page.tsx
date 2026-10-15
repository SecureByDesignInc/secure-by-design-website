import './privacy.css';
import { sharePreview } from '../share-preview';

export const metadata = {
  title: 'Privacy policy',
  description: 'What the Secure By Design website and app collect, why, who helps us run them, and how to delete your account.',
  ...sharePreview('Privacy policy | Secure By Design', 'What the Secure By Design website and app collect, why, who helps us run them, and how to delete your account.', '/privacy'),
};

const contact = 'support@securebydesigninc.com';
const deletionMail = `mailto:${contact}?subject=${encodeURIComponent('Delete my Secure By Design account')}`;

export default function Privacy() {
  return <main id="main" className="privacy-page">
    <article className="privacy container">
      <p className="privacy-kicker">Secure By Design · Privacy</p>
      <h1>Privacy policy</h1>
      <p className="privacy-meta">Effective 15 October 2026 · Applies to securebydesigninc.com and the Secure By Design app for iPhone, iPad, and Android</p>
      <p className="privacy-lead">Secure By Design Team LLC (“Secure By Design”, “we”) runs this website and app to teach cybersecurity. You can learn without an account. We collect only what we need to run accounts, keep your progress, and send emails you ask for. We don’t sell personal information, show ads, or track you across other sites and apps.</p>

      <nav className="privacy-toc" aria-label="On this page">
        <a href="#collect">What we collect</a><a href="#use">How we use it</a><a href="#providers">Who helps us</a>
        <a href="#keep">How long we keep it</a><a href="#choices">Your choices</a><a href="#delete-account">Delete your account</a><a href="#contact">Contact</a>
      </nav>

      <section id="collect" aria-labelledby="collect-title">
        <h2 id="collect-title">What we collect</h2>
        <h3>When you browse or use the app without an account</h3>
        <ul>
          <li>Course notes, checklists, and progress in the interactive guides and the app stay on your device unless you sign in.</li>
          <li>Our hosting provider receives the technical information every website request carries, such as your IP address and browser type, to deliver pages and protect the service. We use IP addresses briefly to limit repeated sign-in attempts and form submissions.</li>
        </ul>
        <h3>When you create or use an account</h3>
        <ul>
          <li><strong>Email address</strong>, to identify your account, send one-time sign-in codes, and help you recover access.</li>
          <li><strong>Password</strong>, if you set one, stored only as a salted scrypt hash. We can’t read it.</li>
          <li><strong>Apple, Google, or Microsoft sign-in</strong>, if you choose it: the account identifier that service gives us and the email address it shares. We never receive your password for that service. With Apple’s Hide My Email, we receive a private relay address. For Sign in with Apple we also keep the token Apple issues, so we can revoke our access when you remove Apple sign-in or delete your account.</li>
          <li><strong>Passkeys</strong>, if you add one: its public key and identifier, the kind of device you added it from, and when it was last used. Your fingerprint, face, or device PIN never leaves your device.</li>
          <li><strong>Learning records</strong>: course and lesson progress, saved materials, daily learning activity in the app (such as streak days and completed reviews), and the learning-path choices you make.</li>
          <li><strong>ATO Package Builder</strong>, if you use it: the practice systems you record there and their history, such as system descriptions, role names you enter, control statements, assessment results, evidence descriptions and excerpts, and POA&amp;M items. They are private to your account. Enter practice or fictional details, not real organizations’ sensitive information.</li>
          <li><strong>Community membership</strong>: when you sign in or verify your email, we record a free Community membership with your email, the date, and where you joined.</li>
          <li><strong>Sessions</strong>: a sign-in cookie on the website (up to 30 days) and a sign-in token in the app (up to 12 hours).</li>
        </ul>
        <h3>When you ask us to email you or send us a form</h3>
        <ul>
          <li>Resource emails: your email, optional name, when you confirmed, and when you unsubscribed. We send them only after you confirm.</li>
          <li>Optional getting-started emails from the app, only if you agree, with a record of that agreement.</li>
          <li>Forms: the career goals, community contribution, and resource sign-up forms are closed for now. We keep the name, email, and answers people sent before they closed, to read and reply to.</li>
        </ul>
        <h3>Optional app analytics</h3>
        <p>The app can share learning analytics only if you turn on <em>Share learning analytics</em>; it is off by default. When on, it sends app opens, lesson and resource actions, whether answers were correct, and feedback-board opens, with a random device ID and your platform. It never sends your name, email, answer text, or screen recordings.</p>
        <h3>Website page counts</h3>
        <p>The website uses Cloudflare Web Analytics to count page views and measure how quickly pages load. It doesn’t use cookies or local storage, doesn’t follow you across sites, and isn’t linked to your account.</p>
      </section>

      <section id="use" aria-labelledby="use-title">
        <h2 id="use-title">How we use it</h2>
        <ul>
          <li>To run your account, keep your progress and saved materials in step between the website and the app, and show your learning.</li>
          <li>To send sign-in codes, account messages, and the emails you asked for.</li>
          <li>To read and answer what you send us.</li>
          <li>To keep the service secure and stop abuse.</li>
          <li>To see which pages are visited and how quickly they load, from the website’s page counts.</li>
          <li>With analytics turned on, to see which lessons help and where learners get stuck.</li>
        </ul>
      </section>

      <section id="providers" aria-labelledby="providers-title">
        <h2 id="providers-title">Who helps us run the service</h2>
        <p>We share information only with these providers, to run the service, or when the law requires it.</p>
        <ul>
          <li><strong>Cloudflare</strong> hosts the website, its database, and the app’s connection to your account, and provides the website’s page counts (Cloudflare Web Analytics).</li>
          <li><strong>Apple</strong>, <strong>Google</strong>, and <strong>Microsoft</strong> confirm who you are when you choose to sign in with them, under their own privacy policies.</li>
          <li><strong>Resend</strong> delivers our emails.</li>
          <li><strong>PostHog</strong> (United States) receives app analytics, only if you turn them on. It anonymizes your IP address.</li>
          <li><strong>YouTube</strong> plays course videos in privacy-enhanced mode. The player loads from YouTube only when you open a course that has a published video.</li>
          <li><strong>Radware</strong> provides the live threat map on our homepage and in the app. The map loads from Radware when you open the homepage (as its Live Threat Map section comes into view) or open the map in the app; Radware then receives the technical information every web request carries, such as your IP address and browser type, and may set its own cookies and use its own analytics, under its own privacy policy.</li>
          <li><strong>UserJot</strong> hosts our public idea board. It opens in your browser only if you choose to visit it, and posts there are public.</li>
          <li><strong>Apple</strong> and <strong>Google</strong> distribute the app under their own privacy policies.</li>
        </ul>
      </section>

      <section id="keep" aria-labelledby="keep-title">
        <h2 id="keep-title">How long we keep it</h2>
        <ul>
          <li>Account information, sign-in methods, and learning records: while your account exists. Deleting your account in My Account or the app removes them immediately; email requests are completed within 30 days.</li>
          <li>Sign-in codes, sessions, and rate-limit records expire automatically.</li>
          <li>Email lists: until you unsubscribe. We keep a minimal record of an unsubscribe so we don’t email you again.</li>
          <li>Form submissions: until we have handled them and no longer need them, or until you ask us to delete them.</li>
        </ul>
      </section>

      <section id="choices" aria-labelledby="choices-title">
        <h2 id="choices-title">Your choices</h2>
        <ul>
          <li>Use the website and the app without an account.</li>
          <li>Clear your saved progress, add or remove sign-in methods, or delete your account from My Account at any time.</li>
          <li>Unsubscribe with the link in any email.</li>
          <li>Turn app analytics on or off in the app, under My Account. Turning it off stops future events and removes the analytics ID from your device.</li>
          <li>Ask us for a copy of your information, to correct it, or to delete it, by emailing <a href={`mailto:${contact}`}>{contact}</a>.</li>
        </ul>
      </section>

      <section id="delete-account" className="privacy-delete" aria-labelledby="delete-title">
        <h2 id="delete-title">Delete your Secure By Design account</h2>
        <p>This applies to accounts used on securebydesigninc.com and in the Secure By Design app. Deletion is immediate and can’t be undone.</p>
        <ul>
          <li><strong>On the website:</strong> sign in, open <a href="/my-progress#delete-account">My Account</a>, choose <em>Delete my account</em>, and type DELETE to confirm.</li>
          <li><strong>In the app:</strong> open My Account, choose <em>Delete your account</em>, and confirm.</li>
          <li><strong>By email:</strong> if you can’t sign in, email <a href={deletionMail}>{contact}</a> from the address on your account with the subject “Delete my Secure By Design account”. We may reply to confirm the request comes from you, and we complete it within 30 days.</li>
        </ul>
        <p>Deleting your account removes your account, password, sign-in methods and passkeys, sessions, learning progress, saved materials, learning activity, learning-path choices, ATO Package Builder systems, Community membership, and email preferences.</p>
        <p>We keep only what the law requires, plus the minimal unsubscribe record that stops further emails. Progress stored only on your device is removed when you sign out of the app and delete it, or clear your browser’s site data.</p>
      </section>

      <section aria-labelledby="children-title">
        <h2 id="children-title">Children</h2>
        <p>Secure By Design is made for adults and older teens learning cybersecurity. It isn’t directed to children under 13, and we don’t knowingly collect their information. If you believe a child has given us information, contact us and we will delete it.</p>
      </section>

      <section aria-labelledby="security-title">
        <h2 id="security-title">Security</h2>
        <p>Connections use HTTPS, passwords are hashed, and only Secure By Design can open account and form records. No system is perfectly secure, so please use a password you don’t use anywhere else.</p>
      </section>

      <section aria-labelledby="changes-title">
        <h2 id="changes-title">Changes</h2>
        <p>If we change this policy, we will update the effective date above. For significant changes we will tell account holders by email or in the app.</p>
      </section>

      <section id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact</h2>
        <p>Secure By Design Team LLC · <a href={`mailto:${contact}`}>{contact}</a></p>
      </section>
    </article>
  </main>;
}
