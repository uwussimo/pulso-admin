import { NumberInput, Switch, Text, TextInput } from '@gravity-ui/uikit'
import type { Dispatch } from 'react'
import { Field } from '../../../components/Field'
import { LocaleFields } from '../../notifications/LocaleFields'
import {
  IMAGE_MAX_FILES,
  RATING_MAX_MAX,
  RATING_MIN_MAX,
  TEXTAREA_MAX,
  TEXT_MAX,
  type SchemaIssue,
  type SurveyField,
} from '../../../surveys/schema'
import { ChoicesEditor } from './ChoicesEditor'
import { ConditionEditor } from './ConditionEditor'
import type { EditorAction } from './editorReducer'
import { SlidesEditor } from './SlidesEditor'

interface Props {
  field: SurveyField
  fields: SurveyField[]
  issues: SchemaIssue[]
  dispatch: Dispatch<EditorAction>
  locked?: boolean
}

export function QuestionEditor({ field, fields, issues, dispatch, locked }: Props) {
  const patch = (p: Partial<SurveyField>) => dispatch({ type: 'updateField', id: field.id, patch: p })
  const issueFor = (path: SchemaIssue['path']) => issues.find((i) => i.fieldId === field.id && i.path === path)?.message
  const isSlide = field.type === 'slide'

  return (
    <div className="question-editor form">
      <LocaleFields
        title={field.label}
        description={field.help ?? {}}
        onTitle={(label) => patch({ label })}
        onDescription={(help) => patch({ help })}
        titleLabel={isSlide ? 'Заголовок' : 'Вопрос'}
        descriptionLabel="Подсказка"
        plainDescription
        titlePlaceholder={isSlide ? 'Например: Посмотрите презентацию' : 'Например: Как часто вы покупаете витамины?'}
        hideDescription={isSlide}
        disabled={locked}
      />

      <div className="form__row">
        <Field
          label="Ключ для аналитики"
          hint={issueFor('key') ?? 'Латиница, цифры и _. Следует за русским текстом, пока вы его не измените.'}
        >
          <TextInput
            size="l"
            value={field.key}
            onUpdate={(key) => {
              dispatch({ type: 'markKeyTouched', id: field.id })
              patch({ key: key.toLowerCase() })
            }}
            validationState={issueFor('key') ? 'invalid' : undefined}
            controlProps={{ style: { fontFamily: 'var(--g-font-family-monospace)' } }}
            disabled={locked}
          />
        </Field>
        {!isSlide ? (
          <Field label="Обязательность">
            <div style={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
              <Switch
                size="l"
                checked={Boolean(field.required)}
                onUpdate={(required) => patch({ required })}
                disabled={locked}
              >
                Обязательный вопрос
              </Switch>
            </div>
          </Field>
        ) : null}
      </div>

      <TypeSpecific field={field} patch={patch} issueFor={issueFor} locked={locked} />

      <ConditionEditor
        field={field}
        fields={fields}
        onChange={(visibleWhen) => patch({ visibleWhen })}
        disabled={locked}
      />
      {issueFor('visibleWhen') ? (
        <Text variant="caption-2" color="danger">
          {issueFor('visibleWhen')}
        </Text>
      ) : null}
    </div>
  )
}

function TypeSpecific({
  field,
  patch,
  issueFor,
  locked,
}: {
  field: SurveyField
  patch: (p: Partial<SurveyField>) => void
  issueFor: (path: SchemaIssue['path']) => string | undefined
  locked?: boolean
}) {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const cap = field.type === 'text' ? TEXT_MAX : TEXTAREA_MAX
      return (
        <div className="form">
          <div className="form__row">
            <Field label="Максимум символов" hint={issueFor('range') ?? `Пусто — до ${cap}.`}>
              <NumberInput
                size="l"
                min={1}
                max={cap}
                value={field.maxLength ?? null}
                onUpdate={(v) => patch({ maxLength: v ?? undefined })}
                disabled={locked}
              />
            </Field>
          </div>
          <LocaleFields
            title={field.placeholder ?? {}}
            description={{}}
            onTitle={(placeholder) => patch({ placeholder })}
            onDescription={() => {}}
            titleLabel="Подсказка в поле"
            titlePlaceholder="Например: Напишите пару слов"
            hideDescription
            disabled={locked}
          />
        </div>
      )
    }
    case 'number':
      return (
        <div className="form__row">
          <Field label="Минимум" hint={issueFor('range')}>
            <NumberInput
              size="l"
              allowDecimal
              value={field.min ?? null}
              onUpdate={(v) => patch({ min: v ?? undefined })}
              disabled={locked}
            />
          </Field>
          <Field label="Максимум">
            <NumberInput
              size="l"
              allowDecimal
              value={field.max ?? null}
              onUpdate={(v) => patch({ max: v ?? undefined })}
              disabled={locked}
            />
          </Field>
          <Field label="Шаг">
            <NumberInput
              size="l"
              allowDecimal
              min={0}
              value={field.step ?? null}
              onUpdate={(v) => patch({ step: v ?? undefined })}
              disabled={locked}
            />
          </Field>
        </div>
      )
    case 'rating':
      return (
        <div className="form__row">
          <Field label="Звёзд в шкале" hint={issueFor('rating') ?? `От ${RATING_MIN_MAX} до ${RATING_MAX_MAX}`}>
            <NumberInput
              size="l"
              min={RATING_MIN_MAX}
              max={RATING_MAX_MAX}
              value={field.max}
              onUpdate={(v) => patch({ max: v ?? 5 })}
              validationState={issueFor('rating') ? 'invalid' : undefined}
              disabled={locked}
            />
          </Field>
        </div>
      )
    case 'nps':
      return (
        <Text variant="body-1" color="secondary">
          Шкала 0–10, стандартный NPS. Промоутеры 9–10, критики 0–6.
        </Text>
      )
    case 'single_choice':
      return (
        <>
          <ChoicesEditor options={field.options} onChange={(options) => patch({ options })} disabled={locked} />
          {issueFor('options') ? (
            <Text variant="caption-2" color="danger">
              {issueFor('options')}
            </Text>
          ) : null}
        </>
      )
    case 'multi_choice':
      return (
        <>
          <ChoicesEditor options={field.options} onChange={(options) => patch({ options })} disabled={locked} />
          {issueFor('options') ? (
            <Text variant="caption-2" color="danger">
              {issueFor('options')}
            </Text>
          ) : null}
          <div className="form__row">
            <Field label="Минимум выборов" hint={issueFor('range')}>
              <NumberInput
                size="l"
                min={0}
                value={field.min ?? null}
                onUpdate={(v) => patch({ min: v ?? undefined })}
                disabled={locked}
              />
            </Field>
            <Field label="Максимум выборов">
              <NumberInput
                size="l"
                min={1}
                value={field.max ?? null}
                onUpdate={(v) => patch({ max: v ?? undefined })}
                disabled={locked}
              />
            </Field>
          </div>
        </>
      )
    case 'yes_no':
      return null
    case 'date':
      return (
        <div className="form__row">
          <Field label="Не раньше" hint={issueFor('range')}>
            <TextInput
              size="l"
              value={field.minDate ?? ''}
              onUpdate={(v) => patch({ minDate: v || undefined })}
              controlProps={{ type: 'date' }}
              disabled={locked}
            />
          </Field>
          <Field label="Не позже">
            <TextInput
              size="l"
              value={field.maxDate ?? ''}
              onUpdate={(v) => patch({ maxDate: v || undefined })}
              controlProps={{ type: 'date' }}
              disabled={locked}
            />
          </Field>
        </div>
      )
    case 'image_upload':
      return (
        <div className="form__row">
          <Field
            label="Максимум фото"
            hint={issueFor('range') ?? `От 1 до ${IMAGE_MAX_FILES}. Пользователь загружает их прямо из приложения.`}
          >
            <NumberInput
              size="l"
              min={1}
              max={IMAGE_MAX_FILES}
              value={field.maxFiles}
              onUpdate={(v) => patch({ maxFiles: v ?? 1 })}
              disabled={locked}
            />
          </Field>
        </div>
      )
    case 'slide':
      return (
        <>
          <SlidesEditor slides={field.slides} onChange={(slides) => patch({ slides })} disabled={locked} />
          {issueFor('slides') ? (
            <Text variant="caption-2" color="danger">
              {issueFor('slides')}
            </Text>
          ) : null}
        </>
      )
  }
}
