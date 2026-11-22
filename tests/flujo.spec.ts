import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

/**
 * Secuencia automática completa (7 pantallas), como la verá Antonio:
 * solo dos interacciones (mantener pulsado al inicio y rascar al final).
 * Capturas en qa/shots/<dispositivo>/ y cronometraje en tiempos.json.
 */
test.setTimeout(200_000)

test('secuencia completa', async ({ page }, info) => {
  const dir = `qa/shots/${info.project.name}`
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  let n = 0
  const shot = async (name: string) => {
    await page.screenshot({ path: `${dir}/${String(++n).padStart(2, '0')}-${name}.png` })
  }
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const tiempos: Record<string, number> = {}
  let t0 = 0
  const marca = (k: string) => (tiempos[k] = Math.round((Date.now() - t0) / 100) / 10)
  const escena = async (id: string, timeout = 30_000) => {
    await page.waitForSelector(`[data-scene="${id}"]`, { timeout })
    marca(id)
  }

  await page.goto('./')
  await expect(page).toHaveTitle('Para Antonio')
  await page.waitForTimeout(1800)
  await shot('entrada')

  // ── Interacción 1: mantener pulsado ──
  t0 = Date.now()
  await hold(page, '[data-testid="encender"]', 2300)
  await page.waitForTimeout(200)
  await shot('entrada-encendida')

  // ── Secuencia automática ──
  await escena('sala')
  await page.waitForTimeout(2200)
  await shot('sala')
  await page.waitForTimeout(2600)
  await shot('sala-quemandose')

  await escena('carrera')
  await page.waitForTimeout(650)
  await shot('carrera-1')
  await page.waitForTimeout(950)
  await shot('carrera-2')
  await page.waitForTimeout(950)
  await shot('carrera-3')
  // pausa por toque (opcional)
  await tapCentro(page)
  await expect(page.locator('body')).toHaveClass(/pausado/)
  await page.waitForTimeout(400)
  await shot('pausa')
  await page.waitForTimeout(1000)
  await tapCentro(page)
  await expect(page.locator('body')).not.toHaveClass(/pausado/)
  await page.waitForTimeout(900)
  await shot('carrera-lista')
  await page.waitForTimeout(3400)
  await shot('carrera-giro')

  await escena('jardin')
  await page.waitForTimeout(4200)
  await shot('jardin-lineas')
  await page.waitForTimeout(4800)
  await shot('jardin-bordando')
  await page.waitForTimeout(8500)
  await shot('jardin-final')

  await escena('levanta')
  await page.waitForTimeout(2500)
  await shot('levanta')

  // ── Revelación ──
  await escena('revelacion')
  await page.waitForTimeout(700)
  await shot('rev-redoble')
  await page.waitForTimeout(1500)
  await shot('rev-cuenta')
  await page.waitForTimeout(4300)
  await shot('rev-ceniza')
  marca('ceniza-lista')
  // ── Interacción 2: rascar ──
  const box = (await page.locator('[data-testid="rascar-final"]').boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.mouse.down()
  for (let row = 0; row < 8; row++) {
    const y = box.y + 10 + (row * (box.height - 20)) / 7
    await page.mouse.move(box.x + (row % 2 ? box.width - 10 : 10), y, { steps: 12 })
    if (row === 3) await shot('rev-rascando')
  }
  await page.mouse.up()
  marca('rascado')
  await page.waitForTimeout(2400)
  await shot('rev-final')

  // ── Vale ──
  await escena('vale', 15_000)
  await page.waitForTimeout(4200)
  await shot('vale')
  await page.locator('.scene-vale').evaluate((e) => e.scrollTo(0, e.scrollHeight))
  await page.waitForTimeout(400)
  await shot('vale-botones')
  const llegar = await page.getAttribute('[data-testid="llegar"]', 'href')
  expect(llegar).toMatch(/maps\.apple\.com|google\.com\/maps/)
  expect(await page.getAttribute('[data-testid="instagram"]', 'href')).toContain('instagram.com/')

  // persistencia: recargar y ofrecer continuar
  await page.reload()
  await page.waitForTimeout(1200)
  await hold(page, '[data-testid="encender"]', 2300)
  await page.locator('[data-testid="continuar"]').waitFor({ state: 'visible', timeout: 5000 })

  fs.writeFileSync(`${dir}/tiempos.json`, JSON.stringify(tiempos, null, 2))
  console.log(info.project.name, JSON.stringify(tiempos))
  expect(errors, errors.join('\n')).toEqual([])
})

async function tapCentro(page: Page) {
  const v = page.viewportSize()!
  await page.mouse.click(v.width / 2, v.height * 0.82)
}

async function hold(page: Page, sel: string, ms: number) {
  const b = (await page.locator(sel).boundingBox())!
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(ms)
  await page.mouse.up()
}
