/**
 * "Háptica" multiplataforma.
 *  - Android/Chrome: navigator.vibrate si existe.
 *  - iOS Safari no tiene vibrate. En iOS 18+, pulsar un <input switch>
 *    produce un toque háptico del sistema: lo usamos solo dentro de un
 *    gesto y sin errores si no funciona.
 *  - Siempre compensamos con feedback visual (micro-shake) y sonoro.
 */
import { gsap } from 'gsap'

let switchLabel: HTMLLabelElement | null = null

function ensureSwitch() {
  if (switchLabel) return switchLabel
  try {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.append(input)
    document.body.append(label)
    switchLabel = label
  } catch {
    switchLabel = null
  }
  return switchLabel
}

export function haptic(ms: number | number[] = 12) {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
      return
    }
    ensureSwitch()?.click()
  } catch {
    /* sin háptica, sin drama */
  }
}

export function shake(el: Element | null, strength = 6, reduced = false) {
  if (!el || reduced) return
  gsap.fromTo(
    el,
    { x: 0 },
    {
      keyframes: { x: [0, -strength, strength * 0.8, -strength * 0.5, strength * 0.3, 0] },
      duration: 0.38,
      ease: 'power2.out',
      clearProps: 'x',
    },
  )
}
