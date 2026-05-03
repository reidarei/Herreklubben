// ─── Caching ────────────────────────────────────────────────────────────────
// Bump CACHE_VERSION when the app shell changes to force cache invalidation.
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `herreklubben-static-${CACHE_VERSION}`
const PAGE_CACHE = `herreklubben-pages-${CACHE_VERSION}`

// App-shell assets som forhåndslagres ved installasjon
const PRECACHE_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/icon-180.png',
  '/favicon-32.png',
]

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

  // Cache-first: statiske public-assets (ikoner, bilder)
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico)$/)) {
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

  // Network-first: HTML-sider — prøv nett, fall tilbake til cache (offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            event.waitUntil(
              caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone))
            )
          }
          return response
        })
        .catch(() => caches.match(request))
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
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'navigate' in client) {
          return client.navigate(url).then(() => client.focus())
        }
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
