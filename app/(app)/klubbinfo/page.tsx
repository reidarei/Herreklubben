import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import { norskAar } from '@/lib/dato'
import Icon, { IkonNavn } from '@/components/ui/Icon'

const KLUBBEN_START_AAR = 2008

export default async function Klubbinfo() {
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  const erAdmin = profil?.rolle === 'admin'

  const [{ count: antallMedlemmer }, { count: totaltArr }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('aktiv', true),
    supabase.from('arrangementer').select('id', { count: 'exact', head: true }),
  ])

  const antallAar = norskAar() - KLUBBEN_START_AAR + 1

  type Rad = {
    nr: string
    icon: IkonNavn
    title: string
    sub: string
    meta?: string
    href: string
    kunAdmin?: boolean
  }

  const rader: Rad[] = [
    {
      nr: '01',
      icon: 'users',
      title: 'Medlemmer',
      sub: `${antallMedlemmer ?? 0} aktive`,
      meta: String(antallMedlemmer ?? 0),
      href: '/klubbinfo/medlemmer',
    },
    {
      nr: '02',
      icon: 'list',
      title: 'Arrangøransvar',
      sub: `Hvem tar hva i ${norskAar()}`,
      href: '/arrangoransvar',
    },
    {
      nr: '03',
      icon: 'trophy',
      title: 'Kåringer',
      sub: 'Årets hederspriser',
      href: '/kaaringer',
    },
    {
      nr: '04',
      icon: 'doc',
      title: 'Vedtekter',
      sub: 'Regler og kvotering',
      href: '/klubbinfo/vedtekter/vedtekter',
    },
    {
      nr: '05',
      icon: 'chart',
      title: 'Statistikk',
      sub: 'Deltakelse og rekorder',
      href: '/klubbinfo/statistikk',
    },
    {
      nr: '06',
      icon: 'cog',
      title: 'Innstillinger',
      sub: 'Varsler og admin',
      href: '/innstillinger',
      kunAdmin: true,
    },
  ]

  const synligeRader = rader.filter(r => !r.kunAdmin || erAdmin)

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Editorial hero */}
      <div
        style={{
          position: 'relative',
          padding: '12px 4px 32px',
          marginBottom: 32,
          borderBottom: '0.5px solid var(--border-subtle)',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-tertiary)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, height: '0.5px', background: 'var(--border-strong)' }} />
          Etablert {KLUBBEN_START_AAR}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 44,
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '-1.2px',
            lineHeight: 0.95,
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          Mortensrud
        </h2>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 44,
            fontWeight: 400,
            color: 'var(--text-secondary)',
            letterSpacing: '-1.2px',
            lineHeight: 0.95,
            margin: '2px 0 0',
          }}
        >
          Herreklubb
        </h2>

        {/* Nøkkeltall */}
        <div
          style={{
            display: 'flex',
            gap: 22,
            marginTop: 22,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {[
            { val: antallMedlemmer ?? 0, lbl: 'Medlemmer' },
            { val: antallAar, lbl: 'Årganger' },
            { val: totaltArr ?? 0, lbl: 'Sammenkomster' },
          ].map(s => (
            <div key={s.lbl}>
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: 18,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.3px',
                  marginBottom: 2,
                }}
              >
                {s.val}
              </div>
              {s.lbl}
            </div>
          ))}
        </div>
      </div>

      {/* Seksjons-label */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
        }}
      >
        Innhold
        <span style={{ flex: 1, height: '0.5px', background: 'var(--border-subtle)' }} />
      </div>

      {/* Magazine-TOC */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {synligeRader.map(r => (
          <Link
            key={r.title}
            href={r.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '18px 4px',
              borderBottom: '0.5px solid var(--border-subtle)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                letterSpacing: '1.6px',
                fontWeight: 600,
                width: 22,
                flexShrink: 0,
              }}
            >
              {r.nr}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.1,
                  marginBottom: 2,
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.1px',
                }}
              >
                {r.sub}
              </div>
            </div>
            {r.meta && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginRight: 4,
                  letterSpacing: '0.5px',
                }}
              >
                {r.meta}
              </span>
            )}
            <Icon name="chevron" size={14} color="var(--text-tertiary)" />
          </Link>
        ))}
      </div>
    </div>
  )
}
