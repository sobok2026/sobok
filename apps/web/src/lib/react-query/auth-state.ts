import { identify } from '@sobok/analytics/browser'
import type { QueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'

export function handleUnauthorizedError(queryClient: QueryClient) {
  queryClient.setQueryData(QueryKeys.me, null)

  queryClient.removeQueries({
    queryKey: QueryKeys.me,
    predicate: (query) => query.queryKey.length > 1,
  })

  identify(null)
}
