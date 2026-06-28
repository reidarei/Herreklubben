# Tema-arkitektur

Dette dokumentet beskriver hvordan farger og tema håndteres i appen, og hvilken migreringskø som gjennomfører overgangen fra spredte hex-verdier til et konsolidert token-system.

---

## 1. Sammendrag

> **Merk:** Beskrivelsen under er målbildet etter PR-A. Dagens kode bruker fortsatt spredte hex-verdier; arkitekturen rulles ut gjennom PR-køen i seksjon 5.

**CSS er sannheten.** Alle fargetokens defineres i `app/globals.css` under `:root` (og `:root[data-theme="dark"]`). `@theme inline` i Tailwind v4 knytter tokenene til Tailwind-utilities automatisk — ingen `tailwind.config.ts`-fil er nødvendig.

`lib/tema.ts` er et tynt JS-speil: den eneste filen som kjenner til hex-verdier utover CSS. Den brukes kun der CSS-variabler ikke er tilgjengelig (manifest JSON, e-postmaler, ICS-filer).

**v1 er statisk dark mode:** `<html data-theme="dark">` settes i `app/layout.tsx` og endres aldri i v1. Ingen tema-bytting, ingen localStorage-sjekk, ingen pre-hydration-script. Light mode og brukervalg er v2.

**Klubb-app speiler `globals.css`** — filen er MÅ-MATCHE i sync-skriptet og skal være byte-identisk. Brand-farger som varierer per klubb overstyres via fire `NEXT_PUBLIC_KLUBB_FARGE_*`-env-vars som injiseres som inline `<style>` i `<head>`. Klubb-app uten env-overrides arver Herreklubbens fargeopplevelse.

---

## 2. Tokens i `globals.css`

Etter PR-A skal alle tokens ligge i `:root` i `globals.css` og bindes til Tailwind v4 via `@theme inline`. Tokens speiles på `:root[data-theme="dark"]` med identiske verdier — dette forbereder en eventuell light-overlay i v2 uten at vi trenger å restrukturere CSS-en.

### Bakgrunn

| Token | Verdi | Bruk |
|---|---|---|
| `--bg` | `#0e0f13` | Sidebakgrunn |
| `--bg-gradient` | radial+linear | Bakgrunns-gradient (se globals.css for full verdi) |
| `--bg-elevated` | `rgba(40, 42, 50, 0.95)` | Kort, modaler, første nivå |
| `--bg-elevated-2` | `rgba(54, 56, 64, 0.97)` | Andre nivå elevated-flater |

### Kantlinjer

| Token | Verdi |
|---|---|
| `--border` | `rgba(255, 255, 255, 0.16)` |
| `--border-strong` | `rgba(255, 255, 255, 0.26)` |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` |

### Tekst

| Token | Verdi |
|---|---|
| `--text-primary` | `#f5f5f7` |
| `--text-secondary` | `#dadce2` |
| `--text-tertiary` | `#c0c4cc` |

### Aksent (brand-farge — kan overstyres via env)

| Token | Verdi | Merknad |
|---|---|---|
| `--accent` | `#e8d9b5` | Sand/beige aksent |
| `--accent-soft` | `rgba(232, 217, 181, 0.16)` | Subtil bakgrunn |
| `--accent-hot` | `#f5e8c8` | Hover/aktiv-tilstand |
| `--accent-foreground` | `#1a1a10` | **Ny i PR-A** — mørk tekst på aksent-bakgrunn |

### Semantisk

| Token | Verdi | Merknad |
|---|---|---|
| `--success` | `#7cc99a` | |
| `--success-soft` | `rgba(110, 170, 120, 0.14)` | |
| `--success-border` | `rgba(110, 170, 120, 0.34)` | |
| `--success-hot` | `#a8dbb8` | **Ny i PR-A** — sterkere success for hover/badge |
| `--danger` | `#d97a6c` | |
| `--danger-alt` | `#e87060` | |
| `--danger-soft` | `rgba(200, 90, 80, 0.14)` | |
| `--danger-border` | `rgba(200, 90, 80, 0.34)` | |
| `--danger-hot` | `#e89080` | **Ny i PR-A** — hover/aktiv danger |
| `--warning` | `#e8a96b` | |
| `--warning-soft` | `rgba(230, 160, 100, 0.14)` | |
| `--warning-border` | `rgba(230, 160, 100, 0.34)` | |
| `--warning-hot` | `#f0bc80` | **Ny i PR-A** — hover/aktiv warning |

### Fonter

| Token | Verdi |
|---|---|
| `--font-display` | `var(--font-instrument), Georgia, serif` |
| `--font-body` | `var(--font-inter), -apple-system, system-ui, sans-serif` |
| `--font-mono` | `var(--font-jetbrains), ui-monospace, monospace` |

### Layout og form

| Token | Verdi |
|---|---|
| `--top-header-h` | `60px` |
| `--radius` | `18px` |
| `--radius-card` | `14px` |
| `--radius-small` | `12px` |
| `--radius-pill` | `999px` |

