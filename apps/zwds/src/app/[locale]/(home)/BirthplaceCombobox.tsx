'use client'

import { loadBirthplaceCatalog } from '@sobok/domain/birthplace/catalog.client'
import { type BirthplaceCatalog, type BirthplaceSnapshot, snapshotBirthplace } from '@sobok/domain/birthplace/model'
import { getBirthplaceGroups } from '@sobok/domain/birthplace/search'
import { Locale } from '@sobok/domain/locale'
import { useCombobox } from 'downshift'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useDeferredValue, useEffect, useRef, useState } from 'react'

const inputClass =
  'w-full appearance-none rounded-xl border border-outline bg-surface-2 px-3 py-2.5 pr-9 text-base text-foreground outline-none transition [color-scheme:dark] placeholder:text-foreground-faint focus:border-primary focus:bg-surface-3 sm:text-sm'

const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground-muted'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'failed'

type Props = {
  value: BirthplaceSnapshot | null
  onSelect: (place: BirthplaceSnapshot | null) => void
}

export default function BirthplaceCombobox({ value, onSelect }: Props) {
  const locale = useLocale()
  const t = useTranslations('Zwds.form')
  const [catalog, setCatalog] = useState<BirthplaceCatalog | null>(null)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle')
  const [query, setQuery] = useState('')
  const requestIdRef = useRef(0)
  const deferredQuery = useDeferredValue(query)

  function ensureCatalog() {
    if (catalog || loadStatus === 'loading') {
      return
    }

    const requestId = ++requestIdRef.current
    setLoadStatus('loading')

    loadBirthplaceCatalog(locale).then(
      (loadedCatalog) => {
        if (requestId === requestIdRef.current) {
          setCatalog(loadedCatalog)
          setLoadStatus('ready')
        }
      },
      () => {
        if (requestId === requestIdRef.current) {
          setLoadStatus('failed')
        }
      },
    )
  }

  const groups = catalog ? getBirthplaceGroups(catalog, deferredQuery) : []
  const items = groups.flatMap((group) => group.places)
  const groupLabelByFirstPlaceId = new Map<string, string>()

  for (const group of groups) {
    const firstPlace = group.places[0]

    if (firstPlace) {
      groupLabelByFirstPlaceId.set(firstPlace.id, group.label)
    }
  }

  const {
    isOpen,
    highlightedIndex,
    getLabelProps,
    getInputProps,
    getMenuProps,
    getItemProps,
    getToggleButtonProps,
    openMenu,
    setInputValue,
  } = useCombobox<BirthplaceSnapshot>({
    items,
    selectedItem: value,
    itemToString: (place) => place?.name ?? '',
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onSelect(snapshotBirthplace(selectedItem))
      }
    },
    onInputValueChange: ({ inputValue, type }) => {
      if (type === useCombobox.stateChangeTypes.InputChange) {
        setQuery(inputValue ?? '')

        if (value && inputValue !== value.name) {
          onSelect(null)
        }
      }
    },
    onIsOpenChange: ({ isOpen: open }) => {
      if (open) {
        ensureCatalog()
        setQuery('')
        setInputValue('')
      } else {
        setQuery('')
      }
    },
    stateReducer: (_state, { type, changes }) => {
      if (type === useCombobox.stateChangeTypes.InputClick) {
        return { ...changes, isOpen: true }
      }

      return changes
    },
  })

  useEffect(() => {
    if (!isOpen) {
      setInputValue(value?.name ?? '')
    }
  }, [isOpen, setInputValue, value?.id, value?.name])

  useEffect(() => {
    requestIdRef.current += 1
    setCatalog(null)
    setLoadStatus('idle')
    setQuery('')
  }, [locale])

  return (
    <div>
      <label className={labelClass} {...getLabelProps()}>
        {t('cityLabel')}
      </label>

      <div className="relative">
        <input
          className={inputClass}
          {...getInputProps({
            autoComplete: 'off',
            placeholder: t('cityPlaceholder'),
            onFocus: () => {
              ensureCatalog()

              if (!isOpen) {
                openMenu()
              }
            },
          })}
        />

        <button
          aria-label={t('cityLabel')}
          className="absolute right-3 top-[calc(0.75rem+1px)] text-foreground-subtle sm:top-2.5"
          type="button"
          {...getToggleButtonProps({ onClick: ensureCatalog })}
        >
          <svg
            aria-hidden
            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <ul
          aria-busy={loadStatus === 'loading'}
          className={`absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border-2 bg-overlay py-1 shadow-2xl backdrop-blur-xl ${
            isOpen ? '' : 'hidden'
          }`}
          {...getMenuProps()}
        >
          {isOpen && !catalog && loadStatus !== 'failed' && (
            <li className="px-3 py-2 text-center text-sm text-foreground-subtle">{t('cityLoading')}</li>
          )}

          {isOpen && loadStatus === 'failed' && (
            <li className="px-3 py-2 text-center text-sm text-danger">
              <button className="underline" onClick={ensureCatalog} type="button">
                {t('cityLoadError')}
              </button>
            </li>
          )}

          {isOpen && catalog && items.length === 0 && (
            <li className="px-3 py-2 text-center text-sm text-foreground-subtle">{t('cityNoResults')}</li>
          )}

          {isOpen &&
            items.map((place, index) => {
              const isHighlighted = highlightedIndex === index
              const isSelected = place.id === value?.id
              const groupLabel = groupLabelByFirstPlaceId.get(place.id)

              return (
                <Fragment key={place.id}>
                  {groupLabel && (
                    <li className="px-3 pb-1 pt-2 text-[11px] font-semibold text-foreground-faint" role="presentation">
                      {groupLabel}
                    </li>
                  )}
                  <li
                    className={`cursor-pointer px-3 py-2 transition-colors ${
                      isHighlighted ? 'bg-surface-3 text-foreground' : 'text-foreground-muted'
                    } ${isSelected ? 'font-semibold' : ''}`}
                    {...getItemProps({ item: place, index })}
                  >
                    <span className="block text-sm">{place.name}</span>
                    {locale === Locale.EN && (
                      <span className="block truncate text-[11px] font-normal text-foreground-faint">
                        {place.contextName}
                      </span>
                    )}
                  </li>
                </Fragment>
              )
            })}
        </ul>
      </div>
    </div>
  )
}
