// Codifica/decodifica textos secretos para src/config.ts
//   npm run secreto -- "Texto"            → base64
//   npm run secreto -- --leer "VGV4dG8="  → texto
const args = process.argv.slice(2)
if (!args.length) {
  console.log('Uso: npm run secreto -- "Texto"   |   npm run secreto -- --leer "base64"')
  process.exit(1)
}
if (args[0] === '--leer') console.log(Buffer.from(args[1], 'base64').toString('utf8'))
else console.log(`secreto('${Buffer.from(args.join(' '), 'utf8').toString('base64')}')`)
