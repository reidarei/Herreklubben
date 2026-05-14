// Genererer en HTML der hvert bilde-par vises ved siden av sin kommentar-crop
// + en tredje kolonne med strukturert OCR-resultat.
// Reidar bruker den til å verifisere at OCR-en treffer riktig.
//
// Bruk: node scripts/fb-bilder-metadata-html.mjs

import { readFileSync, writeFileSync } from 'node:fs'

const PAIRING_FIL = 'scripts/fb-bilder-pairing.json'
const METADATA_FIL = 'scripts/fb-bilder-metadata.json'
const HTML_OUT = 'scripts/fb-bilder-metadata.html'
const CROPS_PUB = 'fb-bilder-kommentar-crops'

const pairing = JSON.parse(readFileSync(PAIRING_FIL, 'utf8'))
const metadata = JSON.parse(readFileSync(METADATA_FIL, 'utf8'))

const metaFraNr = new Map(metadata.map(m => [m.screenshot_nr, m]))

// Grupper på screenshot
const grupper = new Map()
for (const p of pairing.par) {
  if (!grupper.has(p.screenshot_nr)) grupper.set(p.screenshot_nr, { screenshot: p.screenshot, screenshot_nr: p.screenshot_nr, bilder: [] })
  grupper.get(p.screenshot_nr).bilder.push(p)
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const rader = [...grupper.values()]
  .sort((a, b) => a.screenshot_nr - b.screenshot_nr)
  .map(g => {
    const meta = metaFraNr.get(g.screenshot_nr)
    const bilderHtml = g.bilder.map(p => `
      <div style="margin-bottom:8px">
        <strong>bilde ${p.bilde_nr}</strong><br>
        <img src="fb-bilder-preview/${p.bilde}" loading="lazy" style="max-width:240px;max-height:200px;display:block">
      </div>`).join('')

    const kommentarerHtml = (meta?.kommentarer ?? []).map(k => `
      <div style="margin-top:6px;padding:6px 8px;background:#f0f0f0;border-radius:6px;font-size:12px">
        <strong>${escapeHtml(k.navn)}</strong>
        <span style="color:#888;font-size:10px">${escapeHtml(k.relativ_tid ?? '')}</span><br>
        ${escapeHtml(k.tekst)}
        ${k.svar_paa ? `<div style="font-size:10px;color:#999">↳ svar på ${escapeHtml(k.svar_paa)}</div>` : ''}
        ${k.har_bilde ? `<div style="font-size:10px;color:#c70">📷 inneholder bilde</div>` : ''}
      </div>`).join('')

    const merknadHtml = meta?.merknad ? `<div style="background:#fff3cd;padding:6px;border-radius:4px;font-size:11px;margin-top:6px">⚠️ ${escapeHtml(meta.merknad)}</div>` : ''

    return `<tr>
      <td>${bilderHtml}</td>
      <td><strong>screenshot ${g.screenshot_nr}</strong><br>
          <img src="${CROPS_PUB}/${g.screenshot}" loading="lazy" style="max-width:340px;display:block;border:1px solid #ccc">
      </td>
      <td style="min-width:280px;max-width:380px">
        <div style="font-size:13px"><strong>${escapeHtml(meta?.postet_av ?? '?')}</strong>
        <span style="color:#888;font-size:11px">${escapeHtml(meta?.postet_dato ?? '?')}</span></div>
        ${meta?.beskrivelse ? `<div style="margin-top:6px;font-size:13px;white-space:pre-wrap">${escapeHtml(meta.beskrivelse)}</div>` : '<div style="font-size:11px;color:#aaa;font-style:italic">(ingen beskrivelse)</div>'}
        ${merknadHtml}
        ${kommentarerHtml.length ? `<div style="margin-top:8px"><strong style="font-size:11px;color:#555">${(meta?.kommentarer?.length ?? 0)} kommentarer:</strong>${kommentarerHtml}</div>` : '<div style="margin-top:8px;font-size:11px;color:#aaa">(ingen kommentarer)</div>'}
      </td>
    </tr>`
  }).join('')

const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><title>FB-bilder metadata-verifikasjon</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #fafafa; color: #222; }
  h1 { font-size: 18px; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th, td { border: 1px solid #ddd; padding: 10px; vertical-align: top; text-align: left; }
  th { background: #eee; position: sticky; top: 0; z-index: 1; }
  .merknad { background: #fff3cd; padding: 12px; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 20px; }
</style></head><body>
<h1>Metadata-verifikasjon — ${grupper.size} unike screenshots, ${pairing.par.length} bilder, ${metadata.filter(m => m.kommentarer?.length).length} med kommentarer</h1>
<div class="merknad">
  Sammenlign kolonne 3 (OCR-resultat) med kolonne 2 (kommentar-crop). Si fra med screenshot-nr om noe er feil eller mangler.
</div>
<table>
<thead><tr><th>Bilde(r)</th><th>Kommentar-crop</th><th>OCR-resultat</th></tr></thead>
<tbody>${rader}</tbody>
</table>
</body></html>`

writeFileSync(HTML_OUT, html, 'utf8')
console.log(`✓ Skrev ${HTML_OUT}`)
