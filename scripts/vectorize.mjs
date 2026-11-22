/**
 * Vectoriza el emblema bordado de El Jardín.
 *  1) Máscara del hilo dorado (color) + limpieza.
 *  2) Silueta FIEL con potrace (relleno exacto del bordado).
 *  3) Versión POR TRAZOS: esqueleto (Zhang-Suen) → polilíneas → poda →
 *     unión en cruces → simplificación → orden de bordado.
 *  4) Comprobación: superpone ambos SVG sobre la foto (qa/emblema-*.png).
 *
 * Salidas:
 *  assets-fuente/emblema-jardin.svg          (silueta fiel, relleno)
 *  assets-fuente/emblema-jardin-trazos.svg   (trazos ordenados para animar)
 *  src/generated/emblema.ts                  (datos para la web)
 */
import sharp from 'sharp'
import potrace from 'potrace'
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'assets-fuente/jardin-bordado.jpg'
const PAD = 34
fs.mkdirSync('qa', { recursive: true })
fs.mkdirSync('src/generated', { recursive: true })

const img = sharp(SRC)
const meta = await img.metadata()
const { data } = await img.raw().toBuffer({ resolveWithObject: true })
const W0 = meta.width
const H0 = meta.height

// ── 1. máscara ──
const gold = (r, g, b) => {
  const l = 0.3 * r + 0.59 * g + 0.11 * b
  return l > 62 && r > b + 26 && r > 70
}
let mask0 = new Uint8Array(W0 * H0)
for (let i = 0; i < W0 * H0; i++) mask0[i] = gold(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) ? 255 : 0
// suavizado: mediana 5 vía sharp
mask0 = new Uint8Array(await sharp(Buffer.from(mask0), { raw: { width: W0, height: H0, channels: 1 } }).median(5).extractChannel(0).raw().toBuffer())

// componentes conexas: eliminar motas
function components(m, w, h) {
  const lab = new Int32Array(w * h).fill(-1)
  const comps = []
  const st = []
  for (let i = 0; i < w * h; i++) {
    if (!m[i] || lab[i] >= 0) continue
    const id = comps.length
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0
    st.push(i)
    lab[i] = id
    while (st.length) {
      const p = st.pop()
      n++
      const x = p % w, y = (p / w) | 0
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
        const q = yy * w + xx
        if (m[q] && lab[q] < 0) { lab[q] = id; st.push(q) }
      }
    }
    comps.push({ n, x0, y0, x1, y1 })
  }
  return { lab, comps }
}
{
  const { lab, comps } = components(mask0, W0, H0)
  for (let i = 0; i < W0 * H0; i++) if (mask0[i] && comps[lab[i]].n < 140) mask0[i] = 0
}
// recorte
let bx0 = 1e9, by0 = 1e9, bx1 = 0, by1 = 0
for (let i = 0; i < W0 * H0; i++) if (mask0[i]) {
  const x = i % W0, y = (i / W0) | 0
  if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y
}
const CX = Math.max(0, bx0 - PAD), CY = Math.max(0, by0 - PAD)
const W = Math.min(W0, bx1 + PAD) - CX, H = Math.min(H0, by1 + PAD) - CY
const mask = new Uint8Array(W * H)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = mask0[(y + CY) * W0 + x + CX]
console.log('recorte', { CX, CY, W, H })

// ── 2. potrace (silueta fiel) ──
const inv = Buffer.alloc(W * H)
for (let i = 0; i < W * H; i++) inv[i] = mask[i] ? 0 : 255
const pngInv = await sharp(inv, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer()
const fillD = await new Promise((res, rej) => {
  const p = new potrace.Potrace({ turdSize: 30, optTolerance: 0.25, alphaMax: 0.9, threshold: 128, blackOnWhite: true })
  p.loadImage(pngInv, (err) => {
    if (err) return rej(err)
    const tag = p.getPathTag()
    res(/ d="([^"]+)"/.exec(tag)[1])
  })
})

