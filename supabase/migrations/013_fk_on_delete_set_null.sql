-- Gjør FK-kolonner nullable med on delete set null
-- slik at profiler kan slettes uten å miste historikk

-- arrangementer.opprettet_av
alter table arrangementer drop constraint if exists arrangementer_opprettet_av_fkey;
alter table arrangementer alter column opprettet_av drop not null;
alter table arrangementer add constraint arrangementer_opprettet_av_fkey
  foreign key (opprettet_av) references profiles(id) on delete set null;

-- kaaringer.opprettet_av
alter table kaaringer drop constraint if exists kaaringer_opprettet_av_fkey;
alter table kaaringer alter column opprettet_av drop not null;
alter table kaaringer add constraint kaaringer_opprettet_av_fkey
  foreign key (opprettet_av) references profiles(id) on delete set null;

-- vedtekter_versjoner.endret_av
alter table vedtekter_versjoner drop constraint if exists vedtekter_versjoner_endret_av_fkey;
alter table vedtekter_versjoner alter column endret_av drop not null;
alter table vedtekter_versjoner add constraint vedtekter_versjoner_endret_av_fkey
  foreign key (endret_av) references profiles(id) on delete set null;

-- kaaringer_nominasjoner.profil_id (allerede nullable)
alter table kaaringer_nominasjoner drop constraint if exists kaaringer_nominasjoner_profil_id_fkey;
alter table kaaringer_nominasjoner add constraint kaaringer_nominasjoner_profil_id_fkey
  foreign key (profil_id) references profiles(id) on delete set null;
