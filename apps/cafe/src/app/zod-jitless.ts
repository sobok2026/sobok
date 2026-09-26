import { z } from 'zod'

// The page's CSP forbids eval, so Zod's `new Function` probe would only report a CSP violation. Each schema reads
// this flag when it is declared, so this module must evaluate before any module that declares one.
z.config({ jitless: true })