// ── 3. esqueleto ──
// transformada de distancia (chaflán 3-4) para estimar el grosor del hilo
const dist = new Float32Array(W * H)
for (let i = 0; i < W * H; i++) dist[i] = mask[i] ? 1e6 : 0
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x
  if (!dist[i]) continue
  let v = dist[i]
  if (x > 0) v = Math.min(v, dist[i - 1] + 3)
  if (y > 0) v = Math.min(v, dist[i - W] + 3)
  if (x > 0 && y > 0) v = Math.min(v, dist[i - W - 1] + 4)
  if (x < W - 1 && y > 0) v = Math.min(v, dist[i - W + 1] + 4)
  dist[i] = v
}
for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
  const i = y * W + x
  if (!dist[i]) continue
  let v = dist[i]
  if (x < W - 1) v = Math.min(v, dist[i + 1] + 3)
  if (y < H - 1) v = Math.min(v, dist[i + W] + 3)
  if (x < W - 1 && y < H - 1) v = Math.min(v, dist[i + W + 1] + 4)
  if (x > 0 && y < H - 1) v = Math.min(v, dist[i + W - 1] + 4)
  dist[i] = v
}

// Zhang-Suen sobre una máscara suavizada (solo para el esqueleto; la silueta fiel no se toca)
const smooth = new Uint8Array(
  await sharp(Buffer.from(mask), { raw: { width: W, height: H, channels: 1 } }).blur(2.6).threshold(105).extractChannel(0).raw().toBuffer(),
)
const sk = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) sk[i] = smooth[i] > 127 ? 1 : 0
const nb = (i) => [sk[i - W], sk[i - W + 1], sk[i + 1], sk[i + W + 1], sk[i + W], sk[i + W - 1], sk[i - 1], sk[i - W - 1]]
let changed = true
while (changed) {
  changed = false
  for (const pass of [0, 1]) {
    const del = []
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (!sk[i]) continue
      const p = nb(i)
      const B = p.reduce((a, b) => a + b, 0)
      if (B < 2 || B > 6) continue
      let A = 0
      for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) A++
      if (A !== 1) continue
      if (pass === 0 ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6] : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]) continue
      del.push(i)
    }
    for (const i of del) sk[i] = 0
    if (del.length) changed = true
  }
}

// quitar escalones redundantes (deja un esqueleto 8-conexo mínimo)
{
  const R = (w) => [-w, -w + 1, 1, w + 1, w, w - 1, -1, -w - 1] // N NE E SE S SW W NW
  const ring = R(W)
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    if (!sk[i]) continue
    const v = ring.map((d) => sk[i + d])
    const set = v.map((b, k) => (b ? k : -1)).filter((k) => k >= 0)
    if (set.length < 2) continue
    // componentes en el anillo
    const par = new Map(set.map((k) => [k, k]))
    const f = (k) => (par.get(k) === k ? k : f(par.get(k)))
    const adj = (a, b) => { const d = (b - a + 8) % 8; return d === 1 || d === 7 || ((d === 2 || d === 6) && (a % 2 === 0) && (b % 2 === 0)) }
    for (const a of set) for (const b of set) if (a < b && adj(a, b)) par.set(f(a), f(b))
    const comps = new Set(set.map(f)).size
    if (comps === 1 && set.length <= 3) sk[i] = 0
  }
}

// ── grafo de píxeles ──
const N8 = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]
const neigh = (i) => N8.map((d) => i + d).filter((j) => j >= 0 && j < W * H && sk[j] && Math.abs((j % W) - (i % W)) <= 1)
const deg = (i) => neigh(i).length
// número de cruce (transiciones 0→1 alrededor): 2 = tramo, 1 = extremo, ≥3 = cruce
const RING = [-W, -W + 1, 1, W + 1, W, W - 1, -1, -W - 1]
const cn = (i) => {
  let c = 0
  const v = RING.map((d) => (sk[i + d] ? 1 : 0))
  for (let k = 0; k < 8; k++) if (!v[k] && v[(k + 1) % 8]) c++
  return c
}
const isNode = (i) => deg(i) !== 2
const is4 = (a, b) => Math.abs(a - b) === 1 || Math.abs(a - b) === W

