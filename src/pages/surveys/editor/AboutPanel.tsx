import { Text } from '@gravity-ui/uikit'
import type { Dispatch } from 'react'
import { LocaleFields } from '../../notifications/LocaleFields'
import { CoverImageField } from './CoverImageField'
import type { EditorAction, EditorMeta } from './editorReducer'

interface Props {
  meta: EditorMeta
  dispatch: Dispatch<EditorAction>
  disabled?: boolean
}

export function AboutPanel({ meta, dispatch, disabled }: Props) {
  return (
    <div className="panel">
      <Text variant="subheader-2" className="panel__title" as="div">
        1. О чём
      </Text>
      <div className="panel__body form">
        <LocaleFields
          title={meta.title}
          description={meta.description}
          onTitle={(title) => dispatch({ type: 'setMeta', patch: { title } })}
          onDescription={(description) => dispatch({ type: 'setMeta', patch: { description } })}
          titleLabel="Название"
          descriptionLabel="Описание"
          plainDescription
          titlePlaceholder="Например: Как вам новая аптека?"
          disabled={disabled}
        />
        <CoverImageField
          value={meta.coverImageUrl}
          onChange={(coverImageUrl) => dispatch({ type: 'setMeta', patch: { coverImageUrl } })}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
