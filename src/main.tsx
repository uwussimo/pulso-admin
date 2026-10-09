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
          <App />
        </AuthProvider>
        <ToasterComponent />
      </ToasterProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppThemeProvider>
          <ThemedRoot />
        </AppThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
