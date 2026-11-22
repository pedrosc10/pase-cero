/**
 * Motor de sonido 100 % sintetizado con Web Audio API.
 * No hay ni un archivo de audio: todo se genera en tiempo real
 * (ruido filtrado, osciladores y envolventes) → sin derechos de autor.
 */
import { store } from './storage'

type AudioSessionNav = Navigator & { audioSession?: { type: string } }

export class AudioEngine {
  ctx: AudioContext | null = null
  private master!: GainNode
  private comp!: DynamicsCompressorNode
  private noiseBuf!: AudioBuffer
  private brownBuf!: AudioBuffer
  private verb!: ConvolverNode
  private verbSend!: GainNode
  private fireGain: GainNode | null = null
  private fireFilter: BiquadFilterNode | null = null
  private crackleTimer = 0
  private fireLevel = 0
  private scratchGain: GainNode | null = null
  private padNodes: { stop: (t: number) => void } | null = null
  private rollStop: (() => void) | null = null
  muted = store.get('muted') === '1'
  /** true si podemos forzar el modo "reproducción" (ignora el interruptor de silencio). */
  readonly sessionPlayback: boolean

  constructor() {
    const nav = navigator as AudioSessionNav
    this.sessionPlayback = false
    try {
      if (nav.audioSession && 'type' in nav.audioSession) {
        nav.audioSession.type = 'playback'
        this.sessionPlayback = true
      }
    } catch {
      /* sin soporte */
    }
  }

