import { createServerClient } from '@/lib/supabase/server'
import { sendEpost } from '@/lib/epost'
import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mortensrudherreklubb.no'
const AKSENT = '#d4a853'

export async function POST(request: Request) {
  // Auth sjekkes kun for å hindre misbruk utenfra — identiteten brukes
  // bevisst ikke videre. Skjemaet er anonymt for innsenderen.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ feil: 'Ikke innlogget' }, { status: 401 })

  const { tekst } = await request.json()
  if (typeof tekst !== 'string' || tekst.trim().length < 5) {
    return NextResponse.json({ feil: 'Ønsket er for kort' }, { status: 400 })
  }

  // Hent alle admin-eposter
  const { data: admins } = await supabase
    .from('profiles')
    .select('epost')
    .eq('rolle', 'admin')
    .eq('aktiv', true)

  const adminEposter = (admins ?? []).map(a => a.epost).filter(Boolean)
  if (adminEposter.length === 0) {
    return NextResponse.json({ feil: 'Fant ingen admin å sende til' }, { status: 500 })
  }

  // Trygg HTML-escaping så fritekst ikke bryter malen
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const tekstHtml = escapeHtml(tekst.trim()).replace(/\n/g, '<br>')

  const html = `
<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Mortensrud Herreklubb</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Nytt anonymt ønske</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Et medlem har sendt inn et anonymt ønske via «Bli en utvikler». Innsenderen er ikke registrert.</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-left:3px solid ${AKSENT};">
            <tr><td style="padding:8px 0 8px 16px;font-size:15px;line-height:1.6;">${tekstHtml}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:separate;">
            <tr><td bgcolor="${AKSENT}" style="background:${AKSENT};border-radius:8px;">
              <a href="${BASE_URL}" style="display:inline-block;padding:12px 24px;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:14px;">Åpne appen</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  // Send til alle admins
  await Promise.all(
    adminEposter.map(til =>
      sendEpost({
        til,
        emne: 'Nytt anonymt ønske — Mortensrud Herreklubb',
        html,
      })
    )
  )

  return NextResponse.json({ ok: true })
}
