import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

const contentFiles = {
  home: 'src/content/home.mdx',
  about: 'src/content/about.mdx',
  events: 'src/content/events.mdx',
  join: 'src/content/join.mdx',
}

function localContentEditor() {
  return {
    name: 'book-and-table-local-content-editor',
    configureServer(server) {
      server.middlewares.use('/__content', async (request, response) => {
        const key = request.url?.split('?')[0].replace(/^\//, '')
        const relativePath = contentFiles[key]

        if (!relativePath) {
          response.statusCode = 404
          response.end('Unknown content page')
          return
        }

        const filePath = resolve(process.cwd(), relativePath)

        if (request.method === 'GET') {
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ content: await readFile(filePath, 'utf8') }))
          return
        }

        if (request.method === 'PUT') {
          let body = ''
          request.on('data', (chunk) => { body += chunk })
          request.on('end', async () => {
            try {
              const { content } = JSON.parse(body)
              if (typeof content !== 'string') throw new Error('Content must be text')
              await writeFile(filePath, content, 'utf8')
              response.setHeader('Content-Type', 'application/json')
              response.end(JSON.stringify({ saved: true }))
            } catch (error) {
              response.statusCode = 400
              response.end(error.message)
            }
          })
          return
        }

        response.statusCode = 405
        response.end('Method not allowed')
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    { enforce: 'pre', ...mdx() },
    react(),
    localContentEditor(),
  ],
}))
