import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { formaterDato, norskAar, norskDatoNaa } from '@/lib/dato'
import { subMonths } from 'date-fns'
import Icon from '@/components/ui/Icon'
import SectionLabel from '@/components/ui/SectionLabel'
import PushPaaminnelse from './PushPaaminnelse'
import HighlightKort from '@/components/agenda/HighlightKort'
import ArrangementKort from '@/components/agenda/ArrangementKort'
import UtkastKort from '@/components/agenda/UtkastKort'
import BursdagKort from '@/components/agenda/BursdagKort'
import InnspillKnapp from '@/components/agenda/InnspillKnapp'
import {
  byggAgenda,
  type ArrangementRaad,
  type UtkastRaad,
  type ProfilMedBursdag,
} from '@/lib/agenda-sortering'

// Agenda-forsiden: henter rådata og delegerer all sortering/gruppering til
// lib/agenda-sortering.ts. Denne filen skal holdes tynn — kun fetch + render.
export default async function Forside() {
  const [user, supabase] = await Promise.all([getInnloggetBruker(), createServerClient()])

  const naa = norskDatoNaa()
  const treMndSiden = subMonths(new Date(), 3)
  const aar = norskAar()

  const [
    { data: arrangementer },
    { count: aktiveMedlemmer },
    { data: profilerMedBursdag },
    { data: ansvar },
  ] = await Promise.all([
    supabase
      .from('arrangementer')
      .select(
        `id, type, tittel, start_tidspunkt, oppmoetested, bilde_url,
         paameldinger (profil_id, status, profiles (visningsnavn, bilde_url))`,
      )
      .gte('start_tidspunkt', treMndSiden.toISOString())
      .order('start_tidspunkt', { ascending: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('aktiv', true),
    supabase
      .from('profiles')
      .select('id, visningsnavn, fodselsdato, bilde_url')
      .eq('aktiv', true)
      .not('fodselsdato', 'is', null),
    supabase
      .from('arrangoransvar')
      .select('arrangement_navn, purredato, profiles (visningsnavn)')
      .eq('aar', aar)
      .is('arrangement_id', null),
  ])

  const { idag, kommende, tidligere } = byggAgenda({
    arrangementer: (arrangementer ?? []) as unknown as ArrangementRaad[],
    ansvar: (ansvar ?? []) as unknown as UtkastRaad[],
    profilerMedBursdag: (profilerMedBursdag ?? []) as ProfilMedBursdag[],
    meg: user!.id,
    naa,
    aar,
  })

  const antallGutta = aktiveMedlemmer ?? 0

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: 12,
          marginBottom: 26,
        }}
      >
        <div>
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
            Siden 2007 · {antallGutta} herrer
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
            Agenda
          </h1>
        </div>

        <Link
          href="/arrangementer/ny"
          aria-label="Nytt arrangement"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '0.5px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Icon name="plus" size={20} color="var(--accent)" strokeWidth={1.8} />
        </Link>
      </header>

      <PushPaaminnelse />

      {/* I kveld */}
      {idag.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>
            I kveld · {formaterDato(idag[0].sortIso!, 'd. MMMM').toLowerCase()}
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {idag.map(i => {
              if (i.kind === 'highlight') return <HighlightKort key={i.data.id} arr={i.data} />
              if (i.kind === 'bursdag') return <BursdagKort key={i.data.id} bursdag={i.data} />
              if (i.kind === 'utkast') return <UtkastKort key={i.data.id} utkast={i.data} />
              return <ArrangementKort key={i.data.id} arr={i.data} />
            })}
          </div>
        </section>
      )}

      {/* Kommende */}
      <section style={{ marginBottom: 20 }}>
        <SectionLabel>Kommende</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {kommende.map(i => {
            if (i.kind === 'arrangement') return <ArrangementKort key={i.data.id} arr={i.data} />
            if (i.kind === 'bursdag') return <BursdagKort key={i.data.id} bursdag={i.data} />
            if (i.kind === 'utkast') return <UtkastKort key={i.data.id} utkast={i.data} />
            return <HighlightKort key={i.data.id} arr={i.data} />
          })}
          {kommende.length === 0 && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.5px',
                margin: '8px 0',
              }}
            >
              Ingen planlagte sammenkomster.
            </p>
          )}
        </div>
      </section>

      {/* Innspill */}
      <InnspillKnapp />

      {/* Tidligere */}
      {tidligere.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel>Tidligere</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tidligere.map(a => (
              <ArrangementKort key={a.id} arr={a} tidligere />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
