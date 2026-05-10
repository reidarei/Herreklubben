import {
  sendKaaringspollVinnerVarsel,
  sendKaaringspollTiebreakVarsel,
  sendKaaringspollIngenStemmerVarsel,
} from '@/lib/varsler'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Admin = SupabaseClient<Database>

// Sentral mapping fra RPC-status til riktig varsel-funksjon. Brukes av
// både cron (paaminnelser.ts) og manuell lukk-flyt (kaaringspoll.ts) så
// vi ikke duplikerer if/else-grenene to steder.
//
// `admin` er med i signaturen i tilfelle vi senere trenger DB-oppslag her.
// Per nå er den ubrukt — la stå for å holde signaturen stabil mellom
// kall-stedene.
export async function behandleKaaringspollAvsluttResultat({
  admin,
  pollId,
  spoersmaal,
  status,
  tiebreakIder,
  adminIder,
}: {
  admin: Admin
  pollId: string
  spoersmaal: string
  status: string
  tiebreakIder: string[]
  adminIder: string[]
}): Promise<{ sendt: boolean }> {
  void admin // reservert for evt. fremtidig bruk

  if (status === 'avgjort') {
    await sendKaaringspollVinnerVarsel({ pollId, spoersmaal })
    return { sendt: true }
  }
  if (status === 'venter_paa_tiebreak') {
    if (tiebreakIder.length === 0) return { sendt: false }
    await sendKaaringspollTiebreakVarsel({
      pollId,
      spoersmaal,
      mottakere: tiebreakIder,
    })
    return { sendt: true }
  }
  if (status === 'ingen_stemmer') {
    if (adminIder.length === 0) return { sendt: false }
    await sendKaaringspollIngenStemmerVarsel({
      pollId,
      spoersmaal,
      mottakere: adminIder,
    })
    return { sendt: true }
  }
  return { sendt: false }
}
