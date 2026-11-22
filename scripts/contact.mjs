// Hoja de contacto de capturas: node scripts/contact.mjs qa/shots/iphone-13-mini [cols] [w]
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
const cols = Number(process.argv[3] || 4)
const w = Number(process.argv[4] || 330)
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') && !f.startsWith('_'))
const per = cols * 2
for (let s = 0; s < files.length; s += per) {
  const chunk = files.slice(s, s + per)
  const imgs = await Promise.all(chunk.map((f) => sharp(path.join(dir, f)).resize({ width: w }).png().toBuffer({ resolveWithObject: true })))
  const h = Math.max(...imgs.map((i) => i.info.height))
  const rows = Math.ceil(chunk.length / cols)
  const comp = imgs.map((im, i) => ({ input: im.data, left: (i % cols) * (w + 10), top: Math.floor(i / cols) * (h + 10) }))
  await sharp({ create: { width: cols * (w + 10), height: rows * (h + 10), channels: 3, background: '#333' } })
    .composite(comp)
    .jpeg({ quality: 82 })
    .toFile(path.join(dir, `_hoja-${s / per + 1}.jpg`))
  console.log(chunk.join(', '))
}
