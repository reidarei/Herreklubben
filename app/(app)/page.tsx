import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { formaterDato, norskAar, norskDatoNaa } from '@/lib/dato'
import { subMonths } from 'date-fns'
import SectionLabel from '@/components/ui/SectionLabel'
import PushPaaminnelse from './PushPaaminnelse'
import HighlightKort from '@/components/agenda/HighlightKort'
import ArrangementKort from '@/components/agenda/ArrangementKort'
import UtkastKort from '@/components/agenda/UtkastKort'
import BursdagKort from '@/components/agenda/BursdagKort'
import KlubbJubileumKort from '@/components/agenda/KlubbJubileumKort'
import InnspillKnapp from '@/components/agenda/InnspillKnapp'
import PollKort from '@/components/agenda/PollKort'
import MeldingKort from '@/components/agenda/MeldingKort'
import NyFAB from '@/components/agenda/NyFAB'
import type { KommentarKortData } from '@/components/agenda/KommentarerPaaKort'
import {
  byggAgenda,
  type ArrangementRaad,
  type UtkastRaad,
  type ProfilMedBursdag,
  type PollRaad,
  type MeldingRaad,
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
    { data: meldingerRaad },
    { data: meldingReaksjoner },
    { data: meldingKommentarer },
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
    // Henter siste 30 per tabell innenfor samme 3-mnd-vindu som arrangementer,
    // og grupperer i app-laget. 30 rader dekker ~10 arrangementer med 3
    // kommentarer hver — godt nok for det som er synlig på agenda.
    // Tidligere hadde vi limit(100) som lastet unødvendig mye data og dro
    // TTFB på agenda til rundt 2 sek.
    supabase
      .from('arrangement_chat')
      .select(
        `id, innhold, opprettet, arrangement_id,
         profiles (navn, bilde_url, rolle)`,
      )
      .gte('opprettet', treMndSiden.toISOString())
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase
      .from('poll_chat')
      .select(
        `id, innhold, opprettet, poll_id,
         profiles (navn, bilde_url, rolle)`,
      )
      .gte('opprettet', treMndSiden.toISOString())
      .order('opprettet', { ascending: false })
      .limit(30),
    // Meldinger (#90, fjerde element-type). Vi henter relativt åpent (60)
    // for å fange både levende og de som er falt ned i Tidligere.
    // FK-navn må spesifiseres på profiles-embed siden melding_reaksjon
    // og melding_chat også har FK til profiles — uten det får vi
    // «more than one relationship» fra PostgREST.
    supabase
      .from('meldinger')
      .select(
        'id, innhold, opprettet, sist_aktivitet, profil_id, profiles!meldinger_profil_id_fkey (navn, bilde_url, rolle)',
      )
      .order('sist_aktivitet', { ascending: false })
      .limit(60),
    supabase
      .from('melding_reaksjon')
      .select('melding_id, profil_id, emoji'),
    supabase
      .from('melding_chat')
      .select(
        'id, innhold, opprettet, melding_id, profiles!melding_chat_profil_id_fkey (navn, bilde_url, rolle)',
      )
      .order('opprettet', { ascending: false })
      .limit(60),
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

  // === Meldinger: bygg MeldingRaad med reaksjoner og kommentar-antall =
  type RawMeldKomm = {
    id: string
    innhold: string
    opprettet: string
    melding_id: string
    profiles: { navn: string | null; bilde_url: string | null; rolle: string | null } | null
  }
  const kommentarerPerMelding = grupperKommentarer(
    (meldingKommentarer ?? []) as unknown as RawMeldKomm[],
    r => r.melding_id,
  )

  // Antall kommentarer er ikke nødvendigvis det samme som top-3 vi har
  // hentet — men 60 rader fordelt på sist_aktivitet dekker normalt antallet
  // på agenda. For nøyaktige tall ville vi trengt en separat count-query;
  // her aksepterer vi at antall = `min(faktisk antall, 60 / antall_meldinger)`.
  const antallKommPerMelding = new Map<string, number>()
  for (const k of (meldingKommentarer ?? []) as unknown as RawMeldKomm[]) {
    antallKommPerMelding.set(k.melding_id, (antallKommPerMelding.get(k.melding_id) ?? 0) + 1)
  }

  // Aggreger reaksjoner per melding+emoji
  type RawReaksjon = { melding_id: string; profil_id: string; emoji: string }
  const reaksjonerPerMelding = new Map<string, Map<string, string[]>>()
  for (const r of (meldingReaksjoner ?? []) as RawReaksjon[]) {
    const perEmoji = reaksjonerPerMelding.get(r.melding_id) ?? new Map<string, string[]>()
    const profilIder = perEmoji.get(r.emoji) ?? []
    profilIder.push(r.profil_id)
    perEmoji.set(r.emoji, profilIder)
    reaksjonerPerMelding.set(r.melding_id, perEmoji)
  }

  type RawMelding = {
    id: string
    innhold: string
    opprettet: string
    sist_aktivitet: string
    profil_id: string
    profiles: { navn: string | null; bilde_url: string | null; rolle: string | null } | null
  }

  const meldingerForAgenda: MeldingRaad[] = (meldingerRaad ?? []).map((m: RawMelding) => {
    const reaksjonMap = reaksjonerPerMelding.get(m.id) ?? new Map()
    const reaksjoner = [...reaksjonMap.entries()].map(([emoji, profilIder]) => ({
      emoji,
      profilIder,
    }))
    return {
      id: m.id,
      innhold: m.innhold,
      opprettet: m.opprettet,
      sist_aktivitet: m.sist_aktivitet,
      forfatter: {
        id: m.profil_id,
        navn: m.profiles?.navn ?? 'Ukjent',
        bilde_url: m.profiles?.bilde_url ?? null,
        rolle: m.profiles?.rolle ?? null,
      },
      reaksjoner,
      antallKommentarer: antallKommPerMelding.get(m.id) ?? 0,
    }
  })

  const { meldinger, idag, kommende, tidligere } = byggAgenda({
    arrangementer: (arrangementer ?? []) as unknown as ArrangementRaad[],
    ansvar: (ansvar ?? []) as unknown as UtkastRaad[],
    profilerMedBursdag: (profilerMedBursdag ?? []) as ProfilMedBursdag[],
    poller,
    meldinger: meldingerForAgenda,
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

        <NyFAB />
      </header>

      <PushPaaminnelse />

      {/* Levende meldinger — fjerde element-type, øverst på agenda */}
      {meldinger.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Nytt fra gutta</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {meldinger.map(i => {
              if (i.kind !== 'melding') return null
              return (
                <MeldingKort
                  key={i.data.id}
                  melding={i.data}
                  brukerId={user!.id}
                  kommentarer={kommentarerPerMelding.get(i.data.id) ?? []}
                />
              )
            })}
          </div>
        </section>
      )}

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
              if (i.kind === 'arrangement')
                return <ArrangementKort key={i.data.id} arr={i.data} kommentarer={kommentarerPerArr.get(i.data.id) ?? []} />
              // Meldinger plasseres kun i toppseksjonen (eller Tidligere) — ikke her
              return null
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
            if (i.kind === 'highlight') return <HighlightKort key={i.data.id} arr={i.data} />
            // Meldinger plasseres kun i toppseksjonen eller Tidligere
            return null
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
        <SectionLabel>Lurer du på noe?</SectionLabel>
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
            {tidligere.map(t => {
              if (t.kind === 'arrangement')
                return <ArrangementKort key={t.data.id} arr={t.data} tidligere />
              if (t.kind === 'poll') return <PollKort key={t.data.id} poll={t.data} tidligere />
              return <MeldingKort key={t.data.id} melding={t.data} brukerId={user!.id} />
            })}
          </div>
        </section>
      )}
    </div>
  )
}
