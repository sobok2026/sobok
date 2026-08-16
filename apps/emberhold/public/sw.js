const BUILD_FINGERPRINT = '__EMBERHOLD_BUILD__'
const CACHE_PREFIX = 'emberhold-offline-'
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_FINGERPRINT}`
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/apple-icon.png',
  '/emberhold-og.jpg',
  '/install-preview-narrow.webp',
]

function sameOrigin(request) {
  return new URL(request.url).origin === self.location.origin
}

async function loadAssetList() {
  const response = await fetch(`/offline-assets.json?build=${BUILD_FINGERPRINT}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Offline asset manifest is unavailable.')
  const payload = await response.json()
  if (!payload || !Array.isArray(payload.assets)) throw new Error('Offline asset manifest is invalid.')
  return [...new Set([...CORE_ASSETS, ...payload.assets])]
}

async function cacheAsset(cache, path) {
  const request = new Request(path, { cache: 'reload' })
  const response = await fetch(request)
  if (!response.ok) throw new Error(`Unable to cache ${path}.`)
  await cache.put(request, response)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const assets = await loadAssetList()
      const cache = await caches.open(CACHE_NAME)
      await Promise.all(assets.map((path) => cacheAsset(cache, path)))

      const expected = new Set(assets.map((path) => new URL(path, self.location.origin).href))
      const cachedRequests = await cache.keys()
      await Promise.all(
        cachedRequests
          .filter((request) => !expected.has(new URL(request.url).href))
          .map((request) => cache.delete(request)),
      )
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('emberhold-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      )
      await self.clients.claim()
    })(),
  )
})

async function navigationResponse(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    const fallbackPath = new URL(request.url).pathname === '/' ? '/' : '/404.html'
    const fallback =
      (await cache.match(request, { ignoreSearch: true })) ??
      (await cache.match(fallbackPath)) ??
      (await cache.match('/')) ??
      (await cache.match('/index.html'))
    return fallback ?? new Response('Emberhold is unavailable offline.', { status: 503 })
  }
}

async function assetResponse(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request, { ignoreSearch: true })
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !sameOrigin(request) || request.headers.has('range')) return
  if (new URL(request.url).pathname === '/offline-assets.json') return

  event.respondWith(request.mode === 'navigate' ? navigationResponse(request) : assetResponse(request))
})
