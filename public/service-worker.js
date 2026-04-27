// Service Worker untuk notifikasi
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  
  const options = {
    body: data.body || 'Waktunya masak!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'himsa-reminder',
    data: data,
    requireInteraction: true,
    actions: [
      { action: 'done', title: '✅ Selesai' },
      { action: 'later', title: '⏰ Nanti' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'HIMSA', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'done') {
    // Kirim pesan ke halaman untuk tandai selesai
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'REMINDER_COMPLETE',
            data: event.notification.data,
          })
        })
      })
    )
  }
  
  // Buka tab HIMSA
  event.waitUntil(
    clients.openWindow('/kesejahteraan')
  )
})