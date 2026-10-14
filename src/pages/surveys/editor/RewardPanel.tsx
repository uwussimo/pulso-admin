import { NumberInput, Switch, Text, TextInput } from '@gravity-ui/uikit'
import type { Dispatch } from 'react'
import { Field } from '../../../components/Field'
import { tashkentNowLocalInput } from '../../../lib/format'
import type { EditorAction, EditorMeta } from './editorReducer'

interface Props {
  meta: EditorMeta
  dispatch: Dispatch<EditorAction>
  rewardLocked?: boolean
  startLocked?: boolean
  disabled?: boolean
}

export function RewardPanel({ meta, dispatch, rewardLocked, startLocked, disabled }: Props) {
  const set = (patch: Partial<EditorMeta>) => dispatch({ type: 'setMeta', patch })
  return (
    <div className="panel">
      <Text variant="subheader-2" className="panel__title" as="div">
        3. Награда и сроки
      </Text>
      <div className="panel__body form">
        <Field
          label="Награда за прохождение, сум"
          hint={
            rewardLocked
              ? 'По опросу уже есть ответы — награду менять нельзя.'
              : '0 — без начисления, просто «спасибо». Начисляется сразу после отправки ответов.'
          }
        >
          <NumberInput
            size="l"
            min={0}
            step={500}
            value={meta.rewardAmount}
            onUpdate={(v) => set({ rewardAmount: v })}
            disabled={disabled || rewardLocked}
            style={{ maxWidth: 260 }}
          />
        </Field>

        <div className="form__row">
          <div className="form" style={{ gap: 'var(--g-spacing-2)' }}>
            <Switch
              size="l"
              checked={meta.scheduled}
              onUpdate={(v) =>
                set({ scheduled: v, startsAt: v && !meta.startsAt ? tashkentNowLocalInput(60) : meta.startsAt })
              }
              disabled={disabled || startLocked}
            >
              Запустить по расписанию
            </Switch>
            {meta.scheduled ? (
              <Field
                label="Начало (время Ташкента)"
                hint="Опрос станет виден в приложении в этот момент после перевода в «Запланирован»."
              >
                <TextInput
                  size="l"
                  value={meta.startsAt}
                  onUpdate={(startsAt) => set({ startsAt })}
                  controlProps={{ type: 'datetime-local' }}
                  disabled={disabled || startLocked}
                />
              </Field>
            ) : null}
          </div>
          <div className="form" style={{ gap: 'var(--g-spacing-2)' }}>
            <Switch
              size="l"
              checked={meta.autoClose}
              onUpdate={(v) =>
                set({ autoClose: v, endsAt: v && !meta.endsAt ? tashkentNowLocalInput(7 * 24 * 60) : meta.endsAt })
              }
              disabled={disabled}
            >
              Скрыть автоматически
            </Switch>
            {meta.autoClose ? (
              <Field
                label="Окончание (время Ташкента)"
                hint="После этого момента опрос пропадёт из приложения; завершить его нужно вручную."
              >
                <TextInput
                  size="l"
                  value={meta.endsAt}
                  onUpdate={(endsAt) => set({ endsAt })}
                  controlProps={{ type: 'datetime-local' }}
                  disabled={disabled}
                />
              </Field>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
