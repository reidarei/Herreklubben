# Klubb-tilpasning

Denne guiden beskriver hva som må (eller bør) endres for å tilpasse appen til din egen klubb. Alt som er spesifikt for Mortensrud Herreklubb er gjort konfigurerbart via env-vars eller enkel fil-erstatning.

---

## 1. Klubbidentitet

Alle klubb-spesifikke tekstverdier samles i `lib/klubb-config.ts`. Verdiene leses fra `NEXT_PUBLIC_`-env-vars med hardkodede defaults som fallback. Det betyr at eksisterende deploy ikke endrer seg om du ikke setter env-varsene — men du bør sette dem alle for din instans.

| Env-var | Default | Beskrivelse | Eksempel |
|---|---|---|---|
| `NEXT_PUBLIC_KLUBB_NAVN` | `Mortensrud Herreklubb` | Fullt navn, brukes i titler og e-postutsendelser | `Bygdøy Vinterklubb` |
| `NEXT_PUBLIC_KLUBB_KORTNAVN` | `Herreklubben` | Kort navn, brukes i navigasjon og push-varsler | `Vinterkubben` |
| `NEXT_PUBLIC_KLUBB_NAVN_LINJE_1` | `Mortensrud` | Første linje i to-linjers hero-typografi (klubbinfo-siden, jubileumskort) | `Bygdøy` |
| `NEXT_PUBLIC_KLUBB_NAVN_LINJE_2` | `Herreklubb` | Andre linje i to-linjers hero-typografi | `Vinterklubb` |
| `NEXT_PUBLIC_KLUBB_BESKRIVELSE` | `Privat klubbapp for <KLUBB_NAVN>` | PWA-beskrivelse (manifest og meta-tags) | `Privat klubbapp for Bygdøy Vinterklubb` |
| `NEXT_PUBLIC_KLUBB_DOMENE` | `mortensrudherreklubb.no` | Kun hostname — brukes som base for prod-URL og i ICS-UID/PRODID. Må være ASCII, ingen mellomrom eller skråstrek. | `bygdoyvinterklubb.no` |
| `NEXT_PUBLIC_KLUBB_STIFTET_AAR` | `2007` | Stiftelsesår — brukes til å beregne jubileum på agendaen | `2015` |
| `NEXT_PUBLIC_KLUBB_STIFTET_MAANED` | `11` | Stiftelsesmåned (1–12) | `3` |
| `NEXT_PUBLIC_KLUBB_STIFTET_DAG` | `24` | Stiftelsesdag (1–31) | `17` |
| `NEXT_PUBLIC_KLUBB_STED` | `Søndre Nordstrand` | Stiftelsessted, vises på klubbinfo-siden | `Frogner` |
| `NEXT_PUBLIC_ROLLE_TITTEL_GENERALSEKRETAER` | `Generalsekretær` | Visningsnavn for den særegne rollen med gul glød. Rolle-koden i DB (`generalsekretaer`) endres ikke. | `Æresmedlem` |

Sett disse i `.env.local` lokalt og som Vercel Environment Variables i produksjon.

> Merk at `NEXT_PUBLIC_KLUBB_DOMENE` kun er en identifikator — den brukes ikke til å generere live lenker. `BASE_URL` i `lib/config.ts` håndterer actual-URL.

---

## 2. Ikoner og favicon

Disse filene i `public/` må byttes ut med dine egne bilder:

