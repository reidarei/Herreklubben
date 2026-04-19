import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import Placeholder from '@/components/ui/Placeholder'
import SladdetFelt from '@/components/SladdetFelt'
import RsvpBlokk from '@/components/arrangement/RsvpBlokk'
import VarsleNuKnapp from './VarsleNuKnapp'
import Chat from './Chat'
import { formaterDato } from '@/lib/dato'

type Paamelding = {
  profil_id: string
  status: string
  profiles: { navn: string | null; bilde_url: string | null } | null
}

function sceneFor(type: string): 'tur' | 'møte' | 'event' {
  if (type === 'tur') return 'tur'
  if (type === 'moete') return 'møte'
  return 'event'
}

export default async function ArrangementDetaljer({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ varslet?: string }>
}) {
  const [{ id }, { varslet }] = await Promise.all([params, searchParams])
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  const [{ data: arr }, { data: chatMeldinger }, { data: chatProfiler }] = await Promise.all([
    supabase
      .from('arrangementer')
      .select(
        `id, type, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt,
         oppmoetested, destinasjon, pris_per_person, sensurerte_felt, opprettet_av,
         bilde_url,
         opprettet_profil:profiles!arrangementer_opprettet_av_fkey (navn),
         paameldinger (profil_id, status, profiles (navn, bilde_url))`,
      )
      .eq('id', id)
      .single(),
    supabase
      .from('arrangement_chat')
      .select('id, profil_id, innhold, opprettet')
      .eq('arrangement_id', id)
      .order('opprettet')
      .limit(100),
    supabase.from('profiles').select('id, navn, bilde_url').eq('aktiv', true),
  ])

  if (!arr) notFound()

  const erAdmin = profil?.rolle === 'admin'
  const erArrangoer = arr.opprettet_av === user!.id
  const kanRedigere = erArrangoer || erAdmin
  const erTur = arr.type === 'tur'

  // Sensureringsregel: kun arrangør ser gjennom sladden.
  // Admin ser IKKE gjennom — bevisst strammet policy.
  const erSensurert = (felt: string) =>
    !erArrangoer && (arr.sensurerte_felt as Record<string, boolean>)?.[felt] === true

  const paameldinger = (arr.paameldinger ?? []) as Paamelding[]
  const minPaamelding = paameldinger.find(p => p.profil_id === user!.id)
  const jaListe = paameldinger.filter(p => p.status === 'ja')

  const mnd = formaterDato(arr.start_tidspunkt, 'MMM').toUpperCase()
  const dag = formaterDato(arr.start_tidspunkt, 'd')
  const tid = formaterDato(arr.start_tidspunkt, 'HH:mm')
  const datoLang = formaterDato(arr.start_tidspunkt, 'd. MMMM yyyy')

  const opprettetProfil = Array.isArray(arr.opprettet_profil)
    ? arr.opprettet_profil[0]
    : arr.opprettet_profil
  const opprettetAvNavn = opprettetProfil?.navn ?? 'Ukjent'

  return (
    <div style={{ padding: '0 0 140px' }}>
      {/* Varslet-banner */}
      {varslet === 'true' && (
        <div
          style={{
            margin: '12px 20px 0',
            padding: '12px 14px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            background: 'color-mix(in srgb, var(--success) 15%, transparent)',
            color: 'var(--success)',
            border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
          }}
        >
          Varsel er sendt
        </div>
      )}

      {/* Hero */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        {arr.bilde_url ? (
          <div style={{ position: 'relative', aspectRatio: '4/3' }}>
            <Image
              src={arr.bilde_url}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 512px) 100vw, 512px"
              priority
            />
          </div>
        ) : (
          <Placeholder label="" aspectRatio="4/3" type={sceneFor(arr.type)} />
        )}

        {/* Mørk gradient nederst */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, var(--bg) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Tilbake-knapp */}
        <Link
          href="/"
          aria-label="Tilbake"
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(10,10,12,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '0.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <Icon
            name="chevron"
            size={16}
            color="var(--text-primary)"
            style={{ transform: 'rotate(180deg)' }}
          />
        </Link>

        {/* Rediger-pill + Varsle */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          {kanRedigere && <VarsleNuKnapp arrangementId={id} />}
          {kanRedigere && (
            <Link
              href={`/arrangementer/${id}/rediger`}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(10,10,12,0.6)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '0.5px solid var(--border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Rediger
            </Link>
          )}
        </div>

        {/* Dato-chip nederst på bildet */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 20,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--accent)',
            letterSpacing: '1.8px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {mnd} {dag} · {tid}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Tittel */}
        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              margin: '0 0 6px',
              lineHeight: 1.05,
            }}
          >
            {arr.tittel}
          </h1>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.1px',
            }}
          >
            {datoLang}
            {arr.oppmoetested && <> · {arr.oppmoetested}</>}
          </div>
        </div>

        {/* RSVP */}
        <RsvpBlokk
          arrangementId={id}
          minStatus={minPaamelding?.status as 'ja' | 'kanskje' | 'nei' | undefined}
        />

        {/* Fakta */}
        <div
          style={{
            marginBottom: 26,
            borderTop: '0.5px solid var(--border-subtle)',
            borderBottom: '0.5px solid var(--border-subtle)',
          }}
        >
          {(
            [
              arr.oppmoetested
                ? {
                    label: 'Oppmøte',
                    value: arr.oppmoetested,
                    icon: 'mapPin' as const,
                  }
                : null,
              erTur
                ? {
                    label: 'Destinasjon',
                    value: erSensurert('destinasjon')
                      ? 'sladd'
                      : arr.destinasjon ?? '–',
                    icon: 'plane' as const,
                    sladd: erSensurert('destinasjon'),
                  }
                : null,
              erTur
                ? {
                    label: 'Pris',
                    value: erSensurert('pris_per_person')
                      ? 'sladd'
                      : arr.pris_per_person
                      ? `${arr.pris_per_person.toLocaleString('nb')} kr`
                      : '–',
                    sub: arr.pris_per_person ? 'per person' : undefined,
                    icon: 'wine' as const,
                    sladd: erSensurert('pris_per_person'),
                  }
                : null,
              {
                label: 'Opprettet av',
                value: opprettetAvNavn,
                icon: 'user' as const,
              },
            ].filter(Boolean) as Array<{
              label: string
              value: string
              sub?: string
              icon: 'mapPin' | 'plane' | 'wine' | 'user'
              sladd?: boolean
            }>
          ).map((f, i, a) => (
            <div
              key={f.label}
              style={{
                padding: '14px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderBottom:
                  i < a.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
              }}
            >
              <Icon name={f.icon} size={14} color="var(--text-tertiary)" strokeWidth={1.5} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '1.6px',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                  }}
                >
                  {f.sladd ? <SladdetFelt /> : f.value}
                  {f.sub && (
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>
                      · {f.sub}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legg til i kalender */}
        <a
          href={`/api/arrangementer/${id}/ics`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 999,
            background: 'var(--bg-elevated)',
            border: '0.5px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            textDecoration: 'none',
            marginBottom: 26,
          }}
        >
          <Icon name="calendar" size={14} color="var(--accent)" strokeWidth={1.5} />
          Legg til i kalender
        </a>

        {/* Beskrivelse */}
        {arr.beskrivelse && (
          <>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600,
              }}
            >
              Beskrivelse
              <span style={{ flex: 1, height: '0.5px', background: 'var(--border-subtle)' }} />
            </div>
            <p
              style={{
                margin: '0 0 28px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                letterSpacing: '0.1px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {arr.beskrivelse}
            </p>
          </>
        )}

        {/* Påmeldt-seksjon */}
        {jaListe.length > 0 && (
          <>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600,
              }}
            >
              <span>Påmeldt</span>
              <span style={{ color: 'var(--text-secondary)' }}>{jaListe.length}</span>
              <span style={{ flex: 1, height: '0.5px', background: 'var(--border-subtle)' }} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              {jaListe.slice(0, 7).map((p, i) => (
                <Link
                  key={p.profil_id}
                  href={`/klubbinfo/medlemmer/${p.profil_id}`}
                  style={{
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: 20 - i,
                    border: '2px solid var(--bg)',
                    borderRadius: '50%',
                    position: 'relative',
                    textDecoration: 'none',
                  }}
                >
                  <Avatar name={p.profiles?.navn ?? '?'} size={32} src={p.profiles?.bilde_url} />
                </Link>
              ))}
              {jaListe.length > 7 && (
                <span
                  style={{
                    marginLeft: 12,
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}
                >
                  + {jaListe.length - 7} til
                </span>
              )}
            </div>
          </>
        )}

        {/* Chat */}
        <Chat
          arrangementId={id}
          brukerId={user!.id}
          erAdmin={erAdmin}
          initialMeldinger={chatMeldinger ?? []}
          profiler={chatProfiler ?? []}
        />
      </div>
    </div>
  )
}
