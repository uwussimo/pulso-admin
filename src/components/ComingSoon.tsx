import { Icon, Label, Text } from '@gravity-ui/uikit'
import { Clock } from '@gravity-ui/icons'
import type { ReactNode } from 'react'
import { PageHeader } from './PageHeader'

export interface SoonItem {
  title: string
  text: string
}

interface Props {
  title: string
  purpose: ReactNode
  items: SoonItem[]
}

/** Placeholder for sections that are not yet backed by the API. Never shows fake numbers. */
export function ComingSoon({ title, purpose, items }: Props) {
  return (
    <>
      <PageHeader
        title={title}
        eyebrow={
          <Label theme="utility" size="s">
            Скоро
          </Label>
        }
        description={purpose}
      />
      <div className="soon">
        <Text variant="subheader-2">Что здесь появится</Text>
        <ul className="soon__list">
          {items.map((it) => (
            <li key={it.title} className="soon__item">
              <span className="soon__item-icon">
                <Icon data={Clock} size={16} />
              </span>
              <div style={{ minWidth: 0 }}>
                <Text variant="subheader-1" as="div">
                  {it.title}
                </Text>
                <Text variant="body-1" color="secondary" as="div">
                  {it.text}
                </Text>
              </div>
            </li>
          ))}
        </ul>
        <Text variant="body-1" color="hint">
          Раздел откроется, когда бэкенд отдаст данные. Пока здесь нет цифр, чтобы не показывать выдуманные.
        </Text>
      </div>
    </>
  )
}
