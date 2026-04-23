import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { formaterDato, norskAar, norskDatoNaa } from '@/lib/dato'
import { subMonths } from 'date-fns'
import Icon from '@/components/ui/Icon'
import SectionLabel from '@/components/ui/SectionLabel'
import PushPaaminnelse from './PushPaaminnelse'
import HighlightKort from '@/components/agenda/HighlightKort'
import ArrangementKort from '@/components/agenda/ArrangementKort'
import UtkastKort from '@/components/agenda/UtkastKort'
import BursdagKort from '@/components/agenda/BursdagKort'
import KlubbJubileumKort from '@/components/agenda/KlubbJubileumKort'
import InnspillKnapp from '@/components/agenda/InnspillKnapp'
import PollKort from '@/components/agenda/PollKort'
import type { KommentarKortData } from '@/components/agenda/KommentarerPaaKort'
import {
  byggAgenda,
  type ArrangementRaad,
  type UtkastRaad,
  type ProfilMedBursdag,
  type PollRaad,
} from '@/lib/agenda-sortering'
import { subDays } from 'date-fns'

// Agenda-forsiden: henter rådata og delegerer all sortering/gruppering til
// lib/agenda-sortering.ts. Denne filen skal holdes tynn — kun fetch + render.
export default async function Forside() {
  const [user, supabase] = await Promise.all([getInnloggetBruker(), createServerClient()])

  const naa = norskDatoNaa()
  const treMndSiden = subMonths(new Date(), 3)
  const aar = norskAar()

  // Polls hentes med alle stemmer joinet — billig så lenge vi filtrerer
  // på nylige polls (svarfrist > nå - 30 dager). Stemme-aggregeringen
  // (antall unike + «har jeg stemt») gjøres i app-laget for å unngå
  // database-view/RPC.
  const pollVinduStart = subDays(new Date(), 30).toISOString()

  const [
    { data: arrangementer },
    { count: aktiveMedlemmer },
    { data: profilerMedBursdag },
    { data: ansvar },
    { data: pollerRaad },
    { data: arrKommentarer },
    { data: pollKommentarer },
  ] = await Promise.all([
    supabase
      .from('arrangementer')
      .select(
        `id, type, tittel, start_tidspunkt, oppmoetested, bilde_url,
         paameldinger (profil_id, status, profiles (visningsnavn, bilde_url, rolle))`,
      )
      .gte('start_tidspunkt', treMndSiden.toISOString())
      .order('start_tidspunkt', { ascending: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('aktiv', true),
    supabase
      .from('profiles')
      .select('id, visningsnavn, fodselsdato, bilde_url, rolle')
      .eq('aktiv', true)
      .not('fodselsdato', 'is', null),
    supabase
      .from('arrangoransvar')
      .select('arrangement_navn, purredato, ansvarlig_id, profiles (visningsnavn)')
      .eq('aar', aar)
      .is('arrangement_id', null),
    supabase
      .from('poll')
      .select(
        `id, spoersmaal, svarfrist, flervalg, opprettet_av,
         poll_valg (id, tekst, rekkefoelge),
         poll_stemme (profil_id, valg_id)`,
      )
      .gte('svarfrist', pollVinduStart)
      .order('svarfrist', { ascending: true }),
    // Siste kommentarer per arrangement og poll — vises inline på hvert kort.
    // Henter bredt (siste 100 per tabell) og grupperer i app-laget. For vår
    // skala er dette billig og unngår Postgres-window-functions.
    supabase
      .from('arrangement_chat')
      .select(
        `id, innhold, opprettet, arrangement_id,
         profiles (navn, bilde_url, rolle)`,
      )
      .order('opprettet', { ascending: false })
      .limit(100),
    supabase
      .from('poll_chat')
      .select(
        `id, innhold, opprettet, poll_id,
         profiles (navn, bilde_url, rolle)`,
      )
      .order('opprettet', { ascending: false })
      .limit(100),
  ])

  // Aggreger poll-stemmer: antall unike profiler + om innlogget bruker er
  // blant dem, + hvilke valg jeg har stemt på. Valgene sorteres etter
  // rekkefølge så inline-knappene rendres i opprettet rekkefølge.
  const poller: PollRaad[] = (pollerRaad ?? []).map(p => {
    const stemmer = (p.poll_stemme ?? []) as { profil_id: string; valg_id: string }[]
    const unike = new Set(stemmer.map(s => s.profil_id))
    const mine = stemmer.filter(s => s.profil_id === user!.id).map(s => s.valg_id)
    const valg = [...(p.poll_valg ?? [])]
      .sort((a, b) => a.rekkefoelge - b.rekkefoelge)
      .map(v => ({ id: v.id, tekst: v.tekst }))
    const stemmerPerValg: Record<string, number> = {}
    for (const s of stemmer) {
      stemmerPerValg[s.valg_id] = (stemmerPerValg[s.valg_id] ?? 0) + 1
    }
    return {
      id: p.id,
      spoersmaal: p.spoersmaal,
      svarfrist: p.svarfrist,
      flervalg: p.flervalg,
      opprettet_av: p.opprettet_av,
      antallStemmer: unike.size,
      harStemt: unike.has(user!.id),
      valg,
      mineStemmer: mine,
      stemmerPerValg,
    }
  })

  // Grupper kommentarer per arrangement/poll-id, ta top 3. Siden queryen
  // allerede er sortert synkende på opprettet, tar vi bare de første 3 per
  // gruppe — men reverserer rekkefølgen så eldste vises øverst (leser
  // kommentarene i kronologisk rekkefølge).
  type RawArrKomm = {
    id: string
    innhold: string
    opprettet: string
    arrangement_id: string
    profiles: { navn: string | null; bilde_url: string | null; rolle: string | null } | null
  }
  type RawPollKomm = {
    id: string
    innhold: string
    opprettet: string
    poll_id: string
    profiles: { navn: string | null; bilde_url: string | null; rolle: string | null } | null
  }

  function grupperKommentarer<T extends { id: string; innhold: string; opprettet: string; profiles: RawArrKomm['profiles'] }>(
    rader: T[],
    nokkel: (r: T) => string,
  ): Map<string, KommentarKortData[]> {
    const map = new Map<string, KommentarKortData[]>()
    for (const r of rader) {
      if (!r.profiles) continue
      const k = nokkel(r)
      const list = map.get(k) ?? []
      if (list.length >= 3) continue
      list.push({
        id: r.id,
        innhold: r.innhold,
        opprettet: r.opprettet,
        avsender: {
          navn: r.profiles.navn ?? 'Ukjent',
          bilde_url: r.profiles.bilde_url,
          rolle: r.profiles.rolle,
        },
      })
      map.set(k, list)
    }
    // Reverser så eldste vises øverst (kronologisk lesing)
    for (const [k, v] of map) map.set(k, v.reverse())
    return map
  }

  const kommentarerPerArr = grupperKommentarer(
    (arrKommentarer ?? []) as unknown as RawArrKomm[],
    r => r.arrangement_id,
  )
  const kommentarerPerPoll = grupperKommentarer(
    (pollKommentarer ?? []) as unknown as RawPollKomm[],
    r => r.poll_id,
  )

  const { idag, kommende, tidligere } = byggAgenda({
    arrangementer: (arrangementer ?? []) as unknown as ArrangementRaad[],
    ansvar: (ansvar ?? []) as unknown as UtkastRaad[],
    profilerMedBursdag: (profilerMedBursdag ?? []) as ProfilMedBursdag[],
    poller,
    meg: user!.id,
    naa,
    aar,
  })

  const antallGutta = aktiveMedlemmer ?? 0

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
            Siden 2007 · {antallGutta} herrer
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

      <PushPaaminnelse />

      {/* I kveld */}
      {idag.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>
            I kveld · {formaterDato(idag[0].sortIso!, 'd. MMMM').toLowerCase()}
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {idag.map(i => {
              if (i.kind === 'highlight') return <HighlightKort key={i.data.id} arr={i.data} />
              if (i.kind === 'bursdag') return <BursdagKort key={i.data.id} bursdag={i.data} />
              if (i.kind === 'klubbjubileum') return <KlubbJubileumKort key={i.data.id} jubileum={i.data} />
              if (i.kind === 'utkast') return <UtkastKort key={i.data.id} utkast={i.data} meg={user!.id} />
              if (i.kind === 'poll')
                return <PollKort key={i.data.id} poll={i.data} kommentarer={kommentarerPerPoll.get(i.data.id) ?? []} />
              return <ArrangementKort key={i.data.id} arr={i.data} kommentarer={kommentarerPerArr.get(i.data.id) ?? []} />
            })}
          </div>
        </section>
      )}

      {/* Kommende */}
      <section style={{ marginBottom: 20 }}>
        <SectionLabel>Kommende</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {kommende.map(i => {
            if (i.kind === 'arrangement')
              return <ArrangementKort key={i.data.id} arr={i.data} kommentarer={kommentarerPerArr.get(i.data.id) ?? []} />
            if (i.kind === 'bursdag') return <BursdagKort key={i.data.id} bursdag={i.data} />
            if (i.kind === 'klubbjubileum') return <KlubbJubileumKort key={i.data.id} jubileum={i.data} />
            if (i.kind === 'utkast') return <UtkastKort key={i.data.id} utkast={i.data} meg={user!.id} />
            if (i.kind === 'poll')
              return <PollKort key={i.data.id} poll={i.data} kommentarer={kommentarerPerPoll.get(i.data.id) ?? []} />
            return <HighlightKort key={i.data.id} arr={i.data} />
          })}
          {kommende.length === 0 && (
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

      {/* Lag avstemming */}
      <section style={{ marginBottom: 28 }}>
        <SectionLabel>Lurer du på hva gutta mener?</SectionLabel>
        <Link
          href="/poll/ny"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 0',
            textAlign: 'center',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 999,
            color: 'var(--accent)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.2px',
            textDecoration: 'none',
          }}
        >
          Lag avstemming
        </Link>
      </section>

      {/* Innspill */}
      <InnspillKnapp />

      {/* Tidligere */}
      {tidligere.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Tidligere</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tidligere.map(t =>
              t.kind === 'arrangement'
                ? <ArrangementKort key={t.data.id} arr={t.data} tidligere />
                : <PollKort key={t.data.id} poll={t.data} tidligere />,
            )}
          </div>
        </section>
      )}
    </div>
  )
}
