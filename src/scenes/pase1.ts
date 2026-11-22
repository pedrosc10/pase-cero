import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, nextBtn, paseHead, reveal } from './common'

const GRID_X = 24
const GRID_Y = 16
const THRESHOLD = 0.58

export const pase1: Scene = {
  id: 'pase1',
  nav: 1,
  mount(ctx) {
    const c = config.pase1
    const { el, audio, fx } = ctx
    fx.setFire(0.25)
    fx.setSmoke(0.1)
    audio.fire(0.15)
    const last = c.oculto.length - 1
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <p class="instruccion p1-instr">${c.instruccion}</p>
      <div class="rascar" data-testid="rascar" role="img" aria-label="Zona de ceniza para rascar">
        <div class="rascar-txt" aria-hidden="true">
          ${c.oculto.map((l, i) => (i === last ? `<p class="grot l-fuego">${md(l)}</p>` : `<p class="l">${md(l)}</p>`)).join('')}
        </div>
        <canvas class="rascar-cv"></canvas>
      </div>
      <p class="sr-only" aria-live="polite" data-sr></p>
      <div class="pie">
        <p class="remate p1-remate" hidden>${md(c.remate)}</p>
        <button class="btn ghost" type="button" data-testid="ayuda" hidden>${c.ayuda}</button>
        ${nextBtn(c.siguiente)}
      </div>
    `
    const box = el.querySelector<HTMLElement>('.rascar')!
    const cv = el.querySelector<HTMLCanvasElement>('.rascar-cv')!
    const txt = el.querySelector<HTMLElement>('.rascar-txt')!
    const help = el.querySelector<HTMLButtonElement>('[data-testid="ayuda"]')!
    const next = el.querySelector<HTMLButtonElement>('[data-testid="siguiente"]')!
    const sr = el.querySelector<HTMLElement>('[data-sr]')!

    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(box, { opacity: 0, scale: 0.97, duration: 1, ease: 'expo.out' }, 0.5).from(el.querySelector('.p1-instr'), { opacity: 0, duration: 0.6 }, 1)

    // ── canvas de hollín ──
    const g = cv.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0
    const cleared = new Uint8Array(GRID_X * GRID_Y)
    let clearedCount = 0
    let done = false

    const paintSoot = () => {
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
      // grumos de ceniza
      for (let i = 0; i < 1400; i++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const s = Math.random() * 2.4
        const v = 20 + Math.random() * 40
        g.fillStyle = `rgba(${v + 10},${v + 4},${v},${0.35 + Math.random() * 0.5})`
        g.fillRect(x, y, s, s)
      }
      for (let i = 0; i < 26; i++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const rr = 18 + Math.random() * 50
        const rg = g.createRadialGradient(x, y, 0, x, y, rr)
        rg.addColorStop(0, 'rgba(70,60,52,.22)')
        rg.addColorStop(1, 'rgba(70,60,52,0)')
        g.fillStyle = rg
        g.fillRect(x - rr, y - rr, rr * 2, rr * 2)
      }
      // brasitas sueltas
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(255,${90 + Math.random() * 80},20,${0.25 + Math.random() * 0.5})`
        g.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2)
      }
      g.font = `italic 300 ${Math.round(W * 0.06)}px "Cormorant Garamond", Georgia, serif`
      g.fillStyle = 'rgba(168,155,135,.35)'
      g.textAlign = 'center'
      g.fillText('rasca aquí', W / 2, H / 2 + W * 0.02)
    }
    // espera a que la tipografía esté y el layout asentado
    requestAnimationFrame(paintSoot)

    const finish = (auto: boolean) => {
      if (done) return
      done = true
      audio.scratch(0)
      audio.whoosh(true)
      ctx.haptic([10, 30, 20])
      sr.textContent = c.oculto.join(' ').replace(/[*_]/g, '')
      gsap.to(cv, { opacity: 0, duration: auto ? 0.9 : 0.6, ease: 'power2.out' })
      const rr = ctx.rectOf(box)
      for (let i = 0; i < 6; i++) fx.dust(rr.x + Math.random() * rr.width, rr.y + Math.random() * rr.height, 10)
      fx.burst(rr.x + rr.width / 2, rr.y + rr.height * 0.8, 40)
      fx.setFire(0.6)
      audio.fire(0.4)
      help.hidden = true
      const t = ctx.tl({ delay: 0.3 })
      t.fromTo(txt.querySelector('.l-fuego'), { scale: 1.12 }, { scale: 1, duration: 0.8, ease: 'expo.out', onStart: () => audio.thud(0.6) })
      const rem = el.querySelector<HTMLElement>('.p1-remate')!
      t.add(() => {
        rem.hidden = false
      }, '+=0.4')
        .from(rem, { opacity: 0, y: 6, duration: 0.7 })
        .add(() => reveal(next), '+=0.4')
      gsap.to(el.querySelector('.p1-instr'), { opacity: 0, duration: 0.4 })
    }

    let lastX = 0
    let lastY = 0
    let lastT = 0
    let drawing = false
    const brush = (x: number, y: number) => {
      if (!g) return
      const R = Math.max(22, W * 0.075)
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
      // cobertura aproximada en rejilla
      const cx0 = Math.floor(((x - R * 0.7) / W) * GRID_X)
      const cx1 = Math.floor(((x + R * 0.7) / W) * GRID_X)
      const cy0 = Math.floor(((y - R * 0.7) / H) * GRID_Y)
      const cy1 = Math.floor(((y + R * 0.7) / H) * GRID_Y)
      for (let gy = Math.max(0, cy0); gy <= Math.min(GRID_Y - 1, cy1); gy++)
        for (let gx = Math.max(0, cx0); gx <= Math.min(GRID_X - 1, cx1); gx++) {
          const k = gy * GRID_X + gx
          if (!cleared[k]) {
            cleared[k] = 1
            clearedCount++
          }
        }
      if (clearedCount / cleared.length > THRESHOLD) finish(false)
    }
    const stroke = (x: number, y: number) => {
      const dx = x - lastX
      const dy = y - lastY
      const dist = Math.hypot(dx, dy)
      const steps = Math.max(1, Math.ceil(dist / 8))
      for (let i = 1; i <= steps; i++) brush(lastX + (dx * i) / steps, lastY + (dy * i) / steps)
      const now = performance.now()
      const speed = dist / Math.max(1, now - lastT)
      audio.scratch(Math.min(1, speed * 0.9))
      if (Math.random() < 0.5) {
        const rr = ctx.rectOf(box)
        fx.dust(rr.x + x, rr.y + y, 3)
      }
      lastX = x
      lastY = y
      lastT = now
    }
    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top] as const
    }
    ctx.on(cv, 'pointerdown', (e: PointerEvent) => {
      if (done) return
      e.preventDefault()
      drawing = true
      try {
        cv.setPointerCapture(e.pointerId)
      } catch {
        /* nada */
      }
      const [x, y] = pos(e)
      lastX = x
      lastY = y
      lastT = performance.now()
      brush(x, y)
      ctx.haptic(6)
    })
    ctx.on(cv, 'pointermove', (e: PointerEvent) => {
      if (!drawing || done) return
      const [x, y] = pos(e)
      stroke(x, y)
    })
    const end = () => {
      drawing = false
      audio.scratch(0)
    }
    ctx.on(cv, 'pointerup', end)
    ctx.on(cv, 'pointercancel', end)

    // Sin canvas: se resuelve solo
    if (!g) ctx.after(1500, () => finish(true))
    // Salida de emergencia
    ctx.after(7000, () => {
      if (!done) reveal(help)
    })
    ctx.on(help, 'click', () => finish(true))
    ctx.on(next, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
