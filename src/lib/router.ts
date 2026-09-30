import { useSyncExternalStore } from 'react'

// Hash routing: no server config needed, works from file-like origins (Capacitor),
// and the Android back button steps through screens for free.
function read(): string {
  return window.location.hash.replace(/^#\/?/, '')
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): string[] {
  return useSyncExternalStore(subscribe, read).split('/').filter(Boolean)
}

export function go(path: string) {
  window.location.hash = `/${path}`
}

/** Swap the current screen without adding a back-button step. */
export function replace(path: string) {
  window.history.replaceState(null, '', `#/${path}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function back(fallback = '') {
  if (window.history.length > 1) window.history.back()
  else go(fallback)
}
