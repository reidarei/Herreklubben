// Agenda-sortering — all logikk for hvordan forsiden grupperer og sorterer
// arrangementer, utkast og bursdager. page.tsx skal kun hente rådata og
// rendre resultatet; ingen kategorisering eller mapping i selve ruten.
//
// Regelsett (i prioritert rekkefølge):
//   1. «I kveld»  = items hvis sortIso faller på samme norske dag som naa
//   2. «Kommende» = alt annet som ikke er tidligere (sortert stigende på sortIso,
//                   utkast uten purredato faller til enden av lista)
//   3. «Tidligere» = faktiske arrangementer (ikke utkast, ikke bursdager) hvis
//                   start_tidspunkt ligger før nå *og* ikke samme norske dag
//                   (sortert synkende — nyeste øverst)
//
// sortIso-bygging per type:
//   - arrangement : start_tidspunkt (UTC ISO fra DB)
//   - bursdag     : {dato}T12:00:00.000Z (midt på dagen UTC for å unngå
//                   tidssone-drift mellom Oslo og UTC)
//   - utkast      : purredato + T12:00:00Z hvis purredato finnes og *ikke*
//                   er passert. Hvis purredato er passert eller mangler,
//                   faller vi tilbake til 1. september i `aar` som siste
//                   påminnelse før året er omme. Hvis 1. september også
//                   er passert → null (enden av lista).
//
// «Samme norske dag»-sjekk gjøres eksplisitt via Intl.DateTimeFormat med
// Europe/Oslo for å håndtere at et arrangement klokka 00:30 UTC fortsatt
// tilhører «i kveld» norsk tid hvis det er samme dato etter konvertering.

import type { HighlightKortData } from '@/components/agenda/HighlightKort'
import type { ArrangementKortData } from '@/components/agenda/ArrangementKort'
import type { UtkastData } from '@/components/agenda/UtkastKort'
import type { BursdagData } from '@/components/agenda/BursdagKort'

// === Rådata-typer (speiler Supabase-queryene i forsiden) ==========

export type PaameldingRaad = {
  profil_id: string
  status: string
  profiles: { visningsnavn: string | null; bilde_url: string | null } | null
}

export type ArrangementRaad = {
  id: string
  type: string
  tittel: string
  start_tidspunkt: string
  oppmoetested: string | null
  bilde_url: string | null
  paameldinger: PaameldingRaad[]
}

export type UtkastRaad = {
  arrangement_navn: string
  purredato: string | null
  profiles: { visningsnavn: string | null } | null
}

export type ProfilMedBursdag = {
  id: string
  visningsnavn: string | null
  fodselsdato: string | null
  bilde_url?: string | null
}

// === Resultat-typer ===============================================

// Et item på agendaen. Hver variant har egen UI-data + felles sortIso.
// Tag-feltet `kind` lar forsiden velge riktig kort-komponent uten å gjette.
// Merk: arr-items i «I kveld» rendres som HighlightKort; i «Kommende» som
// ArrangementKort. Vi tagger dem forskjellig så forsiden ikke må duplisere
// beslutningen.
export type AgendaItem =
  | { kind: 'highlight'; sortIso: string; data: HighlightKortData }
  | { kind: 'arrangement'; sortIso: string; data: ArrangementKortData }
  | { kind: 'utkast'; sortIso: string | null; data: UtkastData }
  | { kind: 'bursdag'; sortIso: string; data: BursdagData }

export type Agenda = {
  idag: AgendaItem[]
  kommende: AgendaItem[]
  tidligere: ArrangementKortData[]
}

// === Helpers (eksportert for test og gjenbruk) ====================

// Returnerer true hvis ISO-tidspunktet faller på samme kalenderdag som
// `referanse`, tolket i Europe/Oslo. Brukes til å plassere arrangementer
// i «I kveld» selv om UTC-tidspunktet krysser midnatt.
export function erSammeNorskeDag(iso: string, referanse: Date): boolean {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value
  return (
    get('year') === String(referanse.getFullYear()) &&
    get('month') === String(referanse.getMonth() + 1).padStart(2, '0') &&
    get('day') === String(referanse.getDate()).padStart(2, '0')
  )
}

