import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { refreshInstagram } from '../scripts/refresh-instagram.mjs'

const token = 'test-credential-never-published'
const items = [
  { id: '1', caption: 'First <script> is just text', media_type: 'IMAGE', media_url: 'https://scontent.cdninstagram.com/one.jpg', permalink: 'https://www.instagram.com/p/one/', timestamp: '2026-10-01T10:00:00Z' },
  { id: '2', media_type: 'VIDEO', thumbnail_url: 'https://scontent.fbcdn.net/two.jpg', media_url: 'https://scontent.cdninstagram.com/two.mp4', permalink: 'https://www.instagram.com/reel/two/', timestamp: '2026-10-03T10:00:00Z' },
  { id: '3', caption: 'Carousel', media_type: 'CAROUSEL_ALBUM', media_url: 'https://scontent.cdninstagram.com/three.jpg', permalink: 'https://www.instagram.com/p/three/', timestamp: '2026-10-02T10:00:00Z' },
]

function api({ username = 'book.and.table', posts = items, failImage = false } = {}) {
  return async (url, options) => {
    if (url.hostname === 'graph.instagram.com') {
      assert.equal(options.headers.Authorization, `Bearer ${token}`)
      assert.equal(url.searchParams.has('access_token'), false)
      if (url.pathname.endsWith('/me')) return Response.json({ username })
      assert.equal(url.searchParams.get('limit'), '3')
      return Response.json({ data: posts })
    }
    assert.equal(options.headers, undefined, 'credentials must never go to image hosts')
    assert.ok(!url.pathname.endsWith('.mp4'), 'videos must use thumbnails')
    return new Response(failImage ? 'failure' : new Uint8Array([255, 216, 255, 217]), { status: failImage ? 500 : 200, headers: { 'content-type': 'image/jpeg' } })
  }
}

test('refresh publishes latest three posts and local previews without credentials or CDN URLs', async () => {
  const output = await mkdtemp(join(tmpdir(), 'instagram-test-'))
  try {
    assert.equal(await refreshInstagram({ token, output, fetcher: api() }), 3)
    const raw = await readFile(join(output, 'feed.json'), 'utf8')
    const feed = JSON.parse(raw)
    assert.deepEqual(feed.posts.map(p => p.id), ['2', '3', '1'])
    assert.equal(feed.posts[0].image, 'instagram/media/2.jpg')
    assert.equal(feed.posts[1].mediaType, 'CAROUSEL_ALBUM')
    assert.equal(raw.includes(token), false)
    assert.equal(raw.includes('cdninstagram'), false)
    assert.equal((await readFile(join(output, 'media/2.jpg'))).length, 4)
    await assert.rejects(refreshInstagram({ token, output, fetcher: api({ failImage: true }) }))
    assert.equal(await readFile(join(output, 'feed.json'), 'utf8'), raw, 'failed refresh must preserve the previous snapshot')
    assert.equal((await readFile(join(output, 'media/2.jpg'))).length, 4)
  } finally { await rm(output, { recursive: true, force: true }) }
})

test('rejects wrong accounts, unexpected URLs, and missing credentials', async () => {
  const output = await mkdtemp(join(tmpdir(), 'instagram-test-'))
  try {
    await assert.rejects(refreshInstagram({ token, output, fetcher: api({ username: 'another.account' }) }))
    await assert.rejects(refreshInstagram({ token, output, fetcher: api({ posts: [{ ...items[0], permalink: 'https://example.com/p/one/' }] }) }))
    await assert.rejects(refreshInstagram({ token, output, fetcher: api({ posts: [{ ...items[0], media_url: 'https://example.com/private.jpg' }] }) }))
    await assert.rejects(refreshInstagram({ output, fetcher: api() }))
  } finally { await rm(output, { recursive: true, force: true }) }
})

test('keeps a video without an available thumbnail in the latest feed', async () => {
  const output = await mkdtemp(join(tmpdir(), 'instagram-test-'))
  try {
    await refreshInstagram({ token, output, fetcher: api({ posts: [{ ...items[1], thumbnail_url: undefined }] }) })
    const feed = JSON.parse(await readFile(join(output, 'feed.json'), 'utf8'))
    assert.equal(feed.posts[0].image, null)
    assert.equal(feed.posts[0].permalink, items[1].permalink)
  } finally { await rm(output, { recursive: true, force: true }) }
})
