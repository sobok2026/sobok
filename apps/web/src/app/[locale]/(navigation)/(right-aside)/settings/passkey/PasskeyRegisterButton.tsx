'use client'

import { authClient } from '@sobok/auth/client'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'

export default function PasskeyRegisterButton() {
  const router = useRouter()

  const registerMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey()

      if (result?.error) {
        throw new Error(result.error.message)
      }
    },

    onError: (error) => {
      switch (error.name) {
        case 'InvalidStateError':
          toast.info('이미 등록된 패스키가 있어요')
          return
        case 'NotAllowedError':
          toast.info('패스키 등록이 취소됐어요')
          return
        case 'NotSupportedError':
          toast.warning('이 브라우저는 패스키를 지원하지 않아요')
          return
        default:
          toast.error(error.message || '패스키 등록 중 오류가 발생했어요')
      }
    },

    onSuccess: () => {
      toast.success('패스키를 등록했어요')
      router.refresh()
    },
  })

  return (
    <button
      className="flex items-center gap-2 group rounded-full border-brand/70 bg-brand/5 border-2 px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
      disabled={registerMutation.isPending}
      onClick={() => registerMutation.mutate()}
      type="button"
    >
      {registerMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      패스키 추가
    </button>
  )
}