// Mapper et ArrangementRaad til HighlightKortData — brukes for «I kveld»-
// seksjonen som viser stor hero-stil med forhåndsvisning av ja-deltakere.
export function tilHighlight(arr: ArrangementRaad, meg: string): HighlightKortData {
  const jaListe = arr.paameldinger.filter(p => p.status === 'ja')
  const min = arr.paameldinger.find(p => p.profil_id === meg)
  return {
    id: arr.id,
    type: arr.type,
    tittel: arr.tittel,
    start_tidspunkt: arr.start_tidspunkt,
    oppmoetested: arr.oppmoetested,
    bilde_url: arr.bilde_url,
    antallJa: jaListe.length,
    deltakereForhand: jaListe
      .map(p => ({
        navn: p.profiles?.visningsnavn ?? '',
        src: p.profiles?.bilde_url ?? null,
      }))
      .filter(d => d.navn)
      .slice(0, 3),
    minStatus: (min?.status as 'ja' | 'kanskje' | 'nei' | undefined) ?? null,
  }
}

// Mapper et ArrangementRaad til ArrangementKortData — kompakt kort brukt i
// «Kommende» og «Tidligere». Ingen deltaker-forhåndsvisning, bare antall ja.
export function tilKort(arr: ArrangementRaad, meg: string): ArrangementKortData {
  const jaListe = arr.paameldinger.filter(p => p.status === 'ja')
  const min = arr.paameldinger.find(p => p.profil_id === meg)
  return {
    id: arr.id,
    type: arr.type,
    tittel: arr.tittel,
    start_tidspunkt: arr.start_tidspunkt,
    oppmoetested: arr.oppmoetested,
    bilde_url: arr.bilde_url,
    antallJa: jaListe.length,
    minStatus: (min?.status as 'ja' | 'kanskje' | 'nei' | undefined) ?? null,
  }
}

// Beregner kommende bursdager i et vindu fra `naa` til `naa + dagerFremover`.
// Går gjennom inneværende og neste kalenderår — dekker nyttårsovergang der
// en bursdag i januar skal dukke opp når vi står i desember.
// Profiler uten fødselsdato eller visningsnavn droppes.
export function beregnBursdager(
  profiler: ProfilMedBursdag[],
  naa: Date,
  dagerFremover: number,
): BursdagData[] {
  const items: BursdagData[] = []
  const slutt = new Date(naa.getFullYear(), naa.getMonth(), naa.getDate() + dagerFremover)
  for (const p of profiler) {
    if (!p.fodselsdato || !p.visningsnavn) continue
    const [fodselsaar, mnd, dag] = p.fodselsdato.split('-').map(Number)
    for (const aar of [naa.getFullYear(), naa.getFullYear() + 1]) {
      const bdag = new Date(aar, mnd - 1, dag)
      if (bdag >= naa && bdag <= slutt) {
        items.push({
          id: `bursdag-${p.id}-${aar}`,
          profilId: p.id,
          navn: p.visningsnavn,
          dato: `${aar}-${String(mnd).padStart(2, '0')}-${String(dag).padStart(2, '0')}`,
          alder: aar - fodselsaar,
          bildeUrl: p.bilde_url ?? null,
        })
      }
    }
  }
  return items
}

// Grupperer arrangoransvar-rader (uten arrangement_id) til utkast per
// `arrangement_navn`. Alle ansvarlige for arrangementet vises på utkastet
// i samme rekkefølge som de ligger i databasen.
function bygUtkast(
  ansvar: UtkastRaad[],
  aar: number,
): (UtkastData & { purredato: string | null })[] {
  const gruppering = new Map<string, { ansvarlige: string[]; purredato: string | null }>()
  for (const rad of ansvar) {
    if (!gruppering.has(rad.arrangement_navn)) {
      gruppering.set(rad.arrangement_navn, { ansvarlige: [], purredato: rad.purredato })
    }
    const navn = rad.profiles?.visningsnavn
    if (navn) gruppering.get(rad.arrangement_navn)!.ansvarlige.push(navn)
  }
  return [...gruppering.entries()].map(([tittel, { ansvarlige, purredato }]) => ({
    id: `utkast-${aar}-${tittel}`,
    tittel,
    ansvarlige,
    purredato,
  }))
}

// === Hovedfunksjon ================================================

