'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { opprettKaaringspoll } from '@/lib/actions/kaaringspoll'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import Icon from '@/components/ui/Icon'
import { formaterDato, datetimeLocalTilIso } from '@/lib/dato'

type Mal = {
  id: string
  navn: string
  kandidat_kilde: string
}

const monoLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9.5,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  marginBottom: 4,
}

const inputStil: CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  outline: 'none',
  padding: 0,
}

function Rad({ last, children }: { last?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 4px',
        borderBottom: last ? 'none' : '0.5px solid var(--border-subtle)',
      }}
    >
      {children}
    </div>
  )
}

// Default svarfrist: én uke frem kl 20:00.
function defaultFrist(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const iso = d.toISOString()
  return `${formaterDato(iso, 'yyyy-MM-dd')}T20:00`
}

type Props = {
  maler: Mal[]
  defaultAar: number
  medlemAntall: number
  moeteAntall: number
}

export default function OpprettSkjema({ maler, defaultAar, medlemAntall, moeteAntall }: Props) {
  const [malId, setMalId] = useState(maler[0]?.id ?? '')
  const [aar, setAar] = useState(defaultAar)
  const [frist, setFrist] = useState(defaultFrist())
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const valgtMal = maler.find(m => m.id === malId)
  const antallKandidater = valgtMal?.kandidat_kilde === 'arrangement_moete' ? moeteAntall : medlemAntall
  const forFaaKandidater = antallKandidater < 2

  function handlePubliser() {
    setFeil('')
    if (!malId) {
      setFeil('Velg en kåringsmal.')
      return
    }
    if (!frist) {
      setFeil('Sett en svarfrist.')
      return
    }
    if (forFaaKandidater) {
      setFeil(`Trenger minst 2 kandidater (fant ${antallKandidater}).`)
      return
    }
    startTransition(async () => {
      try {
        await opprettKaaringspoll({
          kaaringMalId: malId,
          aar,
          svarfrist: datetimeLocalTilIso(frist),
        })
      } catch (err) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'digest' in err &&
          typeof (err as Record<string, unknown>).digest === 'string' &&
          ((err as Record<string, unknown>).digest as string).startsWith('NEXT_REDIRECT')
        ) {
          throw err
        }
        setFeil(err instanceof Error ? err.message : 'Noe gikk galt.')
      }
    })
  }

  if (maler.length === 0) {
    return (
      <div style={{ padding: '40px 20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          Ingen ledige kåringsmaler for {defaultAar} — alle har allerede en poll, eller ingen
          maler er definert.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <SkjemaBar
        overtittel="Ny"
        tittel={valgtMal ? `${valgtMal.navn} ${aar}` : 'Kåring'}
        onAvbryt={() => router.back()}
        onLagre={handlePubliser}
        lagreLabel="Publiser"
        laster={isPending}
      />

      <SkjemaSeksjon label="Kåring">
        <Rad last>
          <div style={monoLabel}>Mal</div>
          <select
            value={malId}
            onChange={e => setMalId(e.target.value)}
            style={{ ...inputStil, fontSize: 16 }}
          >
            {maler.map(m => (
              <option key={m.id} value={m.id}>
                {m.navn}
              </option>
            ))}
          </select>
        </Rad>
      </SkjemaSeksjon>

      <SkjemaSeksjon label="Innstillinger">
        <Rad>
          <div style={monoLabel}>År</div>
          <input
            type="number"
            min={2008}
            max={2100}
            value={aar}
            onChange={e => setAar(parseInt(e.target.value || `${defaultAar}`, 10))}
            style={inputStil}
          />
        </Rad>
        <Rad last>
          <div style={monoLabel}>Svarfrist</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="datetime-local"
              value={frist}
              onChange={e => setFrist(e.target.value)}
              style={{ ...inputStil, flex: 1 }}
            />
            <Icon name="calendar" size={15} color="var(--text-tertiary)" />
          </div>
        </Rad>
      </SkjemaSeksjon>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 'var(--radius-card)',
          background: forFaaKandidater ? 'rgba(220,80,80,0.08)' : 'var(--bg-elevated)',
          color: forFaaKandidater ? 'var(--danger)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        {valgtMal?.kandidat_kilde === 'arrangement_moete'
          ? `${antallKandidater} møte${antallKandidater === 1 ? '' : 'r'} blir kandidater.`
          : `${antallKandidater} medlem${antallKandidater === 1 ? '' : 'mer'} blir kandidater.`}
        {forFaaKandidater && ' Trenger minst 2.'}
      </div>

      {feil && (
        <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 12 }}>{feil}</p>
      )}
    </div>
  )
}
