import { Button, Icon, Label, Select, Table, Text, TextInput, type TableColumnConfig } from '@gravity-ui/uikit'
import { CircleCheckFill, Magnifier } from '@gravity-ui/icons'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usersApi } from '../../api/users'
import type { AdminUser, UserStatus } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { USER_STATUSES, userStatusMeta } from '../../lib/constants'
import { formatDateTime, formatNumber, formatPhone, formatSum, tiynsToSum } from '../../lib/format'

const PAGE = 25

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function UsersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const phone = params.get('phone') ?? ''
  const status = (params.get('status') as UserStatus | null) ?? ''
  const debouncedPhone = useDebounced(phone, 350)

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query = useInfiniteQuery({
    queryKey: ['users', 'list', { phone: debouncedPhone, status }],
    queryFn: ({ pageParam, signal }) =>
      usersApi.list(
        {
          phone: debouncedPhone || undefined,
          status: status || undefined,
          limit: PAGE,
          before_id: pageParam || undefined,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more && last.items.length ? last.items[last.items.length - 1].id : undefined),
  })

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])
  const totals = query.data?.pages[0]?.totals
  const filtered = Boolean(debouncedPhone || status)

  const columns: TableColumnConfig<AdminUser>[] = [
    {
      id: 'user',
      name: 'Пользователь',
      primary: true,
      template: (u) => (
        <div className="cell-title" style={{ maxWidth: 320 }}>
          <Text variant="subheader-1" ellipsis>
            {u.full_name || <Text color="hint">без имени</Text>}
          </Text>
          <Text variant="body-1" color="secondary" className="num">
            {formatPhone(u.phone)}
          </Text>
        </div>
      ),
    },
    {
      id: 'status',
      name: 'Статус',
      template: (u) => {
        const m = userStatusMeta(u.status)
        return <Label theme={m.theme}>{m.label}</Label>
      },
    },
    {
      id: 'kyc',
      name: 'KYC',
      template: (u) =>
        u.is_verified ? (
          <Text color="positive">
            <Icon data={CircleCheckFill} size={14} /> Пройден
          </Text>
        ) : (
          <Text color="hint">Нет</Text>
        ),
    },
    {
      id: 'balance',
      name: 'Баланс',
      align: 'end',
      template: (u) => (
        <div className="cell-title" style={{ alignItems: 'flex-end' }}>
          <Text className="num">{formatSum(tiynsToSum(u.balance_available))}</Text>
          {u.balance_pending > 0 ? (
            <Text variant="caption-2" color="hint" className="num">
              ожидает {formatSum(tiynsToSum(u.balance_pending))}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      id: 'receipts',
      name: 'Чеки',
      align: 'end',
      template: (u) => (
        <Text className="num">
          {formatNumber(u.receipts_approved)}
          <Text color="hint"> / {formatNumber(u.receipts_total)}</Text>
        </Text>
      ),
    },
    {
      id: 'referrals',
      name: 'Рефералы',
      align: 'end',
      template: (u) => <Text className="num">{formatNumber(u.referrals_count)}</Text>,
    },
    {
      id: 'created',
      name: 'Регистрация',
      template: (u) => (
        <Text className="num" whiteSpace="nowrap">
          {formatDateTime(u.created_at)}
        </Text>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Пользователи"
        description="Найдите человека по телефону, когда он пишет в поддержку: баланс, чеки, KYC и рефералы на одном экране."
      />

      <div className="panel">
        <div className="toolbar">
          <TextInput
            className="toolbar__search"
            size="l"
            type="tel"
            value={phone}
            onUpdate={(v) => setParam('phone', v)}
            placeholder="Телефон, можно часть номера"
            startContent={
              <Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />
            }
            hasClear
            controlProps={{ inputMode: 'tel', autoComplete: 'off' }}
          />
          <Select
            size="l"
            width={180}
            placeholder="Статус"
            value={status ? [status] : []}
            onUpdate={(v) => setParam('status', v[0])}
            hasClear
            options={USER_STATUSES.map((s) => ({ value: s.value, content: s.label }))}
          />
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Никого не нашли' : 'Пользователей ещё нет'}
            description={
              filtered
                ? 'Проверьте номер: ищем по любой части цифр, без кода страны тоже подойдёт.'
                : 'Как только кто-то зарегистрируется в приложении, он появится здесь.'
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <Table
                data={items}
                columns={columns}
                getRowId={(u) => String(u.id)}
                getRowDescriptor={() => ({ interactive: true })}
                onRowClick={(u) => navigate(`/users/${u.id}`)}
                edgePadding
              />
            </div>
            <div className="table-footer">
              <Text variant="body-1" color="secondary">
                Показано {formatNumber(items.length)}
                {totals !== undefined ? ` из ${formatNumber(totals)}` : ''}
              </Text>
              {query.hasNextPage ? (
                <Button size="m" onClick={() => void query.fetchNextPage()} loading={query.isFetchingNextPage}>
                  Показать ещё
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  )
}
