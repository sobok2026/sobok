'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import MobileNavigationMenu from '@/components/MobileNavigationMenu'

export default function MobileNavigationButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const t = useTranslations('TopNavigation.actions')

  const handleMenuClick = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <>
      <button
        aria-label={t('menu')}
        className="flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-foreground transition hover:bg-surface sm:hidden"
        onClick={handleMenuClick}
        type="button"
      >
        <Menu className="size-5" />
      </button>
      {isMenuOpen && <MobileNavigationMenu onClose={handleClose} />}
    </>
  )
}
