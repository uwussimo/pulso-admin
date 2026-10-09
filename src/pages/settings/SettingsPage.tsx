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
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (next.length < 10) return setError('Новый пароль: минимум 10 символов')
    if (next.length > 72) return setError('Новый пароль: максимум 72 символа')
    if (next !== repeat) return setError('Пароли не совпадают')
    if (current && current === next) return setError('Новый пароль совпадает с текущим')
    setBusy(true)
    try {
      await authApi.changePassword({ current_password: current || null, new_password: next })
      setCurrent('')
      setNext('')
      setRepeat('')
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
            <Field label="Новый пароль" required hint="От 10 до 72 символов.">
              <PasswordInput
                size="l"
                value={next}
                onUpdate={setNext}
                hideCopyButton
                controlProps={{ autoComplete: 'new-password' }}
              />
            </Field>
            <Field label="Повторите новый пароль" required>
              <PasswordInput
                size="l"
                value={repeat}
                onUpdate={setRepeat}
                hideCopyButton
                controlProps={{ autoComplete: 'new-password' }}
                validationState={repeat && repeat !== next ? 'invalid' : undefined}
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
