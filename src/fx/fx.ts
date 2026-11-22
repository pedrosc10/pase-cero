/**
 * Capa generativa única (Canvas 2D): ascuas, humo, ceniza y "forja" de texto.
 * - Basado en tiempo (funciona igual a 30 fps en modo ahorro).
 * - Calidad adaptativa: si los frames se alargan, baja resolución y partículas.
 * - Sin canvas → la experiencia sigue siendo completa (solo CSS).
 */
type Ember = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; ph: number }
type Puff = { x: number; y: number; vx: number; vy: number; age: number; life: number; r: number; a: number }
type Ash = { x: number; y: number; vx: number; vy: number; age: number; life: number; s: number }
type Forged = { sx: number; sy: number; tx: number; ty: number; delay: number; dur: number; size: number; ph: number }

function sprite(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [o, col] of stops) grd.addColorStop(o, col)
  g.fillStyle = grd
  g.fillRect(0, 0, size, size)
  return c
}

export class Fx {
  readonly ok: boolean
  private cv: HTMLCanvasElement
  private g: CanvasRenderingContext2D | null
  private w = 0
  private h = 0
  private dpr = 1
  private maxDpr = 2
  private embers: Ember[] = []
  private puffs: Puff[] = []
  private ash: Ash[] = []
  private forged: Forged[] = []
  private forgeT = 0
  private forgeAlpha = 0
  private forgeFade = 0
  private fire = 0.25
  private fireTarget = 0.25
  private smoke = 0
  private smokeTarget = 0
  private spawnAcc = 0
  private puffAcc = 0
  private maxEmbers = 140
  private last = 0
  private raf = 0
  private slow = 0
  private frames = 0
  private sprHot!: HTMLCanvasElement
  private sprMid!: HTMLCanvasElement
  private sprDeep!: HTMLCanvasElement
  private sprSmoke!: HTMLCanvasElement
  private sprOro!: HTMLCanvasElement
  private forgeOro = false
  private running = false
  private reduced: boolean
  /** Viento horizontal (para el gesto de avivar). */
  wind = 0

