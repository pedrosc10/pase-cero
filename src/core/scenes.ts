import { gsap } from 'gsap'
import type { AudioEngine } from './audio'
import type { Fx } from '../fx/fx'
import { haptic, shake } from './feel'
import { store } from './storage'

export type Transition = 'burn' | 'cut' | 'fade'

export interface Ctx {
  el: HTMLElement
  stage: HTMLElement
  audio: AudioEngine
  fx: Fx
  reduced: boolean
  next(t?: Transition): void
  goto(id: string, t?: Transition): void
  after(ms: number, fn: () => void): void
  on<K extends keyof HTMLElementEventMap>(t: EventTarget, ev: K | string, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions): void
  tl(vars?: gsap.TimelineVars): gsap.core.Timeline
  cleanup(fn: () => void): void
  flash(amount?: number, dur?: number): void
  shake(el: Element | null, s?: number): void
  haptic(ms?: number | number[]): void
  /** Posición de un elemento en coordenadas del escenario. */
  rectOf(el: Element): DOMRect
}

export interface Scene {
  id: string
  /** Índice de pase para la barra superior (0..4). */
  nav?: number
  scroll?: boolean
  /** No guardar como punto de reanudación. */
  noSave?: boolean
  mount(ctx: Ctx): void
}

export class Director {
  private i = -1
  private disposers: (() => void)[] = []
  private busy = false
  private current: HTMLElement | null = null

  constructor(
    private scenes: Scene[],
    private host: HTMLElement,
    private stage: HTMLElement,
    private curtain: HTMLElement,
    private flashEl: HTMLElement,
    private nav: HTMLElement,
    private audio: AudioEngine,
    private fx: Fx,
    private reduced: boolean,
  ) {}

  indexOf(id: string) {
    return this.scenes.findIndex((s) => s.id === id)
  }

  get savedIndex() {
    const id = store.get('escena')
    const i = id ? this.indexOf(id) : -1
    return i
  }

  start(id = this.scenes[0].id) {
    this.show(this.indexOf(id), 'cut')
  }

  private makeCtx(el: HTMLElement): Ctx {
    const d = this.disposers
    return {
      el,
      stage: this.stage,
      audio: this.audio,
      fx: this.fx,
      reduced: this.reduced,
      next: (t) => this.show(this.i + 1, t),
      goto: (id, t) => this.show(this.indexOf(id), t),
      after: (ms, fn) => {
        const id = window.setTimeout(fn, ms)
        d.push(() => clearTimeout(id))
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
    }
  }

  private teardown() {
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
    el.setAttribute('aria-live', 'polite')
    el.dataset.scene = s.id
    this.current?.remove()
    this.host.append(el)
    this.current = el
    document.body.dataset.scene = s.id
    if (!s.noSave) store.set('escena', s.id)
    this.updateNav(s)
    s.mount(this.makeCtx(el))
    // foco para lectores de pantalla
    // (solo con teclado/ratón: en móvil no queremos anillos de foco)
    if (window.matchMedia?.('(pointer: fine)').matches) {
      el.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
    }
  }

  private updateNav(s: Scene) {
    const spans = this.nav.querySelectorAll('span')
    if (s.nav === undefined) {
      this.nav.classList.remove('on')
      return
    }
    this.nav.classList.add('on')
    spans.forEach((sp, k) => {
      sp.classList.toggle('hecho', k < s.nav!)
      sp.classList.toggle('ahora', k === s.nav)
    })
  }

  show(i: number, t: Transition = 'burn') {
    if (i < 0 || i >= this.scenes.length || this.busy) return
    if (this.reduced && t !== 'cut') t = 'fade'
    if (!this.current) {
      this.mount(i)
      return
    }
    this.busy = true
    this.host.style.pointerEvents = 'none'
    const done = () => {
      this.busy = false
      this.host.style.pointerEvents = ''
    }
    const old = this.current
    if (t === 'fade') {
      gsap.to(old, {
        opacity: 0,
        duration: 0.35,
        onComplete: () => {
          this.mount(i)
          gsap.fromTo(this.current, { opacity: 0 }, { opacity: 1, duration: 0.45, onComplete: done })
        },
      })
      return
    }
    if (t === 'cut') {
      gsap.to(old, {
        opacity: 0,
        duration: 0.12,
        onComplete: () => {
          this.mount(i)
          gsap.fromTo(this.current, { opacity: 0 }, { opacity: 1, duration: 0.18, delay: 0.16, onComplete: done })
        },
      })
      return
    }
    // burn: frente de ascuas que sube, tapa, y sigue subiendo
    this.audio.whoosh(true)
    gsap
      .timeline({ onComplete: done })
      .to(old, { y: -26, opacity: 0.0, duration: 0.5, ease: 'power2.in' }, 0)
      .fromTo(this.curtain, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'power3.in' }, 0)
      .add(() => this.mount(i))
      .to(this.curtain, { yPercent: -112, duration: 0.6, ease: 'power3.out' })
  }
}
