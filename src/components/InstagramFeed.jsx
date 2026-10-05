import { useCallback, useEffect, useId, useRef, useState } from 'react'

const profileUrl = 'https://www.instagram.com/book.and.table/'

function Chevron({ direction }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></svg>
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState([])
  const [imageRatios, setImageRatios] = useState({})
  const trackId = useId()

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}instagram/feed.json`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(feed => setPosts(Array.isArray(feed.posts) ? feed.posts.slice(0, 3) : []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const trackRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({ startX: 0, startScroll: 0, active: false, moved: false });
  const animationFrame = useRef(null);

  const cancelAnimation = useCallback(() => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
    trackRef.current?.style.removeProperty("scroll-snap-type");
  }, []);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanGoBack(track.scrollLeft > 2);
    setCanGoForward(track.scrollLeft < track.scrollWidth - track.clientWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => { cancelAnimation(); updateControls(); });
    observer.observe(track);
    updateControls();
    return () => { observer.disconnect(); cancelAnimation(); };
  }, [updateControls, cancelAnimation, posts.length]);

  const moveTo = (index) => {
    const track = trackRef.current;
    if (!track || animationFrame.current !== null) return;
    const cards = Array.from(track.querySelectorAll(".instagram-slide"));
    const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
    if (!card) return;
    const inset = parseFloat(getComputedStyle(track).paddingLeft);
    const destination = Math.min(card.offsetLeft - inset, track.scrollWidth - track.clientWidth);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.scrollTo({ left: destination, behavior: "instant" });
      updateControls();
      return;
    }
    const start = track.scrollLeft;
    const startedAt = performance.now();
    // Match the reference gallery: 500ms easeInOutQuad, snapping disabled in flight.
    track.style.scrollSnapType = "none";
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / 500, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      track.scrollLeft = start + (destination - start) * eased;
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        animationFrame.current = null;
        track.style.removeProperty("scroll-snap-type");
        updateControls();
      }
    };
    animationFrame.current = requestAnimationFrame(animate);
  };

  const nearestIndex = () => {
    const track = trackRef.current;
    if (!track) return 0;
    const inset = parseFloat(getComputedStyle(track).paddingLeft);
    const cards = Array.from(track.querySelectorAll(".instagram-slide"));
    const maxScroll = track.scrollWidth - track.clientWidth;
    const distance = (card) => Math.abs(Math.min(card.offsetLeft - inset, maxScroll) - track.scrollLeft);
    return cards.reduce((best, card, index) => distance(card) < distance(cards[best]) ? index : best, 0);
  };

  const finishDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setIsDragging(false);
    if (drag.current.moved) moveTo(nearestIndex());
  };

  return (
    <section className="instagram-feed" aria-label="Latest from Book and Table on Instagram">
      <div className="instagram-feed-heading">
        <div>
          <span className="instagram-eyebrow">Instagram</span>
          <h3>From around our table</h3>
        </div>
        <a className="instagram-follow" href={profileUrl} target="_blank" rel="noopener noreferrer">Follow along →</a>
      </div>
      {posts.length ? <>
        <div
          ref={trackRef}
          id={trackId}
          className={`instagram-track${isDragging ? ' is-dragging' : ''}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Latest Instagram posts"
          tabIndex={0}
          onScroll={() => { if (animationFrame.current === null) updateControls() }}
          onWheel={cancelAnimation}
          onKeyDown={event => {
            drag.current.moved = false
            if (event.target !== event.currentTarget || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault()
              moveTo(nearestIndex() + (event.key === 'ArrowRight' ? 1 : -1))
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              moveTo(event.key === 'Home' ? 0 : posts.length - 1)
            }
          }}
          onPointerDown={event => {
            cancelAnimation()
            if (event.pointerType !== 'mouse' || event.button !== 0) return
            drag.current = { startX: event.clientX, startScroll: event.currentTarget.scrollLeft, active: true, moved: false }
          }}
          onPointerMove={event => {
            if (!drag.current.active) return
            const delta = event.clientX - drag.current.startX
            if (!drag.current.moved && Math.abs(delta) < 8) return
            drag.current.moved = true
            setIsDragging(true)
            event.currentTarget.style.scrollSnapType = 'none'
            event.currentTarget.setPointerCapture(event.pointerId)
            event.currentTarget.scrollLeft = drag.current.startScroll - delta
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
          onPointerLeave={() => { if (!drag.current.moved) drag.current.active = false }}
          onDragStart={event => event.preventDefault()}
          onClickCapture={event => {
            if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); drag.current.moved = false }
          }}
        >
          {posts.map((post, index) => {
            const label = post.caption?.slice(0, 90) || 'A moment from around our table'
            return <article className="instagram-slide" key={post.id} style={{ '--instagram-image-ratio': imageRatios[post.id] || 0.75 }} aria-roledescription="slide" aria-label={`${index + 1} of ${posts.length}: ${label}`}>
              <a className="instagram-slide-image" href={post.permalink} target="_blank" rel="noopener noreferrer" aria-label={`View ${label} on Instagram`} draggable={false}>
                {post.image ? <img src={`${import.meta.env.BASE_URL}${post.image}`} alt={post.caption?.slice(0, 160) || 'A moment from Book & Table'} loading="lazy" width="480" height="480" draggable={false} onLoad={event => {
                  const { naturalWidth, naturalHeight } = event.currentTarget
                  if (naturalHeight) setImageRatios(ratios => ({ ...ratios, [post.id]: naturalWidth / naturalHeight }))
                }} /> : <span className="instagram-post-preview">View on Instagram ↗</span>}
              </a>
              <div className="instagram-slide-copy">
                <time dateTime={post.timestamp}>{new Date(post.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time>
                <p>{post.caption || 'A moment from around our table.'}</p>
                <a className="instagram-slide-link" href={post.permalink} target="_blank" rel="noopener noreferrer" draggable={false}>Read on Instagram <span aria-hidden="true">↗</span></a>
              </div>
            </article>
          })}
        </div>
        <div className="instagram-carousel-controls" role="group" aria-label="Instagram carousel navigation">
          <button type="button" aria-label="Previous Instagram post" aria-controls={trackId} disabled={!canGoBack} onClick={() => moveTo(nearestIndex() - 1)}><Chevron direction="left" /></button>
          <button type="button" aria-label="Next Instagram post" aria-controls={trackId} disabled={!canGoForward} onClick={() => moveTo(nearestIndex() + 1)}><Chevron direction="right" /></button>
        </div>
      </> : <p>Stories, books and gatherings from around our table.</p>}
    </section>
  )
}
