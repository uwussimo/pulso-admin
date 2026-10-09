import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { loadSession, onSessionExpired, saveSession } from '../api/client'
import type { MeResponse } from '../api/types'

type Status = 'loading' | 'anonymous' | 'authenticated'

interface AuthValue {
  status: Status
  me: MeResponse | null
  /** Set when the session was dropped by the server, so the login page can explain why. */
  expiredNotice: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(() => (loadSession() ? 'loading' : 'anonymous'))
  const [me, setMe] = useState<MeResponse | null>(null)
  const [expiredNotice, setExpiredNotice] = useState(false)
  const queryClient = useQueryClient()

  const refreshMe = useCallback(async () => {
    const info = await authApi.me()
    setMe(info)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    let cancelled = false
    if (loadSession()) {
      authApi
        .me()
        .then((info) => {
          if (cancelled) return
          setMe(info)
          setStatus('authenticated')
        })
        .catch(() => {
          if (cancelled) return
          saveSession(null)
          setMe(null)
          setStatus('anonymous')
        })
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(
    () =>
      onSessionExpired(() => {
        setMe(null)
        setStatus('anonymous')
        setExpiredNotice(true)
        queryClient.clear()
      }),
    [queryClient],
  )

  const login = useCallback(
    async (phone: string, password: string) => {
      const session = await authApi.login({ phone, password })
      saveSession(session)
      setExpiredNotice(false)
      await refreshMe()
    },
    [refreshMe],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* the session is dropped locally regardless */
    }
    saveSession(null)
    setMe(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthValue>(
    () => ({ status, me, expiredNotice, login, logout, refreshMe }),
    [status, me, expiredNotice, login, logout, refreshMe],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
