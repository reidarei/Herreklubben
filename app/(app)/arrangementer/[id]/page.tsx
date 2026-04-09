import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarIcon,
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
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import SladdetFelt from '@/components/SladdetFelt'
import LocalTid from '@/components/LocalTid'

export default async function ArrangementDetaljer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ varslet?: string }> }) {
  const [{ id }, { varslet }] = await Promise.all([params, searchParams])
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  const { data: arr } = await supabase
    .from('arrangementer')
    .select(`
      id, type, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt,
      oppmoetested, destinasjon, pris_per_person, sensurerte_felt, opprettet_av,
      bilde_url,
      paameldinger (profil_id, status, profiles (navn))
    `)
    .eq('id', id)
    .single()

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
    { key: 'nei' as const, label: 'Kommer ikke', variant: 'destructive' as const, Ikon: XMarkIcon },
  ]

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Varslet-banner */}
      {varslet === 'true' && (
        <div className="mx-5 mt-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)' }}>
          Alle gutta er varslet om arrangementet 👍
        </div>
      )}

      {/* Tilbake + knapper */}
      <div className="flex items-center justify-between px-5 pt-6 mb-4 gap-2">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Tilbake
        </Link>
        <div className="flex gap-2">
          {kanRedigere && <VarsleNuKnapp arrangementId={id} />}
          {kanRedigere && (
            <Link
              href={`/arrangementer/${id}/rediger`}
              className="text-sm px-3 py-1.5 rounded-xl"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              Rediger
            </Link>
          )}
        </div>
      </div>

      {/* Hero-bilde */}
      <img
        src={arr.bilde_url || '/bakgrunn.jpg'}
        alt=""
        className="w-full object-cover"
        style={{ aspectRatio: '16/9' }}
      />

      <div className="px-5">
        {/* Type-etikett */}
        <div className="mt-4 mb-2">
          <Badge variant="accent">{erTur ? 'Tur' : 'Møte'}</Badge>
        </div>

        <h1
          className="font-bold mb-5"
          style={{ fontSize: '24px', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}
        >
          {arr.tittel}
        </h1>

        {/* Info-rader */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <CalendarIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <LocalTid iso={arr.start_tidspunkt} formatStr="EEEE d. MMMM yyyy 'kl.' HH:mm" />
            {erTur && arr.slutt_tidspunkt && (
              <> – <LocalTid iso={arr.slutt_tidspunkt} formatStr="d. MMMM" /></>
            )}
          </div>
          {arr.oppmoetested && (
            <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <MapPinIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {arr.oppmoetested}
            </div>
          )}
          {erTur && (
            <>
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <PaperAirplaneIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                {erSensurert('destinasjon') ? <SladdetFelt /> : arr.destinasjon ?? '–'}
              </div>
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <BanknotesIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                {erSensurert('pris_per_person')
                  ? <SladdetFelt />
                  : arr.pris_per_person
                    ? `${arr.pris_per_person.toLocaleString('nb')} kr`
                    : '–'}
              </div>
            </>
          )}
        </div>

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
                <p
                  className="text-xs font-semibold mb-2 flex items-center gap-1"
                  style={{ color: `var(--${variant === 'accent' ? 'accent' : variant})` }}
                >
                  <Ikon className="w-3.5 h-3.5" />
                  {label} ({liste.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {liste.map((p) => (
                    <span
                      key={p.profil_id}
                      className="text-[13px] px-3 py-1.5 rounded-[10px]"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {p.profiles?.navn ?? '–'}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>


      </div>
    </div>
  )
}
