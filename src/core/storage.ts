/** localStorage envuelto en try/catch (modo privado, bloqueos, etc.). */
const PREFIX = 'pase-cero:'
const mem = new Map<string, string>()

export const store = {
  get(k: string): string | null {
    try {
      return window.localStorage.getItem(PREFIX + k)
    } catch {
      return mem.get(k) ?? null
    }
  },
  set(k: string, v: string) {
    mem.set(k, v)
    try {
      window.localStorage.setItem(PREFIX + k, v)
    } catch {
      /* sin almacenamiento: seguimos en memoria */
    }
  },
  del(k: string) {
    mem.delete(k)
    try {
      window.localStorage.removeItem(PREFIX + k)
    } catch {
      /* nada */
    }
  },
}
