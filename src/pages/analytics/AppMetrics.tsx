import { Alert, Button, Flex, Label, SegmentedRadioGroup, Text } from '@gravity-ui/uikit'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { metricsApi } from '../../api/metrics'
import { isApiError } from '../../api/client'
import type { AppMetrics as AppMetricsData } from '../../api/types'
import { LoadingState } from '../../components/States'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber, plural } from '../../lib/format'

type Range = 7 | 30

/**
 * What is happening in the mobile app, read from PostHog. Every number is a
 * count of real events; when the source is missing the page says so instead
 * of showing zeros.
 */
export function AppMetrics() {
  const [range, setRange] = useState<Range>(7)
  const query = useQuery({
    queryKey: ['metrics', 'app', range],
    queryFn: ({ signal }) => metricsApi.app(range, signal),
    staleTime: 60_000,
    retry: (count, e) => !(isApiError(e) && (e.status === 503 || e.status === 502)) && count < 1,
  })

  const notConfigured = query.isError && isApiError(query.error) && query.error.alias === 'metrics.not_configured'

  return (
    <>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        gap={3}
        wrap
        style={{ marginBottom: 'var(--g-spacing-4)' }}
      >
        <Text variant="subheader-2">За {range === 7 ? '7 дней' : '30 дней'}</Text>
        <SegmentedRadioGroup size="m" value={String(range)} onUpdate={(v) => setRange(Number(v) as Range)}>
          <SegmentedRadioGroup.Option value="7">7 дней</SegmentedRadioGroup.Option>
          <SegmentedRadioGroup.Option value="30">30 дней</SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
      </Flex>

      {query.isError ? (
        <Alert
          theme={notConfigured ? 'info' : 'warning'}
          title={notConfigured ? 'Аналитика приложения не подключена' : 'Аналитика недоступна'}
          message={
            notConfigured
              ? 'Цифры появятся, когда на сервере будет ключ PostHog. Пока здесь ничего не показываем, чтобы не выдумывать.'
              : errorText(query.error)
          }
          actions={
            notConfigured ? undefined : (
              <Button size="m" onClick={() => void query.refetch()}>
                Повторить
              </Button>
            )
          }
          layout="horizontal"
        />
      ) : query.isPending ? (
        <LoadingState label="Считаем по событиям…" />
      ) : (
        <Body data={query.data} range={range} />
      )}
    </>
  )
}

