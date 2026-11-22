/**
 * ─────────────────────────────────────────────────────────────
 *  PASE CERO · Configuración central
 * ─────────────────────────────────────────────────────────────
 *  Todo lo que se lee en pantalla está aquí, y también cuánto dura
 *  cada pantalla. Cambia lo que quieras sin tocar la lógica y vuelve
 *  a desplegar (ver README.md).
 *
 *  La experiencia es una SECUENCIA AUTOMÁTICA (tipo tráiler). Solo hay
 *  dos interacciones: mantener pulsado al principio y rascar la ceniza
 *  en la revelación final. Un toque en cualquier momento pausa/reanuda.
 *
 *  Marcado ligero en los textos:
 *    _texto_   → cursiva serif (voz "alta cocina")
 *    *texto*   → resaltado en ascua
 *
 *  SECRETOS: los textos que darían spoiler van en base64 dentro
 *  de `secreto('...')`. Para generar uno nuevo:
 *      npm run secreto -- "Tu texto"
 *  Para leer uno:
 *      npm run secreto -- --leer "VmVud..."
 * ─────────────────────────────────────────────────────────────
 */

/** Marca un valor en base64. Se decodifica solo en tiempo de ejecución. */
const secreto = (b64: string) => ({ b64 }) as const
export type Secreto = ReturnType<typeof secreto>

export type Transicion = 'quemar' | 'humo' | 'corte' | 'chamuscar' | 'oro'

