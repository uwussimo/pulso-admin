import { Button, Icon, Label, Text } from '@gravity-ui/uikit'
import { ArrowDown, ArrowUp, Copy, TrashBin } from '@gravity-ui/icons'
import type { Dispatch } from 'react'
import { fieldTypeMeta } from '../../../surveys/fieldTypes'
import { pickText, type SchemaIssue, type SurveyField } from '../../../surveys/schema'
import type { EditorAction } from './editorReducer'
import { QuestionEditor } from './QuestionEditor'

interface Props {
  fields: SurveyField[]
  selectedId: string | null
  issues: SchemaIssue[]
  dispatch: Dispatch<EditorAction>
  locked?: boolean
}

export function QuestionList({ fields, selectedId, issues, dispatch, locked }: Props) {
  return (
    <div className="form" style={{ gap: 'var(--g-spacing-2)' }}>
      {fields.map((f, i) => {
        const meta = fieldTypeMeta(f.type)
        const selected = f.id === selectedId
        const broken = issues.some((x) => x.fieldId === f.id)
        const label = pickText(f.label, 'ru')
        return (
          <div key={f.id} className="form" style={{ gap: 'var(--g-spacing-2)' }}>
            <div className={['question-row', selected ? 'question-row_selected' : ''].join(' ')}>
              <Text variant="body-1" color="hint" className="num question-row__num">
                {i + 1}
              </Text>
              <div
                className="question-row__text"
                role="button"
                tabIndex={0}
                aria-expanded={selected}
                onClick={() => dispatch({ type: 'select', id: selected ? null : f.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    dispatch({ type: 'select', id: selected ? null : f.id })
                  }
                }}
              >
                <Text variant="subheader-1" ellipsis>
                  {label || <Text color="hint">Без текста</Text>}
                </Text>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Label theme="unknown" size="xs" icon={<Icon data={meta.icon} size={12} />}>
                    {meta.label}
                  </Label>
                  {f.required && f.type !== 'slide' ? (
                    <Text variant="caption-2" color="secondary">
                      обязательный
                    </Text>
                  ) : null}
                  {f.visibleWhen ? (
                    <Text variant="caption-2" color="secondary">
                      с условием
                    </Text>
                  ) : null}
                  {broken ? (
                    <Text variant="caption-2" color="danger">
                      есть ошибки
                    </Text>
                  ) : null}
                </div>
              </div>
              {!locked ? (
                <div className="question-row__actions">
                  <Button
                    view="flat"
                    size="m"
                    aria-label="Выше"
                    disabled={i === 0}
                    onClick={() => dispatch({ type: 'moveField', id: f.id, dir: -1 })}
                  >
                    <Icon data={ArrowUp} size={16} />
                  </Button>
                  <Button
                    view="flat"
                    size="m"
                    aria-label="Ниже"
                    disabled={i === fields.length - 1}
                    onClick={() => dispatch({ type: 'moveField', id: f.id, dir: 1 })}
                  >
                    <Icon data={ArrowDown} size={16} />
                  </Button>
                  <Button
                    view="flat"
                    size="m"
                    aria-label="Дублировать"
                    onClick={() => dispatch({ type: 'duplicateField', id: f.id })}
                  >
                    <Icon data={Copy} size={16} />
                  </Button>
                  <Button
                    view="flat-danger"
                    size="m"
                    aria-label="Удалить"
                    onClick={() => dispatch({ type: 'removeField', id: f.id })}
                  >
                    <Icon data={TrashBin} size={16} />
                  </Button>
                </div>
              ) : null}
            </div>
            {selected ? (
              <QuestionEditor field={f} fields={fields} issues={issues} dispatch={dispatch} locked={locked} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
