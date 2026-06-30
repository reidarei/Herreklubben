# Plan: brukerstyrt dark/light mode

Plandokument for å implementere brukerstyrt tema-bytte i Herreklubb-appen. Token-systemet i `docs/tema-arkitektur.md` ligger som fundament — denne planen handler om bryter-mekanikken oppå.

**Status:** Utredning. Avventer beslutninger fra Reidar før implementasjon starter.

---

## Bakgrunn — hva som er klart

Etter tema-rekken (#322 plan, #325 PR-A, #327–#347 PR-B1 til B7) har vi:

- Alle farger som CSS-variabler på `:root` og speilet på `:root[data-theme="dark"]`
- Tailwind v4 `@theme inline`-binding som følger med ved `data-theme`-bytte
- `lib/tema.ts` for JS-konsumenter (manifest, e-post, ICS)
- Klubb-app arver herreklubbens farger som default

Light mode kan legges til ved å definere `:root[data-theme="light"]` med nye verdier. Ingen komponent-endringer trengs — alle leser allerede gjennom tokens.

---

## Beslutninger som må tas

### 1. Persistens-strategi

**✅ Beslutning (2026-06-30):** Cookie + localStorage-speiling.

**Hvorfor det er det åpenbare valget for vår arkitektur:**
- Server (Next.js SSR) kjenner valget på første request via cookie → null FOUC uten inline-script
- iOS Safari PWA: cookies med `Expires` overlever ITP-rydding bedre enn localStorage (som kan tømmes etter 7 dagers inaktivitet)
- localStorage-speiling gjør klient-side bytter umiddelbare uten round-trip

**DB-kolonne ble forkastet:** Appen er kun for mobil-PWA. Hver bruker har én telefon — cross-device-sync har minimal verdi for ~17 medlemmer mot kompleksitets-kostnad (migrasjon, RLS, stale-cookie-edge-case ved kryss-enhet-bytte).

**Hvordan det fungerer i praksis:**
- Cookie `tema=system|dark|light` settes når brukeren velger i innstillinger
- `app/layout.tsx` leser cookien server-side og setter `data-theme` på `<html>` umiddelbart
- For «system»-valg: layout setter `data-theme="dark"` som server-default, og en kort inline-script i `<head>` resolverer til `light` eller `dark` basert på `prefers-color-scheme` før paint
- localStorage skygger cookie for raskere klient-bytter (uten å trenge round-trip til server ved tema-bytte)

---

### 2. Hvor stiller brukeren det inn?

**A. På `/innstillinger`-siden** — egen seksjon «Utseende» med radio-knapper for de tre modusene. Konsistent med andre brukervalg.

**B. Snarvei i TopHeader** — månesymbol/sol-toggle øverst til høyre. Ett klikk for å bytte.

**C. Begge** — TopHeader-toggle som snarvei (kun light/dark), full kontroll under innstillinger.

**✅ Beslutning (2026-06-30):** A — på innstillinger-siden, egen «Utseende»-seksjon. Ikke TopHeader-snarvei.

---

### 3. To eller tre modus?

**To-modus:** Dark + Light. Enkelt.

**Tre-modus:** Dark + Light + System (følger OS' `prefers-color-scheme`, lys på dagen / mørk om kvelden hvis OS er satt til auto).

System-modus er standard i moderne apper og krever bare en `matchMedia`-lytter. Liten kompleksitet, mye verdi for brukere med automatisk OS-tema.

**✅ Beslutning (2026-06-30):** Tre-modus: System, Dark, Light.

**Default ved lansering:** Dark er valgt for alle eksisterende brukere — ingen synlig endring før de selv går inn i innstillinger og velger noe annet. Nye brukere som registreres senere får samme default (Dark), ikke «System» — for å holde defaulten forutsigbar og unngå at nye opplever en plutselig OS-styrt switch.

---

### 4. Light-paletten — hvem designer den?

Light mode er ikke bare «inverter alt». Konkrete spørsmål:

- **Bakgrunn:** Ren hvit `#ffffff` eller off-white med varm undertone (f.eks. `#f5f3ee` for å matche obsidian/sand-stemningen)?
- **Aksent:** Beholdes kremgul/sand `#e8d9b5`, eller blir den dypere (cognac/sienna) for bedre kontrast på lys bg?
- **Tekst:** `--text-primary` mot lys bg — sannsynligvis nær-sort men ikke pitch black (f.eks. `#1a1a10` som matcher dagens `--accent-foreground`)
- **Skyer i SkyBakgrunn:** Hvite skyer blir usynlige mot lys bg. Skal de mørknes eller skjules i light mode?
- **Avatar-hue-formel:** Dagens `oklch(0.28 0.04 ${hue})` er bygget for mørk bg (lette bobler mot mørk). Lys mode trenger trolig `oklch(0.75 0.06 ${hue})` eller lignende
- **Overlays:** `--overlay-backdrop` står på `rgba(0,0,0,0.9)`. Lightbox-erfaring på lys bg — fortsatt svart backdrop, eller lys (f.eks. `rgba(255,255,255,0.9)`)?
- **PWA-splash:** Forblir mørk uansett (manifest leses ved install — kan ikke endres dynamisk per bruker)

**Min anbefaling:** Jeg lager et start-utkast med konkrete hex-verdier som du kan justere visuelt. Det krever en visuell runde der vi ser hvordan agendaen ser ut på lys bg før vi låser paletten.

**✅ Beslutning (2026-06-30):** Reidar bruker Claude Design (Anthropic) til å lage light-paletten. Når den er klar, kommer den som ferdig artefakt (sannsynligvis token-tabell + skjermbilder) som vi bruker som spec i implementasjonen.

---

### 5. Sammensatt eller delt opp?

Tema-rekken viste at puljer fungerer bra. To naturlige måter å dele opp:

**A. Ett issue, én PR:** Design + bryter-mekanikk + iOS-statuslinje + persistens i én leveranse. Mer review-tung, men sammenhengende.

**B. Tre puljer:**
- **B1** — design-pulje (mock + diskuter palett, ingen kode)
- **B2** — bryter + persistens + light-palett-implementasjon (hoved-PR)
- **B3** — iOS-statuslinje + e-post-vurdering (oppfølger)

Cross-device-sync (DB-kolonne) blir uansett egen pulje hvis den lander.

**Min anbefaling:** B. Design-pulje først så vi ser hva vi bygger mot.

**Beslutning:** _avventer_

---

## Tekniske detaljer

### FOUC-håndtering

«Flash of wrong theme» kan unngås med en kombinasjon:

1. **Server-rendret `data-theme`** basert på cookie satt ved første tema-valg
2. **Pre-hydration inline-script** i `<head>` som backup for første besøk (ingen cookie ennå) + OS-preferanse-detektering ved «System»-modus

Mønsteret er kjent fra `next-themes`-pakken. Vi kopierer ideen, ikke biblioteket — det er ~30 linjer egen kode.

### `data-theme="system"` fungerer ikke direkte

CSS aksepterer ikke betinget logikk på `data-theme`-verdien. Når brukeren har valgt «system», må vi:
- I klienten: lytte til `matchMedia('(prefers-color-scheme: dark)')` og sette `data-theme` til `light` eller `dark` basert på OS
- Aldri sette `data-theme="system"` på `<html>` — alltid resolver vi til `light` eller `dark`

Lagringen er fortsatt «system» (det er valget), men attributtet er alltid resolvert.

### iOS-statuslinje

`<meta name="theme-color">` kan oppdateres dynamisk via JS. Når tema endres, oppdater meta-tag-verdien til ny `--bg`-farge. Liten utility — kalles fra samme sted som setter `data-theme`.

PWA-splash (fra `manifest.ts`) kan IKKE oppdateres etter install. Forblir mørk.

### E-post

`lib/epost.ts` har egen palett. E-postklienter (særlig Outlook) støtter ikke `prefers-color-scheme` pålitelig. Pragmatisk: e-post forblir mørk i v1. Hvis vi senere vil ha lyse e-poster, er det egen oppgave med `@media (prefers-color-scheme: light)`-stiler — risiko for rar visning i klienter som ikke støtter det.

### Klubb-app-konsekvens

Endringene er klubb-nøytrale:
- `:root[data-theme="light"]`-blokk i `globals.css` (MÅ MATCHE — speiles automatisk)
- Pre-hydration-script i `layout.tsx` (MÅ MATCHE)
- Toggle-komponent (MÅ MATCHE)
- Bryter-mekanikk i klient-helpers (MÅ MATCHE)
- DB-kolonne hvis det velges (klubb-app må kjøre sin egen migrasjon — en sak for klubb-app-oppsett-doken)

Klubb-app får light mode «gratis» når herreklubben får det.

---

## Andre design-settings — bør de samme stedet?

Senere kandidater for «Utseende»-seksjonen på innstillinger-siden:

- **Font-størrelse** — særlig nyttig for medlemmer over 60. Krever `--font-size-base`-token og scale-system.
- **Reduced motion-override** — i dag følger appen OS' `prefers-reduced-motion`. Eksplisitt brukerkontroll kunne være nyttig.
- **Tetthet** — kompakt vs luftig spacing.

**Min anbefaling:** Hold dark/light som første og eneste designsetting nå. Arkitekturen vi bygger her (persistens-mønster, innstillinger-seksjon) gjenbrukes når andre settings kommer.

---

## Neste steg

1. Reidar fyller inn beslutningene over
2. Hvis B (delt opp) — opprett issue for design-pulje med min start-utkast på light-palett
3. Når designet er låst — opprett issue for hoved-PR (bryter + light-palett)
4. Iterativ utrulling
