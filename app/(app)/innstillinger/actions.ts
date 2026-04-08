'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendPaaminneVarsler, sendPurringVarsler } from '@/lib/varsler'
import { addDays, subHours, addHours } from 'date-fns'
import { revalidatePath } from 'next/cache'

export async function oppdaterVarselInnstilling(noekkel: string, aktiv: boolean) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') return

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  await admin
    .from('varsel_innstillinger')
    .update({ aktiv, oppdatert: new Date().toISOString() })
    .eq('noekkel', noekkel)

  revalidatePath('/innstillinger')
}

export async function kjorPaaminnerManuelt(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user.id).single()
  if (profil?.rolle !== 'admin') return false

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const naa = new Date()

  const sju_fra = subHours(addDays(naa, 7), 12).toISOString()
  const sju_til = addHours(addDays(naa, 7), 12).toISOString()
  const en_fra = subHours(addDays(naa, 1), 12).toISOString()
  const en_til = addHours(addDays(naa, 1), 12).toISOString()
  const tre_fra = subHours(addDays(naa, 3), 12).toISOString()
  const tre_til = addHours(addDays(naa, 3), 12).toISOString()

  const [{ data: arr_7 }, { data: arr_1 }, { data: arr_3 }] = await Promise.all([
    admin.from('arrangementer').select('id, tittel, start_tidspunkt').gte('start_tidspunkt', sju_fra).lte('start_tidspunkt', sju_til),
    admin.from('arrangementer').select('id, tittel, start_tidspunkt').gte('start_tidspunkt', en_fra).lte('start_tidspunkt', en_til),
    admin.from('arrangementer').select('id, tittel, start_tidspunkt').gte('start_tidspunkt', tre_fra).lte('start_tidspunkt', tre_til),
  ])

  for (const a of arr_7 ?? []) await sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_7' })
  for (const a of arr_1 ?? []) await sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_1' })
  for (const a of arr_3 ?? []) await sendPurringVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt })

  return true
}
