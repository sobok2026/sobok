const BUILD_FINGERPRINT = '__EMBERHOLD_BUILD__'
const CACHE_PREFIX = 'emberhold-offline-'
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_FINGERPRINT}`
const CACHE_RETIREMENT_MARKER_URL = `${self.location.origin}/__emberhold-cache-retirement__`
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

async function updateRuntimeCache(cache, request, response) {
  try {
    await cache.put(request, response)
  } catch {
    // A successful network response remains usable when optional runtime caching fails.
  }
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

async function rotateBuildCaches() {
  const cacheNames = await caches.keys()
  const previousBuildCaches = cacheNames.filter(
    (cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME,
  )
  await Promise.all(
    previousBuildCaches.map(async (cacheName) => {
      try {
        const cache = await caches.open(cacheName)
        if (await cache.match(CACHE_RETIREMENT_MARKER_URL)) {
          await caches.delete(cacheName)
          return
        }
        await cache.put(CACHE_RETIREMENT_MARKER_URL, new Response(BUILD_FINGERPRINT))
      } catch {
        // Cache cleanup must never prevent the complete new build from activating.
      }
    }),
  )
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await rotateBuildCaches()
      await self.clients.claim()
    })(),
  )
})

async function navigationResponse(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) await updateRuntimeCache(cache, request, response.clone())
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

async function matchRetainedAsset(request) {
  if (!new URL(request.url).pathname.startsWith('/_next/static/')) return null
  const cacheNames = await caches.keys()
  for (let index = cacheNames.length - 1; index >= 0; index -= 1) {
    const cacheName = cacheNames[index]
    if (!cacheName.startsWith(CACHE_PREFIX) || cacheName === CACHE_NAME) continue
    try {
      const cached = await caches.open(cacheName).then((cache) => cache.match(request, { ignoreSearch: true }))
      if (cached) return cached
    } catch {
      // A missing retired cache should fall through to the original network response.
    }
  }
  return null
}

async function assetResponse(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request, { ignoreSearch: true })
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      await updateRuntimeCache(cache, request, response.clone())
      return response
    }
    return (await matchRetainedAsset(request)) ?? response
  } catch (error) {
    const retained = await matchRetainedAsset(request)
    if (retained) return retained
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !sameOrigin(request) || request.headers.has('range')) return
  if (new URL(request.url).pathname === '/offline-assets.json') return

  event.respondWith(request.mode === 'navigate' ? navigationResponse(request) : assetResponse(request))
})
