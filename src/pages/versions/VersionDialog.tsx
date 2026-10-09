import { Alert, Button, Dialog, Flex, NumberInput, Select, Switch, Text, TextArea, TextInput } from '@gravity-ui/uikit'
import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { isApiError } from '../../api/client'
import { versionsApi } from '../../api/versions'
import type { StaleWriteErrorBody, VersionConfig } from '../../api/types'
import { Field } from '../../components/Field'
import { PLATFORMS, platformLabel } from '../../lib/constants'
import { errorText } from '../../lib/errors'

interface Props {
  open: boolean
  initial: VersionConfig | null
  existingPlatforms: string[]
  onClose: () => void
  onSaved: () => void
}

const SEMVER = /^\d+(\.\d+){0,3}$/

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

export function VersionDialog({ open, initial, existingPlatforms, onClose, onSaved }: Props) {
  const titleId = useId()
  // Remount the form on every open so it always starts from fresh initial values.
  const [openCount, setOpenCount] = useState(0)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth="m"
      fullWidth
      disableOutsideClick
      onTransitionOutComplete={() => setOpenCount((c) => c + 1)}
    >
      <Dialog.Header caption={initial ? `Версия для ${platformLabel(initial.platform)}` : 'Новая платформа'} id={titleId} />
      {open ? (
        <VersionForm key={openCount} initial={initial} existingPlatforms={existingPlatforms} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </Dialog>
  )
}

function VersionForm({ initial, existingPlatforms, onClose, onSaved }: Omit<Props, 'open'>) {
  const [platform, setPlatform] = useState(
    () => initial?.platform ?? PLATFORMS.find((p) => !existingPlatforms.includes(p.value))?.value ?? 'ios',
  )
  const [version, setVersion] = useState(initial?.version ?? '')
  const [minVersion, setMinVersion] = useState(initial?.min_supported_version ?? '')
  const [minOs, setMinOs] = useState(initial?.minimum_os_version ?? '')
  const [force, setForce] = useState(Boolean(initial?.force_update))
  const [rollout, setRollout] = useState<number | null>(initial?.rollout_percent ?? 100)
  const [updateUrl, setUpdateUrl] = useState(initial?.update_url ?? '')
  const [notes, setNotes] = useState(initial?.release_notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState<StaleWriteErrorBody | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const v = version.trim()
      const mv = minVersion.trim()
      if (!SEMVER.test(v)) throw new Error('Версия должна выглядеть как 1.2.3')
      if (mv && !SEMVER.test(mv)) throw new Error('Минимальная версия должна выглядеть как 1.2.3')
      if (mv && compareVersions(mv, v) > 0) throw new Error('Минимальная версия не может быть выше актуальной')
      if (initial && compareVersions(v, initial.version) <= 0) {
        throw new Error(`Сервер принимает только версию выше ${initial.version}. Поднимите номер версии.`)
      }
      if (updateUrl && !/^https?:\/\//.test(updateUrl)) throw new Error('Ссылка на обновление должна начинаться с https://')
      return versionsApi.upsert({
        platform,
        version: v,
        min_supported_version: mv || undefined,
        minimum_os_version: minOs.trim() || undefined,
        force_update: force,
        rollout_percent: rollout ?? undefined,
        update_url: updateUrl.trim() || undefined,
        release_notes: notes.trim() || undefined,
      })
    },
    onSuccess: onSaved,
    onError: (e) => {
      if (isApiError(e) && e.status === 409) {
        setStale(e.body as StaleWriteErrorBody)
        setError(null)
      } else {
        setStale(null)
        setError(errorText(e))
      }
    },
  })

  const blockedBelow = minVersion.trim() || version.trim()

  return (
    <>
      <Dialog.Body>
        <Flex direction="column" gap={4}>
          {error ? <Alert theme="danger" message={error} /> : null}
          {stale ? (
            <Alert
              theme="warning"
              title="Сервер не принял версию"
              message={`Уже сохранена версия ${stale.stored_version ?? '?'} для ${platformLabel(stale.stored_platform ?? platform)}. Новая версия должна быть выше неё.`}
            />
          ) : null}

          <div className="form__row">
            <Field label="Платформа" required>
              <Select
                size="l"
                value={[platform]}
                onUpdate={(v) => setPlatform(v[0] ?? 'ios')}
                disabled={Boolean(initial)}
                options={PLATFORMS.map((p) => ({ value: p.value, content: p.label }))}
              />
            </Field>
            <Field label="Актуальная версия" required hint={initial ? `Сейчас ${initial.version}. Нужно выше.` : 'Например 1.4.0'}>
              <TextInput size="l" value={version} onUpdate={setVersion} placeholder="1.4.0" controlProps={{ inputMode: 'decimal' }} />
            </Field>
          </div>

          <div className="form__row">
            <Field label="Минимальная поддерживаемая" hint="Ниже неё приложение попросит обновиться.">
              <TextInput size="l" value={minVersion} onUpdate={setMinVersion} placeholder="1.2.0" controlProps={{ inputMode: 'decimal' }} />
            </Field>
            <Field label="Минимальная версия ОС" hint="Необязательно, например 15.0">
              <TextInput size="l" value={minOs} onUpdate={setMinOs} placeholder="15.0" />
            </Field>
          </div>

          <div className="form__row">
            <Field label="Раскатка, %" hint="Какой доле пользователей показывать обновление.">
              <NumberInput size="l" min={0} max={100} value={rollout} onUpdate={setRollout} endContent={<Text color="hint" style={{ paddingInlineEnd: 8 }}>%</Text>} />
            </Field>
            <Field label="Ссылка на обновление" hint="Страница в App Store / Google Play.">
              <TextInput size="l" type="url" value={updateUrl} onUpdate={setUpdateUrl} placeholder="https://…" />
            </Field>
          </div>

          <Field label="Что нового" hint="Покажем пользователю в окне обновления.">
            <TextArea size="l" minRows={2} maxRows={6} value={notes} onUpdate={setNotes} />
          </Field>

          <Switch size="l" checked={force} onUpdate={setForce}>
            Принудительное обновление
            <Text variant="caption-2" color="hint" as="div">
              Приложение не будет работать, пока пользователь не обновится.
            </Text>
          </Switch>

          {force ? (
            <Alert
              theme="danger"
              title="Это заблокирует часть пользователей"
              message={`Все, у кого версия ниже ${blockedBelow || '…'} на ${platformLabel(platform)}, не смогут открыть приложение до обновления. Убедитесь, что новая версия уже доступна в магазине.`}
            />
          ) : null}
        </Flex>
      </Dialog.Body>
      <Dialog.Footer
        renderButtons={() => (
          <>
            <Button view="flat" size="l" onClick={onClose} disabled={save.isPending}>
              Отмена
            </Button>
            <Button view={force ? 'outlined-danger' : 'action'} size="l" onClick={() => save.mutate()} loading={save.isPending}>
              {force ? 'Сохранить и заблокировать старые версии' : 'Сохранить'}
            </Button>
          </>
        )}
      />
    </>
  )
}