| Fil | Dimensjoner | Bruk |
|---|---|---|
| `public/favicon-16.png` | 16 × 16 px | Browser-fane (liten) — referert fra `app/layout.tsx` og `public/sw.js` |
| `public/favicon-32.png` | 32 × 32 px | Browser-fane (normal) — referert fra `app/layout.tsx` og `public/sw.js` |
| `public/icon-192.png` | 192 × 192 px | PWA-ikon, hjemskjerm — referert fra `manifest.ts`, `layout.tsx`, `sw.js` (også som push-badge) |
| `public/icon-512.png` | 512 × 512 px | PWA-ikon, splash-screen — referert fra `manifest.ts`, `layout.tsx`, `sw.js` og login-siden som logo |
| `public/icon-180.png` | 180 × 180 px | Apple Touch Icon (iOS hjemskjerm) — referert fra `app/layout.tsx` og `sw.js` |
| `public/icon-maskable-192.png` | 192 × 192 px | PWA-ikon med «safe zone» for adaptiv maskering (Android) |
| `public/icon-maskable-512.png` | 512 × 512 px | PWA-ikon med «safe zone» for adaptiv maskering (Android) |
| `public/bakgrunn.jpg` | Fri størrelse | Bakgrunnsbilde brukt på login-siden |

Filene `public/icon-1024.png` og `public/icon-2000.png` ligger i repoet som høyoppløselige master-bilder for fremtidig bruk (App Store-ikon, marketing), men refereres ikke i kode i dag. Du kan ignorere dem eller fjerne dem.

PWA-manifestet (`app/manifest.ts`) er allerede koblet til klubbnavnet via env-vars og peker på de to PWA-ikonene (192 og 512). Du trenger ikke endre kode — bare bytt bildefilene med samme filnavn.

