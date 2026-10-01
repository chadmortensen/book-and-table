import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'

export default function Footer() {
  return (
    <footer className="site-footer">
      <LogoMark compact />
      <p className="footer-title">Book <span>&amp;</span> Table</p>
      <p>A space for stories, food, travel and connection.</p>
      <div className="footer-links">
        <Link to="/about">About</Link>
        <Link to="/events">Events</Link>
        <Link to="/join">Join us</Link>
      </div>
      <p className="footer-meta">© {new Date().getFullYear()} Book &amp; Table</p>
    </footer>
  )
}
