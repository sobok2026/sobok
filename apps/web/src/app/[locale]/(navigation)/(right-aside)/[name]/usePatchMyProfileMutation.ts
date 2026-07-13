'use client'

import { authClient } from '@sobok/auth/client'
import type { GETV1MeResponse } from '@sobok/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'

import type { ProfileEditPatch } from './profile-edit-form'

type MutationContext = {
  previousMe?: GETV1MeResponse | null
}

type Params = {
  onError?: (error: Error, variables: ProfileEditPatch, context: MutationContext | undefined) => Promise<void> | void
  onSuccess?: (
    data: ProfileEditPatch,
    variables: ProfileEditPatch,
    context: MutationContext | undefined,
  ) => Promise<void> | void
}

export default function usePatchMyProfileMutation({ onError, onSuccess }: Params = {}) {
  const queryClient = useQueryClient()

  return useMutation<ProfileEditPatch, Error, ProfileEditPatch, MutationContext>({
    mutationFn: async (patch) => {
      const { error } = await authClient.updateUser({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.username !== undefined && { username: patch.username }),
        ...(patch.image !== undefined && { image: patch.image }),
      })

      if (error) {
        throw new Error(error.message)
      }

      return patch
    },

    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.me, exact: true })
      const previousMe = queryClient.getQueryData<GETV1MeResponse | null>(QueryKeys.me)

      queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          ...(patch.name && { name: patch.name }),
          ...(patch.username && { username: patch.username.toLowerCase(), displayUsername: patch.username }),
          ...(patch.image !== undefined && { image: patch.image }),
        }
      })

      return { previousMe }
    },

    onError: async (error, variables, context) => {
      if (context?.previousMe !== undefined) {
        queryClient.setQueryData(QueryKeys.me, context.previousMe)
      }

      await onError?.(error, variables, context)
    },

    onSuccess: async (data, variables, context) => {
      await onSuccess?.(data, variables, context)
    },
  })
}
