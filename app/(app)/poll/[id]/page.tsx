import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { kanAdministrere } from '@/lib/roller'
import { formaterDato } from '@/lib/dato'
import SectionLabel from '@/components/ui/SectionLabel'
import PollStemming from '@/components/poll/PollStemming'
import PollResultat from '@/components/poll/PollResultat'
import PollRealtime from '@/components/poll/PollRealtime'
import PollStemtVisning from '@/components/poll/PollStemtVisning'
import KaaringPollStemming, {
  type KaaringValg,
} from '@/components/poll/KaaringPollStemming'
import VinnerBanner from '@/components/poll/VinnerBanner'
import Chat from '@/components/chat/Chat'
import SlettPollKnapp from './SlettPollKnapp'

type ValgRad = {
  id: string
  tekst: string
  rekkefoelge: number
  referanse_profil_id: string | null
  referanse_arrangement_id: string | null
}

type PollRad = {
  id: string
  spoersmaal: string
  svarfrist: string
  flervalg: boolean
  opprettet_av: string
  kaaring_mal_id: string | null
  aar: number | null
  avsluttet_paa: string | null
  tiebreak_status: string | null
  arrangement_id: string | null
  poll_valg: ValgRad[]
  poll_stemme: { valg_id: string; profil_id: string }[]
}

