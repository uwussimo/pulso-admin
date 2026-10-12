import { Avatar, Button, Flex, Icon, Label, Text, TextInput } from '@gravity-ui/uikit'
import { CircleXmark, Magnifier } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usersApi } from '../api/users'
import type { AdminUser } from '../api/types'
import { userStatusMeta } from '../lib/constants'
import { errorText } from '../lib/errors'
import { formatPhone } from '../lib/format'

interface Props {
  /** Ids already chosen, in the order they were added. */
  value: number[]
  onChange: (next: number[]) => void
  disabled?: boolean
}

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_LIMIT = 20

/**
 * Recipient picker for a targeted send. An operator types a phone number, a
 * name, or an id and picks from the results — the ids are never typed by
 * hand, because a mistyped id addresses the wrong person.
 *
 * The chosen users are held by id and rendered from the last search result,
 * so a name typed into the box cannot change who a selected chip says they
 * are: an id always resolves back through the server.
 */
export function UserPicker({ value, onChange, disabled }: Props) {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AdminUser[]>([])
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [term])

  const search = useQuery({
    queryKey: ['users', 'picker', debounced],
    queryFn: ({ signal }) => usersApi.list({ search: debounced || undefined, limit: SEARCH_LIMIT }, signal),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const results = useMemo(() => search.data?.items ?? [], [search.data])

  // Keep the resolved rows for whatever is still selected: a chip must show
  // a real name, and the last response is the only source of it.
  const addUser = useCallback(
    (u: AdminUser) => {
      if (value.includes(u.id)) return
      onChange([...value, u.id])
      setSelected((prev) => [...prev.filter((p) => p.id !== u.id), u])
      setTerm('')
      setDebounced('')
    },
    [onChange, value],
  )

  const removeUser = useCallback(
    (id: number) => {
      onChange(value.filter((v) => v !== id))
      setSelected((prev) => prev.filter((p) => p.id !== id))
    },
    [onChange, value],
  )

  const selectedRows = selected.filter((u) => value.includes(u.id))

  return (
    <div className="user-picker" ref={boxRef}>
      {selectedRows.length > 0 ? (
        <Flex gap={2} wrap className="user-picker__chips">
          {selectedRows.map((u) => {
            const meta = userStatusMeta(u.status)
            return (
              <Label key={u.id} theme="info" className="user-picker__chip">
                <Flex gap={1} alignItems="center">
                  {u.avatar_url ? <Avatar imgUrl={u.avatar_url} size="xs" alt="" /> : null}
                  <span className="user-picker__chip-name">{u.full_name || 'без имени'}</span>
                  <span className="num">{formatPhone(u.phone)}</span>
                  {u.status !== 'active' ? (
                    <Text variant="caption-2" color="secondary">
                      {meta.label}
                    </Text>
                  ) : null}
                  <Button
                    size="s"
                    view="flat"
                    aria-label={`Убрать ${u.full_name || u.phone}`}
                    onClick={() => removeUser(u.id)}
                  >
                    <Icon data={CircleXmark} size={14} />
                  </Button>
                </Flex>
              </Label>
            )
          })}
        </Flex>
      ) : null}

      <TextInput
        size="l"
        value={term}
        disabled={disabled}
        placeholder="Телефон, имя или ID — найдите получателя"
        onUpdate={(v) => {
          setTerm(v)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        startContent={
          <Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />
        }
        hasClear
      />

      {open ? (
        <div className="user-picker__results">
          {search.isPending ? (
            <Text variant="body-2" color="hint" className="user-picker__row">
              Ищем…
            </Text>
          ) : search.isError ? (
            <Text variant="body-2" color="danger" className="user-picker__row">
              {errorText(search.error)}
            </Text>
          ) : results.length === 0 ? (
            <Text variant="body-2" color="hint" className="user-picker__row">
              {debounced ? 'Никого не нашли.' : 'Начните вводить телефон, имя или ID.'}
            </Text>
          ) : (
            results.map((u) => {
              const already = value.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  className="user-picker__row user-picker__row_action"
                  disabled={already}
                  onClick={() => addUser(u)}
                >
                  {u.avatar_url ? <Avatar imgUrl={u.avatar_url} size="xs" alt="" /> : null}
                  <span className="user-picker__row-main">
                    <Text variant="body-2" as="span">
                      {u.full_name || <Text color="hint">без имени</Text>}
                    </Text>
                    <Text variant="caption-2" color="secondary" as="span" className="num">
                      {formatPhone(u.phone)}
                    </Text>
                  </span>
                  {already ? <Text variant="caption-2">уже выбран</Text> : null}
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
