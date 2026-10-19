import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'
import { eventsUrl } from '../content/links'

export default function Footer() {
  return (
    <footer className="site-footer">
      <LogoMark compact />
      <p>A space for stories, food, travel and connection.</p>
      <div className="footer-links">
        <Link to="/about">About</Link>
        <a href={eventsUrl}>Events</a>
        <Link to="/join">Join us</Link>
      </div>
      <p className="footer-meta">© {new Date().getFullYear()} Book &amp; Table</p>
    </footer>
  )
}
