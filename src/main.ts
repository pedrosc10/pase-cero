import '@fontsource/cormorant-garamond/latin-300.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-300-italic.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-sc/latin-400.css'
import '@fontsource/cormorant-sc/latin-600.css'
import '@fontsource/anton/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './styles/base.css'
import './styles/scenes.css'

import { gsap } from 'gsap'
import { config } from './config'
import { AudioEngine } from './core/audio'
import { Director } from './core/scenes'
import { prefersReduced } from './core/dom'
import { Fx } from './fx/fx'
import { cargarResto, scenes } from './scenes'

document.title = config.meta.tituloPestana
const reduced = prefersReduced()
if (reduced) document.documentElement.classList.add('reduced')

const app = document.getElementById('app')!
app.innerHTML = `
  <div id="stage">
    <div id="glow"></div>
    <canvas id="fx" aria-hidden="true"></canvas>
    <div id="scenes"></div>
    <div id="vignette"></div>
    <div id="curtain" aria-hidden="true"></div>
    <div id="grain" aria-hidden="true"></div>
    <div id="flash" aria-hidden="true"></div>
    <button id="mute" type="button" aria-label="Silenciar sonido" aria-pressed="false">
      <svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>
      <svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>
    </button>
  </div>
  <p id="desk-note">Ábrelo en el móvil</p>
`

const stage = document.getElementById('stage')!
const audio = new AudioEngine()
const fx = new Fx(document.getElementById('fx') as HTMLCanvasElement, reduced)
// el canvas arranca tras la primera pintura
requestAnimationFrame(() => setTimeout(() => fx.start(), 450))

// grano de película: textura de ruido pequeña generada una vez (barata)
setTimeout(() => {
  try {
    const n = document.createElement('canvas')
    n.width = n.height = 160
    const g = n.getContext('2d')!
    const img = g.createImageData(160, 160)
    for (let k = 0; k < img.data.length; k += 4) {
      const v = Math.random() * 255
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v
      img.data[k + 3] = 255
    }
    g.putImageData(img, 0, 0)
    document.documentElement.style.setProperty('--grano', `url(${n.toDataURL()})`)
  } catch {
    /* sin grano */
  }
}, 300)

const curtain = document.getElementById('curtain')!
gsap.set(curtain, { y: 0, yPercent: 110 })

// silencio
const mute = document.getElementById('mute') as HTMLButtonElement
const syncMute = () => {
  mute.setAttribute('aria-pressed', String(audio.muted))
  mute.setAttribute('aria-label', audio.muted ? 'Activar sonido' : 'Silenciar sonido')
}
syncMute()
mute.addEventListener('click', () => {
  audio.unlock()
  audio.setMuted(!audio.muted)
  syncMute()
})

// desbloqueo de audio en cualquier gesto (iOS exige touchend/click)
const unlock = () => audio.unlock()
for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { passive: true, capture: true })

// gesto de pellizco accidental fuera de zonas con scroll
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false } as AddEventListenerOptions)

window.addEventListener('resize', () => fx.resize())

// Safari iOS 26: las barras flotantes cambian el área visible. Además de 100dvh,
// ajustamos el escenario a la altura REAL visible (visualViewport) para que ningún
// botón quede tapado por la interfaz del navegador.
const vv = window.visualViewport
const desk = window.matchMedia('(min-width: 760px) and (min-height: 560px)')
const fitViewport = () => {
  if (!vv || desk.matches || Math.abs(vv.scale - 1) > 0.01) {
    stage.style.height = ''
  } else {
    stage.style.height = `${Math.round(vv.height)}px`
  }
  fx.resize()
}
vv?.addEventListener('resize', fitViewport)
desk.addEventListener?.('change', fitViewport)
fitViewport()

const director = new Director(
  scenes,
  document.getElementById('scenes')!,
  stage,
  curtain,
  document.getElementById('flash')!,
  audio,
  fx,
  reduced,
  config.pausa.texto,
)

director.start()
// el resto de escenas se descarga mientras Antonio enciende las brasas
director.extend(new Promise((r) => setTimeout(r, 200)).then(cargarResto))
