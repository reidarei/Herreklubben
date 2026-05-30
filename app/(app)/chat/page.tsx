import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Chat from '@/components/chat/Chat'
import ChatV2 from '@/components/chat/ChatV2'
import ChatAutoScrollScript from '@/components/chat/ChatAutoScrollScript'
import Icon from '@/components/ui/Icon'
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

  const [{ data: siste }, { data: profiler }, { count: ulestPrivat }] = await Promise.all([
    supabase
      .from('klubb_chat')
      .select('id, profil_id, innhold, bilde_url, video_url, opprettet, fra_facebook')
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, navn, bilde_url, rolle').eq('aktiv', true),
    // Antall uleste privatmeldinger til meg. RLS sørger for at vi kun
    // teller meldinger i samtaler vi deltar i; profil_id != meg ekskluderer
    // egne sendte meldinger.
    supabase
      .from('samtale_chat')
      .select('id', { count: 'exact', head: true })
      .eq('lest', false)
      .neq('profil_id', user!.id),
  ])

  // Marker at brukeren nå ser klubb-chat — prikken forsvinner ved neste
  // navigasjon. Fire-and-forget: vi venter ikke, men heller ikke stille.
  markerChatSett().catch(() => {})

  const erAdmin = kanAdministrere(profil?.rolle)
  const initialMeldinger = [...(siste ?? [])].reverse()
  const ulest = ulestPrivat ?? 0

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

      {/* Lenke til private samtaler — vises alltid for at funksjonen skal
          være oppdagbar. Ulest-badge til høyre når det finnes uleste. */}
      <Link
        href="/samtaler"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          marginTop: 22,
          background: 'var(--bg-elevated)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Icon name="message" size={18} color="var(--accent)" strokeWidth={1.6} />
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text-primary)',
          }}
        >
          Privatmeldinger
        </span>
        {ulest > 0 && (
          <span
            style={{
              minWidth: 20,
              height: 20,
              padding: '0 7px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: '#0a0a0a',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {ulest}
          </span>
        )}
        <Icon name="chevron" size={14} color="var(--text-tertiary)" />
      </Link>
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
