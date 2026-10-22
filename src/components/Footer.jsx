import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'
import { eventsUrl } from '../content/links'

export default function Footer() {
  return (
    <footer className="site-footer">
      <Link to="/" className="footer-logo" aria-label="Book & Table home"><LogoMark compact /></Link>
      <div className="footer-links">
        <Link to="/about">About</Link>
        <a href={eventsUrl}>Events</a>
        <Link to="/join">Join us</Link>
      </div>
      <p className="footer-meta">© {new Date().getFullYear()} Book &amp; Table</p>
    </footer>
  )
}
