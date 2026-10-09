import { Avatar, Button, DropdownMenu, Icon, Menu, Text } from '@gravity-ui/uikit'
import { ArrowRightFromSquare, ChevronDown, Gear, Moon, Plus, Sun } from '@gravity-ui/icons'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { formatPhone } from '../lib/format'
import { useAppTheme } from './AppTheme'
import { NAV_MAIN, NAV_SOON, type NavItem } from './nav'

function Item({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        ['nav__item', isActive ? 'nav__item_active' : '', item.soon ? 'nav__item_soon' : ''].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className="nav__icon">
            <Icon data={isActive ? item.iconActive : item.icon} size={16} />
          </span>
          <Text variant="body-2" className="nav__label">
            {item.label}
          </Text>
        </>
      )}
    </NavLink>
  )
}

function AccountMenu() {
  const { me, logout } = useAuth()
  const { theme, toggle } = useAppTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const name = me?.full_name?.trim() || 'Оператор'

  return (
    <DropdownMenu
      open={open}
      onOpenToggle={setOpen}
      popupProps={{ placement: 'top-start', offset: 8 }}
      renderSwitcher={(props) => (
        <button {...props} type="button" className="account-button" aria-haspopup="menu" aria-expanded={open}>
          <Avatar text={name} size="m" theme="brand" />
          <span className="account-button__text">
            <Text variant="subheader-1" ellipsis>
              {name}
            </Text>
            <Text variant="caption-2" color="secondary" ellipsis>
              {formatPhone(me?.phone)}
            </Text>
          </span>
          <Icon data={ChevronDown} size={14} />
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

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="shell__aside">
      <div className="aside__head">
        <NavLink to="/" className="wordmark">
          <span className="wordmark__mark" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M5 17h5l3-7 5 12 3-7h6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <Text variant="header-2">Pulso</Text>
        </NavLink>
      </div>

      {/* The single most common action lives where Compose / Upload live in Yandex 360. */}
      <Button view="action" size="xl" width="max" className="aside__cta" onClick={() => navigate('/notifications/new')}>
        <Icon data={Plus} size={16} />
        Создать рассылку
      </Button>

      <nav aria-label="Разделы">
        <div className="nav">
          {NAV_MAIN.map((it) => (
            <Item key={it.to} item={it} />
          ))}
        </div>
        <Text variant="caption-2" className="nav__group" as="div">
          СКОРО
        </Text>
        <div className="nav">
          {NAV_SOON.map((it) => (
            <Item key={it.to} item={it} />
          ))}
        </div>
      </nav>

      <div className="aside__footer">
        <AccountMenu />
      </div>
    </aside>
  )
}
