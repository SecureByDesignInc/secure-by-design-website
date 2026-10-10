// Shared building blocks of an expanded Training Library tile. The identity build (1.1)
// and every course tile use the same companion: a heading, the training-materials
// panel beside the recording, and an explorer below (see episode-experience.tsx and
// course-experience.tsx), so all expanded tiles look and behave alike.
import type { ReactNode } from 'react';
import Image from 'next/image';
import { BookOpen, Check, Network, Video } from 'lucide-react';

export function CompanionHeading({ id, intro, action }: {
  id: string;
  intro: string;
  action: { href: string; label: string; icon: ReactNode; download?: boolean };
}) {
  return (
    <header className="vc-episode-heading">
      <div>
        <p className="vc-kicker">YOUR COURSE COMPANION</p>
        <h4 id={id}>Your training materials.</h4>
        <p>{intro}</p>
      </div>
      <a href={action.href} download={action.download || undefined}>
        {action.icon}
        {action.label}
      </a>
    </header>
  );
}

export type CompanionLink = {
  href: string;
  title: string;
  detail: string;
  icon: ReactNode;
  trailing: ReactNode;
  download?: boolean;
  newTab?: boolean;
};

export function CompanionMaterials({ id, cover, coverAlt, heading, summary, guide, links, edition }: {
  id: string;
  cover?: string;
  coverAlt: string;
  heading: [string, string];
  summary: string;
  guide: { href: string; title: string; detail: string; icon: ReactNode; trailing: ReactNode };
  links: CompanionLink[];
  edition?: ReactNode;
}) {
  return (
    <aside className="vc-training" aria-labelledby={id}>
      <div className="vc-training-top">
        <span className="vc-training-label">
          <BookOpen size={15} />
          YOUR TRAINING MATERIALS
        </span>
      </div>
      <div className="vc-workbook-intro">
        {cover && <Image src={cover} width={154} height={199} alt={coverAlt} loading="lazy" unoptimized />}
        <div>
          <h5 id={id}>
            {heading[0]}
            <br />
            {heading[1]}
          </h5>
          <p>{summary}</p>
        </div>
      </div>
      <a className="vc-guide-link" href={guide.href}>
        <span>
          {guide.icon}
          <span>
            <b>{guide.title}</b>
            <small>{guide.detail}</small>
          </span>
        </span>
        {guide.trailing}
      </a>
      <div className="vc-download-list">
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            download={link.download || undefined}
            target={link.newTab ? '_blank' : undefined}
            rel={link.newTab ? 'noopener' : undefined}
          >
            {link.icon}
            <span>
              <b>{link.title}</b>
              <small>{link.detail}</small>
            </span>
            {link.trailing}
          </a>
        ))}
      </div>
      {edition && <div className="vc-training-edition" aria-label="Edition and notices">{edition}</div>}
    </aside>
  );
}

export function CompanionWatch({ title, embedUrl, servers, tag, systems, detail, outcomesLabel = 'WHAT YOU WILL BUILD', outcomeSummary, outcomes }: {
  title: string;
  embedUrl: string | null;
  servers: boolean;
  tag: string;
  systems: string;
  detail: string;
  outcomesLabel?: string;
  outcomeSummary?: string;
  outcomes: string[];
}) {
  return (
    <div className="vc-watch">
      <div className="vc-video-surface">
        {embedUrl ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={`${title} — video walkthrough`}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="vc-recording-poster">
            <div className="vc-poster-top">
              <span>SECURE BY DESIGN</span>
              <span>THE NETWORK BUILD SERIES</span>
            </div>
            <div className="vc-poster-systems" aria-hidden="true">
              {servers ? (
                <>
                  <div className="vc-server-mini">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <span className="vc-poster-link" />
                  <div className="vc-server-mini">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </>
              ) : (
                <Network size={76} />
              )}
            </div>
            <div className="vc-poster-bottom">
              <div>
                <span>{tag}</span>
                <h5 className={systems.length > 14 ? 'vc-poster-long' : undefined}>{systems}</h5>
                <p>{detail}</p>
              </div>
              <span className="vc-coming">
                <Video size={15} />
                Video coming soon
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="vc-watch-note">
        <Video size={19} />
        <p>
          {embedUrl
            ? 'Watch the course video here, with the training materials alongside you.'
            : 'The recording is on its way. Start exploring with the interactive guide and companion workbook.'}
        </p>
      </div>
      <div className="vc-learning-outcomes">
        <span>{outcomesLabel}</span>
        {outcomeSummary && <p>{outcomeSummary}</p>}
        <div>
          {outcomes.map(text => (
            <span key={text}>
              <Check size={14} />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
