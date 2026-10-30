import { Alert, Button, Flex, Label, PasswordInput, Text, useToaster } from '@gravity-ui/uikit'
import { useState, type FormEvent } from 'react'
import { authApi } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'
import { Field } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { errorText } from '../../lib/errors'
import { formatPhone } from '../../lib/format'

export function SettingsPage() {
  const { me } = useAuth()
  const toaster = useToaster()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  // Computed live but shown only after the first attempt, so typing is not interrupted.
  const nextError =
    next.length < 10
      ? 'Минимум 10 символов'
      : next.length > 72
        ? 'Максимум 72 символа'
        : current && current === next
          ? 'Совпадает с текущим паролем'
          : undefined
  const repeatError = repeat !== next ? 'Пароли не совпадают' : undefined
  const showNext = submitted ? nextError : undefined
  const showRepeat = submitted || repeat ? repeatError : undefined

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitted(true)
    if (nextError || repeatError) return
    setBusy(true)
    try {
      await authApi.changePassword({ current_password: current || null, new_password: next })
      setCurrent('')
      setNext('')
      setRepeat('')
      setSubmitted(false)
      toaster.add({
        name: 'password-changed',
        theme: 'success',
        title: 'Пароль изменён',
        content: 'Другие ваши сессии завершены. Эта остаётся активной.',
      })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Настройки" description="Ваш аккаунт оператора." />

      <section className="section">
        <Text variant="subheader-2">Аккаунт</Text>
        <div className="panel panel_filled">
          <div className="panel__body kv">
            <Text variant="body-2" className="kv__key">
              Имя
            </Text>
            <Text variant="body-2">{me?.full_name?.trim() || '—'}</Text>
            <Text variant="body-2" className="kv__key">
              Телефон
            </Text>
            <Text variant="body-2">{formatPhone(me?.phone)}</Text>
            <Text variant="body-2" className="kv__key">
              Роль
            </Text>
            <Text variant="body-2">{me?.is_admin ? 'Оператор' : 'Без доступа'}</Text>
          </div>
        </div>
      </section>

      <section className="section">
        <Text variant="subheader-2">Сменить пароль</Text>
        <form className="panel" onSubmit={onSubmit} noValidate>
          <div className="panel__body form" style={{ maxWidth: 440 }}>
            {error ? <Alert theme="danger" message={error} /> : null}
            <Field label="Текущий пароль" hint="Если пароль ещё не задавался, оставьте пустым.">
              <PasswordInput
                size="l"
                value={current}
                onUpdate={setCurrent}
                hideCopyButton
                controlProps={{ autoComplete: 'current-password' }}
              />
            </Field>
            <Field label="Новый пароль" required hint="От 10 до 72 символов." error={showNext}>
              <PasswordInput
                size="l"
                value={next}
                onUpdate={setNext}
                hideCopyButton
                validationState={showNext ? 'invalid' : undefined}
                controlProps={{ autoComplete: 'new-password' }}
              />
            </Field>
            <Field label="Повторите новый пароль" required error={showRepeat}>
              <PasswordInput
                size="l"
                value={repeat}
                onUpdate={setRepeat}
                hideCopyButton
                validationState={showRepeat ? 'invalid' : undefined}
                controlProps={{ autoComplete: 'new-password' }}
              />
            </Field>
            <Alert
              theme="info"
              message="После смены пароля все ваши другие сессии будут завершены. Текущая останется."
            />
            <Flex>
              <Button view="action" size="l" type="submit" loading={busy}>
                Сохранить пароль
              </Button>
            </Flex>
          </div>
        </form>
      </section>

      <section className="section">
        <Text variant="subheader-2">
          Команда{' '}
          <Label theme="utility" size="xs">
            Скоро
          </Label>
        </Text>
        <div className="tiles">
          <div className="tile tile_outlined">
            <Text variant="subheader-1">Операторы</Text>
            <Text variant="body-1" color="secondary">
              Добавлять и отключать сотрудников, выдавать роли.
            </Text>
          </div>
          <div className="tile tile_outlined">
            <Text variant="subheader-1">Журнал действий</Text>
            <Text variant="body-1" color="secondary">
              Кто, когда и что изменил: рассылки, версии, решения по чекам.
            </Text>
          </div>
        </div>
      </section>
    </>
  )
}
