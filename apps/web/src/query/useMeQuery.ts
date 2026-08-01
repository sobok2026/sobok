import { authClient } from '@sobok/auth/client'
import type { GETV1MeResponse } from '@sobok/contracts'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchApiData } from '@/utils/api-request'

export async function fetchMe() {
  const url = '/api/v1/me'
  const { data } = await fetchApiData<GETV1MeResponse>(url)
  return data
}

export function getMeQueryFetchOptions() {
  return {
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
  } as const
}

export default function useMeQuery() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()

  return useQuery<GETV1MeResponse | null>({
    ...getMeQueryFetchOptions(),
    enabled: !isSessionPending && Boolean(session),
    placeholderData: !isSessionPending && !session ? null : undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: ms('1 hour'),
    gcTime: ms('1 hour'),
  })
}
