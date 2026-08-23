// Cache del shell para que la ficha funcione sin señal en la mesa de juego.
// La lista SHELL y el nombre de la caché los inyecta scripts/build-sw.mjs.
const CACHE = 'areen-dev'
const SHELL = ['./', './index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin
  // Las tipografías van dentro de la app: aquí solo se sirve lo propio.
  if (!sameOrigin) return

  // Navegaciones: red primero para recoger actualizaciones, caché si no hay señal.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          e.waitUntil(caches.open(CACHE).then((c) => c.put('./index.html', copy)))
          return res
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          // ignoreVary y ignoreSearch: la navegación puede traer parámetros
          // y cabeceras que no estaban al guardar la copia.
          return (await cache.match('./index.html', { ignoreVary: true, ignoreSearch: true }))
            ?? (await cache.match('./', { ignoreVary: true, ignoreSearch: true }))
            ?? Response.error()
        }),
    )
    return
  }

  // Assets: caché primero, y refresco en segundo plano.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE)
    // Vite marca sus assets como crossorigin, así que la petición no coincide
    // byte a byte con la que guardamos: hay que ignorar Vary.
    const hit = await cache.match(request, { ignoreVary: true })
    if (hit) {
      e.waitUntil(
        fetch(request)
          .then((res) => { if (res.ok) return cache.put(request, res.clone()) })
          .catch(() => {}),
      )
      return hit
    }
    try {
      const res = await fetch(request)
      if (res.ok) e.waitUntil(cache.put(request, res.clone()))
      return res
    } catch {
      return Response.error()
    }
  })())
})
