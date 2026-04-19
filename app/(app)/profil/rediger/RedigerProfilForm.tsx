'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { oppdaterEgenProfil } from '@/lib/actions/profil'
import { createClient } from '@/lib/supabase/client'
import SkjemaBar from '@/components/ui/SkjemaBar'
import SkjemaSeksjon from '@/components/ui/SkjemaSeksjon'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'

type Props = {
  navn: string
  visningsnavn: string
  telefon: string
  fodselsdato: string
  epost: string
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

function Rad({
  children,
  last,
}: {
  children: React.ReactNode
  last?: boolean
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

export default function RedigerProfilForm({
  navn: navnInit,
  visningsnavn: visnInit,
  telefon: tlfInit,
  fodselsdato: fdInit,
  epost,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [navn, setNavn] = useState(navnInit)
  const [visningsnavn, setVisningsnavn] = useState(visnInit)
  const [telefon, setTelefon] = useState(tlfInit)
  const [fodselsdato, setFodselsdato] = useState(fdInit)

  const [visPassord, setVisPassord] = useState(false)
  const [passord, setPassord] = useState('')
  const [bekreft, setBekreft] = useState('')
  const [passordFeil, setPassordFeil] = useState('')

  function handleLagre() {
    setPassordFeil('')
    if (visPassord && passord) {
      if (passord.length < 6) {
        setPassordFeil('Passordet må være minst 6 tegn')
        return
      }
      if (passord !== bekreft) {
        setPassordFeil('Passordene er ikke like')
        return
      }
    }

    startTransition(async () => {
      await oppdaterEgenProfil({
        navn,
        visningsnavn: visningsnavn || navn,
        telefon,
        fodselsdato: fodselsdato || undefined,
      })

      if (visPassord && passord) {
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: passord })
        if (error) {
          setPassordFeil(error.message)
          return
        }
      }

      router.push('/profil')
      router.refresh()
    })
  }

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <SkjemaBar
        overtittel="Rediger"
        tittel="Profil"
        onAvbryt={() => router.push('/profil')}
        onLagre={handleLagre}
        laster={isPending}
      />

      {/* Avatar-editor */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 4px 18px',
          borderTop: '0.5px solid var(--border-subtle)',
          borderBottom: '0.5px solid var(--border-subtle)',
          marginBottom: 20,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={navn} size={56} />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg)',
            }}
          >
            <Icon name="plus" size={11} color="#0a0a0a" strokeWidth={2.5} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              marginBottom: 2,
            }}
          >
            {navn || 'Ditt navn'}
          </div>
          <button
            type="button"
            disabled
            style={{
              background: 'none',
              border: 'none',
              cursor: 'not-allowed',
              padding: 0,
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
              opacity: 0.5,
            }}
            title="Kommer senere"
          >
            Bytt profilbilde
          </button>
        </div>
      </div>

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
          <div
            style={{
              ...inputBaseStil,
              color: 'var(--text-secondary)',
            }}
          >
            {epost}
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

      {/* Sikkerhet */}
      <SkjemaSeksjon label="Sikkerhet">
        <button
          type="button"
          onClick={() => setVisPassord(v => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 4px',
            cursor: 'pointer',
            gap: 16,
            background: 'none',
            border: 'none',
            borderBottom: visPassord ? '0.5px solid var(--border-subtle)' : 'none',
            textAlign: 'left',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px',
                marginBottom: 2,
              }}
            >
              Endre passord
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.1px',
              }}
            >
              {visPassord ? 'Fyll inn nytt passord nedenfor' : 'Sett nytt passord for innlogging'}
            </div>
          </div>
          <div style={{ transform: visPassord ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>
            <Icon name="chevron" size={14} color="var(--text-tertiary)" />
          </div>
        </button>

        {visPassord && (
          <div style={{ padding: '14px 4px 4px' }}>
            <Rad>
              <div style={labelStil}>Nytt passord</div>
              <input
                type="password"
                value={passord}
                onChange={e => setPassord(e.target.value)}
                style={inputBaseStil}
                autoComplete="new-password"
              />
            </Rad>
            <Rad last>
              <div style={labelStil}>Bekreft</div>
              <input
                type="password"
                value={bekreft}
                onChange={e => setBekreft(e.target.value)}
                style={inputBaseStil}
                autoComplete="new-password"
              />
            </Rad>
            {passordFeil && (
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'var(--danger)',
                  marginTop: 10,
                  padding: '0 4px',
                }}
              >
                {passordFeil}
              </div>
            )}
          </div>
        )}
      </SkjemaSeksjon>
    </div>
  )
}
