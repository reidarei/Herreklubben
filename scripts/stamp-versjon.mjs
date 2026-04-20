// Skriver lib/versjon.json med beregnet app-versjon basert på git-count.
// Kjøres lokalt før push — versjonsfilen commit-es som en del av repoet.
// Dette unngår at Vercel sin shallow clone gir feil telling ved build.
//
// Format: { "versjon": "V2.050" } — major fra package.json, minor = count − 180.
// Offset 180 er valgt fordi redesign-commit 7b6b806 (commit #181) er V2.001.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rot = join(__dirname, '..')

const pkg = JSON.parse(readFileSync(join(rot, 'package.json'), 'utf8'))
const count = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
const [major] = pkg.version.split('.')
const diff = count - 180
const versjon = diff >= 1 ? `V${major}.${String(diff).padStart(3, '0')}` : `V${pkg.version}`

const utPath = join(rot, 'lib', 'versjon.json')
writeFileSync(utPath, JSON.stringify({ versjon }, null, 2) + '\n')
console.log(`→ ${utPath}: ${versjon}`)
