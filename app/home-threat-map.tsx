import ThreatMapFrame from './threat-map/threat-map-frame';

// The Live Threat Map, on the homepage right after the hero (owner's request, 15 October 2026; it replaced
// "A note from Secure By Design", "Start building your network", the live threat window and the separate
// /threat-map page, which now redirects here). Radware's map loads in a sandboxed frame when the page opens
// (it comes from Radware's servers, under their analytics and cookies), with a direct link that always works.
export default function HomeThreatMap() {
  return <div id="threat-map" className="tm-page tm-home" role="region" aria-labelledby="threat-map-title">
    <section className="container tm-intro">
      <div>
        <p className="tm-kicker">LIVE THREAT MAP</p>
        <h2 id="threat-map-title" className="tm-title">The internet, under attack.<br /><em>Right now.</em></h2>
      </div>
      <div className="tm-intro-copy">
        <p>Each line on this map is an attack that Radware recorded moments ago. Watch where attacks start, where they land, and which kinds are most common today.</p>
      </div>
    </section>

    <section className="container" aria-label="Radware live cyber threat map">
      <ThreatMapFrame />
    </section>

    <section className="container tm-read" aria-labelledby="tm-read-title">
      <p className="tm-kicker">HOW TO READ IT</p>
      <h2 id="tm-read-title">What the map tells you, and what it doesn’t.</h2>
      <div className="tm-cards">
        <article>
          <h3>What you are seeing</h3>
          <p>A sample of network and application attacks, anonymized and shown in near real time. Radware records them on its global threat deception network, decoy systems that exist only to be attacked, and in its cloud security services. Use the map’s filters to narrow what you see.</p>
        </article>
        <article>
          <h3>What it doesn’t show</h3>
          <p>It is one vendor’s view, not every attack on the internet. Much of it is automated scanning and probing of anything that answers. An attack’s starting country is where the traffic came from, often a hijacked computer or rented server, not where the attacker sits.</p>
        </article>
        <article>
          <h3>Where the defenses come in</h3>
          <p>The map shows the threat. The training shows the defenses: hardening to the DISA STIGs, patching, central logging, and default-deny segmentation that stops traffic no rule allows.</p>
          <p className="tm-links"><a href="/technical-training">Open the Technical Training Library</a><a href="/inside-the-network">Explore Inside the Network</a></p>
        </article>
      </div>
    </section>
  </div>;
}
