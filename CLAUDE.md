# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prosjekt

Mortensrud Herreklubb — privat webapp for ~17 venner som erstatter Facebook for arrangementspåmelding, klubbinfo og kåringer. Ingen selvregistrering.

Herreklubben har også en **sparekonto** forvaltet via Excel-ark. Dette hører til under prosjektet.

Detaljert brukerbehovsspesifikasjon (use cases, roller, scope, avklarte beslutninger) finnes i [HK-app_kravspesifikasjon.md](HK-app_kravspesifikasjon.md). Løsningsdesign (databaseskjema, sidestruktur, API-lag, varsler, tekniske beslutninger) finnes i [HK-app_losningsdesign.md](HK-app_losningsdesign.md). Kravspesifikasjonen er autoritativ — ved konflikt gjelder den foran dette dokumentet.

## Roller

- **Admin** (2): oppretter medlemmer, styrer kåringer, redigerer klubbinfo, kan redigere/slette alle arrangementer.
- **Medlem** (~15): oppretter egne arrangementer, melder seg på (Ja/Nei/Kanskje), leser alt innhold.

Admins er også medlemmer. Tilgang håndheves i RLS — ikke bare i UI.

## Kommandoer

```bash
npm run dev          # Start dev-server (localhost:3000)
npm run build        # Produksjonsbygg
npm run lint         # ESLint
npx supabase db push # Kjør migreringer mot Supabase
npx supabase gen types typescript --project-id tdlfswmxezjdnxcbbiwn > lib/supabase/database.types.ts  # Regenerer typer etter migrering
```

## Arkitektur

**Next.js 15 App Router** med to route groups: `(auth)` for `/login`, `(app)` for alle beskyttede sider med bottom-nav.

Auth-guard via `middleware.ts` (`@supabase/ssr`). Bruk `createServerClient` (fra `lib/supabase/server.ts`) i Server Components og Route Handlers, og `createBrowserClient` (fra `lib/supabase/client.ts`) i Client Components.

**Supabase** for alt: Auth (email + passord), PostgreSQL med RLS, scheduled jobs for påminnelser. Migrasjonsfiler i `supabase/migrations/`. Databaseskjema er definert i løsningsdesignet.

**Varsler:** Sentral varslingsfunksjon `sendVarsel()` i `lib/varsler.ts` — all utgående kommunikasjon (push, epost) går gjennom denne. Se **Policy: Varsler** nedenfor.

**Tid:** All tidshåndtering går gjennom `lib/dato.ts` med `Europe/Oslo` tidssone. Se **Policy: Tidshåndtering** nedenfor.

**PWA:** Installerbar via Safari/Chrome. Manifest i `app/manifest.ts`.

**Produksjon:** Appen kjører på [mortensrudherreklubb.no](https://mortensrudherreklubb.no) (Vercel, Dublin-region). Domenet er kjøpt via Domeneshop og DNS peker til Vercel.

## Scope

Se [HK-app_kravspesifikasjon.md](HK-app_kravspesifikasjon.md) for fullstendig scope. Kortversjon:
- **v1:** Arrangementer + påmelding, varsler, medlemsliste, vedtekter/historikk, statistikk, kåringer, roller/ansvar per år, chat per arrangement.
- **v2:** Bildedeling, kåringsavstemning.

## Ytelseskrav

- Appen skal være så rask som mulig for brukeren. Endringer som innføres skal ikke øke responstiden — mål alltid å forbedre eller beholde eksisterende ytelse.

## Konvensjoner

- UI-tekst og databasekolonner på norsk (f.eks. `opprettet_av`, `start_tidspunkt`)
- Datoer via `date-fns` med norsk locale (`nb`)
- Oslo-østkant-tone / oslo-losen i UI-tekst (a-endelser, f.eks. «gutta»)

## Policy: Varsler

All utgående kommunikasjon (push, epost) skal gå gjennom `sendVarsel()` i `lib/varsler.ts`. **Aldri** importer `sendPush` eller `sendEpost` direkte i andre filer — bruk `sendVarsel`.

**Funksjonen håndterer:**
- Testmodus (filtrerer til kun testprofil)
- Brukerpreferanser (`push_aktiv`, `epost_aktiv` fra `varsel_preferanser`)
- Dedup via `tillatDuplikat`-parameter (false = sjekker `varsel_logg` for eksisterende type+arrangement_id)
- Deduplisering av mottakerliste (Set)
- Logging til `varsel_logg`-tabellen med kanal-info (push/epost/begge)
- URL-generering: oppgitt URL brukes, ellers genereres `/varsler/{id}`

**Parametre:**
- `mottakere?: string[]` — profil_id-er, utelat = alle aktive
- `tittel`, `melding` — innhold i varselet
- `url?` — lenke i push/epost
- `knappTekst?` — epost CTA (default: "Åpne i appen")
- `type` — kategorisering for logging og dedup
- `arrangementId?` — referanse for dedup
- `tillatDuplikat?` — true = send alltid (default: false)

**Tabell:** `varsel_logg` (tidligere `personlige_varsler` + `varsler_logg` slått sammen). Kolonner: profil_id, tittel, melding, type, kanal, url, arrangement_id, lest, opprettet.

**Cron:** Vercel cron `0 6 * * *` (08:00 norsk sommertid) kaller `/api/cron/paaminne`. Datobasert sjekk — arrangementets dato sammenlignes med norsk dato, ikke tidspunkt.

**Viktig:** Bruk aldri `after()` fra `next/server` for varsler — det kjører ikke pålitelig på Vercel Hobby. Bruk `await` direkte.

## Policy: Tidshåndtering

All tidshåndtering skal gå gjennom `lib/dato.ts`. **Aldri** bruk `new Date()` for å bestemme "hvilken dag er det" — bruk `norskDatoNaa()`.

**Regler:**
- **Visning av dato/tid:** Bruk `formaterDato(iso, format)` — konverterer automatisk fra UTC til `Europe/Oslo`
- **"Er dette i dag/fortid?":** Bruk `norskDatoNaa()` og `norskDag(iso)` for sammenligning
- **Hvilket år er det?:** Bruk `norskAar()`
- **Lagring i database:** Alltid UTC via `.toISOString()` — dette er korrekt
- **Cron/datoberegning:** Bruk `norskDatoNaa()` som utgangspunkt, `addDays()` for å beregne fremtidige datoer
- **`new Date()` er OK for:** tidsstempler til DB (`.toISOString()`), elapsed time-beregninger, unike ID-er

**Tidssone:** `Europe/Oslo` (eksportert som `TIDSSONE` fra `lib/dato.ts`). Håndterer automatisk sommertid/vintertid via `date-fns-tz`.

Supabase: Herreklubbens org, Herreklubbens webapp, Database passord: d2F3j$G!-@j!i94