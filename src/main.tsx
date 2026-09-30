import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'
import { syncLibrary } from './lib/db'

registerSW({ immediate: true })
void syncLibrary()
// Ask the browser not to clear our data when the phone runs low on space.
void navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
