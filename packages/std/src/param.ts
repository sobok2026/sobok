// An `as const` object and not a tuple: `'img'` is an abbreviation the member name explains. See
// `@sobok/domain/censorship/model` for why this is not an enum.
export const VIEW = {
  IMAGE: 'img',
  CARD: 'card',
} as const

export type View = (typeof VIEW)[keyof typeof VIEW]

export const VIEW_PARAM = 'view'

type SearchParamsLike = Pick<URLSearchParams, 'get'>

export function appendViewToPath(pathname: string, view: View) {
  return view === VIEW.IMAGE ? `${pathname}?${VIEW_PARAM}=${VIEW.IMAGE}` : pathname
}

export function convertCamelCaseToKebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function getUsernameFromParam(username: string) {
  return decodeURIComponent(username).slice(1)
}

export function getViewFromSearchParams(searchParams: SearchParamsLike) {
  return searchParams.get(VIEW_PARAM) === VIEW.IMAGE ? VIEW.IMAGE : VIEW.CARD
}

export function setViewToSearchParams(searchParams: URLSearchParams, view: View) {
  if (view === VIEW.IMAGE) {
    searchParams.set(VIEW_PARAM, VIEW.IMAGE)
    return searchParams
  }

  searchParams.delete(VIEW_PARAM)
  return searchParams
}
