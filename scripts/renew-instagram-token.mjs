import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const API = 'https://graph.instagram.com'
const DAY = 86400000
const validToken = value => typeof value === 'string' && /^[A-Za-z0-9._-]{20,}$/.test(value)

export function renewalDue(updatedAt, event, now = Date.now()) {
  const age = now - Date.parse(updatedAt)
  if (!Number.isFinite(age) || age < 0) throw new Error('Invalid secret update date.')
  // Meta requires a token to be at least 24 hours old. Scheduled checks
  // renew after 30 days; manual runs can renew earlier, after the first day.
  return age >= DAY && (event === 'workflow_dispatch' || age >= 30 * DAY)
}

export async function renewInstagramToken({ token, fetcher = fetch, saveToken, maskToken = () => {} }) {
  if (!validToken(token) || typeof saveToken !== 'function') throw new Error('Missing renewal configuration.')
  async function request(url, headers) {
    const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error('Instagram renewal request failed.')
    const result = await response.json()
    if (result.error) throw new Error('Instagram renewal returned an API error.')
    return result
  }
  async function account(accessToken) {
    const result = await request(new URL(`${API}/v26.0/me?fields=user_id,username`), { Authorization: `Bearer ${accessToken}` })
    if (result.username !== 'book.and.table' || !/^\d+$/.test(String(result.user_id))) throw new Error('Unexpected Instagram account.')
    return String(result.user_id)
  }
  const originalAccount = await account(token)
  const url = new URL(`${API}/refresh_access_token`)
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', token)
  // Meta specifies a query parameter for renewal. Never log this URL,
  // response body, or raw network exception.
  const renewed = await request(url)
  if (!validToken(renewed.access_token)) throw new Error('Invalid renewed token.')
  maskToken(renewed.access_token)
  if (!Number.isFinite(renewed.expires_in) || renewed.expires_in < 50 * DAY / 1000 || renewed.expires_in > 61 * DAY / 1000) {
    throw new Error('Unexpected token lifetime.')
  }
  if (await account(renewed.access_token) !== originalAccount) throw new Error('Instagram account changed during renewal.')
  // Only replace the stored token after validating the returned token.
  await saveToken(renewed.access_token)
}

async function saveRepositoryToken(token, repository) {
  await new Promise((resolveSave, reject) => {
    // Keep the credential out of command-line arguments and output. gh
    // encrypts it using the repository public key before sending to GitHub.
    const child = spawn('gh', ['secret', 'set', 'INSTAGRAM_ACCESS_TOKEN', '--repo', repository], {
      stdio: ['pipe', 'ignore', 'ignore'], timeout: 30000,
    })
    child.on('error', () => reject(new Error('Secret update failed.')))
    child.stdin.on('error', () => reject(new Error('Secret update failed.')))
    child.on('close', code => code === 0 ? resolveSave() : reject(new Error('Secret update failed.')))
    child.stdin.end(`${token}\n`)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const repository = process.env.GITHUB_REPOSITORY
    if (repository !== 'chadmortensen/book-and-table' || !process.env.GH_TOKEN || !validToken(process.env.INSTAGRAM_ACCESS_TOKEN)) {
      throw new Error('Missing renewal configuration.')
    }
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/INSTAGRAM_ACCESS_TOKEN`, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' },
      redirect: 'error', signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new Error('Secret metadata request failed.')
    const metadata = await response.json()
    if (!renewalDue(metadata.updated_at, process.env.GITHUB_EVENT_NAME)) {
      console.log('Instagram token renewal is not due yet.')
    } else {
      await renewInstagramToken({
        token: process.env.INSTAGRAM_ACCESS_TOKEN,
        maskToken: token => console.log(`::add-mask::${token}`),
        saveToken: token => saveRepositoryToken(token, repository),
      })
      console.log('Instagram token renewed and saved securely to repository Actions secrets.')
    }
  } catch {
    console.error('Instagram token renewal failed. Check INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_SECRET_WRITER, account authorization, and API availability. No credentials are included in this log.')
    process.exitCode = 1
  }
}
