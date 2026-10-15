export default function BlogSidebar() {
  return <aside className="blog-sidebar" aria-label="About the blog and upcoming topics">
    <section className="sidebar-section">
      <h2>About Secure By Design</h2>
      <p>Explore cybersecurity and system administration with Secure By Design: how things work, why they’re configured a certain way, and what to check when they don’t behave.</p>
      <a href="/#about">More about Secure By Design →</a>
    </section>
    <section className="sidebar-section">
      <h2>Current series</h2>
      <p className="sidebar-series-title"><a href="/blog/what-is-active-directory">Active Directory Foundations</a></p>
      <p>How identities, systems, and policies fit together in Active Directory.</p>
      <a href="/blog/what-is-active-directory">Explore the series →</a>
    </section>
    <section className="sidebar-section">
      <h2>Keep learning</h2>
      <ul className="sidebar-plans">
        <li><a href="/inside-the-network">Inside the Network</a><p>Explore the complete training network in 3D and see how each build connects.</p></li>
        <li><a href="/technical-training">Technical Training Library</a><p>Explore network builds with interactive 3D scenes, guides, and companion training materials.</p></li>
      </ul>
      <p className="sidebar-status">Training materials are available now. Video walkthroughs are coming soon.</p>
    </section>

  </aside>;
}
