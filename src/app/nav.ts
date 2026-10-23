import {
  Bell,
  BellFill,
  CircleArrowUp,
  CircleArrowUpFill,
  CircleDollar,
  CirclePlus,
  CirclePlusFill,
  ForwardStep,
  ForwardStepFill,
  House,
  HouseFill,
  ListCheck,
  Person,
  PersonFill,
  Receipt,
  Sparkles,
  SparklesFill,
  Star,
  StarFill,
} from '@gravity-ui/icons'
import type { IconData } from '@gravity-ui/uikit'
import { CircleDollarFill, ListCheckFill, ReceiptFill } from './icons'

export interface NavItem {
  to: string
  label: string
  /** Outline glyph for the resting state. */
  icon: IconData
  /** Solid glyph for the active item: Gravity's Fill twin, or a hand-drawn one from ./icons. */
  iconActive: IconData
  soon?: boolean
}

/** What works today, most used first. */
export const NAV_MAIN: NavItem[] = [
  { to: '/', label: 'Обзор', icon: House, iconActive: HouseFill },
  { to: '/receipts', label: 'Чеки', icon: Receipt, iconActive: ReceiptFill },
  { to: '/transactions', label: 'Транзакции', icon: CircleDollar, iconActive: CircleDollarFill },
  { to: '/notifications', label: 'Уведомления', icon: Bell, iconActive: BellFill },
  { to: '/surveys', label: 'Опросы', icon: ListCheck, iconActive: ListCheckFill },
  { to: '/users', label: 'Пользователи', icon: Person, iconActive: PersonFill },
  { to: '/versions', label: 'Версии приложения', icon: CircleArrowUp, iconActive: CircleArrowUpFill },
  { to: '/cashback', label: 'Перевод кешбэка', icon: CircleDollar, iconActive: CircleDollarFill },
  { to: '/promo', label: 'Промо-товары', icon: Star, iconActive: StarFill },
  { to: '/extra-benefit', label: 'Экстра-выгода', icon: Sparkles, iconActive: SparklesFill },
]

/** Sections that wait for the backend. Grouped and dimmed so they don't compete for attention. */
export const NAV_SOON: NavItem[] = [
  { to: '/upsell', label: 'Апселл', icon: CirclePlus, iconActive: CirclePlusFill, soon: true },
  { to: '/switch', label: 'Смена продукта', icon: ForwardStep, iconActive: ForwardStepFill, soon: true },
]
