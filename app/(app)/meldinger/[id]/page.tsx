import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { kanAdministrere } from '@/lib/roller'
import Avatar from '@/components/ui/Avatar'
import Chat from '@/components/chat/Chat'
import MeldingReaksjoner from '@/components/agenda/MeldingReaksjoner'
import SlettMeldingKnapp from './SlettMeldingKnapp'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

type MeldingRad = {
  id: string
  innhold: string
  opprettet: string
  profil_id: string
  profiles: {
    navn: string | null
    bilde_url: string | null
    rolle: string | null
  } | null
}

type ReaksjonRad = {
  emoji: string
  profil_id: string
}

export default async function MeldingDetalj({
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

  const [
    { data: melding },
    { data: reaksjoner },
    { data: chatMeldinger },
    { data: chatProfiler },
  ] = await Promise.all([
    supabase
      .from('meldinger')
      .select('id, innhold, opprettet, profil_id, profiles(navn, bilde_url, rolle)')
      .eq('id', id)
      .single<MeldingRad>(),
    supabase
      .from('melding_reaksjon')
      .select('emoji, profil_id')
      .eq('melding_id', id),
    supabase
      .from('melding_chat')
      .select('id, profil_id, innhold, opprettet')
      .eq('melding_id', id)
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase
      .from('profiles')
      .select('id, navn, bilde_url, rolle')
      .eq('aktiv', true),
  ])

  if (!melding) notFound()

  const erAdmin = kanAdministrere(profil?.rolle)
  const kanSlette = melding.profil_id === user!.id || erAdmin

  // Aggreger reaksjoner per emoji
  const grupper = new Map<string, string[]>()
  for (const r of (reaksjoner ?? []) as ReaksjonRad[]) {
    const profilIder = grupper.get(r.emoji) ?? []
    profilIder.push(r.profil_id)
    grupper.set(r.emoji, profilIder)
  }
  const reaksjonGrupper = [...grupper.entries()].map(([emoji, profilIder]) => ({
    emoji,
    profilIder,
  }))

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <header style={{ marginTop: 12, marginBottom: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Avatar
            name={melding.profiles?.navn ?? ''}
            size={42}
            src={melding.profiles?.bilde_url ?? null}
            rolle={melding.profiles?.rolle ?? null}
          />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {melding.profiles?.navn ?? 'Ukjent'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              {formatDistanceToNowStrict(new Date(melding.opprettet), {
                locale: nb,
                addSuffix: true,
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            marginBottom: 16,
          }}
        >
          {melding.innhold}
        </div>

        <MeldingReaksjoner
          meldingId={melding.id}
          brukerId={user!.id}
          reaksjoner={reaksjonGrupper}
        />
      </header>

      <div id="kommentarer">
        <Chat
          scope={{ type: 'melding', meldingId: melding.id }}
          brukerId={user!.id}
          erAdmin={erAdmin}
          initialMeldinger={[...(chatMeldinger ?? [])].reverse()}
          profiler={chatProfiler ?? []}
        />
      </div>

      {kanSlette && <SlettMeldingKnapp meldingId={melding.id} />}
    </div>
  )
}
