'use client';
import { useEffect, useState } from 'react';

type Job = { title: string; organization: string; location: string; url: string; closes: string };
type Result = { configured: boolean; jobs: Job[]; error?: boolean };

const closing = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

// Loads current federal openings for one state from the site's own endpoint, which asks USAJOBS.
// Without a USAJOBS API key, or when nothing is open, the USAJOBS search link stays the way in.
export default function FederalJobs({ code, name, searchUrl }: { code: string; name: string; searchUrl: string }) {
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/community/federal-jobs?state=${encodeURIComponent(code)}`)
      .then(response => response.json() as Promise<Result>)
      .then(data => { if (live) setResult(data); })
      .catch(() => { if (live) setResult({ configured: true, jobs: [], error: true }); });
    return () => { live = false; };
  }, [code]);

  const search = <a href={searchUrl} target="_blank" rel="noopener noreferrer">Search all federal openings in {name} on USAJOBS<span className="cm-sr"> (opens in a new tab)</span></a>;
  if (!result) return <p className="cm-status" role="status">Loading federal openings…</p>;
  if (!result.configured || result.error || result.jobs.length === 0) {
    const reason = !result.configured ? 'The live list of federal openings is coming soon.'
      : result.error ? 'USAJOBS didn’t answer just now.'
        : `No federal IT and cybersecurity openings in ${name} are listed right now.`;
    return <p className="cm-status">{reason} {search}</p>;
  }
  return <div>
    <ul className="cm-list cm-jobs">
      {result.jobs.map(job => <li key={job.url}>
        <div className="cm-job-main">
          <a href={job.url} target="_blank" rel="noopener noreferrer">{job.title}<span className="cm-sr"> (opens USAJOBS in a new tab)</span></a>
          <span>{job.organization}</span>
        </div>
        <span className="cm-meta">{job.location}</span>
        {job.closes ? <span className="cm-meta">Closes {closing(job.closes)}</span> : null}
      </li>)}
    </ul>
    <p className="cm-more cm-status">{search}</p>
  </div>;
}
