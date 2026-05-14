-- FB-bilde-import — generert av scripts/fb-bilder-generer-sql.mjs
-- Forutsetter:
--   1. Migrasjon 081_meldinger_fra_facebook.sql er kjørt
--   2. Bildene er lastet opp til R2 under "meldinger/"
--
-- Idempotent: bruker kilde_ekstern_id med ON CONFLICT DO NOTHING

begin;

-- screenshot 1: Michael Johansen, 31. mai 2022 (1 bilde, 2 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '82093eaa-0a43-4191-b483-669569745b33',
    'Jon Erik Dahl og jeg skal på Rammstein konserten på Bjerke den 24.7 så om det er noen av dere andre som ikke har billetter men har veldig lyst så kan kanskje lillebroren til Reidar Haavik hjelpe til 🍺 da får dere med dere konserten og kan servere øl til Jon Erik og meg . Vinn vinn 🙂',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/513936824_10171634064405317_8149852453545435986_n.jpg',
    '2022-05-31T12:34:56+01:00',
    '2022-05-31T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss1'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss1' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss1'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'Abelist jobbannonse ass', '2022-05-31T12:34:56+01:00', true, 'facebook:bilde:ss1:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss1'), '4accc876-7906-4a48-b73c-a88d0f6d114b', '200per time.. kan fort dra inn tusen spenn da... 💼', '2022-05-31T12:34:56+01:00', true, 'facebook:bilde:ss1:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 2: Jon Erik Dahl, 2. april 2016 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/470583759_10170510363820626_6868328802286053130_n.jpg',
    '2016-04-02T12:34:56+01:00',
    '2016-04-02T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss2'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss2' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss2'), '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6', 'syntes vi trengte et gruppe bilde 😜', '2016-04-02T12:34:56+01:00', true, 'facebook:bilde:ss2:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 3: André Heede, 29. juni 2021 (1 bilde, 8 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'f3d71e5a-367a-461e-ba13-a6c4de144e32',
    'Da ble kåken solgt',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/207616084_10165715082540226_1267054822432793292_n.jpg',
    '2021-06-29T12:34:56+01:00',
    '2021-06-29T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss3'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), '4accc876-7906-4a48-b73c-a88d0f6d114b', 'Konge! Grattis', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), '76801c77-b2db-41cd-ba30-6f55d10729ba', 'Grattis 🥂🍾', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'Ble 360" over takst. Greit det i dagens marked', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), 'b2398344-4259-460c-a1b0-53d8a44643b3', 'Gratulerer', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c3')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'Godt over takst da ell?', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c4')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'Herlich! Gratulerer:)', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c5')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'Jepp😊 satte rekord på Brattlikollen så da er man happy', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c6')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss3'), '8bf2a096-1807-417f-8fe0-c33ec99d7178', 'Gratulerer! Fornøyd ?', '2021-06-29T12:34:56+01:00', true, 'facebook:bilde:ss3:c7')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 4: Michael Johansen, 11. februar 2020 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '82093eaa-0a43-4191-b483-669569745b33',
    'Hva skjer a Reidar Haavik?',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472995892_10170480587275317_8169909547483092892_n.jpg',
    '2020-02-11T12:34:56+01:00',
    '2020-02-11T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss4'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss4' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss4'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'Og stikker av med penga!', '2020-02-11T12:34:56+01:00', true, 'facebook:bilde:ss4:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 5: Kenneth Lunde, 21. desember 2019 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'God jul ʼa boys',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472833938_10170714749640096_7825765805359401361_n.jpg',
    '2019-12-21T12:34:56+01:00',
    '2019-12-21T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss5'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss5' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss5'), '4409273c-47f3-49e9-89be-9a7018ebac5c', 'God jul 😂🤤❤️', '2019-12-21T12:34:56+01:00', true, 'facebook:bilde:ss5:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 6: Jon Erik Dahl, 22. oktober 2019 (1 bilde, 2 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    'Når ble det greit med reklame for Adolf Hitler bilder på facebook',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/75392732_10162535023635626_4447293589667446784_n.jpg',
    '2019-10-22T12:34:56+01:00',
    '2019-10-22T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss6'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss6' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss6'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'Greit for meg', '2019-10-22T12:34:56+01:00', true, 'facebook:bilde:ss6:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss6'), '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6', 'Morsomme var, at reklamen kom etter en kveld, hvor jeg dyp dykket inn i en del norske nettsider på ytre høyre siden av politikken', '2019-10-22T12:34:56+01:00', true, 'facebook:bilde:ss6:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 7: Øyvind Verket, 25. august 2018 (1 bilde, 3 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4accc876-7906-4a48-b73c-a88d0f6d114b',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/40133598_10160786366215113_239708481341358080_n.jpg',
    '2018-08-25T12:34:56+01:00',
    '2018-08-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss7'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss7' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss7'), '8bf2a096-1807-417f-8fe0-c33ec99d7178', 'For å klare å se dette så må du leite etter pikk, Øyvind Verket du leiter etter pikk! Hehe 😂', '2018-08-25T12:34:56+01:00', true, 'facebook:bilde:ss7:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss7'), 'b2398344-4259-460c-a1b0-53d8a44643b3', '[bildevedlegg fra Facebook]', '2018-08-25T12:34:56+01:00', true, 'facebook:bilde:ss7:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss7'), '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6', 'Benco har en katolsk prest på badet', '2018-08-25T12:34:56+01:00', true, 'facebook:bilde:ss7:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 8: Jon Erik Dahl, 15. mai 2018 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472170357_10170738984755626_2351219374440861825_n.jpg',
    '2018-05-15T12:34:56+01:00',
    '2018-05-15T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss8'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss8' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 9: Øyvind Rekve, 12. april 2018 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '76801c77-b2db-41cd-ba30-6f55d10729ba',
    'Dette er i kveld... too be young again 🤘',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/469614292_10169801486285696_1735001105317423278_n.jpg',
    '2018-04-12T12:34:56+01:00',
    '2018-04-12T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss9'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss9' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 10: Espen Sørum Hagen, 9. desember 2017 (3 bilder, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4409273c-47f3-49e9-89be-9a7018ebac5c',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468841672_10170003415665464_4444310879893950981_n.jpg',
    '2017-12-09T12:34:56+01:00',
    '2017-12-09T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss10'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss10' and not exists (select 1 from melding_insert)
)
insert into melding_bilder (melding_id, bilde_url, rekkefoelge, opprettet) values
  ((select id from melding_id_cte), 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472027737_10170527134715464_7921074026912311111_n.jpg', 1, '2017-12-09T12:34:56+01:00'),
  ((select id from melding_id_cte), 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468741380_10170003415625464_4945086347616410337_n.jpg', 2, '2017-12-09T12:34:56+01:00');

-- screenshot 11: Øyvind Verket, 10. november 2017 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4accc876-7906-4a48-b73c-a88d0f6d114b',
    'Mener at voldtekt ikke er ekte, med mindre man kan bevise at kvinnen ikke mot-jokker.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468665243_10169825823750113_5067670262409442372_n.jpg',
    '2017-11-10T12:34:56+01:00',
    '2017-11-10T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss11'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss11' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 12: Reidar Haavik, 10. november 2017 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'ad597350-53e3-47aa-95a5-d207f383ef39',
    'Vedder pungen sin mot Verkern, ca 10kr mener han.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468964054_10169845255245370_1708449074339552897_n.jpg',
    '2017-11-10T12:34:56+01:00',
    '2017-11-10T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss12'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss12' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 14: Reidar Haavik, 10. november 2017 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'ad597350-53e3-47aa-95a5-d207f383ef39',
    'Vedder en pils på at elbiler om tre år ikke lenger har særbehandling i Oslos bomringer',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468963745_10169845254575370_6869727369567777523_n.jpg',
    '2017-11-10T12:34:56+01:00',
    '2017-11-10T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss14'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss14' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 15: Espen Waldem, 24. juni 2017 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468526434_10161817010036368_8282172887727775070_n.jpg',
    '2017-06-24T12:34:56+01:00',
    '2017-06-24T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss15'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss15' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 16: Espen Waldem, 24. juni 2017 (3 bilder, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468568689_10161817008696368_8839644318772214941_n.jpg',
    '2017-06-24T12:34:56+01:00',
    '2017-06-24T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss16'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss16' and not exists (select 1 from melding_insert)
)
insert into melding_bilder (melding_id, bilde_url, rekkefoelge, opprettet) values
  ((select id from melding_id_cte), 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468496612_10161817008691368_2383094503811365159_n.jpg', 1, '2017-06-24T12:34:56+01:00'),
  ((select id from melding_id_cte), 'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468459837_10161817008656368_7271076194809599240_n.jpg', 2, '2017-06-24T12:34:56+01:00');

-- screenshot 17: Øyvind Rekve, 28. mars 2017 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '76801c77-b2db-41cd-ba30-6f55d10729ba',
    'Neste år for Herreklubben?',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/473019028_10170293689990696_8627677788363977487_n.jpg',
    '2017-03-28T12:34:56+01:00',
    '2017-03-28T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss17'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss17' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss17'), '76801c77-b2db-41cd-ba30-6f55d10729ba', 'Ingen som er hypp?', '2017-03-28T12:34:56+01:00', true, 'facebook:bilde:ss17:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 18: Øyvind Rekve, 20. februar 2017 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '76801c77-b2db-41cd-ba30-6f55d10729ba',
    'Dette bildet gjør meg glad 😘',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/470207513_10169851916900696_3070902161453074898_n.jpg',
    '2017-02-20T12:34:56+01:00',
    '2017-02-20T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss18'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss18' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 19: Jon Erik Dahl, 9. februar 2017 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472327830_10170716182060626_7975648651640544702_n.jpg',
    '2017-02-09T12:34:56+01:00',
    '2017-02-09T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss19'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss19' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 20: Øyvind Rekve, 7. februar 2017 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '76801c77-b2db-41cd-ba30-6f55d10729ba',
    'Dukka opp på fjesboka i dag... Vi ser helt like ut jo...',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472848654_10170272300575696_8956102802779641044_n.jpg',
    '2017-02-07T12:34:56+01:00',
    '2017-02-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss20'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss20' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss20'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', '😂', '2017-02-07T12:34:56+01:00', true, 'facebook:bilde:ss20:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 21: André Heede, 30. september 2016 (1 bilde, 2 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'f3d71e5a-367a-461e-ba13-a6c4de144e32',
    'Guten morgen🍻 Svogerns favoritt til frokost',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468399174_10170275252275226_7190338394014570128_n.jpg',
    '2016-09-30T12:34:56+01:00',
    '2016-09-30T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss21'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss21' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss21'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'Har det på video. Blir spilt av på storskjermen på Armbrustschützenzelt', '2016-09-30T12:34:56+01:00', true, 'facebook:bilde:ss21:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss21'), '82093eaa-0a43-4191-b483-669569745b33', 'hvor er gæg beviset André Heede?', '2016-09-30T12:34:56+01:00', true, 'facebook:bilde:ss21:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 22: André Heede, 29. september 2016 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'f3d71e5a-367a-461e-ba13-a6c4de144e32',
    'Skål a gutta',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468284967_10170274620315226_7717431427819465511_n.jpg',
    '2016-09-29T12:34:56+01:00',
    '2016-09-29T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss22'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss22' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 23: André Heede, 29. september 2016 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'f3d71e5a-367a-461e-ba13-a6c4de144e32',
    'Nachspielteltet lever ennå',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468205228_10170274616800226_5387154595722121418_n.jpg',
    '2016-09-29T12:34:56+01:00',
    '2016-09-29T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss23'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss23' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 24: Jon Erik Dahl, 24. september 2016 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    'Labert oppmøte',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468546912_10170023961465626_1974895974601579098_n.jpg',
    '2016-09-24T12:34:56+01:00',
    '2016-09-24T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss24'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss24' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 25: Jon Erik Dahl, 21. juli 2016 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468042786_10169904888265626_7424129223818364482_n.jpg',
    '2016-07-21T12:34:56+01:00',
    '2016-07-21T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss25'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss25' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 26: Jon Erik Dahl, 7. mars 2016 (1 bilde, 3 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/473657432_10170911564250626_3357151237299040991_n.jpg',
    '2016-03-07T12:34:56+01:00',
    '2016-03-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss26'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss26' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss26'), '76801c77-b2db-41cd-ba30-6f55d10729ba', 'Utafor Jon', '2016-03-07T12:34:56+01:00', true, 'facebook:bilde:ss26:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss26'), '6673601b-c7f4-4c09-929a-3dfaa4d6fdc6', 'Utafor humor er også humor 😜', '2016-03-07T12:34:56+01:00', true, 'facebook:bilde:ss26:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss26'), '82093eaa-0a43-4191-b483-669569745b33', 'Har dette skjedd deg Jon Erik Dahl ? i så fall syntes jeg dette er moro 😀 og at du har litt nasty tendenser.', '2016-03-07T12:34:56+01:00', true, 'facebook:bilde:ss26:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 27: Reidar Haavik, 14. mars 2015 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'ad597350-53e3-47aa-95a5-d207f383ef39',
    'Vi er samme sted som i fjor!',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468597536_10169840290925370_5685652838756870002_n.jpg',
    '2015-03-14T12:34:56+01:00',
    '2015-03-14T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss27'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss27' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 28: Michael Johansen, 28. mai 2014 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '82093eaa-0a43-4191-b483-669569745b33',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472989729_10170549701280317_1398779810565515323_n.jpg',
    '2014-05-28T12:34:56+01:00',
    '2014-05-28T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss28'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss28' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 29: Klas Kristoffer Liland, 4. april 2014 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4093f488-8c3c-4daf-a743-c087c74adc6d',
    'God helg !',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/470204415_10170130107390297_9200493019667618799_n.jpg',
    '2014-04-04T12:34:56+01:00',
    '2014-04-04T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss29'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss29' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 30: Klas Kristoffer Liland, 10. mars 2014 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4093f488-8c3c-4daf-a743-c087c74adc6d',
    'Lunch Reka',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/470214464_10170106745765297_6900551415671284136_n.jpg',
    '2014-03-10T12:34:56+01:00',
    '2014-03-10T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss30'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss30' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 31: Michael Johansen, 21. februar 2014 (1 bilde, 2 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '82093eaa-0a43-4191-b483-669569745b33',
    'Får satse på at du får i deg litt av denne Kristoffer Benco Arntzen, så du orker å være med 8 Mars da 🙂',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472744758_10170498287515317_7373605628117300606_n.jpg',
    '2014-02-21T12:34:56+01:00',
    '2014-02-21T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss31'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss31' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss31'), '8bf2a096-1807-417f-8fe0-c33ec99d7178', 'Hehe, den må jeg prøve!', '2014-02-21T12:34:56+01:00', true, 'facebook:bilde:ss31:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss31'), '76801c77-b2db-41cd-ba30-6f55d10729ba', 'Hehe dauer', '2014-02-21T12:34:56+01:00', true, 'facebook:bilde:ss31:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 32: Klas Kristoffer Liland, 21. februar 2014 (1 bilde, 3 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4093f488-8c3c-4daf-a743-c087c74adc6d',
    'Spiller du fotball MJ ?',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/473165819_10170504444200297_2545909050171481490_n.jpg',
    '2014-02-21T12:34:56+01:00',
    '2014-02-21T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss32'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss32' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss32'), '82093eaa-0a43-4191-b483-669569745b33', 'HAHAHA, Benco har tatt navnet mitt', '2014-02-21T12:34:56+01:00', true, 'facebook:bilde:ss32:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss32'), '8bf2a096-1807-417f-8fe0-c33ec99d7178', 'Skal jeg bli dratt inn i leken deres å nå da!! 🙂', '2014-02-21T12:34:56+01:00', true, 'facebook:bilde:ss32:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss32'), '82093eaa-0a43-4191-b483-669569745b33', 'Noe må man jo gjøre, for å få deg ut av kjelleren på Hellerud 🙂', '2014-02-21T12:34:56+01:00', true, 'facebook:bilde:ss32:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 33: Michael Johansen, 20. februar 2014 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '82093eaa-0a43-4191-b483-669569745b33',
    'Ser du har jugoslaviske bonde aner også. Klas Puder 🙂',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472913576_10170497559555317_582184138924698425_n.jpg',
    '2014-02-20T12:34:56+01:00',
    '2014-02-20T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss33'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss33' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 34: Michael Johansen, 20. februar 2014 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '82093eaa-0a43-4191-b483-669569745b33',
    'Visste ikke at du var så musikalsk Klas Kristoffer Liland',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472876311_10170497623190317_6387856711755553460_n.jpg',
    '2014-02-20T12:34:56+01:00',
    '2014-02-20T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss34'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss34' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss34'), '4093f488-8c3c-4daf-a743-c087c74adc6d', 'Var ikke klar over det selv 🙂', '2014-02-20T12:34:56+01:00', true, 'facebook:bilde:ss34:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 35: Klas Kristoffer Liland, 20. februar 2014 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4093f488-8c3c-4daf-a743-c087c74adc6d',
    'Lunch (reka)',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/469811742_10170082468525297_4498419575386491419_n.jpg',
    '2014-02-20T12:34:56+01:00',
    '2014-02-20T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss35'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss35' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 36: Øyvind Verket, 8. oktober 2013 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4accc876-7906-4a48-b73c-a88d0f6d114b',
    'Deilig hjemme og..',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472098467_10170439595315113_7842281758487874526_n.jpg',
    '2013-10-08T12:34:56+01:00',
    '2013-10-08T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss36'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss36' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss36'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'Ser du på menn som tar sv seg buksene?', '2013-10-08T12:34:56+01:00', true, 'facebook:bilde:ss36:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 37: André Heede, 8. oktober 2013 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'f3d71e5a-367a-461e-ba13-a6c4de144e32',
    'Savner München, eisbein&würst og mas. Detta er crap!!',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468311580_10170275955440226_7492536933205911086_n.jpg',
    '2013-10-08T12:34:56+01:00',
    '2013-10-08T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss37'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss37' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 38: Reidar Haavik, 8. oktober 2013 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'ad597350-53e3-47aa-95a5-d207f383ef39',
    'Savner Munich ass, dette er crap.. — her: DNB-huset i Bjørvika.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/469156381_10169951257645370_2240540405814531238_n.jpg',
    '2013-10-08T12:34:56+01:00',
    '2013-10-08T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss38'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss38' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 39: Klas Kristoffer Liland, 2. desember 2012 (1 bilde, 3 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4093f488-8c3c-4daf-a743-c087c74adc6d',
    'Frokost 🙂',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/474037233_10170580987495297_7964515424150398530_n.jpg',
    '2012-12-02T12:34:56+01:00',
    '2012-12-02T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss39'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss39' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss39'), '8bf2a096-1807-417f-8fe0-c33ec99d7178', 'Det oser testosteron av den der frokosten!', '2012-12-02T12:34:56+01:00', true, 'facebook:bilde:ss39:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss39'), '8f64ed4a-d907-424f-82ae-d6220c7fb02c', 'Sweet!', '2012-12-02T12:34:56+01:00', true, 'facebook:bilde:ss39:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss39'), '4409273c-47f3-49e9-89be-9a7018ebac5c', 'med tyttebærsyltetøy 🙂', '2012-12-02T12:34:56+01:00', true, 'facebook:bilde:ss39:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 40: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518658037_10162919427611368_3847170441472136023_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss40'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss40' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 41: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/520476255_10162919427886368_8804124244684399291_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss41'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss41' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 42: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/519395762_10162919427986368_2365358503468583542_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss42'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss42' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 43: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518314111_10162919428076368_2472337784645710054_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss43'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss43' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 44: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518314818_10162919427936368_8239745519008611795_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss44'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss44' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 45: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518435350_10162919427616368_5558791084309264020_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss45'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss45' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 46: Espen Waldem, 19. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/519004626_10162919427606368_216200332465866816_n.jpg',
    '2010-12-19T12:34:56+01:00',
    '2010-12-19T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss46'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss46' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 47: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518320949_10162918875406368_5800396639740064618_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss47'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss47' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 48: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/520836923_10162918874856368_485771287725791650_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss48'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss48' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 49: Espen Waldem, 13. desember 2010 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    'rybak was here',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/519723443_10162918875146368_935026746537238667_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss49'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss49' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss49'), '4accc876-7906-4a48-b73c-a88d0f6d114b', 'han er ikke den eneste..', '2010-12-13T12:34:56+01:00', true, 'facebook:bilde:ss49:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 50: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518578916_10162918875371368_821995706893352632_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss50'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss50' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 51: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518147005_10162918875061368_1477369775922750608_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss51'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss51' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 52: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518313093_10162918875456368_1348643235867528697_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss52'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss52' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 53: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518803319_10162918875046368_350116659518989438_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss53'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss53' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 54: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    'one happy family',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518582873_10162918875026368_610420821859682360_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss54'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss54' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 55: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/518591262_10162918875286368_156734218321498286_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss55'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss55' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 56: Espen Waldem, 13. desember 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    'b2398344-4259-460c-a1b0-53d8a44643b3',
    'riga in my pocket',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/520228537_10162918875471368_8693685300745149099_n.jpg',
    '2010-12-13T12:34:56+01:00',
    '2010-12-13T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss56'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss56' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 57: Espen Sørum Hagen, 7. oktober 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4409273c-47f3-49e9-89be-9a7018ebac5c',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472179447_10170550551290464_20389259500477410_n.jpg',
    '2010-10-07T12:34:56+01:00',
    '2010-10-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss57'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss57' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 58: Espen Sørum Hagen, 7. oktober 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4409273c-47f3-49e9-89be-9a7018ebac5c',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472119935_10170550547600464_736685527438663604_n.jpg',
    '2010-10-07T12:34:56+01:00',
    '2010-10-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss58'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss58' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 59: Espen Sørum Hagen, 7. oktober 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4409273c-47f3-49e9-89be-9a7018ebac5c',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468856451_10170055900330464_436059343400849049_n.jpg',
    '2010-10-07T12:34:56+01:00',
    '2010-10-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss59'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss59' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 60: Espen Sørum Hagen, 7. oktober 2010 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4409273c-47f3-49e9-89be-9a7018ebac5c',
    '— sammen med Øyvind Rekve.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472224837_10170550519000464_595659400939509453_n.jpg',
    '2010-10-07T12:34:56+01:00',
    '2010-10-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss60'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss60' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss60'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'kjekke gutter ❤️', '2010-10-07T12:34:56+01:00', true, 'facebook:bilde:ss60:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 61: Espen Sørum Hagen, 7. oktober 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '4409273c-47f3-49e9-89be-9a7018ebac5c',
    null,
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/472104457_10170550549540464_7228763410115619249_n.jpg',
    '2010-10-07T12:34:56+01:00',
    '2010-10-07T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss61'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss61' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 62: Kenneth Lunde, 25. juni 2010 (1 bilde, 7 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'hehehe.. — med Jon Erik Dahl og 2 andre.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468420539_10169944412665096_2192487242058145001_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss62'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'hahaha genialt bilde', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'dritbra', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'OMG! WTF! LOL!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'sånn går dagene..', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c3')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), 'ad597350-53e3-47aa-95a5-d207f383ef39', 'hehe, jeg liker å se på dette bildet litt av og til, haha, det er kunst', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c4')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'true 😊', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c5')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss62'), '97f2a53f-a386-45d0-b53e-bde46a995767', 'Jeg ler enda!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss62:c6')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 63: Kenneth Lunde, 25. juni 2010 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'Helt om natta, helt om mårran!',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468443389_10169944412690096_3869888267080914533_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss63'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss63' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss63'), '4accc876-7906-4a48-b73c-a88d0f6d114b', '"Shit ass. Jeg bææsja på meg!"', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss63:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 64: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    '"Vi er venner vi Chris?" — med Jon Erik Dahl og 2 andre.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468623550_10169944412680096_7274017795925705100_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss64'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss64' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 65: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'Major''n — sammen med André Heede.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468357307_10169944412695096_1344239155219180584_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss65'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss65' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 66: Kenneth Lunde, 25. juni 2010 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    '"Haaade daa Niiiiils" — sammen med Kristoffer Benco Arntzen.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468222418_10169944412710096_3369296609782977880_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss66'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss66' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss66'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'haade da Niiils', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss66:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 67: Kenneth Lunde, 25. juni 2010 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'Bilde taler for seg selv — sammen med Øyvind Rekve.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468358468_10169944407490096_231703184139795518_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss67'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss67' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss67'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'Waaaaale!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss67:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 68: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'en to tre hopp — med Øyvind Rekve og 2 andre.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468357999_10169944407495096_5943155274355686811_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss68'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss68' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 69: Kenneth Lunde, 25. juni 2010 (1 bilde, 4 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'STOP! Hammoc time.. — med Jon Erik Dahl og 4 andre.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468391613_10169944407485096_8618045998776258624_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss69'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss69' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss69'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'sjekk chris gir reidar en elbow a', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss69:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss69'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'sjekk jonna klør waldem på..', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss69:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss69'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'et sted som hjernen til Espen til å starte en enorm endorfinproduksjon iallefall', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss69:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss69'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'oh yea!!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss69:c3')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 70: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'Hova — med Øyvind Rekve og 2 andre.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468388093_10169944407470096_1212063591183753932_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss70'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss70' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 71: Kenneth Lunde, 25. juni 2010 (1 bilde, 1 kommentar)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    '"Ikke vær redd lille venn, den er ikke større enn som så" — med André Heede og Chris Reitan.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468358024_10169944407475096_1520356219861115183_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss71'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss71' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss71'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'Du måkke være redd!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss71:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 72: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    '"Do the Borat dance" — med Øyvind Rekve og Chris Reitan.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468406279_10169944402200096_8662440642849756064_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss72'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss72' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 73: Kenneth Lunde, 25. juni 2010 (1 bilde, 4 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    '"Hva er det du har i bæggen ''a? Nødproviant, makrell i tomat??" — sammen med Chris Reitan.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468399892_10169944402165096_277228747751722778_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss73'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss73' and not exists (select 1 from melding_insert)
)
select 1;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss73'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'slo ann den!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss73:c0')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss73'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'ser ut som du har hånde på et spesielt sted du oxo', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss73:c1')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss73'), 'ae1834e3-2e82-4619-8372-76e2d04b65d4', 'Ooooh yea!! Bundy grepet!', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss73:c2')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;
insert into melding_chat (melding_id, profil_id, innhold, opprettet, fra_facebook, kilde_ekstern_id) values
  ((select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss73'), 'f3d71e5a-367a-461e-ba13-a6c4de144e32', 'de ler an Chris, de ler an', '2010-06-25T12:34:56+01:00', true, 'facebook:bilde:ss73:c3')
on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing;

-- screenshot 74: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'HeDidIt — sammen med André Heede.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468480465_10169944400875096_7231026925742004139_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss74'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss74' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 75: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'OMG!! LOL, Lissom jesus du?! — sammen med Reidar Haavik.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468358032_10169944400860096_2179309298273507387_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss75'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss75' and not exists (select 1 from melding_insert)
)
select 1;

-- screenshot 76: Kenneth Lunde, 25. juni 2010 (1 bilde, 0 kommentarer)
with melding_insert as (
  insert into meldinger (profil_id, innhold, bilde_url, opprettet, sist_aktivitet, fra_facebook, kilde_ekstern_id) values (
    '97f2a53f-a386-45d0-b53e-bde46a995767',
    'Åå løøh! DødseReka — sammen med Øyvind Rekve.',
    'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/meldinger/468332682_10169944400870096_607451437907088496_n.jpg',
    '2010-06-25T12:34:56+01:00',
    '2010-06-25T12:34:56+01:00',  -- sist_aktivitet = postdato (sortering)
    true,
    'facebook:bilde:ss76'
  )
  on conflict (kilde_ekstern_id) where kilde_ekstern_id is not null do nothing
  returning id
),
melding_id_cte as (
  select id from melding_insert
  union all
  select id from meldinger where kilde_ekstern_id = 'facebook:bilde:ss76' and not exists (select 1 from melding_insert)
)
select 1;

-- Reset sist_aktivitet til opprettet for alle FB-meldinger
-- (triggeren oppdater_melding_sist_aktivitet bumper sist_aktivitet ved
--  hver kommentar-insert, men for historikk vil vi ha postdato)
update meldinger set sist_aktivitet = opprettet where fra_facebook = true;

commit;

-- Verifisering:
-- select count(*) from meldinger where fra_facebook = true;
-- select count(*) from melding_bilder mb join meldinger m on m.id = mb.melding_id where m.fra_facebook = true;
-- select count(*) from melding_chat where fra_facebook = true;