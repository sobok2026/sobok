import type { POSTV1PaymentMethodResponse } from '@sobok/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchApiData } from '@/utils/api-request'

export default function useAddPaymentMethodMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const pathname = '/api/v1/billing/payment-methods'

      const { data } = await fetchApiData<POSTV1PaymentMethodResponse>(pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.paymentMethods })
    },
  })
}
