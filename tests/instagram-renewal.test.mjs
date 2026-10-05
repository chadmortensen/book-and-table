import test from 'node:test'
import assert from 'node:assert/strict'
import { renewalDue, renewInstagramToken } from '../scripts/renew-instagram-token.mjs'

const token = 'old-test-token-not-a-real-credential'
const nextToken = 'renewed-test-token-not-a-real-credential'
const lifetime = 60 * 86400

function api({ refreshStatus = 200, renewed = { access_token: nextToken, expires_in: lifetime }, wrongAccount = false, switchedAccount = false } = {}) {
  return async (url, options) => {
    assert.equal(url.hostname, 'graph.instagram.com')
    assert.equal(options.redirect, 'error')
    if (url.pathname === '/refresh_access_token') {
      assert.equal(url.searchParams.get('grant_type'), 'ig_refresh_token')
      assert.equal(url.searchParams.get('access_token'), token)
      return Response.json(renewed, { status: refreshStatus })
    }
    assert.equal(url.searchParams.has('access_token'), false)
    const accessToken = options.headers.Authorization.slice('Bearer '.length)
    assert.ok([token, nextToken].includes(accessToken))
    return Response.json({ username: wrongAccount ? 'other.account' : 'book.and.table', user_id: switchedAccount && accessToken === nextToken ? '456' : '123' })
  }
}

test('validates the renewed account before masking and saving the new token', async () => {
  const events = []
  await renewInstagramToken({ token, fetcher: api(), maskToken: value => events.push(['mask', value]), saveToken: async value => events.push(['save', value]) })
  assert.deepEqual(events, [['mask', nextToken], ['save', nextToken]])
})

test('never overwrites the secret on API failures, malformed tokens, or account changes', async () => {
  for (const options of [
    { refreshStatus: 400 }, { wrongAccount: true }, { switchedAccount: true },
    { renewed: { access_token: 'unsafe\n::warning::payload', expires_in: lifetime } },
    { renewed: { access_token: nextToken, expires_in: 3600 } },
    { renewed: { error: { message: token } } },
  ]) {
    let saved = false
    await assert.rejects(renewInstagramToken({ token, fetcher: api(options), saveToken: async () => { saved = true } }))
    assert.equal(saved, false)
  }
})

test('propagates a failed secret write so Actions reports renewal failure', async () => {
  await assert.rejects(renewInstagramToken({ token, fetcher: api(), saveToken: async () => { throw new Error('Denied') } }))
})

test('weekly checks wait 30 days while manual runs respect the initial 24 hours', () => {
  const now = Date.parse('2026-11-05T12:00:00Z')
  const ago = days => new Date(now - days * 86400000).toISOString()
  assert.equal(renewalDue(ago(29), 'schedule', now), false)
  assert.equal(renewalDue(ago(30), 'schedule', now), true)
  assert.equal(renewalDue(ago(.5), 'workflow_dispatch', now), false)
  assert.equal(renewalDue(ago(1), 'workflow_dispatch', now), true)
  assert.throws(() => renewalDue('invalid', 'schedule', now))
  assert.throws(() => renewalDue(ago(-1), 'schedule', now))
})
