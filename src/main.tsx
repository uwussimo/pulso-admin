import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, Toaster, ToasterComponent, ToasterProvider, configure } from '@gravity-ui/uikit'

import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import './theme.css'

import { App } from './app/App'
import { AuthProvider } from './auth/AuthContext'
import { AppThemeProvider, useAppTheme } from './app/AppTheme'
import { SidebarStateProvider } from './app/SidebarState'
import { PublicRoot } from './public/PublicRoot'

configure({ lang: 'ru' })

const toaster = new Toaster()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
})

function ThemedRoot() {
  const { theme } = useAppTheme()
  return (
    <ThemeProvider theme={theme}>
      <ToasterProvider toaster={toaster}>
        <AuthProvider>
          <SidebarStateProvider>
            <App />
          </SidebarStateProvider>
        </AuthProvider>
        <ToasterComponent />
      </ToasterProvider>
    </ThemeProvider>
  )
}

// /s/:id is the respondent page the mobile app opens in a WebView: it must never touch the admin session.
const isPublic = window.location.pathname.startsWith('/s/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isPublic ? (
        <PublicRoot />
      ) : (
        <BrowserRouter>
          <AppThemeProvider>
            <ThemedRoot />
          </AppThemeProvider>
        </BrowserRouter>
      )}
    </QueryClientProvider>
  </StrictMode>,
)
