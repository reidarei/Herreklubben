import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import PaameldingKnapper from './PaameldingKnapper'
import SladdetFelt from '@/components/SladdetFelt'

export default async function ArrangementDetaljer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-8">
      {/* Tilbake + rediger */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
          ← Tilbake
        </Link>
        {kanRedigere && (
          <Link
            href={`/arrangementer/${id}/rediger`}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}
          >
            Rediger
          </Link>
        )}
      </div>

      {/* Type-etikett */}
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          background: erTur ? 'rgba(193,127,36,0.15)' : 'rgba(45,106,79,0.15)',
          color: erTur ? 'var(--aksent-lys)' : 'var(--gronn-lys)',
        }}
      >
        {erTur ? 'Tur' : 'Møte'}
      </span>

      <h1 className="text-2xl font-bold mt-2 mb-4" style={{ color: 'var(--tekst)' }}>
        {arr.tittel}
      </h1>

      {/* Info-rad */}
      <div className="space-y-2 mb-5">
        <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
          📅 {format(new Date(arr.start_tidspunkt), "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
          {erTur && arr.slutt_tidspunkt && (
            <> – {format(new Date(arr.slutt_tidspunkt), "d. MMMM", { locale: nb })}</>
          )}
        </p>
        {arr.oppmoetested && (
          <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
            📍 {arr.oppmoetested}
          </p>
        )}
        {erTur && (
          <>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
              ✈️ {erSensurert('destinasjon') ? <SladdetFelt /> : arr.destinasjon ?? '–'}
            </p>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
              💰 {erSensurert('pris_per_person')
                ? <SladdetFelt />
                : arr.pris_per_person
                  ? `${arr.pris_per_person.toLocaleString('nb')} kr`
                  : '–'}
            </p>
          </>
        )}
      </div>

      {/* Beskrivelse */}
      {arr.beskrivelse && (
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--tekst)' }}>
          {arr.beskrivelse}
        </p>
      )}

      {/* Påmeldingsknapper */}
      <PaameldingKnapper
        arrangementId={id}
        minStatus={minPaamelding?.status as 'ja' | 'nei' | 'kanskje' | undefined}
      />

      {/* Deltakerliste */}
      <div className="mt-6 space-y-4">
        {[
          { key: 'ja', label: 'Kommer', farge: 'var(--gronn-lys)', ikon: '✓' },
          { key: 'kanskje', label: 'Kanskje', farge: 'var(--aksent-lys)', ikon: '?' },
          { key: 'nei', label: 'Kommer ikke', farge: '#f87171', ikon: '✗' },
        ].map(({ key, label, farge, ikon }) => {
          const liste = gruppert[key as keyof typeof gruppert]
          if (liste.length === 0) return null
          return (
            <div key={key}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: farge }}>
                {ikon} {label} ({liste.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {liste.map((p) => (
                  <span
                    key={p.profil_id}
                    className="text-sm px-2 py-1 rounded-lg"
                    style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst)' }}
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
  )
}
