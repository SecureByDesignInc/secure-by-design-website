import './privacy.css';

export const metadata = {
  title: 'Privacy policy',
  description: 'What the Secure By Design website and app collect, why, who helps us run them, and how to delete your account.',
};

const contact = 'support@securebydesigninc.com';
const deletionMail = `mailto:${contact}?subject=${encodeURIComponent('Delete my Secure By Design account')}`;

export default function Privacy() {
  return <main id="main" className="privacy-page">
    <article className="privacy container">
      <p className="privacy-kicker">Secure By Design · Privacy</p>
      <h1>Privacy policy</h1>
      <p className="privacy-meta">Effective 8 October 2026 · Applies to securebydesigninc.com and the Secure By Design app for iPhone, iPad, and Android</p>
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
          <li><strong>Password</strong>, stored only as a salted scrypt hash. We can’t read it.</li>
          <li><strong>Learning records</strong>: course and lesson progress, saved materials, daily learning activity in the app (such as streak days and completed reviews), and the learning-path choices you make.</li>
          <li><strong>Community membership</strong>: when you sign in or submit your email in a form, we record a free Community membership with your email, the date, and where you joined.</li>
          <li><strong>Sessions</strong>: a sign-in cookie on the website (up to 30 days) and a sign-in token in the app (up to 12 hours).</li>
        </ul>
        <h3>When you ask us to email you or send us a form</h3>
        <ul>
          <li>Resource emails: your email, optional name, when you confirmed, and when you unsubscribed. We send them only after you confirm.</li>
          <li>Optional getting-started emails from the app, only if you agree, with a record of that agreement.</li>
          <li>Forms such as career goals or resource suggestions: the name, email, and answers you choose to send, for us to read and reply to.</li>
        </ul>
        <h3>Optional app analytics</h3>
        <p>The app can share learning analytics only if you turn on <em>Share learning analytics</em>; it is off by default. When on, it sends app opens, lesson and resource actions, whether answers were correct, and feedback-board opens, with a random device ID and your platform. It never sends your name, email, answer text, or screen recordings. The website does not use analytics.</p>
      </section>

      <section id="use" aria-labelledby="use-title">
        <h2 id="use-title">How we use it</h2>
        <ul>
          <li>To run your account, keep your progress and saved materials in step between the website and the app, and show your learning.</li>
          <li>To send sign-in codes, account messages, and the emails you asked for.</li>
          <li>To read and answer what you send us.</li>
          <li>To keep the service secure and stop abuse.</li>
          <li>With analytics turned on, to see which lessons help and where learners get stuck.</li>
        </ul>
      </section>

      <section id="providers" aria-labelledby="providers-title">
        <h2 id="providers-title">Who helps us run the service</h2>
        <p>We share information only with these providers, to run the service, or when the law requires it.</p>
        <ul>
          <li><strong>Cloudflare</strong> hosts the website, its database, and the app’s connection to your account.</li>
          <li><strong>Resend</strong> delivers our emails.</li>
          <li><strong>PostHog</strong> (United States) receives app analytics, only if you turn them on. It anonymizes your IP address.</li>
          <li><strong>YouTube</strong> plays course videos in privacy-enhanced mode. A video loads from YouTube only when you choose to play it.</li>
          <li><strong>UserJot</strong> hosts our public idea board. It opens in your browser only if you choose to visit it, and posts there are public.</li>
          <li><strong>Apple</strong> and <strong>Google</strong> distribute the app under their own privacy policies.</li>
        </ul>
      </section>

      <section id="keep" aria-labelledby="keep-title">
        <h2 id="keep-title">How long we keep it</h2>
        <ul>
          <li>Account information and learning records: while your account exists. When you ask us to delete your account, we delete them within 30 days.</li>
          <li>Sign-in codes, sessions, and rate-limit records expire automatically.</li>
          <li>Email lists: until you unsubscribe. We keep a minimal record of an unsubscribe so we don’t email you again.</li>
          <li>Form submissions: until we have handled them and no longer need them, or until you ask us to delete them.</li>
        </ul>
      </section>

      <section id="choices" aria-labelledby="choices-title">
        <h2 id="choices-title">Your choices</h2>
        <ul>
          <li>Use the website and the app without an account.</li>
          <li>Clear your saved progress from My Account at any time.</li>
          <li>Unsubscribe with the link in any email.</li>
          <li>Turn app analytics on or off in the app, under My Account. Turning it off stops future events and removes the analytics ID from your device.</li>
          <li>Ask us for a copy of your information, to correct it, or to delete it, by emailing <a href={`mailto:${contact}`}>{contact}</a>.</li>
        </ul>
      </section>

      <section id="delete-account" className="privacy-delete" aria-labelledby="delete-title">
        <h2 id="delete-title">Delete your Secure By Design account</h2>
        <p>This applies to accounts used on securebydesigninc.com and in the Secure By Design app. The app links here from My Account → <em>Delete your account</em>.</p>
        <ol>
          <li>Email <a href={deletionMail}>{contact}</a> <strong>from the email address on your account</strong>, with the subject “Delete my Secure By Design account”.</li>
          <li>We may reply to confirm the request comes from you.</li>
          <li>Within 30 days we delete your account, password, sessions, learning progress, saved materials, learning activity, learning-path choices, Community membership, and email preferences, and we confirm by email.</li>
        </ol>
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
