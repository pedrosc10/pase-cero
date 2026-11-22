import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, paseHead } from './common'

/** Pase III · Añada: un contador baja de 2026 a 1972 y se clava. */
export const pase3: Scene = {
  id: 'pase3',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.pase3,
  out: () => config.transiciones.pase3,
  mount(ctx) {
    const c = config.pase3
    const { el, audio, fx } = ctx
    fx.setFire(0.35)
    fx.setSmoke(0)
    audio.fire(0.2)
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <p class="p3-intro"><em>${md(c.intro)}</em></p>
      <h2 class="p3-q">${md(c.pregunta)}</h2>
      <div class="anio contador" aria-label="Año ${c.respuesta}">
        ${String(c.desde)
          .split('')
          .map((d) => `<span class="dig" aria-hidden="true"><b>${d}</b></span>`)
          .join('')}
      </div>
      <p class="p3-msg" aria-live="polite"></p>
      <div class="pie p3-pie">
        <div class="p3-acierto">${c.acierto.map((l, i) => `<p class="${i ? 'remate' : 'p3-ok'}">${md(l)}</p>`).join('')}</div>
      </div>
    `
    const digs = Array.from(el.querySelectorAll<HTMLElement>('.dig'))
    const msg = el.querySelector<HTMLElement>('.p3-msg')!
    const ok = el.querySelector<HTMLElement>('.p3-acierto')!
    msg.innerHTML = md(c.comentario)
    gsap.set(msg, { opacity: 0 })
    gsap.set(ok.children, { opacity: 0 })

    const render = (v: number) => {
      const s = String(v).padStart(4, '0')
      digs.forEach((d, i) => {
        const b = d.querySelector('b')!
        if (b.textContent !== s[i]) {
          b.textContent = s[i]
          if (i === 3) audio.tick()
        }
      })
    }

    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelector('.p3-intro'), { opacity: 0, y: 8, duration: 0.7 }, 0.4)
      .from(el.querySelector('.p3-q'), { opacity: 0, y: 10, duration: 0.8, ease: 'expo.out' }, 0.8)
      .from(digs, { opacity: 0, y: 14, stagger: 0.07, duration: 0.6, ease: 'expo.out' }, 1.1)
    // cuenta atrás de años: rápida al principio, frenando al final
    const o = { v: c.desde }
    tl.to(
      o,
      {
        v: c.respuesta,
        duration: 4.6,
        ease: 'expo.out',
        onUpdate: () => render(Math.round(o.v)),
      },
      2.2,
    )
      .to(msg, { opacity: 1, duration: 0.5 }, 3.2)
      .add(() => {
        render(c.respuesta)
        digs.forEach((d, i) => {
          gsap.delayedCall(i * 0.12, () => {
            d.classList.add('arde')
            const r = ctx.rectOf(d)
            fx.burst(r.x + r.width / 2, r.y + r.height / 2, 18)
            audio.thud(0.5)
          })
        })
        ctx.shake(el.querySelector('.anio'), 8)
        ctx.haptic([12, 30, 12, 30, 30])
        fx.setFire(0.75)
        audio.fire(0.5)
      }, 6.4)
      .to(msg, { opacity: 0.45, duration: 0.6 }, 6.8)
      .to(ok.children, { opacity: 1, y: 0, stagger: 0.4, duration: 0.7, ease: 'expo.out' }, 7.1)
      .fromTo(ok.children, { y: 10 }, { y: 0, stagger: 0.4, duration: 0.7 }, 7.1)
  },
}
