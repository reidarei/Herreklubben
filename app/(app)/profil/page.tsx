import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { norskAar, formaterDato } from '@/lib/dato'
import Avatar from '@/components/ui/Avatar'
import SectionLabel from '@/components/ui/SectionLabel'
import VarslerInnstillinger from '@/components/VarslerInnstillinger'
import LoggUtKnapp from './LoggUtKnapp'

const KLUBBEN_START_AAR = 2007

export default async function Profil() {
  const [supabase, user] = await Promise.all([createServerClient(), getInnloggetBruker()])

  const [
    { data: profil },
    { count: oppmoeter },
    { count: kaaringer },
    { data: ansvar },
    { data: varselPref },
    { data: varsler },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('navn, visningsnavn, rolle, bilde_url')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('paameldinger')
      .select('arrangement_id', { count: 'exact', head: true })
      .eq('profil_id', user!.id)
      .eq('status', 'ja'),
    supabase
      .from('kaaring_vinnere')
      .select('id', { count: 'exact', head: true })
      .eq('profil_id', user!.id),
    supabase
      .from('arrangoransvar')
      .select('id, aar, arrangement_navn, arrangement_id, arrangementer (id, tittel, start_tidspunkt, oppmoetested)')
      .eq('ansvarlig_id', user!.id)
      .gte('aar', norskAar())
      .order('aar'),
    supabase
      .from('varsel_preferanser')
      .select('push_aktiv, epost_aktiv')
      .eq('profil_id', user!.id)
      .maybeSingle(),
    supabase
      .from('varsel_logg')
      .select('id, tittel, melding, lest, opprettet, url')
      .eq('profil_id', user!.id)
      .order('opprettet', { ascending: false })
      .limit(10),
  ])

  const navn = profil?.navn ?? 'Ukjent'
  const rolle = profil?.rolle === 'admin' ? 'Admin' : 'Medlem'

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Header */}
      <header
        style={{
          marginTop: 12,
          marginBottom: 26,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Medlem siden {KLUBBEN_START_AAR}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: '-0.5px',
              lineHeight: 1,
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            Din profil
          </h1>
        </div>

        <Link
          href="/profil/rediger"
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 999,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          Rediger
        </Link>
      </header>

      {/* Profil-hero */}
      <div
        style={{
          padding: 24,
          marginBottom: 20,
          textAlign: 'center',
          background:
            'radial-gradient(ellipse at top, var(--accent-soft), transparent 70%), var(--bg-elevated)',
          border: '0.5px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          backdropFilter: 'var(--blur-card)',
          WebkitBackdropFilter: 'var(--blur-card)',
        }}
      >
        <div style={{ display: 'inline-block' }}>
          <Avatar name={navn} size={78} src={profil?.bilde_url ?? null} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginTop: 14,
            letterSpacing: '-0.3px',
          }}
        >
          {navn}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--accent)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {rolle}
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 28,
            marginTop: 20,
            paddingTop: 20,
            borderTop: '0.5px solid var(--border-subtle)',
          }}
        >
          {[
            { val: oppmoeter ?? 0, lbl: 'Oppmøter' },
            { val: kaaringer ?? 0, lbl: 'Kåringer' },
          ].map(s => (
            <div key={s.lbl}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  fontWeight: 500,
                  color: 'var(--accent)',
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrangøransvar */}
      {ansvar && ansvar.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <SectionLabel>Arrangøransvar</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ansvar.map((a, i) => {
              const lagtInn = !!a.arrangement_id
              const arr = Array.isArray(a.arrangementer)
                ? a.arrangementer[0]
                : a.arrangementer
              const meta = arr
                ? arr.oppmoetested ?? '—'
                : 'Dato og sted ikke satt'
              const farge = lagtInn ? 'var(--success)' : 'var(--danger)'
              return (
                <Link
                  key={a.id}
                  href={arr ? `/arrangementer/${arr.id}` : '/arrangoransvar'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 4px',
                    borderBottom:
                      i < ansvar.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: farge,
                      flexShrink: 0,
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${farge} 18%, transparent)`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        letterSpacing: '1.6px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {a.aar}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.15,
                        marginBottom: 3,
                      }}
                    >
                      {a.arrangement_navn}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        letterSpacing: '0.1px',
                      }}
                    >
                      {meta}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: farge,
                      letterSpacing: '1.4px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {lagtInn ? 'Lagt inn' : 'Ikke lagt inn'}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Varsler-innstillinger */}
      <VarslerInnstillinger
        pushAktiv={varselPref?.push_aktiv ?? false}
        epostAktiv={varselPref?.epost_aktiv ?? true}
      />

      {/* Personlige varsler */}
      {varsler && varsler.length > 0 && (
        <section style={{ marginBottom: 24, marginTop: 24 }}>
          <SectionLabel count={varsler.filter(v => !v.lest).length || undefined}>
            Varsler
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {varsler.map((v, i) => (
              <Link
                key={v.id}
                href={`/varsler/${v.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 4px',
                  borderBottom:
                    i < varsler.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
                  textDecoration: 'none',
                  color: 'inherit',
                  opacity: v.lest ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: v.lest ? 'var(--border-subtle)' : 'var(--accent)',
                    marginTop: 6,
                    flexShrink: 0,
                    boxShadow: v.lest
                      ? 'none'
                      : '0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.2px',
                      lineHeight: 1.2,
                      marginBottom: 3,
                    }}
                  >
                    {v.tittel}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {v.melding}
                  </div>
                  {v.opprettet && (
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--text-tertiary)',
                        letterSpacing: '1.4px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginTop: 4,
                      }}
                    >
                      {formaterDato(v.opprettet, 'd. MMM · HH:mm')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Logg ut */}
      <div style={{ marginTop: 28 }}>
        <LoggUtKnapp />
      </div>
    </div>
  )
}
