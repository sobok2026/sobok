const DEFERRED_MODULE_LOAD_TIMEOUT_MS = 15_000

class DeferredModuleLoadError extends Error {
  constructor() {
    super('Emberhold deferred module load timed out.')
    this.name = 'DeferredModuleLoadError'
  }
}

function loadDeferredModule<T>(load: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => reject(new DeferredModuleLoadError()), DEFERRED_MODULE_LOAD_TIMEOUT_MS)
    load().then(
      (module) => {
        globalThis.clearTimeout(timeout)
        resolve(module)
      },
      (error: unknown) => {
        globalThis.clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

function createDeferredModuleLoader<T>(load: () => Promise<T>) {
  let pending: Promise<T> | null = null
  return () => {
    if (pending) return pending
    const request = loadDeferredModule(load)
    pending = request
    void request.catch(() => {
      if (pending === request) pending = null
    })
    return request
  }
}

function preloadDeferredModule(load: () => Promise<unknown>) {
  void load().catch(() => undefined)
}

export const loadArchiveDialog = createDeferredModuleLoader(() => import('./ArchiveDialog'))
export const loadCampaignComponents = createDeferredModuleLoader(() => import('./CampaignComponents'))
export const loadCampaignEventDialog = createDeferredModuleLoader(() => import('./CampaignEventDialog'))
export const loadCinematicLayers = createDeferredModuleLoader(() => import('./CinematicLayers'))
export const loadEndingScreen = createDeferredModuleLoader(() => import('./EndingScreen'))
export const loadExpeditionMenu = createDeferredModuleLoader(() => import('./ExpeditionMenu'))
export const loadHelpDialogs = createDeferredModuleLoader(() => import('./HelpDialogs'))
export const loadProgressionDialogs = createDeferredModuleLoader(() => import('./ProgressionDialogs'))
export const loadSettingsDialog = createDeferredModuleLoader(() => import('./SettingsDialog'))

export function preloadArchiveDialog() {
  preloadDeferredModule(loadArchiveDialog)
}

export function preloadCampaignComponents() {
  preloadDeferredModule(loadCampaignComponents)
}

export function preloadCampaignEventDialog() {
  preloadDeferredModule(loadCampaignEventDialog)
}

export function preloadCinematicLayers() {
  preloadDeferredModule(loadCinematicLayers)
}

export function preloadEndingScreen() {
  preloadDeferredModule(loadEndingScreen)
}

export function preloadExpeditionMenu() {
  preloadDeferredModule(loadExpeditionMenu)
}

export function preloadHelpDialogs() {
  preloadDeferredModule(loadHelpDialogs)
}

export function preloadProgressionDialogs() {
  preloadDeferredModule(loadProgressionDialogs)
}

export function preloadSettingsDialog() {
  preloadDeferredModule(loadSettingsDialog)
}
