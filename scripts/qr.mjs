/**
 * QR de la experiencia.
 *  qr/pase-cero-qr.svg / .png            → QR plano, corrección H
 *  qr/pase-cero-qr-disenado.png          → versión con diseño ("Pase 0 · Escanéame")
 *  qr/pase-cero-imprimible-8x8cm.pdf/png → tamaño real 8×8 cm con marcas de corte
 * Cada PNG se verifica decodificándolo con jsQR.
 *   URL por defecto: https://pedrosc10.github.io/pase-cero/   (o: npm run qr -- <url>)
 */
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import sharp from 'sharp'
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const URL_FINAL = process.argv[2] || 'https://pedrosc10.github.io/pase-cero/'
const OUT = 'qr'
fs.mkdirSync(OUT, { recursive: true })
const opts = { errorCorrectionLevel: 'H', margin: 4 }

// 1) QR plano
fs.writeFileSync(`${OUT}/pase-cero-qr.svg`, await QRCode.toString(URL_FINAL, { ...opts, type: 'svg', color: { dark: '#000000', light: '#ffffff' } }))
await QRCode.toFile(`${OUT}/pase-cero-qr.png`, URL_FINAL, { ...opts, width: 2048, color: { dark: '#000000', light: '#ffffff' } })

// 2) módulos para el diseño
const qr = QRCode.create(URL_FINAL, { errorCorrectionLevel: 'H' })
const N = qr.modules.size
const Q = 4 // zona de silencio
const T = N + Q * 2
let rects = ''
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) if (qr.modules.get(x, y)) rects += `<rect x="${x + Q}" y="${y + Q}" width="1.02" height="1.02"/>`
const qrSvg = `<svg viewBox="0 0 ${T} ${T}" shape-rendering="crispEdges"><rect width="${T}" height="${T}" fill="#f1e8d8"/><g fill="#0b0907">${rects}</g></svg>`

const font = (p) => pathToFileURL(path.resolve('node_modules/@fontsource', p)).href
const fonts = `
@font-face{font-family:CG;font-style:italic;font-weight:400;src:url(${font('cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2')})}
@font-face{font-family:CSC;font-weight:600;src:url(${font('cormorant-sc/files/cormorant-sc-latin-600-normal.woff2')})}
@font-face{font-family:Mono;font-weight:400;src:url(${font('ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')})}`

// pieza cuadrada (unidades: 1 = 1/100 del lado)
const pieza = (lado) => `
<div class="pz" style="width:${lado};height:${lado}">
  <div class="marco"></div>
  <p class="k">Pase 0</p>
  <svg class="orn" viewBox="0 0 120 24"><path d="M2 12h40M78 12h40" stroke="#a89b87" stroke-width=".8"/><path d="M60 3c3 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 3-7 0 3 1 4 2 4 0-3 0-6 2-9z" fill="none" stroke="#ffb04a" stroke-width="1"/></svg>
  <div class="qr">${qrSvg}</div>
  <p class="esc">Escanéame</p>
</div>`
const css = (u) => `${fonts}
*{box-sizing:border-box}html,body{margin:0;background:#fff}
.pz{position:relative;background:radial-gradient(90% 60% at 50% 110%,rgba(255,112,26,.28),transparent 70%),#0b0907;color:#efe6d6;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.marco{position:absolute;inset:calc(${u}*3.2);border:calc(${u}*.25) solid rgba(239,230,214,.6);outline:calc(${u}*.12) solid rgba(239,230,214,.3);outline-offset:calc(${u}*-1.1)}
.k{margin:0;font:600 calc(${u}*5.2)/1 CSC;letter-spacing:.32em;color:#ffb04a;padding-left:.32em}
.orn{width:calc(${u}*16);margin:calc(${u}*1.2) 0 calc(${u}*2.4)}
.qr{width:calc(${u}*60);height:calc(${u}*60)}.qr svg{width:100%;height:100%;display:block}
.esc{margin:calc(${u}*2.6) 0 0;font:italic 400 calc(${u}*6.4)/1 CG;letter-spacing:.01em}`

