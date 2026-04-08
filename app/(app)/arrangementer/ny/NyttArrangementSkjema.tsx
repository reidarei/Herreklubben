'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { opprettArrangement } from '@/lib/actions/arrangementer'
import TurFelt from '@/components/TurFelt'
import BildeVelger from '@/components/BildeVelger'
import Button from '@/components/ui/Button'

type Ansvar = { id: string; arrangement_navn: string; aar: number }

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

export default function NyttArrangementSkjema({ uoppfyltAnsvar }: { uoppfyltAnsvar: Ansvar[] }) {
  const [type, setType] = useState<'moete' | 'tur'>('moete')
  const [sensurert, setSensurert] = useState<Record<string, boolean>>({})
  const [bildeUrl, setBildeUrl] = useState<string | null>(null)
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const foreslattTittel = uoppfyltAnsvar.length === 1 ? uoppfyltAnsvar[0].arrangement_navn : ''
  const [valgtAnsvar, setValgtAnsvar] = useState(uoppfyltAnsvar.length === 1 ? uoppfyltAnsvar[0].id : '')

  function toggleSensurert(felt: string) {
    setSensurert(prev => ({ ...prev, [felt]: !prev[felt] }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeil('')
    const fd = new FormData(e.currentTarget)
    const startRaw = fd.get('start_tidspunkt') as string
    const sluttRaw = fd.get('slutt_tidspunkt') as string
    const prisRaw = fd.get('pris_per_person') as string

    startTransition(async () => {
      try {
        await opprettArrangement({
          type,
          tittel: fd.get('tittel') as string,
          beskrivelse: fd.get('beskrivelse') as string,
          start_tidspunkt: startRaw ? new Date(startRaw).toISOString() : '',
          oppmoetested: fd.get('oppmoetested') as string,
          slutt_tidspunkt: sluttRaw ? new Date(sluttRaw).toISOString() : undefined,
          destinasjon: fd.get('destinasjon') as string,
          pris_per_person: prisRaw ? parseInt(prisRaw) : undefined,
          sensurerte_felt: sensurert,
          bilde_url: bildeUrl || undefined,
          ansvar_id: valgtAnsvar || undefined,
        })
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'digest' in err &&
            typeof (err as Record<string, unknown>).digest === 'string' &&
            ((err as Record<string, unknown>).digest as string).startsWith('NEXT_REDIRECT')) {
          throw err
        }
        setFeil('Noe gikk galt. Prøv igjen.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Type arrangement
        </label>
        <div className="flex gap-2">
          {(['moete', 'tur'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              style={{
                background: type === t ? 'var(--accent)' : 'var(--bg-elevated)',
                border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                color: type === t ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {t === 'moete' ? 'Møte' : 'Tur'}
            </button>
          ))}
        </div>
      </div>

      {/* Ansvar-kobling */}
      {uoppfyltAnsvar.length > 0 && (
        <div style={{
          background: 'var(--accent-subtle)',
          border: '1px solid rgba(212,168,83,0.3)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
        }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
            Du har uoppfylt arrangøransvar
          </p>
          {uoppfyltAnsvar.length === 1 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Kobler til: {uoppfyltAnsvar[0].arrangement_navn} ({uoppfyltAnsvar[0].aar})
            </p>
          ) : (
            <select
              value={valgtAnsvar}
              onChange={e => setValgtAnsvar(e.target.value)}
              style={{ ...inputStil, padding: '0.5rem 0.75rem' }}
            >
              <option value="">Velg ansvar å koble til (valgfritt)</option>
              {uoppfyltAnsvar.map(a => (
                <option key={a.id} value={a.id}>{a.arrangement_navn} ({a.aar})</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Tittel */}
      <div>
        <label htmlFor="tittel" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tittel</label>
        <input id="tittel" name="tittel" type="text" required defaultValue={foreslattTittel} style={inputStil} />
      </div>

      {/* Beskrivelse */}
      <div>
        <label htmlFor="beskrivelse" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Beskrivelse</label>
        <textarea id="beskrivelse" name="beskrivelse" rows={3} style={{ ...inputStil, resize: 'vertical' as const }} />
      </div>

      {/* Bildeopplasting */}
      <BildeVelger bildeUrl={bildeUrl} onBildeUrl={setBildeUrl} />

      {/* Start-tidspunkt */}
      <div>
        <label htmlFor="start_tidspunkt" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {type === 'tur' ? 'Avreise' : 'Dato og tid'}
        </label>
        <input id="start_tidspunkt" name="start_tidspunkt" type="datetime-local" required defaultValue={`${new Date().toISOString().slice(0, 10)}T17:00`} style={inputStil} />
      </div>

      {type === 'tur' && (
        <div>
          <label htmlFor="slutt_tidspunkt" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Hjemkomst</label>
          <input id="slutt_tidspunkt" name="slutt_tidspunkt" type="datetime-local" style={inputStil} />
        </div>
      )}

      {/* Oppmøtested */}
      <div>
        <label htmlFor="oppmoetested" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Oppmøtested</label>
        <input id="oppmoetested" name="oppmoetested" type="text" style={inputStil} />
      </div>

      {/* Tur-spesifikke felter */}
      {type === 'tur' && (
        <>
          <TurFelt felt="destinasjon" label="Destinasjon" hemmelig={!!sensurert['destinasjon']} onToggle={() => toggleSensurert('destinasjon')} />
          <TurFelt felt="pris_per_person" label="Pris per person (kr)" type="number" hemmelig={!!sensurert['pris_per_person']} onToggle={() => toggleSensurert('pris_per_person')} />
        </>
      )}

      {feil && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{feil}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={() => router.back()}>Avbryt</Button>
        <Button type="submit" fullWidth disabled={isPending}>{isPending ? 'Lagrer...' : 'Publiser'}</Button>
      </div>
    </form>
  )
}
