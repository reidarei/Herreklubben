import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const REPO = 'reidarei/Herreklubben'

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

  // Opprett GitHub Issue
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: tekst.trim().length > 80
        ? tekst.trim().slice(0, 77) + '...'
        : tekst.trim(),
      body: `## Anonymt ønske fra appen\n\nSendt inn via «Bli en utvikler»-skjemaet.\n\n---\n\n${tekst.trim()}`,
      labels: ['ønske'],
    }),
  })

  if (!res.ok) {
    const feil = await res.text()
    console.error('GitHub Issue feilet:', feil)
    return NextResponse.json({ feil: 'Kunne ikke opprette ønske' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
