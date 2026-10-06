const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// Both the React header and generated Community pages use the same launch gate.
// Never link to a generic storefront or an invented app listing.
export function publishedStoreUrl(config, store) {
  if (config.enabled !== true || !store.listingUrl) return null;
  try {
    const url = new URL(store.listingUrl);
    const origin = new URL(store.storeUrl).origin;
    if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) return null;
    const isListing = store.id === 'google-play'
      ? url.pathname === '/store/apps/details' && Boolean(url.searchParams.get('id'))
      : store.id === 'microsoft-store'
        ? /^\/(?:store\/)?detail\/.+/.test(url.pathname)
        : /\/id\d+\/?$/.test(url.pathname);
    return isListing ? url.href : null;
  } catch { return null; }
}

export function renderAppStores(config) {
  const badges = config.stores.map(store => {
    const url = publishedStoreUrl(config, store);
    const label = `${store.name} for ${store.platform}${url ? ' (opens in a new tab)' : ` — ${store.availabilityDetail || 'coming soon, not available yet'}`}`;
    const image = `<img src="${escape(store.badge)}" alt="${escape(store.name)}" height="40">`;
    const control = url
      ? `<a class="app-store-badge" href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(label)}">${image}</a>`
      : `<button class="app-store-badge" type="button" disabled aria-disabled="true" aria-label="${escape(label)}">${image}</button>`;
    return `<div class="app-store-item app-store-${escape(store.id)}">${control}<span>${escape(store.platform)}</span>${!url && store.availability ? `<small class="app-store-availability" title="${escape(store.availabilityDetail || store.availability)}">${escape(store.availability)}</small>` : ''}</div>`;
  }).join('');
  return `<section class="header-app-stores" aria-label="${escape(config.heading || 'Get the app')}"><div class="app-store-heading"><strong>${escape(config.heading || 'Get the app')}</strong></div><div class="app-store-badges">${badges}</div></section>`;
}
