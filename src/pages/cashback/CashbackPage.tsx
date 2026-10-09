import { Alert, Button, Flex, Icon, Text, TextInput, useToaster } from '@gravity-ui/uikit'
import { ArrowRight } from '@gravity-ui/icons'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { receiptsApi } from '../../api/receipts'
import type { PromoteResponse } from '../../api/types'
import { ConfirmDialog, ConfirmLine } from '../../components/ConfirmDialog'
import { Field } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { errorText } from '../../lib/errors'
import { formatDateTime, plural, tashkentLocalToRfc3339, tashkentNowLocalInput } from '../../lib/format'

export function CashbackPage() {
  const toaster = useToaster()
  const [useCustom, setUseCustom] = useState(false)
  const [cutoff, setCutoff] = useState(() => tashkentNowLocalInput(-1))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [last, setLast] = useState<PromoteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const beforeIso = useCustom ? tashkentLocalToRfc3339(cutoff) : null
  const cutoffInvalid = useCustom && !beforeIso

  const promote = useMutation({
    mutationFn: () => receiptsApi.promotePending(beforeIso ?? undefined),
    onSuccess: (res) => {
      setConfirmOpen(false)
      setLast(res)
      setError(null)
      toaster.add({
        name: 'promoted',
        theme: 'success',
        title: res.promoted
          ? `Переведено: ${plural(res.promoted, ['чек', 'чека', 'чеков'])}`
          : 'Зависших чеков не было',
      })
    },
    onError: (e) => {
      setConfirmOpen(false)
      setError(errorText(e))
    },
  })

  return (
    <>
      <PageHeader
        title="Перевод кешбэка в доступный"
        description="Кешбэк по чеку сначала попадает в «ожидает», потом становится доступным для вывода. Обычно это делает сервер сам. Здесь можно вручную дожать чеки, которые зависли."
      />

      <Flex gap={4} wrap alignItems="flex-start">
        <div className="form" style={{ flex: '1 1 460px', minWidth: 0, maxWidth: 640 }}>
          {error ? <Alert theme="danger" message={error} onClose={() => setError(null)} /> : null}

          <div className="panel">
            <div className="panel__body form">
              <Text variant="subheader-2">Какие чеки перевести</Text>
              <Text variant="body-2" color="secondary">
                Все чеки, которые до сих пор «ожидают» и были отсканированы раньше указанного момента. По умолчанию —
                всё, что старше одной минуты.
              </Text>

              <Flex gap={2} wrap>
                <Button view={useCustom ? 'normal' : 'action'} size="l" onClick={() => setUseCustom(false)}>
                  Всё старше минуты
                </Button>
                <Button
                  view={useCustom ? 'action' : 'normal'}
                  size="l"
                  onClick={() => {
                    setCutoff(tashkentNowLocalInput(-1))
                    setUseCustom(true)
                  }}
                >
                  Указать момент
                </Button>
              </Flex>

              {useCustom ? (
                <Field label="Отсканированы до (время Ташкента)" hint="Чеки, созданные позже этого момента, не тронем.">
                  <TextInput
                    size="l"
                    type="text"
                    value={cutoff}
                    onUpdate={setCutoff}
                    controlProps={{ type: 'datetime-local', max: tashkentNowLocalInput() }}
                    validationState={cutoffInvalid ? 'invalid' : undefined}
                    errorMessage={cutoffInvalid ? 'Укажите дату и время' : undefined}
                  />
                </Field>
              ) : null}

              <Alert
                theme="info"
                message="Деньги станут доступны для вывода. Чеки, которые ждут ручной модерации, этот инструмент не трогает."
              />

              <Flex>
                <Button
                  view="action"
                  size="xl"
                  onClick={() => setConfirmOpen(true)}
                  disabled={cutoffInvalid}
                  loading={promote.isPending}
                >
                  Перевести
                  <Icon data={ArrowRight} size={16} />
                </Button>
              </Flex>
            </div>
          </div>
        </div>

        <div style={{ flex: '0 1 360px', minWidth: 280 }}>
          <div className="panel panel_filled">
            <Text variant="subheader-2" className="panel__title" as="div">
              Последний запуск
            </Text>
            <div className="panel__body">
              {last ? (
                <div className="kv">
                  <Text className="kv__key">Переведено</Text>
                  <Text className="num">{plural(last.promoted, ['чек', 'чека', 'чеков'])}</Text>
                  <Text className="kv__key">Граница</Text>
                  <Text className="num">{formatDateTime(last.before)}</Text>
                </div>
              ) : (
                <Text variant="body-2" color="hint">
                  В этой сессии ещё не запускали. История запусков пока не хранится на сервере.
                </Text>
              )}
            </div>
          </div>
        </div>
      </Flex>

      <ConfirmDialog
        open={confirmOpen}
        title="Перевести кешбэк в доступный?"
        confirmText="Перевести"
        loading={promote.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => promote.mutate()}
      >
        <Flex direction="column" gap={2}>
          <Text variant="body-2">
            Все зависшие чеки станут проведёнными, и их кешбэк можно будет вывести. Отменить это нельзя.
          </Text>
          <ConfirmLine
            label="Чеки до:"
            value={useCustom && beforeIso ? formatDateTime(beforeIso) : 'минуту назад (по умолчанию)'}
          />
          <Text variant="body-1" color="secondary">
            Точное число чеков узнаем после выполнения.
          </Text>
        </Flex>
      </ConfirmDialog>
    </>
  )
}
