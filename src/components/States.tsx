import { Alert, Button, Flex, Loader, Text } from '@gravity-ui/uikit'
import type { ReactNode } from 'react'
import { errorText } from '../lib/errors'

export function LoadingState({ label = 'Загружаем…' }: { label?: string }) {
  return (
    <Flex centerContent gap={3} style={{ padding: 'var(--g-spacing-10) 0' }}>
      <Loader size="m" />
      <Text variant="body-2" color="secondary">
        {label}
      </Text>
    </Flex>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div style={{ padding: 'var(--g-spacing-5)' }}>
      <Alert
        theme="danger"
        title="Не удалось загрузить"
        message={errorText(error)}
        actions={onRetry ? <Button onClick={onRetry}>Повторить</Button> : undefined}
        layout="horizontal"
      />
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Flex direction="column" alignItems="center" gap={2} style={{ padding: 'var(--g-spacing-10) var(--g-spacing-5)' }}>
      <Text variant="subheader-2">{title}</Text>
      {description ? (
        <Text variant="body-2" color="secondary" style={{ textAlign: 'center', maxWidth: 420 }}>
          {description}
        </Text>
      ) : null}
      {action ? <div style={{ marginTop: 'var(--g-spacing-2)' }}>{action}</div> : null}
    </Flex>
  )
}
