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

### 5. PR-deling med Claude Design-handoff

**✅ Beslutning (2026-06-30):** To PR-er. Claude Design leverer light-paletten separat; vi koder mot en spec.

**PR1 — bryter-mekanikk** (kjøres nå):
- Cookie + localStorage-persistens
- Server-rendret `data-theme`-attributt + pre-hydration-script for «System»-modus
- iOS-statuslinje-oppdatering ved tema-bytte
- «Utseende»-seksjon i `/innstillinger` med to valg synlig: **System** og **Dark**. «Light» legges til i PR2.
- Default: Dark (eksplisitt — alle nye og eksisterende brukere)

**PR2 — light-palett-aktivering** (kjøres når Claude Design har levert):
- `:root[data-theme="light"]`-blokk i `globals.css` med Claude Designs token-verdier
- Avatar-hue-justering for light bg
- SkyBakgrunn-tilpasning for light bg
- «Light» legges til som tredje valg i innstillinger-seksjonen
- Verifisering: visuell sjekk av alle hovedflater på light

Hvorfor «Light» ikke vises i PR1: vi unngår å lande en knapp som ikke gjør noe synlig. PR1 leverer ren ny funksjonalitet (system-følging blir reelt verdt selv uten light, fordi den følger OS-dark når OS-en er dark — som har vært tilfelle hele tiden). Brukere får ingen forvirrende halv-feature.

---

## Handoff-spec til Claude Design

Reidar kjører light-palettarbeidet i Claude Design separat. For at PR2 skal være triviell trenger vi leveransen i et bestemt format. Spec under fungerer som «kontrakt» mellom designarbeidet og kode-implementasjonen.

### Hva Claude Design må produsere

**1. Token-verditabell** — én rad per CSS-variabel i `app/globals.css` (~35 totalt), med ny verdi for light-modus.

Mal:

| Token | Dark-verdi (referanse) | Light-verdi (Claude Design fyller inn) |
|---|---|---|
| `--bg` | `#0e0f13` | `?` |
| `--bg-elevated` | `rgba(40, 42, 50, 0.95)` | `?` |
| `--bg-elevated-2` | `rgba(54, 56, 64, 0.97)` | `?` |
| `--bg-header` | `rgba(14, 15, 19, 0.85)` | `?` |
| `--bg-elevated-solid` | `#282a32` | `?` |
| `--border` | `rgba(255, 255, 255, 0.16)` | `?` |
| `--border-strong` | `rgba(255, 255, 255, 0.26)` | `?` |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | `?` |
| `--text-primary` | `#f5f5f7` | `?` |
| `--text-secondary` | `#dadce2` | `?` |
| `--text-tertiary` | `#c0c4cc` | `?` |
| `--accent` | `#e8d9b5` | `?` |
| `--accent-soft` | `rgba(232, 217, 181, 0.16)` | `?` |
| `--accent-hot` | `#f5e8c8` | `?` |
| `--accent-foreground` | `#1a1a10` | `?` |
| `--success` | `#7cc99a` | `?` |
| `--success-soft` | `rgba(124, 201, 154, 0.14)` | `?` |
| `--success-border` | `rgba(124, 201, 154, 0.34)` | `?` |
| `--success-hot` | `#a8dbb8` | `?` |
| `--danger` | `#d97a6c` | `?` |
| `--danger-alt` | `#e87060` | `?` |
| `--danger-soft` | `rgba(217, 122, 108, 0.14)` | `?` |
| `--danger-border` | `rgba(217, 122, 108, 0.34)` | `?` |
| `--danger-hot` | `#e89080` | `?` |
| `--warning` | `#e8a96b` | `?` |
| `--warning-soft` | `rgba(232, 169, 107, 0.14)` | `?` |
| `--warning-border` | `rgba(232, 169, 107, 0.34)` | `?` |
| `--warning-hot` | `#f0bc80` | `?` |
| `--overlay-backdrop` | `rgba(0, 0, 0, 0.9)` | `?` |
| `--overlay-soft` | `rgba(0, 0, 0, 0.5)` | `?` |
| `--overlay-control-bg` | `rgba(0, 0, 0, 0.65)` | `?` |
| `--overlay-control-ring` | `rgba(255, 255, 255, 0.25)` | `?` |
| `--shadow-floating` | `0 4px 16px rgba(0, 0, 0, 0.18)` | `?` |
| `--shadow-popover` | `0 6px 18px rgba(0, 0, 0, 0.35)` | `?` |
| `--shadow-modal` | `0 12px 40px rgba(0, 0, 0, 0.5)` | `?` |

**2. Avatar-hue-formel for light-bg**

Dagens formel for dark: `oklch(0.28 0.04 ${hue})` — gir mørke, lett-mettede bobler mot mørk bg.

Claude Design må spesifisere ny formel for light, f.eks. `oklch(0.85 0.06 ${hue})` eller `oklch(0.75 0.08 ${hue})`. Vi vil ha:
- Lyse bobler synlige mot lys bg
- Beholde identitets-variasjon (samme hue per navn, bare lysere baseline)
- Tekst-fargen oppi bobla må fortsatt være leselig (sannsynligvis bytte fra hvit til mørk i light-modus)

**3. SkyBakgrunn-håndtering**

Dagens `components/SkyBakgrunn.tsx` har hvite SVG-skyer mot mørk bg. På lys bg blir hvite skyer usynlige. Tre alternativer Claude Design må velge mellom:

- **A:** Skjul skyene helt i light-modus (`opacity: 0` når `data-theme="light"`)
- **B:** Bytt skyene til lett grå/blå i light-modus (men da må SVG-en ta `currentColor` eller en CSS-variabel)
- **C:** Behold hvite skyer med subtil drop-shadow så de blir synlige

Claude Designs valg + evt. CSS-snippet trengs.

**4. iOS theme-color for light**

Manifest og PWA-splash forblir mørk uansett (kan ikke endres etter install). Men `<meta name="theme-color">` (iOS-statuslinje under app-bruk) bør være `--bg`-verdien for valgt tema. Når brukeren bytter til light skal statuslinjen følge med.

Claude Design trenger bare bekrefte at light `--bg`-verdien fra punkt 1 er det vi vil ha på statuslinjen.

**5. Visuell verifikasjon — skjermbilder**

Mock-up eller skjermbilder av minst tre nøkkelflater i light-modus:
- Agenda (forsiden — viktigst, mest brukt)
- En arrangement-detalj med påmeldte
- Chat-tråd med flere meldinger

Brukes som referanse når vi implementerer + verifiserer at light-modus ser ut som tenkt.

### Hva Claude Design IKKE trenger å levere

- E-postmaler — `lib/epost.ts` forblir mørk uavhengig av brukerens tema-valg
- PWA-splash — låst til mørk fra manifest, kan ikke endres dynamisk
- Token-arkitektur eller -navngivning — beholdes som i dark-modus, kun verdiene endres
- Komponent-endringer — alle komponenter bruker allerede tokens, så de følger med automatisk

### Format på leveranse

Når Claude Design er ferdig, kan resultatet leveres som:
- **Markdown-tabell** (samme format som over, med utfylte verdier) — enkleste form
- **CSS-snippet** med ferdig `:root[data-theme="light"]`-blokk
- **Begge**, hvis ønsket

PR2 blir da en mekanisk «lim inn verdier»-PR — ingen designarbeid igjen.

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
