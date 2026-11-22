/**
 * Director de la secuencia: monta escenas, las hace avanzar solas
 * (duraciones en config), dibuja la barra tipo stories, gestiona la
 * pausa por toque y ejecuta las transiciones de montaje.
 */
import { gsap } from 'gsap'
import type { AudioEngine } from './audio'
import type { Fx } from '../fx/fx'
import type { Transicion } from '../config'
import { haptic, shake } from './feel'
import { store } from './storage'

export interface Ctx {
  el: HTMLElement
  stage: HTMLElement
  audio: AudioEngine
  fx: Fx
  reduced: boolean
  next(): void
  goto(id: string): void
  /** Temporizador pausable (sigue a la pausa global). */
  after(ms: number, fn: () => void): void
  on<K extends keyof HTMLElementEventMap>(t: EventTarget, ev: K | string, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions): void
  tl(vars?: gsap.TimelineVars): gsap.core.Timeline
  cleanup(fn: () => void): void
  flash(amount?: number, dur?: number): void
  shake(el: Element | null, s?: number): void
  haptic(ms?: number | number[]): void
  rectOf(el: Element): DOMRect
  /** Permite o bloquea la pausa por toque en esta escena. */
  setPausable(v: boolean): void
  /** Completa el segmento de la barra (escenas sin duración fija). */
  completeSegment(): void
}

export interface Scene {
  id: string
  /** Segundos que dura (auto-avance). Sin valor = la escena decide cuándo seguir. */
  duration?: () => number
  /** Aparece en la barra de progreso. */
  progress?: boolean
  /** Se puede pausar tocando la pantalla. */
  pausable?: boolean
  scroll?: boolean
  noSave?: boolean
  /** Transición de salida. */
  out?: () => Transicion
  mount(ctx: Ctx): void
}

export class Director {
  private i = -1
  private disposers: (() => void)[] = []
  private busy = false
  private current: HTMLElement | null = null
  private autoCall: gsap.core.Tween | null = null
  private bar: HTMLElement
  private segs: HTMLElement[] = []
  private paused = false
  private pausable = false
  private pauseEl: HTMLElement
  private pending: Promise<void> = Promise.resolve()

