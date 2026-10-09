import {
  ArrowRightArrowLeft,
  ArrowUpRightFromSquare,
  Bell,
  CircleDollar,
  Gift,
  House,
  Persons,
  Receipt,
  Smartphone,
  Tag,
} from '@gravity-ui/icons'
import type { IconData } from '@gravity-ui/uikit'

export interface NavItem {
  to: string
  label: string
  icon: IconData
  soon?: boolean
}

/** What works today, most used first. */
export const NAV_MAIN: NavItem[] = [
  { to: '/', label: 'Обзор', icon: House },
  { to: '/notifications', label: 'Уведомления', icon: Bell },
  { to: '/versions', label: 'Версии приложения', icon: Smartphone },
  { to: '/cashback', label: 'Перевод кешбэка', icon: CircleDollar },
]

/** Sections that wait for the backend. Grouped and dimmed so they don't compete for attention. */
export const NAV_SOON: NavItem[] = [
  { to: '/transactions', label: 'Транзакции', icon: Receipt, soon: true },
  { to: '/users', label: 'Пользователи', icon: Persons, soon: true },
  { to: '/promo', label: 'Промо-товары', icon: Tag, soon: true },
  { to: '/upsell', label: 'Апселл', icon: ArrowUpRightFromSquare, soon: true },
  { to: '/switch', label: 'Смена продукта', icon: ArrowRightArrowLeft, soon: true },
  { to: '/promo-5-1', label: 'Акции 5+1', icon: Gift, soon: true },
]
