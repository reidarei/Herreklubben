import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import LoggUtKnapp from './LoggUtKnapp'
import RedigerProfilSkjema from './RedigerProfilSkjema'
import VarslerInnstillinger from '@/components/VarslerInnstillinger'
import Link from 'next/link'
import Pill from '@/components/ui/Pill'
import Card from '@/components/ui/Card'
import SectionLabel from '@/components/ui/SectionLabel'
import Avatar from '@/components/ui/Avatar'
import { norskAar } from '@/lib/dato'

export default async function Profil() {
  const [supabase, user] = await Promise.all([createServerClient(), getInnloggetBruker()])

  const [{ data: profil }, { data: ansvar }, { data: varselPref }] = await Promise.all([
    supabase.from('profiles').select('navn, visningsnavn, epost, telefon, rolle, fodselsdato, opprettet').eq('id', user!.id).single(),
    supabase.from('arrangoransvar')
      .select('id, aar, arrangement_navn, arrangementer (id)')
      .eq('ansvarlig_id', user!.id)
      .gte('aar', norskAar())
      .order('aar'),
    supabase.from('varsel_preferanser').select('push_aktiv, epost_aktiv').eq('profil_id', user!.id).maybeSingle(),
  ])

  const medlemSiden = profil?.opprettet
    ? new Date(profil.opprettet).getFullYear()
    : 2015

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '38px',
              fontWeight: 400,
              color: 'var(--text-primary)',
            }}
          >
            Din profil
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.02em',
            }}
          >
            Medlem siden {medlemSiden}
          </p>
        </div>
      </div>

      {/* Profil-hero-kort */}
      <Card className="mb-5">
        <div className="flex items-center gap-4 p-5">
          <Avatar navn={profil?.visningsnavn ?? profil?.navn ?? '?'} size={72} />
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 400,
                color: 'var(--text-primary)',
              }}
            >
              {profil?.visningsnavn ?? profil?.navn}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {profil?.epost}
            </p>
          </div>
        </div>
      </Card>

      <RedigerProfilSkjema
        navn={profil?.navn ?? ''}
        visningsnavn={profil?.visningsnavn ?? ''}
        epost={profil?.epost ?? ''}
        telefon={profil?.telefon ?? ''}
        rolle={profil?.rolle ?? 'medlem'}
        fodselsdato={profil?.fodselsdato ?? ''}
      />

      {ansvar && ansvar.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Dine arrangøransvar</SectionLabel>
          <div className="space-y-2">
            {ansvar.map(a => (
              <Card key={a.id} padding={false}>
                <div className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.arrangement_navn}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.aar}</p>
                  </div>
                  {a.arrangementer ? (
                    <Link href={`/arrangementer/${a.arrangementer.id}`}>
                      <Pill variant="success">Lagt inn</Pill>
                    </Link>
                  ) : (
                    <Link href="/arrangementer/ny"
                      className="text-xs px-3 py-1.5 font-semibold"
                      style={{
                        background: 'var(--accent)',
                        color: '#000',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-pill)',
                      }}>
                      Legg inn
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <VarslerInnstillinger
        pushAktiv={varselPref?.push_aktiv ?? false}
        epostAktiv={varselPref?.epost_aktiv ?? true}
      />

      <div className="mt-6">
        <Card>
          <LoggUtKnapp />
        </Card>
      </div>
    </div>
  )
}
