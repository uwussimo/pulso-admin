import { Alert, Button, Dialog, Flex, Text, TextInput } from '@gravity-ui/uikit'
import { useId, useState, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  /** What exactly will happen, in plain words. */
  children: ReactNode
  confirmText: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  /** If set, the operator must type this phrase to enable the confirm button. */
  typedPhrase?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmText,
  cancelText = 'Отмена',
  danger,
  loading,
  typedPhrase,
  onConfirm,
  onClose,
}: Props) {
  const titleId = useId()
  // Lives in state only while the dialog is open: closing unmounts the body and clears it.
  const [typed, setTyped] = useState('')
  const phraseOk = !typedPhrase || typed.trim().toUpperCase() === typedPhrase.toUpperCase()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth="s"
      fullWidth
      disableOutsideClick={loading}
      onTransitionOutComplete={() => setTyped('')}
    >
      <Dialog.Header caption={title} id={titleId} />
      <Dialog.Body>
        <Flex direction="column" gap={4}>
          <div>{children}</div>
          {typedPhrase ? (
            <Flex direction="column" gap={2}>
              <Alert
                theme="warning"
                title="Это действие нельзя отменить"
                message={`Чтобы подтвердить, введите слово «${typedPhrase}».`}
              />
              <TextInput
                size="l"
                value={typed}
                onUpdate={setTyped}
                placeholder={typedPhrase}
                autoFocus
                controlProps={{ autoComplete: 'off', spellCheck: false }}
              />
            </Flex>
          ) : null}
        </Flex>
      </Dialog.Body>
      <Dialog.Footer
        preset={danger ? 'danger' : 'default'}
        renderButtons={() => (
          <>
            <Button view="flat" size="l" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              view={danger ? 'outlined-danger' : 'action'}
              size="l"
              onClick={onConfirm}
              loading={loading}
              disabled={!phraseOk}
            >
              {confirmText}
            </Button>
          </>
        )}
      />
    </Dialog>
  )
}

export function ConfirmLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Flex gap={2} alignItems="baseline">
      <Text variant="body-2" color="secondary" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text variant="body-2" style={{ flex: 1, minWidth: 0 }}>
        {value}
      </Text>
    </Flex>
  )
}