### Blur

| Token | Verdi |
|---|---|
| `--blur-card` | `blur(24px) saturate(160%)` |
| `--blur-nav` | `blur(40px) saturate(200%) brightness(1.1)` |
| `--blur-glass` | `blur(16px)` |

### Bakoverkompatible aliaser (fjernes i PR-B6)

| Token | Peker til |
|---|---|
| `--bg-tertiary` | `--bg-elevated-2` |
| `--accent-subtle` | `--accent-soft` |
| `--success-subtle` | `--success-soft` |
| `--destructive` | `--danger` |
| `--destructive-subtle` | `--danger-soft` |

### `@theme inline`-blokken

PR-A legger til en `@theme inline`-blokk i `globals.css` som eksponerer tokens som Tailwind v4-utilities:

```css
@theme inline {
  --color-bg: var(--bg);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-elevated-2: var(--bg-elevated-2);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-accent-hot: var(--accent-hot);
  --color-accent-foreground: var(--accent-foreground);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-border-subtle: var(--border-subtle);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-success-hot: var(--success-hot);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --color-danger-hot: var(--danger-hot);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-warning-hot: var(--warning-hot);
}
```

Etter dette kan komponenter bruke f.eks. `bg-accent`, `text-text-secondary`, `border-border` som Tailwind-klasser i stedet for `style={{ background: 'var(--accent)' }}`.

---

## 3. `lib/tema.ts` — tynt JS-speil

`lib/tema.ts` eksporterer kun tre konstanter:

```typescript
export const MANIFEST_FARGER = {
  bakgrunn: '#0e0f13',
  tema: '#0e0f13',
};

export const EPOST_FARGER = {
  bakgrunn: '#0e0f13',
  aksent: '#e8d9b5',
  tekst: '#f5f5f7',
  tekstSekundaer: '#dadce2',
};

export const ICS_FARGE = '#e8d9b5';
```

**Konsumenter:**
- `app/manifest.ts` — `background_color` og `theme_color`
- `app/layout.tsx` — `<meta name="theme-color">` og PWA-meta
- `lib/epost.ts` — inline styles i e-postmaler (CSS-variabler er ikke tilgjengelig i e-postklienter)

**Synkroniseres manuelt** med `globals.css` — det finnes ingen build-time-kobling. Hvis aksent-fargen endres i CSS, må `lib/tema.ts` oppdateres i samme PR.

**Avatar-hue er IKKE del av tema.** `Avatar.tsx` beregner hue fra navn og er identitets-logikk, ikke tema-logikk. Det hører hjemme i komponenten.

---

## 4. Klubb-config env-overrides

Fire env-vars lar andre klubber overstyre brand-farger uten å endre `globals.css`:

| Env-var | Default (Herreklubbens verdier) | Beskrivelse |
|---|---|---|
| `NEXT_PUBLIC_KLUBB_FARGE_PRIMAER` | `#e8d9b5` | Aksent-farge (`--accent`) |
| `NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_SOFT` | `rgba(232, 217, 181, 0.16)` | Myk aksent (`--accent-soft`) |
| `NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_HOT` | `#f5e8c8` | Hover/aktiv aksent (`--accent-hot`) |
| `NEXT_PUBLIC_KLUBB_FARGE_BAKGRUNN` | `#0e0f13` | Primær bakgrunn (`--bg`) |

Disse injiseres som inline `<style>` i `<head>` i `app/layout.tsx`:

```tsx
// Overstyrer CSS-defaults fra globals.css når env er satt
const klubbFarger = [
  process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER && `--accent: ${process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER};`,
  process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_SOFT && `--accent-soft: ${process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_SOFT};`,
  process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_HOT && `--accent-hot: ${process.env.NEXT_PUBLIC_KLUBB_FARGE_PRIMAER_HOT};`,
  process.env.NEXT_PUBLIC_KLUBB_FARGE_BAKGRUNN && `--bg: ${process.env.NEXT_PUBLIC_KLUBB_FARGE_BAKGRUNN};`,
].filter(Boolean).join(' ');

// I JSX:
{klubbFarger && <style>{`:root { ${klubbFarger} }`}</style>}
```

Fordi verdiene leses ved build-time (miljø-variabler med `NEXT_PUBLIC_`-prefiks), er dette null runtime-overhead.

---

## 5. Migreringsrekkefølge — PR-kø

Hver PR er et eget GitHub-issue som kjøres gjennom agentic. Rekkefølgen er valgt slik at scaffolding lander før komponenter migreres.

### PR-A — Scaffolding

**Filer:**
- `app/globals.css` — legg til `@theme inline`-blokk, legg til nye tokens (`--accent-foreground`, `--success-hot`, `--danger-hot`, `--warning-hot`), legg til `:root[data-theme="dark"]`-speiling
- `lib/tema.ts` — opprett filen med `MANIFEST_FARGER`, `EPOST_FARGER`, `ICS_FARGE`
- `lib/klubb-config.ts` — legg til de fire `NEXT_PUBLIC_KLUBB_FARGE_*`-konstantene med Herreklubben-defaults
- `app/layout.tsx` — legg til `data-theme="dark"` på `<html>`, legg til inline-`<style>`-injeksjon for klubb-farger, erstatt hardkodede farger i manifest/meta med `MANIFEST_FARGER` fra `lib/tema.ts`

