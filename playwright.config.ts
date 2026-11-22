import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/pase-cero/',
    trace: 'off',
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://localhost:4173/pase-cero/',
    reuseExistingServer: true,
  },
  projects: [
    // PRINCIPAL: iPhone 17e de Antonio = 390×844 CSS px (como iPhone 13/14), WebKit
    { name: 'iphone-390x844', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
    // Mismo iPhone con las barras de Safari desplegadas (viewport útil 390×664)
    { name: 'iphone-390-barras', use: { ...devices['iPhone 14'] } },
    // Accesibilidad: movimiento reducido
    { name: 'iphone-390-reducido', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' } },
    // Comprobación rápida (sin iterar diseño)
    { name: 'iphone-13-mini', use: { ...devices['iPhone 13 Mini'] } },
    { name: 'iphone-15-pro-max', use: { ...devices['iPhone 15 Pro Max'] } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
    { name: 'android-pixel-7', use: { ...devices['Pixel 7'] } },
  ],
})
