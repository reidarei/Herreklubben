import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Chat from '@/components/chat/Chat'
import { kanAdministrere } from '@/lib/roller'

// Klubb-chat: én felles kronologisk tråd for hele herreklubben.
// Initial-last er siste 30 meldinger (i desc-rekkefølge fra DB, reversert til
// ascending for UI). «Vis eldre»-knappen i felleskomponenten henter flere.
export default async function KlubbChatSide() {
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  const [{ data: siste }, { data: profiler }] = await Promise.all([
    supabase
      .from('klubb_chat')
      .select('id, profil_id, innhold, opprettet')
      .order('opprettet', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, navn, bilde_url, rolle').eq('aktiv', true),
  ])

  const erAdmin = kanAdministrere(profil?.rolle)
  const initialMeldinger = [...(siste ?? [])].reverse()

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Breadcrumb + tittel */}
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

      <Chat
        scope={{ type: 'klubb' }}
        brukerId={user!.id}
        erAdmin={erAdmin}
        initialMeldinger={initialMeldinger}
        profiler={profiler ?? []}
        visSeksjonsLabel={false}
      />
    </div>
  )
}
