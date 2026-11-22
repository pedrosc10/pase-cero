import type { Scene } from '../core/scenes'
import { sala } from './sala'
import { pase0 } from './pase0'
import { pase1 } from './pase1'
import { pase2 } from './pase2'
import { pase3 } from './pase3'
import { pase4 } from './pase4'
import { jardin } from './jardin'
import { levanta } from './levanta'
import { vozAlta } from './vozAlta'
import { revelacion } from './revelacion'
import { vale } from './vale'

/** Escenas tras la entrada (se cargan en diferido mientras se enciende). */
export const resto: Scene[] = [sala, pase0, pase1, pase2, pase3, pase4, jardin, levanta, vozAlta, revelacion, vale]
