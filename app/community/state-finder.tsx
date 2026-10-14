'use client';
import { useState } from 'react';

type Entry = { code: string; name: string; slug: string };

// Every state is a plain link; the search box only narrows the list in the browser.
export default function StateFinder({ states }: { states: Entry[] }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const shown = term ? states.filter(state => state.name.toLowerCase().includes(term) || state.code.toLowerCase() === term) : states;
  return <div className="state-finder">
    <label className="state-finder-search">
      <span>Search states</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="State name or two-letter code" autoComplete="off" />
    </label>
    <ul className="state-finder-list">
      {shown.map(state => <li key={state.code}>
        <a href={`/community/${state.slug}`}><span className="state-finder-code" aria-hidden="true">{state.code}</span><span>{state.name}</span></a>
      </li>)}
    </ul>
    {shown.length === 0 ? <p className="state-finder-empty" role="status">No state matches “{query}”.</p> : null}
  </div>;
}
