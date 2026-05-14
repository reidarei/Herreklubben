// Laster opp alle FB-bilder til R2 under meldinger/-prefiks.
// Idempotent — sjekker ikke om filen finnes, men R2 PUT erstatter uansett.
//
// Bruk: node --env-file=.env.local scripts/fb-bilder-last-opp-r2.mjs

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AwsClient } from 'aws4fetch'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const JURISDICTION = (process.env.R2_JURISDICTION ?? 'default').toLowerCase()
const SEG = JURISDICTION === 'default' ? '' : `.${JURISDICTION}`

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.error('Mangler R2 env-vars')
  process.exit(1)
}

// EU jurisdiksjon krever 'eeur' som region for signering — 'auto' fungerer
// i Next.js men ikke fra Node.js direkte. Sett basert på R2_JURISDICTION.
const REGION = JURISDICTION === 'eu' ? 'eeur' : 'auto'
const aws = new AwsClient({ accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY, region: REGION, service: 's3' })

const data = JSON.parse(readFileSync('scripts/fb-bilder-pairing.json', 'utf8'))
const filer = [...new Set(data.par.map(p => p.bilde))]

let opp = 0, feil = 0
for (const f of filer) {
  const sti = `meldinger/${f}`
  const url = `https://${ACCOUNT_ID}${SEG}.r2.cloudflarestorage.com/${BUCKET}/${sti}`
  const buf = readFileSync(`C:/Users/reida/Pictures/${f}`)
  const ct = f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
  const res = await aws.fetch(url, {
    method: 'PUT',
    body: buf,
    headers: {
      'Content-Type': ct,
      'Content-Length': String(buf.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
  if (res.ok) {
    opp++
    process.stdout.write('.')
  } else {
    feil++
    console.error(`\n✗ ${f}: ${res.status} ${await res.text()}`)
  }
}

console.log(`\n✓ ${opp} opplastet, ${feil} feil`)
