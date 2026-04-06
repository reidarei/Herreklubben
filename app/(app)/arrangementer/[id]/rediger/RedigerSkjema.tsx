'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { oppdaterArrangement, slettArrangement } from '@/lib/actions/arrangementer'
import TurFelt from '@/components/TurFelt'

const inputStil = {
  background: 'var(--bakgrunn-kort)',
  border: '1px solid var(--border)',
  color: 'var(--tekst)',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
}

const labelStil = {
  display: 'block',
  fontSize: '0.875rem',
  color: 'var(--tekst-dempet)',
  marginBottom: '0.375rem',
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 16)
}

export default function RedigerSkjema({ arrangement: arr }: { arrangement: Record<string, unknown> }) {
  const erTur = arr.type === 'tur'
  const [sensurert, setSensurert] = useState<Record<string, boolean>>(
    (arr.sensurerte_felt as Record<string, boolean>) ?? {}
  )
  const [visSlett, setVisSlett] = useState(false)
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleSensurert(felt: string) {
    setSensurert(prev => ({ ...prev, [felt]: !prev[felt] }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeil('')
    const fd = new FormData(e.currentTarget)
    const startRaw = fd.get('start_tidspunkt') as string
    const sluttRaw = fd.get('slutt_tidspunkt') as string

    startTransition(async () => {
      try {
        await oppdaterArrangement(arr.id as string, {
          tittel: fd.get('tittel') as string,
          beskrivelse: fd.get('beskrivelse') as string,
          start_tidspunkt: startRaw ? new Date(startRaw).toISOString() : undefined,
          oppmoetested: fd.get('oppmoetested') as string,
          slutt_tidspunkt: sluttRaw ? new Date(sluttRaw).toISOString() : undefined,
          destinasjon: fd.get('destinasjon') as string,
          pris_per_person: fd.get('pris_per_person') ? parseInt(fd.get('pris_per_person') as string) : undefined,
          sensurerte_felt: sensurert,
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
      <form onSubmit={handleSubmit} className="space-y-5 pb-8">
        <div>
          <label htmlFor="tittel" style={labelStil}>Tittel</label>
          <input id="tittel" name="tittel" type="text" required defaultValue={arr.tittel as string} style={inputStil} />
        </div>

        <div>
          <label htmlFor="beskrivelse" style={labelStil}>Beskrivelse</label>
          <textarea id="beskrivelse" name="beskrivelse" rows={3} defaultValue={(arr.beskrivelse as string) ?? ''} style={{ ...inputStil, resize: 'vertical' }} />
        </div>

        <div>
          <label htmlFor="start_tidspunkt" style={labelStil}>{erTur ? 'Avreise' : 'Dato og tid'}</label>
          <input id="start_tidspunkt" name="start_tidspunkt" type="datetime-local" required defaultValue={toDatetimeLocal(arr.start_tidspunkt as string)} style={inputStil} />
        </div>

        {erTur && (
          <div>
            <label htmlFor="slutt_tidspunkt" style={labelStil}>Hjemkomst</label>
            <input id="slutt_tidspunkt" name="slutt_tidspunkt" type="datetime-local" defaultValue={toDatetimeLocal(arr.slutt_tidspunkt as string)} style={inputStil} />
          </div>
        )}

        <div>
          <label htmlFor="oppmoetested" style={labelStil}>Oppmøtested</label>
          <input id="oppmoetested" name="oppmoetested" type="text" defaultValue={(arr.oppmoetested as string) ?? ''} style={inputStil} />
        </div>

        {erTur && (
          <>
            <TurFelt
              felt="destinasjon"
              label="Destinasjon"
              hemmelig={!!sensurert['destinasjon']}
              onToggle={() => toggleSensurert('destinasjon')}
              defaultValue={(arr.destinasjon as string) ?? ''}
              inputStil={inputStil}
            />
            <TurFelt
              felt="pris_per_person"
              label="Pris per person (kr)"
              type="number"
              hemmelig={!!sensurert['pris_per_person']}
              onToggle={() => toggleSensurert('pris_per_person')}
              defaultValue={(arr.pris_per_person as number) ?? ''}
              inputStil={inputStil}
            />
          </>
        )}

        {feil && <p className="text-sm" style={{ color: '#f87171' }}>{feil}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}>
            Avbryt
          </button>
          <button type="submit" disabled={isPending} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: 'var(--aksent)' }}>
            {isPending ? 'Lagrer...' : 'Lagre'}
          </button>
        </div>
      </form>

      {/* Slett-seksjon */}
      <div className="border-t pt-6 pb-8" style={{ borderColor: 'var(--border)' }}>
        {!visSlett ? (
          <button onClick={() => setVisSlett(true)} className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: '#f87171' }}>
            Slett arrangement
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center" style={{ color: 'var(--tekst-dempet)' }}>Er du sikker? Dette kan ikke angres.</p>
            <div className="flex gap-3">
              <button onClick={() => setVisSlett(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}>
                Avbryt
              </button>
              <button onClick={handleSlett} disabled={isPending} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
                style={{ background: '#7f1d1d' }}>
                {isPending ? 'Sletter...' : 'Ja, slett'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
