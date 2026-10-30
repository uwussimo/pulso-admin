import { Icon, Label, Text } from '@gravity-ui/uikit'
import { Bell, CircleDollar, Receipt, Smartphone } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { notificationsApi } from '../../api/notifications'
import { receiptsApi } from '../../api/receipts'
import { transactionsApi } from '../../api/transactions'
import { versionsApi } from '../../api/versions'
import { PageHeader } from '../../components/PageHeader'
import { formatNumber, formatSum, plural, tiynsToSum } from '../../lib/format'
import { platformLabel } from '../../lib/constants'

const SOON_METRICS: { title: string; text: string }[] = [
  { title: 'Регистрации и активные пользователи', text: 'Сколько людей пришло и сколько возвращается.' },
  { title: 'Прошли KYC', text: 'Доля пользователей, подтвердивших личность через MyID.' },
  { title: 'Выплачено и выведено', text: 'Начисленный кешбэк против вывода на карты, лимит 500 000 сум в месяц.' },
  { title: 'Расход бюджета', text: 'Сколько маркетингового бюджета на базовый кешбэк уже потрачено.' },
  { title: 'Конверсия апселла и смены продукта', text: 'Сколько предложений привели к покупке.' },
  { title: 'Рефералы и открываемость пушей', text: 'Рост по приглашениям и сколько люди читают рассылки.' },
]

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

  const versionItems = versions.data?.items ?? []
  const receiptSummary = receipts.data?.summary
  const txSummary = transactions.data?.summary

  return (
    <>
      <PageHeader
        title="Обзор"
        description="Утренняя проверка: растём ли мы и не утекают ли деньги. Чеки и деньги считаются живьём, остальные метрики ждут API."
      />

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

      <section className="section">
        <Text variant="subheader-2">
          Метрики{' '}
          <Label theme="utility" size="xs">
            Скоро
          </Label>
        </Text>
        <div className="tiles">
          {SOON_METRICS.map((m) => (
            <div key={m.title} className="tile tile_outlined">
              <Text variant="subheader-1">{m.title}</Text>
              <Text variant="body-1" color="secondary">
                {m.text}
              </Text>
            </div>
          ))}
        </div>
        <Text variant="body-1" color="hint">
          Пока данных нет, вместо цифр показываем прочерк. Нулей и примерных значений здесь не будет.
        </Text>
      </section>
    </>
  )
}
