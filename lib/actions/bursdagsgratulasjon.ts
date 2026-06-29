// Automatisk bursdagsgratulasjon i klubb-chat. Se #328.
//
// Logikken sender én post per bursdagsbarn per år. Idempotens-sikringen
// bruker kilde_ekstern_id-kolonnens partial unique-indeks i klubb_chat
// (migrasjon 066) — format «bursdag:{profilId}:{år}». Om cron-jobben
// kjøres 4 ganger mellom kl. 07 og 10, garanterer slot-logikken at
// posten sendes seinest ved siste slot uten å doble meldinga.

import { formatInTimeZone } from 'date-fns-tz'
import { TIDSSONE } from '@/lib/dato'
import {
  BURSDAG_EMOJI_POOL,
  BURSDAG_EMOJI_ANTALL,
  BURSDAG_HILSNER,
  BURSDAG_UTROPSTEGN,
} from '@/lib/konstanter'
import { KLUBB_BURSDAGS_AVSENDER_PROFIL_ID } from '@/lib/klubb-config'
import { sendChatMentionVarsler } from '@/lib/varsler'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Admin = SupabaseClient<Database>

// Trekker 5 unike emoji frå poolen via Fisher-Yates-shuffle (subset-variant).
// Bruker Math.random() — kryptografisk tilfeldighet er ikke et krav her.
function trekkEmoji(antall: number): string[] {
  const pool = [...BURSDAG_EMOJI_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, antall)
}

