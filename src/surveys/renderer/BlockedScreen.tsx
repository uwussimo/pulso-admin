import { Button, Icon, Text } from '@gravity-ui/uikit'
import { CircleXmark } from '@gravity-ui/icons'
import type { RespondentStrings } from '../i18n'

interface Props {
  title: string
  body: string
  t: RespondentStrings
  onReturn?: () => void
  onRetry?: () => void
  onSecondary?: () => void
  secondaryLabel?: string
}

export function BlockedScreen({ title, body, t, onReturn, onRetry, onSecondary, secondaryLabel }: Props) {
  return (
    <>
      <div className="runner__main runner__main_center">
        <span className="runner__done-mark runner__done-mark_muted">
          <Icon data={CircleXmark} size={40} />
        </span>
        <Text variant="header-2" as="h1" style={{ margin: 0, textAlign: 'center' }}>
          {title}
        </Text>
        <Text variant="body-2" color="secondary" as="p" style={{ margin: 0, textAlign: 'center' }}>
          {body}
        </Text>
      </div>
      <div className="runner__footer">
        {onSecondary ? (
          <Button view="flat" size="xl" onClick={onSecondary}>
            {secondaryLabel ?? t.back}
          </Button>
        ) : null}
        {onRetry ? (
          <Button view="action" size="xl" className="runner__next" onClick={onRetry}>
            {t.retry}
          </Button>
        ) : onReturn ? (
          <Button view="action" size="xl" width="max" onClick={onReturn}>
            {t.returnToApp}
          </Button>
        ) : null}
      </div>
    </>
  )
}
