// Servidor estático mínimo que imita GitHub Pages: sirve dist/ bajo /pase-cero/
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const PORT = Number(process.env.PORT || 4173)
const ROOT = path.resolve('dist')
const BASE = '/pase-cero/'
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    if (url === '/' || url === '/pase-cero') {
      res.writeHead(302, { Location: BASE })
      return res.end()
    }
    if (!url.startsWith(BASE)) {
      res.writeHead(404)
      return res.end('404')
    }
    let file = path.join(ROOT, url.slice(BASE.length))
    if (!file.startsWith(ROOT)) {
      res.writeHead(403)
      return res.end()
    }
    if (url.endsWith('/')) file = path.join(file, 'index.html')
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404)
        return res.end('404')
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
      res.end(buf)
    })
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`))
