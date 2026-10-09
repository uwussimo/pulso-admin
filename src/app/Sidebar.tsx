import { Avatar, Button, Icon, Text } from '@gravity-ui/uikit'
import { ArrowRightFromSquare, Moon, Sun } from '@gravity-ui/icons'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { formatPhone } from '../lib/format'
import { useAppTheme } from './AppTheme'
import { NAV_MAIN, NAV_OPS, NAV_PROMO, type NavItem } from './nav'

function Item({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        ['nav__item', isActive ? 'nav__item_active' : '', item.soon ? 'nav__item_soon' : ''].filter(Boolean).join(' ')
      }
    >
      <span className="nav__icon">
        <Icon data={item.icon} size={18} />
      </span>
      <Text variant="body-2" className="nav__label">
        {item.label}
      </Text>
      {item.soon ? (
        <Text variant="caption-2" color="hint">
          скоро
        </Text>
      ) : null}
    </NavLink>
  )
}

function Group({ title, items }: { title?: string; items: NavItem[] }) {
  return (
    <>
      {title ? (
        <Text variant="caption-2" className="nav__group" as="div">
          {title.toUpperCase()}
        </Text>
      ) : null}
      {items.map((it) => (
        <Item key={it.to} item={it} />
      ))}
    </>
  )
}

export function Sidebar() {
  const { me, logout } = useAuth()
  const { theme, toggle } = useAppTheme()
  const name = me?.full_name?.trim() || 'Оператор'

  return (
    <aside className="shell__aside">
      <NavLink to="/" className="wordmark">
        <span className="wordmark__mark" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <path
              d="M5 17h5l3-7 5 12 3-7h6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <Text variant="header-1">Pulso</Text>
        <Text variant="body-1" color="hint">
          панель
        </Text>
      </NavLink>

      <nav className="nav" aria-label="Разделы">
        <Group items={NAV_MAIN} />
        <Group title="Партнёрские механики" items={NAV_PROMO} />
        <Group title="Операции" items={NAV_OPS} />
      </nav>

      <div className="aside__footer">
        <div className="aside__user">
          <Avatar text={name} size="m" theme="brand" />
          <div className="aside__user-text">
            <Text variant="subheader-1" ellipsis>
              {name}
            </Text>
            <Text variant="caption-2" color="secondary" ellipsis>
              {formatPhone(me?.phone)}
            </Text>
          </div>
        </div>
        <div className="aside__links">
          <Button view="flat-secondary" size="m" onClick={toggle}>
            <Icon data={theme === 'light' ? Moon : Sun} size={16} />
            {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          </Button>
          <Button view="flat-secondary" size="m" onClick={() => void logout()}>
            <Icon data={ArrowRightFromSquare} size={16} />
            Выйти
          </Button>
        </div>
      </div>
    </aside>
  )
}
