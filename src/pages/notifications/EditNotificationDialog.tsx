import { Alert, Button, Dialog, Flex, Select } from '@gravity-ui/uikit'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { notificationsApi } from '../../api/notifications'
import type { LocaleMap, NotificationJSON, NotificationType } from '../../api/types'
import { Field } from '../../components/Field'
import { APP_ROUTES, NOTIFICATION_TYPES } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { LocaleFields } from './LocaleFields'
import { compactLocaleMap } from './locale'

interface Props {
  open: boolean
  notification: NotificationJSON | null
  onClose: () => void
  onSaved: () => void
}

export function EditNotificationDialog({ open, notification, onClose, onSaved }: Props) {
  const titleId = useId()
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} maxWidth="m" fullWidth disableOutsideClick>
      <Dialog.Header caption="Исправить текст" id={titleId} />
      {notification ? (
        // Keyed by id so reopening for another notification starts from its own copy.
        <EditForm key={notification.id} notification={notification} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </Dialog>
  )
}

function EditForm({ notification, onClose, onSaved }: { notification: NotificationJSON; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState<LocaleMap>(() => ({ ...notification.title }))
  const [description, setDescription] = useState<LocaleMap>(() => ({ ...(notification.description ?? {}) }))
  const [type, setType] = useState<NotificationType>(notification.type)
  const [url, setUrl] = useState(notification.url ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const t = compactLocaleMap(title)
      if (!t.ru) throw new Error('Нужен заголовок на русском')
      return notificationsApi.update(notification.id, {
        title: t,
        description: compactLocaleMap(description),
        type,
        url: url || undefined,
      })
    },
    onSuccess: onSaved,
    onError: (e) => setError(errorText(e)),
  })

  return (
    <>
      <Dialog.Body>
        <Flex direction="column" gap={4}>
          <Alert
            theme="info"
            message="Меняется только текст, тип и экран. Аудитория и статус прочтения у получателей остаются как были: исправление опечатки не разошлёт уведомление заново."
          />
          {error ? <Alert theme="danger" message={error} /> : null}
          <LocaleFields title={title} description={description} onTitle={setTitle} onDescription={setDescription} />
          <div className="form__row">
            <Field label="Тип">
              <Select
                size="l"
                value={[String(type)]}
                onUpdate={(v) => setType(Number(v[0]) as NotificationType)}
                options={NOTIFICATION_TYPES.map((t) => ({ value: String(t.value), content: t.label }))}
              />
            </Field>
            <Field label="Экран в приложении">
              <Select
                size="l"
                value={url ? [url] : ['']}
                onUpdate={(v) => setUrl(v[0] ?? '')}
                options={[{ value: '', content: 'Без перехода' }, ...APP_ROUTES.map((r) => ({ value: r.value, content: r.label }))]}
              />
            </Field>
          </div>
        </Flex>
      </Dialog.Body>
      <Dialog.Footer
        renderButtons={() => (
          <>
            <Button view="flat" size="l" onClick={onClose} disabled={save.isPending}>
              Отмена
            </Button>
            <Button view="action" size="l" onClick={() => save.mutate()} loading={save.isPending}>
              Сохранить
            </Button>
          </>
        )}
      />
    </>
  )
}