// Bygger den komplette agendaen fra rådata. All kategorisering og sortering
// skjer her; forsiden rendrer kun resultatet. `naa` passes inn slik at
// «i dag»-bestemmelsen kan styres eksplisitt (og testes).
export function byggAgenda(input: {
  arrangementer: ArrangementRaad[]
  ansvar: UtkastRaad[]
  profilerMedBursdag: ProfilMedBursdag[]
  meg: string
  naa: Date
  aar: number
  bursdagsvinduDager?: number
}): Agenda {
  const { arrangementer, ansvar, profilerMedBursdag, meg, naa, aar } = input
  const bursdagsvinduDager = input.bursdagsvinduDager ?? 365
  const nowIso = new Date().toISOString()

  // Regel 3: Tidligere = ekte arrangementer som både ligger før nå i UTC
  // *og* ikke faller på samme norske dag som naa. Den andre betingelsen
  // hindrer at et arrangement klokka 17:00 norsk tid havner under «Tidligere»
  // senere samme kveld.
  const tidligere: ArrangementKortData[] = arrangementer
    .filter(a => !erSammeNorskeDag(a.start_tidspunkt, naa) && a.start_tidspunkt < nowIso)
    .sort((a, b) => b.start_tidspunkt.localeCompare(a.start_tidspunkt))
    .map(a => tilKort(a, meg))

  // Bursdager innen standardvinduet (default 365 dager fremover).
  const bursdager = beregnBursdager(profilerMedBursdag, naa, bursdagsvinduDager)

  // Utkast fra arrangoransvar. Disse har eget id-format `utkast-{aar}-{tittel}`
  // slik at React-keyene ikke kolliderer med arrangement-ids.
  const utkast = bygUtkast(ansvar, aar)

  // Samlet kandidat-liste for «I kveld» + «Kommende». Arrangementer tas kun
  // med hvis de enten er i fremtiden eller samme norske dag (dekker kveld
  // som begynner før midnatt UTC men går over i neste UTC-dag).
  const arrItems: AgendaItem[] = arrangementer
    .filter(a => a.start_tidspunkt >= nowIso || erSammeNorskeDag(a.start_tidspunkt, naa))
    .map(a => {
      const erIdag = erSammeNorskeDag(a.start_tidspunkt, naa)
      // I kveld → highlight-variant, ellers kompakt kort
      return erIdag
        ? { kind: 'highlight', sortIso: a.start_tidspunkt, data: tilHighlight(a, meg) }
        : { kind: 'arrangement', sortIso: a.start_tidspunkt, data: tilKort(a, meg) }
    })

  // Bursdager: sortIso = midt på dagen UTC. Dette plasserer dem tryggt
  // på riktig kalenderdag uansett hvordan localeCompare tolker sonene.
  const bursdagItems: AgendaItem[] = bursdager.map(b => ({
    kind: 'bursdag',
    sortIso: `${b.dato}T12:00:00.000Z`,
    data: b,
  }))

  // Utkast: purredato styrer plassering. Hvis purredato er passert eller
  // mangler, bruker vi 1. september i `aar` som fallback-påminnelse slik at
  // kortet ikke forsvinner til bunnen midt i året. Er også 1. september
  // passert → sortIso=null, og kortet faller til enden av «Kommende».
  const fallbackIso = `${aar}-09-01T12:00:00.000Z`
  const fallbackGyldig = fallbackIso >= nowIso || erSammeNorskeDag(fallbackIso, naa)
  const utkastItems: AgendaItem[] = utkast.map(u => {
    const opprinnelig = u.purredato ? `${u.purredato}T12:00:00.000Z` : null
    const opprinneligGyldig =
      opprinnelig && (opprinnelig >= nowIso || erSammeNorskeDag(opprinnelig, naa))
    const sortIso = opprinneligGyldig ? opprinnelig : fallbackGyldig ? fallbackIso : null
    return {
      kind: 'utkast',
      sortIso,
      data: { id: u.id, tittel: u.tittel, ansvarlige: u.ansvarlige },
    }
  })

  const alleItems: AgendaItem[] = [...arrItems, ...bursdagItems, ...utkastItems]

  // Regel 1: I kveld = items med sortIso som ligger på samme norske dag.
  const idag = alleItems.filter(i => i.sortIso && erSammeNorskeDag(i.sortIso, naa))

  // Regel 2: Kommende = resten, sortert stigende. Items uten sortIso (utkast
  // uten gyldig purredato) sorteres til enden via null-dytt-regelen.
  const kommende = alleItems
    .filter(i => !(i.sortIso && erSammeNorskeDag(i.sortIso, naa)))
    .sort((a, b) => {
      if (!a.sortIso) return 1
      if (!b.sortIso) return -1
      return a.sortIso.localeCompare(b.sortIso)
    })

  return { idag, kommende, tidligere }
}
