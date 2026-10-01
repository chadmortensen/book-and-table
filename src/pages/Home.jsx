import HomeContent from '../content/home.mdx'
import Footer from '../components/Footer'
import LogoMark from '../components/LogoMark'
import SiteNav from '../components/SiteNav'

export default function Home() {
  return (
    <div>
      <header className="hero">
        <div className="hero-content">
          <LogoMark />
          <h1>Book <span>&amp;</span> Table</h1>
          <p className="hero-kicker">A space for stories, food, travel and connection.</p>
        </div>
      </header>
      <SiteNav />
      <main className="home-main">
        <section className="welcome-section">
          <article className="prose home-prose"><HomeContent /></article>
          <div className="flourish" aria-hidden="true">✦</div>
        </section>
        <section className="feature-strip" aria-label="Book and Table experiences">
          <div className="feature-card feature-card--blue">
            <h2>Read</h2><p>Slow down with stories that stay with you.</p>
          </div>
          <div className="feature-card feature-card--yellow">
            <h2>Gather</h2><p>Share a table, a meal and a thoughtful conversation.</p>
          </div>
          <div className="feature-card feature-card--pink">
            <h2>Wander</h2><p>Step away from the everyday and return renewed.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
