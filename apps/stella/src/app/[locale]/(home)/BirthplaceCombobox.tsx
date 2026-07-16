'use client'

import { useCombobox } from 'downshift'
import { useTranslations } from 'next-intl'
import { Fragment, useEffect, useMemo, useState } from 'react'

import { useCityCatalog } from '@/components/CityCatalogProvider'
import { type City, findCity } from '@/lib/cities'
import { getCityGroups } from '@/lib/city-search'

const inputClass =
  'w-full appearance-none rounded-xl border border-border-2 bg-surface-2 px-3 py-2.5 pr-9 text-base text-foreground outline-none transition [color-scheme:dark] placeholder:text-foreground-faint focus:border-white/60 focus:bg-surface-3 sm:text-sm'

const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground-muted'

type Props = {
  cityKey: string
  onSelect: (cityKey: string) => void
}

export default function CityCombobox({ cityKey, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const catalog = useCityCatalog()
  const t = useTranslations('Constellation.form')

  const selectedCity = findCity(catalog, cityKey)
  const groups = useMemo(() => getCityGroups(catalog.groups, query), [catalog.groups, query])
  const items = useMemo(() => groups.flatMap((group) => group.cities), [groups])

  const groupLabelByFirstCityKey = useMemo(() => {
    const labels = new Map<string, string>()

    for (const group of groups) {
      const firstCity = group.cities[0]

      if (firstCity) {
        labels.set(firstCity.key, group.label)
      }
    }

    return labels
  }, [groups])

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
  } = useCombobox<City>({
    items,
    selectedItem: selectedCity,
    itemToString: (city) => city?.name ?? '',
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onSelect(selectedItem.key)
      }
    },
    onInputValueChange: ({ inputValue, type }) => {
      // Only real keystrokes drive the filter — ignore programmatic reverts and selection.
      if (type === useCombobox.stateChangeTypes.InputChange) {
        setQuery(inputValue ?? '')
      }
    },
    onIsOpenChange: ({ isOpen: open }) => {
      // Reset the filter on close so the next open shows this locale's initial cities.
      if (!open) {
        setQuery('')
      }
    },
    stateReducer: (_state, { type, changes }) => {
      // A click fires right after focus (which already opened the menu via onFocus).
      // Downshift's default toggles the menu on click, so it would immediately close
      // what focus just opened — a one-frame flash. Force clicks to keep it open;
      // the chevron toggle button and blur/Escape still close it.
      if (type === useCombobox.stateChangeTypes.InputClick) {
        return { ...changes, isOpen: true }
      }

      return changes
    },
  })

  // Downshift seeds the input from `selectedItem` only once; when the parent
  // prefills a saved city after mount, mirror it into the closed input.
  useEffect(() => {
    if (!isOpen) {
      setInputValue(selectedCity.name)
    }
  }, [cityKey, isOpen, selectedCity.name, setInputValue])

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
              setQuery('')
              setInputValue('')

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
          {...getToggleButtonProps()}
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
          className={`absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border-2 bg-overlay py-1 shadow-2xl backdrop-blur-xl ${
            isOpen ? '' : 'hidden'
          }`}
          {...getMenuProps()}
        >
          {isOpen && items.length === 0 && (
            <li className="px-3 py-2 text-center text-sm text-foreground-subtle">{t('cityNoResults')}</li>
          )}

          {isOpen &&
            items.map((city, index) => {
              const isHighlighted = highlightedIndex === index
              const isSelected = city.key === cityKey
              const groupLabel = groupLabelByFirstCityKey.get(city.key)

              return (
                <Fragment key={city.key}>
                  {groupLabel && (
                    <li className="px-3 pb-1 pt-2 text-[11px] font-semibold text-foreground-faint" role="presentation">
                      {groupLabel}
                    </li>
                  )}
                  <li
                    className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                      isHighlighted ? 'bg-surface-3 text-foreground' : 'text-foreground-muted'
                    } ${isSelected ? 'font-semibold' : ''}`}
                    {...getItemProps({ item: city, index })}
                  >
                    {city.name}
                  </li>
                </Fragment>
              )
            })}
        </ul>
      </div>
    </div>
  )
}
