import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseSubstack, refreshSubstack } from '../scripts/refresh-substack.mjs'

const article = (id, date = '2026-02-18T16:00:25Z', link = `https://thegardendish.substack.com/p/${id}`) => `<item><title><![CDATA[Garden & Table ${id}]]></title><link>${link}</link><pubDate>${date}</pubDate><description><![CDATA[<p>A &amp; B <strong>garden story</strong>.</p>]]></description></item>`
const rss = items => `<?xml version="1.0"?><rss version="2.0"><channel><title>The Garden Dish</title>${items}</channel></rss>`

test('selects the newest three unique articles and converts previews to plain text', async () => {
  const snapshot = await parseSubstack(rss([
    article('old', '2025-01-01T00:00:00Z'),
    article('new'), article('new'),
    article('middle', '2026-01-01T00:00:00Z'),
    article('third', '2025-09-01T00:00:00Z'),
  ].join('')))
  assert.deepEqual(snapshot.posts.map(post => post.title), ['Garden & Table new', 'Garden & Table middle', 'Garden & Table third'])
  assert.equal(snapshot.posts[0].excerpt, 'A & B garden story.')
  assert.equal(snapshot.posts[0].publishedAt, '2026-02-18T16:00:25.000Z')
})

test('rejects malformed feeds, unsafe links, and invalid dates', async () => {
  for (const xml of [rss(''), 'not XML', rss(article('bad', 'invalid')), rss(article('bad', undefined, 'javascript:alert(1)')), rss(article('bad', undefined, 'https://example.com/p/article'))]) {
    await assert.rejects(() => parseSubstack(xml))
  }
})

test('refreshes the snapshot and preserves it when a later fetch or parse fails', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'substack-test-'))
  const output = join(directory, 'feed.json')
  try {
    await writeFile(output, 'previous')
    const count = await refreshSubstack({ output, fetcher: async url => {
      assert.equal(url, 'https://thegardendish.substack.com/feed')
      return new Response(rss(article('new')))
    } })
    assert.equal(count, 1)
    const saved = await readFile(output, 'utf8')
    assert.equal(JSON.parse(saved).posts.length, 1)
    for (const response of [new Response('', { status: 503 }), new Response(rss(''))]) {
      await assert.rejects(() => refreshSubstack({ output, fetcher: async () => response }))
      assert.equal(await readFile(output, 'utf8'), saved)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
