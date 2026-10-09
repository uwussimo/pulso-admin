/**
 * yandex-ui app shell for Gravity UI.
 *
 * One file so it can be dropped into any project and split later:
 *   - AppThemeProvider / useAppTheme      light|dark, persisted
 *   - SidebarStateProvider / useSidebarState  compact rail + mobile drawer
 *   - useMediaQuery / MOBILE_QUERY
 *   - NavItem, Sidebar, AppShell
 *
 * Requires react-router-dom (NavLink, Outlet) and the classes from theme.css.
 * Replace BrandMark, the nav lists and the `account` props with your own.
 */
import { Avatar, Button, Drawer, DropdownMenu, Icon, Menu, Text, Tooltip, type IconData } from '@gravity-ui/uikit'
import { ArrowRightFromSquare, Bars, ChevronDown, Gear, LayoutSideContentLeft, Moon, Sun } from '@gravity-ui/icons'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

/* ------------------------------------------------------------------ theme */

export type AppTheme = 'light' | 'dark'
const THEME_KEY = 'app.theme'

const ThemeCtx = createContext<{ theme: AppTheme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: AppTheme = t === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* preference just won't persist */
      }
      return next
    })
  }, [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useAppTheme() {
  return useContext(ThemeCtx)
}

/* ---------------------------------------------------------- sidebar state */

const SIDEBAR_KEY = 'app.sidebar'

interface SidebarState {
  compact: boolean
  toggleCompact: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const SidebarCtx = createContext<SidebarState>({
  compact: false,
  toggleCompact: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
})

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'compact'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleCompact = useCallback(() => {
    setCompact((c) => {
      const next = !c
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'compact' : 'full')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])
  const value = useMemo(
    () => ({ compact, toggleCompact, mobileOpen, setMobileOpen }),
    [compact, toggleCompact, mobileOpen],
  )
  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>
}

export function useSidebarState() {
  return useContext(SidebarCtx)
}

/* ------------------------------------------------------------ media query */

/** Phones and small tablets: the sidebar becomes a top bar with a slide-out menu. */
export const MOBILE_QUERY = '(max-width: 900px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/* ------------------------------------------------------------------- nav */

export interface NavItem {
  to: string
  label: string
  /** Outline glyph for the resting state. */
  icon: IconData
  /** Solid glyph for the active item: Gravity's `…Fill` twin, or a hand-drawn one (see icons.md). */
  iconActive: IconData
  /** Dimmed; the page explains what is coming instead of showing fake data. */
  soon?: boolean
}

export interface AccountInfo {
  name: string
  /** Second line under the name: phone, e-mail or role. */
  meta?: string
  onSettings?: () => void
  onLogout: () => void
  /** Route of the settings page, if `onSettings` is not given. */
  settingsPath?: string
}

export interface SidebarProps {
  main: NavItem[]
  /** Optional dimmed group rendered under a group label. */
  soon?: NavItem[]
  soonLabel?: string
  account: AccountInfo
  brand: ReactNode
  brandCompact?: ReactNode
  compact?: boolean
  onToggleCompact?: () => void
  /** Called after any navigation so a mobile drawer can close itself. */
  onNavigate?: () => void
  labels?: Partial<typeof DEFAULT_LABELS>
}

const DEFAULT_LABELS = {
  collapse: 'Свернуть меню',
  expand: 'Развернуть меню',
  sections: 'Разделы',
  account: 'Аккаунт',
  settings: 'Настройки',
  dark: 'Тёмная тема',
  light: 'Светлая тема',
  logout: 'Выйти',
  soon: 'скоро',
  menu: 'Открыть меню',
  home: 'На главную',
}

/** Placeholder 32px mark. Replace with your logo; keep `.wordmark__mark` so it stays ink-on-paper in both themes. */
export function BrandMark({ name = 'App', compact = false }: { name?: string; compact?: boolean }) {
  return (
    <span className="wordmark">
      <span className="wordmark__mark" aria-hidden>
        <Text variant="subheader-2">{name.slice(0, 1).toUpperCase()}</Text>
      </span>
      {compact ? null : <Text variant="header-2">{name}</Text>}
    </span>
  )
}

function Item({
  item,
  compact,
  soonLabel,
  onNavigate,
}: {
  item: NavItem
  compact: boolean
  soonLabel: string
  onNavigate?: () => void
}) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      aria-label={compact ? item.label : undefined}
      className={({ isActive }) =>
        ['nav__item', isActive ? 'nav__item_active' : '', item.soon ? 'nav__item_soon' : ''].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className="nav__icon">
            <Icon data={isActive ? item.iconActive : item.icon} size={20} />
          </span>
          {compact ? null : (
            <Text variant="body-2" className="nav__label">
              {item.label}
            </Text>
          )}
        </>
      )}
    </NavLink>
  )
  if (!compact) return link
  return (
    <Tooltip content={item.soon ? `${item.label} · ${soonLabel}` : item.label} placement="right" openDelay={200}>
      {link}
    </Tooltip>
  )
}