  constructor(
    private scenes: Scene[],
    private host: HTMLElement,
    private stage: HTMLElement,
    private curtain: HTMLElement,
    private flashEl: HTMLElement,
    private audio: AudioEngine,
    private fx: Fx,
    private reduced: boolean,
    pauseText: string,
  ) {
    // barra tipo stories
    this.bar = document.createElement('div')
    this.bar.id = 'historias'
    this.bar.setAttribute('aria-hidden', 'true')
    for (const s of scenes) {
      if (!s.progress) continue
      const seg = document.createElement('span')
      seg.dataset.id = s.id
      seg.innerHTML = '<i></i>'
      this.bar.append(seg)
      this.segs.push(seg)
    }
    stage.append(this.bar)
    // indicador de pausa
    this.pauseEl = document.createElement('div')
    this.pauseEl.id = 'pausa'
    this.pauseEl.setAttribute('role', 'status')
    this.pauseEl.innerHTML = `<span class="pausa-icono" aria-hidden="true"><i></i><i></i></span><span class="pausa-txt">${pauseText}</span>`
    stage.append(this.pauseEl)
    // toque = pausa / reanudar (nunca hace falta para avanzar)
    stage.addEventListener('click', (e) => {
      const t = e.target as HTMLElement
      if (t.closest('button, a, #mute, [data-no-pausa]')) return
      if (!this.pausable && !this.paused) return
      this.togglePause()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && (this.pausable || this.paused) && !(e.target as HTMLElement).closest('button')) {
        e.preventDefault()
        this.togglePause()
      }
    })
    document.addEventListener('visibilitychange', () => {
      // si se cierra/oculta la pestaña, pausamos para no perder el hilo
      if (document.hidden && this.pausable && !this.paused) this.togglePause()
    })
  }

  /** Añade escenas que llegan en diferido (code-splitting). */
  extend(p: Promise<Scene[]>) {
    this.pending = p.then((list) => {
      this.scenes.push(...list)
      for (const s of list) {
        if (!s.progress) continue
        const seg = document.createElement('span')
        seg.dataset.id = s.id
        seg.innerHTML = '<i></i>'
        this.bar.append(seg)
        this.segs.push(seg)
      }
    })
  }

  indexOf(id: string) {
    return this.scenes.findIndex((s) => s.id === id)
  }

  get isPaused() {
    return this.paused
  }

  togglePause() {
    this.paused = !this.paused
    document.body.classList.toggle('pausado', this.paused)
    if (this.paused) {
      gsap.globalTimeline.pause()
      this.audio.suspend()
      this.fx.freeze(true)
    } else {
      gsap.globalTimeline.resume()
      this.audio.resume()
      this.fx.freeze(false)
    }
  }

  start(id = this.scenes[0].id) {
    this.show(this.indexOf(id))
  }

  private makeCtx(el: HTMLElement): Ctx {
    const d = this.disposers
    return {
      el,
      stage: this.stage,
      audio: this.audio,
      fx: this.fx,
      reduced: this.reduced,
      next: () => void this.pending.then(() => this.show(this.i + 1)),
      goto: (id) => void this.pending.then(() => this.show(this.indexOf(id))),
      after: (ms, fn) => {
        const c = gsap.delayedCall(ms / 1000, fn)
        d.push(() => c.kill())
      },
      on: (t, ev, fn, opts) => {
        t.addEventListener(ev, fn as EventListener, opts)
        d.push(() => t.removeEventListener(ev, fn as EventListener, opts))
      },
      tl: (vars) => {
        const tl = gsap.timeline(vars)
        d.push(() => tl.kill())
        return tl
      },
      cleanup: (fn) => d.push(fn),
      flash: (amount = 0.8, dur = 0.7) => {
        if (this.reduced) amount *= 0.4
        gsap.fromTo(this.flashEl, { opacity: amount }, { opacity: 0, duration: dur, ease: 'power2.out' })
      },
      shake: (target, s = 6) => shake(target, s, this.reduced),
      haptic: (ms = 12) => haptic(ms),
      rectOf: (target) => {
        const r = target.getBoundingClientRect()
        const s = this.stage.getBoundingClientRect()
        return new DOMRect(r.left - s.left, r.top - s.top, r.width, r.height)
      },
      setPausable: (v) => {
        this.pausable = v
      },
      completeSegment: () => this.completeSegment(this.scenes[this.i].id),
    }
  }

  private teardown() {
    this.autoCall?.kill()
    this.autoCall = null
    while (this.disposers.length) {
      try {
        this.disposers.pop()!()
      } catch {
        /* nada */
      }
    }
  }

  private mount(i: number) {
    this.teardown()
    const s = this.scenes[i]
    this.i = i
    const el = document.createElement('section')
    el.className = `scene scene-${s.id}${s.scroll ? ' scroll' : ''}`
    el.dataset.scene = s.id
    this.current?.remove()
    this.host.append(el)
    this.current = el
    document.body.dataset.scene = s.id
    if (!s.noSave) store.set('escena', s.id)
    this.pausable = !!s.pausable
    this.updateBar(s)
    s.mount(this.makeCtx(el))
    if (s.duration) {
      const dur = s.duration()
      this.autoCall = gsap.delayedCall(dur, () => this.show(this.i + 1))
      const seg = this.segs.find((x) => x.dataset.id === s.id)
      if (seg) {
        const tw = gsap.fromTo(seg.querySelector('i'), { scaleX: 0 }, { scaleX: 1, duration: dur, ease: 'none' })
        this.disposers.push(() => tw.kill())
      }
    }
  }

  private updateBar(s: Scene) {
    const idx = this.segs.findIndex((x) => x.dataset.id === s.id)
    this.bar.classList.toggle('on', idx >= 0 || (s.id === 'revelacion'))
    this.segs.forEach((seg, k) => {
      const fill = seg.querySelector('i')!
      gsap.set(fill, { scaleX: k < idx ? 1 : 0 })
    })
    if (s.id === 'vale') this.bar.classList.remove('on')
  }

  /** Marca el segmento actual como completo (escenas sin duración fija). */
  completeSegment(id: string) {
    const seg = this.segs.find((x) => x.dataset.id === id)
    if (seg) gsap.to(seg.querySelector('i'), { scaleX: 1, duration: 0.6 })
  }

  show(i: number) {
    if (i < 0 || i >= this.scenes.length || this.busy) return
    if (this.paused) this.togglePause()
    if (!this.current) {
      this.mount(i)
      return
    }
    const prev = this.scenes[this.i]
    let t: Transicion = prev?.out?.() ?? 'quemar'
    this.busy = true
    this.host.style.pointerEvents = 'none'
    const done = () => {
      this.busy = false
      this.host.style.pointerEvents = ''
    }
    const old = this.current
    const swap = () => this.mount(i)
    if (this.reduced) {
      gsap.to(old, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          swap()
          gsap.fromTo(this.current, { opacity: 0 }, { opacity: 1, duration: 0.5, onComplete: done })
        },
      })
      return
    }
    if (t === 'letras' && !old.querySelector('h1, p, .nom')) t = 'corte'
    TRANSICIONES[t]({ old, swap, done, director: this })
  }

  // utilidades para las transiciones
  get el() {
    return { stage: this.stage, curtain: this.curtain, flash: this.flashEl, host: this.host }
  }
  get fxRef() {
    return this.fx
  }
  get audioRef() {
    return this.audio
  }
  get currentEl() {
    return this.current
  }
}

// ───────────────────────── Transiciones de montaje ─────────────────────────
interface TArgs {
  old: HTMLElement
  swap: () => void
  done: () => void
  director: Director
}

