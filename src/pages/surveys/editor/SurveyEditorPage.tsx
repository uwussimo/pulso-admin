import { Alert, Button, Flex, Text, useToaster } from '@gravity-ui/uikit'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { surveysApi } from '../../../api/surveys'
import type { Survey } from '../../../api/types'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { PageHeader } from '../../../components/PageHeader'
import { ErrorState, LoadingState } from '../../../components/States'
import { errorText } from '../../../lib/errors'
import { pickLocale } from '../../notifications/locale'
import { SurveyStatusLabel } from '../SurveyStatusLabel'
import { AboutPanel } from './AboutPanel'
import { toWriteRequest, validateMeta } from './editorReducer'
import { EditorPreview } from './EditorPreview'
import { QuestionsPanel } from './QuestionsPanel'
import { RewardPanel } from './RewardPanel'
import { useSurveyEditor } from './useSurveyEditor'

export function SurveyEditorPage() {
  const { id: idParam } = useParams()
  const id = idParam ? Number(idParam) : null
  const isEdit = id !== null
  const navigate = useNavigate()
  const toaster = useToaster()

  const query = useQuery({
    queryKey: ['surveys', 'detail', id],
    queryFn: ({ signal }) => surveysApi.get(id ?? 0, signal),
    enabled: isEdit && Number.isInteger(id) && (id ?? 0) > 0,
  })

  useEffect(() => {
    if (query.data?.status === 'closed') {
      toaster.add({ name: 'survey-closed', theme: 'info', title: 'Завершённый опрос нельзя редактировать' })
      navigate(`/surveys/${query.data.id}`, { replace: true })
    }
  }, [query.data, navigate, toaster])

  if (isEdit && (!Number.isInteger(id) || (id ?? 0) <= 0)) {
    return (
      <>
        <PageHeader title="Опрос" eyebrow="Опросы" />
        <Alert theme="danger" message="Некорректный адрес." />
      </>
    )
  }
  if (isEdit && query.isPending) {
    return (
      <>
        <PageHeader title="Редактирование" eyebrow="Опросы" />
        <LoadingState />
      </>
    )
  }
  if (isEdit && query.isError) {
    return (
      <>
        <PageHeader title="Редактирование" eyebrow="Опросы" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    )
  }
  // Keyed by id + updated_at so a fresh fetch after save resets the editor from the server copy.
  const survey = isEdit ? (query.data ?? null) : null
  return <EditorBody key={survey ? `${survey.id}:${survey.updated_at}` : 'new'} survey={survey} />
}

function EditorBody({ survey }: { survey: Survey | null }) {
  const navigate = useNavigate()
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const { state, dispatch, issues, publishIssues } = useSurveyEditor(survey)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const locked = Boolean(survey && survey.submissions_count > 0)
  const startLocked = Boolean(survey && survey.status === 'active')

  const save = useMutation({
    mutationFn: () => {
      const metaError = validateMeta(state.meta)
      if (metaError) throw new Error(metaError)
      if (issues.length) {
        dispatch({ type: 'select', id: issues[0].fieldId ?? null })
        throw new Error(
          issues
            .slice(0, 3)
            .map((i) => i.message)
            .join(' · '),
        )
      }
      const body = toWriteRequest(state)
      return survey ? surveysApi.update(survey.id, body) : surveysApi.create(body)
    },
    onSuccess: (saved) => {
      setFormError(null)
      toaster.add({ name: 'survey-saved', theme: 'success', title: survey ? 'Сохранено' : 'Опрос создан' })
      void queryClient.invalidateQueries({ queryKey: ['surveys'] })
      if (!survey) navigate(`/surveys/${saved.id}`, { replace: true })
      else dispatch({ type: 'saved', survey: saved })
    },
    onError: (e) => setFormError(errorText(e)),
  })

  const back = () => navigate(survey ? `/surveys/${survey.id}` : '/surveys')

  return (
    <>
      <PageHeader
        title={survey ? pickLocale(survey.title) || `Опрос #${survey.id}` : 'Новый опрос'}
        eyebrow="Опросы"
        description={
          survey ? (
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <SurveyStatusLabel status={survey.status} isLive={survey.is_live} />
              {survey.submissions_count ? `· ответов: ${survey.submissions_count}` : null}
            </span>
          ) : (
            'Опишите опрос, соберите вопросы и укажите награду. Сохранённый опрос остаётся черновиком до запуска.'
          )
        }
      />

      <Flex gap={6} alignItems="flex-start" wrap>
        <div className="form" style={{ flex: '1 1 560px', minWidth: 0 }}>
          {formError ? <Alert theme="danger" message={formError} onClose={() => setFormError(null)} /> : null}
          {survey?.status === 'active' ? (
            <Alert theme="info" message="Опрос активен и виден пользователям. Изменения текста применяются сразу." />
          ) : null}

          <AboutPanel meta={state.meta} dispatch={dispatch} />
          <QuestionsPanel
            fields={state.fields}
            selectedId={state.selectedId}
            issues={issues}
            dispatch={dispatch}
            locked={locked}
          />
          <RewardPanel meta={state.meta} dispatch={dispatch} rewardLocked={locked} startLocked={startLocked} />

          <Flex gap={2} alignItems="center">
            <Button view="action" size="xl" onClick={() => save.mutate()} loading={save.isPending}>
              {survey ? 'Сохранить' : 'Создать опрос'}
            </Button>
            <Button
              view="flat"
              size="xl"
              onClick={() => (state.dirty ? setCancelOpen(true) : back())}
              disabled={save.isPending}
            >
              Отмена
            </Button>
            {state.dirty ? (
              <Text variant="body-1" color="hint">
                есть несохранённые изменения
              </Text>
            ) : null}
          </Flex>
        </div>

        <EditorPreview state={state} publishIssues={publishIssues} />
      </Flex>

      <ConfirmDialog
        open={cancelOpen}
        title="Выйти без сохранения?"
        confirmText="Выйти"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={back}
      >
        <Text variant="body-2">Несохранённые изменения будут потеряны.</Text>
      </ConfirmDialog>
    </>
  )
}
