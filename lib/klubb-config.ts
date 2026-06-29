// Sentral klubbidentitet. Alle hardkodede navn, URL-er og datoer som er
// spesifikke for Mortensrud Herreklubb samles her med env-override.
// Defaults = dagens prod-verdier, slik at eksisterende deploy ikke endrer seg.
//
// Klient-trygg modul: importeres fra Client Components (bl.a. via lib/roller.ts)
// og må forbli klient-trygg. Kun NEXT_PUBLIC_-env-vars og rene konstanter —
// aldri secrets, server-only-config eller node-API-er.

// Todelt navn brukes i hero-seksjoner med to-linjers typografi
// (f.eks. klubbinfo-siden og KlubbJubileumKort).
export const KLUBB_NAVN = process.env.NEXT_PUBLIC_KLUBB_NAVN ?? 'Mortensrud Herreklubb'
export const KLUBB_KORTNAVN = process.env.NEXT_PUBLIC_KLUBB_KORTNAVN ?? 'Herreklubben'
export const KLUBB_NAVN_LINJE_1 = process.env.NEXT_PUBLIC_KLUBB_NAVN_LINJE_1 ?? 'Mortensrud'
export const KLUBB_NAVN_LINJE_2 = process.env.NEXT_PUBLIC_KLUBB_NAVN_LINJE_2 ?? 'Herreklubb'

export const KLUBB_BESKRIVELSE =
  process.env.NEXT_PUBLIC_KLUBB_BESKRIVELSE ?? `Privat klubbapp for ${KLUBB_NAVN}`

// KLUBB_DOMENE er hostname-identifikatoren — brukes i ICS PRODID/UID og
// som base for PROD_URL i config.ts. Adskilt fra BASE_URL fordi ICS-UID
// trenger bare hostnavn, ikke protokoll.
// MÅ være et gyldig hostname (ASCII, ingen mellomrom/komma/skråstrek) —
// vi saniterer ikke ved bruk, så feil format gir ugyldig ICS-UID.
export const KLUBB_DOMENE =
  process.env.NEXT_PUBLIC_KLUBB_DOMENE ?? 'mortensrudherreklubb.no'

// Stiftelsesdato — brukes til å beregne jubileumsdagen på agendaen.
// `||` foran fallback (ikke `??`) fordi env-vars er strenger:
// Number('') = 0 og Number('søppel') = NaN — begge er falsy og uønskede
// her (0 er aldri gyldig år/måned/dag), så `||` fanger alt i ett.
export const KLUBB_STIFTET = {
  aar: Number(process.env.NEXT_PUBLIC_KLUBB_STIFTET_AAR) || 2007,
  maaned: Number(process.env.NEXT_PUBLIC_KLUBB_STIFTET_MAANED) || 11,
  dag: Number(process.env.NEXT_PUBLIC_KLUBB_STIFTET_DAG) || 24,
} as const

// Stiftelsessted — vises ved siden av stiftelsesdatoen på klubbinfo-siden.
export const KLUBB_STED = process.env.NEXT_PUBLIC_KLUBB_STED ?? 'Søndre Nordstrand'

// «Om klubben»-avsnittene på klubbinfo-siden. Env-varen bruker `|` som
// avsnitt-skille (én env-var kan ikke holde et array direkte).
export const KLUBB_OM_AVSNITT: readonly string[] = process.env.NEXT_PUBLIC_KLUBB_OM
  ? process.env.NEXT_PUBLIC_KLUBB_OM.split('|').map(s => s.trim()).filter(Boolean)
  : [
      'Vi blir gamle og grå, så en syklubb må vi få.',
      'Her skal verdensproblemer løses og diskuteres av de største besserwisserne fra Mortensrud.',
      'Så vel møtt finansakrobater og rikssynsere til månedlige sammenkomster.',
    ]

// Overskrift på medlemslisten (/klubbinfo/medlemmer).
export const KLUBB_MEDLEMMER_TITTEL =
  process.env.NEXT_PUBLIC_KLUBB_MEDLEMMER_TITTEL ?? 'Herrene'

// Tittel-streng for generalsekretær-rollen i UI. Rolle-koden i DB
// («generalsekretaer») endres ikke — kun visningsnavnet kan overstyres.
export const ROLLE_TITTEL_GENERALSEKRETAER =
  process.env.NEXT_PUBLIC_ROLLE_TITTEL_GENERALSEKRETAER ?? 'Generalsekretær'

// Brand-farger — kan overstyres av andre klubber via NEXT_PUBLIC_KLUBB_FARGE_*-
// env-vars. Default = Herreklubbens verdier (sync til klubb-app arver dette
// inntil andre klubber setter egne env-overrides). Se docs/tema-arkitektur.md §4.
export const KLUBB_FARGE_PRIMAER =
  process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER ?? '#e8d9b5'
export const KLUBB_FARGE_PRIMAER_SOFT =
  process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_SOFT ?? 'rgba(232, 217, 181, 0.16)'
export const KLUBB_FARGE_PRIMAER_HOT =
  process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_HOT ?? '#f5e8c8'
export const KLUBB_FARGE_BAKGRUNN =
  process.env.NEXT_PUBLIC_KLUBB_FARGE_BAKGRUNN ?? '#0e0f13'
