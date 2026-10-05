import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const API = 'https://graph.instagram.com/v26.0'
const imageTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']])

export async function refreshInstagram({ token, output = resolve('public/instagram'), fetcher = fetch }) {
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN is missing. Add it to repository Actions secrets.')

  async function graph(path, fields) {
    const url = new URL(`${API}/${path}`)
    url.searchParams.set('fields', fields)
    if (path.endsWith('/media')) url.searchParams.set('limit', '3')
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error', signal: AbortSignal.timeout(30000),
    })
    // Never log Meta response bodies, request URLs, or network exceptions.
    if (!response.ok) throw new Error('Instagram request failed. Check token expiry and instagram_business_basic permission.')
    const data = await response.json()
    if (data.error) throw new Error('Instagram returned an API error. Check the account authorization.')
    return data
  }

  const account = await graph('me', 'user_id,username')
  if (account.username !== 'book.and.table') throw new Error('The token must belong to book.and.table.')
  const media = await graph('me/media', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp')
  if (!Array.isArray(media.data) || media.data.length > 3) throw new Error('Instagram returned an unexpected feed.')

  await mkdir(output, { recursive: true })
  const staging = await mkdtemp(join(output, '.refresh-'))
  const posts = []
  try {
    await mkdir(join(staging, 'media'))
    const sorted = [...media.data].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    for (const item of sorted) {
      if (!/^\d+$/.test(item.id) || !Number.isFinite(Date.parse(item.timestamp))) throw new Error('Instagram returned invalid post metadata.')
      const permalink = new URL(item.permalink)
      if (permalink.protocol !== 'https:' || !['www.instagram.com', 'instagram.com'].includes(permalink.hostname) || !/^\/(p|reel|tv)\/[\w-]+\/?$/.test(permalink.pathname)) {
        throw new Error('Instagram returned an invalid post link.')
      }
      // Videos use their thumbnail. Missing previews still link to the latest post.
      const preview = item.media_type === 'VIDEO' ? item.thumbnail_url : (item.media_url || item.thumbnail_url)
      let image = null
      if (preview) {
        const url = new URL(preview)
        if (url.protocol !== 'https:' || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname) || url.username || url.password) {
          throw new Error('Instagram returned an invalid preview host.')
        }
        const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(30000) })
        const extension = imageTypes.get(response.headers.get('content-type')?.split(';')[0])
        if (!response.ok || !extension) throw new Error('Instagram preview download failed.')
        if (Number(response.headers.get('content-length')) > 12 * 1024 * 1024) throw new Error('Instagram preview is too large.')
        const bytes = new Uint8Array(await response.arrayBuffer())
        if (!bytes.length || bytes.length > 12 * 1024 * 1024) throw new Error('Instagram preview has an invalid size.')
        image = `instagram/media/${item.id}.${extension}`
        await writeFile(join(staging, 'media', `${item.id}.${extension}`), bytes)
      }
      const caption = typeof item.caption === 'string' ? item.caption.slice(0, 2200) : ''
      if (caption.includes(token)) throw new Error('Instagram returned unsafe post metadata.')
      posts.push({ id: item.id, caption, mediaType: item.media_type, permalink: `https://www.instagram.com${permalink.pathname}`, timestamp: item.timestamp, image })
    }
    const feed = { username: 'book.and.table', updatedAt: new Date().toISOString(), posts }
    await writeFile(join(staging, 'feed.json'), `${JSON.stringify(feed, null, 2)}\n`)
    // All network requests finish before replacing the existing snapshot.
    await rm(join(output, 'media'), { recursive: true, force: true })
    await rename(join(staging, 'media'), join(output, 'media'))
    await rename(join(staging, 'feed.json'), join(output, 'feed.json'))
    return posts.length
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const count = await refreshInstagram({ token: process.env.INSTAGRAM_ACCESS_TOKEN })
    console.log(`Instagram snapshot refreshed: ${count} posts.`)
  } catch {
    console.error('Instagram refresh failed. Check INSTAGRAM_ACCESS_TOKEN, account authorization, and API availability. No deployment should proceed.')
    process.exitCode = 1
  }
}
