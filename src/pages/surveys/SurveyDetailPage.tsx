import { Alert, Button, ClipboardButton, Flex, Icon, Label, Text, TextInput } from '@gravity-ui/uikit'
import { ChartColumn, Pencil } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { surveysApi } from '../../api/surveys'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { LOCALES, SURVEY_PUBLIC_PATH } from '../../lib/constants'
import { formatDateTime, formatNumber, formatSum } from '../../lib/format'
import { fieldTypeMeta } from '../../surveys/fieldTypes'
import { conditionSentence, pickText } from '../../surveys/schema'
import { pickLocale } from '../notifications/locale'
import { StatusActions } from './StatusActions'
import { SurveyStatusLabel } from './SurveyStatusLabel'

export function SurveyDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const back = 'Опросы'

  const query = useQuery({
    queryKey: ['surveys', 'detail', id],
    queryFn: ({ signal }) => surveysApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <>
        <PageHeader title="Опрос" eyebrow={back} />
        <Alert theme="danger" message="Некорректный адрес." />
      </>
    )
  }
  if (query.isPending) {
    return (
      <>
        <PageHeader title="Опрос" eyebrow={back} />
        <LoadingState />
      </>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title="Опрос" eyebrow={back} />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }

  const s = query.data
  const link = `${window.location.origin}${SURVEY_PUBLIC_PATH}/${s.id}`
  const fields = s.schema.fields

  return (
    <>
      <PageHeader
        title={pickLocale(s.title) || `Опрос #${s.id}`}
        eyebrow={back}
        description={`Создан ${formatDateTime(s.created_at)}${s.updated_at !== s.created_at ? ` · изменён ${formatDateTime(s.updated_at)}` : ''}`}
        actions={
          <>
            {s.status !== 'closed' ? (
              <Button size="l" onClick={() => navigate(`/surveys/${s.id}/edit`)}>
                <Icon data={Pencil} size={16} />
                Редактировать
              </Button>
            ) : null}
            <Button size="l" onClick={() => navigate(`/surveys/${s.id}/responses`)}>
              <Icon data={ChartColumn} size={16} />
              Ответы
            </Button>
            <StatusActions survey={s} afterDelete="/surveys" />
          </>
        }
      />

      <Flex gap={4} wrap alignItems="flex-start">
        <div className="form" style={{ flex: '1 1 480px', minWidth: 0 }}>
          <div className="panel">
            <Text variant="subheader-2" className="panel__title" as="div">
              О чём
            </Text>
            <div className="panel__body form">
              {s.cover_image_url ? (
                <img
                  src={s.cover_image_url}
                  alt=""
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    borderRadius: 'var(--g-border-radius-l)',
                  }}
                />
              ) : null}
              {LOCALES.map((l) => {
                const t = s.title[l.key]
                const d = s.description?.[l.key]
                return (
                  <div key={l.key}>
                    <Text variant="caption-2" color="hint" as="div">
                      {l.label}
                    </Text>
                    {t || d ? (
                      <>
                        <Text variant="subheader-1" as="div">
                          {t || <Text color="hint">без названия</Text>}
                        </Text>
                        {d ? (
                          <Text variant="body-2" as="div" style={{ whiteSpace: 'pre-wrap' }}>
                            {d}
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

          <div className="panel">
            <Text variant="subheader-2" className="panel__title" as="div">
              Вопросы · {formatNumber(fields.length)}
            </Text>
            <div className="panel__body">
              {fields.length === 0 ? (
                <Text color="hint">Вопросов пока нет.</Text>
              ) : (
                <ol className="qlist">
                  {fields.map((f, i) => {
                    const meta = fieldTypeMeta(f.type)
                    const cond = conditionSentence(fields, f.visibleWhen)
                    return (
                      <li key={f.id} className="qlist__item">
                        <Text variant="body-1" color="hint" className="num qlist__num">
                          {i + 1}
                        </Text>
                        <div className="cell-title">
                          <Text variant="subheader-1">
                            {pickText(f.label, 'ru') || <Text color="hint">без текста</Text>}
                          </Text>
                          <Flex gap={2} alignItems="center" wrap>
                            <Label theme="unknown" size="xs" icon={<Icon data={meta.icon} size={12} />}>
                              {meta.label}
                            </Label>
                            {f.required && f.type !== 'slide' ? (
                              <Text variant="caption-2" color="secondary">
                                обязательный
                              </Text>
                            ) : null}
                            <Text variant="caption-2" color="hint" className="num">
                              {f.key}
                            </Text>
                          </Flex>
                          {cond ? (
                            <Text variant="caption-2" color="secondary">
                              Показывать, если {cond}
                            </Text>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>

        <div className="form" style={{ flex: '0 1 360px', minWidth: 280 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Статус и сроки
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Статус</Text>
              <span>
                <SurveyStatusLabel status={s.status} isLive={s.is_live} />
              </span>
              <Text className="kv__key">Начало</Text>
              <Text className="num">{s.starts_at ? formatDateTime(s.starts_at) : 'сразу после запуска'}</Text>
              <Text className="kv__key">Окончание</Text>
              <Text className="num">{s.ends_at ? formatDateTime(s.ends_at) : 'бессрочно'}</Text>
              <Text className="kv__key">Награда</Text>
              <Text className="num">{s.reward_amount > 0 ? formatSum(s.reward_amount) : 'без начисления'}</Text>
              {s.closed_at ? (
                <>
                  <Text className="kv__key">Завершён</Text>
                  <Text className="num">{formatDateTime(s.closed_at)}</Text>
                </>
              ) : null}
              <Text className="kv__key">ID</Text>
              <Text className="num">{s.id}</Text>
            </div>
          </div>

          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Ответы
            </Text>
            <div className="panel__body kv">
              <Text className="kv__key">Прошли</Text>
              <Text className="num">{formatNumber(s.submissions_count)}</Text>
              <Text className="kv__key">Выплачено</Text>
              <Text className="num">{formatSum(s.reward_total)}</Text>
            </div>
            <div className="panel__body" style={{ paddingTop: 0 }}>
              <Button size="m" onClick={() => navigate(`/surveys/${s.id}/responses`)}>
                Открыть ответы и статистику
              </Button>
            </div>
          </div>

          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Ссылка для приложения
            </Text>
            <div className="panel__body form">
              <TextInput size="l" value={link} readOnly endContent={<ClipboardButton text={link} size="s" />} />
              <Text variant="caption-2" color="hint">
                Приложение само добавляет к ссылке <code>#token=…&amp;lang=…</code>. Открытая без токена, страница
                попросит зайти из приложения.
              </Text>
            </div>
          </div>
        </div>
      </Flex>
    </>
  )
}
