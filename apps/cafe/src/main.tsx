import './app/zod-jitless'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './app/App'

// A deploy removes the previous build's chunks, so a tab opened before it can no longer load the lazy ones.
// Reloading picks up the new build; the timestamp stops a chunk that the new build lacks too from looping.
window.addEventListener('vite:preloadError', () => {
  const lastReload = Number(sessionStorage.getItem('cafe-chunk-reload'))
  if (Date.now() - lastReload < 10_000) {
    return
  }
  sessionStorage.setItem('cafe-chunk-reload', String(Date.now()))
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
