-- Trim leading/trailing whitespace fra profiles.navn og .visningsnavn.
-- Idempotent: WHERE-klausul gjør re-kjøring til no-op.
-- CHECK-constraint hindrer at problemet siver inn igjen — kombinert med
-- trim i lib/actions/profil.ts gir det rene data både ved kilden og som
-- siste-line forsvar.

update profiles set navn = btrim(navn) where navn <> btrim(navn);
update profiles set visningsnavn = btrim(visningsnavn) where visningsnavn <> btrim(visningsnavn);

alter table profiles
  add constraint profiles_navn_trimmet check (navn = btrim(navn));
alter table profiles
  add constraint profiles_visningsnavn_trimmet check (visningsnavn = btrim(visningsnavn));
