'use client';

// The expanded tile for course 1.1, the identity build: heading, materials panel and
// recording column, then the shared interactive build explorer (build-explorer.tsx),
// which draws DC01 and DC02 from the guide's scene like every other course tile
// (owner request, 18 October 2026). Choosing a chapter seeks the recording to it.
import { useState } from 'react';
import { ArrowDown, ArrowUpRight, BookOpen, Download, Network } from 'lucide-react';
import { getYouTubeEmbedUrl, supportsIdentityScene } from './video-utils';

import type { Episode } from './catalog-types';
import { CompanionHeading, CompanionMaterials, CompanionWatch } from './companion';
import BuildExplorer, { type ExplorerStep } from './build-explorer';

export default function EpisodeExperience({ episode }: { episode: Episode }) {
  const [videoStart, setVideoStart] = useState<number | null>(null);
  const supportsScene = supportsIdentityScene(episode);
  const embedUrl = getYouTubeEmbedUrl(episode.youtubeId, videoStart);
  const steps: ExplorerStep[] = episode.chapters.map((chapter, index) => ({
    id: chapter.id,
    label: chapter.label,
    title: chapter.title,
    summary: chapter.description,
    note: { label: 'IN THE NETWORK', text: chapter.network },
    links: [{ href: `${episode.training.guide}#${chapter.id}`, label: `Open chapter ${index + 1} in the guide` }],
  }));
  if (!steps.length) return null;

  return (
    <div className="vc-experience">
      <section
        className="vc-episode"
        aria-labelledby={`episode-resources-${episode.id}`}
      >
        <CompanionHeading
          id={`episode-resources-${episode.id}`}
          intro="Start with the interactive guide, or download every training material in one file."
          action={{ href: episode.training.guide, label: 'Open the full guide', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${episode.id}`}
            cover={episode.training.cover}
            coverAlt={`Secure By Design companion workbook for ${episode.title}`}
            heading={['Keep the knowledge.', 'Build with confidence.']}
            summary={`${episode.training.pages} pages of explanations, configuration steps, security reasoning, and evidence prompts.`}
            guide={{ href: episode.training.guide, title: 'Open the interactive guide', detail: '3D network · chapter checks · your notes', icon: <Network size={20} />, trailing: <ArrowUpRight size={19} /> }}
            links={[
              { href: episode.training.word, title: 'Download the workbook', detail: `Word · ${episode.training.pages}-page workbook`, icon: <Download size={19} />, trailing: <ArrowDown size={16} />, download: true },
            ]}
            edition={(episode.training.materialsEdition || episode.training.copyrightOwner || episode.training.notices) && <>
              {episode.training.materialsEdition && (
                <p>
                  Course {episode.number} · Materials edition{' '}
                  {episode.training.materialsEdition}
                  {episode.training.updated && <> · Updated {episode.training.updated}</>}
                </p>
              )}
              {episode.training.copyrightOwner && (
                <p>
                  © {episode.training.copyrightYear}{' '}
                  {episode.training.copyrightOwner}.
                </p>
              )}
              {episode.training.notices && <a href={episode.training.notices}>Notices and permissions</a>}
            </>}
          />
          <CompanionWatch
            title={episode.title}
            embedUrl={embedUrl}
            servers={supportsScene}
            tag={episode.tags[0]}
            systems={episode.systems.join(' + ')}
            detail={episode.tags.slice(1).join(' & ')}
            outcomeSummary={episode.outcomeSummary}
            outcomes={episode.outcomes}
          />
        </div>
      </section>

      <BuildExplorer
        id={episode.id}
        kicker="INTERACTIVE BUILD EXPLORER"
        heading={episode.subtitle}
        storyLabel="THE BUILD STORY"
        unit="chapter"
        steps={steps}
        initial={Math.min(2, steps.length - 1)}
        sceneUrl={supportsScene ? `${episode.training.guide.replace(/\/index\.html$/, '').replace(/\/$/, '')}/scene.json` : null}
        systems={episode.systems.join(' + ')}
        networkLabel={episode.networkLabel}
        guideHref={episode.training.guide}
        onStep={index => setVideoStart(episode.chapters[index]?.timestamp ?? null)}
      />
    </div>
  );
}
