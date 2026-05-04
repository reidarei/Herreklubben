// Detalj-scan av 221047 rad 1 (Hyttehelg på Digerud)
import sharp from 'sharp'

const FIL = 'C:/Users/reida/Pictures/Screenshots/Skjermbilde 2026-05-03 221047.png'
const meta = await sharp(FIL).metadata()
const radHoyde = Math.floor(meta.height / 6)
const julebordY = 1 * radHoyde

const { data, info } = await sharp(FIL)
  .extract({ left: 0, top: julebordY, width: 80, height: radHoyde })
  .raw()
  .toBuffer({ resolveWithObject: true })
const ch = info.channels

console.log(`221047 rad 1, ${meta.width}x${meta.height}, row=${radHoyde}`)
console.log('x | farged-pixler (av ' + info.height + ')')
for (let x = 0; x < info.width; x++) {
  let n = 0
  for (let y = 0; y < info.height; y++) {
    const i = (y * info.width + x) * ch
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (r < 250 || g < 250 || b < 250) n++
  }
  console.log(`${x.toString().padStart(3)} | ${'█'.repeat(Math.min(60, n))} ${n}`)
}
