import { Alert, Icon, Text } from '@gravity-ui/uikit'
import { Lock } from '@gravity-ui/icons'
import type { Dispatch } from 'react'
import { plural } from '../../../lib/format'
import type { SchemaIssue, SurveyField } from '../../../surveys/schema'
import { AddQuestionMenu } from './AddQuestionMenu'
import type { EditorAction } from './editorReducer'
import { QuestionList } from './QuestionList'

interface Props {
  fields: SurveyField[]
  selectedId: string | null
  issues: SchemaIssue[]
  dispatch: Dispatch<EditorAction>
  locked?: boolean
}

export function QuestionsPanel({ fields, selectedId, issues, dispatch, locked }: Props) {
  return (
    <div className="panel">
      <Text
        variant="subheader-2"
        className="panel__title"
        as="div"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        2. Вопросы
        {locked ? <Icon data={Lock} size={16} /> : null}
        <Text variant="body-1" color="hint" style={{ marginLeft: 'auto' }}>
          {plural(fields.length, ['вопрос', 'вопроса', 'вопросов'])}
        </Text>
      </Text>
      <div className="panel__body form">
        {locked ? (
          <Alert
            theme="warning"
            message="По опросу уже есть ответы: вопросы и варианты заблокированы, чтобы статистика осталась сопоставимой. Тексты, обложку и срок окончания менять можно."
          />
        ) : null}
        {fields.length === 0 ? (
          <Text variant="body-2" color="secondary">
            Пользователь увидит вопросы по одному на экран, в этом порядке. Начните с первого.
          </Text>
        ) : null}
        <QuestionList fields={fields} selectedId={selectedId} issues={issues} dispatch={dispatch} locked={locked} />
        {!locked ? (
          <div>
            <AddQuestionMenu onAdd={(fieldType) => dispatch({ type: 'addField', fieldType })} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
