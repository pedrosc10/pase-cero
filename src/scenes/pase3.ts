import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'
import { animHead, nextBtn, paseHead, reveal } from './common'

const borrar = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M9 6h11v12H9l-6-6z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg>`

export const pase3: Scene = {
  id: 'pase3',
  nav: 3,
  mount(ctx) {
    const c = config.pase3
    const { el, audio, fx } = ctx
    fx.setFire(0.35)
    fx.setSmoke(0)
    audio.fire(0.2)
    const ans = String(c.respuesta)
    el.innerHTML = `
      ${paseHead(c.num, c.titulo)}
      <p class="p3-intro"><em>${md(c.intro)}</em></p>
      <h2 class="p3-q">${md(c.pregunta)}</h2>
      <div class="anio" data-testid="anio" aria-label="Año: vacío">
        ${[0, 1, 2, 3].map(() => `<span class="dig" aria-hidden="true"><b></b></span>`).join('')}
      </div>
      <p class="p3-msg" role="status" aria-live="polite"></p>
      <p class="p3-pista" aria-live="polite"></p>
      <div class="teclado" role="group" aria-label="Teclado numérico">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9']
          .map((n) => `<button type="button" class="tecla" data-k="${n}" aria-label="${n}">${n}</button>`)
          .join('')}
        <button type="button" class="tecla tecla-fn" data-k="del" aria-label="Borrar">${borrar}</button>
        <button type="button" class="tecla" data-k="0" aria-label="0">0</button>
        <button type="button" class="tecla tecla-fn tecla-ok" data-k="ok" aria-label="Comprobar">OK</button>
      </div>
      <div class="pie">
        <button class="btn ghost" type="button" data-testid="rendirse" hidden>${c.rendirse}</button>
        <div class="p3-acierto" hidden>${c.acierto.map((l, i) => `<p class="${i ? 'remate' : 'p3-ok'}">${md(l)}</p>`).join('')}</div>
        ${nextBtn(c.siguiente)}
      </div>
    `
    const digs = Array.from(el.querySelectorAll<HTMLElement>('.dig'))
    const display = el.querySelector<HTMLElement>('.anio')!
    const msg = el.querySelector<HTMLElement>('.p3-msg')!
    const pista = el.querySelector<HTMLElement>('.p3-pista')!
    const pad = el.querySelector<HTMLElement>('.teclado')!
    const surrender = el.querySelector<HTMLButtonElement>('[data-testid="rendirse"]')!
    const okBox = el.querySelector<HTMLElement>('.p3-acierto')!
    const next = el.querySelector<HTMLButtonElement>('[data-testid="siguiente"]')!

    const tl = ctx.tl({ delay: 0.15 })
    animHead(ctx, tl)
    tl.from(el.querySelector('.p3-intro'), { opacity: 0, y: 8, duration: 0.7 }, 0.5)
      .from(el.querySelector('.p3-q'), { opacity: 0, y: 10, duration: 0.8, ease: 'expo.out' }, 0.8)
      .from(digs, { opacity: 0, y: 14, stagger: 0.07, duration: 0.6, ease: 'expo.out' }, 1)
      .from(pad.children, { opacity: 0, y: 8, stagger: 0.025, duration: 0.4 }, 1.2)

    let val = ''
    let fails = 0
    let solved = false

    const render = () => {
      digs.forEach((d, i) => {
        d.querySelector('b')!.textContent = val[i] ?? ''
        d.classList.toggle('lleno', i < val.length)
        d.classList.toggle('cursor', i === val.length && !solved)
      })
      display.setAttribute('aria-label', val ? `Año: ${val.split('').join(' ')}` : 'Año: vacío')
    }
    render()

    const say = (t: string) => {
      msg.innerHTML = md(t)
      gsap.fromTo(msg, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' })
    }

    const win = () => {
      solved = true
      val = ans
      render()
      msg.textContent = ''
      pista.textContent = ''
      surrender.hidden = true
      audio.yes()
      ctx.haptic([12, 30, 12, 30, 30])
      const t = ctx.tl()
      digs.forEach((d, i) => {
        t.add(() => {
          d.classList.add('arde')
          const r = ctx.rectOf(d)
          fx.burst(r.x + r.width / 2, r.y + r.height / 2, 18)
          audio.thud(0.45)
        }, i * 0.14)
      })
      t.to(pad, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.in' }, 0.5)
        .add(() => {
          pad.style.display = 'none'
          okBox.hidden = false
          fx.setFire(0.75)
          audio.fire(0.5)
        })
        .from(okBox.children, { opacity: 0, y: 10, stagger: 0.25, duration: 0.7, ease: 'expo.out' })
        .add(() => reveal(next), '+=0.3')
    }

    const fail = () => {
      const n = Number(val)
      const f = c.fallos
      const diff = n - c.respuesta
      let t: string
      if (val.length < 4) t = f.incompleto
      else if (n > new Date().getFullYear()) t = f.futuro
      else if (n < 1800) t = f.prehistoria
      else if (Math.abs(diff) <= 3) t = diff > 0 ? f.teQuemasAntes : f.teQuemasDespues
      else if (diff > 0) t = f.masAntiguo
      else t = f.masModerno
      say(t)
      audio.nope()
      ctx.shake(display, 9)
      ctx.haptic([20, 40, 20])
      if (val.length === 4) {
        fails++
        const p = c.pistas[Math.min(fails, c.pistas.length) - 1]
        if (p) {
          pista.textContent = p
          gsap.fromTo(pista, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.4 })
        }
        if (fails >= c.pistas.length && surrender.hidden) reveal(surrender)
      }
      ctx.after(450, () => {
        if (!solved) {
          val = ''
          render()
        }
      })
    }

    const check = () => {
      if (solved) return
      if (val === ans) win()
      else fail()
    }

    const press = (k: string) => {
      if (solved) return
      audio.key()
      if (k === 'del') val = val.slice(0, -1)
      else if (k === 'ok') return check()
      else if (val.length < 4) {
        val += k
        const d = digs[val.length - 1]
        gsap.fromTo(d.querySelector('b'), { yPercent: -40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' })
      }
      render()
      if (val.length === 4) ctx.after(220, check)
    }

    ctx.on(pad, 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-k]')
      if (!b) return
      b.classList.remove('golpe')
      void b.offsetWidth
      b.classList.add('golpe')
      press(b.dataset.k!)
    })
    // teclado físico (escritorio / accesibilidad)
    ctx.on(window, 'keydown', (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('del')
      else if (e.key === 'Enter') press('ok')
    })
    ctx.on(surrender, 'click', () => {
      audio.key()
      win()
    })
    ctx.on(next, 'click', () => {
      audio.key()
      ctx.next('burn')
    })
  },
}
