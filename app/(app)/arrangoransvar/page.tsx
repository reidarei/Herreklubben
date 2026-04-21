import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Link from 'next/link'
import AnsvarAdmin from './AnsvarAdmin'
import PurreKnapp from './PurreKnapp'
import SectionLabel from '@/components/ui/SectionLabel'
import { norskAar, norskDag, norskDatoNaa } from '@/lib/dato'
import { isBefore } from 'date-fns'
import { kanAdministrere } from '@/lib/roller'
import { utkastAnkerId } from '@/components/agenda/UtkastKort'

export default async function Arrangoransvar() {
  const supabase = await createServerClient()
  const [user, profil] = await Promise.all([getInnloggetBruker(), getProfil()])
  const erAdmin = kanAdministrere(profil?.rolle)

  const innevaerendeAar = norskAar()
  const visAar = [innevaerendeAar, innevaerendeAar + 1]

  const [{ data: ansvar }, { data: medlemmer }, { data: maler }] = await Promise.all([
    supabase
      .from('arrangoransvar')
      .select(`id, aar, arrangement_navn, ansvarlig_id, profiles (id, navn), arrangementer (id, tittel, start_tidspunkt)`)
      .in('aar', visAar)
      .order('aar'),
    supabase.from('profiles').select('id, navn').eq('aktiv', true).order('navn'),
    supabase.from('arrangementmaler').select('*').order('rekkefølge'),
  ])

  const fasteArrangementer = ((maler ?? []) as { navn: string }[]).map(m => m.navn)

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <header style={{ marginTop: 12, marginBottom: 26 }}>
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
          Klubbinfo / Ansvar
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
          Arrangøransvar
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginTop: 10,
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          De faste arrangementene og hvem som har ansvar for å få dem inn i kalenderen. Trykk «Purre» for å minne den ansvarlige på det.
        </p>
      </header>

      {visAar.map(aar => (
        <section key={aar} style={{ marginBottom: 28 }}>
          <SectionLabel>{String(aar)}</SectionLabel>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {fasteArrangementer.map((navn, i) => {
              const rader = (ansvar ?? []).filter(
                a => a.aar === aar && a.arrangement_navn.trim().toLowerCase() === navn.toLowerCase()
              )
              const erMitt = rader.some(r => r.ansvarlig_id === user!.id)
              const lenketArr = rader.find(r => r.arrangementer)?.arrangementer
              const lagtInn = !!lenketArr
              const gjennomfoert = lenketArr
                ? isBefore(norskDag(lenketArr.start_tidspunkt), norskDatoNaa())
                : false
              const statusFarge = lagtInn ? 'var(--success)' : 'var(--danger)'
              const statusTekst = gjennomfoert ? 'Gjennomført' : lagtInn ? 'Lagt inn' : 'Ikke lagt inn'
              const ansvarligeMedNavn = rader.filter(r => r.profiles).map(r => r.profiles!)
              const ansvarligIder = rader.filter(r => r.ansvarlig_id).map(r => ({
                ansvarId: r.id,
                profilId: r.ansvarlig_id!,
              }))
              // Purre-knapp er synlig når det er ansvarlige, ikke lagt inn, og bruker ikke selv er ansvarlig
              const kanPurres = !lagtInn && ansvarligIder.length > 0 && !erMitt
              const forsteAnsvarId = ansvarligIder[0]?.ansvarId

              return (
                <div
                  key={navn}
                  id={utkastAnkerId(aar, navn)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '16px 4px',
                    scrollMarginTop: 24,
                    borderBottom:
                      i < fasteArrangementer.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: statusFarge,
                      flexShrink: 0,
                      marginTop: 7,
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${statusFarge} 18%, transparent)`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 500,
                        color: erMitt ? 'var(--accent)' : 'var(--text-primary)',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.15,
                        marginBottom: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {navn}
                      {erMitt && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--accent)',
                            letterSpacing: '1.4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          Deg
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.1px',
                      }}
                    >
                      {ansvarligeMedNavn.length > 0
                        ? ansvarligeMedNavn.map(p => p.navn).join(', ')
                        : 'Ingen ansvarlig'}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {lenketArr ? (
                        <Link
                          href={`/arrangementer/${lenketArr.id}`}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: statusFarge,
                            letterSpacing: '1.4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                          }}
                        >
                          {statusTekst} →
                        </Link>
                      ) : (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: statusFarge,
                            letterSpacing: '1.4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {statusTekst}
                        </span>
                      )}
                    </div>
                    {erAdmin && (
                      <AnsvarAdmin
                        ansvarlige={ansvarligIder}
                        arrangementNavn={navn}
                        aar={aar}
                        medlemmer={medlemmer ?? []}
                      />
                    )}
                  </div>
                  {kanPurres && forsteAnsvarId && <PurreKnapp ansvarId={forsteAnsvarId} />}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
