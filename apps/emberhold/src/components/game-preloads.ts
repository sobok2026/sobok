export const loadArchiveDialog = () => import('./ArchiveDialog')
export const loadCampaignEventDialog = () => import('./CampaignEventDialog')
export const loadCinematicLayers = () => import('./CinematicLayers')
export const loadEndingScreen = () => import('./EndingScreen')
export const loadExpeditionMenu = () => import('./ExpeditionMenu')
export const loadHelpDialogs = () => import('./HelpDialogs')
export const loadProgressionDialogs = () => import('./ProgressionDialogs')
export const loadSettingsDialog = () => import('./SettingsDialog')

export function preloadArchiveDialog() {
  void loadArchiveDialog()
}

export function preloadCampaignEventDialog() {
  void loadCampaignEventDialog()
}

export function preloadCinematicLayers() {
  void loadCinematicLayers()
}

export function preloadEndingScreen() {
  void loadEndingScreen()
}

export function preloadExpeditionMenu() {
  void loadExpeditionMenu()
}

export function preloadHelpDialogs() {
  void loadHelpDialogs()
}

export function preloadProgressionDialogs() {
  void loadProgressionDialogs()
}

export function preloadSettingsDialog() {
  void loadSettingsDialog()
}
