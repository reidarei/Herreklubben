// Pairing-HTML for FB-bilder + screenshots.
//
// Strategi: bildet lastes ned ~10 sek FØR screenshotten tas. For hver
// screenshot finner vi den nærmeste foregående bilde-filen som ikke alt
// er paret. Genererer en HTML der Reidar visuelt kan verifisere parene
// + en JSON som kan redigeres manuelt.
//
// Bruk:  node scripts/fb-bilder-pairing.mjs

import { readdirSync, statSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const BILDER_DIR = 'C:/Users/reida/Pictures'
const SCREENSHOTS_DIR = 'C:/Users/reida/Pictures/Screenshots'
const PREVIEW_DIR = 'scripts/fb-bilder-preview'
const HTML_OUT = 'scripts/fb-bilder-pairing.html'
const JSON_OUT = 'scripts/fb-bilder-pairing.json'

// Filnavn å ekskludere — app-ikoner, ikke FB-innhold
const EKSKLUDER = ['icon-192.png', 'icon-192n.png']

function listFiler(dir, predicate) {
  return readdirSync(dir)
    .filter(f => predicate(f))
    .filter(f => !EKSKLUDER.includes(f))
    .map(f => {
      const full = join(dir, f)
      return { navn: f, full, mtime: statSync(full).mtime }
    })
    .sort((a, b) => a.mtime - b.mtime)
}

const bilder = listFiler(BILDER_DIR, f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('Skjermbilde') && !f.startsWith('_crop'))
const screenshots = listFiler(SCREENSHOTS_DIR, f => /^Skjermbilde.*\.png$/i.test(f))

// Algoritme: for hver screenshot, ta nyeste ikke-parede bilde med mtime < screenshot.mtime
// Tildel løpenumre i kronologisk rekkefølge (samme rekkefølge som listene
// allerede er sortert i — eldst først). Reidar bruker disse numrene når
// han retter parringen: "bilde 2 skal pares med screenshot 3".
const bildeNr = new Map(bilder.map((b, i) => [b.navn, i + 1]))
const screenshotNr = new Map(screenshots.map((s, i) => [s.navn, i + 1]))

const usedBilder = new Set()
const par = []
for (const ss of screenshots) {
  const kandidater = bilder
    .filter(b => !usedBilder.has(b.navn) && b.mtime < ss.mtime)
    .sort((a, b) => b.mtime - a.mtime)
  const valgt = kandidater[0] ?? null
  if (valgt) usedBilder.add(valgt.navn)
  par.push({
    screenshot_nr: screenshotNr.get(ss.navn),
    screenshot: ss.navn,
    screenshot_mtime: ss.mtime.toISOString(),
    bilde_nr: valgt ? bildeNr.get(valgt.navn) : null,
    bilde: valgt?.navn ?? null,
    bilde_mtime: valgt?.mtime.toISOString() ?? null,
    diff_sek: valgt ? Math.round((ss.mtime - valgt.mtime) / 1000) : null,
  })
}

const ikkeParede = bilder.filter(b => !usedBilder.has(b.navn))

// Kopier til preview-mappe (relative paths i HTML)
if (existsSync(PREVIEW_DIR)) rmSync(PREVIEW_DIR, { recursive: true })
mkdirSync(PREVIEW_DIR, { recursive: true })
for (const b of bilder) copyFileSync(b.full, join(PREVIEW_DIR, b.navn))
for (const s of screenshots) copyFileSync(s.full, join(PREVIEW_DIR, s.navn))

// JSON-output
writeFileSync(JSON_OUT, JSON.stringify({ par, ikke_parede_bilder: ikkeParede.map(b => b.navn) }, null, 2), 'utf8')

// HTML-output
const rader = par.map(p => `
<tr>
  <td>${p.bilde_nr != null ? `<strong style="font-size:22px">bilde ${p.bilde_nr}</strong>` : '—'}<br>
      ${p.bilde ? `<img src="fb-bilder-preview/${p.bilde}" loading="lazy"><br><code>${p.bilde}</code>` : '<em style="color:red">INGEN BILDE FUNNET</em>'}</td>
  <td><strong style="font-size:22px">screenshot ${p.screenshot_nr}</strong><br>
      <img src="fb-bilder-preview/${p.screenshot}" loading="lazy"><br><code>${p.screenshot}</code></td>
  <td><small>diff: ${p.diff_sek ?? '?'} sek<br>ss: ${p.screenshot_mtime}<br>b: ${p.bilde_mtime ?? '-'}</small></td>
</tr>`).join('')

const ikkeParedeRader = ikkeParede.map(b => `
<tr>
  <td><strong style="font-size:22px">bilde ${bildeNr.get(b.navn)}</strong><br>
      <img src="fb-bilder-preview/${b.navn}" loading="lazy"><br><code>${b.navn}</code></td>
  <td><small>${b.mtime.toISOString()}</small></td>
</tr>`).join('')

const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<title>FB-bilder pairing — visuell verifikasjon</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #fafafa; color: #222; }
  h1 { font-size: 18px; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; text-align: left; }
  th { background: #eee; position: sticky; top: 0; }
  img { max-width: 380px; max-height: 280px; display: block; }
  code { font-size: 11px; color: #555; word-break: break-all; }
  small { font-size: 10px; color: #666; }
  .merknad { background: #fff3cd; padding: 12px; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>FB-bilder pairing — ${par.length} par, ${ikkeParede.length} ikke-parede bilder</h1>

<div class="merknad">
  <strong>Slik:</strong> Scroll gjennom og verifiser at hvert bilde matcher screenshoten ved siden av (samme motiv synlig i screenshot-en).
  Hvis et par er feil — si f.eks. «bilde 7 skal pares med screenshot 9». Ikke-parede bilder vises nederst.
</div>

<table>
<thead><tr><th>Bilde (FB-original)</th><th>Screenshot (med kommentarer)</th><th>Tidspunkter</th></tr></thead>
<tbody>${rader}</tbody>
</table>

${ikkeParede.length ? `
<h2 style="margin-top:30px">Ikke-parede bilder (${ikkeParede.length})</h2>
<table>
<thead><tr><th>Bilde</th><th>Tidspunkt</th></tr></thead>
<tbody>${ikkeParedeRader}</tbody>
</table>` : ''}

</body></html>`

writeFileSync(HTML_OUT, html, 'utf8')

console.log(`✓ ${par.length} par foreslått`)
console.log(`✓ ${ikkeParede.length} ikke-parede bilder`)
console.log(`✓ HTML: ${HTML_OUT}`)
console.log(`✓ JSON: ${JSON_OUT}`)
console.log(`\nÅpne ${HTML_OUT} i nettleser for visuell verifikasjon.`)
