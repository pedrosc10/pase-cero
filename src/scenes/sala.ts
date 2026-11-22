import { config } from '../config'
import { icon, md } from '../core/dom'
import type { Scene } from '../core/scenes'

/** Pequeño ornamento: llama entre filetes, dibujado a mano en SVG. */
export const ornamento = `<svg class="orn" viewBox="0 0 120 24" aria-hidden="true"><path d="M2 12h40M78 12h40" stroke="currentColor" stroke-width=".8"/><path d="M60 3c3 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 3-7 0 3 1 4 2 4 0-3 0-6 2-9z" fill="none" stroke="currentColor" stroke-width=".9"/><circle cx="46" cy="12" r="1.2" fill="currentColor"/><circle cx="74" cy="12" r="1.2" fill="currentColor"/></svg>`

export const sala: Scene = {
  id: 'sala',
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
      <div class="pie"><button class="btn" type="button" data-autofocus data-testid="servicio">${c.boton} ${icon.arrow}</button></div>
    `
    const tl = ctx.tl({ delay: 0.35 })
    tl.from(el.querySelector('.sala-k'), { opacity: 0, y: 6, duration: 0.6 })
      .from(el.querySelector('.sala-t .ln > span'), { yPercent: 110, duration: 1.1, ease: 'expo.out' }, '-=0.3')
      .from(el.querySelector('.sala-linea .ln > span'), { yPercent: 110, duration: 1, ease: 'expo.out' }, '-=0.75')
      .from(el.querySelector('.carta'), { y: 140, rotation: 4, opacity: 0, duration: 1.3, ease: 'expo.out' }, '-=0.4')
      .from(el.querySelectorAll('.carta-pases li'), { opacity: 0, x: -10, stagger: 0.08, duration: 0.5 }, '-=0.7')
      .from(el.querySelector('.pie'), { opacity: 0, duration: 0.6 }, '-=0.2')
      .add(() => audio.tick(), 1.6)

    const btn = el.querySelector<HTMLButtonElement>('.pie .btn')!
    ctx.on(btn, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
