'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendPaaminneVarsler, sendPurringVarsler } from '@/lib/varsler'
import { addDays } from 'date-fns'
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

  // TODO: bruk global tidsstyring når den er på plass
  const naa = new Date()
  const dag7 = addDays(naa, 7).toISOString().slice(0, 10)
  const dag1 = addDays(naa, 1).toISOString().slice(0, 10)
  const dag3 = addDays(naa, 3).toISOString().slice(0, 10)

  const [{ data: arr_7 }, { data: arr_1 }, { data: arr_3 }] = await Promise.all([
    admin.from('arrangementer').select('id, tittel, start_tidspunkt').gte('start_tidspunkt', `${dag7}T00:00:00`).lt('start_tidspunkt', `${dag7}T23:59:59`),
    admin.from('arrangementer').select('id, tittel, start_tidspunkt').gte('start_tidspunkt', `${dag1}T00:00:00`).lt('start_tidspunkt', `${dag1}T23:59:59`),
    admin.from('arrangementer').select('id, tittel, start_tidspunkt').gte('start_tidspunkt', `${dag3}T00:00:00`).lt('start_tidspunkt', `${dag3}T23:59:59`),
  ])

  for (const a of arr_7 ?? []) await sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_7' })
  for (const a of arr_1 ?? []) await sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_1' })
  for (const a of arr_3 ?? []) await sendPurringVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt })

  return true
}
