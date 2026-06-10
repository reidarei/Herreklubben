'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureAdmin, ensureInnlogget } from '@/lib/auth'
import { naa } from '@/lib/dato'
import { normaliserTelefon } from '@/lib/telefon'

// Resultattyper for GS-actions — strukturert retur i stedet for throw,
// slik at klienten kan vise reaktiv confirm ved race-tilstand (23505).
export type SettGeneralsekretaerResultat =
  | { ok: true; forrigeProfilId: string | null; forrigeNavn: string | null }
  | { ok: false; kode: 'generalsekretaer_finnes'; innehaver: { id: string; navn: string } }
  | { ok: false; kode: 'feil'; melding: string }

export type FjernGeneralsekretaerResultat =
  | { ok: true; forrigeProfilId: string | null }
  | { ok: false; kode: 'feil'; melding: string }

export async function oppdaterEgenProfil(data: { navn: string; visningsnavn: string; telefon: string; fodselsdato?: string; bilde_url?: string | null }) {
  const { supabase, user } = await ensureInnlogget()

  const navn = data.navn.trim()
  if (!navn) throw new Error('Navn kan ikke være tomt')
  const visningsnavn = (data.visningsnavn?.trim() || navn)

  const oppdatering: Record<string, unknown> = {
    navn,
    visningsnavn,
    telefon: normaliserTelefon(data.telefon),
    fodselsdato: data.fodselsdato || null,
    oppdatert: naa(),
  }
  if (data.bilde_url !== undefined) oppdatering.bilde_url = data.bilde_url

  const { error } = await supabase
    .from('profiles')
    .update(oppdatering)
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/profil')
  revalidatePath('/klubbinfo/medlemmer')
}

export async function oppdaterMedlemAdmin(id: string, data: { navn: string; visningsnavn: string; telefon: string; rolle: string; aktiv: boolean; fodselsdato?: string }) {
  const { supabase } = await ensureAdmin()

  const navn = data.navn.trim()
  if (!navn) throw new Error('Navn kan ikke være tomt')
  const visningsnavn = (data.visningsnavn?.trim() || navn)

  // Allowlist på rolle: generalsekretær settes KUN via settGeneralsekretaer()
  // (RPC, atomisk). Hvis noen sender 'generalsekretaer' hit er det enten en
  // bug eller et forsøk på å omgå RPC-ens atomic demotér+promotér — begge deler
  // skal stoppes tidlig. Se migrasjon 094 for rationale.
  if (data.rolle !== 'medlem' && data.rolle !== 'admin') {
    // Spesialtilfelle: hvis personen i DB allerede ER generalsekretær og innsendt
    // rolle er noe annet enn 'medlem'/'admin', er det UI-en som sender feil verdi.
    // Vi kaster heller enn å stille demotere — demotering skal skje via
    // fjernGeneralsekretaer() i handleLagre-rekkefølgen i RedigerMedlemSkjema.
    throw new Error('Ugyldig rolle. Generalsekretær settes og fjernes via egen flyt.')
  }

  // Hvis personen i DB er generalsekretær og innsendt rolle er 'admin' eller
  // 'medlem', skal IKKE denne actionen demotere — det håndteres av
  // fjernGeneralsekretaer() som kalles FØR denne actionen i handleLagre.
  // Vi henter aktuell rolle fra DB og bevarer 'generalsekretaer' hvis den
  // innsendte rollen prøver å overskrive den uten at fjern-actionen er kalt.
  // I praksis vil RedigerMedlemSkjema alltid kalle fjern-actionen først, så
  // dette er en defensiv sjekk mot direktebruk av actionen.
  const { data: gjeldende } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', id)
    .single()

  // Velg endelig rolle: hvis personen er GS og vi ikke fikk 'generalsekretaer'
  // som innsendt rolle → bruk gjeldende (ingen endring). Klienten har allerede
  // kalt fjernGeneralsekretaer() for å demotere hvis det var ønsket.
  const endeligRolle = gjeldende?.rolle === 'generalsekretaer'
    ? gjeldende.rolle  // bevarer GS-rollen; fjern-actionen demoterte om nødvendig
    : data.rolle

  const { error } = await supabase
    .from('profiles')
    .update({ navn, visningsnavn, telefon: normaliserTelefon(data.telefon), fodselsdato: data.fodselsdato || null, rolle: endeligRolle, aktiv: data.aktiv, oppdatert: naa() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/klubbinfo/medlemmer')
  revalidatePath(`/klubbinfo/medlemmer/${id}`)
}

// Setter en profilens rolle til 'generalsekretaer' via RPC (atomisk demotér+promotér).
// Returnerer strukturert resultat i stedet for å kaste, slik at klienten kan
// reagere på race-tilstand (23505 = unique violation) med reaktiv confirm.
export async function settGeneralsekretaer(nyProfilId: string): Promise<SettGeneralsekretaerResultat> {
  const { supabase } = await ensureAdmin()

  const { data, error } = await supabase
    .rpc('sett_generalsekretaer', { ny_profil: nyProfilId })

  if (error) {
    // 23505 = unique_violation: partial index profiles_unik_generalsekretaer
    // blokkerte INSERT/UPDATE fordi en annen GS ble satt i mellomtiden.
    if (error.code === '23505') {
      // Slå opp sittende GS for å vise reaktiv confirm i klienten
      const { data: gs } = await supabase
        .from('profiles')
        .select('id, navn')
        .eq('rolle', 'generalsekretaer')
        .maybeSingle()
      if (gs) {
        return { ok: false, kode: 'generalsekretaer_finnes', innehaver: { id: gs.id, navn: gs.navn } }
      }
    }
    return { ok: false, kode: 'feil', melding: error.message }
  }

  const rad = data?.[0]
  revalidatePath('/klubbinfo/medlemmer')
  revalidatePath(`/klubbinfo/medlemmer/${nyProfilId}`)
  if (rad?.forrige_profil) revalidatePath(`/klubbinfo/medlemmer/${rad.forrige_profil}`)

  return { ok: true, forrigeProfilId: rad?.forrige_profil ?? null, forrigeNavn: rad?.forrige_navn ?? null }
}

// Fjerner generalsekretær-tittelen fra sittende GS (demoterer til 'admin').
// Null GS er en gyldig tilstand — f.eks. i overgangsperiode.
export async function fjernGeneralsekretaer(): Promise<FjernGeneralsekretaerResultat> {
  const { supabase } = await ensureAdmin()

  const { data, error } = await supabase
    .rpc('fjern_generalsekretaer')

  if (error) {
    return { ok: false, kode: 'feil', melding: error.message }
  }

  const rad = data?.[0]
  revalidatePath('/klubbinfo/medlemmer')
  if (rad?.forrige_profil) revalidatePath(`/klubbinfo/medlemmer/${rad.forrige_profil}`)

  return { ok: true, forrigeProfilId: rad?.forrige_profil ?? null }
}

export async function slettMedlem(id: string) {
  const { user } = await ensureAdmin()
  if (id === user.id) throw new Error('Kan ikke slette seg selv')

  const admin = createAdminClient()

  // Slett avhengige rader før auth-bruker slettes
  await admin.from('paameldinger').delete().eq('profil_id', id)
  await admin.from('push_subscriptions').delete().eq('profil_id', id)
  await admin.from('arrangoransvar').update({ ansvarlig_id: null }).eq('ansvarlig_id', id)

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw new Error(error.message)

  revalidatePath('/klubbinfo/medlemmer')
  redirect('/klubbinfo/medlemmer')
}
