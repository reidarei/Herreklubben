import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { kanAdministrere } from '@/lib/roller'
import { formaterDato } from '@/lib/dato'
import SectionLabel from '@/components/ui/SectionLabel'
import PollStemming from '@/components/poll/PollStemming'
import PollResultat from '@/components/poll/PollResultat'
import PollRealtime from '@/components/poll/PollRealtime'
import PollStemtVisning from '@/components/poll/PollStemtVisning'
import Chat from '@/components/chat/Chat'
import SlettPollKnapp from './SlettPollKnapp'

type PollRad = {
  id: string
  spoersmaal: string
  svarfrist: string
  flervalg: boolean
  opprettet_av: string
  poll_valg: { id: string; tekst: string; rekkefoelge: number }[]
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
         poll_valg (id, tekst, rekkefoelge),
         poll_stemme (valg_id, profil_id)`,
      )
      .eq('id', id)
      .single<PollRad>(),
    supabase
      .from('poll_chat')
      .select('id, profil_id, innhold, opprettet')
      .eq('poll_id', id)
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase
      .from('profiles')
      .select('id, navn, bilde_url, rolle')
      .eq('aktiv', true),
  ])

  if (!poll) notFound()

  const erAvsluttet = new Date(poll.svarfrist) <= new Date()
  const erAdmin = kanAdministrere(profil?.rolle)
  const kanSlette = poll.opprettet_av === user!.id || erAdmin

  // Sorter valgene etter rekkefoelge
  const valg = [...poll.poll_valg].sort((a, b) => a.rekkefoelge - b.rekkefoelge)

  // Aggreger stemmer per valg + unike stemmere
  const stemmerPerValg = new Map<string, number>()
  const unikeStemmere = new Set<string>()
  for (const s of poll.poll_stemme) {
    stemmerPerValg.set(s.valg_id, (stemmerPerValg.get(s.valg_id) ?? 0) + 1)
    unikeStemmere.add(s.profil_id)
  }
  const antallStemmere = unikeStemmere.size

  // Mine stemmer — brukes for å pre-utfylle stemmeformen
  const mineStemmer = poll.poll_stemme
    .filter(s => s.profil_id === user!.id)
    .map(s => s.valg_id)

  const datoLang = formaterDato(poll.svarfrist, "d. MMMM 'kl.' HH:mm")

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Realtime: refresh når noen stemmer */}
      {!erAvsluttet && <PollRealtime pollId={poll.id} />}

      {/* Header: label + spørsmål + frist */}
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
          {erAvsluttet
            ? `Avsluttet ${datoLang}`
            : `Svarfrist ${datoLang}`}
        </div>
      </header>

      {/* Stemming eller resultat */}
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
        // Har stemt: resultat er primær, «Endre svar» ekspanderer stemming
        <PollStemtVisning
          pollId={poll.id}
          flervalg={poll.flervalg}
          valg={valg}
          mineStemmer={mineStemmer}
          stemmerPerValg={Object.fromEntries(stemmerPerValg)}
          antallStemmere={antallStemmere}
        />
      ) : (
        // Ikke stemt ennå: viser stemme-UI med foreløpig resultat under
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

      {/* Kommentarer */}
      <div id="kommentarer">
        <Chat
          scope={{ type: 'poll', pollId: poll.id }}
          brukerId={user!.id}
          erAdmin={erAdmin}
          initialMeldinger={[...(chatMeldinger ?? [])].reverse()}
          profiler={chatProfiler ?? []}
        />
      </div>

      {/* Slett-knapp for oppretter/admin */}
      {kanSlette && (
        <SlettPollKnapp pollId={poll.id} />
      )}
    </div>
  )
}
