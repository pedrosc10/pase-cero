import type { Scene } from '../core/scenes'
import { sala } from './sala'
import { carrera } from './carrera'
import { jardin } from './jardin'
import { levanta } from './levanta'
import { revelacion } from './revelacion'
import { vale } from './vale'

/** Escenas tras la entrada (se cargan en diferido mientras se enciende). */
export const resto: Scene[] = [sala, carrera, jardin, levanta, revelacion, vale]
