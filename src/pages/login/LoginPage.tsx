import { Alert, Button, Flex, PasswordInput, Text, TextInput } from '@gravity-ui/uikit'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isApiError } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { errorText } from '../../lib/errors'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('998')) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return `+${digits}`
}

export function LoginPage() {
  const { login, expiredNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState('+998')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from
  const redirectTo = from && from !== '/login' ? from : '/'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const p = normalizePhone(phone)
    if (p.length < 13) {
      setError('Введите номер телефона полностью, например +998 90 123 45 67')
      return
    }
    if (!password) {
      setError('Введите пароль')
      return
    }
    setBusy(true)
    try {
      await login(p, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (isApiError(err) && err.status === 403) {
        setError('Для этого аккаунта ещё не задан пароль. Попросите разработчиков выдать первый пароль.')
      } else {
        setError(errorText(err))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={onSubmit} noValidate>
        <Flex direction="column" gap={1}>
          <Text variant="header-2">Pulso</Text>
          <Text variant="body-2" color="secondary">
            Вход для операторов
          </Text>
        </Flex>

        {expiredNotice && !error ? (
          <Alert theme="info" message="Сессия закончилась. Войдите заново, чтобы продолжить." />
        ) : null}
        {error ? <Alert theme="danger" message={error} /> : null}

        <Flex direction="column" gap={3}>
          <TextInput
            size="xl"
            type="tel"
            value={phone}
            onUpdate={setPhone}
            placeholder="+998 90 123 45 67"
            autoFocus
            controlProps={{ autoComplete: 'username', inputMode: 'tel' }}
          />
          <PasswordInput
            size="xl"
            value={password}
            onUpdate={setPassword}
            placeholder="Пароль"
            hideCopyButton
            controlProps={{ autoComplete: 'current-password' }}
          />
        </Flex>

        <Button view="action" size="xl" type="submit" loading={busy} width="max">
          Войти
        </Button>

        <Text variant="caption-2" color="hint">
          Доступ только для сотрудников. Время в панели — ташкентское.
        </Text>
      </form>
    </div>
  )
}
