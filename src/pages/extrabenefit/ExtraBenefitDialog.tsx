import { Alert, Button, Dialog, Flex, Loader, NumberInput, Text } from '@gravity-ui/uikit'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'
import { extraBenefitApi } from '../../api/extrabenefit'
import { nomenclatureApi } from '../../api/promo'
import type { CatalogDrug, ExtraBenefitContentMap, ExtraBenefitOffer } from '../../api/types'
import { Field } from '../../components/Field'
import { errorText } from '../../lib/errors'
import { formatSum, fromDateInput, plural, startOfToday, toDateInput } from '../../lib/format'
import { CatalogPickerDialog } from '../promo/CatalogPickerDialog'
import { NomenclatureCell } from '../promo/NomenclatureCell'
import { CodeListField } from './CodeListField'
import { ExtraBenefitContentFields } from './ExtraBenefitContentFields'
import { buildContent, emptyContent, normalizeContent } from './extraBenefit.utils'

interface Props {
  open: boolean
  /** Set when editing; null when creating. */
  offer: ExtraBenefitOffer | null
  onClose: () => void
  onSaved: (created: boolean) => void
}

/** The default window: a month of shelf life, starting today. */
const DEFAULT_DAYS = 30

function defaultStart(): string {
  return toDateInput(startOfToday().toISOString())
}

function defaultEnd(): string {
  return toDateInput(new Date(startOfToday().getTime() + DEFAULT_DAYS * 86400000).toISOString())
}

export function ExtraBenefitDialog({ open, offer, onClose, onSaved }: Props) {
  const titleId = useId()
  // Remount the form on every open so an edit never shows the previous offer's values.
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
      <Dialog.Header caption={offer ? 'Предложение' : 'Новое предложение'} id={titleId} />
      {open ? <ExtraBenefitForm key={openCount} offer={offer} onClose={onClose} onSaved={onSaved} /> : null}
    </Dialog>
  )
}

type FormProps = Omit<Props, 'open'>

