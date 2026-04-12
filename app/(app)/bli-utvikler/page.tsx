'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function BliUtvikler() {
  const [tekst, setTekst] = useState('')
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const [sendt, setSendt] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tekst.trim().length < 5) {
      setFeil('Skriv litt mer — hva er det du savner?')
      return
    }
    setLaster(true)
    setFeil('')

    const res = await fetch('/api/bli-utvikler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tekst }),
    })

    const data = await res.json()
    setLaster(false)

    if (!res.ok) {
      setFeil(data.feil ?? 'Noe gikk galt')
    } else {
      setSendt(true)
    }
  }

  if (sendt) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-6">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="flex justify-center mb-3">
            <SparklesIcon className="w-10 h-10" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            Takk, Herre!
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Ønsket ditt lagt i ei krokke majjones. Vi ser på det så fort vi får tid.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl font-semibold"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            Tilbake til tidslinjen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </button>
      </div>

      <h1
        className="text-[26px] font-bold mb-2"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.4px' }}
      >
        Bidra til en bedre app
      </h1>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Savner du noe i Herreklubb-appen? Skriv hva du ønsker deg — en ny funksjon,
        en forbedring, en bug du har opplevd, eller bare en idé. Ønsket sendes til
        utviklerne som ser på det ved neste anledning.
      </p>
      <div
        className="rounded-xl px-4 py-3 mb-6 text-sm leading-relaxed"
        style={{
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Vær konkret</span>{' '}
        <br />
        Vær så konkret som mulig, så det blir enkelt å gjennomføre endringen. Beskriv hva du vil og hvorfor.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm mb-1.5 font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Hva ønsker du deg?
          </label>
          <textarea
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            required
            rows={8}
            placeholder="F.eks. «Jeg skulle ønske det var en tilbakemeldingsknapp i appen. Når man trykker på denne, skal man komme inn i et skjema der man kan skrive inn ønsket sitt og trykke på en knapp som heter Send inn ønske. Når man trykker på knappen, skal man få en kvittering, og ønsket sendes til utviklerne.»"
            style={{
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1rem',
              width: '100%',
              fontSize: '15px',
              lineHeight: 1.5,
              resize: 'vertical',
              minHeight: '160px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {feil && (
          <p className="text-sm" style={{ color: 'var(--destructive)' }}>
            {feil}
          </p>
        )}

        <button
          type="submit"
          disabled={laster}
          className="w-full py-3 rounded-xl font-semibold disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          {laster ? 'Sender...' : 'Send inn ønske'}
        </button>
      </form>
    </div>
  )
}
