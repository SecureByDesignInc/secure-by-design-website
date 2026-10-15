// Owner request, 14 October 2026: publish Community & Careers at /community with a page for every state and DC,
// state links from official sources, and current federal openings from USAJOBS.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { federalJobsApi, federalJobsFrom, usajobsLink } from '../server/federal-jobs.js';

const states = JSON.parse(fs.readFileSync('content/community-states.json', 'utf8'));
const nav = JSON.parse(fs.readFileSync('content/navigation.json', 'utf8'));
const request = (query, method = 'GET') => new Request(`https://securebydesigninc.com/api/community/federal-jobs${query}`, { method });

test('every state and Washington, DC has a page with a unique code and address', () => {
  assert.equal(states.length, 51);
  const codes = new Set(states.map(state => state.code)), slugs = new Set(states.map(state => state.slug));
  assert.equal(codes.size, 51);
  assert.equal(slugs.size, 51);
  for (const code of ['CA', 'DC', 'NY', 'TX', 'VA', 'WY', 'AK', 'HI']) assert.ok(codes.has(code), code);
  for (const state of states) assert.match(state.slug, /^[a-z]+(-[a-z]+)*$/, state.name);
});

test('state links are HTTPS addresses with names, and most states have all three', () => {
  let complete = 0;
  for (const state of states) {
    const links = ['stateJobs', 'workforceAgency', 'jobBoard'].filter(key => state[key]);
    if (links.length === 3) complete++;
    for (const key of links) {
      assert.ok(state[key].label.trim(), `${state.code} ${key} label`);
      const url = new URL(state[key].url);
      assert.equal(url.protocol, 'https:', `${state.code} ${key}`);
      assert.ok(!url.username && !url.password, `${state.code} ${key}`);
    }
  }
  assert.ok(complete >= 45, `${complete} states have all three links`);
});

test('Community is one main navigation entry and the sitemap lists the hub and every state page', () => {
  assert.equal(nav.filter(([href]) => href === '/community').length, 1);
  assert.ok(!nav.some(([href]) => href === '/careers' || href === '/career-explorer'), 'the retired /careers pages stay out of the navigation');
  const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
  assert.ok(sitemap.includes('<loc>https://securebydesigninc.com/community</loc>'));
  for (const state of states) assert.ok(sitemap.includes(`<loc>https://securebydesigninc.com/community/${state.slug}</loc>`), state.slug);
});

test('without a USAJOBS key the endpoint says so, and unknown states and other methods are refused', async () => {
  const response = await federalJobsApi(request('?state=va'), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { configured: false, jobs: [] });
  assert.equal((await federalJobsApi(request('?state=ZZ'), {})).status, 400);
  assert.equal((await federalJobsApi(request(''), {})).status, 400);
  assert.equal((await federalJobsApi(request('?state=VA', 'POST'), {})).status, 405);
});

const item = (title, places, uri = 'https://www.usajobs.gov:443/job/123') => ({ MatchedObjectDescriptor: {
  PositionTitle: title, OrganizationName: 'Example Agency', PositionURI: uri, ApplicationCloseDate: '2026-11-01T23:59:59.997',
  PositionLocation: places.map(([LocationName, CountrySubDivisionCode]) => ({ LocationName, CountrySubDivisionCode })),
} });

test('only openings located in the state and linking to USAJOBS are shown', () => {
  const virginia = states.find(state => state.code === 'VA');
  const jobs = federalJobsFrom({ SearchResult: { SearchResultItems: [
    item('IT Specialist (INFOSEC)', [['Arlington, Virginia', 'Virginia']]),
    item('IT Specialist (Elsewhere)', [['Denver, Colorado', 'Colorado']]),
    item('IT Specialist (West Virginia)', [['Charleston, West Virginia', 'West Virginia']]),
    item('Off-site link', [['Norfolk, Virginia', 'Virginia']], 'https://example.com/job'),
    item('Multi-site', [['Norfolk, Virginia', 'Virginia'], ['Richmond, Virginia', 'Virginia']], 'https://www.usajobs.gov/job/456'),
  ] } }, virginia);
  assert.deepEqual(jobs.map(job => job.title), ['IT Specialist (INFOSEC)', 'Multi-site']);
  assert.equal(jobs[0].location, 'Arlington, Virginia');
  assert.equal(jobs[1].location, '2 locations in Virginia');
  assert.deepEqual(federalJobsFrom({}, virginia), []);
});

test('with a key, the endpoint asks USAJOBS for series 2210 in the state and reports upstream failures', async () => {
  const before = globalThis.fetch, calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), headers: options.headers });
      return Response.json({ SearchResult: { SearchResultItems: [item('IT Specialist', [['Austin, Texas', 'Texas']])] } });
    };
    const env = { USAJOBS_API_KEY: 'test-key', USAJOBS_EMAIL: 'owner@example.invalid' };
    const body = await (await federalJobsApi(request('?state=TX'), env)).json();
    assert.equal(body.configured, true);
    assert.equal(body.jobs.length, 1);
    const url = new URL(calls[0].url);
    assert.equal(url.origin, 'https://data.usajobs.gov');
    assert.equal(url.searchParams.get('JobCategoryCode'), '2210');
    assert.equal(url.searchParams.get('LocationName'), 'Texas');
    assert.equal(calls[0].headers['Authorization-Key'], 'test-key');
    assert.equal(calls[0].headers['User-Agent'], 'owner@example.invalid');
    globalThis.fetch = async () => new Response('busy', { status: 503 });
    assert.deepEqual(await (await federalJobsApi(request('?state=OH'), env)).json(), { configured: true, jobs: [], error: true });
  } finally {
    globalThis.fetch = before;
  }
});

test('USAJOBS links keep their address without the :443 port, and other sites are refused', () => {
  assert.equal(usajobsLink('https://www.usajobs.gov:443/job/850999700'), 'https://www.usajobs.gov/job/850999700');
  assert.equal(usajobsLink('https://www.usajobs.gov/job/1'), 'https://www.usajobs.gov/job/1');
  for (const bad of ['http://www.usajobs.gov/job/1', 'https://usajobs.gov.example.com/job/1', 'https://example.com/job', 'javascript:alert(1)', '', null]) assert.equal(usajobsLink(bad), '', String(bad));
});
