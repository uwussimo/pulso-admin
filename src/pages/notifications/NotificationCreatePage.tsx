import {
  Alert,
  Button,
  Flex,
  Icon,
  Label,
  RadioGroup,
  SegmentedRadioGroup,
  Select,
  Switch,
  Text,
  TextArea,
  useToaster,
} from '@gravity-ui/uikit'
import { ArrowLeft, Bell, Check } from '@gravity-ui/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { notificationsApi } from '../../api/notifications'
import type {
  CreateNotificationResponse,
  Locale,
  LocaleMap,
  NotificationType,
  Platform,
  SendSummary,
  Target,
} from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { Field } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import {
  APP_ROUTES,
  BROADCAST_CONFIRM_PHRASE,
  LOCALES,
  NOTIFICATION_TYPES,
  PLATFORMS,
  TTL_OPTIONS,
  appRouteLabel,
  platformLabel,
} from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDuration, formatNumber, plural } from '../../lib/format'
import { LocaleFields } from './LocaleFields'
import { compactLocaleMap, pickLocale } from './locale'

type AudienceKind = 'all' | 'platform' | 'users' | 'tokens'

const AUDIENCE_OPTIONS: { value: AudienceKind; label: string; hint: string }[] = [
  { value: 'users', label: 'Конкретные пользователи', hint: 'По ID пользователей, через запятую или с новой строки.' },
  { value: 'platform', label: 'Одна платформа', hint: 'Все пользователи на iOS или на Android.' },
  { value: 'all', label: 'Всем', hint: 'Каждый пользователь приложения. Потребуется отдельное подтверждение.' },
  { value: 'tokens', label: 'Push-токены (для теста)', hint: 'Отправить на конкретные устройства, например своё.' },
]

function parseIds(raw: string): number[] {
  const out = new Set<number>()
  for (const part of raw.split(/[\s,;]+/)) {
    if (!part) continue
    const n = Number(part)
    if (Number.isInteger(n) && n > 0) out.add(n)
  }
  return [...out]
}

function parseTokens(raw: string): string[] {
  return [...new Set(raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))]
}

function PushSummaryView({ summary }: { summary: SendSummary }) {
  return (
    <div className="kv">
      <Text className="kv__key">Устройств найдено</Text>
      <Text className="num">{formatNumber(summary.resolved)}</Text>
      <Text className="kv__key">Отправлено</Text>
      <Text className="num">{formatNumber(summary.sent)}</Text>
      <Text className="kv__key">Не доставлено</Text>
      <Text className="num" color={summary.failed ? 'danger' : undefined}>
        {formatNumber(summary.failed)}
      </Text>
      <Text className="kv__key">Пропущено (отозванные токены)</Text>
      <Text className="num">{formatNumber(summary.skipped_revoked)}</Text>
    </div>
  )
}