  /** Debe llamarse dentro de un gesto del usuario. Idempotente. */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AC) return
        this.ctx = new AC({ latencyHint: 'interactive' })
        this.build()
      }
      if (this.ctx.state !== 'running') void this.ctx.resume()
      // buffer silencioso: desbloqueo clásico de iOS
      const b = this.ctx.createBuffer(1, 1, 22050)
      const s = this.ctx.createBufferSource()
      s.buffer = b
      s.connect(this.ctx.destination)
      s.start(0)
    } catch {
      this.ctx = null
    }
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running'
  }

  setMuted(m: boolean) {
    this.muted = m
    store.set('muted', m ? '1' : '0')
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, t, 0.05)
  }

  private build() {
    const c = this.ctx!
    this.comp = c.createDynamicsCompressor()
    this.comp.threshold.value = -14
    this.comp.ratio.value = 4
    this.master = c.createGain()
    this.master.gain.value = this.muted ? 0 : 0.9
    this.comp.connect(this.master).connect(c.destination)

    // ruido blanco y marrón (2 s)
    const len = c.sampleRate * 2
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate)
    this.brownBuf = c.createBuffer(1, len, c.sampleRate)
    const w = this.noiseBuf.getChannelData(0)
    const br = this.brownBuf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const r = Math.random() * 2 - 1
      w[i] = r
      last = (last + 0.02 * r) / 1.02
      br[i] = last * 3.5
    }

    // reverb sintética (respuesta al impulso de ruido con decaimiento)
    this.verb = c.createConvolver()
    const irLen = Math.floor(c.sampleRate * 2.6)
    const ir = c.createBuffer(2, irLen, c.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch)
      for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3.2)
    }
    this.verb.buffer = ir
    this.verbSend = c.createGain()
    this.verbSend.gain.value = 0.32
    this.verbSend.connect(this.verb).connect(this.comp)
  }

  private out(node: AudioNode, wet = 0.25, dest?: AudioNode) {
    node.connect(dest ?? this.comp)
    if (wet > 0) {
      const g = this.ctx!.createGain()
      g.gain.value = wet
      node.connect(g).connect(this.verbSend)
    }
  }

  private noise(t: number, dur: number, opts: { type?: BiquadFilterType; f?: number; f2?: number; q?: number; gain?: number; attack?: number; wet?: number; brown?: boolean; dest?: AudioNode }) {
    const c = this.ctx!
    const src = c.createBufferSource()
    src.buffer = opts.brown ? this.brownBuf : this.noiseBuf
    src.loop = true
    const f = c.createBiquadFilter()
    f.type = opts.type ?? 'bandpass'
    f.frequency.setValueAtTime(opts.f ?? 1000, t)
    if (opts.f2) f.frequency.exponentialRampToValueAtTime(opts.f2, t + dur)
    f.Q.value = opts.q ?? 1
    const g = c.createGain()
    const peak = opts.gain ?? 0.5
    const a = opts.attack ?? 0.004
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + a)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g)
    this.out(g, opts.wet ?? 0.15, opts.dest)
    src.start(t, Math.random() * 1.5)
    src.stop(t + dur + 0.05)
  }

  private tone(t: number, dur: number, opts: { type?: OscillatorType; f: number; f2?: number; gain?: number; attack?: number; wet?: number; detune?: number; dest?: AudioNode }) {
    const c = this.ctx!
    const o = c.createOscillator()
    o.type = opts.type ?? 'sine'
    o.frequency.setValueAtTime(opts.f, t)
    if (opts.f2) o.frequency.exponentialRampToValueAtTime(opts.f2, t + dur)
    if (opts.detune) o.detune.value = opts.detune
    const g = c.createGain()
    const a = opts.attack ?? 0.005
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.3, t + a)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    this.out(g, opts.wet ?? 0.2, opts.dest)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  private now() {
    return this.ctx ? this.ctx.currentTime + 0.01 : 0
  }

  private ok() {
    return !!this.ctx && this.ctx.state === 'running'
  }

  // ───────────── Fuego de fondo ─────────────
  /** Nivel del fuego ambiente 0..1 (crepitar + rumor). */
  fire(level: number, ramp = 0.6) {
    this.fireLevel = level
    if (!this.ok()) return
    const c = this.ctx!
    if (!this.fireGain) {
      const src = c.createBufferSource()
      src.buffer = this.brownBuf
      src.loop = true
      this.fireFilter = c.createBiquadFilter()
      this.fireFilter.type = 'lowpass'
      this.fireFilter.frequency.value = 380
      this.fireGain = c.createGain()
      this.fireGain.gain.value = 0
      src.connect(this.fireFilter).connect(this.fireGain)
      this.out(this.fireGain, 0.05)
      src.start()
      this.scheduleCrackle()
    }
    const t = c.currentTime
    this.fireGain.gain.cancelScheduledValues(t)
    this.fireGain.gain.setTargetAtTime(0.05 + level * 0.32, t, ramp / 3)
    this.fireFilter!.frequency.setTargetAtTime(260 + level * 900, t, ramp / 3)
    if (level <= 0.001) this.fireGain.gain.setTargetAtTime(0, t, ramp / 3)
  }

  private scheduleCrackle() {
    const tick = () => {
      if (this.ok() && this.fireLevel > 0.01) {
        const n = Math.random() < 0.25 ? 3 : 1
        for (let i = 0; i < n; i++) this.crackle(this.fireLevel * (0.5 + Math.random() * 0.5), i * 0.03)
      }
      const rate = 90 + (1 - Math.min(1, this.fireLevel)) * 600
      this.crackleTimer = window.setTimeout(tick, rate * (0.4 + Math.random() * 1.4))
    }
    tick()
  }

  crackle(intensity = 0.6, delay = 0) {
    if (!this.ok()) return
    const t = this.now() + delay
    this.noise(t, 0.012 + Math.random() * 0.03, {
      type: 'bandpass',
      f: 1800 + Math.random() * 3800,
      q: 0.8 + Math.random() * 2,
      gain: 0.08 + intensity * 0.35,
      attack: 0.001,
      wet: 0.1,
    })
  }

  // ───────────── Efectos puntuales ─────────────
  ignite() {
    if (!this.ok()) return
    const t = this.now()
    this.noise(t, 1.4, { type: 'bandpass', f: 220, f2: 2400, q: 0.7, gain: 0.5, attack: 0.25, wet: 0.35 })
    this.tone(t, 1.6, { f: 55, f2: 42, gain: 0.35, attack: 0.05, wet: 0.3 })
    for (let i = 0; i < 9; i++) this.crackle(0.9, 0.3 + Math.random() * 0.9)
  }

  whoosh(up = true) {
    if (!this.ok()) return
    const t = this.now()
    this.noise(t, 0.7, { type: 'bandpass', f: up ? 300 : 2200, f2: up ? 2600 : 260, q: 0.9, gain: 0.32, attack: 0.18, wet: 0.3 })
  }

  tick() {
    if (!this.ok()) return
    const t = this.now()
    this.noise(t, 0.025, { type: 'highpass', f: 3200, gain: 0.16, attack: 0.001, wet: 0.05 })
    this.tone(t, 0.04, { type: 'square', f: 1900 + Math.random() * 200, gain: 0.025, wet: 0 })
  }

  key() {
    if (!this.ok()) return
    const t = this.now()
    this.tone(t, 0.07, { type: 'triangle', f: 520, f2: 380, gain: 0.14, wet: 0.08 })
    this.noise(t, 0.03, { type: 'highpass', f: 2400, gain: 0.08, attack: 0.001, wet: 0 })
  }

  thud(strength = 1) {
    if (!this.ok()) return
    const t = this.now()
    this.tone(t, 0.45, { f: 130, f2: 38, gain: 0.55 * strength, attack: 0.003, wet: 0.25 })
    this.noise(t, 0.14, { type: 'lowpass', f: 900, gain: 0.3 * strength, attack: 0.001, wet: 0.2 })
  }

  yes() {
    if (!this.ok()) return
    const t = this.now()
    ;[392, 523.25, 659.25].forEach((f, i) => this.tone(t + i * 0.07, 0.9, { type: 'triangle', f, gain: 0.12, wet: 0.45 }))
  }

  /** Rascado: devuelve un control de volumen continuo. */
  scratch(amount: number) {
    if (!this.ok()) return
    const c = this.ctx!
    if (!this.scratchGain) {
      const src = c.createBufferSource()
      src.buffer = this.noiseBuf
      src.loop = true
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 2600
      f.Q.value = 0.6
      this.scratchGain = c.createGain()
      this.scratchGain.gain.value = 0
      src.connect(f).connect(this.scratchGain)
      this.out(this.scratchGain, 0.05)
      src.start()
    }
    this.scratchGain.gain.setTargetAtTime(Math.min(0.22, amount * 0.22), c.currentTime, 0.03)
  }

  /** Colchón cálido (momento sincero). */
  pad(on: boolean) {
    if (!this.ok()) return
    const c = this.ctx!
    const t = c.currentTime
    if (!on) {
      this.padNodes?.stop(t)
      this.padNodes = null
      return
    }
    if (this.padNodes) return
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.09, t + 3.5)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1100
    lp.connect(g)
    this.out(g, 0.6)
    const oscs = [146.83, 220, 277.18, 329.63, 440].map((f, i) => {
      const o = c.createOscillator()
      o.type = i % 2 ? 'sine' : 'triangle'
      o.frequency.value = f
      o.detune.value = (Math.random() - 0.5) * 10
      o.connect(lp)
      o.start(t)
      return o
    })
    this.padNodes = {
      stop: (tt: number) => {
        g.gain.cancelScheduledValues(tt)
        g.gain.setValueAtTime(g.gain.value, tt)
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 2)
        oscs.forEach((o) => o.stop(tt + 2.1))
      },
    }
  }

  /** Redoble de caja en crescendo. Devuelve función para pararlo. */
  /**
   * Redoble de caja: crescendo durante 6 s y luego sostenido hasta stopRoll().
   * Planificador con anticipación (no crea cientos de nodos de golpe).
   */
  drumroll(): void {
    if (!this.ok()) return
    this.rollStop?.()
    const c = this.ctx!
    const t0 = c.currentTime + 0.02
    const bus = c.createGain()
    bus.connect(this.comp)
    let t = t0
    const schedule = () => {
      const horizon = c.currentTime + 0.3
      while (t < horizon) {
        const p = Math.min(1, (t - t0) / 6)
        const gain = 0.05 + p * p * 0.33
        this.noise(t, 0.05, { type: 'bandpass', f: 1900 + Math.random() * 400, q: 0.7, gain, attack: 0.001, wet: 0, dest: bus })
        this.tone(t, 0.04, { type: 'triangle', f: 190, f2: 150, gain: gain * 0.4, wet: 0, dest: bus })
        t += 0.055 - p * 0.012 + Math.random() * 0.006
      }
    }
    schedule()
    const timer = window.setInterval(schedule, 100)
    this.rollStop = () => {
      clearInterval(timer)
      const n = c.currentTime
      bus.gain.cancelScheduledValues(n)
      bus.gain.setValueAtTime(bus.gain.value, n)
      bus.gain.linearRampToValueAtTime(0, n + 0.04)
      this.rollStop = null
    }
  }

  /** Golpe de tráiler: impacto grave + "braam". */
  boom() {
    if (!this.ok()) return
    const c = this.ctx!
    const t = this.now()
    this.tone(t, 3.2, { f: 62, f2: 30, gain: 0.8, attack: 0.004, wet: 0.5 })
    this.noise(t, 1.8, { type: 'lowpass', f: 1600, f2: 80, gain: 0.6, attack: 0.002, wet: 0.6 })
    this.noise(t, 2.6, { type: 'highpass', f: 4000, gain: 0.12, attack: 0.002, wet: 0.7 })
    // braam: sierras desafinadas con filtro que se abre
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(180, t)
    lp.frequency.exponentialRampToValueAtTime(1400, t + 1.2)
    lp.frequency.exponentialRampToValueAtTime(300, t + 5)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.35)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5)
    lp.connect(g)
    this.out(g, 0.6)
    ;[55, 55, 82.41, 110, 130.81].forEach((f, i) => {
      const o = c.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.detune.value = (i - 2) * 9
      o.connect(lp)
      o.start(t)
      o.stop(t + 5.6)
    })
  }

  /** Subida tensa (cuenta atrás). */
  riser(seconds = 3) {
    if (!this.ok()) return
    const t = this.now()
    this.noise(t, seconds, { type: 'bandpass', f: 200, f2: 5000, q: 2, gain: 0.22, attack: seconds * 0.9, wet: 0.4 })
    this.tone(t, seconds, { type: 'sawtooth', f: 80, f2: 320, gain: 0.05, attack: seconds * 0.9, wet: 0.3 })
  }

  /** Máquina de bordar: puntadas suaves y rápidas. */
  stitch(seconds = 1) {
    if (!this.ok()) return
    const t0 = this.now()
    for (let t = 0; t < seconds; t += 0.075 + Math.random() * 0.02) {
      this.noise(t0 + t, 0.02, { type: 'bandpass', f: 2600 + Math.random() * 900, q: 4, gain: 0.05, attack: 0.002, wet: 0.15 })
      this.tone(t0 + t, 0.05, { type: 'sine', f: 140, gain: 0.03, wet: 0 })
    }
  }

  /** Impresora de tickets. */
  printer(seconds = 1.6) {
    if (!this.ok()) return
    const t0 = this.now()
    for (let t = 0; t < seconds; t += 0.045) {
      this.noise(t0 + t, 0.03, { type: 'bandpass', f: 3200, q: 3, gain: 0.07, attack: 0.002, wet: 0.02 })
    }
    this.tone(t0, seconds, { type: 'square', f: 70, gain: 0.02, attack: 0.05, wet: 0 })
  }

  /** Pausa/reanuda todo el sonido (pausa por toque). */
  suspend() {
    try {
      void this.ctx?.suspend()
    } catch {
      /* nada */
    }
  }

  resume() {
    try {
      void this.ctx?.resume()
    } catch {
      /* nada */
    }
  }

  stopRoll() {
    this.rollStop?.()
  }

  silenceAll() {
    this.fire(0, 0.3)
    this.scratch(0)
    this.pad(false)
    this.rollStop?.()
  }

  dispose() {
    clearTimeout(this.crackleTimer)
  }
}
