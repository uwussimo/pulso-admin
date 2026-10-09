import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type AppTheme = 'light' | 'dark'

const STORAGE_KEY = 'pulso-admin.theme'

interface AppThemeValue {
  theme: AppTheme
  toggle: () => void
}

const Ctx = createContext<AppThemeValue>({ theme: 'light', toggle: () => {} })

function readStored(): AppTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(readStored)
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: AppTheme = t === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* storage may be unavailable; the toggle still works for the session */
      }
      return next
    })
  }, [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppTheme() {
  return useContext(Ctx)
}
