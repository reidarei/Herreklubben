'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { oppdaterMedlemAdmin, slettMedlem } from '@/lib/actions/profil'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import Segment from '@/components/ui/Segment'

type Medlem = {
  id: string
  navn: string
  visningsnavn: string
  epost: string
  telefon: string | null
  rolle: string
  aktiv: boolean
  fodselsdato: string | null
}

const labelStil: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9.5,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '1.6px',
  marginBottom: 4,
}

const inputBaseStil: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--text-primary)',
  lineHeight: 1.5,
}

const accentInputStil: React.CSSProperties = {
  ...inputBaseStil,
  fontFamily: 'var(--font-display)',
  fontSize: 19,
  fontWeight: 500,
  letterSpacing: '-0.3px',
  color: 'var(--accent)',
}

function Rad({ children, last }: { children: React.ReactNode; last?: boolean }) {
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

export default function RedigerMedlemSkjema({ medlem }: { medlem: Medlem }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [navn, setNavn] = useState(medlem.navn)
  const [visningsnavn, setVisningsnavn] = useState(medlem.visningsnavn)
  const [telefon, setTelefon] = useState(medlem.telefon ?? '')
  const [fodselsdato, setFodselsdato] = useState(medlem.fodselsdato ?? '')
  const [rolle, setRolle] = useState<'medlem' | 'admin'>(
    medlem.rolle === 'admin' ? 'admin' : 'medlem',
  )
  const [aktiv, setAktiv] = useState<'aktiv' | 'deaktivert'>(
    medlem.aktiv ? 'aktiv' : 'deaktivert',
  )

  function handleLagre() {
    startTransition(async () => {
      await oppdaterMedlemAdmin(medlem.id, {
        navn,
        visningsnavn: visningsnavn || navn,
        telefon,
        rolle,
        aktiv: aktiv === 'aktiv',
        fodselsdato: fodselsdato || undefined,
      })
      router.push(`/klubbinfo/medlemmer/${medlem.id}`)
      router.refresh()
    })
  }

  function handleSlett() {
    if (!confirm(`Slette ${medlem.navn}? Dette kan ikke angres.`)) return
    startTransition(() => slettMedlem(medlem.id))
  }

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <SkjemaBar
        overtittel="Rediger"
        tittel={medlem.navn}
        onAvbryt={() => router.push(`/klubbinfo/medlemmer/${medlem.id}`)}
        onLagre={handleLagre}
        laster={isPending}
      />

      {/* Personalia */}
      <SkjemaSeksjon label="Personalia">
        <Rad>
          <div style={labelStil}>Navn</div>
          <input
            type="text"
            value={navn}
            onChange={e => setNavn(e.target.value)}
            style={accentInputStil}
            required
          />
        </Rad>
        <Rad>
          <div style={labelStil}>Visningsnavn</div>
          <input
            type="text"
            value={visningsnavn}
            onChange={e => setVisningsnavn(e.target.value)}
            style={inputBaseStil}
            placeholder={navn}
          />
        </Rad>
        <Rad last>
          <div style={labelStil}>Fødselsdato</div>
          <input
            type="date"
            value={fodselsdato}
            onChange={e => setFodselsdato(e.target.value)}
            style={{ ...inputBaseStil, colorScheme: 'dark' }}
          />
        </Rad>
      </SkjemaSeksjon>

      {/* Kontakt */}
      <SkjemaSeksjon label="Kontakt">
        <Rad>
          <div style={labelStil}>E-post</div>
          <div style={{ ...inputBaseStil, color: 'var(--text-secondary)' }}>
            {medlem.epost}
          </div>
        </Rad>
        <Rad last>
          <div style={labelStil}>Telefon</div>
          <input
            type="tel"
            value={telefon}
            onChange={e => setTelefon(e.target.value)}
            style={inputBaseStil}
            placeholder="+47 ..."
          />
        </Rad>
      </SkjemaSeksjon>

      {/* Tilgang */}
      <SkjemaSeksjon label="Tilgang">
        <div style={{ padding: '10px 4px', borderBottom: '0.5px solid var(--border-subtle)' }}>
          <div style={{ ...labelStil, marginBottom: 8 }}>Rolle</div>
          <Segment
            value={rolle}
            onChange={setRolle}
            options={[
              { value: 'medlem', label: 'Medlem' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
        </div>
        <div style={{ padding: '10px 4px' }}>
          <div style={{ ...labelStil, marginBottom: 8 }}>Status</div>
          <Segment
            value={aktiv}
            onChange={setAktiv}
            options={[
              { value: 'aktiv', label: 'Aktiv' },
              { value: 'deaktivert', label: 'Deaktivert' },
            ]}
          />
        </div>
      </SkjemaSeksjon>

      {/* Faresone */}
      <SkjemaSeksjon label="Faresone">
        <button
          type="button"
          onClick={handleSlett}
          disabled={isPending}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 4px',
            cursor: isPending ? 'wait' : 'pointer',
            background: 'none',
            border: 'none',
            textAlign: 'left',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--danger)',
                letterSpacing: '-0.2px',
                marginBottom: 2,
              }}
            >
              Slett medlem
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.1px',
              }}
            >
              Kan ikke angres. Arrangementer opprettet av medlemmet beholdes.
            </div>
          </div>
        </button>
      </SkjemaSeksjon>
    </div>
  )
}
