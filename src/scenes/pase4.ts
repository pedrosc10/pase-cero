import { gsap } from 'gsap'
import { config } from '../config'
import { md, reveal as decode } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, nextBtn, paseHead, reveal } from './common'

export const pase4: Scene = {
  id: 'pase4',
  nav: 4,
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
      <div class="ring" role="group" aria-label="${c.pregunta}">
        <div class="cuerdas" aria-hidden="true"><i></i><i></i><i></i></div>
        <button type="button" class="esquina roja" data-testid="esquina-conocida">
          <span class="et">${c.esquinaConocida.etiqueta}</span>
          <span class="nom grot">${rival}</span>
          <span class="estado sello-esq">${c.esquinaConocida.estado}</span>
        </button>
        <div class="vs" aria-hidden="true"><span>contra</span></div>
        <button type="button" class="esquina ascuas" data-testid="esquina-pendiente">
          <span class="et">${c.esquinaPendiente.etiqueta}</span>
          <span class="nom grot">${c.esquinaPendiente.nombre}</span>
          <span class="estado">${c.esquinaPendiente.estado}</span>
        </button>
      </div>
      <p class="p4-q">${md(c.pregunta)}</p>
      <p class="p4-msg" role="status" aria-live="polite"></p>
      <div class="pie">
        <div class="p4-acierto" hidden>
          <p class="p4-ok">${c.acierto.map((l) => `<span>${md(l)}</span>`).join(' ')}</p>
          <p class="remate">${md(c.remate)}</p>
        </div>
        ${nextBtn(c.siguiente)}
      </div>
    `
    const roja = el.querySelector<HTMLButtonElement>('.esquina.roja')!
    const ascuas = el.querySelector<HTMLButtonElement>('.esquina.ascuas')!
    const msg = el.querySelector<HTMLElement>('.p4-msg')!
    const okBox = el.querySelector<HTMLElement>('.p4-acierto')!
    const q = el.querySelector<HTMLElement>('.p4-q')!
    const next = el.querySelector<HTMLButtonElement>('[data-testid="siguiente"]')!

    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelector('.p4-intro'), { opacity: 0, y: 8, duration: 0.7 }, 0.5)
      .from(el.querySelectorAll('.cuerdas i'), { scaleX: 0, stagger: 0.1, duration: 0.8, ease: 'expo.inOut' }, 0.7)
      .add(() => audio.bell(2), 0.9)
      .from(roja, { xPercent: -120, rotation: -6, duration: 0.55, ease: 'power4.in', onComplete: land }, 1.1)
      .from(el.querySelector('.vs'), { opacity: 0, scale: 1.6, duration: 0.4, ease: 'power3.out' }, 1.75)
      .from(ascuas, { xPercent: 120, rotation: 6, duration: 0.55, ease: 'power4.in', onComplete: land }, 1.95)
      .from(q, { opacity: 0, y: 8, duration: 0.6 }, 2.7)

    function land() {
      audio.punch()
      ctx.shake(el.querySelector('.ring'), 7)
      ctx.haptic(14)
    }

    let wrong = 0
    let done = false
    const hint = () => ascuas.classList.add('pista')
    ctx.after(12000, () => {
      if (!done) hint()
    })

    ctx.on(roja, 'click', () => {
      if (done) return
      wrong++
      audio.nope()
      ctx.shake(roja, 10)
      ctx.haptic([20, 40, 20])
      msg.innerHTML = md(c.falloConocida)
      gsap.fromTo(msg, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4 })
      if (wrong >= 2) hint()
    })

    ctx.on(ascuas, 'click', () => {
      if (done) return
      done = true
      audio.punch()
      audio.bell(3)
      ctx.flash(0.6, 0.8)
      ctx.haptic([20, 30, 40])
      ctx.shake(el.querySelector('.ring'), 12)
      ascuas.classList.remove('pista')
      ascuas.classList.add('ganadora')
      roja.classList.add('apagada')
      const r = ctx.rectOf(ascuas)
      fx.burst(r.x + r.width / 2, r.y + r.height / 2, 60, 1.2)
      fx.setFire(0.85)
      audio.fire(0.6)
      msg.textContent = ''
      const t = ctx.tl({ delay: 0.3 })
      t.to([q, msg], { opacity: 0, duration: 0.3 })
        .add(() => {
          q.hidden = true
          msg.hidden = true
          okBox.hidden = false
        })
        .from(okBox.querySelectorAll('.p4-ok span'), { opacity: 0, y: 12, stagger: 0.35, duration: 0.7, ease: 'expo.out' })
        .from(okBox.querySelector('.remate'), { opacity: 0, y: 6, duration: 0.6 }, '+=0.3')
        .add(() => reveal(next), '+=0.3')
    })
    ctx.on(next, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
