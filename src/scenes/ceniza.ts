/**
 * Capa de ceniza sobre un texto (canvas): se puede rascar con el dedo
 * o barrer automáticamente (soplido). Cobertura medida en rejilla.
 */
import type { Ctx } from '../core/scenes'

const GX = 24
const GY = 16

export interface Ceniza {
  /** Barrido automático en `seg` segundos. */
  soplar(seg: number): void
  /** Retira toda la ceniza. */
  retirar(dur?: number): void
  /** Activa el rascado manual; `onDone` al superar el umbral. */
  rascable(umbral: number, onDone: () => void): void
  readonly cubierta: number
}

export function crearCeniza(ctx: Ctx, box: HTMLElement, cv: HTMLCanvasElement, rotulo = ''): Ceniza {
  const { audio, fx } = ctx
  const g = cv.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let W = 0
  let H = 0
  const cleared = new Uint8Array(GX * GY)
  let count = 0
  let umbral = 2
  let onDone: (() => void) | null = null
  let hecho = false

  const paint = () => {
    const r = box.getBoundingClientRect()
    W = r.width
    H = r.height
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    if (!g) return
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const grd = g.createLinearGradient(0, 0, W, H)
    grd.addColorStop(0, '#1d1712')
    grd.addColorStop(0.5, '#15110d')
    grd.addColorStop(1, '#201812')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
    for (let i = 0; i < (W * H) / 70; i++) {
      const v = 20 + Math.random() * 40
      g.fillStyle = `rgba(${v + 10},${v + 4},${v},${0.35 + Math.random() * 0.5})`
      g.fillRect(Math.random() * W, Math.random() * H, Math.random() * 2.4, Math.random() * 2.4)
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const rr = 18 + Math.random() * 60
      const rg = g.createRadialGradient(x, y, 0, x, y, rr)
      rg.addColorStop(0, 'rgba(70,60,52,.22)')
      rg.addColorStop(1, 'rgba(70,60,52,0)')
      g.fillStyle = rg
      g.fillRect(x - rr, y - rr, rr * 2, rr * 2)
    }
    for (let i = 0; i < 50; i++) {
      g.fillStyle = `rgba(255,${90 + Math.random() * 80},20,${0.25 + Math.random() * 0.5})`
      g.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2)
    }
    if (rotulo) {
      g.font = `italic 300 ${Math.round(Math.min(W * 0.075, 30))}px "Cormorant Garamond", Georgia, serif`
      g.fillStyle = 'rgba(168,155,135,.5)'
      g.textAlign = 'center'
      g.fillText(rotulo, W / 2, H / 2 + 8)
    }
  }
  paint()

  const brush = (x: number, y: number, R = Math.max(24, W * 0.08)) => {
    if (!g) return
    g.globalCompositeOperation = 'destination-out'
    const rg = g.createRadialGradient(x, y, 0, x, y, R)
    rg.addColorStop(0, 'rgba(0,0,0,1)')
    rg.addColorStop(0.6, 'rgba(0,0,0,.85)')
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rg
    g.beginPath()
    g.arc(x, y, R, 0, Math.PI * 2)
    g.fill()
    g.globalCompositeOperation = 'source-over'
    const x0 = Math.floor(((x - R * 0.7) / W) * GX)
    const x1 = Math.floor(((x + R * 0.7) / W) * GX)
    const y0 = Math.floor(((y - R * 0.7) / H) * GY)
    const y1 = Math.floor(((y + R * 0.7) / H) * GY)
    for (let gy = Math.max(0, y0); gy <= Math.min(GY - 1, y1); gy++)
      for (let gx = Math.max(0, x0); gx <= Math.min(GX - 1, x1); gx++) {
        const k = gy * GX + gx
        if (!cleared[k]) {
          cleared[k] = 1
          count++
        }
      }
    if (!hecho && onDone && count / cleared.length > umbral) {
      hecho = true
      onDone()
    }
  }
  const dustAt = (x: number, y: number, n = 3) => {
    const r = ctx.rectOf(box)
    fx.dust(r.x + x, r.y + y, n)
  }

  const api: Ceniza = {
    get cubierta() {
      return 1 - count / cleared.length
    },
    soplar(seg) {
      // pasadas en zigzag como un soplido que barre la ceniza
      const tl = ctx.tl()
      const o = { p: 0 }
      let lx = -1
      let ly = -1
      const rows = 6
      tl.to(o, {
        p: 1,
        duration: seg,
        ease: 'power1.inOut',
        onStart: () => audio.whoosh(true),
        onUpdate: () => {
          const fr = o.p * rows
          const row = Math.min(rows - 1, Math.floor(fr))
          const along = fr - row
          const x = row % 2 ? W * (1 - along) : W * along
          const y = H * (0.1 + (row / (rows - 1)) * 0.8) + Math.sin(o.p * 30) * 10
          if (lx >= 0) {
            const d = Math.hypot(x - lx, y - ly)
            const steps = Math.ceil(d / 10)
            for (let i = 1; i <= steps; i++) brush(lx + ((x - lx) * i) / steps, ly + ((y - ly) * i) / steps, Math.max(30, W * 0.1))
          }
          if (Math.random() < 0.6) dustAt(x, y, 4)
          lx = x
          ly = y
        },
      })
      tl.add(() => api.retirar(0.6))
    },
    retirar(dur = 0.8) {
      const r = ctx.rectOf(box)
      for (let i = 0; i < 6; i++) fx.dust(r.x + Math.random() * r.width, r.y + Math.random() * r.height, 10)
      ctx.tl().to(cv, { opacity: 0, duration: dur, ease: 'power2.out' })
    },
    rascable(u, done) {
      umbral = u
      onDone = done
      let drawing = false
      let lx = 0
      let ly = 0
      let lt = 0
      const pos = (e: PointerEvent) => {
        const r = cv.getBoundingClientRect()
        return [e.clientX - r.left, e.clientY - r.top] as const
      }
      ctx.on(cv, 'pointerdown', (e: PointerEvent) => {
        if (hecho) return
        e.preventDefault()
        drawing = true
        try {
          cv.setPointerCapture(e.pointerId)
        } catch {
          /* nada */
        }
        ;[lx, ly] = pos(e)
        lt = performance.now()
        brush(lx, ly)
        ctx.haptic(6)
      })
      ctx.on(cv, 'pointermove', (e: PointerEvent) => {
        if (!drawing || hecho) return
        const [x, y] = pos(e)
        const d = Math.hypot(x - lx, y - ly)
        const steps = Math.max(1, Math.ceil(d / 8))
        for (let i = 1; i <= steps; i++) brush(lx + ((x - lx) * i) / steps, ly + ((y - ly) * i) / steps)
        const now = performance.now()
        audio.scratch(Math.min(1, (d / Math.max(1, now - lt)) * 0.9))
        if (Math.random() < 0.5) dustAt(x, y, 3)
        if (Math.random() < 0.08) fx.burst(ctx.rectOf(box).x + x, ctx.rectOf(box).y + y, 3, 0.4)
        lx = x
        ly = y
        lt = now
      })
      const end = () => {
        drawing = false
        audio.scratch(0)
      }
      ctx.on(cv, 'pointerup', end)
      ctx.on(cv, 'pointercancel', end)
    },
  }
  if (!g) ctx.after(800, () => onDone?.())
  return api
}