### PR-B1 — `components/ui`

Migrer alle fargereferanser i `components/ui/` fra inline hex til CSS-tokens/Tailwind-utilities.

### PR-B2 — `(app)/agenda`

Migrer fargereferanser i alle ruter og komponenter under `app/(app)/agenda/` og tilhørende arrangement-komponenter.

### PR-B3 — `(app)/chat` + samtaler + meldinger

Migrer fargereferanser i `app/(app)/chat/`, samtale- og meldingskomponenter.

### PR-B4 — `(app)/klubb`

Migrer fargereferanser i `app/(app)/klubb/` — klubbinfo, kåringer, arrangementer, arrangoransvar.

### PR-B5 — `(app)/profil` + innstillinger + album + diverse

Migrer fargereferanser i profilsider, innstillinger, album og øvrige sider under `(app)/`.

### PR-B6 — `(auth)` + opprydding av deprecated aliaser

Migrer fargereferanser i `app/(auth)/`. Fjern de bakoverkompatible aliasene (`--bg-tertiary`, `--accent-subtle`, `--success-subtle`, `--destructive`, `--destructive-subtle`) fra `globals.css` når alle konsumenter er migrert.

---

## 6. Akseptkriterier per PR-type

### PR-A

- Bygger uten feil (`npm run build`)
- Lighthouse-score uendret (sjekk Performance og Accessibility)
- Manuell visuell sjekk av agenda, chat og klubbinfo viser ingen synlig endring

### PR-Bn (B1–B6)

- Visuelt no-op verifisert lokalt mot main — se app i browser, gå gjennom berørte sider
- Ingen Playwright-baselines committes — lokal sanity-sjekk per PR, dokumentert i PR-beskrivelsen med "visuelt no-op bekreftet lokalt"
- Bygger uten feil

---

## 7. v2 — brukervalg av tema

**DB-skisse (kjøres ikke ennå — vises her som fremtidig migrasjon):**

```sql
alter table profiles
  add column tema_preferanse text not null default 'system'
  check (tema_preferanse in ('system', 'light', 'dark'));
```

**Lagringsstrategi:**
- v1/v2-overgang: `localStorage` per enhet/origin — raskt å lese, ingen nettverksrundtur, ingen DB-migrasjon
- Cross-device-sync: DB-kolonnen over — etterspørres som eget issue. Krever at layout leser preferansen server-side og sender med i HTML

**Begrensning:** localStorage er per origin og enhet — en bruker som installerer PWA-en på to enheter ser ikke valget på begge uten DB-synk.

**Pre-hydration-script** (forhindrer flash of wrong theme): legges inn i v2 når light mode aktiveres. I v1 er dette unødvendig siden dark alltid er aktivt.

**PWA-splash:** iOS splash-screen kan ikke følge `data-theme` dynamisk — den rendres av OS fra manifest og er alltid mørk. Ingen vei rundt dette uten et eget splash-bilde per tema.

---

## 8. Synk-skript og klubb-app

`lib/klubb-config.ts` er listet som **DIVERGERER** i `scripts/sync-klubb-app.mjs` — de fire nye farge-konstantene har samme Herreklubben-defaults i begge repos i dag. DIVERGERER-statusen er reservert for å tillate fremtidig override uten å trigge drift-alarm; klubb-app arver Herreklubbens fargeopplevelse til andre vennegjenger setter egne env-vars i Vercel.

`app/globals.css` forblir **MÅ MATCHE** (byte-identisk mellom herreklubben og klubb-app). Brand-farger lever som CSS-variabler som overstyres via env-injeksjon — ingen SKRUB_MAP-hex-mapping er nødvendig. Denne arkitekturen er bevisst: CSS-fil er identisk, identitet injiseres ved deploy.

---

## 9. Risikoer og åpne spørsmål for v2

| Tema | Status | Kommentar |
|---|---|---|
| Cross-device-synk av temavalg | Uavklart | localStorage er per enhet. DB-kolonne legges til ved etterspørsel. |
| PWA-splash følger ikke `data-theme` | Kjent begrensning | iOS genererer splash fra manifest — alltid mørk uansett brukervalg. |
| Pre-hydration-script | Utsatt til v2 | Trengs ikke i v1 (dark er alltid aktivt). Legges til når light mode aktiveres. |
| `lib/tema.ts`-synk med CSS | Manuell prosess | Ingen build-time-kobling. Endrer man aksent-farge, må begge oppdateres. |

---

## 10. Relatert

- **Issue #323** — manifest-drift-bug: `background_color` og `theme_color` i `app/manifest.ts` er hardkodet til foreldet hex og skal hente fra `lib/tema.ts`. Behandles i eget løp, ikke del av PR-A.
