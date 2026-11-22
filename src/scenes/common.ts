import type { Ctx } from '../core/scenes'

export function paseHead(num: string, titulo: string) {
  return `
    <header class="pase-head">
      <div class="pase-num" aria-hidden="true">${num}</div>
      <div class="pase-meta">
        <span class="k">Pase ${num}</span>
        <h1 class="t"><span class="ln"><span>${titulo}</span></span></h1>
      </div>
    </header>
    <div class="regla"></div>`
}

/** Entrada estándar de la cabecera de un pase. */
export function animHead(ctx: Ctx, tl: gsap.core.Timeline) {
  const { el } = ctx
  tl.from(el.querySelector('.pase-num'), { opacity: 0, x: -24, duration: 1.1, ease: 'expo.out' }, 0)
    .from(el.querySelector('.pase-meta .k'), { opacity: 0, duration: 0.6 }, 0.2)
    .from(el.querySelector('.pase-meta .ln > span'), { yPercent: 110, duration: 1, ease: 'expo.out' }, 0.25)
    .from(el.querySelector('.regla'), { scaleX: 0, duration: 1.1, ease: 'expo.inOut' }, 0.2)
  return tl
}

