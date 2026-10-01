export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'blog-theme'
const THEME_CHANGE_EVENT = 'blog-theme-change'

// Runs in the document head, before content can paint. Never follow OS settings.
export const themeInitScript = `(()=>{let theme='dark';try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light')theme='light'}catch{}document.documentElement.classList.toggle('dark',theme==='dark')})()`

export function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function getServerTheme(): Theme {
  return 'dark'
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The toggle still works when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

export function subscribeToTheme(onChange: () => void) {
  function syncStoredTheme(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
    try {
      if (event.storageArea !== localStorage) return
      document.documentElement.classList.toggle(
        'dark',
        localStorage.getItem(THEME_STORAGE_KEY) !== 'light'
      )
      onChange()
    } catch {
      // Keep the current theme if storage becomes inaccessible.
    }
  }

  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  window.addEventListener('storage', syncStoredTheme)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', syncStoredTheme)
  }
}
