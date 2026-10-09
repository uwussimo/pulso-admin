import { Alert, Button, Flex, Icon, Text, useToaster } from '@gravity-ui/uikit'
import { Pencil, TrashBin } from '@gravity-ui/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { notificationsApi } from '../../api/notifications'
import { AudienceLabel } from '../../components/AudienceLabel'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { LOCALES, appRouteLabel, notificationTypeLabel } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber } from '../../lib/format'
import { EditNotificationDialog } from './EditNotificationDialog'
import { pickLocale } from './locale'

export function NotificationDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [retracting, setRetracting] = useState(false)

  const query = useQuery({
    queryKey: ['notifications', 'detail', id],
    queryFn: ({ signal }) => notificationsApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })

  const retract = useMutation({
    mutationFn: () => notificationsApi.retract(id),
    onSuccess: () => {
      toaster.add({ name: 'retracted', theme: 'success', title: 'Уведомление отозвано' })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate('/notifications', { replace: true })
    },
    onError: (e) => toaster.add({ name: 'retract-error', theme: 'danger', title: 'Не удалось отозвать', content: errorText(e) }),
  })

  const back = 'Уведомления'

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="Уведомление" eyebrow={back} />
        <Alert theme="danger" message="Некорректный адрес." />
      </>
    )
  }
  if (query.isPending) {
    return (
      <>
        <PageHeader title="Уведомление" eyebrow={back} />
        <LoadingState />
      </>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title="Уведомление" eyebrow={back} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }

  const d = query.data
  const n = d.notification
  const readShare = d.audience === 'targeted' && d.targeted_count > 0 ? Math.round((d.read_count / d.targeted_count) * 100) : null

  return (
    <>
      <PageHeader
        title={pickLocale(n.title) || `Уведомление #${n.id}`}
        eyebrow={back}
        description={`Отправлено ${formatDateTime(n.created_at)}${d.updated_at && d.updated_at !== n.created_at ? ` · исправлено ${formatDateTime(d.updated_at)}` : ''}`}
        actions={
          <>
            <Button size="l" onClick={() => setEditing(true)}>
              <Icon data={Pencil} size={16} />
              Исправить текст
            </Button>
            <Button size="l" view="outlined-danger" onClick={() => setRetracting(true)}>
              <Icon data={TrashBin} size={16} />
              Отозвать
            </Button>
          </>
        }
      />

      <Flex gap={4} wrap alignItems="flex-start">
        <div className="form" style={{ flex: '1 1 480px', minWidth: 0 }}>
          <div className="panel">
            <Text variant="subheader-2" className="panel__title" as="div">
              Текст
            </Text>
            <div className="panel__body form">
              {LOCALES.map((l) => {
                const t = n.title[l.key]
                const body = n.description?.[l.key]
                return (
                  <div key={l.key}>
                    <Text variant="caption-2" color="hint" as="div">
                      {l.label}
                    </Text>
                    {t || body ? (
                      <>
                        <Text variant="subheader-1" as="div">
                          {t || <Text color="hint">без заголовка</Text>}
                        </Text>
                        {body ? (
                          <Text variant="body-2" as="div" style={{ whiteSpace: 'pre-wrap' }}>
                            {body}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <Text variant="body-2" color="hint" as="div">
                        не заполнено
                      </Text>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="form" style={{ flex: '0 1 360px', minWidth: 280 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Кому и как
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Аудитория</Text>
              <span>
                <AudienceLabel audience={d.audience} targetPlatform={d.target_platform} targetedCount={d.targeted_count} />
              </span>
              <Text className="kv__key">Экран</Text>
              <Text>{appRouteLabel(n.url)}</Text>
              <Text className="kv__key">Тип</Text>
              <Text>{notificationTypeLabel(n.type)}</Text>
              <Text className="kv__key">ID</Text>
              <Text className="num">{n.id}</Text>
            </div>
          </div>

          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Прочтения
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Открыли</Text>
              <Text className="num">{formatNumber(d.read_count)}</Text>
              {d.audience === 'targeted' ? (
                <>
                  <Text className="kv__key">Получателей</Text>
                  <Text className="num">{formatNumber(d.targeted_count)}</Text>
                  <Text className="kv__key">Не открыли</Text>
                  <Text className="num">{formatNumber(d.unread_count)}</Text>
                  <Text className="kv__key">Доля прочитавших</Text>
                  <Text className="num">{readShare === null ? '—' : `${readShare}%`}</Text>
                </>
              ) : (
                <>
                  <Text className="kv__key">Получателей</Text>
                  <Text color="hint">не считается для рассылок всем и по платформе</Text>
                </>
              )}
            </div>
            <div className="panel__body" style={{ paddingTop: 0 }}>
              <Text variant="caption-2" color="hint">
                Доставка пушей здесь не учитывается: сервер не связывает пуш с уведомлением.
              </Text>
            </div>
          </div>
        </div>
      </Flex>

      <EditNotificationDialog
        open={editing}
        notification={n}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          toaster.add({ name: 'edited', theme: 'success', title: 'Текст исправлен' })
          void queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }}
      />

      <ConfirmDialog
        open={retracting}
        title="Отозвать уведомление?"
        confirmText="Отозвать"
        danger
        loading={retract.isPending}
        onClose={() => setRetracting(false)}
        onConfirm={() => retract.mutate()}
      >
        <Text variant="body-2">
          Уведомление пропадёт из ленты у всех получателей. Уже доставленные пуши остаются на телефонах. Вернуть обратно
          не получится.
        </Text>
      </ConfirmDialog>
    </>
  )
}
