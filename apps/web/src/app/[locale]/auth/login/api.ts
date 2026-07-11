import type { POSTV1LibraryHistoryImportBody, POSTV1LibraryHistoryImportResponse } from '@sobok/contracts'

import { fetchAPIData } from '@/utils/api-request'

// 로그인·2FA·패스키는 better-auth 클라이언트(@sobok/auth/client)가 담당한다.

export async function importReadingHistory(request: POSTV1LibraryHistoryImportBody) {
  const url = '/api/v1/library/history/import'

  const { data } = await fetchAPIData<POSTV1LibraryHistoryImportResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
