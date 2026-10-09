import { Text } from '@gravity-ui/uikit'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}

export function PageHeader({ title, description, actions, eyebrow }: Props) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow ? (
          <Text variant="body-1" color="secondary">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="display-1" as="h1" style={{ margin: 0 }}>
          {title}
        </Text>
        {description ? (
          <Text variant="body-2" color="secondary">
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}