function tracePolylines() {
  const visited = new Uint8Array(W * H)
  const lines = []
  const nodes = []
  for (let i = W; i < W * (H - 1); i++) if (sk[i] && isNode(i)) nodes.push(i)
  const nodeSet = new Uint8Array(W * H)
  for (const n of nodes) nodeSet[n] = 1
  const walk = (s, n0) => {
    const pts = [s, n0]
    if (!nodeSet[n0]) visited[n0] = 1
    let prev = s, cur = n0
    while (!nodeSet[cur]) {
      const cand = neigh(cur).filter((j) => j !== prev && j !== s && (nodeSet[j] || !visited[j]))
      if (!cand.length) break
      cand.sort((a, b) => (nodeSet[b] - nodeSet[a]) || (is4(cur, b) - is4(cur, a)))
      const nx = cand[0]
      // marca como visitados los vecinos "escalón" que también tocan al siguiente
      if (!nodeSet[nx]) visited[nx] = 1
      pts.push(nx)
      prev = cur
      cur = nx
    }
    return pts
  }
  const seenPair = new Set()
  for (const s0 of nodes) {
    for (const n0 of neigh(s0)) {
      if (nodeSet[n0]) {
        const k = s0 < n0 ? s0 + ':' + n0 : n0 + ':' + s0
        if (seenPair.has(k)) continue
        seenPair.add(k)
        lines.push([s0, n0])
        continue
      }
      if (visited[n0]) continue
      lines.push(walk(s0, n0))
    }
  }
  // bucles cerrados sin nodos
  for (let i = W; i < W * (H - 1); i++) {
    if (!sk[i] || visited[i] || nodeSet[i]) continue
    visited[i] = 1
    const n = neigh(i)
    if (!n.length) continue
    const pts = walk(i, n[0])
    if (pts.length > 6) lines.push(pts)
  }
  return lines
}

// poda de espolones cortos (iterativa)
for (let it = 0; it < 10; it++) {
  const lines = tracePolylines()
  let pruned = 0
  for (const l of lines) {
    const a = l[0], b = l[l.length - 1]
    const endA = deg(a) <= 1, endB = deg(b) <= 1
    const thick = Math.max(dist[a], dist[b]) / 3
    if ((endA !== endB) && l.length < Math.max(14, thick * 2)) {
      // borra el espolón excepto el nodo de cruce
      for (const p of l) if (p !== (endA ? b : a)) sk[p] = 0
      pruned++
    }
  }
  if (!pruned) break
}

let lines = tracePolylines().filter((l) => l.length >= 3)
const XY = (i) => [i % W, (i / W) | 0]

// ── unión de ramas colineales en los cruces ──
const toPts = (l) => l.map(XY)
let polys = lines.map(toPts)
const dirAt = (pl, atStart) => {
  const k = Math.min(10, pl.length - 1)
  const [x0, y0] = atStart ? pl[0] : pl[pl.length - 1]
  const [x1, y1] = atStart ? pl[k] : pl[pl.length - 1 - k]
  const d = Math.hypot(x1 - x0, y1 - y0) || 1
  return [(x1 - x0) / d, (y1 - y0) / d] // apunta HACIA DENTRO de la polilínea
}
for (let pass = 0; pass < 6; pass++) {
  // agrupar extremos cercanos
  const ends = []
  polys.forEach((pl, idx) => {
    ends.push({ idx, start: true, p: pl[0] })
    ends.push({ idx, start: false, p: pl[pl.length - 1] })
  })
  let merged = false
  const used = new Set()
  const pairs = []
  for (let a = 0; a < ends.length; a++) for (let b = a + 1; b < ends.length; b++) {
    const ea = ends[a], eb = ends[b]
    if (ea.idx === eb.idx) continue
    if (Math.hypot(ea.p[0] - eb.p[0], ea.p[1] - eb.p[1]) > 7) continue
    const da = dirAt(polys[ea.idx], ea.start)
    const db = dirAt(polys[eb.idx], eb.start)
    const dot = da[0] * db[0] + da[1] * db[1] // colineal y opuesto → -1
    if (dot < -0.82) pairs.push({ a, b, dot })
  }
  pairs.sort((x, y) => x.dot - y.dot)
  const next = []
  const consumed = new Set()
  for (const { a, b } of pairs) {
    const ea = ends[a], eb = ends[b]
    if (used.has(a) || used.has(b) || consumed.has(ea.idx) || consumed.has(eb.idx)) continue
    used.add(a); used.add(b)
    consumed.add(ea.idx); consumed.add(eb.idx)
    let A = polys[ea.idx], B = polys[eb.idx]
    if (ea.start) A = [...A].reverse()
    if (!eb.start) B = [...B].reverse()
    next.push([...A, ...B.slice(1)])
    merged = true
  }
  polys.forEach((pl, i) => { if (!consumed.has(i)) next.push(pl) })
  polys = next
  if (!merged) break
}

