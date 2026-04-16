'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfil } from '@/lib/auth-cache'
import { kjorPaaminnelser } from '@/lib/actions/paaminnelser'
import { revalidatePath } from 'next/cache'

export async function oppdaterVarselInnstilling(noekkel: string, aktiv: boolean) {
  const profil = await getProfil()
  if (profil?.rolle !== 'admin') return

  const admin = createAdminClient()
  await admin
    .from('varsel_innstillinger')
    .update({ aktiv, oppdatert: new Date().toISOString() })
    .eq('noekkel', noekkel)

  revalidatePath('/innstillinger')
}

export async function kjorPaaminnerManuelt(): Promise<boolean> {
  const profil = await getProfil()
  if (profil?.rolle !== 'admin') return false

  const admin = createAdminClient()
  await kjorPaaminnelser(admin)
  return true
}