function AccountMenu({
  account,
  compact,
  labels,
  onNavigate,
}: {
  account: AccountInfo
  compact: boolean
  labels: typeof DEFAULT_LABELS
  onNavigate?: () => void
}) {
  const { theme, toggle } = useAppTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const showSettings = Boolean(account.onSettings || account.settingsPath)

  return (
    <DropdownMenu
      open={open}
      onOpenToggle={setOpen}
      popupProps={{ placement: compact ? 'right-end' : 'top-start', offset: 8 }}
      renderSwitcher={(props) => (
        <button
          {...props}
          type="button"
          className={['account-button', compact ? 'account-button_compact' : ''].join(' ')}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={compact ? labels.account : undefined}
        >
          <Avatar text={account.name} size="m" theme="brand" />
          {compact ? null : (
            <>
              <span className="account-button__text">
                <Text variant="subheader-1" ellipsis>
                  {account.name}
                </Text>
                {account.meta ? (
                  <Text variant="caption-2" color="secondary" ellipsis>
                    {account.meta}
                  </Text>
                ) : null}
              </span>
              <Icon data={ChevronDown} size={14} />
            </>
          )}
        </button>
      )}
    >
      <div className="account-card">
        <div className="account-card__head">
          <Avatar text={account.name} size="l" theme="brand" />
          <Text variant="subheader-2">{account.name}</Text>
          {account.meta ? (
            <Text variant="body-1" color="secondary">
              {account.meta}
            </Text>
          ) : null}
        </div>
        <div className="account-card__divider" />
        <Menu size="l">
          {showSettings ? (
            <Menu.Item
              iconStart={<Icon data={Gear} size={16} />}
              onClick={() => {
                setOpen(false)
                onNavigate?.()
                if (account.onSettings) account.onSettings()
                else if (account.settingsPath) navigate(account.settingsPath)
              }}
            >
              {labels.settings}
            </Menu.Item>
          ) : null}
          <Menu.Item iconStart={<Icon data={theme === 'light' ? Moon : Sun} size={16} />} onClick={toggle}>
            {theme === 'light' ? labels.dark : labels.light}
          </Menu.Item>
        </Menu>
        <div className="account-card__divider" />
        <Menu size="l">
          <Menu.Item iconStart={<Icon data={ArrowRightFromSquare} size={16} />} onClick={account.onLogout}>
            {labels.logout}
          </Menu.Item>
        </Menu>
      </div>
    </DropdownMenu>
  )
}

export function Sidebar({
  main,
  soon = [],
  soonLabel = 'СКОРО',
  account,
  brand,
  brandCompact,
  compact = false,
  onToggleCompact,
  onNavigate,
  labels: labelOverrides,
}: SidebarProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const toggle = onToggleCompact ? (
    <Tooltip content={compact ? labels.expand : labels.collapse} placement="right" openDelay={300}>
      <Button
        view="flat-secondary"
        size="l"
        className="aside__toggle"
        onClick={onToggleCompact}
        aria-label={compact ? labels.expand : labels.collapse}
        aria-pressed={compact}
      >
        <Icon data={LayoutSideContentLeft} size={18} />
      </Button>
    </Tooltip>
  ) : null

  return (
    <div className={['aside', compact ? 'aside_compact' : ''].join(' ')}>
      <div className="aside__head">
        <NavLink to="/" className="wordmark" onClick={onNavigate} aria-label={labels.home}>
          {compact ? (brandCompact ?? brand) : brand}
        </NavLink>
        {toggle}
      </div>

      <nav aria-label={labels.sections}>
        <div className="nav">
          {main.map((it) => (
            <Item key={it.to} item={it} compact={compact} soonLabel={labels.soon} onNavigate={onNavigate} />
          ))}
        </div>
        {soon.length > 0 ? (
          <>
            {compact ? (
              <div className="nav__divider" />
            ) : (
              <Text variant="caption-2" className="nav__group" as="div">
                {soonLabel}
              </Text>
            )}
            <div className="nav">
              {soon.map((it) => (
                <Item key={it.to} item={it} compact={compact} soonLabel={labels.soon} onNavigate={onNavigate} />
              ))}
            </div>
          </>
        ) : null}
      </nav>

      <div className="aside__footer">
        <AccountMenu account={account} compact={compact} labels={labels} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- shell */

export interface AppShellProps extends Omit<SidebarProps, 'compact' | 'onToggleCompact' | 'onNavigate'> {
  /** Defaults to react-router's <Outlet />. */
  children?: ReactNode
}

function MobileTopBar({
  brand,
  account,
  labels,
}: {
  brand: ReactNode
  account: AccountInfo
  labels: typeof DEFAULT_LABELS
}) {
  const { setMobileOpen } = useSidebarState()
  return (
    <header className="topbar">
      <Button view="flat" size="l" onClick={() => setMobileOpen(true)} aria-label={labels.menu}>
        <Icon data={Bars} size={20} />
      </Button>
      <Link to="/" className="wordmark" aria-label={labels.home}>
        {brand}
      </Link>
      <button type="button" className="topbar__avatar" onClick={() => setMobileOpen(true)} aria-label={labels.account}>
        <Avatar text={account.name} size="s" theme="brand" />
      </button>
    </header>
  )
}

export function AppShell({ children, ...sidebar }: AppShellProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const { compact, toggleCompact, mobileOpen, setMobileOpen } = useSidebarState()
  const labels = { ...DEFAULT_LABELS, ...sidebar.labels }
  const content = (
    <main className="shell__main">
      <div className="sheet">
        <div className="sheet__content">{children ?? <Outlet />}</div>
      </div>
    </main>
  )

  if (isMobile) {
    return (
      <div className="shell shell_mobile">
        <MobileTopBar brand={sidebar.brand} account={sidebar.account} labels={labels} />
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen} placement="left" size={296} aria-label={labels.menu}>
          <aside className="shell__aside shell__aside_drawer">
            <Sidebar {...sidebar} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </Drawer>
        {content}
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className={['shell__aside', compact ? 'shell__aside_compact' : ''].join(' ')}>
        <Sidebar {...sidebar} compact={compact} onToggleCompact={toggleCompact} />
      </aside>
      {content}
    </div>
  )
}
