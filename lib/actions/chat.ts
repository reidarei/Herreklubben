'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function sendMelding(arrangementId: string, innhold: string) {
  const tekst = innhold.trim()
  if (tekst.length < 1 || tekst.length > 500) throw new Error('Meldingen må være 1–500 tegn')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { error } = await supabase
    .from('arrangement_chat')
    .insert({ arrangement_id: arrangementId, profil_id: user.id, innhold: tekst })

  if (error) throw new Error(error.message)
}

export async function slettMelding(meldingId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('arrangement_chat')
    .delete()
    .eq('id', meldingId)

  if (error) throw new Error(error.message)
}
