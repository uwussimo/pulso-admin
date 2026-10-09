import { Icon, Label, Text } from '@gravity-ui/uikit'
import { Bell, CircleDollar, Smartphone } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { notificationsApi } from '../../api/notifications'
import { versionsApi } from '../../api/versions'
import { PageHeader } from '../../components/PageHeader'
import { formatNumber } from '../../lib/format'
import { platformLabel } from '../../lib/constants'

const SOON_METRICS: { title: string; text: string }[] = [
  { title: 'Регистрации и активные пользователи', text: 'Сколько людей пришло и сколько возвращается.' },
  { title: 'Прошли KYC', text: 'Доля пользователей, подтвердивших личность через MyID.' },
  { title: 'Чеки: отсканировано / одобрено / отклонено', text: 'Воронка чеков и очередь на модерацию.' },
  { title: 'Выплачено и выведено', text: 'Начисленный кешбэк против вывода на карты, лимит 500 000 сум в месяц.' },
  { title: 'Расход бюджета', text: 'Сколько маркетингового бюджета на базовый кешбэк уже потрачено.' },
  { title: 'Конверсия апселла и смены продукта', text: 'Сколько предложений привели к покупке.' },
  { title: 'Рефералы и открываемость пушей', text: 'Рост по приглашениям и сколько людей читают рассылки.' },
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

  const versionItems = versions.data?.items ?? []

  return (
    <>
      <PageHeader
        title="Обзор"
        description="Утренняя проверка: растём ли мы и не утекают ли деньги. Метрики подключатся, когда появится API."
      />

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
            <Text variant="header-1" className="tile__value">
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
