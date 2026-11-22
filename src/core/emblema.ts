/**
 * Emblema de El Jardín (vectorizado de la foto del bordado con scripts/vectorize.mjs).
 * Los datos se cargan en diferido: no pesan en la primera pintura.
 */
type Data = typeof import('../generated/emblema')
let cache: Promise<Data> | null = null
export const loadEmblema = () => (cache ??= import('../generated/emblema'))

let uid = 0

/** Dorado medido en el hilo del bordado (assets-fuente/jardin-bordado.jpg). */
export const ORO = '#cfa35e'
export const ORO_CLARO = '#ecc581'
export const ORO_SOMBRA = '#8f6730'

/** Patrón de puntada satinada (hilo dorado). */
function defs(id: string) {
  return `
    <pattern id="sat-${id}" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(38)">
      <rect width="9" height="9" fill="${ORO}"/>
      <rect width="3.2" height="9" fill="${ORO_CLARO}" opacity=".85"/>
      <rect x="6.6" width="1.3" height="9" fill="${ORO_SOMBRA}" opacity=".75"/>
    </pattern>
    <linearGradient id="brillo-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff6dc" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff6dc" stop-opacity=".55"/>
      <stop offset="1" stop-color="#fff6dc" stop-opacity="0"/>
    </linearGradient>`
}

/** Emblema estático (silueta fiel con textura de hilo). */
export function emblemaFill(d: Data, cls = '', label = '') {
  const id = 'e' + uid++
  const { w, h } = d.EMBLEMA_VB
  return `<svg class="emblema ${cls}" viewBox="0 0 ${w} ${h}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>
    <defs>${defs(id)}</defs>
    <path d="${d.EMBLEMA_FILL}" fill="url(#sat-${id})" fill-rule="evenodd"/>
  </svg>`
}

/**
 * Emblema para BORDAR: trazos (orden de bordado) recortados por la silueta
 * fiel, de modo que el resultado final coincide con el original.
 */
export function emblemaBordable(d: Data, label: string) {
  const id = 'b' + uid++
  const { w, h } = d.EMBLEMA_VB
  const paths = d.EMBLEMA_TRAZOS.map(
    ([g, t, p]) => `<path data-g="${g}" d="${p}" stroke-width="${(t * 1.9 + 6).toFixed(1)}"/>`,
  ).join('')
  return `<svg class="emblema bordable" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
    <defs>
      ${defs(id)}
      <clipPath id="clip-${id}"><path d="${d.EMBLEMA_FILL}" clip-rule="evenodd"/></clipPath>
    </defs>
    <g clip-path="url(#clip-${id})">
      <g class="hilos" fill="none" stroke="url(#sat-${id})" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
      <path class="relleno" d="${d.EMBLEMA_FILL}" fill="url(#sat-${id})" fill-rule="evenodd" opacity="0"/>
      <rect class="brillo" x="${-w * 0.4}" y="0" width="${w * 0.35}" height="${h}" fill="url(#brillo-${id})" opacity="0"/>
    </g>
  </svg>`
}

/** Parche bordado: emblema dorado sobre negro con borde de puntada. */
export function parche(d: Data, cls = '') {
  const id = 'p' + uid++
  const { w, h } = d.EMBLEMA_VB
  const s = 0.56
  const cx = 500
  const tx = cx - (w * s) / 2
  const ty = cx - (h * s) / 2 + 10
  return `<svg class="parche ${cls}" viewBox="0 0 1000 1000" role="img" aria-label="Parche de El Jardín">
    <defs>${defs(id)}</defs>
    <circle cx="500" cy="500" r="490" fill="#0d0b09"/>
    <circle cx="500" cy="500" r="486" fill="none" stroke="${ORO_SOMBRA}" stroke-width="10"/>
    <circle cx="500" cy="500" r="462" fill="none" stroke="${ORO}" stroke-width="22" stroke-dasharray="7 5"/>
    <circle cx="500" cy="500" r="438" fill="none" stroke="${ORO_SOMBRA}" stroke-width="3" opacity=".7"/>
    <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s})">
      <path d="${d.EMBLEMA_FILL}" fill="url(#sat-${id})" fill-rule="evenodd"/>
    </g>
  </svg>`
}

/** Prepara los trazos para dibujarse (dasharray = longitud real). */
export function prepararTrazos(svg: SVGSVGElement) {
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>('.hilos path'))
  return paths.map((p) => {
    let L = 0
    try {
      L = p.getTotalLength()
    } catch {
      L = 0
    }
    p.style.strokeDasharray = `${L + 2} ${L + 2}`
    p.style.strokeDashoffset = `${L + 2}`
    return { el: p, L, g: p.dataset.g || '' }
  })
}

/** Puntos a lo largo de los trazos, en coordenadas de pantalla. */
export function puntosTrazos(svg: SVGSVGElement, step = 14, max = 700) {
  const out: { x: number; y: number }[] = []
  const ctm = svg.getScreenCTM()
  if (!ctm) return out
  const pt = svg.createSVGPoint()
  for (const p of Array.from(svg.querySelectorAll<SVGPathElement>('.hilos path'))) {
    let L = 0
    try {
      L = p.getTotalLength()
    } catch {
      continue
    }
    for (let s = 0; s < L; s += step) {
      const q = p.getPointAtLength(s)
      pt.x = q.x
      pt.y = q.y
      const r = pt.matrixTransform(ctm)
      out.push({ x: r.x, y: r.y })
    }
  }
  if (out.length <= max) return out
  const k = out.length / max
  return Array.from({ length: max }, (_, i) => out[Math.floor(i * k)])
}
