// Sentrale domene-konstanter. Tegnegrenser speiler check-constraints i
// databasen (chatten har 500, innlegg/meldinger har 2000) — endringer
// her må følges av tilsvarende migrasjon.

export const CHAT_MIN_LENGDE = 1
export const CHAT_MAKS_LENGDE = 500

export const INNLEGG_MIN_LENGDE = 1
export const INNLEGG_MAKS_LENGDE = 2000

// Antall dager før et arrangement vi sender hver type påminnelse.
// LANG = lang varsel (uka før), KORT = dagen før, PURRING = purring til
// dem som ikke har svart enda.
export const PAAMINNELSE_DAGER = {
  LANG: 7,
  KORT: 1,
  PURRING: 3,
} as const

// Tilgangsvinduet etter en pass-godkjenning. Reidar har eksplisitt sagt
// 1 dag — kort vindu reduserer eksponering hvis godkjenneren glemmer å
// trekke tilbake.
export const PASS_TILGANG_TIMER = 24
