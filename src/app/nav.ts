import {
  Bell,
  BellFill,
  CircleArrowRight,
  CircleArrowRightFill,
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

export interface NavGroup {
  /** Caption above the group; omitted for the top-level items. */
  label?: string
  items: NavItem[]
}

/**
 * Working sections, chunked by what the operator is doing so nine rows read
 * as three short lists instead of one long one. Overview stays on top, alone.
 */
export const NAV_GROUPS: NavGroup[] = [
  { items: [{ to: '/', label: 'Обзор', icon: House, iconActive: HouseFill }] },
  {
    label: 'Деньги',
    items: [
      { to: '/receipts', label: 'Чеки', icon: Receipt, iconActive: ReceiptFill },
      { to: '/transactions', label: 'Транзакции', icon: CircleDollar, iconActive: CircleDollarFill },
      // Not another coin: this is the action that pushes pending cashback forward.
      { to: '/cashback', label: 'Перевод кешбэка', icon: CircleArrowRight, iconActive: CircleArrowRightFill },
    ],
  },
  {
    label: 'Общение',
    items: [
      { to: '/notifications', label: 'Уведомления', icon: Bell, iconActive: BellFill },
      { to: '/surveys', label: 'Опросы', icon: ListCheck, iconActive: ListCheckFill },
    ],
  },
  {
    label: 'Приложение',
    items: [
      { to: '/users', label: 'Пользователи', icon: Person, iconActive: PersonFill },
      { to: '/promo', label: 'Промо-товары', icon: Star, iconActive: StarFill },
      { to: '/extra-benefit', label: 'Экстра-выгода', icon: Sparkles, iconActive: SparklesFill },
      { to: '/versions', label: 'Версии приложения', icon: CircleArrowUp, iconActive: CircleArrowUpFill },
    ],
  },
]

/** Sections that wait for the backend. Grouped and dimmed so they don't compete for attention. */
export const NAV_SOON: NavItem[] = [
  { to: '/upsell', label: 'Апселл', icon: CirclePlus, iconActive: CirclePlusFill, soon: true },
  { to: '/switch', label: 'Смена продукта', icon: ForwardStep, iconActive: ForwardStepFill, soon: true },
]
