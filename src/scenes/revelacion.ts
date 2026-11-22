import { gsap } from 'gsap'
import { config } from '../config'
import { md, reveal as decode } from '../core/dom'
import type { Scene } from '../core/scenes'
import { Fx } from '../fx/fx'
import { crearCeniza, type Ceniza } from './ceniza'

/**
 * Revelación (interacción 2): cuenta atrás, apagón y… la ceniza.
 * Antonio rasca y destapa el nombre delante de todos.
 */
export const revelacion: Scene = {
  id: 'revelacion',
  progress: true,
  pausable: false,
  out: () => config.transiciones.revelacion,
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
      <p class="rev-preparados" aria-live="assertive">${md(c.preparados)}</p>
      <div class="rev-final">
        <p class="kicker rev-k">${md(c.antetitulo)}</p>
        <div class="rev-placa" data-testid="rascar-final" data-no-pausa>
          <div class="rev-oculto" aria-live="assertive">
            <p class="rev-l1"><em>${md(l1)}</em></p>
            <h1 class="rev-nombre" data-testid="nombre">
              ${lineasNombre.map((t) => `<span class="rn"><span class="rn-brillo" aria-hidden="true">${t}</span><span class="rn-txt">${t}</span></span>`).join('')}
            </h1>
            <p class="kicker rev-pie">${md(c.pie)}</p>
          </div>
          <canvas class="rev-cv" aria-label="${c.instruccion}"></canvas>
        </div>
        <p class="instruccion rev-instr">${md(c.instruccion)}</p>
        <button class="btn ghost rev-ayuda" type="button" data-testid="soplar" hidden>${c.ayuda}</button>
      </div>
    `
    const negro = el.querySelector<HTMLElement>('.rev-negro')!
    const cuenta = el.querySelector<HTMLElement>('.rev-cuenta span')!
    const final = el.querySelector<HTMLElement>('.rev-final')!
    const placa = el.querySelector<HTMLElement>('.rev-placa')!
    const oculto = el.querySelector<HTMLElement>('.rev-oculto')!
    const cv = el.querySelector<HTMLCanvasElement>('.rev-cv')!
    const instr = el.querySelector<HTMLElement>('.rev-instr')!
    const ayuda = el.querySelector<HTMLButtonElement>('.rev-ayuda')!
    const name = el.querySelector<HTMLElement>('.rev-nombre')!
    const rns = Array.from(el.querySelectorAll<HTMLElement>('.rn'))

    // Ajuste de cada línea del nombre al ancho disponible
    const fit = () => {
      const avail = oculto.clientWidth
      const maxH = el.clientHeight * 0.15
      rns.forEach((rn) => {
        rn.style.fontSize = '100px'
        const w = rn.querySelector<HTMLElement>('.rn-txt')!.getBoundingClientRect().width || 1
        rn.style.fontSize = Math.min((100 * avail * 0.92) / w, maxH * 1.1).toFixed(1) + 'px'
      })
    }
    void document.fonts.load('100px Anton').then(fit, fit)
    fit()

    gsap.set(final, { opacity: 0 })
    gsap.set(negro, { opacity: 0 })
    gsap.set(el.querySelectorAll('.rn-brillo'), { opacity: 0 })
    fx.setFire(0.2)
    fx.setSmoke(0.35)
    audio.fire(0.15)
    audio.drumroll()
    audio.riser(4.8)

    let revelado = false
    const destapar = () => {
      if (revelado) return
      revelado = true
      ayuda.hidden = true
      audio.stopRoll()
      audio.scratch(0)
      audio.boom()
      ctx.flash(0.9, 1.2)
      ctx.haptic([40, 30, 60])
      ctx.completeSegment()
      ceniza?.retirar(0.5)
      instr.classList.remove('late')
      gsap.to(instr, { opacity: 0, duration: 0.3 })
      const r = ctx.rectOf(name)
      fx.burst(r.x + r.width / 2, r.y + r.height / 2, 130, 2)
      // las ascuas corren a meterse en las letras
      const lines = rns.map((rn) => {
        const rr = ctx.rectOf(rn)
        return { text: rn.querySelector('.rn-txt')!.textContent || '', font: `${rn.style.fontSize} Anton, Impact, sans-serif`, x: rr.x, y: rr.y, w: rr.width, h: rr.height }
      })
      fx.forge(Fx.samplePoints(lines, reduced ? 9 : 4, reduced ? 250 : 1000), 1.3)
      ctx.after(1500, () => fx.releaseForge(1.4))
      fx.setFire(1)
      fx.setSmoke(0.1)
      audio.fire(0.6, 1)
      const t = ctx.tl()
      t.fromTo(name, { scale: 1.08 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, 0)
        .to(el.querySelectorAll('.rn-brillo'), { opacity: 1, duration: 1.2, stagger: 0.15 }, 0.1)
        .add(() => el.classList.add('respira'), 1.5)
      ctx.after(config.duraciones.revelacionTrasRascar * 1000, () => ctx.next())
    }

    let ceniza: Ceniza | null = null

    const prep = el.querySelector<HTMLElement>('.rev-preparados')!
    const tl = ctx.tl({ delay: 0.15 })
    tl.add(() => {
      document.body.classList.add('rev-oscuro')
      ctx.stage.classList.add('tension')
    }, 0)
    // momento de grupo: que los primos hagan el redoble
    tl.fromTo(prep, { autoAlpha: 0, scale: reduced ? 1 : 1.25 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.out', onStart: () => (audio.thud(1), ctx.flash(0.3, 0.4)) }, 0)
      .to(prep, { autoAlpha: 0, duration: 0.25 }, 1.45)
    // 3 · 2 · 1, cada vez más pesado, con latidos entre medias
    ;['3', '2', '1'].forEach((n, i) => {
      const at = 1.9 + i * 1.05
      tl.add(() => {
        cuenta.textContent = n
        audio.thud(0.85 + i * 0.2)
        ctx.haptic(18 + i * 8)
        ctx.flash(0.12 + i * 0.08, 0.4)
        ctx.shake(ctx.stage.querySelector('#scenes'), 6 + i * 3)
      }, at)
      tl.add(() => audio.thud(0.25 + i * 0.1), at + 0.5)
      tl.fromTo(cuenta, { scale: reduced ? 1 : 2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.24, ease: 'power4.in' }, at - 0.24)
      tl.to(cuenta, { opacity: 0, scale: 0.9, duration: 0.45, ease: 'power2.in' }, at + 0.5)
    })
    // apagón total… y la ceniza sale de la oscuridad
    tl.to(negro, { opacity: 1, duration: 0.2, ease: 'power2.in' }, 5)
      .add(() => {
        ctx.stage.classList.remove('tension')
        fx.setFire(0)
        audio.fire(0, 0.1)
      }, 5.05)
      .add(() => {
        fx.setFire(0.25)
        fx.setSmoke(0.2)
        audio.fire(0.2, 0.5)
        audio.ignite()
        document.body.classList.remove('rev-oscuro')
        // la ceniza se pinta ya con el tamaño definitivo del nombre
        fit()
        ceniza = crearCeniza(ctx, placa, cv)
        ceniza.rascable(0.5, destapar)
      }, 5.6)
      .to(final, { opacity: 1, duration: 0.01 }, 5.6)
      .to(negro, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 5.65)
      .from(placa, { scale: 0.92, opacity: 0, duration: 0.8, ease: 'expo.out' }, 5.65)
      .from(instr, { opacity: 0, y: 8, duration: 0.5 }, 6.2)
      .add(() => instr.classList.add('late'), 6.7)

    // nunca bloquear: si en 20 s no ha rascado, aparece "Soplar la ceniza"
    ctx.after(24000, () => {
      if (revelado) return
      ayuda.hidden = false
      gsap.from(ayuda, { opacity: 0, y: 8, duration: 0.6 })
    })
    ctx.on(ayuda, 'click', () => {
      if (!ceniza) {
        ceniza = crearCeniza(ctx, placa, cv)
      }
      ceniza.soplar(1.1)
      ctx.after(900, destapar)
    })
    ctx.cleanup(() => {
      ctx.stage.classList.remove('tension')
      document.body.classList.remove('rev-oscuro')
      audio.stopRoll()
    })
  },
}
