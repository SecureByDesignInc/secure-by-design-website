// A US design reference page (owner direction, 19 October 2026): the design reference for one infrastructure service
// from the owner's compendium, then its annotated source catalog. Blocks come from content/design-references.json
// (scripts/prepare-design-references.py rebuilds them from the compendium PDF): headings, paragraphs with
// bold/italic/code runs, nested lists, and tables. Sources are named, not linked: the compendium names each by
// publisher, title, date and status, and readers open it at the publisher's own site.
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Compass, FileText, Scale } from 'lucide-react';
import references from '../../../content/design-references.json';

type Span = { t: string; b?: boolean; i?: boolean; c?: boolean };
type Block =
  | { type: 'h2' | 'h3'; text: string; id?: string }
  | { type: 'p'; spans: Span[]; lead?: boolean }
  | { type: 'li'; spans: Span[]; level?: number; ordered?: boolean }
  | { type: 'table'; rows: string[][] };
type Section = { title: string; blocks: Block[]; areas?: string[] };
export type Service = { id: string; title: string; subtitle: string; topic: string; courses: string[]; design: Section | null; catalog: Section; stats: { areas: number; sources: number } };
type Tile = { title: string; subtitle: string; description: string; outcomeSummary: string; training: { guide: string; updated: string; relatedResources?: { title: string; detail: string; href: string }[] } };

export const services = references.services as unknown as Service[];
export const assembled = references.assembled;

function Spans({ spans }: { spans: Span[] }) {
  return <>{spans.map((span, index) => {
    let node: ReactNode = span.t;
    if (span.c) node = <code>{node}</code>;
    if (span.i) node = <em>{node}</em>;
    if (span.b) node = <strong>{node}</strong>;
    return <span key={index}>{node}</span>;
  })}</>;
}

// Consecutive list items become nested lists; everything else renders in order.
function Blocks({ blocks, prefix }: { blocks: Block[]; prefix: string }) {
  const out: ReactNode[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (block.type === 'li') {
      const items: Extract<Block, { type: 'li' }>[] = [];
      while (index < blocks.length && blocks[index].type === 'li') items.push(blocks[index++] as Extract<Block, { type: 'li' }>);
      out.push(<ListTree key={`${prefix}-l${index}`} items={items} level={0} />);
      continue;
    }
    const key = `${prefix}-${index}`;
    if (block.type === 'h2') out.push(<h2 key={key} id={block.id}>{block.text}</h2>);
    else if (block.type === 'h3') out.push(<h3 key={key} id={block.id}>{block.text}</h3>);
    else if (block.type === 'p') out.push(<p key={key} className={block.lead ? 'dr-lead' : undefined}><Spans spans={block.spans} /></p>);
    else if (block.type === 'table') out.push(<DataTable key={key} rows={block.rows} />);
    index++;
  }
  return <>{out}</>;
}

function ListTree({ items, level }: { items: Extract<Block, { type: 'li' }>[]; level: number }) {
  // Items at this level, each followed by its deeper children.
  const groups: { item: Extract<Block, { type: 'li' }>; children: Extract<Block, { type: 'li' }>[] }[] = [];
  for (const item of items) {
    const depth = item.level ?? 0;
    if (depth <= level || !groups.length) groups.push({ item, children: [] });
    else groups[groups.length - 1].children.push(item);
  }
  const ordered = groups[0]?.item.ordered;
  const Tag = ordered ? 'ol' : 'ul';
  return <Tag className="dr-list">{groups.map((group, index) => <li key={index}>
    <Spans spans={group.item.spans} />
    {group.children.length > 0 && <ListTree items={group.children} level={level + 1} />}
  </li>)}</Tag>;
}

function DataTable({ rows }: { rows: string[][] }) {
  if (!rows.length) return null;
  const [head, ...body] = rows;
  return <div className="dr-table-wrap"><table className="dr-table">
    <thead><tr>{head.map((cell, index) => <th key={index} scope="col">{cell}</th>)}</tr></thead>
    <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => index === 0 ? <th key={index} scope="row">{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}

export default function DesignReference({ entry, tile }: { entry: Service; tile: Tile }) {
  const design = entry.design;
  const sections = [
    ...(design ? [{ id: 'design', label: 'Design reference', headings: design.blocks.filter(block => block.type === 'h2') as { text: string; id?: string }[] }] : []),
    { id: 'catalog', label: 'Source catalog', headings: entry.catalog.blocks.filter(block => block.type === 'h2') as { text: string; id?: string }[] },
  ];
  return (
    <main id="main" className="vc-page dr-page">
      <div className="container dr-layout">
        <aside className="dr-side" aria-label="Contents">
          <Link className="dr-back" href="/technical-training#design-references"><ArrowLeft size={15} aria-hidden="true" /> Training Hub</Link>
          <p className="dr-side-title"><Compass size={16} aria-hidden="true" /> {tile.title}</p>
          {sections.map(section => <nav key={section.id} aria-label={section.label}>
            <p className="dr-side-label">{section.label}</p>
            <ol>{section.headings.map(heading => <li key={heading.id}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ol>
          </nav>)}
          <p className="dr-side-label">Apply it</p>
          <ul className="dr-side-courses">{(tile.training.relatedResources ?? []).map(resource => <li key={resource.href}><Link href={resource.href}><BookOpen size={14} aria-hidden="true" /> {resource.title}</Link></li>)}</ul>
        </aside>

        <article className="dr-content">
          <header className="dr-head">
            <p className="vc-kicker">TRAINING HUB · US DESIGN REFERENCE · {entry.topic.toUpperCase()}</p>
            <h1>{tile.title}</h1>
            <p className="dr-subtitle">{tile.subtitle}</p>
            <p className="dr-summary">{tile.description}</p>
            <ul className="dr-facts" aria-label="About this reference">
              {entry.stats.areas > 0 && <li><Scale size={14} aria-hidden="true" /> {entry.stats.areas} design areas</li>}
              <li><FileText size={14} aria-hidden="true" /> {entry.stats.sources} sources, US only</li>
              <li><BookOpen size={14} aria-hidden="true" /> Compendium assembled {assembled}</li>
            </ul>
            <p className="dr-method">Each source is named by publisher, title, date and status, and verified as of October 2026. Open it at the publisher&apos;s own site; nothing is hosted here. Sections headed &ldquo;Caveats&rdquo; list what could not be verified.</p>
          </header>

          {design && <section className="dr-section" aria-labelledby="dr-design-title">
            <h2 id="dr-design-title" className="dr-section-title">Design reference</h2>
            <p className="dr-section-source">{design.title}</p>
            <Blocks blocks={design.blocks} prefix="d" />
          </section>}

          <section className="dr-section" aria-labelledby="dr-catalog-title">
            <h2 id="dr-catalog-title" className="dr-section-title">Annotated source catalog</h2>
            <p className="dr-section-source">{entry.catalog.title}</p>
            <Blocks blocks={entry.catalog.blocks} prefix="c" />
          </section>

          <div className="vc-library-footer dr-footer">
            <p>Design it first. Then build it right.</p>
            <Link href={(tile.training.relatedResources ?? [])[0]?.href ?? '/technical-training'}>Apply it in the build course <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </article>
      </div>
    </main>
  );
}
