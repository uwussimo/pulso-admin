import { Alert, Button, Icon, Label, Table, Text, useToaster, withTableActions, type TableColumnConfig } from '@gravity-ui/uikit'
import { Pencil, Plus, TrashBin } from '@gravity-ui/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { versionsApi } from '../../api/versions'
import type { VersionConfig } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { platformLabel } from '../../lib/constants'
import { errorText } from '../../lib/errors'
import { VersionDialog } from './VersionDialog'

const ActionsTable = withTableActions<VersionConfig>(Table)

export function VersionsPage() {
  const toaster = useToaster()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<{ open: boolean; initial: VersionConfig | null }>({ open: false, initial: null })
  const [removing, setRemoving] = useState<VersionConfig | null>(null)

  const query = useQuery({ queryKey: ['versions'], queryFn: ({ signal }) => versionsApi.list(signal) })

  const remove = useMutation({
    mutationFn: (platform: string) => versionsApi.remove(platform),
    onSuccess: () => {
      toaster.add({ name: 'version-removed', theme: 'success', title: 'Настройки платформы удалены' })
      setRemoving(null)
      void queryClient.invalidateQueries({ queryKey: ['versions'] })
    },
    onError: (e) => toaster.add({ name: 'version-remove-error', theme: 'danger', title: 'Не удалось удалить', content: errorText(e) }),
  })

  const items = query.data?.items ?? []
  const forced = items.filter((v) => v.force_update)

  const columns: TableColumnConfig<VersionConfig>[] = [
    { id: 'platform', name: 'Платформа', primary: true, template: (v) => <Text variant="subheader-1">{platformLabel(v.platform)}</Text> },
    { id: 'version', name: 'Актуальная', template: (v) => <Text className="num">{v.version}</Text> },
    {
      id: 'min',
      name: 'Минимальная',
      template: (v) => <Text className="num">{v.min_supported_version || <Text color="hint">не задана</Text>}</Text>,
    },
    {
      id: 'force',
      name: 'Обновление',
      template: (v) => (v.force_update ? <Label theme="danger">Принудительное</Label> : <Label theme="normal">По желанию</Label>),
    },
    {
      id: 'rollout',
      name: 'Раскатка',
      align: 'end',
      template: (v) => <Text className="num">{v.rollout_percent === undefined || v.rollout_percent === null ? '—' : `${v.rollout_percent}%`}</Text>,
    },
    { id: 'os', name: 'Мин. ОС', template: (v) => <Text className="num">{v.minimum_os_version || '—'}</Text> },
    {
      id: 'notes',
      name: 'Что нового',
      template: (v) => (
        <Text variant="body-1" color="secondary" ellipsis style={{ maxWidth: 260, display: 'block' }}>
          {v.release_notes || '—'}
        </Text>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Версии приложения"
        description="Какую версию считать актуальной и ниже какой заставлять обновляться, отдельно для iOS и Android."
        actions={
          <Button view="action" size="l" onClick={() => setDialog({ open: true, initial: null })}>
            <Icon data={Plus} size={16} />
            Добавить платформу
          </Button>
        }
      />

      {forced.length > 0 ? (
        <Alert
          theme="warning"
          style={{ marginBottom: 'var(--g-spacing-4)' }}
          title="Включено принудительное обновление"
          message={`${forced.map((v) => `${platformLabel(v.platform)}: ниже ${v.min_supported_version || v.version}`).join('; ')}. Пользователи на старых версиях не смогут пользоваться приложением, пока не обновятся.`}
        />
      ) : null}

      <div className="panel">
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Версии ещё не настроены"
            description="Пока строк нет, приложение не требует обновлений. Добавьте платформу, чтобы управлять версиями."
            action={
              <Button view="action" size="l" onClick={() => setDialog({ open: true, initial: null })}>
                Добавить платформу
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <ActionsTable
              data={items}
              columns={columns}
              getRowId={(v) => v.platform}
              rowActionsSize="m"
              getRowActions={(v) => [
                { text: 'Изменить', icon: <Icon data={Pencil} size={16} />, handler: () => setDialog({ open: true, initial: v }) },
                { text: 'Удалить', theme: 'danger', icon: <Icon data={TrashBin} size={16} />, handler: () => setRemoving(v) },
              ]}
              edgePadding
            />
          </div>
        )}
      </div>

      <Text variant="body-1" color="hint" as="p">
        Сервер принимает только версию выше сохранённой. Чтобы поменять другие настройки, например включить принудительное
        обновление, укажите новую версию.
      </Text>

      <VersionDialog
        open={dialog.open}
        initial={dialog.initial}
        existingPlatforms={items.map((v) => v.platform)}
        onClose={() => setDialog({ open: false, initial: null })}
        onSaved={() => {
          setDialog({ open: false, initial: null })
          toaster.add({ name: 'version-saved', theme: 'success', title: 'Версия сохранена' })
          void queryClient.invalidateQueries({ queryKey: ['versions'] })
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Удалить настройки платформы?"
        confirmText="Удалить"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.platform)}
      >
        <Text variant="body-2" as="p" style={{ marginTop: 0 }}>
          Приложение на этой платформе перестанет получать требования обновиться, в том числе принудительные.
        </Text>
        {removing ? (
          <>
            <ConfirmLine label="Платформа:" value={platformLabel(removing.platform)} />
            <ConfirmLine label="Версия:" value={removing.version} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