let humoTelon: HTMLElement | null = null
let agujero: HTMLElement | null = null

const TRANSICIONES: Record<Transicion, (a: TArgs) => void> = {
  /** Frente de ascuas que sube, tapa y sigue subiendo. */
  quemar({ old, swap, done, director }) {
    const { curtain } = director.el
    curtain.classList.remove('oro')
    director.audioRef.whoosh(true)
    gsap
      .timeline({ onComplete: done })
      .to(old, { y: -26, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
      .fromTo(curtain, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'power3.in' }, 0)
      .add(swap)
      .to(curtain, { yPercent: -112, duration: 0.6, ease: 'power3.out' })
  },

  /** Igual, pero el frente es hilo dorado (tras El Jardín). */
  oro({ old, swap, done, director }) {
    const { curtain } = director.el
    curtain.classList.add('oro')
    director.audioRef.whoosh(true)
    gsap
      .timeline({ onComplete: () => (curtain.classList.remove('oro'), done()) })
      .to(old, { opacity: 0, duration: 0.7, ease: 'power2.in' }, 0)
      .fromTo(curtain, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'power2.inOut' }, 0)
      .add(swap)
      .to(curtain, { yPercent: -112, duration: 0.8, ease: 'power2.out' })
  },

  /** Corte seco al golpe de sonido. */
  corte({ old, swap, done, director }) {
    const { flash } = director.el
    director.audioRef.thud(0.9)
    gsap
      .timeline({ onComplete: done })
      .set(old, { opacity: 0 })
      .add(swap, 0.14)
      .fromTo(flash, { opacity: 0.35 }, { opacity: 0, duration: 0.5 }, 0.14)
      .add(() => {
        gsap.fromTo(director.currentEl, { scale: 1.06 }, { scale: 1, duration: 0.7, ease: 'expo.out', clearProps: 'transform' })
      }, 0.15)
  },

  /** Una cortina de humo barre la pantalla. */
  humo({ old, swap, done, director }) {
    const { stage } = director.el
    if (!humoTelon) {
      humoTelon = document.createElement('div')
      humoTelon.id = 'telon-humo'
      humoTelon.setAttribute('aria-hidden', 'true')
      humoTelon.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>'
      stage.append(humoTelon)
      gsap.set(humoTelon, { x: 0, xPercent: -130 })
    }
    director.audioRef.whoosh(false)
    director.fxRef.setSmoke(0.6)
    gsap
      .timeline({ onComplete: done })
      .set(humoTelon, { visibility: 'visible' }, 0)
      .fromTo(humoTelon, { xPercent: -130 }, { xPercent: 0, duration: 0.9, ease: 'power2.in' }, 0)
      .to(old, { opacity: 0, x: 30, duration: 0.6, ease: 'power2.in' }, 0.2)
      .add(swap, 0.9)
      .to(humoTelon, { xPercent: 130, duration: 1.1, ease: 'power2.out' }, 0.95)
      .set(humoTelon, { visibility: 'hidden' })
      .add(() => director.fxRef.setSmoke(0), 1.6)
  },

  /** La pantalla se chamusca desde una esquina como la carta. */
  chamuscar({ old, swap, done, director }) {
    const { stage } = director.el
    if (!agujero) {
      agujero = document.createElement('div')
      agujero.id = 'chamusco'
      agujero.setAttribute('aria-hidden', 'true')
      stage.append(agujero)
    }
    director.audioRef.ignite()
    gsap
      .timeline({ onComplete: done })
      .set(agujero, { opacity: 1 })
      .fromTo(agujero, { scale: 0 }, { scale: 1, duration: 1.3, ease: 'power2.in' }, 0)
      .to(old, { opacity: 0, duration: 0.25 }, 1.05)
      .add(swap, 1.3)
      .to(agujero, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 1.35)
  },

  /** Las letras arden y se van en chispas. */
  letras({ old, swap, done, director }) {
    const fx = director.fxRef
    const st = director.el.stage.getBoundingClientRect()
    const items = Array.from(old.querySelectorAll<HTMLElement>('h1, p, .nom, .et, .estado, .pase-num')).filter(
      (e) => e.offsetParent && e.getBoundingClientRect().height > 0,
    )
    director.audioRef.ignite()
    old.classList.add('arde')
    const tl = gsap.timeline({ onComplete: done })
    items.forEach((e, k) => {
      tl.add(() => {
        const r = e.getBoundingClientRect()
        fx.burst(r.left - st.left + r.width / 2, r.top - st.top + r.height / 2, 10, 0.6)
      }, k * 0.06)
      tl.to(e, { opacity: 0, y: -18, duration: 0.55, ease: 'power2.in' }, k * 0.06)
    })
    tl.to(old, { opacity: 0, duration: 0.3 }, '-=0.2')
      .add(swap)
      .add(() => {
        gsap.fromTo(director.currentEl, { opacity: 0 }, { opacity: 1, duration: 0.4 })
      })
  },
}