export async function kjorBursdagsgratulasjon(
  admin: Admin,
  { slotIndex, totalSlots }: { slotIndex: number; totalSlots: number },
): Promise<{ sendt: number; hoppet: number; feil: number }> {
  let sendt = 0
  let hoppet = 0
  let feil = 0

  // 1. Sjekk om innstillingen er aktiv
  const { data: innstilling } = await admin
    .from('varsel_innstillinger')
    .select('aktiv')
    .eq('noekkel', 'bursdagsgratulasjon')
    .single()

  if (!innstilling?.aktiv) {
    return { sendt, hoppet, feil }
  }

  // 2. Finn dagens dato som MM-DD i norsk tid
  const idag = new Date()
  const dagStr = formatInTimeZone(idag, TIDSSONE, 'MM-dd')
  const aarStr = formatInTimeZone(idag, TIDSSONE, 'yyyy')

  // 3. Hent aktive profiler med fødselsdato
  const { data: profiler } = await admin
    .from('profiles')
    .select('id, navn, visningsnavn, fodselsdato')
    .eq('aktiv', true)
    .not('fodselsdato', 'is', null)

  if (!profiler || profiler.length === 0) {
    return { sendt, hoppet, feil }
  }

  // Filtrer i JS på MM-DD. Skuddårsfødte (29.02) i ikke-skuddår
  // gratuleres 01.03 — enklest å detektere ved at vi matcher 03-01
  // og i tillegg sjekker om fødselsdatoen var 29. feb.
  const erSkuddaar = (aar: number) =>
    (aar % 4 === 0 && aar % 100 !== 0) || aar % 400 === 0

  const bursdagsbarn = profiler.filter(p => {
    if (!p.fodselsdato) return false
    const fdato = p.fodselsdato as string // 'YYYY-MM-DD'
    const [, mm, dd] = fdato.split('-')
    const fodselsMmDd = `${mm}-${dd}`

    if (fodselsMmDd === dagStr) return true

    // 29. feb-barn i ikke-skuddår → post 01. mars
    if (
      fodselsMmDd === '02-29' &&
      dagStr === '03-01' &&
      !erSkuddaar(Number(aarStr))
    ) {
      return true
    }

    return false
  })

  if (bursdagsbarn.length === 0) {
    return { sendt, hoppet, feil }
  }

  // 4. Hent avsender-profil
  let avsenderId: string | null = KLUBB_BURSDAGS_AVSENDER_PROFIL_ID

  if (!avsenderId) {
    // Velg første aktive admin alfabetisk etter etternavn (siste ord i navn)
    const { data: adminProfiler } = await admin
      .from('profiles')
      .select('id, navn')
      .eq('aktiv', true)
      .eq('rolle', 'admin')
      .order('navn', { ascending: true })

    if (!adminProfiler || adminProfiler.length === 0) {
      // Fallback: prøv generalsekretær
      const { data: gsProfiler } = await admin
        .from('profiles')
        .select('id, navn')
        .eq('aktiv', true)
        .eq('rolle', 'generalsekretaer')
        .order('navn', { ascending: true })

      avsenderId = gsProfiler?.[0]?.id ?? null
    } else {
      // Sorter etter etternavn (siste ord), ta første
      const sortert = [...adminProfiler].sort((a, b) => {
        const etternavnA = a.navn.trim().split(/\s+/).pop() ?? a.navn
        const etternavnB = b.navn.trim().split(/\s+/).pop() ?? b.navn
        return etternavnA.localeCompare(etternavnB, 'nb')
      })
      avsenderId = sortert[0].id
    }
  }

  if (!avsenderId) {
    console.error('[bursdagsgratulasjon] Fant ingen avsender-profil')
    return { sendt, hoppet, feil: feil + 1 }
  }

  // 5. Behandle hvert bursdagsbarn
  for (const barn of bursdagsbarn) {
    const kilde = `bursdag:${barn.id}:${aarStr}`

    // Idempotens-sjekk: allerede postet i år?
    const { data: eksisterende } = await admin
      .from('klubb_chat')
      .select('id')
      .eq('kilde_ekstern_id', kilde)
      .single()

    if (eksisterende) {
      hoppet++
      continue
    }

    // Slot-sannsynlighet: garanterer sending seinest ved siste slot.
    // Formel: P = 1 / (totalSlots - slotIndex). Siste slot → alltid send.
    // Eks. ved 4 slots: slot 0 → 25 %, slot 1 → 33 %, slot 2 → 50 %, slot 3 → 100 %.
    const skalSende =
      slotIndex === totalSlots - 1 ||
      Math.random() < 1 / (totalSlots - slotIndex)

    if (!skalSende) {
      // Utsett til neste slot — men logg ikke som hoppet (ingen feil)
      continue
    }

    // Bygg melding. Bruker visningsnavn som fornavn-kilde, ellers splitter
    // vi på første token fra navn-feltet.
    const fornavn =
      (barn.visningsnavn ?? barn.navn).trim().split(/\s+/)[0]

    const emojis = trekkEmoji(BURSDAG_EMOJI_ANTALL)
    // Plukker tilfeldig hilsen-ord og utropstegn — gir 4 mulige mønstre per post.
    const hilsen = BURSDAG_HILSNER[Math.floor(Math.random() * BURSDAG_HILSNER.length)]
    const utropstegn = BURSDAG_UTROPSTEGN[Math.floor(Math.random() * BURSDAG_UTROPSTEGN.length)]
    const tekst = `${hilsen} med dagen @${fornavn}${utropstegn} ${emojis.join(' ')}`

    try {
      const { error: insertErr } = await admin.from('klubb_chat').insert({
        profil_id: avsenderId,
        tekst,
        kilde_ekstern_id: kilde,
      })

      if (insertErr) {
        // Unique-constraint-brudd = allerede postet (race condition mellom
        // sjekk og insert). Behandles som hoppet, ikke feil.
        if (insertErr.code === '23505') {
          hoppet++
          continue
        }
        console.error('[bursdagsgratulasjon] Insert-feil:', insertErr.message)
        feil++
        continue
      }

      // Send mention-varsel til bursdagsbarnet via eksisterende mention-handler
      await sendChatMentionVarsler({ type: 'klubb' }, tekst, avsenderId)

      sendt++
    } catch (e) {
      console.error('[bursdagsgratulasjon] Uventet feil:', e)
      feil++
    }
  }

  return { sendt, hoppet, feil }
}
