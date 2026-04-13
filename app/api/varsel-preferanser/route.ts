import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })

  const body = await req.json()
  const oppdatering: Record<string, unknown> = { oppdatert: new Date().toISOString() }

  if (typeof body.push_aktiv === 'boolean') oppdatering.push_aktiv = body.push_aktiv
  if (typeof body.epost_aktiv === 'boolean') oppdatering.epost_aktiv = body.epost_aktiv

  await supabase.from('varsel_preferanser').upsert(
    { profil_id: user.id, ...oppdatering },
    { onConflict: 'profil_id' }
  )

  return NextResponse.json({ ok: true })
}
