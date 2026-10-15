'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';

type Entry = { code: string; name: string; slug: string };

// Every state is a plain link; the search box only narrows the list in the browser.
export default function StateFinder({ states }: { states: Entry[] }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const shown = term ? states.filter(state => state.name.toLowerCase().includes(term) || state.code.toLowerCase() === term) : states;
  return <div>
    <search className="cm-toolbar">
      <label className="cm-search">
        <Search size={17} aria-hidden="true" />
        <span className="cm-sr">Search states</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a state name or two-letter code…" autoComplete="off" />
      </label>
    </search>
    <p className="cm-result" role="status">Showing {shown.length} of {states.length}</p>
    <ul className="cm-states">
      {shown.map(state => <li key={state.code}>
        <a href={`/community/${state.slug}`}><span className="cm-code" aria-hidden="true">{state.code}</span><span>{state.name}</span></a>
      </li>)}
    </ul>
    {shown.length === 0 ? <p className="cm-empty">No state matches “{query}”.</p> : null}
  </div>;
}
