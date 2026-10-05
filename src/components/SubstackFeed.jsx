import publication from '../content/substack.json'
import feed from '../content/substack-feed.json'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })

export default function SubstackFeed() {
  return (
    <section className="substack-feed" aria-label="Latest articles from The Garden Dish">
      <span className="substack-eyebrow">On Substack</span>
      <h3>{publication.title}</h3>
      <ul className="substack-posts">
        {feed.posts.slice(0, 3).map(post => (
          <li key={post.url}>
            <time dateTime={post.publishedAt}>{dateFormatter.format(new Date(post.publishedAt))}</time>
            <h4><a href={post.url}>{post.title}</a></h4>
            {post.excerpt && <p>{post.excerpt}</p>}
          </li>
        ))}
      </ul>
      <a className="substack-archive" href={publication.archiveUrl}>View all articles on Substack →</a>
    </section>
  )
}
