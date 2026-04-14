import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { sendEpost, arrangementEpostHtml } from '@/lib/epost'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

function verifiserSignatur(body: string, signatur: string | null): boolean {
  if (!WEBHOOK_SECRET || !signatur) return false
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  hmac.update(body)
  const forventet = `sha256=${hmac.digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(signatur), Buffer.from(forventet))
}

async function varsleProfil(admin: ReturnType<typeof createAdminClient>, profilId: string, tittel: string, melding: string, knappTekst: string) {
  const { data: varsel } = await admin
    .from('personlige_varsler')
    .insert({ profil_id: profilId, tittel, melding })
    .select('id')
    .single()

  const url = varsel ? `${BASE_URL}/varsler/${varsel.id}` : `${BASE_URL}/`

  const { data: profil } = await admin
    .from('profiles')
    .select('epost')
    .eq('id', profilId)
    .single()

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profil_id', profilId)

  if (subs && subs.length > 0) {
    await Promise.all(subs.map(s => sendPush(s, { tittel, melding, url })))
  }

  if (profil?.epost) {
    const html = arrangementEpostHtml({ tittel, tekst: melding, url, knappTekst })
    await sendEpost({ til: profil.epost, emne: tittel, html })
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signatur = request.headers.get('x-hub-signature-256')

  if (WEBHOOK_SECRET && !verifiserSignatur(rawBody, signatur)) {
    return NextResponse.json({ feil: 'Ugyldig signatur' }, { status: 401 })
  }

  const event = request.headers.get('x-github-event')
  if (event !== 'issues') {
    return NextResponse.json({ ok: true, skipped: 'not-issues-event' })
  }

  const payload = JSON.parse(rawBody)
  const issue = payload.issue
  if (!issue) return NextResponse.json({ ok: true, skipped: 'no-issue' })

  const harLabel = issue.labels?.some((l: { name: string }) => l.name.toLowerCase() === 'ønske')
  if (!harLabel) return NextResponse.json({ ok: true, skipped: 'no-ønske-label' })

  const admin = createAdminClient()

  // Nytt ønske — varsle admins
  if (payload.action === 'opened') {
    const innhold = issue.body
      ?.replace(/## Ønske fra .+\n\n/i, '')
      ?.replace(/<!--[\s\S]*?-->/g, '')
      ?.trim()
      ?.slice(0, 200) ?? 'Nytt innspill i appen'

    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('rolle', 'admin')
      .eq('aktiv', true)

    if (admins) {
      await Promise.all(admins.map(a =>
        varsleProfil(admin, a.id, 'Nytt innspill fra appen', innhold, 'Se innspillet')
      ))
    }

    return NextResponse.json({ ok: true, action: 'opened', adminsVarslet: admins?.length ?? 0 })
  }

  // Ønske lukket — varsle innsenderen
  if (payload.action === 'closed') {
    const match = issue.body?.match(/<!-- profil_id:([a-f0-9-]+) -->/)
    if (!match) return NextResponse.json({ ok: true, info: 'Ingen profil_id funnet' })

    const profilId = match[1]

    let oppsummering = 'Ønsket ditt er håndtert!'
    if (issue.comments > 0 && issue.comments_url) {
      try {
        const token = process.env.GITHUB_TOKEN
        const kommentarerRes = await fetch(
          `${issue.comments_url}?per_page=1&page=${issue.comments}`,
          { headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } : {} }
        )
        if (kommentarerRes.ok) {
          const kommentarer = await kommentarerRes.json()
          if (kommentarer.length > 0) {
            oppsummering = kommentarer[0].body
              .replace(/#{1,6}\s/g, '')
              .replace(/[*_`]/g, '')
              .slice(0, 200)
          }
        }
      } catch {
        // Bruk default oppsummering
      }
    }

    // Legg til info om at endringen er live om ca. 1 minutt (rund opp til helt minutt)
    const liveTid = new Date(Math.ceil((Date.now() + 60_000) / 60_000) * 60_000)
    const liveKl = liveTid.toLocaleString('nb-NO', {
      timeZone: 'Europe/Oslo',
      hour: '2-digit',
      minute: '2-digit',
    })
    oppsummering += `\n\nEndringen er live i appen ca. kl. ${liveKl}.`

    await varsleProfil(admin, profilId, 'Ønsket ditt er gjennomført', oppsummering, 'Se svaret')
    return NextResponse.json({ ok: true, action: 'closed', varslet: profilId })
  }

  return NextResponse.json({ ok: true, skipped: 'unhandled-action' })
}
