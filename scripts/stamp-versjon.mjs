// Øker minor-nummeret i lib/versjon.json med 1. Kjøres lokalt før push.
// Filen er committed, så Vercel leser bare resultatet uten git-avhengighet.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rot = join(__dirname, '..')

const pkg = JSON.parse(readFileSync(join(rot, 'package.json'), 'utf8'))
const fil = join(rot, 'lib', 'versjon.json')
const forrige = JSON.parse(readFileSync(fil, 'utf8'))

const neste = (forrige.nummer ?? 0) + 1
const [major] = pkg.version.split('.')
const versjon = `V${major}.${String(neste).padStart(3, '0')}`

writeFileSync(fil, JSON.stringify({ nummer: neste, versjon }, null, 2) + '\n')
console.log(`→ ${versjon}`)
