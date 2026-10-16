import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

const pages = ['home', 'about', 'events', 'join']

export default function Editor() {
  const [page, setPage] = useState('home')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('Loading…')
  useDocumentTitle('Content editor')

  useEffect(() => {
    let active = true
    setStatus('Loading…')
    fetch(`/__content/${page}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return
        setContent(data.content)
        setStatus('Ready')
      })
      .catch(() => setStatus('Could not load this file'))
    return () => { active = false }
  }, [page])

  async function save() {
    setStatus('Saving…')
    const response = await fetch(`/__content/${page}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setStatus(response.ok ? 'Saved — refresh the page preview to see it' : 'Save failed')
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div>
          <p className="editor-eyebrow">Local content studio</p>
          <h1>Book &amp; Table editor</h1>
        </div>
        <Link to="/">View site ↗</Link>
      </header>
      <div className="editor-toolbar">
        <label>Page
          <select value={page} onChange={(event) => setPage(event.target.value)}>
            {pages.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <span className="editor-status">{status}</span>
        <button type="button" onClick={save}>Save changes</button>
      </div>
      <div className="editor-note">
        Write in Markdown or MDX. Keep JSX tags balanced. Saving updates the corresponding file in <code>src/content</code>.
      </div>
      <textarea
        className="content-editor"
        aria-label={`${page} page content`}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        spellCheck="true"
      />
    </main>
  )
}
