import { gsap } from 'gsap'
import { config } from '../config'
import { isIOS } from '../core/dom'
import { emblemaFill, loadEmblema } from '../core/emblema'
import { hold } from '../core/hold'
import { session } from '../core/session'
import { store } from '../core/storage'
import type { Scene } from '../core/scenes'

const DOTS = 44

export const entrada: Scene = {
  id: 'entrada',
  noSave: true,
  out: () => config.transiciones.entrada,
  mount(ctx) {
    const c = config.entrada
    const { el, audio, fx } = ctx
    const r = 86
    const dots = Array.from({ length: DOTS }, (_, i) => {
      const a = (i / DOTS) * Math.PI * 2 - Math.PI / 2
      return `<circle class="d" cx="${(100 + Math.cos(a) * r).toFixed(2)}" cy="${(100 + Math.sin(a) * r).toFixed(2)}" r="2.6"/>`
    }).join('')

    const showSilence = isIOS() && !audio.sessionPlayback
    el.innerHTML = `
      <div class="ent-huella" aria-hidden="true"></div>
      <div class="ent-centro">
        <h1 class="ent-titulo"><span class="ln"><span>${c.titulo}</span></span></h1>
        <button class="ent-anillo" type="button" aria-label="${c.instruccion}" data-autofocus data-testid="encender">
          <span class="ent-nucleo" aria-hidden="true"></span>
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <g class="dots-off">${dots}</g>
            <g class="dots-on">${dots}</g>
          </svg>
        </button>
        <p class="instruccion ent-instr">${c.instruccion}</p>
      </div>
      <div class="ent-pie">
        <p class="ent-sonido"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>${c.avisoSonido}</p>
        ${showSilence ? `<p class="ent-silencio">${c.avisoSilencio}</p>` : ''}
      </div>
      <div class="ent-reanudar" hidden>
        <button class="btn fuego" type="button" data-a="seguir" data-testid="continuar">${c.continuar}</button>
        <button class="btn ghost" type="button" data-a="nuevo" data-testid="nuevo">${c.empezarDeNuevo}</button>
      </div>
    `
    // El emblema, casi invisible entre la ceniza (se reconocerá al bordarse)
    if (config.emblemaEnEntrada) {
      const huella = el.querySelector<HTMLElement>('.ent-huella')!
      // diferido: no compite con la primera pintura ni con el gesto inicial
      ctx.after(1600, () => {
        void loadEmblema().then((d) => {
          huella.innerHTML = emblemaFill(d)
          requestAnimationFrame(() => huella.classList.add('on'))
        })
      })
    }
    const ring = el.querySelector<HTMLButtonElement>('.ent-anillo')!
    const on = Array.from(el.querySelectorAll<SVGCircleElement>('.dots-on .d'))
    const core = el.querySelector<HTMLElement>('.ent-nucleo')!
    let lit = 0

    fx.setFire(0.12)
    fx.setSmoke(0)

    const intro = ctx.tl({ delay: 0.15 })
    intro
      .from(el.querySelector('.ent-titulo .ln > span'), { yPercent: 110, duration: 1.2, ease: 'expo.out' })
      .from(ring, { opacity: 0, scale: 0.85, duration: 1, ease: 'power3.out' }, '-=0.7')
      .from([el.querySelector('.ent-instr'), el.querySelector('.ent-pie')], { opacity: 0, y: 8, duration: 0.8, stagger: 0.15 }, '-=0.5')

    const saved = session.saved
    const canResume = !!saved && !['entrada', 'sala'].includes(saved)

    const H = hold(ring, {
      duration: 1.7,
      decay: 1.8,
      onPress: () => {
        audio.unlock()
        ring.classList.add('pulsando')
        ctx.haptic(8)
      },
      onRelease: () => ring.classList.remove('pulsando'),
      onProgress: (p) => {
        const n = Math.max(0, Math.min(DOTS, Math.round(p * DOTS)))
        if (n !== lit) {
          for (let i = Math.min(n, lit); i < Math.max(n, lit); i++) on[i].style.opacity = i < n ? '1' : '0'
          if (n > lit && n % 4 === 0) audio.crackle(0.4 + p * 0.6)
          lit = n
        }
        core.style.opacity = String(0.15 + p * 0.85)
        core.style.transform = `scale(${0.55 + p * 0.55})`
        fx.setFire(0.12 + p * 0.7)
        audio.fire(p * 0.6, 0.2)
      },
      onComplete: () => {
        ring.classList.remove('pulsando')
        ring.classList.add('encendido')
        audio.ignite()
        audio.fire(0.35, 1.5)
        fx.setFire(0.55)
        const rr = ctx.rectOf(ring)
        fx.burst(rr.x + rr.width / 2, rr.y + rr.height / 2, 70, 1.3)
        ctx.flash(0.55, 0.9)
        ctx.haptic([15, 40, 25])
        store.set('encendido', '1')
        if (canResume) {
          const box = el.querySelector<HTMLElement>('.ent-reanudar')!
          box.hidden = false
          gsap.to([el.querySelector('.ent-instr'), el.querySelector('.ent-pie')], { opacity: 0, duration: 0.4 })
          gsap.from(box.children, { opacity: 0, y: 14, stagger: 0.1, duration: 0.6, delay: 0.3, ease: 'power3.out' })
        } else {
          ctx.after(1100, () => ctx.next())
        }
      },
    })
    ctx.cleanup(() => H.destroy())

    ctx.on(el, 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-a]')
      if (!b) return
      audio.key()
      if (b.dataset.a === 'seguir' && saved) ctx.goto(saved)
      else {
        store.del('escena')
        ctx.next()
      }
    })
  },
}
