import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import { emblemaFill, loadEmblema } from '../core/emblema'
import type { Scene } from '../core/scenes'
import { nextBtn, reveal } from './common'

/**
 * "Levanta la vista." — pausa obligatoria: en ese momento toda la familia
 * lleva el polar con el emblema bordado.
 */
export const levanta: Scene = {
  id: 'levanta',
  mount(ctx) {
    const c = config.levanta
    const { el, audio, fx } = ctx
    document.body.classList.add('modo-oro')
    ctx.cleanup(() => document.body.classList.remove('modo-oro'))
    fx.setFire(0.05)
    audio.fire(0.04, 2)
    audio.pad(true)
    const espera = Math.max(1, c.espera)
    el.innerHTML = `
      <div class="lv-centro">
        <h1 class="lv-texto">${md(c.texto)}</h1>
        <div class="lv-emblema"></div>
        <div class="lv-espera" role="progressbar" aria-label="Espera un momento" aria-valuemin="0" aria-valuemax="${espera}"><i></i></div>
      </div>
      <div class="pie">${nextBtn(c.siguiente)}</div>
    `
    const holder = el.querySelector<HTMLElement>('.lv-emblema')!
    const bar = el.querySelector<HTMLElement>('.lv-espera i')!
    const next = el.querySelector<HTMLButtonElement>('[data-testid="siguiente"]')!
    void loadEmblema().then((d) => {
      holder.innerHTML = emblemaFill(d, '', 'El Jardín')
      gsap.from(holder, { opacity: 0, duration: 1.6, delay: 0.6 })
    })

    const tl = ctx.tl({ delay: 0.3 })
    tl.from(el.querySelector('.lv-texto'), { opacity: 0, scale: 1.06, duration: 1.6, ease: 'power2.out' })
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: espera, ease: 'none' }, 0)
      .to(el.querySelector('.lv-espera'), { opacity: 0, duration: 0.6 }, espera)
      .add(() => reveal(next), espera + 0.1)

    ctx.on(next, 'click', () => {
      audio.key()
      audio.pad(false)
      ctx.next('burn')
    })
  },
}