export const config = {
  /** Nombres. */
  para: 'Antonio',
  de: 'Pedrito',

  /** Títulos visibles en la pestaña / al compartir (¡sin spoilers!). */
  meta: {
    tituloPestana: 'Para Antonio',
  },

  /**
   * ⏱  DURACIÓN DE CADA PANTALLA (segundos).
   * Ritmo de tráiler: pantallas rápidas y una sola lenta (El Jardín),
   * que es donde está la emoción. La barra de arriba avanza con estos
   * tiempos. Súbelos o bájalos a tu gusto.
   */
  duraciones: {
    sala: 6, // bienvenida + carta (lectura rápida)
    carrera: 10, // golpes de tipografía + el giro final
    jardin: 20, // la pantalla lenta: líneas + el emblema se borda
    levanta: 5, // pausa obligatoria (la familia lleva el polar)
    /** Tras rascar la revelación, segundos hasta pasar al vale. */
    revelacionTrasRascar: 5,
  },

  /** Transición de SALIDA de cada pantalla hacia la siguiente. */
  transiciones: {
    entrada: 'quemar',
    sala: 'chamuscar',
    carrera: 'humo', // de los golpes al aire del Jardín
    jardin: 'oro',
    levanta: 'corte',
    revelacion: 'quemar',
  } satisfies Record<string, Transicion>,

  // ── 0 · Entrada (interacción 1) ─────────────────────────────
  entrada: {
    titulo: 'Para Antonio.',
    instruccion: 'Mantén pulsado para encender las brasas',
    avisoSonido: 'Mejor con sonido',
    avisoSilencio: 'Si no oyes nada, quita el modo silencio del iPhone',
    continuar: 'Continuar donde lo dejaste',
    empezarDeNuevo: 'Empezar de nuevo',
  },

  /** Indicador de pausa (al tocar la pantalla). */
  pausa: {
    texto: 'En pausa · toca para seguir',
  },

  // ── 1 · Sala ────────────────────────────────────────────────
  sala: {
    antetitulo: 'Sala · Mesa uno',
    bienvenida: 'Bienvenido.',
    linea: 'Hoy el menú lo firma tu primo.',
    carta: {
      titulo: 'Menú Degustación',
      subtitulo: 'Temporada de vuelta',
      pases: [
        { num: '0', nombre: 'Lo que tienes en la mano' },
        { num: 'I', nombre: 'Hoja de servicios' },
        { num: 'II', nombre: 'El Jardín' },
        { num: 'III', nombre: 'Fuera de carta' },
      ],
      pie: [
        ['Cocina', 'Pedrito'],
        ['Sumiller invitado', 'Antonio'],
        ['Maridaje', 'a criterio de la casa'],
      ] as [string, string][],
    },
  },

  // ── 2 · Su carrera (tipografía cinética) ────────────────────
  carrera: {
    antetitulo: 'Hoja de servicios',
    /** Un golpe por frase, al ritmo del sonido. */
    golpes: ['Estrellas Michelin.', 'Dani García.', 'Ramón Freixa.'],
    /** El giro, tras una pausa: cambio de ritmo y guasa. */
    giro: ['Y todavía hay un sitio en Alcalá', 'donde *nunca* has comido.'],
  },

  // ── 3 · Momento sincero · El Jardín ─────────────────────────
  jardin: {
    /** Líneas antes de que se borde el emblema. */
    lineas: ['Cinco años en Madrid.', 'Muchas estrellas.', 'Pero aquí, «casa» tiene otro nombre.'],
    /** Aparece cuando el emblema termina de bordarse. */
    bienvenida: 'Bienvenido al Jardín.',
    cierre: 'Volvéis los dos. Ya era hora.',
    alt: 'Emblema de El Jardín: cuatro casas con tejados en zigzag, dos palmeras y el nombre escrito a mano',
  },

  // ── 4 · Levanta la vista (pausa automática) ────────────────
  levanta: {
    /** Cámbialo a 'Ponte el tuyo.' si quieres. */
    texto: 'Levanta la vista.',
  },

  // ── 5 · Revelación (interacción 2: rascar) ──────────────────
  revelacion: {
    antetitulo: 'Último pase · Fuera de carta',
    /** Momento de grupo antes de la cuenta atrás. */
    preparados: 'Primos: redoble.',
    instruccion: 'Rasca la ceniza',
    /** Solo aparece si en 20 s no ha rascado (para no atascarse nunca). */
    ayuda: 'Soplar la ceniza',
    linea1: secreto('VW5hIGNvbWlkYSBlbg=='),
    nombre: secreto('VmVudGEgRWwgQ2Fycml0bw=='),
    pie: 'Desde 1972',
  },

  // ── 6 · Vale ───────────────────────────────────────────────
  vale: {
    cabecera: secreto('VmVudGEgRWwgQ2Fycml0bw=='),
    subcabecera: secreto('QXNhZG9yIGZhbWlsaWFy'), // + " · desde 1972"
    desde: 'desde 1972',
    numero: 'Comanda Nº 1972',
    para: 'Antonio',
    de: 'Pedrito',
    concepto: secreto('VW5hIGNvbWlkYSBlbiBWZW50YSBFbCBDYXJyaXRv'),
    fecha: 'A decidir juntos',
    /** Deja '' para ocultar la nota. */
    nota: 'Te faltaba el otro grande. Bienvenido al Jardín, primo.',
    sello: 'Invita Pedrito',
    direccion: 'Barrio El Cercado, 41500 Alcalá de Guadaíra (Sevilla)',
    botones: {
      llegar: 'Cómo llegar',
      llegarGoogle: 'o en Google Maps',
      llegarApple: 'o en Apple Maps',
      instagram: 'Ver su Instagram',
      guardar: 'Guardar el vale',
      otraVez: 'Ver otra vez',
    },
    guardarAyuda: 'Mantén pulsada la imagen y elige «Guardar en Fotos»',
    cerrar: 'Cerrar',
  },

  /** Enlaces (en base64 para que no se vean en el código servido). */
  enlaces: {
    /** Búsqueda en mapas: nombre + dirección verificada. */
    mapsQuery: secreto(
      'VmVudGEgRWwgQ2Fycml0bywgQmFycmlvIEVsIENlcmNhZG8sIDQxNTAwIEFsY2Fsw6EgZGUgR3VhZGHDrXJhLCBTZXZpbGxh',
    ),
    instagramUsuario: secreto('dmVudGFlbGNhcnJpdG8='),
  },

  /** Emblema de El Jardín: muy sutil en la entrada (true/false). */
  emblemaEnEntrada: true,

  /** Placeholders: datos NO verificados que no se usan en la web. */
  pendientes: {
    horario: '', // TODO(Pedrito): no verificado, no se muestra
    telefono: '', // TODO(Pedrito): no verificado, no se muestra
  },
} as const

export type Config = typeof config
