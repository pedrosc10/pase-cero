import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { crearCeniza } from './ceniza'
import { animHead, paseHead } from './common'

/** Pase I · Hollín: la ceniza se aparta sola y deja ver la pista. */
export const pase1: Scene = {
  id: 'pase1',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.pase1,
  out: () => config.transiciones.pase1,
  mount(ctx) {
    const c = config.pase1
    const { el, audio, fx } = ctx
    fx.setFire(0.25)
    fx.setSmoke(0.1)
    audio.fire(0.15)
    const last = c.oculto.length - 1
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <div class="rascar">
        <div class="rascar-txt">
          ${c.oculto.map((l, i) => (i === last ? `<p class="grot l-fuego">${md(l)}</p>` : `<p class="l">${md(l)}</p>`)).join('')}
        </div>
        <canvas class="rascar-cv" aria-hidden="true"></canvas>
      </div>
      <div class="pie"><p class="remate p1-remate">${md(c.remate)}</p></div>
    `
    const box = el.querySelector<HTMLElement>('.rascar')!
    const cv = el.querySelector<HTMLCanvasElement>('.rascar-cv')!
    const rem = el.querySelector<HTMLElement>('.p1-remate')!
    rem.style.opacity = '0'
    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(box, { opacity: 0, scale: 0.97, duration: 0.9, ease: 'expo.out' }, 0.4)
    const ceniza = crearCeniza(ctx, box, cv)
    tl.add(() => ceniza.soplar(2.6), 1.2)
      .add(() => {
        fx.setFire(0.6)
        audio.fire(0.4)
        audio.thud(0.6)
        const r = ctx.rectOf(box)
        fx.burst(r.x + r.width / 2, r.y + r.height * 0.8, 40)
      }, 4.1)
      .fromTo(el.querySelector('.l-fuego'), { scale: 1.12 }, { scale: 1, duration: 0.8, ease: 'expo.out' }, 4.1)
      .to(rem, { opacity: 1, duration: 0.8 }, 5)
  },
}
