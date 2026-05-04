// Fokusert R2-upload av FB-cover-bilder. Engangsbruk.
// Credentials passes via env-vars (engangs-token i Cloudflare med 1d TTL).

import { readFile, readdir } from 'node:fs/promises'
import { AwsClient } from 'aws4fetch'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET ?? 'herreklubben-bilder'
const JURISDICTION = (process.env.R2_JURISDICTION ?? 'eu').toLowerCase()

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error('Mangler R2-credentials')
  process.exit(1)
}

const aws = new AwsClient({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: 'auto',
  service: 's3',
})
const segment = JURISDICTION === 'default' ? '' : `.${JURISDICTION}`
const endpoint = `https://${ACCOUNT_ID}${segment}.r2.cloudflarestorage.com`

const filer = (await readdir('scripts/fb-crops')).filter(f => f.endsWith('.jpg'))
console.log(`Laster opp ${filer.length} bilder til ${BUCKET}/arrangementer/…\n`)

let antall = 0
let feilet = []
for (const f of filer) {
  const data = await readFile(`scripts/fb-crops/${f}`)
  const url = `${endpoint}/${BUCKET}/arrangementer/${f}`
  const res = await aws.fetch(url, {
    method: 'PUT',
    body: data,
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
  if (!res.ok) {
    feilet.push({ f, status: res.status, body: await res.text().catch(() => '') })
    console.log(`  ✗ ${f} (${res.status})`)
  } else {
    antall++
    if (antall % 10 === 0) console.log(`  ${antall}/${filer.length}…`)
  }
}

console.log(`\n✓ Lastet opp ${antall} bilder`)
if (feilet.length > 0) {
  console.error(`\n✗ ${feilet.length} feilet:`)
  for (const f of feilet) console.error(`  ${f.f}: ${f.status} ${f.body.slice(0, 100)}`)
  process.exit(1)
}
