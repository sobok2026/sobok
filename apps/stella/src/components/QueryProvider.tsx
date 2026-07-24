'use client'

import { environmentManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ms from 'ms'
import type { PropsWithChildren } from 'react'

// A fresh client per server render, a shared singleton in the browser — the pattern TanStack recommends for the
// App Router. stella is a static export, so no query runs during the prerender pass; this client only does work
// once it reaches the browser.
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ms('1 minute'),
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return makeQueryClient()
  }
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export default function QueryProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
}
