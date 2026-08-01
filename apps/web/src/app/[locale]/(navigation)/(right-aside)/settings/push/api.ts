import type {
  DELETEV1MePushSubscriptionBody,
  DELETEV1MePushSubscriptionIdResponse,
  PATCHV1MePushSettingsBody,
  POSTV1MePushSubscriptionBody,
  POSTV1MePushSubscriptionResponse,
  POSTV1MePushTestBody,
} from '@sobok/contracts'

import { fetchApiData } from '@/utils/api-request'

export async function createPushSubscription(body: POSTV1MePushSubscriptionBody) {
  const url = '/api/v1/me/push/subscription'

  const { data } = await fetchApiData<POSTV1MePushSubscriptionResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deletePushSubscription(id: number) {
  const url = `/api/v1/me/push/subscription/${id}`

  const { data } = await fetchApiData<DELETEV1MePushSubscriptionIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function deletePushSubscriptionByEndpoint(body: DELETEV1MePushSubscriptionBody) {
  await fetchApiData<undefined>('/api/v1/me/push/subscription', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function sendTestPushNotification(body: POSTV1MePushTestBody) {
  await fetchApiData<undefined>('/api/v1/me/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function updatePushSettings(body: PATCHV1MePushSettingsBody) {
  await fetchApiData<undefined>('/api/v1/me/push/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
