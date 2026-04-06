'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function oppdaterPaamelding(
  arrangementId: string,
  status: 'ja' | 'nei' | 'kanskje'
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('paameldinger')
    .upsert({
      arrangement_id: arrangementId,
      profil_id: user.id,
      status,
      oppdatert: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/arrangementer/${arrangementId}`)
  revalidatePath('/')
}
