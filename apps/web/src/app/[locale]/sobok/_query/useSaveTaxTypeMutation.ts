import type { PUTV1ChatTaxTypeBody, PUTV1ChatTaxTypeResponse } from '@sobok/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchApiData } from '@/utils/api-request'

export default function useSaveTaxTypeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PUTV1ChatTaxTypeBody) => {
      const url = '/api/v1/chat/studio/tax-type'

      const { data } = await fetchApiData<PUTV1ChatTaxTypeResponse>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatStudioEarnings })
    },
  })
}
