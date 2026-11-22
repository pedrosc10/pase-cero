import { gsap } from 'gsap'
import { config } from '../config'
import { md } from '../core/dom'
import { emblemaBordable, loadEmblema, prepararTrazos, puntosTrazos } from '../core/emblema'
import type { Scene } from '../core/scenes'

/** Duración de cada grupo de trazos en el bordado (s). */
const FASES: Record<string, number> = { casas: 1.7, palmeras: 2.1, detalles: 0.8, el: 0.7, jardin: 1.5 }

/** Momento sincero: las ascuas se vuelven hilo y se borda El Jardín. */
export const jardin: Scene = {
  id: 'jardin',
  progress: true,
  pausable: true,
  duration: () => config.duraciones.jardin,
  out: () => config.transiciones.jardin,
  mount(ctx) {
    const c = config.jardin
    const { el, audio, fx, reduced } = ctx
    document.body.classList.add('modo-oro')
    ctx.cleanup(() => document.body.classList.remove('modo-oro'))
    fx.setFire(0.06)
    fx.setSmoke(0)
    audio.fire(0.06, 2)
    audio.pad(true)

    el.innerHTML = `
      <div class="jardin-luz" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="jardin-txt">
        ${c.lineas.map((l) => `<p class="j-l">${md(l)}</p>`).join('')}
      </div>
      <div class="jardin-emblema"></div>
      <div class="jardin-fin">
        <h1 class="j-bienvenida">${md(c.bienvenida)}</h1>
        <p class="j-cierre">${md(c.cierre)}</p>
      </div>
    `
    const lines = el.querySelectorAll<HTMLElement>('.j-l')
    const holder = el.querySelector<HTMLElement>('.jardin-emblema')!
    const fin = el.querySelector<HTMLElement>('.jardin-fin')!
    gsap.set([...lines, ...fin.children], { opacity: 0, y: 10 })

    // Ritmo pausado: cada línea con su aire.
    const tl = ctx.tl({ delay: 0.5 })
    lines.forEach((l, i) => tl.to(l, { opacity: 1, y: 0, duration: 1.3, ease: 'power2.out' }, i * 1.6))
    tl.to(lines, { opacity: 0.62, duration: 1 }, '+=0.8')

    const empezarBordado = async () => {
      const d = await loadEmblema()
      holder.innerHTML = emblemaBordable(d, c.alt)
      const svg = holder.querySelector<SVGSVGElement>('svg')!
      const trazos = prepararTrazos(svg)
      const relleno = svg.querySelector<SVGPathElement>('.relleno')!
      const brillo = svg.querySelector<SVGRectElement>('.brillo')!

      // Las ascuas se vuelven hilo: viajan hasta el dibujo
      const st = ctx.stage.getBoundingClientRect()
      const pts = puntosTrazos(svg, reduced ? 40 : 16, reduced ? 200 : 650).map((p) => ({ x: p.x - st.left, y: p.y - st.top }))
      fx.forge(pts, 1.8, true)
      audio.whoosh(true)

      const b = ctx.tl({ delay: 1 })
      b.fromTo(holder, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0)
      b.add(() => fx.releaseForge(1.6), 0.9)
      let t = 0.2
      for (const g of ['casas', 'palmeras', 'detalles', 'el', 'jardin']) {
        const grupo = trazos.filter((x) => x.g === g)
        if (!grupo.length) continue
        const total = grupo.reduce((a, x) => a + x.L, 0) || 1
        let acc = 0
        const dur = reduced ? FASES[g] * 0.5 : FASES[g]
        for (const x of grupo) {
          const start = t + (acc / total) * dur * 0.75
          const len = Math.max(0.18, (x.L / total) * dur * 1.6)
          b.to(x.el, { strokeDashoffset: 0, duration: len, ease: 'power1.inOut' }, start)
          acc += x.L
        }
        b.add(() => audio.stitch(dur), t)
        t += dur + 0.15
      }
      // fidelidad final: la silueta exacta del bordado
      b.to(relleno, { opacity: 1, duration: 0.9, ease: 'power2.out' }, t)
      b.fromTo(brillo, { opacity: 0, x: 0 }, { opacity: 1, x: svg.viewBox.baseVal.width * 1.5, duration: 1.8, ease: 'power2.inOut' }, t + 0.2)
      b.to(brillo, { opacity: 0, duration: 0.3 }, t + 1.7)
      b.add(() => {
        audio.yes()
        ctx.haptic(16)
        holder.classList.add('bordado')
      }, t + 0.3)
      b.to(fin.children[0], { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, t + 0.8)
      b.to(fin.children[1], { opacity: 1, y: 0, duration: 1.2 }, t + 2)
    }
    tl.add(() => void empezarBordado(), 4.6)
  },
}