// ── simplificación RDP (conserva la irregularidad) ──
function rdp(pts, eps) {
  if (pts.length < 3) return pts
  const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1]
  const dx = x1 - x0, dy = y1 - y0
  const L = Math.hypot(dx, dy) || 1
  let md = 0, mi = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x1 * y0 - y1 * x0) / L
    if (d > md) { md = d; mi = i }
  }
  if (md > eps) return [...rdp(pts.slice(0, mi + 1), eps).slice(0, -1), ...rdp(pts.slice(mi), eps)]
  return [pts[0], pts[pts.length - 1]]
}
const lenOf = (pl) => pl.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pl[i - 1][0], p[1] - pl[i - 1][1]) : 0), 0)

// ── clasificación y orden de bordado ──
// zonas en coordenadas de la FOTO ORIGINAL (medidas sobre la imagen)
const T = (x, y) => [x - CX, y - CY]
const zonaEl = { x0: 740 - CX, y0: 910 - CY, x1: 1000 - CX, y1: 1140 - CY }
const zonaJardin = { x0: 480 - CX, y0: 1140 - CY, x1: 1250 - CX, y1: 1460 - CY }
const troncos = [T(545, 0)[0], T(1290, 0)[0]]
const copaY = 660 - CY
const copas = [T(585, 588), T(1310, 568)]
const inZ = (z, x, y) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1

const strokes = polys
  .filter((pl) => pl.length >= 6)
  .map((pl) => {
    const s = rdp(pl, 0.9)
    const L = lenOf(pl)
    let sx = 0, sy = 0
    pl.forEach(([x, y]) => { sx += x; sy += y })
    const cx = sx / pl.length, cy = sy / pl.length
    const xs = pl.map((p) => p[0]), ys = pl.map((p) => p[1])
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys)
    const thick = (pl.reduce((a, [x, y]) => a + dist[y * W + x], 0) / pl.length / 3) * 2
    const vertical = bh > bw * 2.2
    const enTronco = troncos.some((tx) => Math.abs(cx - tx) < 70) && vertical && bh > 90
    let grupo
    if (inZ(zonaEl, cx, cy) && !enTronco) grupo = 'el'
    else if (inZ(zonaJardin, cx, cy) && !enTronco && Math.max(...ys) > zonaJardin.y0 + 20) grupo = 'jardin'
    else if (enTronco) grupo = 'palmeras'
    else if (cy < 300) grupo = 'palmeras'
    else if (L >= 140) grupo = 'casas'
    else if (cy < copaY && copas.some(([x, y]) => Math.hypot(cx - x, cy - y) < 240)) grupo = 'palmeras'
    else grupo = 'detalles'
    return { pts: s, L, cx, cy, grupo, thick: Math.max(6, Math.min(30, thick)) }
  })
  .filter((s) => s.L > 10)

const ordenGrupo = { casas: 0, palmeras: 1, detalles: 2, el: 3, jardin: 4 }
// sentido de cada trazo
for (const s of strokes) {
  const a = s.pts[0], b = s.pts[s.pts.length - 1]
  if (s.grupo === 'palmeras') {
    // troncos de abajo arriba; hojas desde la copa hacia fuera (punto más bajo primero)
    if (a[1] < b[1]) s.pts.reverse()
  } else if (s.grupo === 'el' || s.grupo === 'jardin' || s.grupo === 'casas') {
    if (a[0] > b[0] + 4) s.pts.reverse()
  } else if (a[1] > b[1]) s.pts.reverse()
}
strokes.sort((p, q) => {
  const g = ordenGrupo[p.grupo] - ordenGrupo[q.grupo]
  if (g) return g
  if (p.grupo === 'casas') return q.L - p.L || p.cx - q.cx
  if (p.grupo === 'palmeras') return Math.sign(p.cx - W / 2) - Math.sign(q.cx - W / 2) || q.L - p.L
  return p.cx - q.cx
})

