'use client'

import { authClient } from '@sobok/auth/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'

export default function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut()

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(QueryKeys.me, null)

      queryClient.removeQueries({
        queryKey: QueryKeys.me,
        predicate: (query) => query.queryKey.length > 1,
      })
    },
  })
}
