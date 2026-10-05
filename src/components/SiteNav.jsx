import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import substack from '../content/substack.json'

const internalLinks = [
  ['Home', '/'],
  ['About Us', '/about'],
]

export default function SiteNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, hash])

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <nav className={`site-nav${isOpen ? ' site-nav--open' : ''}`} aria-label="Primary navigation">
      <div className="nav-inner">
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="primary-menu"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="nav-links" id="primary-menu">
          {internalLinks.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive && !(to === '/' && hash === '#events') ? 'active' : ''} onClick={() => setIsOpen(false)}>{label}</NavLink>
          ))}
          <Link to="/#events" className={pathname === '/' && hash === '#events' ? 'active' : ''} onClick={() => setIsOpen(false)}>Events</Link>
          <a href={substack.url} onClick={() => setIsOpen(false)}>Substack</a>
          <a href="https://www.instagram.com/book.and.table/" onClick={() => setIsOpen(false)}>Instagram</a>
          <NavLink className="nav-cta" to="/join" onClick={() => setIsOpen(false)}>Join Us</NavLink>
        </div>
      </div>
    </nav>
  )
}
