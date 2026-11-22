import type { Scene } from '../core/scenes'
import { entrada } from './entrada'

/** Orden del guion: la entrada va en el paquete inicial; el resto, en diferido. */
export const scenes: Scene[] = [entrada]
export const cargarResto = () => import('./resto').then((m) => m.resto)
