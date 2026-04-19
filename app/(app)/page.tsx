import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { formaterDato, norskAar, norskDatoNaa } from '@/lib/dato'
import { subMonths } from 'date-fns'
import Icon from '@/components/ui/Icon'
import SectionLabel from '@/components/ui/SectionLabel'
import PushPaaminnelse from './PushPaaminnelse'
import HighlightKort, { type HighlightKortData } from '@/components/agenda/HighlightKort'
import ArrangementKort, { type ArrangementKortData } from '@/components/agenda/ArrangementKort'
import UtkastKort, { type UtkastData } from '@/components/agenda/UtkastKort'
import BursdagKort, { type BursdagData } from '@/components/agenda/BursdagKort'
import InnspillKnapp from '@/components/agenda/InnspillKnapp'

type PaameldingRad = {
  profil_id: string
  status: string
  profiles: { visningsnavn: string | null } | null
}

type ArrangementRad = {
  id: string
  type: string
  tittel: string
  start_tidspunkt: string
  oppmoetested: string | null
  bilde_url: string | null
  paameldinger: PaameldingRad[]
}

function erSammeNorskeDag(iso: string, referanse: Date): boolean {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value
  const ref = referanse
  return (
    get('year') === String(ref.getFullYear()) &&
    get('month') === String(ref.getMonth() + 1).padStart(2, '0') &&
    get('day') === String(ref.getDate()).padStart(2, '0')
  )
}

function tilHighlight(arr: ArrangementRad, meg: string): HighlightKortData {
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
      .map(p => ({ navn: p.profiles?.visningsnavn ?? '' }))
      .filter(d => d.navn)
      .slice(0, 3),
    minStatus: (min?.status as 'ja' | 'kanskje' | 'nei' | undefined) ?? null,
  }
}

function tilKort(arr: ArrangementRad, meg: string): ArrangementKortData {
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

function beregnBursdager(
  profiler: { id: string; visningsnavn: string | null; fodselsdato: string | null }[],
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
        })
      }
    }
  }
  return items
}

