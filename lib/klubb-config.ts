// Sentral klubbidentitet. Alle hardkodede navn, URL-er og datoer som er
// spesifikke for Mortensrud Herreklubb samles her med env-override.
// Defaults = dagens prod-verdier, slik at eksisterende deploy ikke endrer seg.

// Todelt navn brukes i hero-seksjoner med to-linjers typografi
// (f.eks. klubbinfo-siden og KlubbJubileumKort).
export const KLUBB_NAVN = process.env.NEXT_PUBLIC_KLUBB_NAVN ?? 'Mortensrud Herreklubb'
export const KLUBB_KORTNAVN = process.env.NEXT_PUBLIC_KLUBB_KORTNAVN ?? 'Herreklubben'
export const KLUBB_NAVN_LINJE_1 = process.env.NEXT_PUBLIC_KLUBB_NAVN_LINJE_1 ?? 'Mortensrud'
export const KLUBB_NAVN_LINJE_2 = process.env.NEXT_PUBLIC_KLUBB_NAVN_LINJE_2 ?? 'Herreklubb'

export const KLUBB_BESKRIVELSE =
  process.env.NEXT_PUBLIC_KLUBB_BESKRIVELSE ?? 'Privat klubbapp for Mortensrud Herreklubb'

// KLUBB_DOMENE er hostname-identifikatoren — brukes i ICS PRODID/UID og
// som base for PROD_URL i config.ts. Adskilt fra BASE_URL fordi ICS-UID
// trenger bare hostnavn, ikke protokoll.
export const KLUBB_DOMENE =
  process.env.NEXT_PUBLIC_KLUBB_DOMENE ?? 'mortensrudherreklubb.no'

// Stiftelsesdato — brukes til å beregne jubileumsdagen på agendaen.
export const KLUBB_STIFTET = {
  aar: Number(process.env.NEXT_PUBLIC_KLUBB_STIFTET_AAR ?? 2007),
  maaned: Number(process.env.NEXT_PUBLIC_KLUBB_STIFTET_MAANED ?? 11),
  dag: Number(process.env.NEXT_PUBLIC_KLUBB_STIFTET_DAG ?? 24),
} as const

// Resend-avsender for alle utgående e-poster. Default speiler dagens verdi
// i lib/epost.ts slik at eksisterende Resend-oppsett fungerer uten endring.
export const KLUBB_EPOST_AVSENDER =
  process.env.RESEND_FROM ?? 'Herreklubben <onboarding@resend.dev>'

// Tittel-streng for generalsekretær-rollen i UI. Rolle-koden i DB
// («generalsekretaer») endres ikke — kun visningsnavnet kan overstyres.
export const ROLLE_TITTEL_GENERALSEKRETAER =
  process.env.NEXT_PUBLIC_ROLLE_TITTEL_GENERALSEKRETAER ?? 'Generalsekretær'
