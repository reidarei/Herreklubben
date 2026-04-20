import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { sendEpost, velkommenEpostHtml } from '@/lib/epost'
import { NextResponse } from 'next/server'
import { kanAdministrere } from '@/lib/roller'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mortensrudherreklubb.no'

function genererPassord() {
  const tegn = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => tegn[Math.floor(Math.random() * tegn.length)]).join('')
}

export async function POST(request: Request) {
  // Verifiser at kaller er admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ feil: 'Ikke innlogget' }, { status: 401 })

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (!kanAdministrere(profil?.rolle)) return NextResponse.json({ feil: 'Ikke admin' }, { status: 403 })

  const { navn, epost } = await request.json()
  if (!navn || !epost) return NextResponse.json({ feil: 'Mangler navn eller e-post' }, { status: 400 })

  // Bruk service-role for å opprette bruker
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const passord = genererPassord()

  const { data, error } = await adminClient.auth.admin.createUser({
    email: epost,
    password: passord,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ feil: error.message }, { status: 400 })

  // Oppdater profiles med navn og visningsnavn (fornavn)
  const visningsnavn = navn.split(' ')[0]
  await adminClient
    .from('profiles')
    .update({ navn, visningsnavn })
    .eq('id', data.user.id)

  // Send velkomst-e-post med innloggingsinfo
  await sendEpost({
    til: epost,
    emne: 'Velkommen til Mortensrud Herreklubb',
    html: velkommenEpostHtml({
      navn,
      epost,
      passord,
      loggInnUrl: `${BASE_URL}/login`,
    }),
  })

  return NextResponse.json({ ok: true, passord })
}