export function NotificationCreatePage() {
  const navigate = useNavigate()
  const toaster = useToaster()
  const queryClient = useQueryClient()

  const [audienceKind, setAudienceKind] = useState<AudienceKind>('users')
  const [platform, setPlatform] = useState<Platform>('ios')
  const [idsRaw, setIdsRaw] = useState('')
  const [tokensRaw, setTokensRaw] = useState('')
  const [title, setTitle] = useState<LocaleMap>({})
  const [description, setDescription] = useState<LocaleMap>({})
  const [type, setType] = useState<NotificationType>(100)
  const [url, setUrl] = useState('')
  const [ttl, setTtl] = useState('')
  const [saveToFeed, setSaveToFeed] = useState(true)
  const [previewLocale, setPreviewLocale] = useState<Locale>('ru')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateNotificationResponse | { push: SendSummary; pushOnly: true } | null>(null)

  const ids = useMemo(() => parseIds(idsRaw), [idsRaw])
  const tokens = useMemo(() => parseTokens(tokensRaw), [tokensRaw])
  const cleanTitle = useMemo(() => compactLocaleMap(title), [title])
  const cleanDescription = useMemo(() => compactLocaleMap(description), [description])

  const missingLocales = LOCALES.filter((l) => !cleanTitle[l.key]).map((l) => l.short)

  const audienceReady =
    audienceKind === 'all' || audienceKind === 'platform' || (audienceKind === 'users' ? ids.length > 0 : tokens.length > 0)
  const readiness: { label: string; done: boolean }[] = [
    { label: 'Выбрана аудитория', done: audienceReady },
    { label: 'Заголовок на русском', done: Boolean(cleanTitle.ru) },
    { label: 'Текст на русском', done: Boolean(cleanDescription.ru) },
    { label: 'Узбекские версии', done: Boolean(cleanTitle.uz && cleanTitle.uzCyrl) },
  ]
  const requiredDone = readiness.slice(0, 2).every((r) => r.done)

  function buildTarget(): Target {
    switch (audienceKind) {
      case 'all':
        return { kind: 'all' }
      case 'platform':
        return { kind: 'platform', platform }
      case 'tokens':
        return { kind: 'tokens', push_tokens: tokens }
      case 'users':
        return ids.length === 1 ? { kind: 'user', user_id: ids[0] } : { kind: 'users', user_ids: ids }
    }
  }

  function validate(): string | null {
    if (!cleanTitle.ru) return 'Нужен заголовок на русском.'
    if (audienceKind === 'users' && ids.length === 0) return 'Укажите хотя бы один ID пользователя.'
    if (audienceKind === 'tokens' && tokens.length === 0) return 'Укажите хотя бы один push-токен.'
    if (!saveToFeed && !cleanDescription.ru) return 'Для разового пуша без ленты нужен текст на русском.'
    return null
  }

  const send = useMutation({
    mutationFn: async () => {
      const target = buildTarget()
      const ttlNum = ttl ? Number(ttl) : undefined
      if (saveToFeed) {
        return notificationsApi.create({
          title: cleanTitle,
          description: cleanDescription,
          type,
          url: url || undefined,
          ttl: ttlNum,
          target,
        })
      }
      const push = await notificationsApi.sendPush({
        title: cleanTitle.ru ?? '',
        body: cleanDescription.ru ?? '',
        title_i18n: cleanTitle,
        body_i18n: cleanDescription,
        url: url || undefined,
        ttl: ttlNum,
        target,
      })
      return { push, pushOnly: true as const }
    },
    onSuccess: (res) => {
      setConfirmOpen(false)
      setResult(res)
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if ('push_error' in res && res.push_error) {
        toaster.add({
          name: 'push-partial',
          theme: 'warning',
          title: 'Сохранено, но пуш не ушёл',
          content: 'Уведомление уже в ленте. Не отправляйте его повторно.',
          autoHiding: false,
        })
      } else {
        toaster.add({ name: 'push-sent', theme: 'success', title: 'Отправлено' })
      }
    },
    onError: (e) => {
      setConfirmOpen(false)
      setFormError(errorText(e))
    },
  })

  function onSendClick() {
    const err = validate()
    setFormError(err)
    if (err) return
    setConfirmOpen(true)
  }

  const audienceSummary = (() => {
    switch (audienceKind) {
      case 'all':
        return 'Всем пользователям приложения'
      case 'platform':
        return `Всем пользователям на ${platformLabel(platform)}`
      case 'users':
        return plural(ids.length, ['пользователю', 'пользователям', 'пользователям'])
      case 'tokens':
        return plural(tokens.length, ['устройству', 'устройствам', 'устройствам'])
    }
  })()

  if (result) {
    const created = 'notification' in result ? result : null
    const push = 'push' in result ? result.push : undefined
    const pushError = created?.push_error
    return (
      <>
        <PageHeader
          title={pushError ? 'Сохранено, пуш не ушёл' : 'Отправлено'}
          eyebrow={
            <Link to="/notifications" style={{ color: 'inherit' }}>
              <Icon data={ArrowLeft} size={12} /> К списку
            </Link>
          }
        />
        <Flex direction="column" gap={4} style={{ maxWidth: 640 }}>
          {pushError ? (
            <Alert
              theme="warning"
              title="Уведомление уже в ленте, но пуш не доставлен"
              message={`Ошибка: ${pushError}. Повторная отправка создаст дубликат у каждого получателя. Если пуш критичен, обратитесь к разработчикам.`}
            />
          ) : (
            <Alert theme="success" title={created ? 'Уведомление сохранено и пуш отправлен' : 'Пуш отправлен'} />
          )}
          {push ? (
            <div className="panel panel_filled">
              <div className="panel__body">
                <Text variant="subheader-2" as="div" style={{ marginBottom: 'var(--g-spacing-3)' }}>
                  Доставка
                </Text>
                <PushSummaryView summary={push} />
                {push.failed > 0 ? (
                  <Alert
                    theme="info"
                    style={{ marginTop: 'var(--g-spacing-3)' }}
                    message="Часть устройств не получила пуш: обычно это удалённые приложения или истёкшие токены. Это нормально."
                  />
                ) : null}
              </div>
            </div>
          ) : null}
          {created ? (
            <div className="panel panel_filled">
              <div className="panel__body kv">
                <Text className="kv__key">Аудитория</Text>
                <Text>{audienceSummary}</Text>
                <Text className="kv__key">Записей в ленте</Text>
                <Text className="num">
                  {created.targets_created ? formatNumber(created.targets_created) : 'одна общая (аудитория не хранится)'}
                </Text>
                <Text className="kv__key">ID уведомления</Text>
                <Text className="num">{created.notification.id}</Text>
              </div>
            </div>
          ) : null}
          <Flex gap={2}>
            {created ? (
              <Button view="action" size="l" onClick={() => navigate(`/notifications/${created.notification.id}`)}>
                Открыть уведомление
              </Button>
            ) : null}
            <Button size="l" onClick={() => navigate('/notifications')}>
              К списку
            </Button>
          </Flex>
        </Flex>
      </>
    )
  }

  const previewTitle = pickLocale(cleanTitle, previewLocale)
  const previewBody = pickLocale(cleanDescription, previewLocale)
  const previewIsFallback = Boolean(previewTitle) && !cleanTitle[previewLocale]

  return (
    <>
      <PageHeader
        title="Новая рассылка"
        eyebrow={
          <Link to="/notifications" style={{ color: 'inherit' }}>
            <Icon data={ArrowLeft} size={12} /> Уведомления
          </Link>
        }
        description="Выберите, кому отправить, напишите текст на трёх языках, проверьте превью и отправьте."
      />

      <Flex gap={6} alignItems="flex-start" wrap>
        <div className="form" style={{ flex: '1 1 520px', minWidth: 0 }}>
          {formError ? <Alert theme="danger" message={formError} onClose={() => setFormError(null)} /> : null}

          <div className="panel">
            <Text variant="subheader-2" className="panel__title" as="div">
              1. Кому
            </Text>
            <div className="panel__body form">
              <RadioGroup
                size="l"
                direction="vertical"
                value={audienceKind}
                onUpdate={(v) => setAudienceKind(v as AudienceKind)}
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <RadioGroup.Option key={o.value} value={o.value}>
                    <span>
                      {o.label}
                      <Text variant="caption-2" color="hint" as="div">
                        {o.hint}
                      </Text>
                    </span>
                  </RadioGroup.Option>
                ))}
              </RadioGroup>

              {audienceKind === 'platform' ? (
                <SegmentedRadioGroup size="l" value={platform} onUpdate={(v) => setPlatform(v as Platform)}>
                  {PLATFORMS.map((p) => (
                    <SegmentedRadioGroup.Option key={p.value} value={p.value}>
                      {p.label}
                    </SegmentedRadioGroup.Option>
                  ))}
                </SegmentedRadioGroup>
              ) : null}

              {audienceKind === 'users' ? (
                <Field
                  label="ID пользователей"
                  hint={ids.length ? `Распознано: ${plural(ids.length, ['пользователь', 'пользователя', 'пользователей'])}` : 'Например: 42, 77, 1050'}
                >
                  <TextArea size="l" minRows={2} maxRows={6} value={idsRaw} onUpdate={setIdsRaw} placeholder="42, 77, 1050" />
                </Field>
              ) : null}

              {audienceKind === 'tokens' ? (
                <Field label="Push-токены" hint={tokens.length ? `Распознано: ${plural(tokens.length, ['токен', 'токена', 'токенов'])}` : 'По одному в строке'}>
                  <TextArea size="l" minRows={2} maxRows={6} value={tokensRaw} onUpdate={setTokensRaw} />
                </Field>
              ) : null}

              {audienceKind === 'all' ? (
                <Alert
                  theme="warning"
                  title="Уйдёт каждому пользователю"
                  message="Отозвать пуш после отправки нельзя. Перед отправкой попросим ввести подтверждение."
                />
              ) : null}
            </div>
          </div>

          <div className="panel">
            <Text variant="subheader-2" className="panel__title" as="div">
              2. Что
            </Text>
            <div className="panel__body form">
              <LocaleFields title={title} description={description} onTitle={setTitle} onDescription={setDescription} />
              {missingLocales.length > 0 && cleanTitle.ru ? (
                <Alert
                  theme="info"
                  message={`Нет заголовка для: ${missingLocales.join(', ')}. Приложение покажет текст на другом языке — лучше заполнить все три.`}
                />
              ) : null}
            </div>
          </div>

          <div className="panel">
            <Text variant="subheader-2" className="panel__title" as="div">
              3. Как
            </Text>
            <div className="panel__body form">
              <div className="form__row">
                <Field label="Экран в приложении" help="Что откроется, когда пользователь нажмёт на пуш.">
                  <Select
                    size="l"
                    value={url ? [url] : ['']}
                    onUpdate={(v) => setUrl(v[0] ?? '')}
                    options={[{ value: '', content: 'Без перехода' }, ...APP_ROUTES.map((r) => ({ value: r.value, content: r.label }))]}
                  />
                </Field>
                <Field label="Тип" help="Числовой код типа из приложения. Названия типов пока не заданы.">
                  <Select
                    size="l"
                    value={[String(type)]}
                    onUpdate={(v) => setType(Number(v[0]) as NotificationType)}
                    options={NOTIFICATION_TYPES.map((t) => ({ value: String(t.value), content: t.label }))}
                  />
                </Field>
                <Field label="Срок доставки пуша" help="Если телефон выключен дольше этого срока, пуш не придёт. Запись в ленте остаётся.">
                  <Select size="l" value={[ttl]} onUpdate={(v) => setTtl(v[0] ?? '')} options={TTL_OPTIONS.map((t) => ({ value: t.value, content: t.label }))} />
                </Field>
              </div>
              <Switch size="l" checked={saveToFeed} onUpdate={setSaveToFeed}>
                Сохранить в ленту уведомлений
                <Text variant="caption-2" color="hint" as="div">
                  {saveToFeed
                    ? 'Пользователь увидит сообщение в приложении, а вы — статистику прочтений.'
                    : 'Только пуш, без записи в ленте. Подходит для теста на своём устройстве.'}
                </Text>
              </Switch>
            </div>
          </div>

          <Flex gap={2} alignItems="center">
            <Button view="action" size="xl" onClick={onSendClick} loading={send.isPending}>
              <Icon data={Bell} size={16} />
              {requiredDone ? 'Отправить' : 'Проверить и отправить'}
            </Button>
            <Button view="flat" size="xl" onClick={() => navigate('/notifications')}>
              Отмена
            </Button>
          </Flex>
        </div>

        <aside style={{ flex: '0 1 360px', position: 'sticky', top: 0 }}>
          <Flex direction="column" gap={3}>
            <Flex justifyContent="space-between" alignItems="center">
              <Text variant="subheader-2">Превью</Text>
              <SegmentedRadioGroup size="s" value={previewLocale} onUpdate={(v) => setPreviewLocale(v as Locale)}>
                {LOCALES.map((l) => (
                  <SegmentedRadioGroup.Option key={l.key} value={l.key}>
                    {l.short}
                  </SegmentedRadioGroup.Option>
                ))}
              </SegmentedRadioGroup>
            </Flex>
            <div className="phone-preview">
              <div className="phone-preview__push">
                <span className="phone-preview__icon">
                  <Icon data={Bell} size={18} />
                </span>
                <div className="phone-preview__text">
                  <Text variant="subheader-1" ellipsisLines={2}>
                    {previewTitle || <Text color="hint">Заголовок</Text>}
                  </Text>
                  <Text variant="body-1" color="secondary" ellipsisLines={4}>
                    {previewBody || <Text color="hint">Текст уведомления</Text>}
                  </Text>
                </div>
              </div>
              {previewIsFallback ? (
                <Text variant="caption-2" color="warning" as="div" style={{ marginTop: 'var(--g-spacing-2)' }}>
                  На этом языке текста нет, показан запасной.
                </Text>
              ) : null}
            </div>
            <ul className="checklist" aria-label="Готовность к отправке">
              {readiness.map((r) => (
                <li key={r.label} className="checklist__item">
                  <span className={['checklist__mark', r.done ? 'checklist__mark_done' : ''].join(' ')}>
                    {r.done ? <Icon data={Check} size={12} /> : null}
                  </span>
                  <Text variant="body-1" color={r.done ? 'primary' : 'secondary'}>
                    {r.label}
                  </Text>
                </li>
              ))}
            </ul>
            <div className="kv">
              <Text variant="body-1" className="kv__key">
                Кому
              </Text>
              <Text variant="body-1">{audienceSummary}</Text>
              <Text variant="body-1" className="kv__key">
                Откроет
              </Text>
              <Text variant="body-1">{appRouteLabel(url)}</Text>
              <Text variant="body-1" className="kv__key">
                В ленте
              </Text>
              <Text variant="body-1">{saveToFeed ? 'да' : 'нет, только пуш'}</Text>
            </div>
          </Flex>
        </aside>
      </Flex>

      <ConfirmDialog
        open={confirmOpen}
        title={audienceKind === 'all' ? 'Отправить всем пользователям?' : 'Отправить?'}
        confirmText={audienceKind === 'all' ? 'Отправить всем' : 'Отправить'}
        loading={send.isPending}
        typedPhrase={audienceKind === 'all' ? BROADCAST_CONFIRM_PHRASE : undefined}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => send.mutate()}
      >
        <Flex direction="column" gap={2}>
          <ConfirmLine label="Кому:" value={audienceSummary} />
          <ConfirmLine label="Заголовок:" value={cleanTitle.ru} />
          {cleanDescription.ru ? <ConfirmLine label="Текст:" value={cleanDescription.ru} /> : null}
          <ConfirmLine label="Откроет:" value={appRouteLabel(url)} />
          {ttl ? <ConfirmLine label="Срок доставки:" value={formatDuration(Number(ttl))} /> : null}
          <ConfirmLine label="В ленте:" value={saveToFeed ? 'да' : <Label theme="warning">нет, только пуш</Label>} />
          <Text variant="body-1" color="secondary">
            Пуш уйдёт сразу и отозвать его будет нельзя.
          </Text>
        </Flex>
      </ConfirmDialog>
    </>
  )
}
