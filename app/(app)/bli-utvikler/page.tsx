'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import Icon from '@/components/ui/Icon'

const labelStil: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9.5,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '1.6px',
  marginBottom: 6,
}

const textareaStil: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  color: 'var(--text-primary)',
  lineHeight: 1.55,
  resize: 'vertical',
  minHeight: 180,
}

export default function BliUtvikler() {
  const [tekst, setTekst] = useState('')
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const [sendt, setSendt] = useState(false)
  const router = useRouter()

  async function handleSend() {
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
      <div style={{ padding: '0 20px 120px' }}>
        <div
          style={{
            marginTop: 40,
            padding: '32px 24px',
            textAlign: 'center',
            background:
              'radial-gradient(ellipse at top, var(--accent-soft), transparent 70%), var(--bg-elevated)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            backdropFilter: 'var(--blur-card)',
            WebkitBackdropFilter: 'var(--blur-card)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              marginBottom: 18,
            }}
          >
            <Icon name="sparkle" size={24} color="var(--accent)" strokeWidth={1.8} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Mottatt
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.4px',
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 10,
              color: 'var(--text-primary)',
            }}
          >
            Takk, Herre
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: 26,
            }}
          >
            Ønsket ditt er lagt i ei krokke majjones. Vi ser på det så fort vi får tid.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 999,
              background: 'var(--accent)',
              color: '#0a0a0a',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tilbake til tidslinjen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <SkjemaBar
        overtittel="Innspill"
        tittel="Til appen"
        onAvbryt={() => router.back()}
        onLagre={handleSend}
        lagreLabel="Send"
        laster={laster}
      />

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          marginBottom: 18,
        }}
      >
        Savner du noe? Opplever du feil? Har du en idé? Skriv hva du ønsker
        deg, så havner det hos utviklerne ved neste anledning.
      </p>

      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          background: 'color-mix(in srgb, var(--accent) 9%, transparent)',
          border: '0.5px solid color-mix(in srgb, var(--accent) 40%, transparent)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Vær konkret
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          Beskriv hva du vil og hvorfor — jo mer konkret, jo enklere å gjøre noe med.
        </div>
      </div>

      <SkjemaSeksjon label="Innspill">
        <div style={{ padding: '10px 4px' }}>
          <div style={labelStil}>Hva ønsker du deg?</div>
          <style>{`textarea.innspill-felt::placeholder { color: var(--text-tertiary); opacity: 0.7; font-style: italic; }`}</style>
          <textarea
            className="innspill-felt"
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            required
            rows={8}
            placeholder="F.eks. «Jeg skulle ønske at varsler for nye arrangementer også kunne sendes på SMS, fordi push-varsler av og til forsvinner…»"
            style={textareaStil}
          />
        </div>
      </SkjemaSeksjon>

      {feil && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            border: '0.5px solid color-mix(in srgb, var(--danger) 40%, transparent)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--danger)',
          }}
        >
          {feil}
        </div>
      )}
    </div>
  )
}
