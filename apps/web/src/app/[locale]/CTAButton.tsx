'use client'

import { CandyCane, PartyPopper } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import LogoDiscord from '@/components/icons/LogoDiscord'
import { Link } from '@/i18n/navigation'

type Period = 'christmas' | 'newYear'

type Props = {
  className?: string
}

export default function CTAButton({ className = '' }: Props) {
  const [period, setPeriod] = useState<Period | null>(null)
  const t = useTranslations('Home.cta')

  useEffect(() => {
    setPeriod(getPeriod())
  }, [])

  if (period === 'christmas') {
    return (
      <Link className={twMerge('flex justify-center items-center gap-2 rounded', className)} href="/" prefetch={false}>
        <CandyCane className="size-5" /> {t('christmas')}
      </Link>
    )
  }

  if (period === 'newYear') {
    return (
      <Link
        className={twMerge('flex justify-center items-center gap-2 rounded', className)}
        href="/nye"
        prefetch={false}
      >
        <PartyPopper className="size-5" /> {t('newYear')}
      </Link>
    )
  }

  return (
    <a
      className={twMerge('flex justify-center items-center gap-2 rounded', className)}
      href="https://discord.gg/CQYjDG4NPv"
      target="_blank"
      rel="noopener"
    >
      <LogoDiscord className="size-6 text-[#5865F2]" />
      Discord
    </a>
  )
}

function getPeriod() {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month === 12 && day >= 24 && day < 26) {
    return 'christmas'
  }

  if ((month === 12 && day >= 26) || (month === 1 && day <= 1)) {
    return 'newYear'
  }

  return null
}