function ExtraBenefitForm({ offer, onClose, onSaved }: FormProps) {
  const editing = offer !== null

  const [drug, setDrug] = useState<CatalogDrug | null>(null)
  const [nomenclatureId, setNomenclatureId] = useState<number | null>(offer?.nomenclature_id ?? null)
  const [goalTarget, setGoalTarget] = useState<number | null>(offer?.goal_target ?? 5)
  const [bonus, setBonus] = useState<number | null>(offer?.bonus_amount ?? 0)
  const [codes, setCodes] = useState<string[]>(offer?.ikpu_codes ?? [])
  const [startsAt, setStartsAt] = useState(toDateInput(offer?.starts_at) || defaultStart())
  const [endsAt, setEndsAt] = useState(toDateInput(offer?.ends_at) || defaultEnd())
  const [position, setPosition] = useState<number | null>(offer?.position ?? 0)
  const [content, setContent] = useState<ExtraBenefitContentMap>(() => {
    const map: ExtraBenefitContentMap = { ru: emptyContent() }
    for (const [locale, doc] of Object.entries(offer?.content ?? {})) {
      map[locale as keyof ExtraBenefitContentMap] = normalizeContent(doc)
    }
    return map
  })
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  /**
   * The catalogue is read once per opened offer: the product's packages are
   * the codes the operator can pick from, and the offer stores its codes as
   * plain strings. A drug picked in this session already carries its
   * packages, so the request is skipped.
   */
  const catalogue = useQuery({
    queryKey: ['nomenclatures', 'get', nomenclatureId],
    queryFn: ({ signal }) => nomenclatureApi.get(nomenclatureId as number, signal),
    enabled: nomenclatureId !== null && drug === null,
  })
  const product = drug ?? catalogue.data ?? null
  const packages = useMemo(() => product?.packages ?? [], [product])

  const save = useMutation({
    mutationFn: () => {
      if (!nomenclatureId) throw new Error('Выберите товар из каталога')
      if (!Number.isInteger(goalTarget) || (goalTarget ?? 0) < 1) throw new Error('Цель должна быть целым числом от 1')
      if (!Number.isInteger(bonus) || (bonus ?? 0) < 1) throw new Error('Бонус должен быть целым числом от 1')
      if (codes.length === 0) throw new Error('Выберите хотя бы один ИКПУ-код')
      const start = fromDateInput(startsAt, 'start')
      const end = fromDateInput(endsAt, 'end')
      if (!start || !end) throw new Error('Заполните период действия')
      if (new Date(end) <= new Date(start)) throw new Error('Период должен заканчиваться позже, чем начинаться')
      if (!content.ru?.title?.trim()) throw new Error('Нужен заголовок на русском')

      const body = {
        nomenclature_id: nomenclatureId,
        ikpu_codes: codes,
        goal_target: goalTarget as number,
        bonus_amount: bonus as number,
        content: buildContent(content),
        starts_at: start,
        ends_at: end,
        position: position ?? 0,
      }

      if (editing) return extraBenefitApi.update(offer.id, body)
      return extraBenefitApi.create(body)
    },
    onSuccess: () => onSaved(!editing),
    onError: (e) => setError(errorText(e)),
  })

  function pickProduct(picked: CatalogDrug) {
    setDrug(picked)
    setNomenclatureId(picked.id)
    // The offer keeps its own code list; the picked product only says which
    // codes exist. Codes the operator already chose stay chosen.
    setPickerOpen(false)
  }

  const productTitle = product?.full_name ?? product?.name ?? ''
  const productMaker = product?.maker?.name
  const productCountry = product?.maker?.country_name

  return (
    <>
      <Dialog.Body>
        <Flex direction="column" gap={4}>
          {error ? <Alert theme="danger" message={error} /> : null}

          <div className="form">
            <Text variant="subheader-2">Товар</Text>
            {product ? (
              <>
                <NomenclatureCell
                  imageUrl={product.image_url}
                  fullName={productTitle}
                  makerName={productMaker}
                  makerCountry={productCountry}
                />
                <div>
                  <Button size="l" onClick={() => setPickerOpen(true)}>
                    Заменить товар
                  </Button>
                </div>
              </>
            ) : catalogue.isLoading ? (
              <Flex gap={2} alignItems="center">
                <Loader size="s" />
                <Text variant="body-2" color="secondary">
                  Загружаем товар из каталога…
                </Text>
              </Flex>
            ) : catalogue.isError ? (
              <Alert
                theme="warning"
                message="Товар не найден в каталоге — выберите другой."
                actions={
                  <Button size="m" onClick={() => setPickerOpen(true)}>
                    Выбрать товар
                  </Button>
                }
              />
            ) : (
              <div>
                <Button size="l" view="action" onClick={() => setPickerOpen(true)}>
                  Выбрать товар
                </Button>
                <Text variant="caption-2" color="hint" as="div">
                  Товар показывается на карточке предложения в приложении.
                </Text>
              </div>
            )}
          </div>

          <div className="form">
            <Text variant="subheader-2">Условия цели</Text>
            <div className="form__row">
              <Field
                label="Сколько упаковок засчитывается"
                required
                hint="Сколько упаковок по этим кодам покупает пользователь, чтобы цель засчиталась."
              >
                <NumberInput size="l" min={1} step={1} value={goalTarget} onUpdate={setGoalTarget} />
              </Field>
              <Field label="Бонус за цель, сум" required hint="Фиксированная сумма сверх обычного кешбэка 1%.">
                {/* Step 1 on purpose: Gravity's NumberInput snaps a typed value to
                    the step grid, and a grid of 1000 from 1 would turn 15 000 into
                    15 001 — an amount the operator never chose, saved silently. */}
                <NumberInput size="l" min={1} step={1} value={bonus} onUpdate={setBonus} />
              </Field>
            </div>

            <Field
              label="ИКПУ-коды, которые засчитываются"
              required
              hint="По этим кодам считаются покупки. Код, которого нет в каталоге, всё равно можно добавить руками."
            >
              <CodeListField packages={packages} codes={codes} onChange={setCodes} />
            </Field>
          </div>

          <div className="form">
            <Text variant="subheader-2">Период</Text>
            <div className="form__row">
              <Field label="Начало" required hint="Чеки, отсканированные раньше, в цель не попадут.">
                {/* @gravity-ui/uikit ships no DatePicker — a native input keeps the
                    dependency count at zero and takes the yyyy-mm-dd the backend wants.
                    Styled by the `.field input[type='date']` rule in theme.css. */}
                <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </Field>
              <Field label="Конец" required hint="После этой даты предложение перестаёт начислять бонус.">
                <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </Field>
              <Field label="Порядок" hint="Чем меньше, тем выше в списке приложения.">
                <NumberInput size="l" min={0} step={1} value={position} onUpdate={setPosition} />
              </Field>
            </div>
          </div>

          <div className="form">
            <Text variant="subheader-2">Тексты</Text>
            <Text variant="caption-2" color="hint">
              В приложении показывается язык, который есть у пользователя. Если языка нет — берётся русский.
            </Text>
            <ExtraBenefitContentFields content={content} onChange={setContent} />
          </div>

          {product && codes.length > 0 && (bonus ?? 0) > 0 ? (
            <Text variant="caption-2" color="hint">
              Правило: {plural(goalTarget ?? 0, ['упаковка', 'упаковки', 'упаковок'])} по{' '}
              {plural(codes.length, ['коду', 'кодам', 'кодам'])} → {formatSum(bonus ?? 0)}. Считается по чекам,
              отсканированным в приложении.
            </Text>
          ) : (
            <Text variant="caption-2" color="hint">
              Выберите товар и коды — здесь появится правило, которое увидит пользователь.
            </Text>
          )}
        </Flex>
      </Dialog.Body>
      <Dialog.Footer
        renderButtons={() => (
          <>
            <Button view="flat" size="l" onClick={onClose} disabled={save.isPending}>
              Отмена
            </Button>
            <Button view="action" size="l" onClick={() => save.mutate()} loading={save.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </>
        )}
      />

      <CatalogPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={pickProduct}
        description="Найдите препарат и выберите его — он будет показан на карточке предложения в приложении."
      />
    </>
  )
}
