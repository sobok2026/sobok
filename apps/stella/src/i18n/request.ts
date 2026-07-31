import { createRequestConfig } from '@sobok/site-i18n/request'

import { getMessages } from './messages'

// The module `next-intl/plugin` is pointed at (see next.config.ts). Resolution is shared; the catalogue
// it resolves into is this app's.
export default createRequestConfig(getMessages)
