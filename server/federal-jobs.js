// Current federal IT and cybersecurity openings (job series 2210) for one state, from the USAJOBS Search API.
// Owner setup: request a free key at developer.usajobs.gov and add the Worker secrets USAJOBS_API_KEY and
// USAJOBS_EMAIL (the email the key was issued to; USAJOBS requires it as the User-Agent). Without them the
// endpoint answers {configured:false} and the state page shows its USAJOBS search link instead.
import states from '../content/community-states.json' with {type:'json'};

const byCode = new Map(states.map(state => [state.code, state]));
const json = (body, maxAge) => Response.json(body, { headers: { 'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store' } });
const text = value => (typeof value === 'string' ? value : '').replace(/\s+/g, ' ').trim().slice(0, 200);

// Keep only openings with a work location in the requested state, and only links to USAJOBS itself.
export function federalJobsFrom(data, state) {
  const items = data?.SearchResult?.SearchResultItems;
  if (!Array.isArray(items)) return [];
  const wanted = state.name.toLowerCase();
  const jobs = [];
  for (const item of items) {
    const job = item?.MatchedObjectDescriptor;
    if (!job) continue;
    const places = Array.isArray(job.PositionLocation) ? job.PositionLocation : [];
    const here = places.filter(place => text(place?.CountrySubDivisionCode).toLowerCase() === wanted);
    const url = text(job.PositionURI);
    if (!here.length || !/^https:\/\/(www\.)?usajobs\.gov\//.test(url)) continue;
    jobs.push({
      title: text(job.PositionTitle),
      organization: text(job.OrganizationName),
      location: here.length > 1 ? `${here.length} locations in ${state.name}` : text(here[0].LocationName) || state.name,
      url,
      closes: text(job.ApplicationCloseDate),
    });
    if (jobs.length === 8) break;
  }
  return jobs;
}

export async function federalJobsApi(request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  const state = byCode.get((new URL(request.url).searchParams.get('state') || '').toUpperCase());
  if (!state) return Response.json({ error: 'Unknown state.' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  if (!env?.USAJOBS_API_KEY || !env?.USAJOBS_EMAIL) return json({ configured: false, jobs: [] }, 300);

  // TEMPORARY (October 2026): ?debug=1 reports what USAJOBS returns for two queries, so the location request
  // and filter can be matched to its real response. Public job data only; no keys or visitor data. Remove after.
  if (new URL(request.url).searchParams.get('debug') === '1') {
    const probe = async params => {
      try {
        const upstream = await fetch(`https://data.usajobs.gov/api/search?${new URLSearchParams(params)}`, {
          headers: { Host: 'data.usajobs.gov', 'User-Agent': env.USAJOBS_EMAIL, 'Authorization-Key': env.USAJOBS_API_KEY },
        });
        const body = await upstream.text();
        let data = null;
        try { data = JSON.parse(body); } catch {}
        const items = data?.SearchResult?.SearchResultItems;
        return {
          status: upstream.status,
          topKeys: data ? Object.keys(data) : null,
          resultKeys: data?.SearchResult ? Object.keys(data.SearchResult) : null,
          count: data?.SearchResult?.SearchResultCount ?? null,
          countAll: data?.SearchResult?.SearchResultCountAll ?? null,
          items: Array.isArray(items) ? items.length : null,
          kept: data ? federalJobsFrom(data, state).length : null,
          sample: Array.isArray(items) ? items.slice(0, 3).map(item => ({
            title: text(item?.MatchedObjectDescriptor?.PositionTitle),
            uri: text(item?.MatchedObjectDescriptor?.PositionURI),
            locations: (item?.MatchedObjectDescriptor?.PositionLocation || []).slice(0, 3),
          })) : null,
          bodyStart: data ? null : body.slice(0, 300),
        };
      } catch (error) {
        return { failed: String(error?.message || error).slice(0, 200) };
      }
    };
    return json({
      state: state.name,
      byStateName: await probe({ JobCategoryCode: '2210', LocationName: state.name, ResultsPerPage: '10' }),
      seriesOnly: await probe({ JobCategoryCode: '2210', ResultsPerPage: '10' }),
      keywordOnly: await probe({ Keyword: 'cybersecurity', ResultsPerPage: '10' }),
    });
  }

  // One USAJOBS call per state every three hours at most.
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(`https://securebydesigninc.com/__cache/federal-jobs/${state.code}`);
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) return cached;

  const query = new URLSearchParams({ JobCategoryCode: '2210', LocationName: state.name, ResultsPerPage: '50', SortField: 'opendate', SortDirection: 'desc' });
  let jobs;
  try {
    const upstream = await fetch(`https://data.usajobs.gov/api/search?${query}`, {
      headers: { Host: 'data.usajobs.gov', 'User-Agent': env.USAJOBS_EMAIL, 'Authorization-Key': env.USAJOBS_API_KEY },
    });
    if (!upstream.ok) throw new Error(`USAJOBS ${upstream.status}`);
    jobs = federalJobsFrom(await upstream.json(), state);
  } catch {
    return json({ configured: true, jobs: [], error: true });
  }
  const response = json({ configured: true, jobs }, 1800);
  if (cache) {
    const stored = new Response(response.clone().body, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=10800' } });
    const put = cache.put(cacheKey, stored);
    if (ctx?.waitUntil) ctx.waitUntil(put); else await put;
  }
  return response;
}
