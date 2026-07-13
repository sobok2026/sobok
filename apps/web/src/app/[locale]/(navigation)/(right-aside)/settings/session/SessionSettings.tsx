'use client'

import { authClient } from '@sobok/auth/client'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import SessionList from './SessionList'

export default function SessionSettings() {
  const { data: current } = authClient.useSession()

  const { data: sessions, isPending } = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })

  if (isPending || !sessions) {
    return (
      <div className="animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
        <Loader2 className="size-5 mx-auto animate-spin" />
      </div>
    )
  }

  const currentSessionId = current?.session.id ?? null

  const rows = sessions.map((session) => ({
    id: session.id,
    token: session.token,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    expiresAt: new Date(session.expiresAt),
    userAgent: session.userAgent ?? null,
    isCurrent: session.id === currentSessionId,
  }))

  return <SessionList sessions={rows} />
}
