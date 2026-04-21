# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prosjekt

Mortensrud Herreklubb — privat webapp for ~17 venner som erstatter Facebook for arrangementspåmelding, klubbinfo og kåringer. Ingen selvregistrering.

Herreklubben har også en **sparekonto** forvaltet via Excel-ark. Dette hører til under prosjektet.

Detaljert brukerbehovsspesifikasjon (use cases, roller, scope, avklarte beslutninger) finnes i [HK-app_kravspesifikasjon.md](HK-app_kravspesifikasjon.md). Løsningsdesign (databaseskjema, sidestruktur, API-lag, varsler, tekniske beslutninger) finnes i [HK-app_losningsdesign.md](HK-app_losningsdesign.md). Kravspesifikasjonen er autoritativ — ved konflikt gjelder den foran dette dokumentet.

## Roller

- **Admin** (2): oppretter medlemmer, styrer kåringer, redigerer klubbinfo, kan redigere/slette alle arrangementer.
- **Generalsekretær** (1, André Heede): har admin-rettigheter, men mottar ikke issue-varsler og markeres med gul glød på profilbildet.
- **Medlem** (~15): oppretter egne arrangementer, melder seg på (Ja/Nei/Kanskje), leser alt innhold.

Admins og generalsekretær er også medlemmer. Tilgang håndheves i RLS — ikke bare i UI. Se **Policy: Roller** nedenfor for hvordan sjekker skal gjøres i kode.

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

**Roller:** Rettighetsmatrise i `lib/roller.ts` speiles av `er_admin()` i DB. Aldri sammenlign rolle-strenger direkte — bruk hjelperne. Se **Policy: Roller** nedenfor.

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

**Cron:** GitHub Actions (`.github/workflows/paaminne.yml`) kaller `/api/cron/paaminne` via POST kl 06:00 UTC (08:00 norsk sommertid) med `CRON_SECRET`-auth. Valgt foran Vercel cron for bedre logging og synlig feilrapportering. Datobasert sjekk — arrangementets dato sammenlignes med norsk dato, ikke tidspunkt.

**Viktig:** Bruk aldri `after()` fra `next/server` for varsler — det kjører ikke pålitelig på Vercel Hobby. Bruk `await` direkte.

## Policy: Roller

Sentral rettighetsmatrise i `lib/roller.ts` definerer de tre rollene og hva hver rolle kan/mottar. **Aldri** sammenlign `rolle === 'admin'` direkte i kode — bruk hjelperne.

**Roller:** `medlem`, `admin`, `generalsekretaer`. Alle har medlem-rettigheter. Admin og generalsekretær har i tillegg admin-rettigheter (CRUD på tvers, kåringer, klubbinfo, alle arrangementer).

**Matrisen (`ROLLER`) har fire felt per rolle:**
- `tittel` — visningsnavn i UI
- `kanAdministrere` — har admin-rettigheter
- `faarIssueVarsler` — mottar push/epost for nye GitHub-innspill
- `harGulGloed` — særegen gul ring rundt avatar

**Bruk disse hjelperne:**
- `kanAdministrere(rolle)` — admin-sjekk i UI, server actions, API-ruter
- `harGulGloed(rolle)` — avatar-styling
- `faarIssueVarsler(rolle)` — brukes indirekte via `rollerMed('faarIssueVarsler')` for DB-spørringer
- `tittelFor(rolle)` — visning av rolle i UI
- `rettigheterFor(rolle)` — hele rettighetsobjektet
- `rollerMed(rettighet)` — liste over roller som har en gitt rettighet (for `.in('rolle', …)`-filtre)
- `VALGBARE_ROLLER` — roller som kan velges fra admin-UI (generalsekretær settes manuelt via SQL)

**Database-siden:** Funksjonen `er_admin()` returnerer true for både admin og generalsekretær og brukes i alle RLS-policies. Hvis matrisen endres slik at en ny rolle skal ha admin-rettigheter, må `er_admin()` oppdateres i en ny migrasjon — dette er duplisering vi lever med fordi RLS må kjøre i DB.

**Når nye RLS-policies skrives:** Bruk `er_admin()`, ikke inline `rolle = 'admin'`. Sistnevnte glipper unna når nye roller med admin-rettigheter kommer.

**Setting av generalsekretær-rollen:** Via SQL (`update profiles set rolle = 'generalsekretaer' where …`). UI-et til medlemsredigering kan ikke sette denne rollen — bare bevare den hvis den allerede er satt.

**Testing:** `__tests__/roller.test.ts` verifiserer at matrisen og hjelperne holder seg i synk. Oppdater testen hvis du legger til ny rolle eller rettighet.

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

## Policy: Arrangøransvar-kobling

Når en bruker oppretter et arrangement velger han **eksplisitt** hvilken mal det hører til i en nedtrekk-meny (`TypeVelger`). Menyen lister alle uoppfylte `(aar, arrangement_navn)`-kombinasjoner fra `arrangoransvar` + et `Annet`-valg som alltid ligger nederst. Valget styrer både kobling, type (møte/tur), purredato og forhåndsutfylt tittel.

**Komponenter:**
- `components/arrangement/TypeVelger.tsx` — dropdown + typen `MalValg`
- `lib/mal-valg.ts → hentMalValg(supabase, includeArrangementId?)` — henter og sorterer valg (aar asc, purredato asc nulls last, Annet sist). `includeArrangementId` tar med gjeldende kobling slik at rediger-siden fortsatt viser valget selv når det er oppfylt.

**Flyt:** `opprettArrangement` og `oppdaterArrangement` tar `mal_navn` + `aar`. Hjelperne `koble()` og `losne()` i `lib/actions/arrangementer.ts` oppdaterer ALLE arrangoransvar-rader med samme `(aar, arrangement_navn)` atomisk — flere ansvarlige deler samme arrangement.

**Utkast på agendaen:** `UtkastKort` lenker ansvarlige rett til `/arrangementer/ny?mal=X&aar=Y` (mal forhåndsvalgt), andre til `/arrangoransvar#ansvar-Y-slug` (stabil anker for purring).

**Detaljer:** Se [løsningsdesign §5.4](HK-app_losningsdesign.md#54-kobling-mellom-nytt-arrangement-og-arrangøransvar).

Supabase: Herreklubbens org, Herreklubbens webapp, Database passord: d2F3j$G!-@j!i94