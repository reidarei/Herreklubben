self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const { tittel, melding, url } = data

  event.waitUntil(
    self.registration.showNotification(tittel ?? 'Herreklubben', {
      body: melding,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
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
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
