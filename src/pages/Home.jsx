import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import HomeContent from '../content/home.mdx'
import EventsContent from '../content/events.mdx'
import Footer from '../components/Footer'
import LogoMark from '../components/LogoMark'
import SiteNav from '../components/SiteNav'

export default function Home() {
  const { hash, key } = useLocation()

  useEffect(() => {
    if (hash !== '#events') return
    const frame = requestAnimationFrame(() => {
      document.getElementById('events')?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash, key])

  return (
    <div>
      <header className="hero">
        <div className="hero-content">
          <h1><LogoMark /></h1>
          <p className="hero-kicker">A space for stories, food, travel and connection.</p>
        </div>
      </header>
      <SiteNav />
      <main className="home-main">
        <section className="welcome-section">
          <article className="prose home-prose"><HomeContent /></article>
          <div className="flourish" aria-hidden="true">✦</div>
        </section>
        <section className="events-section" id="events" aria-label="Events">
          <article className="prose events-prose"><EventsContent /></article>
        </section>
        <section className="feature-strip" aria-label="Book and Table experiences">
          <div className="feature-card feature-card--rust">
            <h2>Read</h2><p>Slow down with stories that stay with you.</p>
          </div>
          <div className="feature-card feature-card--salmon">
            <h2>Gather</h2><p>Share a table, a meal and a thoughtful conversation.</p>
          </div>
          <div className="feature-card feature-card--grass">
            <h2>Wander</h2><p>Step away from the everyday and return renewed.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
