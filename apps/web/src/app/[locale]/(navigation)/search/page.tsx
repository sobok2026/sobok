import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import ActiveFilters, { ClearAllFilters } from './ActiveFilters'
import { SearchParam } from './constants'
import { SearchHeaderSpacer } from './SearchHeaderSpacer'
import { getLanguageFilter } from './searchLanguage'
import TrendingKeywords from './TrendingKeywords'

export async function generateMetadata({ params }: PageProps<'/[locale]/search'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.search' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({ title, description, locale, pathname: '/search' }),
  }
}

export default async function Page({ searchParams }: PageProps<'/[locale]/search'>) {
  const t = await getTranslations('Search')
  const params = getURLSearchParams(await searchParams)

  const filters = {
    sort: params.get(SearchParam.SORT),
    language: getLanguageFilter(params.get(SearchParam.QUERY)),
    minView: params.get(SearchParam.MIN_VIEW),
    maxView: params.get(SearchParam.MAX_VIEW),
    minPage: params.get(SearchParam.MIN_PAGE),
    maxPage: params.get(SearchParam.MAX_PAGE),
    minRating: params.get(SearchParam.MIN_RATING),
    maxRating: params.get(SearchParam.MAX_RATING),
    from: params.get(SearchParam.FROM),
    to: params.get(SearchParam.TO),
    nextId: params.get(SearchParam.NEXT_ID),
    skip: params.get(SearchParam.SKIP),
  }

  const hasActiveFilters = Boolean(Object.values(filters).some(Boolean))

  return (
    <>
      <SearchHeaderSpacer />
      <div className="flex flex-col gap-2 p-2 pb-0">
        {hasActiveFilters ? (
          <div className="grid gap-2 p-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground-muted">{t('activeFilters')}</h3>
              <ClearAllFilters />
            </div>
            <ActiveFilters filters={filters} />
          </div>
        ) : (
          <TrendingKeywords />
        )}
      </div>
      <MobileNavigationSpacer />
    </>
  )
}

function getURLSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    const firstValue = Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

    if (firstValue) {
      params.set(key, firstValue)
    }
  }

  return params
}
