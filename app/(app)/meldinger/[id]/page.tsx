import { notFound } from 'next/navigation'
import Image from 'next/image'
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
  innhold: string | null
  opprettet: string
  bilde_url: string | null
  fra_facebook: boolean | null
  profil_id: string
  profiles: {
    navn: string | null
    bilde_url: string | null
    rolle: string | null
  } | null
  melding_bilder: { bilde_url: string; rekkefoelge: number }[] | null
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
      .select(
        'id, innhold, opprettet, bilde_url, fra_facebook, profil_id, profiles!meldinger_profil_id_fkey(navn, bilde_url, rolle), melding_bilder(bilde_url, rekkefoelge)',
      )
      .eq('id', id)
      .single<MeldingRad>(),
    supabase
      .from('melding_reaksjon')
      .select('emoji, profil_id')
      .eq('melding_id', id),
    supabase
      .from('melding_chat')
      .select('id, profil_id, innhold, bilde_url, video_url, opprettet')
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
  // FB-importerte meldinger er fryst i RLS (mig 081 speiler 067 fra klubb_chat).
  // Skjul slette-knappen så brukeren ikke møter en kryptisk RLS-feil ved klikk.
  const kanSlette = (melding.profil_id === user!.id || erAdmin) && !melding.fra_facebook

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
    <div style={{ padding: '0 20px 20px' }}>
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
              {melding.fra_facebook && (
                <span
                  title="Importert fra Facebook"
                  style={{
                    marginLeft: 8,
                    border: '0.5px solid var(--border)',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 9,
                    opacity: 0.7,
                  }}
                >
                  Facebook
                </span>
              )}
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

        {melding.bilde_url && (() => {
          const ekstra = [...(melding.melding_bilder ?? [])]
            .sort((a, b) => a.rekkefoelge - b.rekkefoelge)
            .map(b => b.bilde_url)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={melding.bilde_url}
                  alt=""
                  fill
                  sizes="(max-width: 512px) 100vw, 512px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
              {ekstra.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ekstra.length}, 1fr)`, gap: 4 }}>
                  {ekstra.map((url, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1/1',
                        borderRadius: 'var(--radius-card)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="(max-width: 512px) 33vw, 170px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

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
