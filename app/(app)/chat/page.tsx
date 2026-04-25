import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Chat from '@/components/chat/Chat'
import Icon from '@/components/ui/Icon'
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

  const [{ data: siste }, { data: profiler }, { count: ulestPrivat }] = await Promise.all([
    supabase
      .from('klubb_chat')
      .select('id, profil_id, innhold, opprettet')
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

  const erAdmin = kanAdministrere(profil?.rolle)
  const initialMeldinger = [...(siste ?? [])].reverse()
  const ulest = ulestPrivat ?? 0

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

      {/* Lenke til private samtaler — vises alltid for at funksjonen skal
          være oppdagbar. Ulest-badge til høyre når det finnes uleste. */}
      <Link
        href="/samtaler"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          marginBottom: 22,
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
