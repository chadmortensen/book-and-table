import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import Parser from 'rss-parser'

const publication = JSON.parse(await readFile(new URL('../src/content/substack.json', import.meta.url), 'utf8'))

export function parseSubstack(xml) {
  return new Parser().parseString(xml).then(feed => {
    if (!feed.items?.length) throw new Error('Substack returned no articles.')
    const seen = new Set()
    const posts = feed.items.map(item => {
      const url = new URL(item.link)
      const timestamp = Date.parse(item.isoDate || item.pubDate)
      if (url.origin !== new URL(publication.url).origin || !url.pathname.startsWith('/p/') || url.username || url.password || !Number.isFinite(timestamp) || !item.title?.trim()) {
        throw new Error('Substack returned invalid article metadata.')
      }
      return {
        title: item.title.trim(),
        url: url.href,
        publishedAt: new Date(timestamp).toISOString(),
        excerpt: (item.contentSnippet || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      }
    }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .filter(post => {
        if (seen.has(post.url)) return false
        seen.add(post.url)
        return true
      }).slice(0, 3)
    return { ...publication, updatedAt: new Date().toISOString(), posts }
  })
}

export async function refreshSubstack({ output = fileURLToPath(new URL('../src/content/substack-feed.json', import.meta.url)), fetcher = fetch } = {}) {
  const response = await fetcher(publication.feedUrl, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Substack feed request failed (${response.status}).`)
  const snapshot = await parseSubstack(await response.text())
  await mkdir(dirname(output), { recursive: true })
  const staging = `${output}.tmp`
  try {
    await writeFile(staging, `${JSON.stringify(snapshot, null, 2)}\n`)
    await rename(staging, output)
  } finally {
    await rm(staging, { force: true })
  }
  return snapshot.posts.length
}

export async function refreshSubstackWithFallback(options = {}) {
  try {
    return { count: await refreshSubstack(options), cached: false }
  } catch {
    const output = options.output || fileURLToPath(new URL('../src/content/substack-feed.json', import.meta.url))
    const snapshot = JSON.parse(await readFile(output, 'utf8'))
    if (Object.entries(publication).some(([key, value]) => snapshot[key] !== value) ||
        !Number.isFinite(Date.parse(snapshot.updatedAt)) || !Array.isArray(snapshot.posts) ||
        !snapshot.posts.length || snapshot.posts.length > 3) {
      throw new Error('No valid saved Substack snapshot is available.')
    }
    for (const post of snapshot.posts) {
      const url = new URL(post.url)
      if (url.origin !== new URL(publication.url).origin || !url.pathname.startsWith('/p/') ||
          url.username || url.password || !Number.isFinite(Date.parse(post.publishedAt)) ||
          typeof post.title !== 'string' || !post.title.trim() || typeof post.excerpt !== 'string') {
        throw new Error('The saved Substack snapshot contains invalid articles.')
      }
    }
    return { count: snapshot.posts.length, cached: true }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes('--allow-cached')) {
      const result = await refreshSubstackWithFallback()
      if (result.cached) {
        console.warn('::warning::Substack live refresh failed. Using validated saved articles; their dates and content have not been updated. The next deployment will retry the feed.')
      } else {
        console.log(`Substack snapshot refreshed: ${result.count} articles.`)
      }
    } else {
      console.log(`Substack snapshot refreshed: ${await refreshSubstack()} articles.`)
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
