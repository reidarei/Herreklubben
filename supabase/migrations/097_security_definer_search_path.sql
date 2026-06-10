-- Sikkerhetsfiks: lås search_path på er_admin() og handle_ny_bruker().
--
-- SECURITY DEFINER-funksjoner uten eksplisitt search_path er sårbare for
-- search_path-hijacking via pg_temp: en angriper kan plassere egne objekter
-- (tabeller, funksjoner) i et schema som dukker opp foran 'public' i søkestien,
-- og dermed omgå logikken inni funksjonen.
--
-- Mønsteret er det samme som ble brukt i mig. 091 (get_statistikk) og
-- mig. 094 (sett_generalsekretaer, fjern_generalsekretaer).
-- Tracker: issue #301.
--
-- VIKTIG: ingen semantiske endringer — kun search_path = public tillegget.

-- 1) er_admin() — opprinnelig fra mig. 041, sist sett uten search_path
create or replace function er_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select rolle in ('admin', 'generalsekretaer') from profiles where id = auth.uid()
$$;

-- 2) handle_ny_bruker() — opprinnelig fra mig. 001, sist redigert i mig. 071 (btrim-forsvar mot whitespace i e-post)
create or replace function handle_ny_bruker()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, epost, navn, visningsnavn)
  values (
    new.id,
    new.email,
    btrim(split_part(new.email, '@', 1)),
    btrim(split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
