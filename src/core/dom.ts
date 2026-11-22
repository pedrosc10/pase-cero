import type { Secreto } from '../config'

/** Crea un elemento con clases y contenido. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  children: (Node | string | null | undefined | false)[] | string = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue
    if (k === 'class') el.className = String(v)
    else if (k === 'html') el.innerHTML = String(v)
    else el.setAttribute(k, v === true ? '' : String(v))
  }
  if (typeof children === 'string') el.textContent = children
  else for (const c of children) if (c) el.append(c)
  return el
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Marcado ligero: _cursiva_ y *ascua*. */
export function md(s: string): string {
  return esc(s)
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\*(.+?)\*/g, '<strong class="hot">$1</strong>')
}

/** Decodifica un secreto base64 (UTF-8). */
export function reveal(s: Secreto): string {
  try {
    const bin = atob(s.b64)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

/** Divide un texto en spans por palabra (para animarlos). */
export function words(s: string, cls = 'w'): string {
  return md(s)
    .split(/(<[^>]+>|\s+)/)
    .map((tok) => (tok.startsWith('<') || /^\s+$/.test(tok) || !tok ? tok : `<span class="${cls}">${tok}</span>`))
    .join('')
}

export const prefersReduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export const isIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const icon = {
  arrow: '<span class="flecha" aria-hidden="true"></span>',
}
