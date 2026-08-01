import type { POSTV1ChatMessageBody, POSTV1ChatMessageResponse } from '@sobok/contracts'
import { useMutation } from '@tanstack/react-query'
import { fetchApiData } from '@/utils/api-request'

export default function useSendMessageMutation(handle: string) {
  return useMutation({
    mutationFn: async (body: POSTV1ChatMessageBody) => {
      const { data } = await fetchApiData<POSTV1ChatMessageResponse>(`/api/v1/chat/artist/${handle}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
  })
}
