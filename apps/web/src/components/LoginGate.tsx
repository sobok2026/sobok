'use client'

import { LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import useCurrentPathWithSearch from '@/hook/useCurrentPathWithSearch'
import { Link } from '@/i18n/navigation'
import { getAuthRedirectHref } from '@/lib/auth-redirect'

type Props = {
  description?: ReactNode
}

export default function LoginGate({ description }: Props) {
  const t = useTranslations('Common.guard')
  const redirect = useCurrentPathWithSearch()

  return (
    <StatusState
      description={description ?? t('loginDescription')}
      icon={<LockKeyhole className="size-8" />}
      intent="auth"
      title={t('loginRequired')}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <LoginButton>{t('loginAction')}</LoginButton>
        <p className="text-sm text-foreground-subtle">
          {t('signupPrompt')}{' '}
          <Link
            className="text-foreground-secondary underline transition hover:text-foreground"
            href={getAuthRedirectHref('/auth/signup', redirect)}
            prefetch={false}
          >
            {t('signupAction')}
          </Link>
        </p>
      </div>
    </StatusState>
  )
}
