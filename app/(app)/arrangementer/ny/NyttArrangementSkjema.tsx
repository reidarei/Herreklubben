'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { opprettArrangement } from '@/lib/actions/arrangementer'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import Segment from '@/components/ui/Segment'
import { MiniToggle } from '@/components/ui/ToggleSwitch'
import Icon from '@/components/ui/Icon'
import Placeholder from '@/components/ui/Placeholder'
import BildeVelger from '@/components/BildeVelger'
import { formaterDato, datetimeLocalTilIso } from '@/lib/dato'

type Ansvar = { id: string; arrangement_navn: string; aar: number }

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

const accentStil: CSSProperties = {
  ...inputStil,
  fontFamily: 'var(--font-display)',
  fontSize: 19,
  fontWeight: 500,
  letterSpacing: '-0.3px',
}

function Rad({
  last,
  children,
}: {
  last?: boolean
  children: React.ReactNode
}) {
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

export default function NyttArrangementSkjema({ uoppfyltAnsvar }: { uoppfyltAnsvar: Ansvar[] }) {
  const foreslattTittel = uoppfyltAnsvar.length === 1 ? uoppfyltAnsvar[0].arrangement_navn : ''
  const standardStart = `${formaterDato(new Date().toISOString(), 'yyyy-MM-dd')}T17:00`

  const [type, setType] = useState<'moete' | 'tur'>('moete')
  const [tittel, setTittel] = useState(foreslattTittel)
  const [beskrivelse, setBeskrivelse] = useState('')
  const [start, setStart] = useState(standardStart)
  const [slutt, setSlutt] = useState('')
  const [oppmoetested, setOppmoetested] = useState('')
  const [destinasjon, setDestinasjon] = useState('')
  const [pris, setPris] = useState('')
  const [sensurert, setSensurert] = useState<Record<string, boolean>>({})
  const [bildeUrl, setBildeUrl] = useState<string | null>(null)
  const [visBildeVelger, setVisBildeVelger] = useState(false)
  const [valgtAnsvar, setValgtAnsvar] = useState(
    uoppfyltAnsvar.length === 1 ? uoppfyltAnsvar[0].id : '',
  )
  const [feil, setFeil] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const erTur = type === 'tur'

  function toggleSensurert(felt: string) {
    setSensurert(prev => ({ ...prev, [felt]: !prev[felt] }))
  }

  function handlePubliser() {
    setFeil('')
    if (!tittel.trim()) {
      setFeil('Tittel må fylles ut.')
      return
    }
    if (!start) {
      setFeil(erTur ? 'Avreise må fylles ut.' : 'Dato og tid må fylles ut.')
      return
    }

    startTransition(async () => {
      try {
        await opprettArrangement({
          type,
          tittel,
          beskrivelse,
          start_tidspunkt: datetimeLocalTilIso(start),
          slutt_tidspunkt: slutt ? datetimeLocalTilIso(slutt) : undefined,
          oppmoetested,
          destinasjon,
          pris_per_person: pris ? parseInt(pris) : undefined,
          sensurerte_felt: sensurert,
          bilde_url: bildeUrl || undefined,
          ansvar_id: valgtAnsvar || undefined,
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
        setFeil('Noe gikk galt. Prøv igjen.')
      }
    })
  }

  const typeOptions = [
    { value: 'tur' as const, label: 'Tur' },
    { value: 'moete' as const, label: 'Møte' },
  ]

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <SkjemaBar
        overtittel="Nytt"
        tittel={tittel || 'Arrangement'}
        onAvbryt={() => router.back()}
        onLagre={handlePubliser}
        lagreLabel="Publiser"
        laster={isPending}
      />

      {/* Hero-bilde med bytt-knapp */}
      <div
        style={{
          position: 'relative',
          marginBottom: 20,
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {bildeUrl ? (
          <div style={{ position: 'relative', aspectRatio: '16/9' }}>
            <Image
              src={bildeUrl}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>
        ) : (
          <Placeholder label="Arrangement bilde" aspectRatio="16/9" type={erTur ? 'tur' : 'møte'} />
        )}
        <button
          type="button"
          onClick={() => setVisBildeVelger(v => !v)}
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(10,10,12,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--text-primary)',
            border: '0.5px solid var(--border)',
            padding: '7px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          {bildeUrl ? 'Bytt bilde' : 'Legg til bilde'}
        </button>
      </div>

      {visBildeVelger && (
        <div style={{ marginBottom: 20 }}>
          <BildeVelger bildeUrl={bildeUrl} onBildeUrl={setBildeUrl} />
        </div>
      )}

      {/* Arrangøransvar-kobling */}
      {uoppfyltAnsvar.length > 0 && (
        <SkjemaSeksjon label="Arrangøransvar">
          <Rad last>
            {uoppfyltAnsvar.length === 1 ? (
              <>
                <div style={monoLabel}>Kobles til</div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                  }}
                >
                  {uoppfyltAnsvar[0].arrangement_navn}{' '}
                  <span style={{ color: 'var(--text-tertiary)' }}>({uoppfyltAnsvar[0].aar})</span>
                </div>
              </>
            ) : (
              <>
                <div style={monoLabel}>Koble til ansvar</div>
                <select
                  value={valgtAnsvar}
                  onChange={e => setValgtAnsvar(e.target.value)}
                  style={{
                    ...inputStil,
                    fontSize: 14,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Ingen</option>
                  {uoppfyltAnsvar.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.arrangement_navn} ({a.aar})
                    </option>
                  ))}
                </select>
              </>
            )}
          </Rad>
        </SkjemaSeksjon>
      )}

      {/* Type */}
      <SkjemaSeksjon label="Type">
        <Segment value={type} options={typeOptions} onChange={setType} />
      </SkjemaSeksjon>

      {/* Detaljer */}
      <SkjemaSeksjon label="Detaljer">
        <Rad>
          <div style={monoLabel}>Tittel</div>
          <input
            type="text"
            value={tittel}
            onChange={e => setTittel(e.target.value)}
            style={accentStil}
            placeholder="Navn på arrangementet"
          />
        </Rad>

        <Rad>
          <div style={monoLabel}>{erTur ? 'Avreise' : 'Start'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="datetime-local"
              value={start}
              onChange={e => setStart(e.target.value)}
              style={{ ...inputStil, flex: 1 }}
            />
            <Icon name="calendar" size={15} color="var(--text-tertiary)" />
          </div>
        </Rad>

        {erTur && (
          <Rad>
            <div style={monoLabel}>Hjemkomst</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="datetime-local"
                value={slutt}
                onChange={e => setSlutt(e.target.value)}
                style={{ ...inputStil, flex: 1 }}
              />
              <Icon name="calendar" size={15} color="var(--text-tertiary)" />
            </div>
          </Rad>
        )}

        <Rad last={!erTur}>
          <div style={monoLabel}>Oppmøtested</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="text"
              value={oppmoetested}
              onChange={e => setOppmoetested(e.target.value)}
              style={{ ...inputStil, flex: 1 }}
              placeholder="—"
            />
            <Icon name="mapPin" size={15} color="var(--text-tertiary)" />
          </div>
        </Rad>

        {erTur && (
          <Rad last>
            <div style={monoLabel}>Destinasjon</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                value={destinasjon}
                onChange={e => setDestinasjon(e.target.value)}
                style={{ ...inputStil, flex: 1 }}
                placeholder="—"
              />
              <MiniToggle
                on={!!sensurert['destinasjon']}
                onChange={() => toggleSensurert('destinasjon')}
                ariaLabel="Sladd destinasjon"
              />
            </div>
          </Rad>
        )}
      </SkjemaSeksjon>

      {/* Kostnad — kun for tur */}
      {erTur && (
        <SkjemaSeksjon label="Kostnad">
          <Rad last>
            <div style={monoLabel}>Pris per person</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1 }}>
                <input
                  type="number"
                  value={pris}
                  onChange={e => setPris(e.target.value)}
                  style={{ ...accentStil, flex: 1 }}
                  placeholder="0"
                  inputMode="numeric"
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '1.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  kr
                </span>
              </div>
              <MiniToggle
                on={!!sensurert['pris_per_person']}
                onChange={() => toggleSensurert('pris_per_person')}
                ariaLabel="Sladd pris"
              />
            </div>
          </Rad>
        </SkjemaSeksjon>
      )}

      {/* Beskrivelse */}
      <SkjemaSeksjon label="Beskrivelse">
        <textarea
          value={beskrivelse}
          onChange={e => setBeskrivelse(e.target.value)}
          rows={4}
          style={{
            ...inputStil,
            padding: '4px 0',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            resize: 'vertical',
            minHeight: 88,
            fontFamily: 'var(--font-body)',
          }}
          placeholder="Skriv noe om arrangementet…"
        />
      </SkjemaSeksjon>

      {feil && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--danger)',
            marginTop: -8,
            marginBottom: 16,
          }}
        >
          {feil}
        </p>
      )}
    </div>
  )
}
