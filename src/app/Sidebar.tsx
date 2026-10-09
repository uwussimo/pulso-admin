import { Avatar, Button, DropdownMenu, Icon, Menu, Text, Tooltip } from '@gravity-ui/uikit'
import { ArrowRightFromSquare, ChevronDown, ChevronLeft, ChevronRight, Gear, Moon, Plus, Sun } from '@gravity-ui/icons'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { formatPhone } from '../lib/format'
import { useAppTheme } from './AppTheme'
import { NAV_MAIN, NAV_SOON, type NavItem } from './nav'

interface SidebarProps {
  /** Icon-only rail. */
  compact?: boolean
  onToggleCompact?: () => void
  /** Called after any navigation, so a mobile drawer can close itself. */
  onNavigate?: () => void
}

function Item({ item, compact, onNavigate }: { item: NavItem; compact: boolean; onNavigate?: () => void }) {
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
    <Tooltip content={item.soon ? `${item.label} · скоро` : item.label} placement="right" openDelay={200}>
      {link}
    </Tooltip>
  )
}

function AccountMenu({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  const { me, logout } = useAuth()
  const { theme, toggle } = useAppTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const name = me?.full_name?.trim() || 'Оператор'

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
          aria-label={compact ? 'Аккаунт' : undefined}
        >
          <Avatar text={name} size="m" theme="brand" />
          {compact ? null : (
            <>
              <span className="account-button__text">
                <Text variant="subheader-1" ellipsis>
                  {name}
                </Text>
                <Text variant="caption-2" color="secondary" ellipsis>
                  {formatPhone(me?.phone)}
                </Text>
              </span>
              <Icon data={ChevronDown} size={14} />
            </>
          )}
        </button>
      )}
    >
      <div className="account-card">
        <div className="account-card__head">
          <Avatar text={name} size="l" theme="brand" />
          <Text variant="subheader-2">{name}</Text>
          <Text variant="body-1" color="secondary">
            {formatPhone(me?.phone)} · оператор
          </Text>
        </div>
        <div className="account-card__divider" />
        <Menu size="l">
          <Menu.Item
            iconStart={<Icon data={Gear} size={16} />}
            onClick={() => {
              setOpen(false)
              onNavigate?.()
              navigate('/settings')
            }}
          >
            Настройки и пароль
          </Menu.Item>
          <Menu.Item iconStart={<Icon data={theme === 'light' ? Moon : Sun} size={16} />} onClick={toggle}>
            {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          </Menu.Item>
        </Menu>
        <div className="account-card__divider" />
        <Menu size="l">
          <Menu.Item iconStart={<Icon data={ArrowRightFromSquare} size={16} />} onClick={() => void logout()}>
            Выйти
          </Menu.Item>
        </Menu>
      </div>
    </DropdownMenu>
  )
}

export function Sidebar({ compact = false, onToggleCompact, onNavigate }: SidebarProps) {
  const navigate = useNavigate()

  const cta = (
    <Button
      view="action"
      size="xl"
      width={compact ? undefined : 'max'}
      className="aside__cta"
      aria-label={compact ? 'Создать рассылку' : undefined}
      onClick={() => {
        onNavigate?.()
        navigate('/notifications/new')
      }}
    >
      <Icon data={Plus} size={18} />
      {compact ? null : 'Создать рассылку'}
    </Button>
  )

  return (
    <div className={['aside', compact ? 'aside_compact' : ''].join(' ')}>
      <div className="aside__head">
        <NavLink to="/" className="wordmark" onClick={onNavigate} aria-label="Pulso, на обзор">
          <span className="wordmark__mark" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M5 17h5l3-7 5 12 3-7h6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {compact ? null : <Text variant="header-2">Pulso</Text>}
        </NavLink>
      </div>

      {compact ? (
        <Tooltip content="Создать рассылку" placement="right" openDelay={200}>
          {cta}
        </Tooltip>
      ) : (
        cta
      )}

      <nav aria-label="Разделы">
        <div className="nav">
          {NAV_MAIN.map((it) => (
            <Item key={it.to} item={it} compact={compact} onNavigate={onNavigate} />
          ))}
        </div>
        {compact ? (
          <div className="nav__divider" />
        ) : (
          <Text variant="caption-2" className="nav__group" as="div">
            СКОРО
          </Text>
        )}
        <div className="nav">
          {NAV_SOON.map((it) => (
            <Item key={it.to} item={it} compact={compact} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="aside__footer">
        <AccountMenu compact={compact} onNavigate={onNavigate} />
        {onToggleCompact ? (
          <Tooltip content={compact ? 'Развернуть меню' : 'Свернуть меню'} placement="right" openDelay={300}>
            <Button view="flat-secondary" size="m" className="aside__collapse" onClick={onToggleCompact} aria-label={compact ? 'Развернуть меню' : 'Свернуть меню'}>
              <Icon data={compact ? ChevronRight : ChevronLeft} size={16} />
              {compact ? null : 'Свернуть'}
            </Button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}
