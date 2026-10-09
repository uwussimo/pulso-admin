import { Avatar, Button, Drawer, Icon, Text } from '@gravity-ui/uikit'
import { Bars } from '@gravity-ui/icons'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Sidebar } from './Sidebar'
import { useSidebarState } from './SidebarState'
import { MOBILE_QUERY, useMediaQuery } from './useMediaQuery'

function MobileTopBar() {
  const { me } = useAuth()
  const { setMobileOpen } = useSidebarState()
  const name = me?.full_name?.trim() || 'Оператор'
  return (
    <header className="topbar">
      <Button view="flat" size="l" onClick={() => setMobileOpen(true)} aria-label="Открыть меню">
        <Icon data={Bars} size={20} />
      </Button>
      <Link to="/" className="wordmark" aria-label="Pulso, на обзор">
        <span className="wordmark__mark" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M5 17h5l3-7 5 12 3-7h6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <Text variant="subheader-3">Pulso</Text>
      </Link>
      <button type="button" className="topbar__avatar" onClick={() => setMobileOpen(true)} aria-label="Аккаунт и меню">
        <Avatar text={name} size="s" theme="brand" />
      </button>
    </header>
  )
}

export function AppShell() {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const { compact, toggleCompact, mobileOpen, setMobileOpen } = useSidebarState()

  if (isMobile) {
    return (
      <div className="shell shell_mobile">
        <MobileTopBar />
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen} placement="left" size={296} aria-label="Меню">
          <aside className="shell__aside shell__aside_drawer">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </Drawer>
        <main className="shell__main">
          <div className="sheet">
            <div className="sheet__content">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className={['shell__aside', compact ? 'shell__aside_compact' : ''].join(' ')}>
        <Sidebar compact={compact} onToggleCompact={toggleCompact} />
      </aside>
      <main className="shell__main">
        <div className="sheet">
          <div className="sheet__content">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