export default async function Forside() {
  const [user, supabase] = await Promise.all([getInnloggetBruker(), createServerClient()])

  const naa = norskDatoNaa()
  const treMndSiden = subMonths(new Date(), 3)
  const aar = norskAar()

  const [
    { data: arrangementer },
    { count: aktiveMedlemmer },
    { data: profilerMedBursdag },
    { data: ansvar },
    { count: pushCount },
    { data: varselPref },
  ] = await Promise.all([
    supabase
      .from('arrangementer')
      .select(
        `id, type, tittel, start_tidspunkt, oppmoetested, bilde_url,
         paameldinger (profil_id, status, profiles (visningsnavn))`,
      )
      .gte('start_tidspunkt', treMndSiden.toISOString())
      .order('start_tidspunkt', { ascending: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('aktiv', true),
    supabase
      .from('profiles')
      .select('id, visningsnavn, fodselsdato')
      .eq('aktiv', true)
      .not('fodselsdato', 'is', null),
    supabase
      .from('arrangoransvar')
      .select('arrangement_navn, purredato, profiles (visningsnavn)')
      .eq('aar', aar)
      .is('arrangement_id', null),
    supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('profil_id', user!.id),
    supabase
      .from('varsel_preferanser')
      .select('push_aktiv')
      .eq('profil_id', user!.id)
      .maybeSingle(),
  ])

  const alleArr: ArrangementRad[] = (arrangementer ?? []) as unknown as ArrangementRad[]
  const nowIso = new Date().toISOString()

  // Tidligere arrangementer — uendret, bare faktiske arrangementer som har passert
  const tidligere = alleArr
    .filter(a => !erSammeNorskeDag(a.start_tidspunkt, naa) && a.start_tidspunkt < nowIso)
    .sort((a, b) => b.start_tidspunkt.localeCompare(a.start_tidspunkt))

  // Utkast: arrangør-ansvar uten arrangement_id, gruppert på navn
  type UtkastRad = {
    arrangement_navn: string
    purredato: string | null
    profiles: { visningsnavn: string | null } | null
  }
  const utkastMap = new Map<string, { ansvarlige: string[]; purredato: string | null }>()
  for (const rad of (ansvar ?? []) as UtkastRad[]) {
    if (!utkastMap.has(rad.arrangement_navn)) {
      utkastMap.set(rad.arrangement_navn, { ansvarlige: [], purredato: rad.purredato })
    }
    const navn = rad.profiles?.visningsnavn
    if (navn) utkastMap.get(rad.arrangement_navn)!.ansvarlige.push(navn)
  }
  const utkast: (UtkastData & { purredato: string | null })[] = [...utkastMap.entries()].map(
    ([tittel, { ansvarlige, purredato }]) => ({
      id: `utkast-${aar}-${tittel}`,
      tittel,
      ansvarlig: ansvarlige[0] ?? null,
      purredato,
    }),
  )

  const bursdager = beregnBursdager(profilerMedBursdag ?? [], naa, 365)

  // Samlet tidslinje med én sorteringsnøkkel per item
  type AgendaItem =
    | { kind: 'arr'; sortIso: string; arr: ArrangementRad }
    | { kind: 'utkast'; sortIso: string | null; utkast: UtkastData & { purredato: string | null } }
    | { kind: 'bursdag'; sortIso: string; bursdag: BursdagData }

  const alleItems: AgendaItem[] = [
    ...alleArr
      .filter(a => a.start_tidspunkt >= nowIso || erSammeNorskeDag(a.start_tidspunkt, naa))
      .map<AgendaItem>(a => ({ kind: 'arr', sortIso: a.start_tidspunkt, arr: a })),
    ...bursdager.map<AgendaItem>(b => ({
      kind: 'bursdag',
      sortIso: `${b.dato}T12:00:00.000Z`,
      bursdag: b,
    })),
    ...utkast.map<AgendaItem>(u => {
      // Forbi purredato → null (faller til enden av lista, ikke til topps)
      const iso = u.purredato ? `${u.purredato}T12:00:00.000Z` : null
      const gyldig = iso && (iso >= nowIso || erSammeNorskeDag(iso, naa))
      return { kind: 'utkast', sortIso: gyldig ? iso : null, utkast: u }
    }),
  ]

  const idagItems = alleItems.filter(i => i.sortIso && erSammeNorskeDag(i.sortIso, naa))
  const kommendeItems = alleItems
    .filter(i => !(i.sortIso && erSammeNorskeDag(i.sortIso, naa)))
    .sort((a, b) => {
      if (!a.sortIso) return 1
      if (!b.sortIso) return -1
      return a.sortIso.localeCompare(b.sortIso)
    })

  const antallGutta = aktiveMedlemmer ?? 0

  const meg = user!.id

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: 12,
          marginBottom: 26,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Siden 2015 · {antallGutta} herrer
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: '-0.5px',
              lineHeight: 1,
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            Agenda
          </h1>
        </div>

        <Link
          href="/arrangementer/ny"
          aria-label="Nytt arrangement"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '0.5px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Icon name="plus" size={20} color="var(--accent)" strokeWidth={1.8} />
        </Link>
      </header>

      {pushCount === 0 && <PushPaaminnelse pushAktiv={varselPref?.push_aktiv ?? false} />}

      {/* I kveld */}
      {idagItems.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>
            I kveld · {formaterDato(idagItems[0].sortIso!, 'd. MMMM').toLowerCase()}
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {idagItems.map(i => {
              if (i.kind === 'arr') return <HighlightKort key={i.arr.id} arr={tilHighlight(i.arr, meg)} />
              if (i.kind === 'bursdag') return <BursdagKort key={i.bursdag.id} bursdag={i.bursdag} />
              return <UtkastKort key={i.utkast.id} utkast={i.utkast} />
            })}
          </div>
        </section>
      )}

      {/* Kommende */}
      <section style={{ marginBottom: 20 }}>
        <SectionLabel>Kommende</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {kommendeItems.map(i => {
            if (i.kind === 'arr') return <ArrangementKort key={i.arr.id} arr={tilKort(i.arr, meg)} />
            if (i.kind === 'bursdag') return <BursdagKort key={i.bursdag.id} bursdag={i.bursdag} />
            return <UtkastKort key={i.utkast.id} utkast={i.utkast} />
          })}
          {kommendeItems.length === 0 && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.5px',
                margin: '8px 0',
              }}
            >
              Ingen planlagte sammenkomster.
            </p>
          )}
        </div>
      </section>

      {/* Innspill */}
      <InnspillKnapp />

      {/* Tidligere */}
      {tidligere.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Tidligere</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tidligere.map(a => (
              <ArrangementKort key={a.id} arr={tilKort(a, meg)} tidligere />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
