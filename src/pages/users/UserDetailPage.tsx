import { Alert, Button, Flex, Icon, Label, Link as UiLink, Text, useToaster } from '@gravity-ui/uikit'
import { Ban, CircleCheckFill, LockOpen } from '@gravity-ui/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { UserStatus } from '../../api/types'
import { usersApi } from '../../api/users'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { userStatusMeta } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber, formatPhone, formatSum, tiynsToSum } from '../../lib/format'
import { UserAppActivity } from './UserAppActivity'

type PendingStatus = 'blocked' | 'active'

export function UserDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<PendingStatus | null>(null)

  const query = useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: ({ signal }) => usersApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })

  const changeStatus = useMutation({
    mutationFn: (status: UserStatus) => usersApi.setStatus(id, status),
    onSuccess: (res, status) => {
      setPending(null)
      toaster.add({
        name: 'user-status',
        theme: 'success',
        title: status === 'blocked' ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
        content:
          status === 'blocked' && res.sessions_revoked > 0
            ? `Закрыто сессий: ${res.sessions_revoked}. Приложение выйдет из аккаунта при следующем запросе.`
            : undefined,
      })
      // The list carries the same status badge, so both caches go stale.
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) =>
      toaster.add({
        name: 'user-status-error',
        theme: 'danger',
        title: 'Не удалось изменить статус',
        content: errorText(e),
      }),
  })

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="Пользователь" eyebrow="Пользователи" />
        <Alert theme="danger" message="Некорректный адрес." />
      </>
    )
  }
  if (query.isPending) {
    return (
      <>
        <PageHeader title="Пользователь" eyebrow="Пользователи" />
        <LoadingState />
      </>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title="Пользователь" eyebrow="Пользователи" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }

  const u = query.data
  const status = userStatusMeta(u.status)
  const deleted = u.status === 'deleted'

  return (
    <>
      <PageHeader
        title={u.full_name || formatPhone(u.phone)}
        eyebrow="Пользователи"
        description={
          <>
            {formatPhone(u.phone)} · в приложении с {formatDateTime(u.created_at)}
          </>
        }
        actions={
          deleted ? null : u.status === 'blocked' ? (
            <Button size="l" onClick={() => setPending('active')} loading={changeStatus.isPending}>
              <Icon data={LockOpen} size={16} />
              Разблокировать
            </Button>
          ) : (
            <Button
              size="l"
              view="outlined-danger"
              onClick={() => setPending('blocked')}
              loading={changeStatus.isPending}
            >
              <Icon data={Ban} size={16} />
              Заблокировать
            </Button>
          )
        }
      />

      {u.status === 'blocked' ? (
        <Alert
          theme="warning"
          title="Аккаунт заблокирован"
          message="Пользователь не может войти в приложение. Существующие сессии закрыты — приложение выйдет из аккаунта при следующем запросе."
        />
      ) : null}

      <Flex gap={4} wrap alignItems="flex-start">
        <div className="form" style={{ flex: '1 1 420px', minWidth: 0 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Профиль
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Статус</Text>
              <span>
                <Label theme={status.theme}>{status.label}</Label>
                {u.is_admin ? (
                  <>
                    {' '}
                    <Label theme="info">Оператор</Label>
                  </>
                ) : null}
              </span>
              <Text className="kv__key">KYC (MyID)</Text>
              <Text color={u.is_verified ? 'positive' : 'secondary'}>
                {u.is_verified ? (
                  <>
                    <Icon data={CircleCheckFill} size={14} /> Пройден
                  </>
                ) : (
                  'Не пройден'
                )}
              </Text>
              <Text className="kv__key">Телефон</Text>
              <Text className="num">{formatPhone(u.phone)}</Text>
              <Text className="kv__key">ID</Text>
              <Text className="num">{u.id}</Text>
              <Text className="kv__key">Обновлён</Text>
              <Text className="num">{formatDateTime(u.updated_at)}</Text>
            </div>
          </div>

          <UserAppActivity userId={u.id} />

          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Рефералы
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Пригласил</Text>
              <Text className="num">{formatNumber(u.referrals_count)}</Text>
              <Text className="kv__key">Пришёл по приглашению</Text>
              {u.invited_by ? (
                <UiLink href={`/users/${u.invited_by}`} view="normal">
                  <Link to={`/users/${u.invited_by}`} style={{ color: 'inherit', textDecoration: 'inherit' }}>
                    пользователь #{u.invited_by}
                  </Link>
                </UiLink>
              ) : (
                <Text color="hint">нет</Text>
              )}
            </div>
          </div>
        </div>

        <div className="form" style={{ flex: '1 1 360px', minWidth: 280 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Деньги
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Доступно</Text>
              <Text variant="subheader-3" className="num">
                {formatSum(tiynsToSum(u.balance_available))}
              </Text>
              <Text className="kv__key">Ожидает</Text>
              <Text className="num">{formatSum(tiynsToSum(u.balance_pending))}</Text>
            </div>
            <div className="panel__body" style={{ paddingTop: 0 }}>
              <Text variant="caption-2" color="hint">
                Доступно — начисления по проведённым чекам за вычетом выводов. Ожидает — чеки, которые ещё не проведены.
              </Text>
            </div>
          </div>

          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Чеки
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Одобрено</Text>
              <Text className="num">
                {formatNumber(u.receipts_approved)}
                <Text color="hint"> из {formatNumber(u.receipts_total)}</Text>
              </Text>
              <Text className="kv__key">Последний чек</Text>
              <Text className="num">
                {u.last_receipt_at ? formatDateTime(u.last_receipt_at) : <Text color="hint">не сканировал</Text>}
              </Text>
            </div>
          </div>
        </div>
      </Flex>

      <ConfirmDialog
        open={pending === 'blocked'}
        title="Заблокировать пользователя?"
        confirmText="Заблокировать"
        danger
        loading={changeStatus.isPending}
        onClose={() => setPending(null)}
        onConfirm={() => changeStatus.mutate('blocked')}
      >
        <Text as="p">
          {u.full_name || formatPhone(u.phone)} не сможет войти в приложение, а открытое приложение выйдет из аккаунта
          при следующем запросе. Деньги на балансе и история сохранятся — блокировку можно снять.
        </Text>
        {u.is_admin ? (
          <Alert
            theme="warning"
            message="Это оператор: после блокировки он потеряет доступ и к админке, и к приложению."
          />
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={pending === 'active'}
        title="Разблокировать пользователя?"
        confirmText="Разблокировать"
        loading={changeStatus.isPending}
        onClose={() => setPending(null)}
        onConfirm={() => changeStatus.mutate('active')}
      >
        <Text as="p">
          {u.full_name || formatPhone(u.phone)} снова сможет войти в приложение. Раньше закрытые сессии не восстановятся
          — пользователь войдёт заново.
        </Text>
      </ConfirmDialog>
    </>
  )
}