function Body({ data, range }: { data: AppMetricsData; range: Range }) {
  const active = range === 7 ? data.active.week : data.active.month
  const share = (part: number, whole: number) => (whole > 0 ? ` (${Math.round((part / whole) * 100)}%)` : '')

  return (
    <div className="form" style={{ gap: 'var(--g-spacing-6)' }}>
      <section className="section" style={{ marginBottom: 0 }}>
        <Text variant="subheader-2">Люди</Text>
        <div className="tiles">
          <Tile
            label="Активные пользователи"
            value={formatNumber(active)}
            note={`сегодня ${formatNumber(data.active.day)} · за 30 дней ${formatNumber(data.active.month)}`}
          />
          <Tile
            label="Новые устройства"
            value={formatNumber(data.people.new_in_range)}
            note={`всего ${formatNumber(data.people.total)}`}
          />
          <Tile
            label="Вошли в аккаунт"
            value={formatNumber(data.people.identified)}
            note={`из ${formatNumber(data.people.total)} устройств${share(data.people.identified, data.people.total)}`}
          />
          <Tile
            label="Прошли KYC"
            value={formatNumber(data.people.verified)}
            note={`из ${formatNumber(data.people.identified)} вошедших${share(data.people.verified, data.people.identified)} · подтверждение через MyID`}
          />
        </div>
      </section>

      <section className="section" style={{ marginBottom: 0 }}>
        <Text variant="subheader-2">Использование</Text>
        <div className="tiles">
          <Tile
            label="Открытий приложения"
            value={formatNumber(data.in_range.opens)}
            note={`${plural(data.in_range.installs, ['установка', 'установки', 'установок'])} за период`}
          />
          <Tile
            label="Просмотров экранов"
            value={formatNumber(data.in_range.screen_views)}
            note={
              data.in_range.opens > 0
                ? `${(data.in_range.screen_views / data.in_range.opens).toFixed(1)} экрана за открытие`
                : 'открытий не было'
            }
          />
          <Tile
            label="Ошибки в приложении"
            value={formatNumber(data.in_range.errors)}
            tone={data.in_range.errors > 0 ? 'danger' : undefined}
            note={
              data.in_range.errors > 0
                ? `у ${plural(data.in_range.people_with_errors, ['пользователя', 'пользователей', 'пользователей'])}`
                : 'падений не было'
            }
          />
        </div>
      </section>

      <div className="panel panel_filled">
        <Text variant="subheader-2" className="panel__title" as="div">
          Активные по дням, последние 14 дней
        </Text>
        <div className="panel__body">
          <DailyBars points={data.daily_active} />
        </div>
      </div>

      <div className="metrics-lists">
        <Breakdown title="Экраны, куда заходят" empty="Просмотров экранов пока нет.">
          {data.top_screens.map((s) => (
            <Row key={s.name} name={s.name} value={formatNumber(s.views)} sub={`${formatNumber(s.people)} чел.`} />
          ))}
        </Breakdown>
        <Breakdown title="Версии приложения" empty="Данных о версиях пока нет.">
          {data.versions.map((x) => (
            <Row key={x.version} name={x.version} value={formatNumber(x.people)} sub="чел." />
          ))}
        </Breakdown>
        <Breakdown title="Платформы" empty="Данных о платформах пока нет.">
          {data.platforms.map((x) => (
            <Row key={x.os} name={x.os} value={formatNumber(x.people)} sub="чел." />
          ))}
        </Breakdown>
      </div>

      <Text variant="caption-2" color="hint">
        По событиям приложения в PostHog, обновлено {formatDateTime(data.generated_at)}. Активный — тот, кто открыл
        приложение или экран. Устройство становится пользователем после входа в аккаунт; KYC — отметка is_verified в
        профиле после проверки MyID.
      </Text>
    </div>
  )
}

function Tile({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'danger' }) {
  return (
    <div className="tile">
      <Text variant="body-1" color="secondary">
        {label}
      </Text>
      <Text variant="header-2" className="tile__value" color={tone}>
        {value}
      </Text>
      <Text variant="caption-2" color="hint">
        {note}
      </Text>
    </div>
  )
}

/** One bar per day with the count on top and the date underneath; no axes to read. */
function DailyBars({ points }: { points: { day: string; people: number }[] }) {
  if (points.length === 0) {
    return (
      <Text variant="body-1" color="hint">
        За последние две недели активности не было.
      </Text>
    )
  }
  const max = Math.max(1, ...points.map((p) => p.people))
  return (
    <div className="bars" role="img" aria-label="Активные пользователи по дням">
      {points.map((p) => (
        <div key={p.day} className="bars__col">
          <Text variant="caption-2" className="num">
            {formatNumber(p.people)}
          </Text>
          <div className="bars__track">
            <div className="bars__bar" style={{ height: `${Math.max(4, Math.round((p.people / max) * 100))}%` }} />
          </div>
          <Text variant="caption-2" color="hint" className="num">
            {p.day.slice(8, 10)}.{p.day.slice(5, 7)}
          </Text>
        </div>
      ))}
    </div>
  )
}

function Breakdown({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="panel panel_filled">
      <Text variant="subheader-1" className="panel__title" as="div">
        {title}
      </Text>
      <div className="panel__body metrics-rows">
        {children.length === 0 ? (
          <Text variant="body-1" color="hint">
            {empty}
          </Text>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function Row({ name, value, sub }: { name: string; value: string; sub: string }) {
  return (
    <div className="metrics-row">
      <Text variant="body-1" ellipsis className="metrics-row__name">
        {name}
      </Text>
      <Text variant="body-1" className="num">
        {value}
      </Text>
      <Label size="xs" theme="unknown">
        {sub}
      </Label>
    </div>
  )
}