const r1 = (n) => Math.round(n * 10) / 10
/** Reduce decimales y separadores del path de potrace. */
const compact = (d, dec) => {
  const f = 10 ** dec
  return d
    .replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(+n * f) / f))
    .replace(/,\s*/g, ' ')
    .replace(/\s*([MCLZ])\s*/g, '$1')
}
const dOf = (pts) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')
const counts = strokes.reduce((a, s) => ((a[s.grupo] = (a[s.grupo] || 0) + 1), a), {})
console.log('trazos', strokes.length, counts)

// ── salidas ──
const VB = `0 0 ${W} ${H}`
const svgFill = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="${W}" height="${H}">
  <title>El Jardín</title>
  <path fill="#d0a35e" fill-rule="evenodd" d="${compact(fillD, 1)}"/>
</svg>
`
const svgStrokes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="${W}" height="${H}">
  <title>El Jardín · trazos</title>
  <g fill="none" stroke="#d0a35e" stroke-linecap="round" stroke-linejoin="round">
${strokes.map((s, i) => `    <path id="t${i}" data-grupo="${s.grupo}" stroke-width="${r1(s.thick)}" d="${dOf(s.pts)}"/>`).join('\n')}
  </g>
</svg>
`
fs.writeFileSync('assets-fuente/emblema-jardin.svg', svgFill)
fs.writeFileSync('assets-fuente/emblema-jardin-trazos.svg', svgStrokes)
fs.writeFileSync(
  'src/generated/emblema.ts',
  `// GENERADO por scripts/vectorize.mjs a partir de assets-fuente/jardin-bordado.jpg — no editar a mano.
export const EMBLEMA_VB = { w: ${W}, h: ${H} } as const
/** Silueta fiel (potrace). */
export const EMBLEMA_FILL = ${JSON.stringify(compact(fillD, 0))}
/** Trazos ordenados para bordar: [grupo, grosor, d, longitud]. */
export const EMBLEMA_TRAZOS: [string, number, string, number][] = ${JSON.stringify(strokes.map((s) => [s.grupo, r1(s.thick), dOf(s.pts), Math.round(s.L)]))}
`,
)

// ── 4. comprobación visual sobre la foto ──
const photoCrop = await sharp(SRC).extract({ left: CX, top: CY, width: W, height: H }).toBuffer()
const colors = { casas: '#00e5ff', palmeras: '#7CFF6B', detalles: '#ff4fd8', el: '#ffffff', jardin: '#ff3b3b' }
const overlayStrokes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="${W}" height="${H}">
<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">${strokes
  .map((s, i) => `<path stroke="${colors[s.grupo]}" d="${dOf(s.pts)}"/><text x="${r1(s.pts[0][0])}" y="${r1(s.pts[0][1])}" font-size="16" fill="${colors[s.grupo]}">${i}</text>`)
  .join('')}</g></svg>`
const overlayFill = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="${W}" height="${H}"><path fill="none" stroke="#ff2d55" stroke-width="2" d="${fillD}"/></svg>`
await sharp(photoCrop).composite([{ input: Buffer.from(overlayStrokes) }]).jpeg({ quality: 80 }).toFile('qa/emblema-trazos-sobre-foto.jpg')
await sharp(photoCrop).composite([{ input: Buffer.from(overlayFill) }]).jpeg({ quality: 80 }).toFile('qa/emblema-silueta-sobre-foto.jpg')
await sharp(Buffer.from(svgFill.replace('#d0a35e', '#d0a35e'))).flatten({ background: '#0b0907' }).png().toFile('qa/emblema-silueta.png')
console.log('ok', path.resolve('qa'))
