import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, paseHead } from './common'

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

/** Pase II · Humo: el fuego se aviva solo, el humo se abre y salen las pistas. */
export const pase2: Scene = {
  id: 'pase2',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.pase2,
  out: () => config.transiciones.pase2,
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
      <div class="brasero" aria-hidden="true">
        <span class="brasero-luz"></span>
        ${brasas}
      </div>
      <div class="pie"><p class="remate p2-remate">${md(c.remate)}</p></div>
    `
    const lines = Array.from(el.querySelectorAll<HTMLElement>('.humo-txt [data-l]'))
    const capa = el.querySelector<HTMLElement>('.humo-capa')!
    const vivo = el.querySelector<SVGGElement>('.carbon-vivo')!
    const luz = el.querySelector<HTMLElement>('.brasero-luz')!
    const rem = el.querySelector<HTMLElement>('.p2-remate')!
    gsap.set(lines, { opacity: 0, y: 16, scale: 1.04 })
    rem.style.opacity = '0'

    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelector('.brasero'), { opacity: 0, y: 30, duration: 1, ease: 'expo.out' }, 0.4)
    Array.from(capa.children).forEach((b, i) =>
      tl.to(b, { x: i % 2 ? 26 : -26, y: -14, duration: 5 + i, repeat: -1, yoyo: true, ease: 'sine.inOut' }, 0),
    )
    // el fuego se aviva solo
    const heat = { p: 0 }
    tl.to(
      heat,
      {
        p: 1,
        duration: 4.2,
        ease: 'power1.in',
        onUpdate: () => {
          const p = heat.p
          vivo.style.opacity = String(0.15 + p * 0.85)
          luz.style.opacity = String(p)
          luz.style.transform = `scale(${0.8 + p * 0.5})`
          capa.style.opacity = String(Math.max(0, 1 - p * 1.1))
          fx.setFire(0.15 + p * 1.05)
          fx.setSmoke(0.7 * (1 - p))
          fx.wind = Math.sin(performance.now() / 300) * 0.3 * p
          audio.fire(0.1 + p * 0.75, 0.2)
        },
      },
      1,
    )
    lines.forEach((ln, i) => {
      const at = 1.9 + i * 1.25
      tl.to(ln, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'expo.out' }, at).add(() => {
        audio.whoosh(true)
        const r = ctx.rectOf(ln)
        fx.burst(r.x + r.width / 2, r.y + r.height, 14 + i * 12, 0.7)
        ctx.haptic(10 + i * 6)
        if (i === last) {
          audio.thud(0.6)
          ctx.flash(0.25, 0.6)
        }
      }, at)
    })
    tl.add(() => {
      fx.wind = 0
      fx.setFire(0.7)
      audio.fire(0.45)
    }, 5.4)
      .to(rem, { opacity: 1, duration: 0.8 }, 6.2)
    ctx.cleanup(() => (fx.wind = 0))
  },
}
