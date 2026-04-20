-- Ny tittel-flagg «generalsekretær». Bæreren beholder rolle='admin' (full
-- RLS-tilgang) men markeres med egen flagg slik at UI kan vise spesiell
-- tittel og glød på profilbildet. André Heede settes automatisk.

alter table profiles
  add column if not exists generalsekretaer boolean not null default false;

update profiles
  set rolle = 'admin', generalsekretaer = true
  where navn ilike '%heede%';
