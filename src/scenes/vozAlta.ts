import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'

/** Segundos de cada página: base + por palabra (lectura en voz alta). */
export const tiemposVoz = () => {
  const c = config.vozAlta
  return c.paginas.map((p) => c.segundosBase + p.split(/\s+/).filter(Boolean).length * c.segundosPorPalabra)
}

export const vozAlta: Scene = {
  id: 'vozAlta',
  progress: true,
  pausable: true,
  duration: () => 1 + tiemposVoz().reduce((a, b) => a + b, 0),
  out: () => config.transiciones.vozAlta,
  mount(ctx) {
    const c = config.vozAlta
    const { el, audio, fx, reduced } = ctx
    fx.setFire(0.3)
    audio.fire(0.2)
    const n = c.paginas.length
    el.innerHTML = `
      <p class="va-aviso"><span class="va-punto" aria-hidden="true"></span>${md(c.aviso)}</p>
      <div class="va-pag" aria-live="assertive"><p class="va-txt"></p></div>
      <div class="pie"><p class="va-hint"></p></div>
    `
    const pag = el.querySelector<HTMLElement>('.va-pag')!
    const txt = el.querySelector<HTMLElement>('.va-txt')!
    const num = el.querySelector<HTMLElement>('.va-hint')!

    const fit = () => {
      txt.style.fontSize = ''
      const max = pag.clientHeight
      let fs = parseFloat(getComputedStyle(txt).fontSize)
      let guard = 0
      while (txt.scrollHeight > max && fs > 34 && guard++ < 30) {
        fs -= 3
        txt.style.fontSize = fs + 'px'
      }
    }
    const show = (k: number) => {
      txt.innerHTML = md(c.paginas[k])
      num.textContent = `${k + 1} / ${n}`
      fit()
      audio.thud(0.55 + k * 0.12)
      ctx.haptic(12)
      if (!reduced) {
        gsap.fromTo(txt, { scale: 1.14, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power4.out' })
        ctx.shake(pag, 4)
      } else gsap.fromTo(txt, { opacity: 0 }, { opacity: 1, duration: 0.4 })
      if (k === n - 1) {
        audio.fire(0.4)
        fx.setFire(0.55)
      }
    }

    const tl = ctx.tl({ delay: 0.2 })
    tl.from(el.querySelector('.va-aviso'), { opacity: 0, y: -8, duration: 0.7 })
    let t = 0.8
    tiemposVoz().forEach((s, k) => {
      tl.add(() => show(k), t)
      t += s
    })
  },
}
