import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'

export const getInnloggetBruker = cache(async () => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getProfil = cache(async () => {
  const supabase = await createServerClient()
  const user = await getInnloggetBruker()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()
  return data
})
