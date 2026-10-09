# Component recipes

Small, copy-pasteable pieces that give pages the Yandex ID / 360 feel. They rely on classes in `theme.css` and only on public Gravity UI props.

## PageHeader

Eyebrow (parent section, plain grey text) → `display-1` title → optional description → actions on the right. No "← Back" link: the sidebar is the way back.

```tsx
import { Text } from '@gravity-ui/uikit'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow ? (
          <Text variant="body-1" color="secondary">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="display-1" as="h1" style={{ margin: 0 }}>
          {title}
        </Text>
        {description ? (
          <Text variant="body-2" color="secondary">
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}
```

Usage: `<PageHeader eyebrow="Уведомления" title="Новая рассылка" actions={<Button view="action" size="l">Создать</Button>} />`

## List page: panel + toolbar + table + footer

```tsx
<div className="panel">
  <div className="toolbar">
    <TextInput
      className="toolbar__search"
      size="l"
      placeholder="Поиск по телефону"
      value={q}
      onUpdate={setQ}
      hasClear
    />
    <Select size="l" width={180} value={[status]} onUpdate={([v]) => setStatus(v)} options={STATUS_OPTIONS} />
    <Switch size="l" checked={unreadOnly} onUpdate={setUnreadOnly}>
      Только непрочитанные
    </Switch>
  </div>
  <div className="table-wrap">
    <Table data={rows} columns={columns} onRowClick={(row) => navigate(`/users/${row.id}`)} />
  </div>
  <div className="table-footer">
    <Text variant="body-1" color="secondary">
      Показано {rows.length} из {total}
    </Text>
    {hasMore ? (
      <Button size="m" onClick={loadMore} loading={isFetchingNextPage}>
        Показать ещё
      </Button>
    ) : null}
  </div>
</div>
```

- Row menus: `const RowTable = withTableActions<Row>(Table)` and `getRowActions={(row) => [{ text: 'Изменить', handler: … }, { text: 'Удалить', theme: 'danger', handler: … }]}`.
- Two-line cells: `.cell-title` with `subheader-1` + `body-1` secondary.
- Numbers: wrap in `.num` for tabular figures, right-align the column.

## Detail page: panels and key/value grids

```tsx
<div className="panel">
  <Text variant="subheader-2" className="panel__title" as="div">
    Профиль
  </Text>
  <div className="panel__body">
    <div className="kv">
      <Text variant="body-2" className="kv__key">
        Телефон
      </Text>
      <Text variant="body-2">{formatPhone(user.phone)}</Text>
      <Text variant="body-2" className="kv__key">
        Статус
      </Text>
      <Label theme="success" size="s">
        Активен
      </Label>
    </div>
  </div>
</div>
```

Several panels stack with `.section` gaps. On mobile `.kv` becomes a single column automatically.

## Overview tiles

```tsx
<div className="tiles">
  <Link to="/users" className="tile">
    <Text variant="body-1" color="secondary">
      Пользователи
    </Text>
    <Text variant="header-2" className="tile__value">
      1 284
    </Text>
  </Link>
  <div className="tile tile_outlined">
    <Text variant="body-1" color="secondary">
      Транзакции
    </Text>
    <Text variant="body-2">Скоро. Ждём отчёт от бэкенда.</Text>
  </div>
</div>
```

A dashed `tile_outlined` says "not available yet" honestly. Never put a placeholder number there.

## Forms

```tsx
<form className="form" onSubmit={…}>
  <div className="form__row">
    <Field label="Название"><TextInput size="l" value={…} onUpdate={…} /></Field>
    <Field label="Платформа"><Select size="l" width="max" … /></Field>
  </div>
  <Field label="Текст" hint="До 200 символов"><TextArea size="l" rows={4} … /></Field>
  <Flex gap={2} justifyContent="flex-end">
    <Button view="flat" size="l" onClick={onCancel}>Отмена</Button>
    <Button view="action" size="l" type="submit" loading={saving}>Сохранить</Button>
  </Flex>
</form>
```

```tsx
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <Text variant="body-1" className="field__label">
        {label}
      </Text>
      {children}
      {error ? (
        <Text variant="caption-2" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption-2" color="secondary">
          {hint}
        </Text>
      ) : null}
    </label>
  )
}
```

Validation errors are shown under the field after the first submit attempt, not while typing.

## ConfirmDialog (money, broadcasts, deletes)

Restates what will happen in plain words. For irreversible mass actions add `typedPhrase` so the operator must type a word (e.g. `ВСЕМ`) before the button enables.

```tsx
import { Alert, Button, Dialog, Flex, TextInput } from '@gravity-ui/uikit'
import { useId, useState, type ReactNode } from 'react'

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
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmText: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  typedPhrase?: string
  onConfirm: () => void
  onClose: () => void
}) {
  const titleId = useId()
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
```

Inside `children`, list the facts as label/value lines: "Кому: все пользователи (1 284)", "Сумма: 20 000 сум".

## Loading / error / empty

```tsx
export function LoadingState({ label = 'Загружаем…' }) {
  return (
    <Flex centerContent gap={3} style={{ padding: 'var(--g-spacing-10) 0' }}>
      <Loader size="m" />
      <Text variant="body-2" color="secondary">
        {label}
      </Text>
    </Flex>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div style={{ padding: 'var(--g-spacing-5)' }}>
      <Alert
        theme="danger"
        title="Не удалось загрузить"
        message={toMessage(error)}
        layout="horizontal"
        actions={onRetry ? <Button onClick={onRetry}>Повторить</Button> : undefined}
      />
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Flex direction="column" alignItems="center" gap={2} style={{ padding: 'var(--g-spacing-10) var(--g-spacing-5)' }}>
      <Text variant="subheader-2">{title}</Text>
      {description ? (
        <Text variant="body-2" color="secondary" style={{ textAlign: 'center', maxWidth: 420 }}>
          {description}
        </Text>
      ) : null}
      {action ? <div style={{ marginTop: 'var(--g-spacing-2)' }}>{action}</div> : null}
    </Flex>
  )
}
```

Render these **inside** the panel body so the header, toolbar and sidebar stay put while data changes.

## Login card

Centred 400px card on the grey workspace, 28px radius, `header-1` title, filled inputs, one black button:

```tsx
<div className="login">
  <form className="login__card" onSubmit={…}>
    <BrandMark name="Acme" />
    <Text variant="header-1">Вход</Text>
    <Field label="Телефон"><TextInput size="l" type="tel" … /></Field>
    <Field label="Пароль"><PasswordInput size="l" … /></Field>
    <Button view="action" size="xl" type="submit" loading={pending} width="max">Войти</Button>
  </form>
</div>
```

## "Скоро" page

For sections that are in the nav but not built: a `PageHeader` with the section name, one paragraph of what it will do, and a short list of what it waits for (`.panel_filled` items). No charts, no sample rows.

## Toasts

```ts
const { add } = useToaster()
add({ name: 'version-saved', title: 'Версия сохранена', theme: 'success', autoHiding: 4000 })
```

Short, past tense, one line. Errors that block the task go in an `Alert` on the page instead.
