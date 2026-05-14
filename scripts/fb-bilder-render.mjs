// Renderer fb-bilder-pairing.html fra fb-bilder-pairing.json.
// Kjør etter manuelle bytter med fb-bilder-bytt.mjs.
//
// Bruk:  node scripts/fb-bilder-render.mjs

import { readFileSync, writeFileSync } from 'node:fs'

const JSON_FIL = 'scripts/fb-bilder-pairing.json'
const HTML_OUT = 'scripts/fb-bilder-pairing.html'

const data = JSON.parse(readFileSync(JSON_FIL, 'utf8'))
const par = data.par
const ikkeParedeBilder = data.ikke_parede_bilder ?? []
const ikkeParedeScreenshots = data.ikke_parede_screenshots ?? []

// Grupper par på screenshot_nr — flere bilder pr screenshot er lov
const grupper = new Map()
for (const p of par) {
  if (!grupper.has(p.screenshot_nr)) grupper.set(p.screenshot_nr, { screenshot: p, bilder: [] })
  grupper.get(p.screenshot_nr).bilder.push(p)
}

const rader = [...grupper.values()].map(g => {
  const bilderHtml = g.bilder.map(p => `
    <div style="margin-bottom:8px">
      <strong style="font-size:20px">bilde ${p.bilde_nr}</strong>
      <small style="color:#888"> (diff ${p.diff_sek ?? '?'}s)</small><br>
      <img src="fb-bilder-preview/${p.bilde}" loading="lazy"><br>
      <code>${p.bilde}</code>
    </div>`).join('')
  return `<tr>
  <td>${bilderHtml}</td>
  <td><strong style="font-size:22px">screenshot ${g.screenshot.screenshot_nr}</strong><br>
      <img src="fb-bilder-preview/${g.screenshot.screenshot}" loading="lazy"><br><code>${g.screenshot.screenshot}</code></td>
  <td><small>ss: ${g.screenshot.screenshot_mtime}<br>antall bilder: ${g.bilder.length}</small></td>
</tr>`
}).join('')

const ikkeParedeBilderRader = ikkeParedeBilder.map(o => {
  const navn = typeof o === 'string' ? o : o.navn
  const nr = typeof o === 'string' ? null : o.bilde_nr
  return `<tr>
  <td>${nr != null ? `<strong style="font-size:18px">bilde ${nr}</strong><br>` : ''}
      <img src="fb-bilder-preview/${navn}" loading="lazy"><br><code>${navn}</code></td>
</tr>`
}).join('')

const ikkeParedeScreenshotsRader = ikkeParedeScreenshots.map(o => `
<tr>
  <td><strong style="font-size:18px">screenshot ${o.screenshot_nr}</strong><br>
      <img src="fb-bilder-preview/${o.screenshot}" loading="lazy"><br><code>${o.screenshot}</code></td>
</tr>`).join('')

const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><title>FB-bilder pairing</title>
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
</style></head><body>
<h1>FB-bilder pairing — ${par.length} par, ${ikkeParedeBilder.length} løse bilder, ${ikkeParedeScreenshots.length} løse screenshots</h1>
<div class="merknad">
  Si f.eks. «bilde 5 skal pares med screenshot 7». Jeg kjører <code>scripts/fb-bilder-bytt.mjs 5 7</code> + <code>render</code> og du laster denne siden på nytt.
</div>
<table>
<thead><tr><th>Bilde (FB-original)</th><th>Screenshot (med kommentarer)</th><th>Tidspunkter</th></tr></thead>
<tbody>${rader}</tbody>
</table>
${ikkeParedeBilder.length ? `<h2 style="margin-top:30px">Løse bilder uten screenshot (${ikkeParedeBilder.length})</h2>
<table><thead><tr><th>Bilde</th></tr></thead><tbody>${ikkeParedeBilderRader}</tbody></table>` : ''}
${ikkeParedeScreenshots.length ? `<h2 style="margin-top:30px">Løse screenshots uten bilde (${ikkeParedeScreenshots.length})</h2>
<table><thead><tr><th>Screenshot</th></tr></thead><tbody>${ikkeParedeScreenshotsRader}</tbody></table>` : ''}
</body></html>`

writeFileSync(HTML_OUT, html, 'utf8')
console.log(`✓ Rendret ${HTML_OUT}`)
