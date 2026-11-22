import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'

/** Pequeño ornamento: llama entre filetes, dibujado a mano en SVG. */
export const ornamento = `<svg class="orn" viewBox="0 0 120 24" aria-hidden="true"><path d="M2 12h40M78 12h40" stroke="currentColor" stroke-width=".8"/><path d="M60 3c3 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 3-7 0 3 1 4 2 4 0-3 0-6 2-9z" fill="none" stroke="currentColor" stroke-width=".9"/><circle cx="46" cy="12" r="1.2" fill="currentColor"/><circle cx="74" cy="12" r="1.2" fill="currentColor"/></svg>`

export const sala: Scene = {
  id: 'sala',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.sala,
  out: () => config.transiciones.sala,
  mount(ctx) {
    const c = config.sala
    const { el, audio, fx } = ctx
    fx.setFire(0.3)
    fx.setSmoke(0)
    audio.fire(0.22)
    el.innerHTML = `
      <p class="kicker sala-k">${c.antetitulo}</p>
      <h1 class="serif-xl sala-t"><span class="ln"><span>${c.bienvenida}</span></span></h1>
      <p class="sala-linea"><span class="ln"><span><em>${md(c.linea)}</em></span></span></p>
      <article class="carta" aria-label="${c.carta.titulo}">
        <div class="carta-in">
          ${ornamento}
          <h2 class="carta-t">${c.carta.titulo}</h2>
          <p class="carta-st"><em>${c.carta.subtitulo}</em></p>
          <ol class="carta-pases">
            ${c.carta.pases
              .map((p, i) =>
                i === 0
                  ? `<li><span class="n">${p.num}</span><span class="nm">${p.nombre}</span></li>`
                  : `<li><span class="n">${p.num}</span><span class="nm tachado" aria-label="Por descubrir"><i style="width:${38 + ((i * 23) % 40)}%"></i></span></li>`,
              )
              .join('')}
          </ol>
          <dl class="carta-pie">
            ${c.carta.pie.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
          </dl>
        </div>
        <span class="carta-quemado" aria-hidden="true"></span>
      </article>
    `
    const tl = ctx.tl({ delay: 0.3 })
    tl.from(el.querySelector('.sala-k'), { opacity: 0, y: 6, duration: 0.6 })
      .from(el.querySelector('.sala-t .ln > span'), { yPercent: 110, duration: 1.1, ease: 'expo.out' }, '-=0.3')
      .from(el.querySelector('.sala-linea .ln > span'), { yPercent: 110, duration: 1, ease: 'expo.out' }, '-=0.75')
      .from(el.querySelector('.carta'), { y: 160, rotation: 5, opacity: 0, duration: 1.4, ease: 'expo.out', onStart: () => audio.whoosh(true) }, '+=0.2')
      .from(el.querySelectorAll('.carta-pases li'), { opacity: 0, x: -10, stagger: 0.12, duration: 0.5, onStart: () => audio.tick() }, '-=0.8')
      .from(el.querySelectorAll('.tachado i'), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.15, duration: 0.5, ease: 'power2.out' }, '-=0.4')
      // la carta empieza a chamuscarse antes de la transición
      .fromTo(el.querySelector('.carta-quemado'), { scale: 0.6, transformOrigin: '100% 100%' }, { scale: 1.6, duration: 3, ease: 'power1.in' }, '+=1.4')
  },
}
