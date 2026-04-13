import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const REPO = 'reidarei/Herreklubben'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ feil: 'Ikke innlogget' }, { status: 401 })

  const { data: profil } = await supabase
    .from('profiles')
    .select('visningsnavn, navn')
    .eq('id', user.id)
    .single()

  const navn = profil?.visningsnavn ?? profil?.navn ?? 'Ukjent'

  const { tekst } = await request.json()
  if (typeof tekst !== 'string' || tekst.trim().length < 5) {
    return NextResponse.json({ feil: 'Ønsket er for kort' }, { status: 400 })
  }

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
      body: `## Ønske fra ${navn}\n\n${tekst.trim()}\n\n<!-- profil_id:${user.id} -->`,
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
