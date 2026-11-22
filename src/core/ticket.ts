/**
 * Dibuja el vale en un canvas (sin dependencias) para guardarlo como PNG.
 * Replica la comanda de la pantalla: papel, tipografías, sello y parche.
 */
import { ORO, ORO_CLARO, ORO_SOMBRA } from './emblema'

export interface TicketData {
  cabecera: string
  sub: string
  dir: string
  numero: string
  pase: string
  campos: [string, string][]
  nota: string
  total: [string, string]
  sello: string
  gracias: string
  emblema?: { d: string; w: number; h: number }
}

const PAPEL = '#ece2cf'
const TINTA = '#1c1611'
const TINTA2 = '#5a4c3e'
const CARNE = '#8c3a33'

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (g.measureText(t).width > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

export async function renderTicket(t: TicketData): Promise<Blob | null> {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('400 30px "IBM Plex Mono"'),
      document.fonts.load('600 30px "IBM Plex Mono"'),
      document.fonts.load('italic 400 40px "Cormorant Garamond"'),
      document.fonts.load('600 30px "Cormorant SC"'),
    ])
  } catch {
    /* seguimos con lo que haya */
  }
  const S = 2 // escala de salida
  const W = 540
  const P = 40
  const mono = (wgt = 400, size = 15) => `${wgt} ${size}px "IBM Plex Mono", Menlo, monospace`
  // primera pasada: medir altura
  const meas = document.createElement('canvas').getContext('2d')!
  meas.font = mono(400, 15)
  let notaLines: string[] = []
  if (t.nota) {
    meas.font = 'italic 400 26px "Cormorant Garamond", Georgia, serif'
    notaLines = wrap(meas, '“' + t.nota + '”', W - P * 2)
  }
  meas.font = mono(600, 16)
  const campoLines = t.campos.map(([, v]) => wrap(meas, v, W - P * 2 - 120))
  const H =
    60 + 70 + 26 + 24 + 30 + 40 + campoLines.reduce((a, l) => a + l.length * 24 + 16, 0) + 30 + notaLines.length * 32 + 40 + 40 + 150 + 60

  const cv = document.createElement('canvas')
  cv.width = W * S
  cv.height = H * S
  const g = cv.getContext('2d')
  if (!g) return null
  g.scale(S, S)

  // fondo carbón y papel con borde dentado
  g.fillStyle = '#0b0907'
  g.fillRect(0, 0, W, H)
  const tooth = 10
  g.fillStyle = PAPEL
  g.beginPath()
  g.moveTo(0, tooth)
  for (let x = 0; x <= W; x += tooth * 2) {
    g.lineTo(x + tooth, 0)
    g.lineTo(x + tooth * 2, tooth)
  }
  g.lineTo(W, H - tooth)
  for (let x = W; x >= 0; x -= tooth * 2) {
    g.lineTo(x - tooth, H)
    g.lineTo(x - tooth * 2, H - tooth)
  }
  g.closePath()
  g.fill()
  // grano de papel
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = `rgba(90,76,62,${Math.random() * 0.08})`
    g.fillRect(Math.random() * W, tooth + Math.random() * (H - tooth * 2), 1, 1)
  }

  let y = 60
  g.textAlign = 'center'
  g.fillStyle = TINTA
  g.font = '400 52px Anton, Impact, sans-serif'
  g.fillText(t.cabecera.toUpperCase(), W / 2, y + 40)
  y += 70
  g.font = '600 17px "Cormorant SC", Georgia, serif'
  g.fillStyle = TINTA2
  g.fillText(t.sub, W / 2, y + 6)
  y += 26
  g.font = mono(400, 12)
  g.fillText(t.dir, W / 2, y + 6)
  y += 24

  const dash = (yy: number) => {
    g.save()
    g.strokeStyle = TINTA2
    g.setLineDash([5, 5])
    g.beginPath()
    g.moveTo(P, yy)
    g.lineTo(W - P, yy)
    g.stroke()
    g.restore()
  }
  dash(y)
  y += 30
  g.textAlign = 'left'
  g.fillStyle = TINTA
  g.font = mono(600, 14)
  g.fillText(t.numero.toUpperCase(), P, y)
  g.textAlign = 'right'
  g.fillText(t.pase.toUpperCase(), W - P, y)
  y += 16
  dash(y)
  y += 34

  t.campos.forEach(([k, _v], i) => {
    g.textAlign = 'left'
    g.fillStyle = TINTA2
    g.font = mono(400, 13)
    g.fillText(k.toUpperCase(), P, y)
    g.fillStyle = TINTA
    g.font = mono(600, 16)
    campoLines[i].forEach((ln, j) => g.fillText(ln, P + 120, y + j * 24))
    y += campoLines[i].length * 24 + 16
  })
  dash(y - 4)
  y += 30

  if (notaLines.length) {
    g.textAlign = 'center'
    g.fillStyle = TINTA
    g.font = 'italic 400 26px "Cormorant Garamond", Georgia, serif'
    notaLines.forEach((ln, j) => g.fillText(ln, W / 2, y + j * 32))
    y += notaLines.length * 32 + 10
  }
  dash(y)
  y += 34
  g.textAlign = 'left'
  g.font = mono(600, 16)
  g.fillText(t.total[0].toUpperCase(), P, y)
  g.textAlign = 'right'
  g.fillText(t.total[1].toUpperCase(), W - P, y)
  y += 30

  // sello + parche
  const yPie = y
  g.save()
  g.translate(P + 110, yPie + 62)
  g.rotate(-0.12)
  g.strokeStyle = CARNE
  g.fillStyle = CARNE
  g.globalAlpha = 0.85
  g.lineWidth = 3
  g.strokeRect(-105, -30, 210, 60)
  g.lineWidth = 1
  g.strokeRect(-99, -24, 198, 48)
  g.textAlign = 'center'
  g.font = '400 25px Anton, Impact, sans-serif'
  g.fillText(t.sello.toUpperCase(), 0, 9)
  g.restore()

  if (t.emblema) {
    const R = 62
    const cx = W - P - R
    const cy = yPie + 64
    g.save()
    g.fillStyle = '#0d0b09'
    g.beginPath()
    g.arc(cx, cy, R, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = ORO
    g.lineWidth = 3
    g.setLineDash([2.2, 1.6])
    g.beginPath()
    g.arc(cx, cy, R - 5, 0, Math.PI * 2)
    g.stroke()
    g.setLineDash([])
    g.strokeStyle = ORO_SOMBRA
    g.lineWidth = 1
    g.beginPath()
    g.arc(cx, cy, R - 1, 0, Math.PI * 2)
    g.stroke()
    try {
      const path = new Path2D(t.emblema.d)
      const s = ((R - 12) * 2) / Math.max(t.emblema.w, t.emblema.h)
      g.translate(cx - (t.emblema.w * s) / 2, cy - (t.emblema.h * s) / 2 + 2)
      g.scale(s, s)
      const grd = g.createLinearGradient(0, 0, t.emblema.w, t.emblema.h)
      grd.addColorStop(0, ORO_CLARO)
      grd.addColorStop(0.5, ORO)
      grd.addColorStop(1, ORO_SOMBRA)
      g.fillStyle = grd
      g.fill(path, 'evenodd')
    } catch {
      /* Path2D sin soporte */
    }
    g.restore()
  }
  y = yPie + 150

  // código de barras decorativo
  g.fillStyle = TINTA
  let bx = P
  let seed = 1972
  while (bx < W - P) {
    seed = (seed * 9301 + 49297) % 233280
    const bw = 1 + (seed % 4)
    g.fillRect(bx, y, bw, 34)
    bx += bw + 2 + (seed % 3)
  }
  y += 56
  g.textAlign = 'center'
  g.fillStyle = TINTA2
  g.font = 'italic 400 22px "Cormorant Garamond", Georgia, serif'
  g.fillText(t.gracias, W / 2, y)

  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'))
}