export default async function PollDetalj({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  const [{ data: poll }, { data: chatMeldinger }, { data: chatProfiler }] = await Promise.all([
    supabase
      .from('poll')
      .select(
        `id, spoersmaal, svarfrist, flervalg, opprettet_av,
         kaaring_mal_id, aar, avsluttet_paa, tiebreak_status, arrangement_id,
         poll_valg (id, tekst, rekkefoelge, referanse_profil_id, referanse_arrangement_id),
         poll_stemme (valg_id, profil_id)`,
      )
      .eq('id', id)
      .single<PollRad>(),
    supabase
      .from('poll_chat')
      .select('id, profil_id, innhold, bilde_url, video_url, opprettet')
      .eq('poll_id', id)
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase
      .from('profiles')
      .select('id, navn, bilde_url, rolle')
      .eq('aktiv', true),
  ])

  if (!poll) notFound()

  const erAvsluttet = new Date(poll.svarfrist) <= new Date() || poll.avsluttet_paa !== null
  const erAdmin = kanAdministrere(profil?.rolle)
  const kanSlette = poll.opprettet_av === user!.id || erAdmin
  const erKaaring = poll.kaaring_mal_id !== null

  const valg = [...poll.poll_valg].sort((a, b) => a.rekkefoelge - b.rekkefoelge)

  const stemmerPerValg = new Map<string, number>()
  const unikeStemmere = new Set<string>()
  for (const s of poll.poll_stemme) {
    stemmerPerValg.set(s.valg_id, (stemmerPerValg.get(s.valg_id) ?? 0) + 1)
    unikeStemmere.add(s.profil_id)
  }
  const antallStemmere = unikeStemmere.size

  const mineStemmer = poll.poll_stemme
    .filter(s => s.profil_id === user!.id)
    .map(s => s.valg_id)

  const datoLang = formaterDato(poll.svarfrist, "d. MMMM 'kl.' HH:mm")

  // ─── Kåringspoll-rendering ─────────────────────────────────────────────
  if (erKaaring) {
    return (
      <KaaringVisning
        poll={poll}
        valg={valg}
        chatProfiler={chatProfiler ?? []}
        stemmerPerValg={stemmerPerValg}
        antallStemmere={antallStemmere}
        mineStemmer={mineStemmer}
        datoLang={datoLang}
        erAvsluttet={erAvsluttet}
        erAdmin={erAdmin}
        chatMeldinger={chatMeldinger ?? []}
        userId={user!.id}
        kanSlette={kanSlette}
      />
    )
  }

  // ─── Vanlig poll: uendret oppførsel ────────────────────────────────────
  return (
    <div style={{ padding: '0 20px 120px' }}>
      {!erAvsluttet && <PollRealtime pollId={poll.id} />}
      <header style={{ marginTop: 12, marginBottom: 22 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Avstemming · {poll.flervalg ? 'flervalg' : 'enkeltvalg'}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.4px',
            lineHeight: 1.15,
            margin: '0 0 10px',
            color: 'var(--text-primary)',
          }}
        >
          {poll.spoersmaal}
        </h1>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          {erAvsluttet ? `Avsluttet ${datoLang}` : `Svarfrist ${datoLang}`}
        </div>
      </header>

      {erAvsluttet ? (
        <section style={{ marginBottom: 24 }}>
          <SectionLabel count={antallStemmere}>Resultat</SectionLabel>
          <PollResultat
            valg={valg}
            stemmerPerValg={stemmerPerValg}
            antallStemmere={antallStemmere}
            mineStemmer={mineStemmer}
          />
        </section>
      ) : mineStemmer.length > 0 ? (
        <PollStemtVisning
          pollId={poll.id}
          flervalg={poll.flervalg}
          valg={valg}
          mineStemmer={mineStemmer}
          stemmerPerValg={Object.fromEntries(stemmerPerValg)}
          antallStemmere={antallStemmere}
        />
      ) : (
        <section style={{ marginBottom: 24 }}>
          <SectionLabel count={antallStemmere}>
            {poll.flervalg ? 'Velg ett eller flere' : 'Velg ett'}
          </SectionLabel>
          <PollStemming
            pollId={poll.id}
            flervalg={poll.flervalg}
            valg={valg}
            mineStemmer={mineStemmer}
          />
          <div style={{ marginTop: 28 }}>
            <SectionLabel>Foreløpig</SectionLabel>
            <PollResultat
              valg={valg}
              stemmerPerValg={stemmerPerValg}
              antallStemmere={antallStemmere}
              mineStemmer={mineStemmer}
            />
          </div>
        </section>
      )}

      <div id="kommentarer">
        <Chat
          scope={{ type: 'poll', pollId: poll.id }}
          brukerId={user!.id}
          erAdmin={erAdmin}
          initialMeldinger={[...(chatMeldinger ?? [])].reverse()}
          profiler={chatProfiler ?? []}
        />
      </div>

      {kanSlette && <SlettPollKnapp pollId={poll.id} />}
    </div>
  )
}

// ─── Hjelper for kåringspoll-rendering ────────────────────────────────────
type ChatProfil = { id: string; navn: string | null; bilde_url: string | null; rolle: string | null }
type ChatMelding = {
  id: string
  profil_id: string
  innhold: string | null
  bilde_url: string | null
  video_url: string | null
  opprettet: string
}

function KaaringVisning({
  poll,
  valg,
  chatProfiler,
  stemmerPerValg,
  antallStemmere,
  mineStemmer,
  datoLang,
  erAvsluttet,
  erAdmin,
  chatMeldinger,
  userId,
  kanSlette,
}: {
  poll: PollRad
  valg: ValgRad[]
  chatProfiler: ChatProfil[]
  stemmerPerValg: Map<string, number>
  antallStemmere: number
  mineStemmer: string[]
  datoLang: string
  erAvsluttet: boolean
  erAdmin: boolean
  chatMeldinger: ChatMelding[]
  userId: string
  kanSlette: boolean
}) {
  // Bygg KaaringValg-liste med denormalisert kandidat-data.
  const profilMap = new Map(chatProfiler.map(p => [p.id, p]))

  // Hent også arrangement-titler for ev. arrangement-kandidater.
  // Vi har dem ikke i propsene — kandidatens tekst-felt brukes som navn,
  // som er forutsetningen i opprettKaaringspoll.
  const kaaringValg: KaaringValg[] = valg.map(v => {
    if (v.referanse_profil_id) {
      const p = profilMap.get(v.referanse_profil_id)
      return {
        id: v.id,
        navn: p?.navn ?? v.tekst,
        bildeUrl: p?.bilde_url ?? null,
        rolle: p?.rolle ?? null,
        variant: 'profil',
      }
    }
    return {
      id: v.id,
      navn: v.tekst,
      bildeUrl: null,
      rolle: null,
      variant: 'arrangement',
    }
  })

  const venterTiebreak = poll.tiebreak_status === 'venter_paa_tiebreak'
  const erAvgjort = poll.tiebreak_status === 'avgjort'
  const ingenStemmer = poll.avsluttet_paa !== null && antallStemmere === 0

  // Vinner — velg fra valg-rad med høyest stemmetall (ved avgjort).
  let vinner: KaaringValg | null = null
  if (erAvgjort) {
    let topp = 0
    for (const v of kaaringValg) {
      const n = stemmerPerValg.get(v.id) ?? 0
      if (n > topp) {
        topp = n
        vinner = v
      }
    }
    // Hvis tiebreak ble avgjort manuelt og tellingen er lik, kan vi ikke
    // tippe vinneren her — kaaring_vinnere er kilden til sannhet. Vi
    // viser i så fall en fallback uten banner.
  }

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {!erAvsluttet && <PollRealtime pollId={poll.id} />}

      {erAvgjort && vinner && (
        <VinnerBanner
          navn={vinner.navn}
          bildeUrl={vinner.bildeUrl}
          rolle={vinner.rolle}
          variant={vinner.variant}
          undertittel={`${poll.spoersmaal}`}
        />
      )}

      <header style={{ marginTop: 12, marginBottom: 22 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Kåring · {poll.aar}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.4px',
            lineHeight: 1.15,
            margin: '0 0 10px',
            color: 'var(--text-primary)',
          }}
        >
          {poll.spoersmaal}
        </h1>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          {erAvsluttet ? `Avsluttet ${datoLang}` : `Svarfrist ${datoLang}`}
        </div>
        {poll.arrangement_id && (
          <div style={{ marginTop: 8 }}>
            <Link
              href={`/arrangementer/${poll.arrangement_id}`}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--accent)',
                textDecoration: 'none',
              }}
            >
              ← Tilbake til arrangementet
            </Link>
          </div>
        )}
      </header>

      {/* Tilstandsspesifikk seksjon */}
      {!erAvsluttet ? (
        <section style={{ marginBottom: 24 }}>
          <SectionLabel>Velg din kandidat</SectionLabel>
          <KaaringPollStemming
            pollId={poll.id}
            valg={kaaringValg}
            mineStemmer={mineStemmer}
          />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              marginTop: 14,
              fontStyle: 'italic',
            }}
          >
            Stemmene er anonyme. Resultatet vises etter svarfristen.
          </p>
        </section>
      ) : ingenStemmer ? (
        <section style={{ marginBottom: 24 }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-secondary)',
              padding: 16,
              border: '0.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            Ingen stemmer ble avgitt — ingen vinner kåret.
          </p>
        </section>
      ) : venterTiebreak ? (
        <section style={{ marginBottom: 24 }}>
          {erAdmin ? (
            <div
              style={{
                padding: 16,
                border: '0.5px solid var(--accent)',
                background: 'var(--accent-soft)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 0 }}>
                Det er likt antall stemmer på topp. Du må velge vinneren.
              </p>
              <Link
                href={`/kaaringspoll/${poll.id}/tiebreak`}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '10px 18px',
                  background: 'var(--accent)',
                  color: '#0a0a0a',
                  borderRadius: 999,
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Velg vinner
              </Link>
            </div>
          ) : (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--text-secondary)',
                padding: 16,
                border: '0.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              Det ble likt — generalsekretær bestemmer nå.
            </p>
          )}
        </section>
      ) : erAdmin ? (
        // Avgjort, admin/generalsekretær: vis stemmefordeling
        <section style={{ marginBottom: 24 }}>
          <SectionLabel count={antallStemmere}>Stemmefordeling</SectionLabel>
          <PollResultat
            valg={valg}
            stemmerPerValg={stemmerPerValg}
            antallStemmere={antallStemmere}
            mineStemmer={mineStemmer}
          />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              marginTop: 8,
              fontStyle: 'italic',
            }}
          >
            Kun synlig for admin og generalsekretær.
          </p>
        </section>
      ) : null /* Vanlige medlemmer ser bare vinnerbanneret */}

      <div id="kommentarer">
        <Chat
          scope={{ type: 'poll', pollId: poll.id }}
          brukerId={userId}
          erAdmin={erAdmin}
          initialMeldinger={[...chatMeldinger].reverse()}
          profiler={chatProfiler}
        />
      </div>

      {kanSlette && <SlettPollKnapp pollId={poll.id} />}
    </div>
  )
}
