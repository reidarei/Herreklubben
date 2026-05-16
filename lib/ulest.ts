import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Returnerer true hvis det finnes klubb_chat-meldinger fra andre enn brukeren
 * selv som er nyere enn `sistSett`. Brukes til ulest-prikken på Chat-tab i
 * TopHeader. Tar `sistSett` som parameter (typisk fra `getProfil()`) for å
 * spare en ekstra runde mot `profiles` — kallstedet har allerede lest raden.
 *
 * Bruker eksisterende indeks på `klubb_chat (opprettet desc)` (migrasjon 038).
 * Ingen ny indeks lagt til — ~17 brukere og lav volum gjør det unødvendig.
 */
export async function harUlestChat(
  supabase: SupabaseClient<Database>,
  brukerId: string,
  sistSett: string | null,
): Promise<boolean> {
  // Null = aldri åpnet chat → alt regnes som ulest (alle meldinger fra andre).
  const cutoff = sistSett ?? '1970-01-01T00:00:00Z'

  const { count } = await supabase
    .from('klubb_chat')
    .select('id', { count: 'exact', head: true })
    .gt('opprettet', cutoff)
    .neq('profil_id', brukerId)

  return (count ?? 0) > 0
}
