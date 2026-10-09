import { HelpMark, Text } from '@gravity-ui/uikit'
import type { ReactNode } from 'react'

interface Props {
  label: ReactNode
  hint?: ReactNode
  help?: ReactNode
  children: ReactNode
  required?: boolean
}

/** Label above a control. Gravity's inline `label` prop sits to the left; for forms we want the Yandex ID style, label on top. */
export function Field({ label, hint, help, children, required }: Props) {
  return (
    <label className="field">
      <Text variant="body-1" className="field__label">
        {label}
        {required ? <Text color="danger"> *</Text> : null}
        {help ? (
          <>
            {' '}
            <HelpMark>{help}</HelpMark>
          </>
        ) : null}
      </Text>
      {children}
      {hint ? (
        <Text variant="caption-2" color="hint">
          {hint}
        </Text>
      ) : null}
    </label>
  )
}
