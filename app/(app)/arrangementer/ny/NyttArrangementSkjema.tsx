'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { opprettArrangement } from '@/lib/actions/arrangementer'
import TurFelt from '@/components/TurFelt'

type Ansvar = { id: string; arrangement_navn: string; aar: number }

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

export default function NyttArrangementSkjema({ uoppfyltAnsvar }: { uoppfyltAnsvar: Ansvar[] }) {
  const [type, setType] = useState<'moete' | 'tur'>('moete')
  const [sensurert, setSensurert] = useState<Record<string, boolean>>({})
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Foreslå tittel fra ansvar hvis det finnes ett
  const foreslattTittel = uoppfyltAnsvar.length === 1 ? uoppfyltAnsvar[0].arrangement_navn : ''
  const [valgtAnsvar, setValgtAnsvar] = useState(uoppfyltAnsvar.length === 1 ? uoppfyltAnsvar[0].id : '')

  function toggleSensurert(felt: string) {
    setSensurert(prev => ({ ...prev, [felt]: !prev[felt] }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeil('')
    const form = e.currentTarget
    const fd = new FormData(form)

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
          ansvar_id: valgtAnsvar || undefined,
        })
      } catch (err) {
        setFeil('Noe gikk galt. Prøv igjen.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Type */}
      <div>
        <label style={labelStil}>Type arrangement</label>
        <div className="flex gap-2">
          {(['moete', 'tur'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              style={{
                background: type === t ? 'var(--aksent)' : 'var(--bakgrunn-kort)',
                border: `1px solid ${type === t ? 'var(--aksent)' : 'var(--border)'}`,
                color: type === t ? '#fff' : 'var(--tekst-dempet)',
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
          background: 'rgba(193,127,36,0.1)',
          border: '1px solid rgba(193,127,36,0.3)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
        }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--aksent-lys)' }}>
            Du har uoppfylt arrangøransvar
          </p>
          {uoppfyltAnsvar.length === 1 ? (
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
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
        <label htmlFor="tittel" style={labelStil}>Tittel</label>
        <input
          id="tittel"
          name="tittel"
          type="text"
          required
          defaultValue={foreslattTittel}
          style={inputStil}
        />
      </div>

      {/* Beskrivelse */}
      <div>
        <label htmlFor="beskrivelse" style={labelStil}>Beskrivelse</label>
        <textarea
          id="beskrivelse"
          name="beskrivelse"
          rows={3}
          style={{ ...inputStil, resize: 'vertical' }}
        />
      </div>

      {/* Start-tidspunkt */}
      <div>
        <label htmlFor="start_tidspunkt" style={labelStil}>
          {type === 'tur' ? 'Avreise' : 'Dato og tid'}
        </label>
        <input
          id="start_tidspunkt"
          name="start_tidspunkt"
          type="datetime-local"
          required
          style={inputStil}
        />
      </div>

      {/* Slutt-tidspunkt (kun tur) */}
      {type === 'tur' && (
        <div>
          <label htmlFor="slutt_tidspunkt" style={labelStil}>Hjemkomst</label>
          <input
            id="slutt_tidspunkt"
            name="slutt_tidspunkt"
            type="datetime-local"
            style={inputStil}
          />
        </div>
      )}

      {/* Oppmøtested */}
      <div>
        <label htmlFor="oppmoetested" style={labelStil}>Oppmøtested</label>
        <input
          id="oppmoetested"
          name="oppmoetested"
          type="text"
          style={inputStil}
        />
      </div>

      {/* Tur-spesifikke felter */}
      {type === 'tur' && (
        <>
          <TurFelt
            felt="destinasjon"
            label="Destinasjon"
            hemmelig={!!sensurert['destinasjon']}
            onToggle={() => toggleSensurert('destinasjon')}
            inputStil={inputStil}
          />
          <TurFelt
            felt="pris_per_person"
            label="Pris per person (kr)"
            type="number"
            hemmelig={!!sensurert['pris_per_person']}
            onToggle={() => toggleSensurert('pris_per_person')}
            inputStil={inputStil}
          />
        </>
      )}

      {feil && <p className="text-sm" style={{ color: '#f87171' }}>{feil}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: 'var(--aksent)' }}
        >
          {isPending ? 'Lagrer...' : 'Publiser'}
        </button>
      </div>
    </form>
  )
}
