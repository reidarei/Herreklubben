-- Flagg for klubb_chat-meldinger importert fra Facebook/Messenger-historikk.
-- Brukes til å skille importerte historiske meldinger fra ekte meldinger i appen
-- (UI-en kan vise dem litt annerledes — f.eks. med en "fra Messenger"-merkelapp).
--
-- Speiler 062 for arrangementer-tabellen — samme idempotens-strategi for re-import.
--
-- kilde_ekstern_id har format `messenger:{timestamp_ms}:{idx}` og brukes for
-- idempotent re-import: unik-indeksen sørger for at samme melding ikke kan
-- importeres to ganger selv om import-skriptet kjøres på nytt.
alter table klubb_chat
  add column if not exists fra_facebook boolean not null default false;

alter table klubb_chat
  add column if not exists kilde_ekstern_id text;

-- Unik-indeks for idempotent re-import (kun for rader som faktisk har en ekstern id)
create unique index if not exists klubb_chat_kilde_ekstern_id_unique
  on klubb_chat(kilde_ekstern_id)
  where kilde_ekstern_id is not null;

-- Indeks for å filtrere/skjule FB-historikk i lister effektivt
create index if not exists klubb_chat_fra_facebook_idx
  on klubb_chat(fra_facebook)
  where fra_facebook = true;
