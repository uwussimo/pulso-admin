import { Icon, Text } from '@gravity-ui/uikit'
import { Bell, ChartColumn, CircleDollar, Receipt, Smartphone } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { isApiError } from '../../api/client'
import { metricsApi } from '../../api/metrics'
import { notificationsApi } from '../../api/notifications'
import { receiptsApi } from '../../api/receipts'
import { transactionsApi } from '../../api/transactions'
import { versionsApi } from '../../api/versions'
import { PageHeader } from '../../components/PageHeader'
import { formatNumber, formatSum, plural, tiynsToSum } from '../../lib/format'
import { platformLabel } from '../../lib/constants'

export function OverviewPage() {
  const notifications = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: ({ signal }) => notificationsApi.list({ limit: 1 }, signal),
  })
  const versions = useQuery({
    queryKey: ['versions'],
    queryFn: ({ signal }) => versionsApi.list(signal),
  })
  // limit=1 is enough: the summary describes the whole filtered set and is
  // computed in the same statement as the rows, so a single row carries
  // the same totals a full page would have shown.
  const receipts = useQuery({
    queryKey: ['receipts', 'list', 'overview'],
    queryFn: ({ signal }) => receiptsApi.list({ limit: 1 }, signal),
  })
  const transactions = useQuery({
    queryKey: ['transactions', 'list', 'overview'],
    queryFn: ({ signal }) => transactionsApi.list({ limit: 1 }, signal),
  })
  const metrics = useQuery({
    queryKey: ['metrics', 'app', 7],
    queryFn: ({ signal }) => metricsApi.app(7, signal),
    staleTime: 60_000,
    retry: false,
  })
  const metricsOff = metrics.isError && isApiError(metrics.error) && metrics.error.alias === 'metrics.not_configured'

  const versionItems = versions.data?.items ?? []
  const receiptSummary = receipts.data?.summary
  const txSummary = transactions.data?.summary

  return (
    <>
      <PageHeader title="Обзор" description="Утренняя проверка: растём ли мы и не утекают ли деньги." />

      <section className="section">
        <Text variant="subheader-2">Чеки и деньги</Text>
        <div className="tiles">
          <Link to="/receipts" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={Receipt} size={14} /> Чеки: одобрено / отсканировано
            </Text>
            <Text variant="header-2" className="tile__value">
              {receipts.isPending
                ? '…'
                : receiptSummary
                  ? `${formatNumber(receiptSummary.approved)} / ${formatNumber(receiptSummary.totals)}`
                  : '—'}
            </Text>
            <Text variant="caption-2" color="hint">
              {receipts.isError
                ? 'не удалось загрузить'
                : receiptSummary && receiptSummary.pending > 0
                  ? `${plural(receiptSummary.pending, ['ждёт проверки', 'ждут проверки', 'ждут проверки'])}`
                  : 'очередь модерации пуста'}
            </Text>
          </Link>

          <Link to="/transactions" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={CircleDollar} size={14} /> Начислено
            </Text>
            <Text variant="header-2" className="tile__value">
              {transactions.isPending ? '…' : txSummary ? formatSum(tiynsToSum(txSummary.posted_credits)) : '—'}
            </Text>
            <Text variant="caption-2" color="hint">
              {transactions.isError ? 'не удалось загрузить' : 'все начисления: чеки, бонусы, приглашения'}
            </Text>
          </Link>

          <Link to="/transactions" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={CircleDollar} size={14} /> Выведено на карты
            </Text>
            <Text variant="header-2" className="tile__value">
              {transactions.isPending ? '…' : txSummary ? formatSum(tiynsToSum(txSummary.posted_debits)) : '—'}
            </Text>
            <Text variant="caption-2" color="hint">
              {transactions.isError
                ? 'не удалось загрузить'
                : txSummary && txSummary.reversed > 0
                  ? `сторно: ${formatNumber(txSummary.reversed)}`
                  : 'сторно не было'}
            </Text>
          </Link>
        </div>
      </section>

      <section className="section">
        <Text variant="subheader-2">Работает сейчас</Text>
        <div className="tiles">
          <Link to="/analytics" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={ChartColumn} size={14} /> В приложении сегодня
            </Text>
            <Text variant="header-2" className="tile__value">
              {metrics.isPending ? '…' : metrics.data ? formatNumber(metrics.data.active.day) : '—'}
            </Text>
            <Text variant="caption-2" color="hint">
              {metricsOff
                ? 'аналитика не подключена'
                : metrics.isError
                  ? 'не удалось загрузить'
                  : metrics.data
                    ? `за 7 дней ${formatNumber(metrics.data.active.week)} · ${plural(metrics.data.in_range.errors, ['ошибка', 'ошибки', 'ошибок'])}`
                    : ''}
            </Text>
          </Link>

          <Link to="/notifications" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={Bell} size={14} /> Уведомлений отправлено
            </Text>
            <Text variant="header-2" className="tile__value">
              {notifications.isPending ? '…' : notifications.isError ? '—' : formatNumber(notifications.data.totals)}
            </Text>
            <Text variant="caption-2" color="hint">
              {notifications.isError ? 'не удалось загрузить' : 'всего в ленте, без отозванных'}
            </Text>
          </Link>

          <Link to="/versions" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={Smartphone} size={14} /> Версии приложения
            </Text>
            <Text variant="header-2" className="tile__value">
              {versions.isPending
                ? '…'
                : versions.isError
                  ? '—'
                  : versionItems.length === 0
                    ? 'не заданы'
                    : versionItems.map((v) => `${platformLabel(v.platform)} ${v.version}`).join(' · ')}
            </Text>
            <Text variant="caption-2" color="hint">
              {versionItems.some((v) => v.force_update)
                ? 'есть принудительное обновление'
                : versions.isError
                  ? 'не удалось загрузить'
                  : 'принудительных обновлений нет'}
            </Text>
          </Link>

          <Link to="/cashback" className="tile">
            <Text variant="body-1" color="secondary">
              <Icon data={CircleDollar} size={14} /> Перевод кешбэка
            </Text>
            <Text variant="header-2">Вручную</Text>
            <Text variant="caption-2" color="hint">
              перевести зависшие чеки в доступный баланс
            </Text>
          </Link>
        </div>
      </section>
    </>
  )
}
