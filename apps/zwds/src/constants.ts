import { SOBOK_SERVICES } from '@sobok/brand/services'

export const ORIGIN = 'https://zwds.sobok.cc'
export const THEME_COLOR = '#120a10' // keep in sync with --color-background in src/app/globals.css

// Read from the shared catalogue rather than written again here: the same four strings are what every
// sibling site's footer links to this one by.
export const SITE_NAME = SOBOK_SERVICES.zwds.name
