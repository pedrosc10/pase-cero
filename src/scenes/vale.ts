import { gsap } from 'gsap'
import { config } from '../config'
import { isIOS, md, reveal as decode } from '../core/dom'
import { loadEmblema, parche } from '../core/emblema'
import type { Scene } from '../core/scenes'
import { store } from '../core/storage'
import { renderTicket, type TicketData } from '../core/ticket'

export const vale: Scene = {
  id: 'vale',
  scroll: true,
  mount(ctx) {
    const c = config.vale
    const b = c.botones
    const { el, audio, fx } = ctx
    fx.setFire(0.35)
    fx.setSmoke(0)
    audio.fire(0.2)

    const cabecera = decode(c.cabecera)
    const concepto = decode(c.concepto)
    const query = decode(config.enlaces.mapsQuery)
    const insta = `https://www.instagram.com/${decode(config.enlaces.instagramUsuario)}/`
    const apple = `https://maps.apple.com/?q=${encodeURIComponent(query)}`
    const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    const ios = isIOS()
    const principal = ios ? apple : google
    const secundario = ios ? google : apple

    const campos: [string, string][] = [
      ['Para', c.para],
      ['De', c.de],
      ['Concepto', concepto],
      ['Fecha', c.fecha],
    ]
    const data: TicketData = {
      cabecera,
      sub: `${decode(c.subcabecera)} · ${c.desde}`,
      dir: c.direccion,
      numero: c.numero,
      pase: 'Pase V',
      campos,
      nota: c.nota,
      total: ['Total', 'Invitado'],
      sello: c.sello,
      gracias: 'Gracias por volver.',
    }

    el.innerHTML = `
      <div class="ticket-boca" aria-hidden="true"></div>
      <div class="ticket-wrap">
        <article class="ticket" data-testid="ticket" aria-label="Vale">
          <header class="t-head">
            <p class="t-marca">${cabecera}</p>
            <p class="t-sub">${data.sub}</p>
            <p class="t-dir">${c.direccion}</p>
          </header>
          <div class="t-rule"></div>
          <div class="t-fila t-num"><span>${c.numero}</span><span>${data.pase}</span></div>
          <div class="t-rule"></div>
          <dl class="t-campos">
            ${campos.map(([k, v]) => `<div><dt>${k}</dt><dd>${md(v)}</dd></div>`).join('')}
          </dl>
          ${c.nota ? `<div class="t-rule"></div><p class="t-nota">“${md(c.nota)}”</p>` : ''}
          <div class="t-rule"></div>
          <div class="t-fila t-total"><span>${data.total[0]}</span><span>${data.total[1]}</span></div>
          <div class="t-pie">
            <div class="t-sello"><span>${c.sello}</span></div>
            <div class="t-parche"></div>
          </div>
          <div class="t-barras" aria-hidden="true"></div>
          <p class="t-gracias">${data.gracias}</p>
        </article>
      </div>
      <nav class="vale-acc" aria-label="Acciones del vale">
        <a class="btn fuego" href="${principal}" target="_blank" rel="noopener noreferrer" data-testid="llegar">${b.llegar}</a>
        <a class="btn ghost" href="${secundario}" target="_blank" rel="noopener noreferrer">${ios ? b.llegarGoogle : b.llegarApple}</a>
        <div class="vale-par">
          <a class="btn" href="${insta}" target="_blank" rel="noopener noreferrer" data-testid="instagram">${b.instagram}</a>
          <button class="btn" type="button" data-testid="guardar">${b.guardar}</button>
        </div>
        <button class="btn ghost" type="button" data-testid="otra-vez">${b.otraVez}</button>
      </nav>
      <div class="guardar-capa" hidden role="dialog" aria-modal="true" aria-label="${b.guardar}">
        <img alt="Vale" />
        <p>${c.guardarAyuda}</p>
        <div class="guardar-acc">
          <a class="btn" download="vale.png">Descargar</a>
          <button class="btn ghost" type="button" data-a="cerrar">${c.cerrar}</button>
        </div>
      </div>
    `
    const ticket = el.querySelector<HTMLElement>('.ticket')!
    const patchBox = el.querySelector<HTMLElement>('.t-parche')!
    let blob: Blob | null = null
    let blobUrl = ''

    void loadEmblema().then((d) => {
      patchBox.innerHTML = parche(d)
      data.emblema = { d: d.EMBLEMA_FILL, w: d.EMBLEMA_VB.w, h: d.EMBLEMA_VB.h }
      // pre-render del PNG: así "Guardar" responde dentro del gesto (iOS)
      void renderTicket(data).then((bl) => {
        blob = bl
      })
    })

    // impresión del ticket
    const tl = ctx.tl({ delay: 0.2 })
    tl.from(ticket, {
      yPercent: -100,
      duration: 2.2,
      ease: 'steps(14)',
      onStart: () => audio.printer(2.2),
    })
      .from(el.querySelector('.t-sello'), {
        scale: 1.8,
        opacity: 0,
        duration: 0.3,
        ease: 'power4.in',
        onComplete: () => {
          audio.thud(0.7)
          ctx.shake(ticket, 4)
          ctx.haptic(20)
        },
      })
      .from(patchBox, { scale: 0.6, opacity: 0, rotation: -20, duration: 0.7, ease: 'back.out(1.6)' }, '+=0.15')
      .from(el.querySelectorAll('.vale-acc > *'), { opacity: 0, y: 12, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, '-=0.2')

    store.set('visto', '1')

    // guardar
    const capa = el.querySelector<HTMLElement>('.guardar-capa')!
    const capaImg = capa.querySelector('img')!
    const capaA = capa.querySelector<HTMLAnchorElement>('a')!
    const abrirCapa = (bl: Blob) => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      blobUrl = URL.createObjectURL(bl)
      capaImg.src = blobUrl
      capaA.href = blobUrl
      capa.hidden = false
      gsap.fromTo(capa, { opacity: 0 }, { opacity: 1, duration: 0.3 })
    }
    ctx.cleanup(() => blobUrl && URL.revokeObjectURL(blobUrl))
    ctx.on(el.querySelector('[data-testid="guardar"]')!, 'click', async () => {
      audio.key()
      const bl = blob ?? (await renderTicket(data))
      if (!bl) return
      const file = new File([bl], 'vale.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      try {
        if (nav.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Vale' })
          return
        }
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return
      }
      abrirCapa(bl)
    })
    ctx.on(capa, 'click', (e) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-a="cerrar"]') || t === capa) capa.hidden = true
    })
    ctx.on(el.querySelector('[data-testid="otra-vez"]')!, 'click', () => {
      audio.key()
      store.del('escena')
      ctx.goto('sala')
    })
  },
}
