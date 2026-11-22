import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'

/**
 * Su carrera: tipografía cinética. Un golpe por frase con cortes secos
 * al ritmo del sonido; los tres juntos un instante (orgullo); corte a
 * negro y el giro, a otro ritmo (guasa).
 */
export const carrera: Scene = {
  id: 'carrera',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.carrera,
  out: () => config.transiciones.carrera,
  mount(ctx) {
    const c = config.carrera
    const { el, audio, fx, reduced } = ctx
    fx.setFire(0.35)
    fx.setSmoke(0)
    audio.fire(0.2)
    // estilos alternos: la voz de "alta cocina" contra la de "brasa de carretera"
    const estilos = ['cr-serif', 'cr-grot', 'cr-grot cr-ascua']
    el.innerHTML = `
      <p class="kicker cr-k">${md(c.antetitulo)}</p>
      <div class="cr-escenario" aria-live="polite">
        ${c.golpes.map((g, i) => `<p class="cr-golpe ${estilos[i % estilos.length]}" data-g="${i}">${md(g)}</p>`).join('')}
        <div class="cr-lista" aria-hidden="true">${c.golpes.map((g) => `<span>${md(g)}</span>`).join('')}</div>
        <div class="cr-giro">
          <p class="cr-giro-1">${md(c.giro[0])}</p>
          <p class="cr-giro-2">${md(c.giro[1])}</p>
        </div>
      </div>
    `
    const golpes = Array.from(el.querySelectorAll<HTMLElement>('.cr-golpe'))
    const lista = el.querySelector<HTMLElement>('.cr-lista')!
    const giro1 = el.querySelector<HTMLElement>('.cr-giro-1')!
    const giro2 = el.querySelector<HTMLElement>('.cr-giro-2')!
    const punch = giro2.querySelector<HTMLElement>('.hot')
    const k = el.querySelector<HTMLElement>('.cr-k')!
    gsap.set([...golpes, lista, giro1, giro2], { autoAlpha: 0 })
    if (punch) gsap.set(punch, { display: 'inline-block' })

    const golpe = (g: HTMLElement, i: number) => {
      golpes.forEach((x) => gsap.set(x, { autoAlpha: 0 }))
      gsap.set(g, { autoAlpha: 1 })
      if (!reduced) gsap.fromTo(g, { scale: 1.32, y: 6 }, { scale: 1, y: 0, duration: 0.22, ease: 'power4.out' })
      audio.thud(0.75 + i * 0.18)
      ctx.flash(0.18 + i * 0.08, 0.35)
      ctx.shake(el, 4 + i * 2)
      ctx.haptic(14)
      const r = ctx.rectOf(g)
      fx.burst(r.x + r.width / 2, r.y + r.height / 2, 16 + i * 10, 0.9)
    }

    const tl = ctx.tl({ delay: 0.1 })
    tl.from(k, { autoAlpha: 0, y: -6, duration: 0.4 }, 0)
    golpes.forEach((g, i) => tl.add(() => golpe(g, i), 0.45 + i * 0.95))
    // los tres juntos: un instante de orgullo
    tl.add(() => {
      golpes.forEach((x) => gsap.set(x, { autoAlpha: 0 }))
      audio.whoosh(true)
      fx.setFire(0.6)
    }, 3.3)
      .to(lista, { autoAlpha: 1, duration: 0.01 }, 3.3)
      .from(lista.children, { autoAlpha: 0, x: -24, stagger: 0.12, duration: 0.35, ease: 'power3.out' }, 3.3)
      // corte a negro: silencio
      .add(() => {
        gsap.set([lista, k], { autoAlpha: 0 })
        fx.setFire(0.08)
        audio.fire(0.04, 0.2)
      }, 4.7)
      // el giro, a otro ritmo
      .to(giro1, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out' }, 5.2)
      .fromTo(giro1, { y: 10 }, { y: 0, duration: 1, ease: 'power2.out' }, 5.2)
      .to(giro2, { autoAlpha: 1, duration: 0.6 }, 6.5)
    if (punch) {
      tl.fromTo(punch, { scale: 1.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'power4.in' }, 6.9).add(() => {
        audio.thud(0.6)
        audio.crackle(0.9)
        audio.crackle(0.7, 0.08)
        ctx.shake(giro2, 6)
        const r = ctx.rectOf(punch)
        fx.burst(r.x + r.width / 2, r.y + r.height / 2, 30, 0.8)
        fx.setFire(0.5)
        audio.fire(0.3)
      }, 7.15)
    }
  },
}
