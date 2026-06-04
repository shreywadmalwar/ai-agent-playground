// Dark/light theme. We flip a `dark` class on <html> and let Tailwind's
// dark: variants do the rest (see the @custom-variant line in index.css).
// Choice persists in localStorage; dark is the default.

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'playground:theme'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark',
  )

  // Apply the class whenever the theme changes (and on first mount).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggleTheme }
}
