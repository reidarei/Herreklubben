import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returnerer true hvis det finnes klubb_chat-meldinger fra andre enn brukeren
 * selv som er nyere enn brukerens `chat_sist_sett`-tidsstempel. Brukes til
 * ulest-prikken på Chat-tab i TopHeader. Holdt sentralt så indikatoren kan
 * gjenbrukes hvis vi senere vil vise badge andre steder.
 */
export async function harUlestChat(
  supabase: SupabaseClient,
  brukerId: string
): Promise<boolean> {
  // Hent siste-sett først (én rad, RLS sørger for at vi kun ser egen rad)
  const { data: profil } = await supabase
    .from('profiles')
    .select('chat_sist_sett')
    .eq('id', brukerId)
    .maybeSingle()

  // Null = aldri åpnet chat, dvs. alt er "ulest"
  const sistSett = profil?.chat_sist_sett ?? '1970-01-01T00:00:00Z'

  // Finnes det minst én melding fra andre enn meg, nyere enn sistSett?
  const { count } = await supabase
    .from('klubb_chat')
    .select('id', { count: 'exact', head: true })
    .gt('opprettet', sistSett)
    .neq('profil_id', brukerId)

  return (count ?? 0) > 0
}
