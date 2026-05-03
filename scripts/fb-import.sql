-- FB-arrangementer import — generert av scripts/fb-import.mjs
-- Forutsetter at migrasjon 062_fra_facebook_flagg.sql er kjørt
-- og at cover-bilder er lastet opp til R2 under "arrangementer/"

begin;

-- 2015-09-19 August september møte (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'August september møte',
  '2015-09-19T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2015-09-19-august-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2014-09-25 Helsinki (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Helsinki',
  '2014-09-25T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2014-09-25-helsinki.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2014-03-08 Holmenkoll lørra (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Holmenkoll lørra',
  '2014-03-08T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2014-03-08-holmenkoll-lorra.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2012-11-02 København (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'København',
  '2012-11-02T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2012-11-02-kobenhavn.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2012-04-28 Aprilmøtet - Ølbryggerkurs (av Reidar Haavik)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Aprilmøtet - Ølbryggerkurs',
  '2012-04-28T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2012-04-28-aprilmotet-olbryggerkurs.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Reidar Haavik') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2017-10-07 Bjerkebanens stayerløp Kaldblod V75 (av Reidar Haavik)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Bjerkebanens stayerløp Kaldblod V75',
  '2017-10-07T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2017-10-07-bjerkebanens-stayerlop-kaldblod-v75.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Reidar Haavik') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2017-09-09 August/september Møte (av Espen Waldem)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'August/september Møte',
  '2017-09-09T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2017-09-09-august-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Espen Waldem') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2016-11-26 Julebord 2016 (av Reidar Haavik)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord 2016',
  '2016-11-26T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2016-11-26-julebord-2016.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Reidar Haavik') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2016-10-21 Jonna's Hurratravels tar deg med til et spennende... (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Jonna''s Hurratravels tar deg med til et spennende...',
  '2016-10-21T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2016-10-21-jonna-s-hurratravels-tar-deg-med-til-et-spennende.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2015-11-28 Julebord 2015 (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord 2015',
  '2015-11-28T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2015-11-28-julebord-2015.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2018-08-03 Øl, mat og krøll (av Øyvind Rekve)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Øl, mat og krøll',
  '2018-08-03T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2018-08-03-ol-mat-og-kroll.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Rekve') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2018-06-23 Mai Juni Møte (av Espen Waldem)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mai Juni Møte',
  '2018-06-23T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2018-06-23-mai-juni-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Espen Waldem') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2018-04-14 Tysk aften (av Øyvind Verket)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Tysk aften',
  '2018-04-14T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2018-04-14-tysk-aften.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Verket') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2017-12-09 Julebord (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord',
  '2017-12-09T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2017-12-09-julebord.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2017-10-27 Barca Tur (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Barca Tur',
  '2017-10-27T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2017-10-27-barca-tur.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2019-04-13 Mars/april møte (av Reidar Haavik)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mars/april møte',
  '2019-04-13T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2019-04-13-mars-april-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Reidar Haavik') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2019-01-26 Jan/Feb møte (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Jan/Feb møte',
  '2019-01-26T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2019-01-26-jan-feb-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2018-12-01 Julebord 2018 (av Andreas Eriksen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord 2018',
  '2018-12-01T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2018-12-01-julebord-2018.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Andreas Eriksen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2018-11-17 Oktober/Novembermøte (av Kristoffer Benco Arntzen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Oktober/Novembermøte',
  '2018-11-17T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2018-11-17-oktober-novembermote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Kristoffer Benco Arntzen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2018-08-31 Herretur 2018 (av Reidar Haavik)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Herretur 2018',
  '2018-08-31T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2018-08-31-herretur-2018.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Reidar Haavik') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2020-03-07 Årets første (av Chris Reitan)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Årets første',
  '2020-03-07T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2020-03-07-arets-forste.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Chris Reitan') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2019-11-30 Julebord for Herreklubben 2019 (av Espen Waldem)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord for Herreklubben 2019',
  '2019-11-30T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2019-11-30-julebord-for-herreklubben-2019.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Espen Waldem') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2019-09-14 September møte (av Øyvind Rekve)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'September møte',
  '2019-09-14T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2019-09-14-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Rekve') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2019-06-29 Juni møte (av Klas Kristoffer Liland)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Juni møte',
  '2019-06-29T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2019-06-29-juni-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Klas Kristoffer Liland') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2019-04-26 Utenlandstur 2019 (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Utenlandstur 2019',
  '2019-04-26T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2019-04-26-utenlandstur-2019.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2021-09-04 August/september møte (av Alexander Svensen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'August/september møte',
  '2021-09-04T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2021-09-04-august-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Alexander Svensen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2020-12-05 Julebord 2020 (av Thomas Formo Riise)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord 2020',
  '2020-12-05T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2020-12-05-julebord-2020.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Thomas Formo Riise') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2020-11-07 Oktober November møte (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Oktober November møte',
  '2020-11-07T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2020-11-07-oktober-november-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2020-09-12 august september møte (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'august september møte',
  '2020-09-12T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2020-09-12-august-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2020-06-27 Mai/juni Møte (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mai/juni Møte',
  '2020-06-27T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2020-06-27-mai-juni-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2020-04-30 Herreklubb tur 2020 (av Øyvind Verket)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Herreklubb tur 2020',
  '2020-04-30T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2020-04-30-herreklubb-tur-2020.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Verket') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2022-10-20 Hurratur (av Øyvind Verket)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Hurratur',
  '2022-10-20T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2022-10-20-hurratur.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Verket') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2022-09-16 August/september-møte (av Thomas Formo Riise)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'August/september-møte',
  '2022-09-16T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2022-09-16-august-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Thomas Formo Riise') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2022-04-09 Mars april møtet (av Espen Sørum Hagen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mars april møtet',
  '2022-04-09T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2022-04-09-mars-april-motet.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Espen Sørum Hagen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2022-02-05 Jan/Feb møte (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Jan/Feb møte',
  '2022-02-05T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2022-02-05-jan-feb-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2021-12-11 Julebord (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord',
  '2021-12-11T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2021-12-11-julebord.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2021-11-06 Oktober/ November (av André Heede)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Oktober/ November',
  '2021-11-06T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2021-11-06-oktober-november.jpg',
  coalesce((select id from profiles where lower(navn) = lower('André Heede') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2023-12-09 Julebord 2023 (av Kristian Andresen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord 2023',
  '2023-12-09T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2023-12-09-julebord-2023.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Kristian Andresen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2023-10-12 Herreklubbens Charter 2023 (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Herreklubbens Charter 2023',
  '2023-10-12T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2023-10-12-herreklubbens-charter-2023.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2023-09-23 September møte (av Klas Kristoffer Liland)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'September møte',
  '2023-09-23T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2023-09-23-september-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Klas Kristoffer Liland') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2023-06-23 Fredagspils (av Øyvind Verket)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Fredagspils',
  '2023-06-23T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2023-06-23-fredagspils.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Verket') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2023-04-21 Mars April møte (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mars April møte',
  '2023-04-21T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2023-04-21-mars-april-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2023-02-18 Jan/feb-møte (av Thomas Formo Riise)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Jan/feb-møte',
  '2023-02-18T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2023-02-18-jan-feb-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Thomas Formo Riise') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2022-11-12 Oktober/november (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Oktober/november',
  '2022-11-12T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2022-11-12-oktober-november.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2024-12-13 Julebord (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord',
  '2024-12-13T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2024-12-13-julebord.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2024-10-04 Apekatt tur 2024 (av Michael Johansen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Apekatt tur 2024',
  '2024-10-04T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2024-10-04-apekatt-tur-2024.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Michael Johansen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2024-09-21 August/september BBQ feast (av André Heede)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'August/september BBQ feast',
  '2024-09-21T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2024-09-21-august-september-bbq-feast.jpg',
  coalesce((select id from profiles where lower(navn) = lower('André Heede') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2024-08-10 Forsinket mai/juni møte (av Alexander Svensen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Forsinket mai/juni møte',
  '2024-08-10T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2024-08-10-forsinket-mai-juni-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Alexander Svensen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2024-04-05 Mars/april-møte (av Thomas Formo Riise)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mars/april-møte',
  '2024-04-05T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2024-04-05-mars-april-mote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Thomas Formo Riise') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2024-02-03 Februarmøte (av Øyvind Verket)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Februarmøte',
  '2024-02-03T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2024-02-03-februarmote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Øyvind Verket') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2025-11-29 Julebord (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Julebord',
  '2025-11-29T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2025-11-29-julebord.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2025-09-06 Hyttehelg på Digerud (av Klas Kristoffer Liland)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Hyttehelg på Digerud',
  '2025-09-06T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2025-09-06-hyttehelg-pa-digerud.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Klas Kristoffer Liland') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2025-06-28 Herreklubbens sommeravslutning (av Richard Andresen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Herreklubbens sommeravslutning',
  '2025-06-28T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2025-06-28-herreklubbens-sommeravslutning.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Richard Andresen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2025-04-24 utlandstur 2025 (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'utlandstur 2025',
  '2025-04-24T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2025-04-24-utlandstur-2025.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2025-04-05 Mars- aprilmøte (av Jon Erik Dahl)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Mars- aprilmøte',
  '2025-04-05T15:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2025-04-05-mars-aprilmote.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Jon Erik Dahl') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

-- 2025-02-07 Januar/februar møter (av Espen Sørum Hagen)
insert into arrangementer (type, tittel, start_tidspunkt, bilde_url, opprettet_av, fra_facebook, oppmoetested) values (
  'moete',
  'Januar/februar møter',
  '2025-02-07T16:00:00.000Z',
  'https://pub-31771477f82844bfb7ecc20cdb45a5ab.r2.dev/arrangementer/2025-02-07-januar-februar-moter.jpg',
  coalesce((select id from profiles where lower(navn) = lower('Espen Sørum Hagen') limit 1), (select id from profiles where rolle = 'admin' order by opprettet asc limit 1)),
  true,
  null
);

commit;

-- Verifiser: antall FB-arrangementer importert
-- select count(*) from arrangementer where fra_facebook = true;

-- Sjekk fallback (rader som ble tilordnet admin pga ukjent navn):
-- select tittel, start_tidspunkt, (select navn from profiles where id = arrangementer.opprettet_av) as opprettet_av_navn from arrangementer where fra_facebook = true order by start_tidspunkt;