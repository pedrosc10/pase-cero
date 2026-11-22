import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, paseHead } from './common'

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

/** Escribe un texto letra a letra (máquina de escribir) sobre un timeline. */
export function escribir(tl: gsap.core.Timeline, el: HTMLElement, at: number | string, cps = 38, onTick?: () => void) {
  const full = el.textContent || ''
  el.textContent = ''
  el.setAttribute('aria-label', full)
  const o = { n: 0 }
  tl.to(
    o,
    {
      n: full.length,
      duration: full.length / cps,
      ease: 'none',
      onUpdate: () => {
        const k = Math.round(o.n)
        if (el.textContent!.length !== k) {
          el.textContent = full.slice(0, k)
          if (k % 3 === 0) onTick?.()
        }
      },
    },
    at,
  )
}

export const pase0: Scene = {
  id: 'pase0',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.pase0,
  out: () => config.transiciones.pase0,
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
        <section class="ficha" aria-label="Ficha de cata">
          <header class="ficha-h"><span>Ficha de cata</span><span>Nº 0</span></header>
          <dl>${c.ficha.map(([k, v]) => `<div class="fila"><dt>${k}</dt><dd>${md(v)}</dd></div>`).join('')}</dl>
          <p class="ficha-veredicto">${md(c.veredicto)}</p>
        </section>
      </div>
      <div class="pie"><p class="remate p0-remate">${md(c.remate)}</p></div>
    `
    const antes = el.querySelector<HTMLElement>('.p0-antes')!
    const intro = el.querySelector<HTMLElement>('.p0-intro')!
    const ficha = el.querySelector<HTMLElement>('.ficha')!
    const remate = el.querySelector<HTMLElement>('.p0-remate')!
    ficha.style.display = 'none'
    remate.style.opacity = '0'

    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelectorAll('.p0-intro .ln > span'), { yPercent: 110, duration: 0.9, stagger: 0.2, ease: 'expo.out' }, 0.5)
      .from(el.querySelector('.p0-carne'), { opacity: 0, scale: 0.9, rotation: -5, duration: 1.4, ease: 'expo.out' }, 0.8)
      .from(el.querySelector('.p0-peticion'), { opacity: 0, y: 8, duration: 0.7 }, 1.6)
      .to(el.querySelector('.c-film'), { opacity: 0.35, duration: 0.8, yoyo: true, repeat: 1 }, 1.8)
      // la cata se escribe sola
      .to([antes, intro], { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' }, 3.6)
      .add(() => {
        antes.style.display = 'none'
        intro.style.display = 'none'
        ficha.style.display = ''
        audio.whoosh(true)
      }, 4.05)
      .from(ficha, { opacity: 0, y: 40, rotation: -2.5, duration: 0.8, ease: 'expo.out' }, 4.1)
    let t = 4.7
    ficha.querySelectorAll<HTMLElement>('.fila').forEach((f) => {
      tl.from(f.querySelector('dt'), { opacity: 0, duration: 0.2 }, t)
      const dd = f.querySelector<HTMLElement>('dd')!
      const len = (dd.textContent || '').length
      escribir(tl, dd, t + 0.15, 40, () => audio.tick())
      t += 0.15 + len / 40 + 0.35
    })
    tl.from(
      ficha.querySelector('.ficha-veredicto'),
      {
        opacity: 0,
        scale: 1.35,
        duration: 0.32,
        ease: 'power4.in',
        onComplete: () => {
          audio.thud(0.8)
          ctx.shake(ficha, 6)
          ctx.haptic(18)
        },
      },
      t + 0.2,
    ).to(remate, { opacity: 1, duration: 0.6 }, t + 0.9)
  },
}
