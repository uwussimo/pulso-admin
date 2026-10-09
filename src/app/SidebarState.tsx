import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'pulso-admin.sidebar'

interface SidebarState {
  /** Icon-only rail on desktop. Remembered between sessions. */
  compact: boolean
  toggleCompact: () => void
  /** Slide-out menu on mobile. */
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const Ctx = createContext<SidebarState>({
  compact: false,
  toggleCompact: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
})

function readCompact(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'compact'
  } catch {
    return false
  }
}

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(readCompact)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleCompact = useCallback(() => {
    setCompact((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'compact' : 'full')
      } catch {
        /* preference just won't persist */
      }
      return next
    })
  }, [])
  const value = useMemo(
    () => ({ compact, toggleCompact, mobileOpen, setMobileOpen }),
    [compact, toggleCompact, mobileOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSidebarState() {
  return useContext(Ctx)
}
