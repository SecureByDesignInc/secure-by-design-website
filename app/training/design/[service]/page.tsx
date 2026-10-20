import { notFound } from 'next/navigation';
import DesignReference, { services } from '../design-reference';
import library from '../../../../content/videos.json';
import '../../../videos/videos.css';
import '../design-reference.css';
import { sharePreview } from '../../../share-preview';

// The full design reference for one infrastructure service (owner's compendium, 19 October 2026), in the Training Hub.
// Content: content/design-references.json, written by scripts/prepare-design-references.py from the compendium PDF.
const tileFor = (service: string) => library.references.find(item => item.id === `design-${service}`);

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const tile = tileFor(service);
  const title = tile ? `${tile.title}: Government & Vendor Guidelines` : 'Government & Vendor Guidelines';
  return { title, description: tile?.outcomeSummary, ...sharePreview(`${title} | Secure By Design`, tile?.outcomeSummary ?? '', `/training/design/${service}`) };
}

export default async function DesignReferencePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const entry = services.find(item => item.id === service);
  const tile = tileFor(service);
  if (!entry || !tile) notFound();
  return <DesignReference entry={entry} tile={tile} />;
}