  constructor(canvas: HTMLCanvasElement, reduced: boolean) {
    this.cv = canvas
    this.reduced = reduced
    let g: CanvasRenderingContext2D | null = null
    try {
      g = canvas.getContext('2d', { alpha: true })
    } catch {
      g = null
    }
    this.g = g
    this.ok = !!g
    if (!g) {
      canvas.style.display = 'none'
      return
    }
    if (reduced) this.maxEmbers = 50
    this.sprHot = sprite(32, [
      [0, 'rgba(255,246,220,1)'],
      [0.25, 'rgba(255,190,90,0.9)'],
      [0.6, 'rgba(255,110,20,0.25)'],
      [1, 'rgba(255,80,0,0)'],
    ])
    this.sprMid = sprite(32, [
      [0, 'rgba(255,200,120,1)'],
      [0.3, 'rgba(255,120,30,0.75)'],
      [1, 'rgba(200,60,0,0)'],
    ])
    this.sprDeep = sprite(32, [
      [0, 'rgba(255,120,40,0.9)'],
      [0.35, 'rgba(170,45,10,0.5)'],
      [1, 'rgba(120,20,0,0)'],
    ])
    this.sprOro = sprite(32, [
      [0, 'rgba(255,246,214,1)'],
      [0.28, 'rgba(236,197,129,0.85)'],
      [0.65, 'rgba(207,163,94,0.25)'],
      [1, 'rgba(143,103,48,0)'],
    ])
    this.sprSmoke = sprite(128, [
      [0, 'rgba(150,138,124,0.55)'],
      [0.5, 'rgba(110,100,90,0.22)'],
      [1, 'rgba(80,70,60,0)'],
    ])
    this.resize()
    window.addEventListener('resize', () => this.resize())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop()
      else this.start()
    })
  }

  resize() {
    if (!this.g) return
    const r = this.cv.getBoundingClientRect()
    this.w = Math.max(1, r.width)
    this.h = Math.max(1, r.height)
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)
    this.cv.width = Math.round(this.w * this.dpr)
    this.cv.height = Math.round(this.h * this.dpr)
  }

  get size() {
    return { w: this.w, h: this.h }
  }

  start() {
    if (!this.g || this.running) return
    this.running = true
    this.last = performance.now()
    const loop = (t: number) => {
      if (!this.running) return
      const dt = Math.max(0, Math.min(0.05, (t - this.last) / 1000))
      this.last = t
      this.adapt(dt)
      this.step(dt)
      this.draw()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private adapt(dt: number) {
    this.frames++
    this.slow = this.slow * 0.95 + (dt > 0.026 ? 1 : 0) * 0.05
    if (this.frames > 90 && this.slow > 0.6 && this.maxDpr > 1) {
      // modo ahorro / dispositivo justo: bajamos calidad una vez
      this.maxDpr = 1
      this.maxEmbers = Math.round(this.maxEmbers * 0.55)
      this.resize()
    }
  }

  /** Intensidad del fuego de fondo 0..1. */
  setFire(v: number) {
    this.fireTarget = Math.max(0, Math.min(1.4, v))
  }

  setSmoke(v: number) {
    this.smokeTarget = Math.max(0, Math.min(1, v))
  }

  /** Estallido de chispas en un punto (coordenadas CSS del escenario). */
  burst(x: number, y: number, n = 30, speed = 1) {
    if (!this.g) return
    n = this.reduced ? Math.ceil(n / 3) : n
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = (60 + Math.random() * 260) * speed
      this.embers.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 80,
        age: 0,
        life: 0.6 + Math.random() * 1.4,
        size: 1 + Math.random() * 2.2,
        ph: Math.random() * 6,
      })
    }
  }

  /** Ceniza que se desprende (rascado). */
  dust(x: number, y: number, n = 4) {
    if (!this.g) return
    for (let i = 0; i < n; i++) {
      this.ash.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 80,
        vy: -20 - Math.random() * 60,
        age: 0,
        life: 0.8 + Math.random() * 0.9,
        s: 0.8 + Math.random() * 2.2,
      })
    }
    if (this.ash.length > 400) this.ash.splice(0, this.ash.length - 400)
  }

  /**
   * Forja: las ascuas viajan hasta dibujar un texto.
   * `points` en coordenadas CSS del escenario.
   */
  forge(points: { x: number; y: number }[], seconds = 2.2, oro = false) {
    if (!this.g) return
    this.forgeOro = oro
    const n = points.length
    const { w, h } = this
    this.forged = points.map((p, i) => {
      const fromBottom = Math.random() < 0.75
      return {
        sx: fromBottom ? w * 0.5 + (Math.random() - 0.5) * w * 1.3 : Math.random() * w,
        sy: fromBottom ? h + 20 + Math.random() * 120 : -20 - Math.random() * 60,
        tx: p.x,
        ty: p.y,
        delay: (i / n) * seconds * 0.35 + Math.random() * seconds * 0.25,
        dur: seconds * (0.45 + Math.random() * 0.25),
        size: 1.1 + Math.random() * 1.5,
        ph: Math.random() * 6,
      }
    })
    this.forgeT = 0
    this.forgeAlpha = 1
    this.forgeFade = 0
  }

  /** Disuelve la forja (cuando aparece el texto real). */
  releaseForge(seconds = 1.2) {
    this.forgeFade = 1 / Math.max(0.1, seconds)
  }

  /** Muestrea puntos de un texto pintado en un canvas fuera de pantalla. */
  static samplePoints(
    lines: { text: string; font: string; x: number; y: number; w: number; h: number }[],
    step: number,
    max: number,
  ) {
    const pts: { x: number; y: number }[] = []
    for (const ln of lines) {
      const c = document.createElement('canvas')
      c.width = Math.ceil(ln.w)
      c.height = Math.ceil(ln.h)
      const g = c.getContext('2d')
      if (!g) continue
      g.fillStyle = '#fff'
      g.font = ln.font
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(ln.text, c.width / 2, c.height / 2 + ln.h * 0.04)
      const d = g.getImageData(0, 0, c.width, c.height).data
      for (let y = 0; y < c.height; y += step)
        for (let x = 0; x < c.width; x += step) {
          if (d[(y * c.width + x) * 4 + 3] > 140) pts.push({ x: ln.x + x, y: ln.y + y })
        }
    }
    if (pts.length <= max) return pts
    const k = pts.length / max
    const out: { x: number; y: number }[] = []
    for (let i = 0; i < max; i++) out.push(pts[Math.floor(i * k + Math.random() * k)])
    return out
  }

  private step(dt: number) {
    const { w, h } = this
    this.fire += (this.fireTarget - this.fire) * Math.min(1, dt * 2.5)
    this.smoke += (this.smokeTarget - this.smoke) * Math.min(1, dt * 1.8)

    // generar ascuas desde abajo
    const rate = this.fire * (this.reduced ? 14 : 42)
    this.spawnAcc += rate * dt
    while (this.spawnAcc > 1 && this.embers.length < this.maxEmbers) {
      this.spawnAcc -= 1
      const cx = w * 0.5 + (Math.random() - 0.5) * w * (0.6 + Math.random() * 0.7)
      this.embers.push({
        x: cx,
        y: h + 8,
        vx: (Math.random() - 0.5) * 20,
        vy: -(35 + Math.random() * 90) * (0.6 + this.fire * 0.7),
        age: 0,
        life: 2.2 + Math.random() * 3.5,
        size: 0.8 + Math.random() * 2,
        ph: Math.random() * 6,
      })
    }
    if (this.spawnAcc > 1) this.spawnAcc = 1

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i]
      e.age += dt
      e.ph += dt * 3
      e.vx += (Math.sin(e.ph + e.y * 0.01) * 22 + this.wind * 60) * dt
      e.vy -= 8 * dt
      e.vx *= 1 - dt * 0.6
      e.x += e.vx * dt
      e.y += e.vy * dt
      if (e.age > e.life || e.y < -20) this.embers.splice(i, 1)
    }

    // humo
    const pr = this.smoke * (this.reduced ? 2 : 5)
    this.puffAcc += pr * dt
    while (this.puffAcc > 1) {
      this.puffAcc -= 1
      this.puffs.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h * (0.55 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 12,
        vy: -(12 + Math.random() * 22),
        age: 0,
        life: 6 + Math.random() * 5,
        r: 90 + Math.random() * 120,
        a: 0.35 + Math.random() * 0.3,
      })
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i]
      p.age += dt
      p.x += (p.vx + this.wind * 40) * dt
      p.y += p.vy * dt
      p.r += 10 * dt
      if (p.age > p.life) this.puffs.splice(i, 1)
    }

    for (let i = this.ash.length - 1; i >= 0; i--) {
      const a = this.ash[i]
      a.age += dt
      a.vy += 160 * dt
      a.x += a.vx * dt
      a.y += a.vy * dt
      if (a.age > a.life) this.ash.splice(i, 1)
    }

    if (this.forged.length) {
      this.forgeT += dt
      if (this.forgeFade) {
        this.forgeAlpha -= dt * this.forgeFade
        if (this.forgeAlpha <= 0) {
          this.forged = []
          this.forgeFade = 0
        }
      }
    }
  }

  private draw() {
    const g = this.g!
    const d = this.dpr
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, this.cv.width, this.cv.height)
    g.setTransform(d, 0, 0, d, 0, 0)

    // humo (normal)
    g.globalCompositeOperation = 'source-over'
    for (const p of this.puffs) {
      const k = p.age / p.life
      const a = Math.sin(Math.PI * k) * p.a * 0.5
      if (a <= 0.004) continue
      g.globalAlpha = a
      g.drawImage(this.sprSmoke, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
    }

    // ceniza
    g.fillStyle = 'rgb(58,52,47)'
    for (const a of this.ash) {
      g.globalAlpha = Math.max(0, 1 - a.age / a.life) * 0.9
      g.fillRect(a.x, a.y, a.s, a.s)
    }

    // ascuas (aditivo)
    g.globalCompositeOperation = 'lighter'
    for (const e of this.embers) {
      const k = e.age / e.life
      const fl = 0.75 + Math.sin(e.ph * 4) * 0.25
      const a = Math.min(1, e.age * 6) * (1 - k) * fl
      if (a <= 0.01) continue
      const spr = k < 0.25 ? this.sprHot : k < 0.6 ? this.sprMid : this.sprDeep
      const s = e.size * 7 * (1 - k * 0.5)
      g.globalAlpha = a
      g.drawImage(spr, e.x - s / 2, e.y - s / 2, s, s)
    }

    // forja
    if (this.forged.length) {
      const t = this.forgeT
      for (const f of this.forged) {
        let k = (t - f.delay) / f.dur
        if (k <= 0) continue
        k = Math.min(1, k)
        const e = 1 - Math.pow(1 - k, 3)
        const sw = (1 - e) * 40
        const x = f.sx + (f.tx - f.sx) * e + Math.sin(f.ph + t * 3) * sw
        const y = f.sy + (f.ty - f.sy) * e
        const fl = 0.8 + Math.sin(f.ph + t * 9) * 0.2
        g.globalAlpha = Math.max(0, this.forgeAlpha) * fl * (0.35 + 0.65 * e)
        const s = f.size * (k < 1 ? 7 : 5.5)
        g.drawImage(this.forgeOro ? (k < 1 ? this.sprMid : this.sprOro) : k < 1 ? this.sprMid : this.sprHot, x - s / 2, y - s / 2, s, s)
      }
    }
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
  }
}
