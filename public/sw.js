// ─── Caching ────────────────────────────────────────────────────────────────
// CACHE_VERSION speiler app-versjonen fra lib/versjon.json og oppdateres
// automatisk av scripts/stamp-versjon.mjs ved hver deploy.
//
// STATIC_CACHE er bevisst UTEN versjon: Next.js innholds-hasher alle
// /_next/static/-filer, så URL-en garanterer innhold. Filer som ikke har
// endret seg mellom builds har samme hash og kan trygt gjenbrukes — det
// sparer brukeren fra å re-laste 80-90% av JS-bundlen ved hver deploy.
// Se #180.
//
// PAGE_CACHE er versjonert fordi HTML ikke er innholdshashet — nye builds
// kan ha samme URL men forskjellig output.
const CACHE_VERSION = 'V3.1.26'
const STATIC_CACHE = 'herreklubben-static'
const PAGE_CACHE = `herreklubben-pages-${CACHE_VERSION}`

// Begrens hvor mange HTML-sider som caches — Cache API har ingen LRU,
// så vi rydder eksplisitt fra eldste når vi går over grensen.
const MAX_PAGE_CACHE_ENTRIES = 30

// App-shell assets som forhåndslagres ved installasjon. Disse er også
// "whitelist" for cache-first av bilder — vi cacher kun ikoner som vi
// kjenner og som ligger på faste paths, ikke vilkårlige png/jpg-treff.
const PRECACHE_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/icon-180.png',
  '/favicon-32.png',
]

// Cache-first gjelder kun ikoner/favicon — andre png/jpg/webp kan komme
// fra dynamiske ruter, ikke trygt å cache blankt.
function erIkonAsset(pathname) {
  return pathname.startsWith('/icon-') || pathname.startsWith('/favicon')
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  // Aktiver ny SW umiddelbart — ikke vent på at alle faner lukkes
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Trim cache til MAX entries — sletter eldste (FIFO via keys()-rekkefølge).
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  const toDelete = keys.slice(0, keys.length - maxEntries)
  await Promise.all(toDelete.map((k) => cache.delete(k)))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Kun GET-forespørsler
  if (request.method !== 'GET') return

  // Kun same-origin (ikke Supabase-storage, CDN, osv.)
  if (url.origin !== self.location.origin) return

  // API-ruter og auth-sider caches aldri — de er alltid ferske
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname === '/login' || url.pathname === '/oppdater-passord') return

  // Cache-first: Next.js statiske assets er innholds-hashet og uforanderlige
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            // Bruk event.waitUntil så SW lever til caching er ferdig
            event.waitUntil(
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
            )
          }
          return response
        })
      })
    )
    return
  }

  // Cache-first: kjente ikoner og favicon. Andre bilde-extensions hopper
  // forbi for å unngå at dynamiske ruter (f.eks. /api/avatar/x.png) caches
  // ved et uhell.
  if (erIkonAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            event.waitUntil(
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
            )
          }
          return response
        })
      })
    )
    return
  }

  // Stale-while-revalidate: HTML-sider — returner cachet versjon umiddelbart
  // hvis vi har den, og oppdater i bakgrunnen. Cold-load føles momentan
  // selv om Vercel-funksjonen cold-starter (~1-3s). Sosial data tåler å være
  // sekunder gammel. Se #180.
  //
  // Fallback hvis ikke cached: vanlig network-fetch (med cache-write).
  // Fallback ved offline: returner cache (samme som network-first før).
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchOgCache = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              event.waitUntil(
                caches.open(PAGE_CACHE).then(async (cache) => {
                  await cache.put(request, clone)
                  await trimCache(PAGE_CACHE, MAX_PAGE_CACHE_ENTRIES)
                })
              )
            }
            return response
          })
          .catch(() => cached) // offline-fallback
        // Stale: vis cache nå, oppdater i bakgrunnen
        return cached || fetchOgCache
      })
    )
    return
  }
})

// ─── Push-varsler ────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const { tittel, melding, url } = data

  event.waitUntil(
    self.registration.showNotification(tittel ?? 'Herreklubben', {
      body: melding,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Appen er mobil-PWA. På iOS standalone fokuserer openWindow() PWA-en og
  // navigerer i ett steg — uten matchAll/navigate-quirksene som tidligere
  // sendte brukeren til feil side (#233).
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin).href
  event.waitUntil(clients.openWindow(target))
})
