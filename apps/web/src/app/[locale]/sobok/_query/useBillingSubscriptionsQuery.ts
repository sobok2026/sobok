import type { GETV1BillingSubscriptionsResponse } from '@sobok/contracts'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchApiData } from '@/utils/api-request'

export default function useBillingSubscriptionsQuery() {
  return useQuery({
    queryKey: QueryKeys.billingSubscriptions,
    queryFn: async () => {
      const url = '/api/v1/billing/subscriptions'
      const { data } = await fetchApiData<GETV1BillingSubscriptionsResponse>(url)
      return data
    },
    staleTime: 0,
  })
}
