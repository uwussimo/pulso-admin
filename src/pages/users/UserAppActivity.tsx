import { Alert, Button, Icon, Label, Link as UiLink, Text } from '@gravity-ui/uikit'
import { ArrowUpRightFromSquare } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '../../api/metrics'
import { isApiError } from '../../api/client'
import type { UserMetrics } from '../../api/types'
import { LoadingState } from '../../components/States'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatNumber, plural } from '../../lib/format'

const EVENT_LABELS: Record<string, string> = {
  $screen: 'Экран',
  'Application Opened': 'Открыл приложение',
  'Application Installed': 'Установил приложение',
  'Application Updated': 'Обновил приложение',
  $exception: 'Ошибка',
  $identify: 'Вошёл в аккаунт',
}

/**
 * Everything PostHog knows about this user: device, activity, last events.
 * The app identifies people by profile id, so the admin id is the key.
 */
export function UserAppActivity({ userId }: { userId: number }) {
  const query = useQuery({
    queryKey: ['metrics', 'user', userId],
    queryFn: ({ signal }) => metricsApi.user(userId, signal),
    staleTime: 60_000,
    retry: (count, e) => !(isApiError(e) && (e.status === 503 || e.status === 502)) && count < 1,
  })

  const notConfigured = query.isError && isApiError(query.error) && query.error.alias === 'metrics.not_configured'

  return (
    <div className="panel panel_filled">
      <Text variant="subheader-2" className="panel__title" as="div">
        В приложении
      </Text>
      {query.isError ? (
        <div className="panel__body">
          <Alert
            theme={notConfigured ? 'info' : 'warning'}
            message={notConfigured ? 'Аналитика приложения не подключена.' : errorText(query.error)}
            actions={
              notConfigured ? undefined : (
                <Button size="s" onClick={() => void query.refetch()}>
                  Повторить
                </Button>
              )
            }
            layout="horizontal"
          />
        </div>
      ) : query.isPending ? (
        <LoadingState label="Смотрим события…" />
      ) : !query.data.seen ? (
        <div className="panel__body">
          <Text variant="body-2" color="hint">
            PostHog ещё не видел этого пользователя: приложение не отправляло событий с его аккаунта.
          </Text>
        </div>
      ) : (
        <Body d={query.data} />
      )}
    </div>
  )
}

function Body({ d }: { d: UserMetrics }) {
  const device = [d.device.device_name, d.device.os && `${d.device.os} ${d.device.os_version ?? ''}`.trim()]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <div className="panel__body kv">
        <Text className="kv__key">Последний раз</Text>
        <Text className="num">{d.last_seen ? formatDateTime(d.last_seen) : '—'}</Text>
        <Text className="kv__key">Впервые</Text>
        <Text className="num">{d.first_seen ? formatDateTime(d.first_seen) : '—'}</Text>
        <Text className="kv__key">Версия</Text>
        <Text className="num">{d.device.app_version ?? '—'}</Text>
        <Text className="kv__key">Устройство</Text>
        <Text>{device || '—'}</Text>
        <Text className="kv__key">Открытий</Text>
        <Text className="num">
          {formatNumber(d.opens)}
          <Text color="hint"> · {plural(d.screen_views, ['экран', 'экрана', 'экранов'])}</Text>
        </Text>
        <Text className="kv__key">Ошибки</Text>
        <Text className="num" color={d.errors > 0 ? 'danger' : undefined}>
          {d.errors > 0 ? formatNumber(d.errors) : 'не было'}
        </Text>
        <Text className="kv__key">Записи сессий</Text>
        <Text className="num">{d.replays > 0 ? formatNumber(d.replays) : 'нет'}</Text>
        <Text className="kv__key">KYC в приложении</Text>
        <Text color={d.person.is_verified ? 'positive' : 'secondary'}>
          {d.person.is_verified ? 'Пройден' : 'Не пройден'}
        </Text>
      </div>

      {d.top_screens.length > 0 ? (
        <div className="panel__body" style={{ paddingTop: 0 }}>
          <Text variant="caption-2" color="hint" as="div" style={{ marginBottom: 'var(--g-spacing-1)' }}>
            Чаще всего открывает
          </Text>
          <div className="chips">
            {d.top_screens.map((s) => (
              <Label key={s.name} theme="unknown" size="s">
                {s.name} · {formatNumber(s.views)}
              </Label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="panel__body" style={{ paddingTop: 0 }}>
        <Text variant="caption-2" color="hint" as="div" style={{ marginBottom: 'var(--g-spacing-1)' }}>
          Последние события
        </Text>
        <ol className="timeline">
          {d.recent.map((e, i) => (
            <li key={`${e.at}-${i}`} className="timeline__item">
              <Text variant="caption-2" color="hint" className="num timeline__time" whiteSpace="nowrap">
                {formatDateTime(e.at)}
              </Text>
              <Text
                variant="body-1"
                ellipsis
                className="timeline__text"
                color={e.event === '$exception' ? 'danger' : undefined}
              >
                {EVENT_LABELS[e.event] ?? e.event}
                {e.screen ? ` ${e.screen}` : ''}
                {e.error ? `: ${e.error}` : ''}
              </Text>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel__body" style={{ paddingTop: 0 }}>
        <UiLink href={d.posthog_url} target="_blank" rel="noopener noreferrer" view="normal">
          Открыть в PostHog <Icon data={ArrowUpRightFromSquare} size={12} />
        </UiLink>
      </div>
    </>
  )
}
