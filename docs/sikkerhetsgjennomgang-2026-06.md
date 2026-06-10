# Sikkerhetsgjennomgang — Mortensrud Herreklubb-appen

**Dato:** 2026-06-10
**Kontekst:** Forberedelse til open source-publisering (issue #296, OS-fase 5). Lisens: MIT. Publisering skjer i nytt, rent repo uten historikk.

---

## 1. Row Level Security (RLS)

Alle 31 tabeller i `public`-schema har RLS aktivert. Default-holdningen er deny-by-default: ingen rad leses eller skrives uten en eksplisitt policy som tillater det.

**Admin-policies** bruker funksjonen `er_admin()` (definert i mig. 041, search_path-låst i mig. 097) i stedet for inline `rolle = 'admin'`-sjekker. Det gjør at rollen `generalsekretaer` automatisk arver admin-rettigheter uten at hver policy må oppdateres.

**Bevisste INSERT-only-via-service_role-tabeller:**

| Tabell | Begrunnelse |
|--------|-------------|
| `varsel_logg` | Har kun SELECT-policy for eier + admin. INSERT skjer via service_role i `sendVarsel()` — brukere kan ikke selv skrive varsler til seg selv eller andre. |
| `vitals_logg` | Har kun SELECT-policy for admin. INSERT skjer via service_role i `/api/vitals`-ruta — ingen innlogget bruker kan manipulere ytelsesdataene. |

Disse er ikke hull — deny-by-default er tilsiktet for skrive-tilgang.

---

## 2. Autorisasjon i server actions og API-ruter

**Server actions** bruker `ensureAdmin()` eller `ensureInnlogget()` fra `lib/auth.ts`. Disse kaster ved manglende autentisering eller utilstrekkelig rolle. RLS er fortsatt sannheten — server action-sjekken gir raskere feilmelding og bedre brukeropplevelse, men er ikke det eneste sikkerhetslaget.

**API-ruter med egne secrets:**

| Rute | Beskyttelsesmekanisme |
|------|-----------------------|
| `/api/cron/paaminne` | `CRON_SECRET` i Authorization-header — verifiseres mot env-variabel før noe annet skjer |
| `/api/github/webhook` | HMAC-SHA256 signatur (`X-Hub-Signature-256`) — verifiseres mot `GITHUB_WEBHOOK_SECRET` |

Begge rutene returnerer 401 umiddelbart ved feil/manglende hemmelighet, uten å røpe detaljer om hva som feilet.

---

## 3. Bevisst eksponering: profil-data

Alle innloggede medlemmer kan lese alle profiler — navn, e-post, rolle, profilbilde. Dette er et bevisst valg for en lukket single-tenant-klubb med ~17 brukere som kjenner hverandre. Det finnes ingen offentlige flater: `anon`-rollen har ikke SELECT-policy på `profiles`.

---

## 4. Rate-limiting

Supabase Auth har innebygd rate-limiting på innlogging og passordtilbakestilling (konfigurerbart i Supabase Dashboard). Ingen egne rate-limiting-tiltak er innført utover det.

**Vurdering:** Appen har ~17 brukere og ingen selvregistrering. Alle API-ruter som kan gjøre ekte arbeid er beskyttet enten av middleware-auth (Supabase session) eller dedikerte secrets (se §2). Risikoen for misbruk fra ikke-innloggede aktører er svært lav. Ekstra rate-limiting er ikke innført og anses som unødvendig på dette brukervolumet.

---

## 5. Dependency-lisenser

Kjørt med `npx license-checker --production --summary` (2026-06-10):

| Lisens | Antall pakker |
|--------|--------------|
| MIT | 132 |
| Apache-2.0 | 9 |
| ISC | 5 |
| BSD-3-Clause | 3 |
| MPL-2.0 | 3 |
| Apache-2.0 AND LGPL-3.0-or-later | 1 |
| CC-BY-4.0 | 1 |
| Unlicense | 1 |
| UNLICENSED | 1 |
| MIT-0 | 1 |
| 0BSD | 1 |

**Totalt:** 158 produksjonsavhengigheter.

### Merknad: MPL-2.0

Tre pakker er lisensiert under Mozilla Public License 2.0: `web-push`, `lightningcss` og `lightningcss-win32-x64-msvc`. MPL-2.0 er en svak copyleft-lisens med fil-nivå copyleft — endringer i de MPL-dekkede filene selv må deles under MPL. Bruk som avhengighet (uten å modifisere disse filenes kildekode) krever ingen copyleft-forpliktelse fra oss. Godkjent for MIT-lisensiert prosjekt i denne bruksformen.

### Merknad: Apache-2.0 AND LGPL-3.0-or-later

`@img/sharp-win32-x64` (den Windows-spesifikke binæren for `sharp`/`next/image`-optimalisering). LGPL-3.0 med "or-later" brukes som avhengighet, ikke innbygget. Standard LGPL-tolkning tillater linking mot LGPL-biblioteker uten copyleft-krav på eget arbeid. Godkjent.

### Merknad: CC-BY-4.0

`caniuse-lite` — data-pakke med nettleserkompabilitetsinformasjon, ikke kode. CC-BY-4.0 for data er standardpraksis for dette prosjektet. Krever bare navngivelse, ingen copyleft. Godkjent.

### Merknad: UNLICENSED

`herreklubben@3.2.0` — det er selve dette prosjektet som rapporteres av `license-checker` (leser sin egen `package.json`). Ikke en ekstern avhengighet.

**Konklusjon:** Ingen avhengigheter med GPL, AGPL eller andre venstrehånds-copyleft-lisenser som ville kontaminert prosjektets MIT-lisensiering. Alle avhengigheter er kompatible med publisering under MIT.
