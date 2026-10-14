import { Alert, Button, DropdownMenu, Icon, Text, useToaster } from '@gravity-ui/uikit'
import { Ellipsis, TrashBin } from '@gravity-ui/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { surveysApi } from '../../api/surveys'
import type { Survey, SurveyListItem, SurveyStatus } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { SURVEY_TRANSITIONS, surveyStatusMeta, type SurveyTransition } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { formatDateTime, formatSum } from '../../lib/format'
import { pickLocale } from '../notifications/locale'
import { validateSchema } from '../../surveys/schema'

interface Props {
  survey: SurveyListItem | Survey
  /** Where to go after a delete. */
  afterDelete?: string
  compact?: boolean
}

const EFFECTS: Record<SurveyStatus, (s: SurveyListItem) => string> = {
  active: (s) =>
    `Опрос появится у всех пользователей в приложении${s.ends_at ? ` до ${formatDateTime(s.ends_at)}` : ''}. ${
      s.reward_amount > 0
        ? `За каждое прохождение будет начисляться ${formatSum(s.reward_amount)}.`
        : 'Награда не начисляется.'
    }`,
  pending: (s) =>
    `Опрос станет виден в приложении ${s.starts_at ? formatDateTime(s.starts_at) : '—'} (время Ташкента). До этого его можно править.`,
  draft: () => 'Опрос уйдёт из расписания и вернётся в черновики. Пользователи его не увидят.',
  closed: () => 'Новые ответы приниматься не будут, опрос пропадёт из приложения. Вернуть в активные нельзя.',
}

export function StatusActions({ survey, afterDelete, compact }: Props) {
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [pending, setPending] = useState<SurveyTransition | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [preflight, setPreflight] = useState<string | null>(null)

  const transitions = SURVEY_TRANSITIONS[survey.status]
  const canDelete = survey.status !== 'active'
  const full = 'schema' in survey ? (survey as Survey) : null

  const setStatus = useMutation({
    mutationFn: (to: SurveyStatus) => surveysApi.setStatus(survey.id, to),
    onSuccess: (_, to) => {
      toaster.add({ name: 'survey-status', theme: 'success', title: `Статус: ${surveyStatusMeta(to).label}` })
      setPending(null)
      void queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
    onError: (e) =>
      toaster.add({
        name: 'survey-status-error',
        theme: 'danger',
        title: 'Не удалось сменить статус',
        content: errorText(e),
      }),
  })

  const remove = useMutation({
    mutationFn: () => surveysApi.remove(survey.id),
    onSuccess: () => {
      toaster.add({ name: 'survey-deleted', theme: 'success', title: 'Опрос удалён' })
      setDeleting(false)
      void queryClient.invalidateQueries({ queryKey: ['surveys'] })
      if (afterDelete) navigate(afterDelete, { replace: true })
    },
    onError: (e) =>
      toaster.add({ name: 'survey-delete-error', theme: 'danger', title: 'Не удалось удалить', content: errorText(e) }),
  })

  function start(tr: SurveyTransition) {
    setPreflight(null)
    if (tr.to === 'active' || tr.to === 'pending') {
      if (!survey.title.ru?.trim()) {
        setPreflight('Нужно название на русском.')
        return
      }
      if (full) {
        const issues = validateSchema(full.schema, true)
        if (issues.length) {
          setPreflight(issues[0].message)
          return
        }
      }
      if (tr.needsStart && (!survey.starts_at || new Date(survey.starts_at).getTime() <= Date.now())) {
        setPreflight('Чтобы запланировать, укажите дату начала в будущем в редакторе.')
        return
      }
    }
    setPending(tr)
  }

  const primary = transitions[0]
  const secondary = transitions.slice(1)

  return (
    <>
      {primary ? (
        <Button
          view={primary.danger ? 'outlined-danger' : 'action'}
          size={compact ? 'm' : 'l'}
          onClick={() => start(primary)}
        >
          {primary.label}
        </Button>
      ) : null}
      {secondary.length || canDelete ? (
        <DropdownMenu
          size={compact ? 'm' : 'l'}
          renderSwitcher={(props) => (
            <Button {...props} view="outlined" size={compact ? 'm' : 'l'} aria-label="Ещё">
              <Icon data={Ellipsis} size={16} />
            </Button>
          )}
          items={[
            ...secondary.map((tr) => ({
              text: tr.label,
              theme: tr.danger ? ('danger' as const) : undefined,
              action: () => start(tr),
            })),
            ...(canDelete
              ? [
                  {
                    text: 'Удалить',
                    theme: 'danger' as const,
                    iconStart: <Icon data={TrashBin} size={16} />,
                    action: () => setDeleting(true),
                  },
                ]
              : []),
          ]}
        />
      ) : null}

      {preflight ? (
        <Alert
          theme="warning"
          title="Пока нельзя запустить"
          message={preflight}
          onClose={() => setPreflight(null)}
          actions={
            <Button size="m" onClick={() => navigate(`/surveys/${survey.id}/edit`)}>
              Открыть редактор
            </Button>
          }
          style={{ flexBasis: '100%' }}
        />
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `${pending.label}?` : ''}
        confirmText={pending?.label ?? ''}
        danger={pending?.danger}
        loading={setStatus.isPending}
        onClose={() => setPending(null)}
        onConfirm={() => pending && setStatus.mutate(pending.to)}
      >
        {pending ? (
          <>
            <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
              {EFFECTS[pending.to](survey)}
            </Text>
            <ConfirmLine label="Опрос:" value={pickLocale(survey.title) || `#${survey.id}`} />
          </>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting}
        title="Удалить опрос?"
        confirmText="Удалить"
        danger
        loading={remove.isPending}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
      >
        <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
          Опрос пропадёт из панели и приложения. Уже полученные ответы и начисления остаются в базе.
        </Text>
        <ConfirmLine label="Опрос:" value={pickLocale(survey.title) || `#${survey.id}`} />
      </ConfirmDialog>
    </>
  )
}
