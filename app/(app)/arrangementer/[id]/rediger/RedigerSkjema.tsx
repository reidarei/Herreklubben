'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { oppdaterArrangement, slettArrangement } from '@/lib/actions/arrangementer'
import TurFelt from '@/components/TurFelt'
import BildeVelger from '@/components/BildeVelger'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SkjemaBar from '@/components/ui/SkjemaBar'
import { isoTilDatetimeLocal, datetimeLocalTilIso } from '@/lib/dato'

const inputStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-small)',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
  fontFamily: 'inherit',
}

const labelStil: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
}

export default function RedigerSkjema({ arrangement: arr }: { arrangement: Record<string, unknown> }) {
  const erTur = arr.type === 'tur'
  const [sensurert, setSensurert] = useState<Record<string, boolean>>(
    (arr.sensurerte_felt as Record<string, boolean>) ?? {}
  )
  const [bildeUrl, setBildeUrl] = useState<string | null>((arr.bilde_url as string) || null)
  const [visSlett, setVisSlett] = useState(false)
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleSensurert(felt: string) {
    setSensurert(prev => ({ ...prev, [felt]: !prev[felt] }))
  }

  function handleSubmit() {
    setFeil('')
    const form = document.querySelector('form') as HTMLFormElement
    const fd = new FormData(form)
    const startRaw = fd.get('start_tidspunkt') as string
    const sluttRaw = fd.get('slutt_tidspunkt') as string

    startTransition(async () => {
      try {
        await oppdaterArrangement(arr.id as string, {
          tittel: fd.get('tittel') as string,
          beskrivelse: fd.get('beskrivelse') as string,
          start_tidspunkt: startRaw ? datetimeLocalTilIso(startRaw) : undefined,
          oppmoetested: fd.get('oppmoetested') as string,
          slutt_tidspunkt: sluttRaw ? datetimeLocalTilIso(sluttRaw) : undefined,
          destinasjon: fd.get('destinasjon') as string,
          pris_per_person: fd.get('pris_per_person') ? parseInt(fd.get('pris_per_person') as string) : undefined,
          sensurerte_felt: sensurert,
          bilde_url: bildeUrl || undefined,
        })
        router.push(`/arrangementer/${arr.id}`)
      } catch {
        setFeil('Noe gikk galt. Prøv igjen.')
      }
    })
  }

  function handleSlett() {
    startTransition(async () => {
      await slettArrangement(arr.id as string)
    })
  }

  return (
    <>
      <SkjemaBar
        tittel="Rediger arrangement"
        onAvbryt={() => router.back()}
        onLagre={handleSubmit}
        lagrer={isPending}
      />

      <form className="space-y-5 px-5 pt-5 pb-4">
        {/* Bilde */}
        <BildeVelger bildeUrl={bildeUrl} onBildeUrl={setBildeUrl} />

        <Card>
          <div className="space-y-4">
            <div>
              <label htmlFor="tittel" className="block mb-1.5" style={labelStil}>Tittel</label>
              <input id="tittel" name="tittel" type="text" required defaultValue={arr.tittel as string} style={inputStil} />
            </div>

            <div>
              <label htmlFor="beskrivelse" className="block mb-1.5" style={labelStil}>Beskrivelse</label>
              <textarea id="beskrivelse" name="beskrivelse" rows={3} defaultValue={(arr.beskrivelse as string) ?? ''} style={{ ...inputStil, resize: 'vertical' as const }} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <label htmlFor="start_tidspunkt" className="block mb-1.5" style={labelStil}>
                {erTur ? 'Avreise' : 'Dato og tid'}
              </label>
              <input id="start_tidspunkt" name="start_tidspunkt" type="datetime-local" required defaultValue={isoTilDatetimeLocal(arr.start_tidspunkt as string)} style={inputStil} />
            </div>

            {erTur && (
              <div>
                <label htmlFor="slutt_tidspunkt" className="block mb-1.5" style={labelStil}>Hjemkomst</label>
                <input id="slutt_tidspunkt" name="slutt_tidspunkt" type="datetime-local" defaultValue={isoTilDatetimeLocal(arr.slutt_tidspunkt as string)} style={inputStil} />
              </div>
            )}

            <div>
              <label htmlFor="oppmoetested" className="block mb-1.5" style={labelStil}>Oppmøtested</label>
              <input id="oppmoetested" name="oppmoetested" type="text" defaultValue={(arr.oppmoetested as string) ?? ''} style={inputStil} />
            </div>

            {erTur && (
              <>
                <TurFelt felt="destinasjon" label="Destinasjon" hemmelig={!!sensurert['destinasjon']} onToggle={() => toggleSensurert('destinasjon')} defaultValue={(arr.destinasjon as string) ?? ''} />
                <TurFelt felt="pris_per_person" label="Pris per person (kr)" type="number" hemmelig={!!sensurert['pris_per_person']} onToggle={() => toggleSensurert('pris_per_person')} defaultValue={(arr.pris_per_person as number) ?? ''} />
              </>
            )}
          </div>
        </Card>

        {feil && <p className="text-sm px-1" style={{ color: 'var(--danger)' }}>{feil}</p>}
      </form>

      {/* Faresone */}
      <div className="px-5 pb-8">
        <Card className="border-danger">
          <div style={{ borderTop: '1px solid var(--danger-subtle)' }}>
            {!visSlett ? (
              <Button variant="destructive" fullWidth onClick={() => setVisSlett(true)}>Slett arrangement</Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Er du sikker? Dette kan ikke angres.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setVisSlett(false)}>Avbryt</Button>
                  <Button variant="destructive" fullWidth disabled={isPending} onClick={handleSlett}>
                    {isPending ? 'Sletter...' : 'Ja, slett'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