const b = await chromium.launch()

// 3) versión diseñada (2400×2400 px)
{
  const pg = await b.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 3 })
  fs.writeFileSync('qa/_qr.html', `<!doctype html><html><head><style>${css('8px')}</style></head><body>${pieza('800px')}</body></html>`)
  await pg.goto(pathToFileURL(path.resolve('qa/_qr.html')).href, { waitUntil: 'networkidle' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.screenshot({ path: `${OUT}/pase-cero-qr-disenado.png` })
  await pg.close()
}

// 4) imprimible: hoja 100×100 mm, pegatina 80×80 mm centrada, marcas de corte
{
  const marcas = []
  const L = 6 // largo de marca (mm)
  const G = 2 // separación (mm)
  for (const [x, y] of [[10, 10], [90, 10], [10, 90], [90, 90]]) {
    const sx = x === 10 ? -1 : 1
    const sy = y === 10 ? -1 : 1
    marcas.push(`<line x1="${x + sx * G}" y1="${y}" x2="${x + sx * (G + L)}" y2="${y}"/>`)
    marcas.push(`<line x1="${x}" y1="${y + sy * G}" x2="${x}" y2="${y + sy * (G + L)}"/>`)
  }
  const html = `<!doctype html><html><head><style>${css('0.8mm')}
  @page{size:100mm 100mm;margin:0}
  body{width:100mm;height:100mm;position:relative}
  .pos{position:absolute;left:10mm;top:10mm}
  svg.m{position:absolute;inset:0;width:100mm;height:100mm}
  .nota{position:absolute;left:14mm;right:14mm;bottom:1.6mm;text-align:center;font:400 1.75mm Mono;color:#555;letter-spacing:0;margin:0}
  </style></head><body>
  <div class="pos">${pieza('80mm')}</div>
  <svg class="m" viewBox="0 0 100 100"><g stroke="#000" stroke-width=".15">${marcas.join('')}</g></svg>
  <p class="nota">8×8 cm · imprimir al 100 % · recortar por las marcas</p>
  </body></html>`
  fs.writeFileSync('qa/_print.html', html)
  const pg = await b.newPage({ viewport: { width: 378, height: 378 }, deviceScaleFactor: 3.125 })
  await pg.goto(pathToFileURL(path.resolve('qa/_print.html')).href, { waitUntil: 'networkidle' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.pdf({ path: `${OUT}/pase-cero-imprimible-8x8cm.pdf`, width: '100mm', height: '100mm', printBackground: true, pageRanges: '1' })
  await pg.screenshot({ path: `${OUT}/pase-cero-imprimible-8x8cm.png` })
  await pg.close()
}
await b.close()

// 300 ppp en el PNG imprimible
await sharp(`${OUT}/pase-cero-imprimible-8x8cm.png`).withMetadata({ density: 300 }).toFile(`${OUT}/_tmp.png`)
fs.renameSync(`${OUT}/_tmp.png`, `${OUT}/pase-cero-imprimible-8x8cm.png`)

// 5) verificación por decodificación
let ok = true
for (const f of ['pase-cero-qr.png', 'pase-cero-qr-disenado.png', 'pase-cero-imprimible-8x8cm.png']) {
  for (const scale of [1, 0.25]) {
    const buf = await sharp(`${OUT}/${f}`).resize({ width: Math.round((await sharp(`${OUT}/${f}`).metadata()).width * scale) }).png().toBuffer()
    const png = PNG.sync.read(buf)
    const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
    const good = res?.data === URL_FINAL
    ok &&= good
    console.log(`${good ? '✓' : '✗'} ${f} @${Math.round(scale * 100)}% → ${res?.data ?? 'sin lectura'}`)
  }
}
console.log(`QR versión ${qr.version}, ${N}×${N} módulos, corrección H`)
if (!ok) process.exit(1)
