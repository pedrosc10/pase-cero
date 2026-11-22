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

export type Transicion = 'quemar' | 'humo' | 'corte' | 'chamuscar' | 'letras' | 'oro'

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
   * Calculadas con: ~2,5 s de animación de entrada + el texto a ~3 palabras/s
   * (lectura cómoda en voz baja). Súbelas o bájalas a tu gusto.
   * La barra de arriba avanza con estos tiempos.
   */
  duraciones: {
    sala: 10, // bienvenida + carta (≈25 palabras)
    pase0: 16, // entrecot + ficha de cata que se escribe sola (≈50 palabras)
    pase1: 10, // la ceniza se aparta sola (≈20 palabras)
    pase2: 10, // el humo se abre y salen las pistas (≈16 palabras)
    pase3: 12, // contador 2026 → 1972 (≈20 palabras)
    pase4: 12, // cartel de combate (≈25 palabras)
    jardin: 20, // líneas + el emblema se borda (≈25 palabras, ritmo pausado)
    levanta: 5, // pausa obligatoria (la familia lleva el polar)
    /** Tras rascar la revelación, segundos hasta pasar al vale. */
    revelacionTrasRascar: 7,
  },

  /** Transición de SALIDA de cada pantalla hacia la siguiente. */
  transiciones: {
    entrada: 'quemar',
    sala: 'chamuscar',
    pase0: 'humo',
    pase1: 'corte',
    pase2: 'humo',
    pase3: 'corte',
    pase4: 'letras',
    jardin: 'oro',
    levanta: 'corte',
    vozAlta: 'corte',
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
    linea: 'Esta noche el menú lo firma tu primo.',
    carta: {
      titulo: 'Menú Degustación',
      subtitulo: 'Temporada de vuelta',
      pases: [
        { num: '0', nombre: 'Lo que tienes en la mano' },
        { num: 'I', nombre: 'Hollín' },
        { num: 'II', nombre: 'Humo' },
        { num: 'III', nombre: 'Añada' },
        { num: 'IV', nombre: 'El combate' },
      ],
      pie: [
        ['Cocina', 'Pedrito'],
        ['Sumiller invitado', 'Antonio'],
        ['Maridaje', 'a criterio de la casa'],
      ] as [string, string][],
    },
  },

  // ── 2 · Pase 0 ──────────────────────────────────────────────
  pase0: {
    num: '0',
    titulo: 'Lo que tienes en la mano',
    intro: ['Sí. Eso.', 'El entrecot de la caja.'],
    peticion: 'El sumiller procede a catarlo.',
    ficha: [
      ['Vista', 'Rojo intenso. Brillo de film transparente.'],
      ['Nariz', 'Notas de nevera. Fondo de caja de cartón.'],
      ['Boca', 'Todavía no. Ni se te ocurra.'],
      ['Final', 'Largo. Larguísimo. Se entiende al final.'],
      ['Crianza', 'En caja, delante de todos los primos.'],
    ] as [string, string][],
    veredicto: 'Diagnóstico: _le falta fuego._',
    remate: 'A eso vamos.',
  },

  // ── 3 · Pase I · Hollín ─────────────────────────────────────
  pase1: {
    num: 'I',
    titulo: 'Hollín',
    oculto: ['Cinco años sirviendo estrellas.', 'Hoy descansas.', '*Hoy toca brasa.*'],
    remate: 'Ni pinzas, ni espumas, ni esferas. Fuego y punto.',
  },

  // ── 4 · Pase II · Humo ──────────────────────────────────────
  pase2: {
    num: 'II',
    titulo: 'Humo',
    oculto: ['No está en Madrid.', 'Está en Alcalá.', '*En El Cercado.*'],
    remate: 'Para llegar no hace falta AVE.',
  },

  // ── 5 · Pase III · Añada (contador) ─────────────────────────
  pase3: {
    num: 'III',
    titulo: 'Añada',
    intro: 'Un sumiller siempre pregunta la añada.',
    pregunta: '¿Desde cuándo arde esta brasa?',
    desde: 2026,
    respuesta: 1972,
    /** Aparece mientras el contador baja (remate bético). */
    comentario: 'Más antiguo que tu primer Betis-Sevilla.',
    acierto: ['Clavado.', 'Familia y brasa desde entonces.'],
  },

  // ── 6 · Pase IV · El combate (cartel) ───────────────────────
  pase4: {
    num: 'IV',
    titulo: 'El combate',
    intro: 'En Alcalá hay dos grandes.',
    rival: secreto('TGEgUGVyZGlkYQ=='), // nombre del rincón ya conocido
    esquinaConocida: { etiqueta: 'Esquina roja', estado: 'Conquistada' },
    esquinaPendiente: { etiqueta: 'Esquina de ascuas', nombre: '???', estado: 'Visitas: 0' },
    lineas: ['Una ya la tienes.', 'Te falta la otra.'],
    remate: 'Hay que completar la colección.',
  },

  // ── 7 · Momento sincero · El Jardín ─────────────────────────
  jardin: {
    /** Líneas antes de que se borde el emblema. */
    lineas: ['Cinco años en Madrid.', 'Muchas estrellas.', 'Pero aquí, «casa» tiene otro nombre.'],
    /** Aparece cuando el emblema termina de bordarse. */
    bienvenida: 'Bienvenido al Jardín.',
    cierre: 'Volvéis los dos. Ya era hora.',
    alt: 'Emblema de El Jardín: cuatro casas con tejados en zigzag, dos palmeras y el nombre escrito a mano',
  },

  // ── 7b · Levanta la vista (pausa automática) ────────────────
  levanta: {
    /** Cámbialo a 'Ponte el tuyo.' si quieres. */
    texto: 'Levanta la vista.',
  },

  // ── 8 · En voz alta ─────────────────────────────────────────
  vozAlta: {
    aviso: 'Ahora lee esto en voz alta para todos',
    paginas: [
      'Primos, silencio en la sala.',
      'El sumiller va a anunciar el último pase.',
      'No está en la carta.',
      'Redoble, por favor.',
    ],
    /** Tiempo por página = base + segundos por palabra (lectura EN VOZ ALTA). */
    segundosBase: 2,
    segundosPorPalabra: 0.5,
  },

  // ── 9 · Revelación (interacción 2: rascar) ──────────────────
  revelacion: {
    antetitulo: 'Pase V · Fuera de carta',
    instruccion: 'Rasca la ceniza',
    /** Solo aparece si en 20 s no ha rascado (para no atascarse nunca). */
    ayuda: 'Soplar la ceniza',
    linea1: secreto('VW5hIGNvbWlkYSBlbg=='),
    nombre: secreto('VmVudGEgRWwgQ2Fycml0bw=='),
    pie: 'Desde 1972 · Alcalá de Guadaíra',
  },

  // ── 10 · Vale ───────────────────────────────────────────────
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
