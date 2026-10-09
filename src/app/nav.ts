import {
  ArrowRightArrowLeft,
  ArrowUpRightFromSquare,
  Bell,
  CircleDollar,
  Gear,
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

export const NAV_MAIN: NavItem[] = [
  { to: '/', label: 'Обзор', icon: House },
  { to: '/transactions', label: 'Транзакции', icon: Receipt, soon: true },
  { to: '/users', label: 'Пользователи', icon: Persons, soon: true },
  { to: '/notifications', label: 'Уведомления', icon: Bell },
]

export const NAV_PROMO: NavItem[] = [
  { to: '/promo', label: 'Промо-товары', icon: Tag, soon: true },
  { to: '/upsell', label: 'Апселл', icon: ArrowUpRightFromSquare, soon: true },
  { to: '/switch', label: 'Смена продукта', icon: ArrowRightArrowLeft, soon: true },
  { to: '/promo-5-1', label: 'Акции 5+1', icon: Gift, soon: true },
]

export const NAV_OPS: NavItem[] = [
  { to: '/versions', label: 'Версии приложения', icon: Smartphone },
  { to: '/cashback', label: 'Перевод кешбэка', icon: CircleDollar },
  { to: '/settings', label: 'Настройки', icon: Gear },
]
