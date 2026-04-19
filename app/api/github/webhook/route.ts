import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVarsel } from '@/lib/varsler'
import { formaterDato } from '@/lib/dato'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET

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
  const issue = payload.issue
  if (!issue) return NextResponse.json({ ok: true, skipped: 'no-issue' })

  const harLabel = issue.labels?.some((l: { name: string }) => l.name.toLowerCase() === 'ønske')
  if (!harLabel) return NextResponse.json({ ok: true, skipped: 'no-ønske-label' })

  const admin = createAdminClient()

  // Nytt ønske — varsle admins + oppretter
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

    const adminIder = (admins ?? []).map(a => a.id)
    const oppretterId = issue.body?.match(/<!-- profil_id:([a-f0-9-]+) -->/)?.[1]
    const mottakere = oppretterId ? [...adminIder, oppretterId] : adminIder

    await sendVarsel({
      mottakere,
      tittel: 'Nytt innspill fra appen',
      melding: innhold,
      knappTekst: 'Se innspillet',
      type: 'ønske_ny',
      tillatDuplikat: true,
    })

    return NextResponse.json({ ok: true, action: 'opened', varslet: mottakere.length })
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

    // Legg til info om at endringen er live om ca. 1 minutt
    const liveTid = new Date(Math.ceil((Date.now() + 60_000) / 60_000) * 60_000)
    const liveKl = formaterDato(liveTid.toISOString(), 'HH:mm')
    oppsummering += `\n\nEndringen er live i appen ca. kl. ${liveKl}.`

    await sendVarsel({
      mottakere: [profilId],
      tittel: 'Ønsket ditt er gjennomført',
      melding: oppsummering,
      knappTekst: 'Se svaret',
      type: 'ønske_lukket',
      tillatDuplikat: true,
    })

    return NextResponse.json({ ok: true, action: 'closed', varslet: profilId })
  }

  return NextResponse.json({ ok: true, skipped: 'unhandled-action' })
}
