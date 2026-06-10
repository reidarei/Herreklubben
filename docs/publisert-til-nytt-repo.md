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
- `supabase/migrations/` — alle SQL-migrasjoner
- `__tests__/` — enhets-tester
- `e2e/` — Playwright-tester

### Konfig og infra
- `package.json`, `package-lock.json`
- `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `postcss.config.mjs`, `eslint.config.mjs`
- `vitest.config.ts`, `playwright.config.ts`
- `.env.example`
- `.gitignore`, `.gitattributes`
- `.github/workflows/paaminne.yml`

### Design (deler av)
- `Design/` — mapper og filer **unntatt** `Design/skjermbilder/` (se nedenfor)

### Public-assets
- `public/` — alle filer (ikoner, bakgrunn, sw.js)

---

## Kopieres IKKE

### Git-historikk
Nytt repo starter rent uten historikk. Historikken i det private repoet kan inneholde midlertidige debug-commits med sensitiv info, og ekte profilbilder/skjermbilder sjekket inn som binærfiler.

### Design/skjermbilder/
Skjermbildemappen inneholder bilder tatt av appen i produksjon med ekte medlemsnavn og ansikter. Anonymiserte versjoner skal lages separat og legges inn etter publisering.

### .claude/
Lokal Claude Code-konfimasjon, minnefiler og feedback-notater. Inneholder prosjektintern kontekst som ikke er relevant for eksterne og potensielt interne referanser som ikke bør publiseres.

### scripts/ — AUDIT PÅKREVD
**Hvert script i `scripts/`-mappen må auditeres individuelt** før det eventuelt kopieres:

- Engangsimport-scripts (`fb-*`, `import-*.mjs`, `import-messenger-klubbchat.mjs`) er kjørt én gang og er ikke relevante for en ny instans. De inneholder logikk tett koblet til Facebook-dataeksport-formatet og data-filpaths som er spesifikke for det opprinnelige oppsettet.
- Noen scripts i denne mappen har tidligere hatt klartekst database-passord eller klartekst Supabase service-role-nøkler i kommentarer eller hardkodet. En historikk-sjekk viste at disse er fjernet fra nåværende versjon, men scripts i seg selv har ikke verdi for en ny instans.
- **Scripts som er relevante for en ny instans** og kan kopieres etter review: `init-admin.mjs`, `sjekk-miljo.mjs`, `stamp-versjon.mjs`.
- `r2-browser.mjs` og `foreslaa-messenger-mapping.mjs` er nyttige verktøy — vurder individuelt.

### scripts/data/
Datafiler fra Facebook-import (JSON-eksporter, bildemapping). Inneholder historiske personopplysninger.

### fb-arrangementer.json, fb-import.sql m.fl.
Alle filer i `scripts/` med `fb-`-prefiks og tilhørende SQL-dumps er persondata-spesifikk for den opprinnelige instansen.

---

## Filer som lages i fase 6

Disse eksisterer ikke ennå og opprettes i det nye repoet:

- `LICENSE` — MIT med Reidars navn og 2025-startår
- `SECURITY.md` — ansvarlig avsløring, kontaktadresse, scope
- `CLAUDE.md` (sanitert versjon) — uten prosjektintern kontekst (se nedenfor)

---

## CLAUDE.md-sanitering

Nåværende `CLAUDE.md` inneholder:

- Referanser til det private repo-URLen og Supabase-prosjekt-IDen i kommando-eksempler — byttes til plassholdere.
- Sparekonto-referansen i «Prosjekt»-avsnittet er intern og kuttes.
- Ellers er CLAUDE.md verdifull for eksterne som vil bruke AI-assistert utvikling — behold policies, arkitektur-oversikt og konvensjoner.

---

## Sjekkliste før fase 6

- [ ] Grep-sjekk for ekte navn (se navneliste i CLAUDE.md-policies)
- [ ] Grep-sjekk for hardkodede e-postadresser
- [ ] Grep-sjekk for `mortensrudherreklubb.no` — disse skal være via `lib/klubb-config.ts` eller `lib/config.ts`, ikke hardkodet
- [ ] Bekreft at `Design/skjermbilder/` IKKE er med
- [ ] Bekreft at `.claude/` IKKE er med
- [ ] Bekreft at scripts-audit er gjort
- [ ] LICENSE opprettet
- [ ] SECURITY.md opprettet
- [ ] README-en peker til `<ditt-repo-url>` og ikke til privat repo
