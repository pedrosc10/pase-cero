import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, nextBtn, paseHead, reveal } from './common'

/** Entrecot dibujado a mano: contorno, cordón de grasa, vetas y brillo de film. */
const entrecot = `
<svg class="p0-carne" viewBox="0 0 300 212" aria-hidden="true">
  <defs>
    <pattern id="p0h" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-32)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="#efe6d6" stroke-width=".7" opacity=".42"/>
    </pattern>
    <radialGradient id="p0e" cx=".45" cy=".45" r=".7">
      <stop offset="0" stop-color="#a5483f"/>
      <stop offset=".7" stop-color="#7a2e28"/>
      <stop offset="1" stop-color="#4e1b17"/>
    </radialGradient>
  </defs>
  <rect x="14" y="12" width="272" height="188" fill="none" stroke="#efe6d6" stroke-opacity=".28" stroke-width=".8"/>
  <path d="M40 118C30 78 62 42 112 32c38-8 84-6 120 12 34 18 48 52 38 84-10 32-44 54-90 58-40 4-84-2-110-18-20-12-26-28-30-50z" fill="#efe6d6" fill-opacity=".08" stroke="#efe6d6" stroke-width="1.3"/>
  <path d="M52 118c-6-34 20-64 62-73 36-8 78-5 110 10 30 15 40 43 33 70-8 27-37 45-77 49-38 4-76-2-100-14-18-10-25-24-28-42z" fill="url(#p0h)" stroke="#efe6d6" stroke-width=".7" stroke-opacity=".6"/>
  <path d="M84 104c16-28 56-36 88-31 28 5 48 21 54 43 2 8 0 16-4 22-16 18-56 24-92 18-34-6-50-28-46-52z" fill="url(#p0e)" stroke="#efe6d6" stroke-width="1"/>
  <path d="M78 96c18-30 62-40 98-34 30 5 52 22 60 46 2 10 0 20-4 28" fill="none" stroke="#efe6d6" stroke-width=".9" stroke-dasharray="1.5 3.5" opacity=".75"/>
  <g fill="none" stroke="#f3d9c9" stroke-width=".8" opacity=".6" stroke-linecap="round">
    <path d="M104 108c8-4 14 2 22-1"/><path d="M140 96c6 3 12-1 18 1"/><path d="M168 118c8 4 16-2 24 2"/>
    <path d="M112 132c10-2 16 4 26 1"/><path d="M150 140c6 2 12-2 18 0s8 2 12-1"/><path d="M190 100c4 2 9 1 12-2"/>
    <path d="M128 118c3-2 6 0 9-1"/><path d="M200 130c4 1 7-1 10 1"/>
  </g>
  <g stroke="#fff6e6" stroke-linecap="round" class="c-film">
    <path d="M30 40l46-22" stroke-width="1.6" opacity=".5"/>
    <path d="M42 46l20-10" stroke-width="3" opacity=".18"/>
    <path d="M236 186l40-26" stroke-width="1.2" opacity=".4"/>
  </g>
  <text x="280" y="194" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8.5" letter-spacing=".8" fill="#a89b87">ENTRECOT · 1 UD · CRUDO</text>
</svg>`

export const pase0: Scene = {
  id: 'pase0',
  nav: 0,
  mount(ctx) {
    const c = config.pase0
    const { el, audio, fx } = ctx
    fx.setFire(0.32)
    fx.setSmoke(0)
    audio.fire(0.2)
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <div class="p0-intro">${c.intro.map((l) => `<p class="ln"><span>${md(l)}</span></p>`).join('')}</div>
      <div class="p0-zona">
        <div class="p0-antes">
          ${entrecot}
          <p class="p0-peticion"><em>${md(c.peticion)}</em></p>
        </div>
        <section class="ficha" aria-label="Ficha de cata" hidden>
          <header class="ficha-h"><span>Ficha de cata</span><span>Nº 0</span></header>
          <dl>${c.ficha.map(([k, v]) => `<div class="fila"><dt>${k}</dt><dd>${md(v)}</dd></div>`).join('')}</dl>
          <p class="ficha-veredicto">${md(c.veredicto)}</p>
        </section>
      </div>
      <div class="pie">
        <p class="remate p0-remate" hidden>${md(c.remate)}</p>
        <button class="btn fuego" type="button" data-testid="catar" data-autofocus>${c.boton}</button>
        ${nextBtn(c.siguiente)}
      </div>
    `
    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelectorAll('.p0-intro .ln > span'), { yPercent: 110, duration: 0.9, stagger: 0.18, ease: 'expo.out' }, 0.5)
      .from(el.querySelector('.p0-carne'), { opacity: 0, scale: 0.92, rotation: -4, duration: 1.4, ease: 'expo.out' }, 0.8)
      .from(el.querySelector('.p0-peticion'), { opacity: 0, y: 8, duration: 0.7 }, 1.3)
      .from(el.querySelector('[data-testid="catar"]'), { opacity: 0, y: 10, duration: 0.6 }, 1.6)

    // el film "brilla" de vez en cuando
    const glare = gsap.to(el.querySelector('.c-film'), { opacity: 0.35, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    ctx.cleanup(() => glare.kill())

    const catar = el.querySelector<HTMLButtonElement>('[data-testid="catar"]')!
    const next = el.querySelector<HTMLButtonElement>('[data-testid="siguiente"]')!
    ctx.on(catar, 'click', () => {
      audio.key()
      catar.disabled = true
      const antes = el.querySelector<HTMLElement>('.p0-antes')!
      const ficha = el.querySelector<HTMLElement>('.ficha')!
      const filas = ficha.querySelectorAll<HTMLElement>('.fila')
      const t = ctx.tl()
      const intro = el.querySelector<HTMLElement>('.p0-intro')!
      t.to([antes, catar, intro], { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' })
        .add(() => {
          antes.hidden = true
          catar.hidden = true
          intro.hidden = true
          ficha.hidden = false
        })
        .from(ficha, { opacity: 0, y: 30, rotation: -1.5, duration: 0.8, ease: 'expo.out' })
        .from(ficha.querySelector('.ficha-h'), { opacity: 0, duration: 0.4 }, '-=0.4')
      filas.forEach((f, i) => {
        t.from(f, { opacity: 0, x: -12, duration: 0.45, ease: 'power3.out', onStart: () => audio.tick() }, i === 0 ? '+=0.1' : '+=0.55')
      })
      t.from(
        ficha.querySelector('.ficha-veredicto'),
        {
          opacity: 0,
          scale: 1.25,
          duration: 0.35,
          ease: 'power4.in',
          onComplete: () => {
            audio.thud(0.7)
            ctx.shake(ficha, 5)
            ctx.haptic(18)
          },
        },
        '+=0.6',
      )
      const remate = el.querySelector<HTMLElement>('.p0-remate')!
      t.add(() => {
        remate.hidden = false
      }, '+=0.4')
        .from(remate, { opacity: 0, y: 6, duration: 0.6 })
        .add(() => reveal(next), '+=0.3')
    })
    ctx.on(next, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