For maskable-ikonene: selve motivet bør holdes innenfor en sirkel på ca. 80 % av bildeflaten («safe zone»). Verktøy som [maskable.app](https://maskable.app) lar deg forhåndsvise resultatet.

---

## 3. Farger og tema

Farger styres via CSS custom properties i `app/globals.css`. Det finnes ingen `tailwind.config.ts` — Tailwind v4 trenger ikke det. Tokenene er bundet til Tailwind-utilities via `@theme inline` slik at f.eks. `bg-accent` plukker `--accent` automatisk. Komponenter bruker tokenene via `var(--token)` eller Tailwind-klasser.

For JS-kontekster som ikke kan lese CSS-variabler (manifest, e-postmaler, ICS-filer) finnes et tynt speil i `lib/tema.ts`.

Se **[docs/tema-arkitektur.md](tema-arkitektur.md)** for fullstendig arkitekturbeskrivelse og tokenliste.

**Brand-farger overstyres via env-vars** — fire variabler lar din klubb tilpasse aksent og bakgrunn uten å endre kode:

| Env-var | Default (Herreklubbens verdier) | Beskrivelse |
|---|---|---|
| `NEXT_PUBLIC_KLUBB_FARGE_PRIMAER` | `#e8d9b5` | Aksent-farge |
| `NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_SOFT` | `rgba(232, 217, 181, 0.16)` | Myk aksent (bakgrunnsflater) |
| `NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_HOT` | `#f5e8c8` | Hover/aktiv aksent |
| `NEXT_PUBLIC_KLUBB_FARGE_BAKGRUNN` | `#0e0f13` | Primær bakgrunn |

Sett disse i `.env.local` lokalt og som Vercel Environment Variables i produksjon. Uten env-overrides arver du Herreklubbens fargeopplevelse.

---

## 4. Roller

### De tre rollene

Appen har tre faste roller definert i `lib/roller.ts`:

| Rollekode (i DB) | Standardtittel | Har admin-rettigheter | Gul glød | Løser tiebreak |
|---|---|---|---|---|
| `medlem` | Medlem | Nei | Nei | Nei |
| `admin` | Admin | Ja | Nei | Nei |
| `generalsekretaer` | Generalsekretær | Ja | Ja | Ja |

Tittelen for `generalsekretaer`-rollen kan overstyres via env-var `NEXT_PUBLIC_ROLLE_TITTEL_GENERALSEKRETAER` (se tabell i seksjon 1). Rolle-koden i databasen endres ikke.

### Viktig: nye roller krever migrasjon

Rettighetsmatrisen i `lib/roller.ts` er kun kode-siden. Databasen har sin egen `er_admin()`-SQL-funksjon som brukes i alle RLS-policies. Denne returnerer `true` for `admin` og `generalsekretaer` — ingen andre roller. Hvis du legger til en ny rolle med admin-rettigheter i matrisen, **må du også oppdatere `er_admin()` i en ny migrasjon**. Uten dette vil RLS blokkere den nye rollen uansett hva kode-siden sier.

### Generalsekretær settes via UI

Etter opprettelse av et medlem settes generalsekretær-rollen via Innstillinger → Medlemmer → Rediger → «Generalsekretær»-toggle. Databasen håndhever at maks én person har rollen (partial unique index, migrasjon 094).

---

## 5. Arrangement-maler og arrangøransvar

Hvilke faste arrangementer som finnes (møter, turer, o.l.) og hvem som er ansvarlig for dem hvert år, er **data** i databasen — ikke hardkodet i koden.

Dette styres i `arrangoransvar`-tabellen. Kolonnene `aar`, `arrangement_navn` og `type` (moete|tur) bestemmer hva som vises i nedtrekk-menyen «Type arrangement» når en bruker oppretter et nytt arrangement.

For å sette opp ditt eget årshjul:

1. Logg inn som admin.
2. Gå til **Arrangoransvar** i menyen.
3. Opprett ansvar for hvert fast arrangement per år — hvem som er ansvarlig og for hva.

Arrangement-navnene du skriver der, vises som valg i nedtrekk-menyen. Det er ingen forhåndsdefinert liste i koden.

---

## 6. Andre miljø-avhengige verdier

Utover klubbidentiteten i seksjon 1 har `lib/config.ts` flere verdier med hardkodede defaults som peker på **referanse-instansen** (Mortensrud Herreklubb). **Disse må overstyres med dine egne verdier i Vercel-env-vars og `.env.local`** før din instans tas i bruk — ellers sender appen kontakt-headere og lenker som peker tilbake til referanse-oppsettet.

| Env-var | Default i koden | Hva den styrer | Når må den settes? |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Auto: `VERCEL_URL`, ellers `https://mortensrudherreklubb.no` i prod, ellers `http://localhost:3000` | Absolutte URL-er i push-/e-postvarsler, ICS-filer, GitHub-webhook-lenker | Sett til din prod-URL hvis du ikke vil arve referanse-defaulten i prod. På Vercel arves `VERCEL_URL` automatisk for preview-deploys. |
| `VAPID_CONTACT_EMAIL` | *(ingen — push feiler med tydelig melding uten)* | Kontakt-e-post i VAPID-headere — push-tjenester (Apple/Google) bruker den ved misbruk eller tekniske problemer. Ingen e-post sendes via denne — kun metadata. | **Må settes** for din instans. Bruk en e-post du faktisk leser. |
| `NEXT_PUBLIC_GITHUB_REPO` | `reidarei/Herreklubben` | Hvilket GitHub-repo «innspill»-funksjonen leser issues fra | Sett til ditt eget repo (`brukernavn/reponavn`) hvis du bruker innspill-funksjonen. |
| `NEXT_PUBLIC_GITHUB_ONSKE_LABEL` | `ønske` | Hvilken issue-label som regnes som brukerønske | Bytt hvis du vil bruke en annen label-konvensjon. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` (eller `R2_PUBLIC_URL`) | `''` (tom) | Public CDN-URL hvor bilder hentes fra (`https://<din-pub-id>.r2.dev` eller custom domain) | **Må settes** — bilder vises ikke uten. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Ingen | R2-credentials og bucket-navn (server-side; ALDRI med `NEXT_PUBLIC_`-prefiks) | **Må settes** for bildelagring. Marker som «Sensitive» i Vercel. |

> Defaults i `lib/config.ts` er bevart med hensikt — å fjerne dem i kodebasen ville krevd koordinert env-var-setting på referanse-instansen samme dag. Etter at din instans har env-varsene satt, kan defaults nøytraliseres i en senere PR uten å bryte produksjonen.
