import type { AccountsBindings } from '@sobok/accounts/database-service'
import type { CivilBindings } from '@sobok/civil/database-service'
import type { StellaBindings } from '@sobok/stella/database-service'
import type { VibeBindings } from '@sobok/vibe/database-service'

/** The Database Worker is the only runtime principal with database, queue, and backend-secret capabilities. */
export type Bindings = AccountsBindings & CivilBindings & StellaBindings & VibeBindings
