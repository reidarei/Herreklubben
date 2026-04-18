import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import PaameldingKnapper from './PaameldingKnapper'
import VarsleNuKnapp from './VarsleNuKnapp'
import Pill from '@/components/ui/Pill'
import Card from '@/components/ui/Card'
import SectionLabel from '@/components/ui/SectionLabel'
import SladdetFelt from '@/components/SladdetFelt'
import LocalTid from '@/components/LocalTid'
import Chat from './Chat'

export default async function ArrangementDetaljer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ varslet?: string }> }) {
  const [{ id }, { varslet }] = await Promise.all([params, searchParams])
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  const [{ data: arr }, { data: chatMeldinger }, { data: chatProfiler }] = await Promise.all([
    supabase
      .from('arrangementer')
      .select(`
        id, type, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt,
        oppmoetested, destinasjon, pris_per_person, sensurerte_felt, opprettet_av,
        bilde_url,
        paameldinger (profil_id, status, profiles (navn))
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('arrangement_chat')
      .select('id, profil_id, innhold, opprettet')
      .eq('arrangement_id', id)
      .order('opprettet')
      .limit(100),
    supabase
      .from('profiles')
      .select('id, navn')
      .eq('aktiv', true),
  ])

  if (!arr) notFound()
  const erAdmin = profil?.rolle === 'admin'
  const kanRedigere = arr.opprettet_av === user!.id || erAdmin
  const erTur = arr.type === 'tur'

  const erSensurert = (felt: string) =>
    (arr.sensurerte_felt as Record<string, boolean>)?.[felt] === true

  const minPaamelding = arr.paameldinger.find((p: { profil_id: string }) => p.profil_id === user!.id)

  const gruppert = {
    ja: arr.paameldinger.filter((p: { status: string }) => p.status === 'ja'),
    kanskje: arr.paameldinger.filter((p: { status: string }) => p.status === 'kanskje'),
    nei: arr.paameldinger.filter((p: { status: string }) => p.status === 'nei'),
  }

  const grupper = [
    { key: 'ja' as const, label: 'Kommer', variant: 'success' as const, Ikon: CheckIcon },
    { key: 'kanskje' as const, label: 'Kanskje', variant: 'accent' as const, Ikon: QuestionMarkCircleIcon },
    { key: 'nei' as const, label: 'Kommer ikke', variant: 'danger' as const, Ikon: XMarkIcon },
  ]

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Varslet-banner */}
      {varslet === 'true' && (
        <div className="mx-5 mt-5 px-4 py-3 text-sm font-medium" style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(139, 196, 158, 0.2)', borderRadius: 'var(--radius-small)' }}>
          Varsel er sendt 👍
        </div>
      )}

      {/* Hero-bilde med glass-knapper */}
      <div className="relative">
        <img
          src={arr.bilde_url || '/bakgrunn.jpg'}
          alt=""
          className="w-full object-cover"
          style={{ aspectRatio: '16/9' }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(6,6,8,0.3) 0%, transparent 40%, rgba(6,6,8,0.8) 100%)' }}
        />
        {/* Tilbake-knapp */}
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1 text-sm px-3 py-1.5"
          style={{
            background: 'rgba(6, 6, 8, 0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Tilbake
        </Link>
        {/* Rediger-knapp */}
        {kanRedigere && (
          <div className="absolute top-4 right-4 flex gap-2">
            <VarsleNuKnapp arrangementId={id} />
            <Link
              href={`/arrangementer/${id}/rediger`}
              className="text-sm font-medium px-3 py-1.5"
              style={{
                background: 'rgba(6, 6, 8, 0.5)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
            >
              Rediger
            </Link>
          </div>
        )}
      </div>

      <div className="px-5">
        {/* Type + dato-meta */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          <Pill variant="muted">{erTur ? 'Tur' : 'Møte'}</Pill>
          <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            <LocalTid iso={arr.start_tidspunkt} formatStr="d. MMMM yyyy" />
          </span>
        </div>

        <h1
          className="mb-5 leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 400,
            color: 'var(--text-primary)',
          }}
        >
          {arr.tittel}
        </h1>

        {/* Info-kort */}
        <Card className="mb-5">
          <div className="space-y-0 px-5 py-2">
            <div className="flex items-center gap-3 py-3" style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
              <CalendarIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <LocalTid iso={arr.start_tidspunkt} formatStr="EEEE d. MMMM yyyy 'kl.' HH:mm" />
                {erTur && arr.slutt_tidspunkt && (
                  <> – <LocalTid iso={arr.slutt_tidspunkt} formatStr="d. MMMM" /></>
                )}
              </span>
            </div>
            {arr.oppmoetested && (
              <div className="flex items-center gap-3 py-3" style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
                <MapPinIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{arr.oppmoetested}</span>
              </div>
            )}
            {erTur && (
              <>
                <div className="flex items-center gap-3 py-3" style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
                  <PaperAirplaneIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {erSensurert('destinasjon') ? <SladdetFelt /> : arr.destinasjon ?? '–'}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <BanknotesIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {erSensurert('pris_per_person')
                      ? <SladdetFelt />
                      : arr.pris_per_person
                        ? `${arr.pris_per_person.toLocaleString('nb')} kr`
                        : '–'}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Legg til i kalender */}
        <a
          href={`/api/arrangementer/${id}/ics`}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 mb-5"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <CalendarDaysIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          Legg til i kalender
        </a>

        {/* Beskrivelse */}
        {arr.beskrivelse && (
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {arr.beskrivelse}
          </p>
        )}

        {/* Påmeldingsknapper */}
        <PaameldingKnapper
          arrangementId={id}
          minStatus={minPaamelding?.status as 'ja' | 'nei' | 'kanskje' | undefined}
        />

        {/* Deltakerliste */}
        <div className="mt-6 space-y-5">
          {grupper.map(({ key, label, variant, Ikon }) => {
            const liste = gruppert[key]
            if (liste.length === 0) return null
            return (
              <div key={key}>
                <SectionLabel>{label} ({liste.length})</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {liste.map((p) => (
                    <Link
                      key={p.profil_id}
                      href={`/klubbinfo/medlemmer/${p.profil_id}`}
                      className="text-[13px] px-3 py-1.5 flex items-center gap-1.5"
                      style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-pill)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{
                          background: 'var(--bg-elevated-2)',
                          fontFamily: 'var(--font-display)',
                          color: 'var(--accent-muted)',
                        }}
                      >
                        {(p.profiles?.navn ?? '?').charAt(0)}
                      </span>
                      {p.profiles?.navn ?? '–'}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

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
