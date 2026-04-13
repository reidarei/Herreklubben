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

  // Kun når issue lukkes
  if (payload.action !== 'closed') {
    return NextResponse.json({ ok: true, skipped: 'not-closed' })
  }

  const issue = payload.issue
  if (!issue) return NextResponse.json({ ok: true, skipped: 'no-issue' })

  // Sjekk at det er et ønske-issue (case-insensitive)
  const harLabel = issue.labels?.some((l: { name: string }) => l.name.toLowerCase() === 'ønske')
  if (!harLabel) return NextResponse.json({ ok: true, skipped: 'no-ønske-label' })

  // Finn profil_id fra issue body
  const match = issue.body?.match(/<!-- profil_id:([a-f0-9-]+) -->/)
  if (!match) return NextResponse.json({ ok: true, info: 'Ingen profil_id funnet' })

  const profilId = match[1]

  // Hent siste kommentar som oppsummering
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
          // Strip markdown formatting for a clean message
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

  const admin = createAdminClient()

  // Hent profil med epost
  const { data: profil } = await admin
    .from('profiles')
    .select('id, visningsnavn, epost')
    .eq('id', profilId)
    .single()

  if (!profil) return NextResponse.json({ ok: true, info: 'Profil ikke funnet' })

  const tittel = `Ønsket ditt er gjennomført`
  const melding = oppsummering
  const url = `${BASE_URL}/`

  // Send push
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profil_id', profilId)

  if (subs && subs.length > 0) {
    await Promise.all(subs.map(s =>
      sendPush(s, { tittel, melding, url })
    ))
  }

  // Send alltid epost i tillegg (personlig varsel, viktig å nå frem)
  if (profil.epost) {
    const html = arrangementEpostHtml({
      tittel,
      tekst: melding,
      url,
      knappTekst: 'Åpne appen',
    })
    await sendEpost({ til: profil.epost, emne: tittel, html })
  }

  return NextResponse.json({ ok: true, varslet: profilId })
}
