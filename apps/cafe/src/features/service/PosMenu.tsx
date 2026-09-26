import { useMemo, useState } from 'react'
import menuLayout from '../../../data/shop/pos-menu.json'
import type { DrinkSize } from '../../content/drink-sizes'
import { RECIPES, type RecipeId, recipeIds, recipeSizes } from '../../content/recipes'
import type { ServiceMode } from '../inventory/cups'
import { PosButton } from './PosControls'

export const posCategories = {
  all: '전체',
  favorites: '즐겨찾기',
  espresso: '에스프레소',
  brew: '콜드브루 / 브루드커피',
  blended: '프라푸치노 / 블렌디드',
  tea: '티바나',
  other: '기타 음료',
} as const
type Category = keyof typeof posCategories
const layout: Record<string, { family: string; category: string }> = menuLayout
export const menuFamily = (id: RecipeId) => layout[id]?.family ?? RECIPES[id].recipeId
export function temperatureVariant(id: RecipeId, temperature: 'hot' | 'iced') {
  return recipeIds.find((other) => menuFamily(other) === menuFamily(id) && RECIPES[other].temperature === temperature)
}
export function PosMenu({
  temperature,
  size,
  service,
  disabled,
  onAdd,
}: {
  temperature: 'hot' | 'iced'
  size: DrinkSize
  service: ServiceMode
  disabled: boolean
  onAdd: (recipe: RecipeId, size: DrinkSize, service: ServiceMode) => void
}) {
  const [category, setCategory] = useState<Category>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cafe-pos-favorites') ?? '[]')
      return Array.isArray(stored)
        ? stored.filter((id: unknown): id is string => typeof id === 'string' && !!RECIPES[id])
        : []
    } catch {
      return []
    }
  })
  const menus = useMemo(
    () =>
      recipeIds.filter(
        (id) =>
          RECIPES[id].temperature === temperature &&
          (category === 'all' ||
            (category === 'favorites' ? favorites.includes(id) : layout[id]?.category === category)) &&
          RECIPES[id].name.replace(/\s/g, '').includes(query.replace(/\s/g, '')),
      ),
    [temperature, category, query, favorites],
  )
  const pageCount = Math.max(1, Math.ceil(menus.length / 25))
  const currentPage = Math.min(page, pageCount - 1)
  const shown = menus.slice(currentPage * 25, currentPage * 25 + 25)
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex gap-1">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded bg-white px-3 text-pos-ink">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="메뉴 검색"
            type="search"
            value={query}
            placeholder="메뉴 검색"
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            className="min-h-11 min-w-0 w-full bg-transparent text-sm outline-none"
          />
        </label>
        <PosButton
          aria-pressed={category === 'favorites'}
          onClick={() => {
            setCategory('favorites')
            setPage(0)
          }}
        >
          매장 즐겨찾기
        </PosButton>
        <PosButton
          tone="active"
          onClick={() => {
            setCategory('all')
            setPage(0)
          }}
        >
          음료
        </PosButton>
      </div>
      <fieldset className="grid grid-cols-4 gap-1" aria-label="음료 분류">
        {(Object.entries(posCategories) as Array<[Category, string]>)
          .filter(([id]) => id !== 'favorites')
          .map(([id, label]) => (
            <PosButton
              key={id}
              tone="dark"
              aria-pressed={category === id}
              onClick={() => {
                setCategory(id)
                setPage(0)
              }}
              className="min-h-9 px-1 text-xs"
            >
              {label}
            </PosButton>
          ))}
        <div className="col-span-2 flex items-center justify-end pr-2 text-xs text-white/75">{menus.length}개 메뉴</div>
      </fieldset>
      <fieldset className="grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-1.5" aria-label="상품 목록">
        {shown.map((id) => {
          const menu = RECIPES[id]
          const services = recipeSizes(id, service).length ? service : service === 'dine-in' ? 'takeout' : 'dine-in'
          const sizes = recipeSizes(id, services)
          const chosenSize = sizes.includes(size) ? size : sizes.includes('tall') ? 'tall' : sizes[0]
          return (
            <div key={id} className="relative min-h-0 min-w-0 rounded bg-white text-pos-ink">
              <button
                type="button"
                disabled={disabled || !chosenSize}
                onClick={() => onAdd(id, chosenSize, services)}
                className={[
                  'flex h-full w-full flex-col justify-between gap-1 rounded p-2 text-left text-sm',
                  'leading-snug disabled:opacity-60',
                ].join(' ')}
                aria-label={`${menu.name} ${temperature === 'hot' ? 'HOT' : 'ICED'} 담기`}
              >
                <span className="line-clamp-3 pr-3 font-semibold">{menu.name}</span>
                <span className="ml-auto text-right text-xs tabular-nums">
                  {chosenSize !== size ? (
                    <span className="mr-1 text-pos-panel">{chosenSize === 'single' ? '단일' : chosenSize}</span>
                  ) : null}
                  {chosenSize ? menu.sizes[chosenSize]!.price.toLocaleString('ko-KR') : '—'}
                </span>
              </button>
              <button
                type="button"
                className="absolute top-0 right-0 grid size-6 place-items-center rounded text-xs text-pos-panel"
                aria-label={`${menu.name} 즐겨찾기`}
                aria-pressed={favorites.includes(id)}
                onClick={() => {
                  const next = favorites.includes(id) ? favorites.filter((value) => value !== id) : [...favorites, id]
                  setFavorites(next)
                  try {
                    localStorage.setItem('cafe-pos-favorites', JSON.stringify(next))
                  } catch {
                    /* Favorites remain available for this session. */
                  }
                }}
              >
                {favorites.includes(id) ? '★' : '☆'}
              </button>
            </div>
          )
        })}
        {Array.from({ length: Math.max(0, 25 - shown.length) }, (_, index) => (
          <div key={`empty-${index}`} className="rounded bg-pos-panel/60" />
        ))}
      </fieldset>
      {!menus.length ? (
        <p className="py-1 text-center text-sm text-white" role="status">
          {category === 'favorites' ? '상품의 별을 눌러 즐겨찾기에 추가하세요.' : '해당하는 메뉴가 없습니다.'}
        </p>
      ) : null}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1 text-white">
        <PosButton tone="dark" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
          ← 이전
        </PosButton>
        <span className="self-center px-5 text-sm tabular-nums">
          {currentPage + 1} / {pageCount}
        </span>
        <PosButton tone="dark" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>
          다음 →
        </PosButton>
      </div>
    </div>
  )
}
