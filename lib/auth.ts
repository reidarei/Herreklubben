import { createServerClient } from '@/lib/supabase/server'
import { kanAdministrere } from '@/lib/roller'

// Sentral autorisasjons-helper for server actions og route handlers.
// Bruk denne i stedet for å duplisere "hent user → hent profil → sjekk
// rolle"-flyten i hver action. Kaster ved manglende auth eller rolle.
//
// Returnerer den samme supabase-klienten som ble brukt til auth-sjekken,
// slik at videre spørringer går mot brukerens RLS-kontekst og ikke krever
// en ny createServerClient()-runde.
export async function ensureAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: profil } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

  if (!kanAdministrere(profil?.rolle)) throw new Error('Ikke admin')

  return { supabase, user, profil }
}

// Variant som kun krever innlogging — brukes der enhver bruker er OK,
// men handlingen krever at vi vet hvem brukeren er.
export async function ensureInnlogget() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')
  return { supabase, user }
}
