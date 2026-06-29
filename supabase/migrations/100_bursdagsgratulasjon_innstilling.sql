-- Varsel-innstilling for automatisk bursdagsgratulasjon i klubb-chat.
-- Default aktiv = false slik at funksjonaliteten aktiveres bevisst av admin,
-- ikke overraskende skrus på ved migrasjon. ON CONFLICT (noekkel) bruker
-- varsel_innstillinger-tabellens eksisterende UNIQUE-constraint på noekkel
-- (definert i migrasjon 007). Raden allerede i DB? Ingen endring.

insert into varsel_innstillinger (noekkel, aktiv, beskrivelse)
values ('bursdagsgratulasjon', false, 'Automatisk bursdagsgratulasjon i klubb-chat')
on conflict (noekkel) do nothing;
