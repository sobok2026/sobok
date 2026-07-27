'use client'

import { identify, track } from '@sobok/analytics/browser'
import { authClient } from '@sobok/auth/client'
import { generateRandomNickname } from '@sobok/domain/utils/nickname'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { getAuthSuccessRedirect, getCurrentAuthRedirect } from '@/lib/auth-redirect'
import { getMeQueryFetchOptions } from '@/query/useMeQuery'

export interface SignupInput {
  email: string
  username: string
  nickname: string
  password: string
  turnstileToken: string
}

export class SignupError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SignupError'
  }
}

interface Params {
  onError?: (error: SignupError) => void
}

export default function useSignupMutation({ onError }: Params = {}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('Auth.signup')

  return useMutation({
    mutationFn: async ({ email, username, nickname, password, turnstileToken }: SignupInput) => {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: nickname.trim() || generateRandomNickname(),
        username,
        fetchOptions: {
          headers: { 'x-captcha-response': turnstileToken },
        },
      })

      if (error) {
        throw new SignupError(error.message)
      }

      return { user: data.user, username }
    },
    onError,
    onSuccess: async ({ user, username }) => {
      toast.success(t('success', { email: user.email }))

      identify(user.id)
      track('signup', { email: user.email, username })

      await queryClient.fetchQuery({ ...getMeQueryFetchOptions(), staleTime: 0 }).catch(() => null)

      router.replace(getAuthSuccessRedirect(getCurrentAuthRedirect(), username))
    },
  })
}
