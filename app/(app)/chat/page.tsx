import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Chat from '@/components/chat/Chat'
import ChatV2 from '@/components/chat/ChatV2'
import ChatAutoScrollScript from '@/components/chat/ChatAutoScrollScript'
import { kanAdministrere } from '@/lib/roller'
import { markerChatSett } from '@/lib/actions/ulest'
import { CHAT_LEGACY_FALLBACK } from '@/lib/config'

// Klubb-chat: én felles kronologisk tråd for hele herreklubben.
// Initial-last er siste 30 meldinger (i desc-rekkefølge fra DB, reversert til
// ascending for UI). «Vis eldre»-knappen i felleskomponenten henter flere.
export default async function KlubbChatSide({
  searchParams,
}: {
  searchParams: Promise<{ legacy?: string }>
}) {
  const [supabase, user, profil, { legacy }] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
    searchParams,
  ])

  const [{ data: siste }, { data: profiler }] = await Promise.all([
    supabase
      .from('klubb_chat')
      .select('id, profil_id, innhold, bilde_url, video_url, opprettet, fra_facebook')
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, navn, bilde_url, rolle').eq('aktiv', true),
  ])

  // Marker at brukeren nå ser klubb-chat — prikken forsvinner ved neste
  // navigasjon. Fire-and-forget: vi venter ikke, men heller ikke stille.
  markerChatSett().catch(() => {})

  const erAdmin = kanAdministrere(profil?.rolle)
  const initialMeldinger = [...(siste ?? [])].reverse()

  // Kill-switch: CHAT_LEGACY_FALLBACK (env) eller ?legacy=1 i URL tvinger
  // gammel Chat.tsx. Fjernes i PR 3 etter at ChatV2 er bekreftet stabil.
  const brukLegacy = CHAT_LEGACY_FALLBACK || legacy === '1'

  // Header-blokken — breadcrumb + tittel + privatmelding-lenke.
  // I ChatV2 sender vi dette som headerSlot slik at det scroller med
  // meldingslisten (iMessage-aktig). I legacy-modus legges det direkte i siden.
  const headerBlokk = (
    <div style={{ padding: '12px 4px 22px' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-tertiary)',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ width: 18, height: '0.5px', background: 'var(--border-strong)' }} />
        Klubbchat
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 500,
          letterSpacing: '-0.5px',
          lineHeight: 1,
          margin: 0,
          color: 'var(--text-primary)',
        }}
      >
        Samtalen
      </h1>
    </div>
  )

  if (brukLegacy) {
    return (
      <div style={{ padding: '0 20px 20px' }}>
        <ChatAutoScrollScript />
        {headerBlokk}
        <Chat
          scope={{ type: 'klubb' }}
          brukerId={user!.id}
          erAdmin={erAdmin}
          initialMeldinger={initialMeldinger}
          profiler={profiler ?? []}
          visSeksjonsLabel={false}
          autoScrollTilBunn
        />
      </div>
    )
  }

  return (
    <ChatV2
      scope={{ type: 'klubb' }}
      brukerId={user!.id}
      erAdmin={erAdmin}
      initialMeldinger={initialMeldinger}
      profiler={profiler ?? []}
      autoScrollTilBunn
      headerSlot={headerBlokk}
    />
  )
}
