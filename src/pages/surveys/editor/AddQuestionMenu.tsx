import { Button, DropdownMenu, Icon } from '@gravity-ui/uikit'
import { Plus } from '@gravity-ui/icons'
import { FIELD_TYPES } from '../../../surveys/fieldTypes'
import type { QuestionType } from '../../../surveys/schema'

interface Props {
  onAdd: (type: QuestionType) => void
  disabled?: boolean
}

export function AddQuestionMenu({ onAdd, disabled }: Props) {
  return (
    <DropdownMenu
      size="l"
      disabled={disabled}
      renderSwitcher={(props) => (
        <Button {...props} size="l" view="outlined" disabled={disabled}>
          <Icon data={Plus} size={16} />
          Добавить вопрос
        </Button>
      )}
      items={FIELD_TYPES.map((t) => ({
        text: t.label,
        iconStart: <Icon data={t.icon} size={16} />,
        action: () => onAdd(t.type),
      }))}
    />
  )
}
