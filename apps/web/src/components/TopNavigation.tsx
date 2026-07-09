'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import AutoHideHeader from './auto-hide/AutoHideHeader'

type Props = {
  children?: ReactNode
  className?: string
  onMenuClick?: () => void
}

export default function TopNavigation({ children, className, onMenuClick }: Props) {
  const t = useTranslations('Navigation.mobileMenu')

  return (
    <AutoHideHeader className={className} role="navigation">
      <div className="flex items-center justify-between gap-2 px-2 pt-safe sm:hidden">
        <button
          aria-label={t('open')}
          className="relative hover:bg-surface-2 rounded-lg transition"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="size-9 p-2" />
        </button>
        <div className="w-12" />
      </div>
      {children}
    </AutoHideHeader>
  )
}
