import { gsap } from 'gsap'
import { config } from '../config'
import { md, reveal as decode } from '../core/dom'
import type { Scene } from '../core/scenes'
import { Fx } from '../fx/fx'

export const revelacion: Scene = {
  id: 'revelacion',
  mount(ctx) {
    const c = config.revelacion
    const { el, audio, fx, reduced } = ctx
    // El texto secreto se monta aquí, en tiempo de ejecución.
    const l1 = decode(c.linea1)
    const nombre = decode(c.nombre)
    const partes = nombre.split(' ')
    const lineasNombre = partes.length > 2 ? [partes[0], partes.slice(1).join(' ')] : partes.length === 2 ? [partes[0], partes[1]] : [nombre]

    el.innerHTML = `
      <div class="rev-negro" aria-hidden="true"></div>
      <div class="rev-cuenta" aria-hidden="true"><span></span></div>
      <div class="rev-humo izq" aria-hidden="true"></div>
      <div class="rev-humo der" aria-hidden="true"></div>
      <div class="rev-final" aria-live="assertive">
        <p class="kicker rev-k">${md(c.antetitulo)}</p>
        <p class="rev-l1"><em>${md(l1)}</em></p>
        <h1 class="rev-nombre" data-testid="nombre">
          ${lineasNombre.map((t) => `<span class="rn"><span class="rn-brillo" aria-hidden="true">${t}</span><span class="rn-txt">${t}</span></span>`).join('')}
        </h1>
        <p class="kicker rev-pie">${md(c.pie)}</p>
      </div>
      <div class="pie"><button class="btn fuego" type="button" data-testid="vale" hidden>${c.boton}</button></div>
    `
    const negro = el.querySelector<HTMLElement>('.rev-negro')!
    const cuenta = el.querySelector<HTMLElement>('.rev-cuenta span')!
    const final = el.querySelector<HTMLElement>('.rev-final')!
    const name = el.querySelector<HTMLElement>('.rev-nombre')!
    const rns = Array.from(el.querySelectorAll<HTMLElement>('.rn'))
    const btn = el.querySelector<HTMLButtonElement>('[data-testid="vale"]')!
    const humos = el.querySelectorAll<HTMLElement>('.rev-humo')

    // Ajuste de cada línea al ancho disponible
    const fit = () => {
      const avail = final.clientWidth
      const maxH = el.clientHeight * 0.17
      rns.forEach((rn) => {
        rn.style.fontSize = '100px'
        const w = rn.querySelector<HTMLElement>('.rn-txt')!.getBoundingClientRect().width || 1
        const fs = Math.min((100 * avail * 0.98) / w, maxH * 1.1)
        rn.style.fontSize = fs.toFixed(1) + 'px'
      })
    }

    gsap.set(final.children, { opacity: 0 })
    gsap.set(negro, { opacity: 0 })
    fx.setFire(0.2)
    fx.setSmoke(0.35)
    audio.fire(0.15)
    audio.drumroll(4.2)
    audio.riser(3.6)

    const tl = ctx.tl({ delay: 0.3 })
    tl.add(() => document.body.classList.add('rev-oscuro'), 0)
    ;['3', '2', '1'].forEach((n, i) => {
      const at = 0.2 + i * 1.05
      tl.add(() => {
        cuenta.textContent = n
        audio.thud(0.8 + i * 0.15)
        ctx.haptic(18)
        ctx.shake(ctx.stage.querySelector('#scenes'), 5 + i * 2)
      }, at)
      tl.fromTo(cuenta, { scale: reduced ? 1 : 1.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: 'power4.in' }, at - 0.28)
      tl.to(cuenta, { opacity: 0, scale: 0.92, duration: 0.5, ease: 'power2.in' }, at + 0.45)
    })
    // apagón
    tl.to(negro, { opacity: 1, duration: 0.35, ease: 'power2.in' }, 3.25)
    tl.add(() => {
      fx.setFire(0)
      fx.setSmoke(0)
      audio.fire(0, 0.2)
    }, 3.3)
    tl.add(() => audio.stopRoll(), 4.1)
    // golpe + forja
    tl.add(async () => {
      try {
        await document.fonts.load(`100px Anton`)
      } catch {
        /* sin fuentes: sigue */
      }
      fit()
      audio.boom()
      ctx.flash(0.9, 1.2)
      ctx.haptic([40, 30, 60])
      const st = ctx.rectOf(name)
      fx.burst(st.x + st.width / 2, st.y + st.height / 2, 120, 2)
      const lines = rns.map((rn) => {
        const r = ctx.rectOf(rn)
        return { text: rn.querySelector('.rn-txt')!.textContent || '', font: `${rn.style.fontSize} Anton, Impact, sans-serif`, x: r.x, y: r.y, w: r.width, h: r.height }
      })
      const pts = Fx.samplePoints(lines, reduced ? 9 : 4, reduced ? 250 : 1100)
      fx.forge(pts, 2)
      fx.setFire(0.9)
      fx.setSmoke(0.25)
      audio.fire(0.55, 1)
      gsap.to(negro, { opacity: 0, duration: 1.8, ease: 'power2.out' })
      document.body.classList.remove('rev-oscuro')
      gsap.to(humos[0], { xPercent: -80, opacity: 0, duration: 3.4, ease: 'power2.out' })
      gsap.to(humos[1], { xPercent: 80, opacity: 0, duration: 3.4, ease: 'power2.out' })
    }, 4.5)
    tl.to(name, { opacity: 1, duration: 0.01 }, 6.3)
    tl.fromTo(el.querySelectorAll('.rn-txt'), { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power2.inOut', onStart: () => fx.releaseForge(1.4) }, 6.3)
    tl.fromTo(el.querySelectorAll('.rn-brillo'), { opacity: 0 }, { opacity: 1, duration: 1.6, stagger: 0.2 }, 6.5)
    tl.to([el.querySelector('.rev-l1'), el.querySelector('.rev-k')], { opacity: 1, duration: 1, stagger: 0.2 }, 7.1)
    tl.to(el.querySelector('.rev-pie'), { opacity: 1, duration: 1 }, 7.8)
    tl.add(() => {
      btn.hidden = false
      gsap.from(btn, { opacity: 0, y: 10, duration: 0.7 })
      el.classList.add('respira')
    }, 8.6)

    ctx.cleanup(() => document.body.classList.remove('rev-oscuro'))
    ctx.on(btn, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
