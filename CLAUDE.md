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

**Varsler:** Web Push (VAPID) for installerte PWA-brukere + e-post via Resend til alle som fallback. Påminnelser 7 dager og 1 dag før arrangementer. E-post sendes fra `noreply@mortensrudherreklubb.no` (domenet er verifisert i Resend). **Viktig:** Bruk aldri `after()` fra `next/server` for varsler — det kjører ikke pålitelig på Vercel Hobby. Bruk `await` direkte i server actions.

**PWA:** Installerbar via Safari/Chrome. Manifest i `app/manifest.ts`.

**Produksjon:** Appen kjører på [mortensrudherreklubb.no](https://mortensrudherreklubb.no) (Vercel, Dublin-region). Domenet er kjøpt via Domeneshop og DNS peker til Vercel.

## Scope

Se [HK-app_kravspesifikasjon.md](HK-app_kravspesifikasjon.md) for fullstendig scope. Kortversjon:
- **v1:** Arrangementer + påmelding, varsler, medlemsliste, vedtekter/historikk, statistikk, kåringer, roller/ansvar per år.
- **v2:** Bildedeling, kåringsavstemning.
- **Aldri:** Kommentarer, chat.

## Ytelseskrav

- Appen skal være så rask som mulig for brukeren. Endringer som innføres skal ikke øke responstiden — mål alltid å forbedre eller beholde eksisterende ytelse.

## Konvensjoner

- UI-tekst og databasekolonner på norsk (f.eks. `opprettet_av`, `start_tidspunkt`)
- Datoer via `date-fns` med norsk locale (`nb`)
- Oslo-østkant-tone / oslo-losen i UI-tekst (a-endelser, f.eks. «gutta»)

Supabase: Herreklubbens org, Herreklubbens webapp, Database passord: d2F3j$G!-@j!i94