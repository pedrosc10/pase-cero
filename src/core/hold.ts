/** Gesto "mantener pulsado" con progreso, decaimiento al soltar y soporte de teclado. */
export interface HoldOpts {
  duration: number // segundos para llenar
  decay?: number // velocidad relativa de vaciado al soltar
  onProgress?: (p: number, pressing: boolean) => void
  onPress?: () => void
  onRelease?: () => void
  onComplete?: () => void
  keepAfterComplete?: boolean
}

export function hold(el: HTMLElement, o: HoldOpts) {
  let p = 0
  let pressing = false
  let done = false
  let raf = 0
  let last = 0
  const decay = o.decay ?? 1.6

  const loop = (t: number) => {
    const dt = Math.max(0, Math.min(0.2, (t - last) / 1000))
    last = t
    if (pressing) p = Math.min(1, p + dt / o.duration)
    else p = Math.max(0, p - (dt * decay) / o.duration)
    o.onProgress?.(p, pressing)
    if (p >= 1 && !done) {
      done = true
      pressing = false
      o.onComplete?.()
      if (!o.keepAfterComplete) {
        raf = 0
        return
      }
    }
    if (pressing || p > 0) raf = requestAnimationFrame(loop)
    else raf = 0
  }
  const kick = () => {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
  }
  const down = (e: PointerEvent) => {
    if (done && !o.keepAfterComplete) return
    e.preventDefault()
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* nada */
    }
    pressing = true
    o.onPress?.()
    kick()
  }
  const up = () => {
    if (!pressing) return
    pressing = false
    o.onRelease?.()
    kick()
  }
  const kd = (e: KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault()
      pressing = true
      o.onPress?.()
      kick()
    }
  }
  const ku = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') up()
  }
  const ctx = (e: Event) => e.preventDefault()

  el.addEventListener('pointerdown', down)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('lostpointercapture', up)
  el.addEventListener('keydown', kd)
  el.addEventListener('keyup', ku)
  el.addEventListener('contextmenu', ctx)

  return {
    get progress() {
      return p
    },
    /** Completar por código (botón de ayuda). */
    finish() {
      if (done) return
      p = 1
      done = true
      pressing = false
      o.onProgress?.(1, false)
      o.onComplete?.()
    },
    destroy() {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('lostpointercapture', up)
      el.removeEventListener('keydown', kd)
      el.removeEventListener('keyup', ku)
      el.removeEventListener('contextmenu', ctx)
    },
  }
}
