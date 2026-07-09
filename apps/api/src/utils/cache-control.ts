import { createCacheControl } from '@sobok/http/cache-control'

export const privateCacheControl = createCacheControl({
  private: true,
  maxAge: 3,
})

export const noStoreCacheControl = createCacheControl({
  noStore: true,
})
