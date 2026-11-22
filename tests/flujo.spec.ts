import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

/**
 * Recorre la experiencia completa como lo haría Antonio, con capturas
 * de cada pantalla en qa/shots/<dispositivo>/ y cronometraje.
 */
test('flujo completo', async ({ page }, info) => {
  const dir = `qa/shots/${info.project.name}`
  fs.mkdirSync(dir, { recursive: true })
  let n = 0
  const shot = async (name: string) => {
    await page.screenshot({ path: `${dir}/${String(++n).padStart(2, '0')}-${name}.png` })
  }
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const t0 = Date.now()
  const tiempos: Record<string, number> = {}
  const marca = (k: string) => (tiempos[k] = Math.round((Date.now() - t0) / 100) / 10)

  await page.goto('./')
  await expect(page).toHaveTitle('Para Antonio')
  await page.waitForTimeout(1800)
  await shot('entrada')

  // 0 · mantener pulsado
  await hold(page, '[data-testid="encender"]', 1400)
  await shot('entrada-cargando')
  await hold(page, '[data-testid="encender"]', 3000)
  marca('entrada')
  await page.waitForTimeout(300)
  await shot('entrada-encendida')

  // 1 · sala
  await page.waitForSelector('[data-scene="sala"]')
  await page.waitForTimeout(2900)
  await shot('sala')
  await page.click('[data-testid="servicio"]')
  marca('sala')

  // 2 · pase 0
  await page.waitForSelector('[data-scene="pase0"]')
  await page.waitForTimeout(2600)
  await shot('pase0')
  await page.click('[data-testid="catar"]')
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(700)
  await shot('pase0-ficha')
  await page.click('[data-testid="siguiente"]')
  marca('pase0')

  // 3 · pase I · rascar
  await page.waitForSelector('[data-scene="pase1"]')
  await page.waitForTimeout(1800)
  await shot('pase1')
  const box = (await page.locator('[data-testid="rascar"]').boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.mouse.down()
  for (let row = 0; row < 9; row++) {
    const y = box.y + 12 + (row * (box.height - 24)) / 8
    await page.mouse.move(box.x + (row % 2 ? box.width - 10 : 10), y, { steps: 10 })
    if (row === 3) await shot('pase1-rascando')
  }
  await page.mouse.up()
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(500)
  await shot('pase1-revelado')
  await page.click('[data-testid="siguiente"]')
  marca('pase1')

  // 4 · pase II · avivar
  await page.waitForSelector('[data-scene="pase2"]')
  await page.waitForTimeout(1800)
  await shot('pase2')
  await hold(page, '[data-testid="avivar"]', 2200)
  await shot('pase2-avivando')
  await hold(page, '[data-testid="avivar"]', 5000)
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(400)
  await shot('pase2-revelado')
  await page.click('[data-testid="siguiente"]')
  marca('pase2')

  // 5 · pase III · año (un fallo con guasa y luego el acierto)
  await page.waitForSelector('[data-scene="pase3"]')
  await page.waitForTimeout(2000)
  await shot('pase3')
  for (const k of '1985') await page.click(`.tecla[data-k="${k}"]`)
  await page.waitForTimeout(900)
  await shot('pase3-fallo')
  for (const k of '1972') await page.click(`.tecla[data-k="${k}"]`)
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(500)
  await shot('pase3-acierto')
  await page.click('[data-testid="siguiente"]')
  marca('pase3')

  // 6 · pase IV · combate
  await page.waitForSelector('[data-scene="pase4"]')
  await page.waitForTimeout(3300)
  await shot('pase4')
  await page.click('[data-testid="esquina-conocida"]')
  await page.waitForTimeout(600)
  await shot('pase4-fallo')
  await page.click('[data-testid="esquina-pendiente"]')
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(500)
  await shot('pase4-acierto')
  await page.click('[data-testid="siguiente"]')
  marca('pase4')

  // 7 · El Jardín (bordado)
  await page.waitForSelector('[data-scene="jardin"]')
  await page.waitForTimeout(4200)
  await shot('jardin-lineas')
  await page.waitForTimeout(3200)
  await shot('jardin-bordando')
  await page.waitForTimeout(3000)
  await shot('jardin-bordando-2')
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(600)
  await shot('jardin-final')
  await page.click('[data-testid="siguiente"]')
  marca('jardin')

  // 7b · Levanta la vista (no se puede avanzar ~5 s)
  await page.waitForSelector('[data-scene="levanta"]')
  await page.waitForTimeout(2000)
  await shot('levanta')
  await expect(page.locator('[data-testid="siguiente"]')).toBeHidden()
  await page.locator('[data-testid="siguiente"]').waitFor({ state: 'visible', timeout: 10000 })
  await shot('levanta-seguir')
  await page.click('[data-testid="siguiente"]')
  marca('levanta')

  // 8 · En voz alta
  await page.waitForSelector('[data-scene="vozAlta"]')
  await page.waitForTimeout(1500)
  await shot('voz-1')
  for (let i = 2; i <= 4; i++) {
    await page.click('[data-testid="voz-pagina"]')
    await page.waitForTimeout(900)
    await shot(`voz-${i}`)
  }
  await page.click('[data-testid="redoble"]')
  marca('vozAlta')

  // 9 · Revelación
  await page.waitForSelector('[data-scene="revelacion"]')
  await page.waitForTimeout(1300)
  await shot('rev-cuenta')
  await page.waitForTimeout(3300)
  await shot('rev-apagon')
  await page.waitForTimeout(1100)
  await shot('rev-forja')
  await page.locator('[data-testid="vale"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(800)
  await shot('rev-final')
  await page.click('[data-testid="vale"]')
  marca('revelacion')

  // 10 · Vale
  await page.waitForSelector('[data-scene="vale"]')
  await page.waitForTimeout(4200)
  await shot('vale')
  await page.locator('.scene-vale').evaluate((e) => e.scrollTo(0, e.scrollHeight))
  await page.waitForTimeout(400)
  await shot('vale-botones')
  await page.click('[data-testid="guardar"]')
  await page.waitForTimeout(1200)
  await shot('vale-guardar')
  marca('vale')

  // enlaces correctos (sin abrirlos)
  const llegar = await page.getAttribute('[data-testid="llegar"]', 'href')
  expect(llegar).toMatch(/maps\.apple\.com|google\.com\/maps/)
  expect(await page.getAttribute('[data-testid="instagram"]', 'href')).toContain('instagram.com/')

  // persistencia: recargar y ofrecer continuar
  await page.reload()
  await page.waitForTimeout(1200)
  await hold(page, '[data-testid="encender"]', 3000)
  await page.locator('[data-testid="continuar"]').waitFor({ state: 'visible', timeout: 5000 })
  await shot('reanudar')

  fs.writeFileSync(`${dir}/tiempos.json`, JSON.stringify(tiempos, null, 2))
  console.log(info.project.name, JSON.stringify(tiempos))
  expect(errors, errors.join('\n')).toEqual([])
})

async function hold(page: Page, sel: string, ms: number) {
  const b = (await page.locator(sel).boundingBox())!
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(ms)
  await page.mouse.up()
}
