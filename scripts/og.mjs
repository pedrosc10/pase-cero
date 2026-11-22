// Genera public/og.png (1200×630, neutra y sin spoilers) y public/apple-touch-icon.png
import { chromium } from 'playwright'
import sharp from 'sharp'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const font = (p) => pathToFileURL(path.resolve('node_modules/@fontsource', p)).href
const dots = Array.from({ length: 44 }, (_, i) => {
  const a = (i / 44) * Math.PI * 2 - Math.PI / 2
  const lit = i < 30
  return `<circle cx="${100 + Math.cos(a) * 86}" cy="${100 + Math.sin(a) * 86}" r="2.6" fill="${lit ? '#ffc274' : 'rgba(239,230,214,.18)'}"/>`
}).join('')

const html = `<!doctype html><html><head><style>
@font-face{font-family:CG;font-style:italic;font-weight:300;src:url(${font('cormorant-garamond/files/cormorant-garamond-latin-300-italic.woff2')})}
@font-face{font-family:CSC;font-weight:600;src:url(${font('cormorant-sc/files/cormorant-sc-latin-600-normal.woff2')})}
html,body{margin:0;width:1200px;height:630px;background:#0b0907;overflow:hidden}
.w{position:relative;width:1200px;height:630px;display:flex;align-items:center;justify-content:center;gap:70px;
background:radial-gradient(80% 70% at 50% 120%,rgba(255,112,26,.38),rgba(184,65,14,.1) 50%,transparent 75%),#0b0907}
h1{margin:0;font:italic 300 120px/1 CG;color:#efe6d6;letter-spacing:-.02em}
p{margin:0 0 18px;font:600 22px CSC;letter-spacing:.3em;color:#ffb04a}
svg{width:230px;height:230px}
.g{position:absolute;inset:0;opacity:.13;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.core{position:absolute;inset:24%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,200,.95),rgba(255,140,40,.6) 30%,rgba(184,65,14,.18) 58%,transparent 70%)}
.r{position:relative;width:230px;height:230px}
</style></head><body><div class="w">
<div><p>Pase 0</p><h1>Para Antonio.</h1></div>
<div class="r"><div class="core"></div><svg viewBox="0 0 200 200">${dots}<path d="M100 82 118 100 100 118 82 100Z" fill="none" stroke="#efe6d6" stroke-width="1.4"/></svg></div>
<div class="g"></div></div></body></html>`

const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1200, height: 630 } })
fs.mkdirSync('qa', { recursive: true })
fs.writeFileSync('qa/_og.html', html)
await pg.goto(pathToFileURL(path.resolve('qa/_og.html')).href, { waitUntil: 'networkidle' })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: 'public/og.png' })
await b.close()
await sharp('public/favicon.svg', { density: 600 }).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('og.png + apple-touch-icon.png')
