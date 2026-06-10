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
| `NEXT_PUBLIC_KLUBB_STIFTET_DAG` | `24` | Stiftelsedag (1–31) | `17` |
| `NEXT_PUBLIC_KLUBB_STED` | `Søndre Nordstrand` | Stiftelsessted, vises på klubbinfo-siden | `Frogner` |
| `NEXT_PUBLIC_ROLLE_TITTEL_GENERALSEKRETAER` | `Generalsekretær` | Visningsnavn for den særegne rollen med gul glød. Rolle-koden i DB (`generalsekretaer`) endres ikke. | `Æresmedlem` |

Sett disse i `.env.local` lokalt og som Vercel Environment Variables i produksjon.

> Merk at `NEXT_PUBLIC_KLUBB_DOMENE` kun er en identifikator — den brukes ikke til å generere live lenker. `BASE_URL` i `lib/config.ts` håndterer actual-URL.

---

## 2. Ikoner og favicon

Disse filene i `public/` må byttes ut med dine egne bilder:

| Fil | Dimensjoner | Bruk |
|---|---|---|
| `public/favicon-16.png` | 16 × 16 px | Browser-fane (liten) |
| `public/favicon-32.png` | 32 × 32 px | Browser-fane (normal) |
| `public/icon-192.png` | 192 × 192 px | PWA-ikon, hjemskjerm (standard) |
| `public/icon-512.png` | 512 × 512 px | PWA-ikon, splash-screen |
| `public/icon-maskable-192.png` | 192 × 192 px | PWA-ikon med «safe zone» for adaptiv maskering (Android) |
| `public/icon-maskable-512.png` | 512 × 512 px | PWA-ikon med «safe zone» for adaptiv maskering (Android) |
| `public/icon-1024.png` | 1024 × 1024 px | Høyoppløselig master (brukes bl.a. av iOS ved installasjon) |
| `public/icon-180.png` | 180 × 180 px | Apple Touch Icon (iOS hjemskjerm) |
| `public/bakgrunn.jpg` | Fri størrelse | Bakgrunnsbilde brukt på login-siden |

PWA-manifestet (`app/manifest.ts`) er allerede koblet til klubbnavnet via env-vars og peker på de fire PWA-ikonene. Du trenger ikke endre kode — bare bytt bildefilene med samme filnavn.

For maskable-ikonene: selve motivet bør holdes innenfor en sirkel på ca. 80 % av bildeflaten («safe zone»). Verktøy som [maskable.app](https://maskable.app) lar deg forhåndsvise resultatet.

---

## 3. Farger og tema

Det finnes ikke ett sentralt sted som styrer alle farger. Det er verdt å si usminket: appen bruker overveiende inline-styles (objekt-literaler) fremfor CSS-variabler eller et Tailwind-tema.

Grep-søk for å finne farge-verdier:

```bash
grep -r "#060608\|#18181b\|#a855f7" --include="*.tsx" --include="*.ts" .
```

Noen ankerpunkter:

- **`app/globals.css`** — liten CSS-fil med noen CSS custom properties og base-stiler. Inneholder ikke hele temaet.
- **`app/manifest.ts`** — `background_color` og `theme_color` er hardkodet til `#060608` (mørk bakgrunn). Endre disse om du vil et annet PWA-splash-tema.
- **Tailwind-konfig (`tailwind.config.ts`)** — installert, men brukes lite. Fargepalett er ikke utvidet der.

Skal du endre fargetema gjennomgående, er det en manuell jobb. Det finnes ingen enkel «bytt primærfarge»-knapp i denne kodebasen.

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
