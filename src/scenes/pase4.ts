import { gsap } from 'gsap'
import { config } from '../config'
import { md, reveal as decode } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, paseHead } from './common'

/** Pase IV · El combate: cartel animado entre los dos grandes. */
export const pase4: Scene = {
  id: 'pase4',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.pase4,
  out: () => config.transiciones.pase4,
  mount(ctx) {
    const c = config.pase4
    const { el, audio, fx } = ctx
    fx.setFire(0.4)
    fx.setSmoke(0.15)
    audio.fire(0.25)
    const rival = decode(c.rival)
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <p class="p4-intro">${md(c.intro)}</p>
      <div class="ring">
        <div class="cuerdas" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="esquina roja">
          <span class="et">${c.esquinaConocida.etiqueta}</span>
          <span class="nom grot">${rival}</span>
          <span class="estado sello-esq">${c.esquinaConocida.estado}</span>
        </div>
        <div class="vs" aria-hidden="true"><span>contra</span></div>
        <div class="esquina ascuas">
          <span class="et">${c.esquinaPendiente.etiqueta}</span>
          <span class="nom grot">${c.esquinaPendiente.nombre}</span>
          <span class="estado">${c.esquinaPendiente.estado}</span>
        </div>
      </div>
      <div class="pie p4-pie">
        <p class="p4-ok">${c.lineas.map((l) => `<span>${md(l)}</span>`).join(' ')}</p>
        <p class="remate">${md(c.remate)}</p>
      </div>
    `
    const roja = el.querySelector<HTMLElement>('.esquina.roja')!
    const ascuas = el.querySelector<HTMLElement>('.esquina.ascuas')!
    const ring = el.querySelector<HTMLElement>('.ring')!
    const sello = el.querySelector<HTMLElement>('.sello-esq')!
    const okSpans = el.querySelectorAll<HTMLElement>('.p4-ok span')
    const rem = el.querySelector<HTMLElement>('.p4-pie .remate')!
    gsap.set([...okSpans, rem], { opacity: 0 })

    const land = () => {
      audio.punch()
      ctx.shake(ring, 7)
      ctx.haptic(14)
    }
    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelector('.p4-intro'), { opacity: 0, y: 8, duration: 0.7 }, 0.4)
      .from(el.querySelectorAll('.cuerdas i'), { scaleX: 0, stagger: 0.1, duration: 0.8, ease: 'expo.inOut' }, 0.6)
      .add(() => audio.bell(2), 0.9)
      .from(roja, { xPercent: -130, rotation: -7, duration: 0.5, ease: 'power4.in', onComplete: land }, 1.2)
      .from(el.querySelector('.vs'), { opacity: 0, scale: 1.8, duration: 0.4, ease: 'power3.out' }, 1.8)
      .from(ascuas, { xPercent: 130, rotation: 7, duration: 0.5, ease: 'power4.in', onComplete: land }, 2.1)
      // el sello "Conquistada" cae sobre la esquina ya conocida
      .from(
        sello,
        {
          scale: 2.4,
          opacity: 0,
          rotation: -20,
          duration: 0.3,
          ease: 'power4.in',
          onComplete: () => {
            audio.thud(0.7)
            ctx.shake(roja, 5)
          },
        },
        3.2,
      )
      // "???" late: 0 visitas
      .add(() => ascuas.classList.add('pista'), 4)
      .to(okSpans[0], { opacity: 1, duration: 0.6 }, 4.6)
      .to(roja, { opacity: 0.4, duration: 0.6 }, 5.6)
      .add(() => {
        ascuas.classList.remove('pista')
        ascuas.classList.add('ganadora')
        audio.punch()
        audio.bell(3)
        ctx.flash(0.5, 0.8)
        ctx.shake(ring, 10)
        const r = ctx.rectOf(ascuas)
        fx.burst(r.x + r.width / 2, r.y + r.height / 2, 60, 1.2)
        fx.setFire(0.85)
        audio.fire(0.6)
      }, 5.8)
      .to(okSpans[1], { opacity: 1, duration: 0.6 }, 6)
      .to(rem, { opacity: 1, duration: 0.7 }, 7.4)
  },
}
