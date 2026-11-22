/**
 * ─────────────────────────────────────────────────────────────
 *  PASE CERO · Configuración central
 * ─────────────────────────────────────────────────────────────
 *  Todo lo que se lee en pantalla está aquí. Cambia los textos
 *  sin tocar la lógica y vuelve a desplegar (ver README.md).
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

export const config = {
  /** Nombres. */
  para: 'Antonio',
  de: 'Pedrito',

  /** Títulos visibles en la pestaña / al compartir (¡sin spoilers!). */
  meta: {
    tituloPestana: 'Para Antonio',
  },

  /** Clave de guardado del progreso (cámbiala para "resetear" a todo el mundo). */
  storageKey: 'pase-cero:v1',

  // ── 0 · Entrada ─────────────────────────────────────────────
  entrada: {
    titulo: 'Para Antonio.',
    instruccion: 'Mantén pulsado para encender las brasas',
    avisoSonido: 'Mejor con sonido',
    avisoSilencio: 'Si no oyes nada, quita el modo silencio del iPhone',
    continuar: 'Continuar donde lo dejaste',
    empezarDeNuevo: 'Empezar de nuevo',
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
    boton: 'Empezar el servicio',
  },

  // ── 2 · Pase 0 ──────────────────────────────────────────────
  pase0: {
    num: '0',
    titulo: 'Lo que tienes en la mano',
    intro: ['Sí. Eso.', 'El entrecot de la caja.'],
    peticion: 'Antes de seguir, el sumiller debería catarlo.',
    boton: 'Catar',
    ficha: [
      ['Vista', 'Rojo intenso. Brillo de film transparente.'],
      ['Nariz', 'Notas de nevera. Fondo de caja de cartón.'],
      ['Boca', 'Todavía no. Ni se te ocurra.'],
      ['Final', 'Largo. Larguísimo. Se entiende al final.'],
      ['Crianza', 'En caja, delante de todos los primos.'],
    ] as [string, string][],
    veredicto: 'Diagnóstico: _le falta fuego._',
    remate: 'A eso vamos.',
    siguiente: 'Siguiente pase',
  },

  // ── 3 · Pase I · Rascar ─────────────────────────────────────
  pase1: {
    num: 'I',
    titulo: 'Hollín',
    instruccion: 'Rasca la ceniza',
    oculto: ['Cinco años sirviendo estrellas.', 'Hoy descansas.', '*Hoy toca brasa.*'],
    remate: 'Ni pinzas, ni espumas, ni esferas. Fuego y punto.',
    ayuda: 'Soplar la ceniza',
    siguiente: 'Siguiente pase',
  },

  // ── 4 · Pase II · Avivar ────────────────────────────────────
  pase2: {
    num: 'II',
    titulo: 'Humo',
    instruccion: 'Mantén pulsado para avivar el fuego',
    oculto: ['No está en Madrid.', 'Está en Alcalá.', '*En El Cercado.*'],
    remate: 'Para llegar no hace falta AVE.',
    ayuda: 'Avivar del tirón',
    siguiente: 'Siguiente pase',
  },

  // ── 5 · Pase III · Año ──────────────────────────────────────
  pase3: {
    num: 'III',
    titulo: 'Añada',
    intro: 'Un sumiller siempre pregunta la añada.',
    pregunta: '¿Desde cuándo arde esta brasa?',
    respuesta: 1972,
    /** Frases al fallar (el código elige según el número). */
    fallos: {
      masAntiguo: 'Más antiguo. Más que tu primer Betis-Sevilla.',
      masModerno: 'Tampoco tanto, que no es la Giralda.',
      teQuemasAntes: 'Te quemas. Un pelín antes.',
      teQuemasDespues: 'Te quemas. Un pelín después.',
      futuro: 'Del futuro todavía no hay brasa.',
      prehistoria: 'Eso ya es arqueología, primo.',
      incompleto: 'Cuatro cifras, sumiller.',
    },
    /** Pistas que aparecen fallo a fallo, para que nunca se atasque. */
    pistas: ['Pista: los setenta.', 'Pista: 197_', 'Última pista: el último número es el dos.'],
    rendirse: 'Rendirse con dignidad',
    acierto: ['Bien catado.', 'Familia y brasa desde entonces.'],
    siguiente: 'Siguiente pase',
  },

  // ── 6 · Pase IV · Combate ───────────────────────────────────
  pase4: {
    num: 'IV',
    titulo: 'El combate',
    intro: 'En Alcalá hay dos grandes.',
    rival: secreto('TGEgUGVyZGlkYQ=='), // nombre del rincón ya conocido
    esquinaConocida: { etiqueta: 'Esquina roja', estado: 'Conquistada' },
    esquinaPendiente: { etiqueta: 'Esquina de ascuas', nombre: '???', estado: 'Visitas: 0' },
    pregunta: 'Una ya la tienes. ¿Cuál te falta?',
    falloConocida: 'Esa ya la conoces. Buen intento.',
    acierto: ['Esa.', 'La que nunca has pisado.'],
    remate: 'Hay que completar la colección.',
    siguiente: 'Siguiente pase',
  },

  // ── 7 · Momento sincero · El Jardín ─────────────────────────
  jardin: {
    /** Líneas antes de que se borde el emblema. */
    lineas: ['Cinco años en Madrid.', 'Muchas estrellas.', 'Pero aquí, «casa» tiene otro nombre.'],
    /** Aparece cuando el emblema termina de bordarse. */
    bienvenida: 'Bienvenido al Jardín.',
    cierre: 'Volvéis los dos. Ya era hora.',
    alt: 'Emblema de El Jardín: cuatro casas con tejados en zigzag, dos palmeras y el nombre escrito a mano',
    siguiente: 'Seguir',
  },

  // ── 7b · Levanta la vista ───────────────────────────────────
  levanta: {
    /** Cámbialo a 'Ponte el tuyo.' si quieres. */
    texto: 'Levanta la vista.',
    /** Segundos que no se puede avanzar. */
    espera: 5,
    siguiente: 'Seguir',
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
    tocaParaSeguir: 'Toca para seguir',
    botonRedoble: 'Que suene el redoble',
  },

  // ── 9 · Revelación ──────────────────────────────────────────
  revelacion: {
    antetitulo: 'Pase V · Fuera de carta',
    linea1: secreto('VW5hIGNvbWlkYSBlbg=='),
    nombre: secreto('VmVudGEgRWwgQ2Fycml0bw=='),
    pie: 'Desde 1972 · Alcalá de Guadaíra',
    boton: 'Ver tu vale',
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
