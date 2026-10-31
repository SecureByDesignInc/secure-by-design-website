// The homepage's way to the Live Threat Map, under the Cyber Range taster (owner's request, 31 October 2026). The map
// itself lives at /threat-map; nothing from Radware loads on the homepage.
export default function HomeThreatMapCard() {
  return <section className="cr-page home-tm-card" aria-labelledby="home-tm-title">
    <div className="cr-container">
      <a className="cr-tile home-tm-link" href="/threat-map">
        <span className="home-tm-copy">
          <span className="cr-kicker">Live Threat Map</span>
          <span id="home-tm-title" className="home-tm-title">The internet, under attack. <em>Right now.</em></span>
          <span className="home-tm-text">Watch attacks Radware recorded moments ago: where they start, where they land, and which kinds are most common today.</span>
        </span>
        <span className="cr-btn cr-btn-primary home-tm-cta">Open the Threat Map</span>
      </a>
    </div>
  </section>;
}
