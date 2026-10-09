/**
 * Entry file wiring for a yandex-ui app. Order of CSS imports matters.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider, Toaster, ToasterComponent, ToasterProvider, configure } from '@gravity-ui/uikit'
import { Bell, BellFill, House, HouseFill } from '@gravity-ui/icons'

import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import './theme.css'

import { AppShell, AppThemeProvider, BrandMark, SidebarStateProvider, useAppTheme, type NavItem } from './shell'

configure({ lang: 'ru' }) // or 'en'

const toaster = new Toaster()

const NAV: NavItem[] = [
  { to: '/', label: 'Обзор', icon: House, iconActive: HouseFill },
  { to: '/notifications', label: 'Уведомления', icon: Bell, iconActive: BellFill },
]

function Shell() {
  return (
    <AppShell
      main={NAV}
      brand={<BrandMark name="Acme" />}
      brandCompact={<BrandMark name="Acme" compact />}
      account={{ name: 'Оператор', meta: '+998 90 123-45-67', settingsPath: '/settings', onLogout: () => {} }}
    />
  )
}

function ThemedRoot() {
  const { theme } = useAppTheme()
  return (
    <ThemeProvider theme={theme}>
      <ToasterProvider toaster={toaster}>
        <SidebarStateProvider>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<div>Обзор</div>} />
              <Route path="notifications" element={<div>Уведомления</div>} />
            </Route>
          </Routes>
        </SidebarStateProvider>
        <ToasterComponent />
      </ToasterProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <ThemedRoot />
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
