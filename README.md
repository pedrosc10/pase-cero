# Pase Cero

Experiencia web *mobile-first* hecha a mano para una persona concreta. Si no eres esa persona, no hay nada que ver aquí.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173 (y en la red local con --host)
npm run build        # tipos + build + comprobación anti-spoiler
npm test             # recorrido completo con Playwright (iPhone/Android) → qa/shots/
```

## Editar textos

Todo lo que se lee en pantalla está en **`src/config.ts`**. Cambia el texto, guarda y haz `git push`: GitHub Actions vuelve a publicar solo (1–2 min).

- Marcado ligero en los textos: `_cursiva_` y `*resaltado en ascua*`.
- Los textos que darían spoiler van en base64 dentro de `secreto('…')`:
  - codificar: `npm run secreto -- "Texto nuevo"` → pega el resultado en config.
  - leer: `npm run secreto -- --leer "base64…"`.
- `duraciones` → segundos que dura cada pantalla (la secuencia avanza sola).
- `transiciones` → la transición de salida de cada pantalla: `quemar`, `humo`, `corte`, `chamuscar`, `oro`.
- `carrera.golpes` / `carrera.giro` → las frases de la pantalla de su carrera.
- `levanta.texto` → la frase de la pantalla "Levanta la vista." (p. ej. `'Ponte el tuyo.'`); su duración, en `duraciones.levanta`.
- `vale.nota` → nota del vale (`''` para ocultarla).

## Emblema

`assets-fuente/jardin-bordado.jpg` es la foto del bordado. `npm run` no lo necesita: el emblema ya está vectorizado en
`assets-fuente/emblema-jardin.svg` (silueta fiel) y `assets-fuente/emblema-jardin-trazos.svg` (trazos ordenados para animar).
Para regenerarlo: `node scripts/vectorize.mjs` (deja comprobaciones superpuestas sobre la foto en `qa/`).

## QR

`npm run qr` genera en `qr/` el QR plano (SVG/PNG, corrección H), la versión con diseño y el imprimible de 8×8 cm
(PDF/PNG con marcas de corte), y verifica que todos se leen correctamente.

## Créditos técnicos

- Animación: [GSAP](https://gsap.com) (licencia "Standard No Charge", gratuita, incluidos plugins).
- Tipografías libres autoalojadas (Fontsource, SIL OFL): Cormorant Garamond, Cormorant SC, Anton, IBM Plex Mono.
- Sonido: 100 % sintetizado en tiempo real con Web Audio API (ruido filtrado, osciladores y envolventes). Ningún archivo de audio, sin derechos de terceros.
- Ilustraciones: SVG propios. Efectos (ascuas, humo, ceniza, forja): Canvas 2D generativo.
- Vectorización: [potrace](https://www.npmjs.com/package/potrace) (solo herramienta de build) + esqueletización propia.
