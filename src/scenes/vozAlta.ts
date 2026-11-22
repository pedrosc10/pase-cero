import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import type { Scene } from '../core/scenes'

export const vozAlta: Scene = {
  id: 'vozAlta',
  mount(ctx) {
    const c = config.vozAlta
    const { el, audio, fx, reduced } = ctx
    fx.setFire(0.3)
    audio.pad(false)
    audio.fire(0.2)
    const n = c.paginas.length
    el.innerHTML = `
      <p class="va-aviso"><span class="va-punto" aria-hidden="true"></span>${md(c.aviso)}</p>
      <div class="va-pag" data-testid="voz-pagina" role="button" tabindex="0" aria-live="assertive" data-autofocus>
        <p class="va-txt"></p>
      </div>
      <div class="pie">
        <p class="va-hint"><span class="va-n"></span> · ${c.tocaParaSeguir}</p>
        <button class="btn fuego" type="button" data-testid="redoble" hidden>${c.botonRedoble}</button>
      </div>
    `
    const pag = el.querySelector<HTMLElement>('.va-pag')!
    const txt = el.querySelector<HTMLElement>('.va-txt')!
    const hint = el.querySelector<HTMLElement>('.va-hint')!
    const num = el.querySelector<HTMLElement>('.va-n')!
    const btn = el.querySelector<HTMLButtonElement>('[data-testid="redoble"]')!
    let i = -1
    let lock = false

    const fit = () => {
      // ajusta el tamaño para que cada frase quepa grande y entera
      txt.style.fontSize = ''
      const max = pag.clientHeight
      let fs = parseFloat(getComputedStyle(txt).fontSize)
      let guard = 0
      while (txt.scrollHeight > max && fs > 34 && guard++ < 30) {
        fs -= 3
        txt.style.fontSize = fs + 'px'
      }
    }

    const show = (k: number) => {
      i = k
      txt.innerHTML = md(c.paginas[k])
      num.textContent = `${k + 1}/${n}`
      fit()
      audio.thud(0.55 + k * 0.12)
      ctx.haptic(12)
      if (!reduced) {
        gsap.fromTo(txt, { scale: 1.14, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power4.out' })
        ctx.shake(pag, 4)
      } else gsap.fromTo(txt, { opacity: 0 }, { opacity: 1, duration: 0.4 })
      if (k === n - 1) {
        hint.hidden = true
        btn.hidden = false
        gsap.from(btn, { opacity: 0, y: 10, duration: 0.6, delay: 0.5 })
        audio.fire(0.4)
        fx.setFire(0.55)
      }
    }

    const tl = ctx.tl({ delay: 0.2 })
    tl.from(el.querySelector('.va-aviso'), { opacity: 0, y: -8, duration: 0.7 }).add(() => show(0), '+=0.3')
      .from(hint, { opacity: 0, duration: 0.6 }, '+=0.4')

    const advance = () => {
      if (lock || i < 0 || i >= n - 1) return
      lock = true
      ctx.after(420, () => (lock = false))
      show(i + 1)
    }
    ctx.on(pag, 'click', advance)
    ctx.on(pag, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        advance()
      }
    })
    ctx.on(btn, 'click', () => {
      audio.key()
      ctx.next('cut')
    })
  },
}
