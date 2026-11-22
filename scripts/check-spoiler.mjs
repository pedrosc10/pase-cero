// Comprobación anti-spoiler del build (dist/). Falla si aparece alguna palabra prohibida
// en el HTML, en nombres de archivo o en el código servido.
import fs from 'node:fs'
import path from 'node:path'

// lista en base64 para no dejar pistas en el repo público
const PROHIBIDAS = Buffer.from('Y2Fycml0byx2ZW50YSxhc2Fkb3IsY29taWRhLHBlcmRpZGE=', 'base64').toString('utf8').split(',')
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const dist = 'dist'
let fallos = 0
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
for (const f of walk(dist)) {
  const rel = path.relative(dist, f).split(path.sep).join('/')
  for (const w of PROHIBIDAS)
    if (norm(rel).includes(w)) {
      console.error(`✗ nombre de archivo con "${w}": ${rel}`)
      fallos++
    }
  if (!/\.(html|js|css|txt|svg|json|webmanifest)$/.test(f)) continue
  const txt = norm(fs.readFileSync(f, 'utf8'))
  for (const w of PROHIBIDAS) {
    const i = txt.indexOf(w)
    if (i >= 0) {
      console.error(`✗ "${w}" en ${rel}: …${txt.slice(Math.max(0, i - 40), i + 40)}…`)
      fallos++
    }
  }
}
if (fallos) {
  console.error(`\nAnti-spoiler: ${fallos} problema(s).`)
  process.exit(1)
}
console.log('✓ Anti-spoiler: ninguna palabra prohibida en dist/')
