import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchApiData } from '@/utils/api-request'

export default function useDeletePaymentMethodMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const url = `/api/v1/billing/payment-methods/${id}`
      await fetchApiData<void>(url, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.paymentMethods })
    },
  })
}
