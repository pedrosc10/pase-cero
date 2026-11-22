import { store } from './storage'
/** Estado compartido de la sesión. */
export const session = {
  /** Escena guardada al cargar (para "Continuar"). */
  saved: store.get('escena'),
}
