import {
  Bell,
  BellFill,
  CircleArrowRight,
  CircleArrowRightFill,
  CircleArrowUp,
  CircleArrowUpFill,
  CircleCheck,
  CircleCheckFill,
  CirclePlus,
  CirclePlusFill,
  ForwardStep,
  ForwardStepFill,
  House,
  HouseFill,
  Person,
  PersonFill,
  Sparkles,
  SparklesFill,
  Star,
  StarFill,
} from '@gravity-ui/icons'
import type { IconData } from '@gravity-ui/uikit'

export interface NavItem {
  to: string
  label: string
  /** Outline glyph for the resting state. */
  icon: IconData
  /** Solid glyph for the active item. Only icons that ship a Fill twin are used. */
  iconActive: IconData
  soon?: boolean
}

/** What works today, most used first. */
export const NAV_MAIN: NavItem[] = [
  { to: '/', label: 'Обзор', icon: House, iconActive: HouseFill },
  { to: '/notifications', label: 'Уведомления', icon: Bell, iconActive: BellFill },
  { to: '/versions', label: 'Версии приложения', icon: CircleArrowUp, iconActive: CircleArrowUpFill },
  { to: '/cashback', label: 'Перевод кешбэка', icon: CircleArrowRight, iconActive: CircleArrowRightFill },
]

/** Sections that wait for the backend. Grouped and dimmed so they don't compete for attention. */
export const NAV_SOON: NavItem[] = [
  { to: '/transactions', label: 'Транзакции', icon: CircleCheck, iconActive: CircleCheckFill, soon: true },
  { to: '/users', label: 'Пользователи', icon: Person, iconActive: PersonFill, soon: true },
  { to: '/promo', label: 'Промо-товары', icon: Star, iconActive: StarFill, soon: true },
  { to: '/upsell', label: 'Апселл', icon: CirclePlus, iconActive: CirclePlusFill, soon: true },
  { to: '/switch', label: 'Смена продукта', icon: ForwardStep, iconActive: ForwardStepFill, soon: true },
  { to: '/promo-5-1', label: 'Акции 5+1', icon: Sparkles, iconActive: SparklesFill, soon: true },
]
