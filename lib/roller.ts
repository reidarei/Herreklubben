// Sentral rolle- og rettighetsmatrise. Alle andre steder i koden skal gå
// gjennom hjelperne her — aldri sammenligne `rolle === 'admin'` direkte.
//
// Modellen:
//   - Tre roller: medlem, admin, generalsekretaer
//   - Alle har medlem-rettigheter (lese klubben, melde seg på, poste i chat)
//   - Admin og generalsekretær har i tillegg admin-rettigheter (opprette
//     medlem, redigere alle arrangementer, styre kåringer, osv.)
//   - Hver rolle kan ha ekstra særegenskaper (tittel, glød, varsel-policy)
//
// DB speiler dette: `er_admin()`-funksjonen returnerer true for både admin
// og generalsekretær, slik at RLS oppfører seg likt. Se migrasjon 041.

export type Rolle = 'medlem' | 'admin' | 'generalsekretaer'

export type Rettigheter = {
  /** Tittel som vises i UI (bokmål, kan ha æøå) */
  tittel: string
  /** Har admin-rettigheter (CRUD på tvers av brukere + klubbinfo) */
  kanAdministrere: boolean
  /** Mottar push/epost når nye innspill/issues kommer inn */
  faarIssueVarsler: boolean
  /** Spesiell gul glød rundt profilbildet */
  harGulGloed: boolean
}

export const ROLLER: Record<Rolle, Rettigheter> = {
  medlem: {
    tittel: 'Medlem',
    kanAdministrere: false,
    faarIssueVarsler: false,
    harGulGloed: false,
  },
  admin: {
    tittel: 'Admin',
    kanAdministrere: true,
    faarIssueVarsler: true,
    harGulGloed: false,
  },
  generalsekretaer: {
    tittel: 'Generalsekretær',
    kanAdministrere: true,
    faarIssueVarsler: false,
    harGulGloed: true,
  },
}

// Normaliserer en rolle-streng (fra DB eller ukjent kilde) til en av de
// gyldige rollene, med fallback til 'medlem'.
function normaliser(rolle: string | null | undefined): Rolle {
  if (rolle === 'admin' || rolle === 'generalsekretaer' || rolle === 'medlem') return rolle
  return 'medlem'
}

export function rettigheterFor(rolle: string | null | undefined): Rettigheter {
  return ROLLER[normaliser(rolle)]
}

// Konvenienshjelpere — bruk disse i koden framfor å inspisere rolle-strengen.
export const kanAdministrere = (rolle: string | null | undefined): boolean =>
  rettigheterFor(rolle).kanAdministrere

export const harGulGloed = (rolle: string | null | undefined): boolean =>
  rettigheterFor(rolle).harGulGloed

export const faarIssueVarsler = (rolle: string | null | undefined): boolean =>
  rettigheterFor(rolle).faarIssueVarsler

export const tittelFor = (rolle: string | null | undefined): string =>
  rettigheterFor(rolle).tittel

// Returnerer alle roller hvor en gitt rettighet er sann. Gjør det mulig for
// kallestedene å spørre matrisen direkte i stedet for å hardkode lister av
// rolle-strenger som må vedlikeholdes manuelt (f.eks. i DB-filtre).
export function rollerMed(rettighet: keyof Rettigheter): Rolle[] {
  return (Object.keys(ROLLER) as Rolle[]).filter(r => Boolean(ROLLER[r][rettighet]))
}

// Roller som kan velges fra admin-UI (rediger medlem). Generalsekretær
// utelates bevisst fordi den settes manuelt via SQL, ikke via skjema.
export const VALGBARE_ROLLER: Rolle[] = ['medlem', 'admin']
