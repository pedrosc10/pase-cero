import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import { hold } from '../core/hold'
import type { Scene } from '../core/scenes'
import { animHead, nextBtn, paseHead, reveal } from './common'

/** Lecho de brasas: carbones irregulares dibujados a mano. */
const brasas = `
<svg class="brasas" viewBox="0 0 320 90" aria-hidden="true">
  <defs>
    <radialGradient id="bc" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#ffd08a"/><stop offset=".35" stop-color="#ff7a1a"/><stop offset=".8" stop-color="#7a2306"/><stop offset="1" stop-color="#2a0f06"/></radialGradient>
  </defs>
  <g class="carbon-base" fill="#1b130e" stroke="#3a2a1f" stroke-width=".8">
    <path d="M10 78l18-22 26-4 14 14-6 16z"/><path d="M58 82l10-26 30-10 22 16-4 22z"/><path d="M112 84l12-30 34-6 18 20-8 18z"/>
    <path d="M168 84l8-28 32-8 26 14-6 22z"/><path d="M226 82l14-24 30 0 16 16-4 10z"/><path d="M276 80l10-18 22 2 4 18z"/>
    <path d="M36 88l16-14 24 2 6 12z"/><path d="M140 90l14-12 28 0 8 12z"/><path d="M200 90l18-12 26 2 6 10z"/>
  </g>
  <g class="carbon-vivo" fill="url(#bc)">
    <path d="M10 78l18-22 26-4 14 14-6 16z"/><path d="M58 82l10-26 30-10 22 16-4 22z"/><path d="M112 84l12-30 34-6 18 20-8 18z"/>
    <path d="M168 84l8-28 32-8 26 14-6 22z"/><path d="M226 82l14-24 30 0 16 16-4 10z"/><path d="M276 80l10-18 22 2 4 18z"/>
    <path d="M36 88l16-14 24 2 6 12z"/><path d="M140 90l14-12 28 0 8 12z"/><path d="M200 90l18-12 26 2 6 10z"/>
  </g>
</svg>`

export const pase2: Scene = {
  id: 'pase2',
  nav: 2,
  mount(ctx) {
    const c = config.pase2
    const { el, audio, fx } = ctx
    fx.setFire(0.15)
    fx.setSmoke(0.7)
    audio.fire(0.1)
    const last = c.oculto.length - 1
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <div class="humo-zona">
        <div class="humo-txt">
          ${c.oculto.map((l, i) => `<p class="${i === last ? 'grot l-fuego' : 'l'}" data-l="${i}">${md(l)}</p>`).join('')}
        </div>
        <div class="humo-capa" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <button class="brasero" type="button" data-testid="avivar" aria-label="${c.instruccion}" data-autofocus>
        <span class="brasero-luz" aria-hidden="true"></span>
        ${brasas}
        <span class="brasero-medidor" aria-hidden="true"><i></i></span>
      </button>
      <p class="instruccion p2-instr">${c.instruccion}</p>
      <div class="pie">
        <p class="remate p2-remate" hidden>${md(c.remate)}</p>
        <button class="btn ghost" type="button" data-testid="ayuda" hidden>${c.ayuda}</button>
        ${nextBtn(c.siguiente)}
      </div>
    `
    const lines = Array.from(el.querySelectorAll<HTMLElement>('.humo-txt [data-l]'))
    const capa = el.querySelector<HTMLElement>('.humo-capa')!
    const brasero = el.querySelector<HTMLButtonElement>('.brasero')!
    const vivo = el.querySelector<SVGGElement>('.carbon-vivo')!
    const luz = el.querySelector<HTMLElement>('.brasero-luz')!
    const medidor = el.querySelector<HTMLElement>('.brasero-medidor i')!
    const help = el.querySelector<HTMLButtonElement>('[data-testid="ayuda"]')!
    const next = el.querySelector<HTMLButtonElement>('[data-testid="siguiente"]')!

    gsap.set(lines, { opacity: 0, y: 16, scale: 1.04 })
    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(brasero, { opacity: 0, y: 30, duration: 1, ease: 'expo.out' }, 0.6).from(el.querySelector('.p2-instr'), { opacity: 0, duration: 0.6 }, 1.1)

    // humo en primer plano: deriva lenta (solo transform)
    const drift = Array.from(capa.children).map((b, i) =>
      gsap.to(b, { x: i % 2 ? 26 : -26, y: -14, duration: 5 + i, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
    )
    ctx.cleanup(() => drift.forEach((d) => d.kill()))

    const thresholds = [0.28, 0.6, 0.94]
    let shown = 0
    let done = false
    const showLine = (i: number) => {
      const ln = lines[i]
      gsap.to(ln, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'expo.out' })
      audio.whoosh(true)
      if (i === last) {
        audio.thud(0.6)
        ctx.flash(0.25, 0.6)
      }
      const r = ctx.rectOf(ln)
      fx.burst(r.x + r.width / 2, r.y + r.height, 14 + i * 10, 0.7)
      ctx.haptic(10 + i * 6)
    }

    const complete = () => {
      if (done) return
      done = true
      while (shown < lines.length) showLine(shown++)
      gsap.to(capa, { opacity: 0, duration: 1.2 })
      fx.setSmoke(0.05)
      fx.setFire(0.7)
      audio.fire(0.45)
      help.hidden = true
      gsap.to(el.querySelector('.p2-instr'), { opacity: 0, duration: 0.4 })
      gsap.to(brasero, { opacity: 0.55, duration: 1 })
      const rem = el.querySelector<HTMLElement>('.p2-remate')!
      const t = ctx.tl({ delay: 1.1 })
      t.add(() => {
        rem.hidden = false
      })
        .from(rem, { opacity: 0, y: 6, duration: 0.7 })
        .add(() => reveal(next), '+=0.3')
    }

    const H = hold(brasero, {
      duration: 4.2,
      decay: 0.35,
      keepAfterComplete: false,
      onPress: () => {
        audio.unlock()
        brasero.classList.add('pulsando')
      },
      onRelease: () => brasero.classList.remove('pulsando'),
      onProgress: (p, pressing) => {
        vivo.style.opacity = String(0.15 + p * 0.85)
        luz.style.opacity = String(p)
        luz.style.transform = `scale(${0.8 + p * 0.5})`
        medidor.style.transform = `scaleX(${p})`
        capa.style.opacity = String(Math.max(0, 1 - p * 1.05))
        if (!done) {
          fx.setFire(0.15 + p * 1.1)
          fx.setSmoke(0.7 * (1 - p))
          audio.fire(0.1 + p * 0.8, 0.2)
        }
        fx.wind = pressing ? Math.sin(performance.now() / 300) * 0.3 * p : 0
        while (shown < lines.length && p >= thresholds[shown]) showLine(shown++)
      },
      onComplete: complete,
    })
    ctx.cleanup(() => {
      H.destroy()
      fx.wind = 0
    })

    ctx.after(9000, () => {
      if (!done) reveal(help)
    })
    ctx.on(help, 'click', () => H.finish())
    ctx.on(next, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
