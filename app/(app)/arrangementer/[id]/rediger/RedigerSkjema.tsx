'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { oppdaterArrangement, slettArrangement } from '@/lib/actions/arrangementer'
import TurFelt from '@/components/TurFelt'
import Button from '@/components/ui/Button'

const inputStil: React.CSSProperties = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
  fontFamily: 'inherit',
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
          bilde_url: (fd.get('bilde_url') as string) || undefined,
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
          <label htmlFor="tittel" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tittel</label>
          <input id="tittel" name="tittel" type="text" required defaultValue={arr.tittel as string} style={inputStil} />
        </div>

        <div>
          <label htmlFor="beskrivelse" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Beskrivelse</label>
          <textarea id="beskrivelse" name="beskrivelse" rows={3} defaultValue={(arr.beskrivelse as string) ?? ''} style={{ ...inputStil, resize: 'vertical' as const }} />
        </div>

        {/* Bilde-URL */}
        <div>
          <label htmlFor="bilde_url" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Bilde (URL)
          </label>
          <input id="bilde_url" name="bilde_url" type="url" defaultValue={(arr.bilde_url as string) ?? ''} placeholder="Lim inn lenke til bilde (valgfritt)" style={inputStil} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Uten bilde brukes standard klubb-bilde</p>
        </div>

        <div>
          <label htmlFor="start_tidspunkt" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {erTur ? 'Avreise' : 'Dato og tid'}
          </label>
          <input id="start_tidspunkt" name="start_tidspunkt" type="datetime-local" required defaultValue={toDatetimeLocal(arr.start_tidspunkt as string)} style={inputStil} />
        </div>

        {erTur && (
          <div>
            <label htmlFor="slutt_tidspunkt" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Hjemkomst</label>
            <input id="slutt_tidspunkt" name="slutt_tidspunkt" type="datetime-local" defaultValue={toDatetimeLocal(arr.slutt_tidspunkt as string)} style={inputStil} />
          </div>
        )}

        <div>
          <label htmlFor="oppmoetested" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Oppmøtested</label>
          <input id="oppmoetested" name="oppmoetested" type="text" defaultValue={(arr.oppmoetested as string) ?? ''} style={inputStil} />
        </div>

        {erTur && (
          <>
            <TurFelt felt="destinasjon" label="Destinasjon" hemmelig={!!sensurert['destinasjon']} onToggle={() => toggleSensurert('destinasjon')} defaultValue={(arr.destinasjon as string) ?? ''} />
            <TurFelt felt="pris_per_person" label="Pris per person (kr)" type="number" hemmelig={!!sensurert['pris_per_person']} onToggle={() => toggleSensurert('pris_per_person')} defaultValue={(arr.pris_per_person as number) ?? ''} />
          </>
        )}

        {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={() => router.back()}>Avbryt</Button>
          <Button type="submit" fullWidth disabled={isPending}>{isPending ? 'Lagrer...' : 'Lagre'}</Button>
        </div>
      </form>

      {/* Slett-seksjon */}
      <div className="border-t pt-6 pb-8" style={{ borderColor: 'var(--border)' }}>
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
    </>
  )
}
