import { defineConfig } from 'vite'

// GitHub Pages sirve el sitio en /pase-cero/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pase-cero/' : '/',
  build: {
    target: 'es2020',
    assetsDir: 'static',
    cssCodeSplit: false,
    sourcemap: false,
    // nombres de archivo neutros (sin pistas)
    rollupOptions: {
      output: {
        entryFileNames: 'static/p-[hash].js',
        chunkFileNames: 'static/p-[hash].js',
        assetFileNames: 'static/p-[hash][extname]',
      },
    },
  },
}))
