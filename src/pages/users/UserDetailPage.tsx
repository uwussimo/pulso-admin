import { Alert, Flex, Label, Link as UiLink, Text } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { userStatusMeta } from '../../lib/constants'
import { formatDateTime, formatNumber, formatPhone, formatSum, tiynsToSum } from '../../lib/format'

export function UserDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)

  const query = useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: ({ signal }) => usersApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
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
      />

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
              <Text color={u.is_verified ? 'positive' : 'secondary'}>{u.is_verified ? 'Пройден' : 'Не пройден'}</Text>
              <Text className="kv__key">Телефон</Text>
              <Text className="num">{formatPhone(u.phone)}</Text>
              <Text className="kv__key">ID</Text>
              <Text className="num">{u.id}</Text>
              <Text className="kv__key">Обновлён</Text>
              <Text className="num">{formatDateTime(u.updated_at)}</Text>
            </div>
          </div>

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
              <Text className="num">{u.last_receipt_at ? formatDateTime(u.last_receipt_at) : <Text color="hint">не сканировал</Text>}</Text>
            </div>
          </div>
        </div>
      </Flex>
    </>
  )
}
