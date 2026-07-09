import type { ReactNode } from 'react'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full grow">
      <div className="flex min-w-0 flex-col">{children}</div>
      <MobileNavigationSpacer />
    </div>
  )
}
