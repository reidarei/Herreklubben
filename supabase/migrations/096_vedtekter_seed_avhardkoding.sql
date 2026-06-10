-- Fixup: fjern klubbnavnet fra vedtekter-seedens default-tekst.
--
-- Bakgrunn: migrasjon 005 sådde tre innholdssider med teksten
--   '# Vedtekter for Mortensrud Herreklubb\n\n_Ingen vedtekter lagt inn ennå._'
-- Dette hardkoder klubbnavnet i innholdet, noe vi ønsker å unngå.
-- Ny default-tekst er generisk og passer ethvert oppsett.
--
-- Vi aldri redigerer 005 — migrasjonshistorikk er append-only. Dette er en
-- idempotent fixup som kun treffer den opprinnelige seed-teksten; redigert
-- innhold (der noen faktisk har lagt inn vedtekter) røres ikke.
--
-- Bruker E''-syntaks for newlines slik at \n tolkes som linjeskift av Postgres.

update public.vedtekter
   set innhold = E'# Vedtekter\n\n_Ingen vedtekter lagt inn ennå._'
 where slug = 'vedtekter'
   and innhold like '# Vedtekter for Mortensrud Herreklubb%';
