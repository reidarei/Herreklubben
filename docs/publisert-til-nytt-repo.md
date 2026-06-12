# Manifest for publisering til nytt repo (fase 6)

Sjekkliste over hva som kopieres til det nye, rene open source-repoet og hva som ikke gjør det. Fase 6 tar selve repo-opprettelsen, LICENSE og SECURITY.md.

---

## Kopieres

### Dokumentasjon
- `README.md` (omskrevet for eksternt publikum — denne versjonen)
- `docs/oppsett.md`
- `docs/klubb-tilpasning.md`
- `docs/drift.md`
- `docs/sikkerhetsgjennomgang-2026-06.md`
- `HK-app_kravspesifikasjon.md`
- `HK-app_losningsdesign.md`
- `CLAUDE.md` (sanitert — eget avsnitt nedenfor)

### Kildekode
- `app/` — hele Next.js-applikasjonen
- `components/` — alle komponenter
- `lib/` — alle helpere, actions, supabase-clients
- `supabase/migrations/` — alle SQL-migrasjoner (+ `supabase/config.toml` med nøytral project_id)
- `types/` — globale TypeScript-deklarasjoner (`css.d.ts` — build feiler uten)
- `__tests__/` — enhets-tester
- `e2e/` — Playwright-tester

### Konfig og infra
- `package.json`, `package-lock.json`
- `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `postcss.config.mjs`, `eslint.config.mjs`
- `vitest.config.ts`, `playwright.config.ts`
- `middleware.ts` — Next.js auth-guard, krevd ved kjøring
- `vercel.json` — Vercel-region/build-konfig
- `.env.example`
- `.gitignore` (`.gitattributes` finnes ikke i kilderepoet)
- `.github/workflows/paaminne.yml`
- `.github/workflows/keepalive.yml` — holder Supabase free tier aktiv, generisk nyttig

### Genererte/build-artifakter — kopieres med?
- `lib/supabase/database.types.ts` — **kopieres med** som utgangspunkt. Fila er generert per Supabase-instans (`npx supabase gen types`), men `next build` krever at den finnes. Nytt repo bør levere én versjon som matcher migrasjoner i `supabase/migrations/`, og dokumentere at den må regenereres etter første `db push` mot egen instans.

### Public-assets
- `public/` — alle filer (ikoner, bakgrunn, sw.js)

---

## Kopieres IKKE

### Git-historikk
Nytt repo starter rent uten historikk. Historikken i det private repoet kan inneholde midlertidige debug-commits med sensitiv info, og ekte profilbilder/skjermbilder sjekket inn som binærfiler.

### Design/ (hele mappa)
Ble først kopiert med (unntatt `skjermbilder/`), men fjernet 2026-06-12: mockup-filene inneholder fornavn som ligner ekte medlemmer, og mappa trengs ikke for å ta appen i bruk. `Design/skjermbilder/` var aldri med — bilder fra produksjon med ekte medlemsnavn og ansikter. Anonymiserte skjermbilder lages separat til README. `e2e/visuell.spec.ts` ble fjernet samtidig (krever designreferansene for å kjøre).

### .claude/
Lokal Claude Code-konfigurasjon, minnefiler og feedback-notater. Inneholder prosjektintern kontekst som ikke er relevant for eksterne og potensielt interne referanser som ikke bør publiseres.

### scripts/ — AUDIT PÅKREVD
**Hvert script i `scripts/`-mappen må auditeres individuelt** før det eventuelt kopieres:

- Engangsimport-scripts (`fb-*`, `import-*.mjs`, `import-messenger-klubbchat.mjs`) er kjørt én gang og er ikke relevante for en ny instans. De inneholder logikk tett koblet til Facebook-dataeksport-formatet og data-filpaths som er spesifikke for det opprinnelige oppsettet.
- Noen scripts i denne mappen har tidligere hatt klartekst database-passord eller klartekst Supabase service-role-nøkler i kommentarer eller hardkodet. En historikk-sjekk viste at disse er fjernet fra nåværende versjon, men scripts i seg selv har ikke verdi for en ny instans.
- **Whitelistede scripts som kopieres til nytt repo** (verifisert relevante for ny instans, ingen historiske persondata):
  - `init-admin.mjs` — interaktivt verktøy for å opprette første admin etter migrasjoner er kjørt
  - `sjekk-miljo.mjs` — miljøvariabel-validering brukt av `npm run sjekk-miljo`
  - `stamp-versjon.mjs` — versjons-stamping brukt av `npm run stamp-versjon`
- `r2-browser.mjs` og `foreslaa-messenger-mapping.mjs` er nyttige verktøy — vurder individuelt.
- Alle øvrige `fb-*.mjs`/`fb-*.json`/`fb-*.sql`, `import-album.mjs`, `import-messenger-klubbchat.mjs` og `scripts/data/` utelates.

### scripts/data/
Datafiler fra Facebook-import (JSON-eksporter, bildemapping). Inneholder historiske personopplysninger.

### fb-arrangementer.json, fb-import.sql m.fl.
Alle filer i `scripts/` med `fb-`-prefiks og tilhørende SQL-dumps er persondata-spesifikk for den opprinnelige instansen.

### Lokale build-/dev-artifakter og hemmeligheter
- `.env.local` — inneholder hemmeligheter, ALDRI med
- `.next/` — Next.js build-output, regenereres
- `node_modules/` — regenereres med `npm install`
- `.cache/`, `.vercel/`, `test-results/`, `tsconfig.tsbuildinfo` — lokale artifakter, ikke relevante

---

## Filer som lages i fase 6

Disse eksisterer ikke ennå og opprettes i det nye repoet:

- `LICENSE` — MIT med Reidars navn og 2025-startår
- `SECURITY.md` — ansvarlig avsløring, kontaktadresse, scope
- `CLAUDE.md` (sanitert versjon) — uten prosjektintern kontekst (se nedenfor)

### Andre leveranser i fase 6

- **Nøytraliser personlige defaults i `lib/config.ts`** — `VAPID_CONTACT_EMAIL` nøytralisert 2026-06-12 (ingen default; push feiler tydelig uten) etter at env-varen ble satt i referanse-instansens Vercel.
- **Full identitets-skrubbing 2026-06-12** (bevisst divergens fra kilde-repoet — kilde beholder Mortensrud-identiteten, klubb-app er 100 % generisk):
  - `lib/klubb-config.ts`: defaults → `Min Klubb` / `Klubben` / `klubb.example.com` / stiftet 2024-01-01 / `Oslo`. `KLUBB_OM_AVSNITT` (2026-06-12): «Om klubben»-teksten på klubbinfo-siden er nå env-konfigurerbar (`NEXT_PUBLIC_KLUBB_OM`, `|`-separerte avsnitt) — kilde-defaulten er Mortensrud-teksten, klubb-app-defaulten er generisk plassholder
  - `lib/config.ts`: `GITHUB_REPO`-default → `reidarei/klubb-app` (slik at innspill-funksjonen virker out-of-the-box i det åpne repoet)
  - `lib/epost.ts`: `RESEND_FROM`-default → `Klubben <onboarding@resend.dev>`
  - `lib/r2.ts`: bucket-default → `klubb-bilder`; `next.config.ts`: hostname-eksempel → `bilder.klubb.example.com`
  - `public/sw.js`: cache-navn → `klubb-static` / `klubb-pages-*`
  - `supabase/migrations/096_vedtekter_seed_avhardkoding.sql`: omskrevet til no-op (`select 1;`) for å beholde migrasjonsnummereringen — seed-teksten var Mortensrud-spesifikk
  - `supabase/migrations/027_fix_oyvind_tittel.sql`: omdøpt til `027_data_fiks_no_op.sql` og omskrevet til no-op — engangs data-fiks med medlemsnavn i både filnavn og innhold
  - Medlemsnavn skrubbet fra kodekommentarer (lib/konstanter.ts, TopHeader, VarslerListe), om-appen-UI og mention-test-fixtures. Grep-sjekk ved fremtidig synk: både klubbnavn («mortensrud», «herreklubb») OG medlemsnavn (se scripts/fb-bilder-navn-mapping.json for listen).
  - `.gitignore`: Messenger-eksport-blokken fjernet
  - Alle md-dokumenter (README, CLAUDE.md, docs/, kravspek, løsningsdesign) skrubbet for «Mortensrud»/«Herreklubb»
  - Synk-regel fremover: endringer i disse filene fra kilde-repoet må re-skrubbe identitet før kopiering.

---

## CLAUDE.md-sanitering

Nåværende `CLAUDE.md` inneholder:

- Referanser til det private repo-URLen og Supabase-prosjekt-IDen i kommando-eksempler — byttes til plassholdere.
- Sparekonto-referansen i «Prosjekt»-avsnittet kuttes for å redusere prosjekt-spesifikk støy som ikke er relevant for eksterne lesere.
- Ellers er CLAUDE.md verdifull for eksterne som vil bruke AI-assistert utvikling — behold policies, arkitektur-oversikt og konvensjoner.

---

## Sjekkliste før fase 6

- [ ] Grep-sjekk for ekte navn (se navneliste i CLAUDE.md-policies)
- [ ] Grep-sjekk for hardkodede e-postadresser
- [ ] Grep-sjekk for `mortensrudherreklubb.no` — disse skal være via `lib/klubb-config.ts` eller `lib/config.ts`, ikke hardkodet
- [ ] Bekreft at `Design/` IKKE er med (hele mappa, fjernet 2026-06-12)
- [ ] Bekreft at `.claude/` IKKE er med
- [ ] Bekreft at scripts-audit er gjort
- [ ] LICENSE opprettet
- [ ] SECURITY.md opprettet
- [ ] README-en peker til `<ditt-repo-url>` og ikke til privat repo
