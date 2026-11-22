import { config } from '../config'
import { md } from '../core/dom'
import { emblemaFill, loadEmblema } from '../core/emblema'
import type { Scene } from '../core/scenes'

/**
 * "Levanta la vista." — pausa automática: en ese momento toda la familia
 * lleva el polar con el emblema bordado.
 */
export const levanta: Scene = {
  id: 'levanta',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.levanta,
  out: () => config.transiciones.levanta,
  mount(ctx) {
    const c = config.levanta
    const { el, audio, fx } = ctx
    document.body.classList.add('modo-oro')
    ctx.cleanup(() => document.body.classList.remove('modo-oro'))
    fx.setFire(0.05)
    audio.fire(0.04, 2)
    audio.pad(true)
    el.innerHTML = `
      <div class="lv-centro">
        <h1 class="lv-texto">${md(c.texto)}</h1>
        <div class="lv-emblema"></div>
      </div>
    `
    const holder = el.querySelector<HTMLElement>('.lv-emblema')!
    void loadEmblema().then((d) => {
      holder.innerHTML = emblemaFill(d, '', 'El Jardín')
      ctx.tl().from(holder, { opacity: 0, duration: 1.4, delay: 0.5 })
    })
    ctx.tl({ delay: 0.2 }).from(el.querySelector('.lv-texto'), { opacity: 0, scale: 1.06, duration: 1.4, ease: 'power2.out' })
    ctx.cleanup(() => audio.pad(false))
  },
}
