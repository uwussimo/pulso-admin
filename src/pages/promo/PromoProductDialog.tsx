import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Flex,
  NumberInput,
  Switch,
  Text,
  TextArea,
  TextInput,
} from '@gravity-ui/uikit'
import { useMutation } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'
import { promoApi } from '../../api/promo'
import type { CatalogDrug, PromoPackage, PromoProduct } from '../../api/types'
import { Field } from '../../components/Field'
import { errorText } from '../../lib/errors'
import { formatNumber } from '../../lib/format'
import { fromDateInput, startOfToday, sums, toDateInput } from './promo.utils'

interface Props {
  open: boolean
  /** Set when editing; null when creating from a picked catalog drug. */
  product: PromoProduct | null
  drug: CatalogDrug | null
  onClose: () => void
  onSaved: (created: boolean) => void
}

export function PromoProductDialog({ open, product, drug, onClose, onSaved }: Props) {
  const titleId = useId()
  // Remount the form on every open so an edit never shows the previous product's values.
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
      <Dialog.Header caption={product ? product.name : 'Новый промо-товар'} id={titleId} />
      {open ? (
        <PromoProductForm key={openCount} product={product} drug={drug} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </Dialog>
  )
}

type FormProps = Omit<Props, 'open'>

function PromoProductForm({ product, drug, onClose, onSaved }: FormProps) {
  const editing = product !== null

  // Edit starts from the stored row; create starts from the catalog drug the
  // operator picked, with its packages checked and its reference price in place.
  const [bonus, setBonus] = useState<number | null>(product?.bonus_amount ?? 0)
  const [maxPrice, setMaxPrice] = useState<number | null>(
    product?.max_price ?? drug?.reference_retail_price_with_vat ?? 0,
  )
  const [priceNote, setPriceNote] = useState(product?.price_note ?? '')
  const [endsAt, setEndsAt] = useState(toDateInput(product?.ends_at))
  const [isNew, setIsNew] = useState(product?.is_new ?? false)
  const [appliesTo, setAppliesTo] = useState(product?.applies_to ?? '')
  const [position, setPosition] = useState<number | null>(product?.position ?? 0)
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() =>
    (product?.packages ?? drug?.packages ?? []).map((p) => p.ikpu_code),
  )
  const [error, setError] = useState<string | null>(null)
  // Captured once per open (the form remounts on every open), so the `min`
  // bound cannot drift mid-render and matches the validation rule below.
  const [today] = useState(() => toDateInput(new Date().toISOString()))

  const allPackages: PromoPackage[] = useMemo(() => product?.packages ?? drug?.packages ?? [], [product, drug])

  const save = useMutation({
    mutationFn: () => {
      if (!editing && !drug) throw new Error('Выберите товар из каталога')
      const bonusValue = bonus ?? 0
      const priceValue = maxPrice ?? 0
      if (!Number.isInteger(bonusValue) || bonusValue < 0) throw new Error('Бонус должен быть целым числом от 0')
      if (!Number.isInteger(priceValue) || priceValue < 0) throw new Error('Цена должна быть целым числом от 0')
      if (endsAt && new Date(fromDateInput(endsAt) ?? '') < startOfToday())
        throw new Error('Дата окончания не может быть в прошлом')
      if (selectedCodes.length === 0) throw new Error('Выберите хотя бы один ИКПУ-код')

      const packages = allPackages
        .filter((p) => selectedCodes.includes(p.ikpu_code))
        .map((p) => ({
          ikpu_code: p.ikpu_code,
          package_code: p.package_code,
          package_name: p.package_name,
          is_default: p.is_default,
          is_similar: p.is_similar,
          has_marks: p.has_marks,
          position: p.position,
        }))

      // `''` → undefined is what makes PUT a partial update server-side:
      // an untouched field is left alone instead of blanked.
      const common = {
        bonus_amount: bonusValue,
        max_price: priceValue,
        price_note: priceNote.trim() || undefined,
        ends_at: fromDateInput(endsAt),
        is_new: isNew,
        applies_to: appliesTo.trim() || undefined,
        position: position ?? 0,
        packages,
      }

      if (editing) return promoApi.update(product.id, common)
      return promoApi.create({ nomenclature_id: drug!.id, ...common })
    },
    onSuccess: () => onSaved(!editing),
    onError: (e) => setError(errorText(e)),
  })

  function toggleCode(code: string) {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  const title = product?.name ?? drug?.name ?? ''

  return (
    <>
      <Dialog.Body>
        <Flex direction="column" gap={4}>
          {error ? <Alert theme="danger" message={error} /> : null}

          <div className="product-cell">
            {(product?.image_url ?? drug?.image_url) ? (
              <img src={product?.image_url ?? drug?.image_url} alt="" width={48} height={48} />
            ) : null}
            <div className="cell-title">
              <Text variant="subheader-1" ellipsis>
                {title}
              </Text>
              <Text variant="caption-2" color="secondary" ellipsis>
                {product?.maker_name ?? drug?.maker?.name ?? ''}
              </Text>
            </div>
          </div>
          <Text variant="caption-2" color="hint">
            {editing
              ? 'Товар выбран из каталога и в панели не меняется.'
              : 'Промо начнёт действовать в приложении сразу после сохранения.'}
          </Text>

          <div className="form__row">
            <Field label="Бонус за штуку, сум" required hint="Фиксированная сумма за каждую упаковку.">
              <NumberInput size="l" min={0} step={100} value={bonus} onUpdate={setBonus} />
            </Field>
            <Field label="Цена в аптеках, сум" hint="0 — не показывать цену. Подставлена справочная цена из каталога.">
              <NumberInput size="l" min={0} step={1000} value={maxPrice} onUpdate={setMaxPrice} />
            </Field>
          </div>

          <Field
            label="Что означает эта цена?"
            hint="Показывается под ценой на карточке товара, например «по акции производителя»."
          >
            <TextInput size="l" value={priceNote} onUpdate={setPriceNote} placeholder="Необязательно" />
          </Field>

          <div className="form__row">
            <Field
              label="Действует до"
              hint="Оставьте пустым, чтобы товар действовал бессрочно. Дата в прошлом недопустима."
            >
              {/* @gravity-ui/uikit ships no DatePicker — a native input keeps the
                  dependency count at zero and takes the yyyy-mm-dd the backend wants.
                  Styled by the `.field input[type='date']` rule in theme.css. */}
              <input type="date" value={endsAt} min={today} onChange={(e) => setEndsAt(e.target.value)} />
            </Field>
            <Field label="Порядок" hint="Чем меньше, тем выше в списке приложения.">
              <NumberInput size="l" min={0} value={position} onUpdate={setPosition} />
            </Field>
          </div>

          <Switch size="l" checked={isNew} onUpdate={setIsNew}>
            NEW
            <Text variant="caption-2" color="hint" as="div">
              Показывать бейдж NEW на карточке товара в приложении.
            </Text>
          </Switch>

          <Field label="Текст «где действует»" hint="Строка под названием: города, аптеки, условия.">
            <TextArea size="l" minRows={2} maxRows={4} value={appliesTo} onUpdate={setAppliesTo} />
          </Field>

          <Field
            label="ИКПУ-коды в акции"
            required
            hint={
              allPackages.length === 0
                ? 'У препарата нет ИКПУ-кодов в каталоге.'
                : `Выбрано ${formatNumber(selectedCodes.length)} из ${formatNumber(allPackages.length)}. По этим кодам считается эффект.`
            }
          >
            <Flex direction="column" gap={2}>
              {allPackages.map((p) => (
                <Checkbox
                  key={p.ikpu_code}
                  checked={selectedCodes.includes(p.ikpu_code)}
                  onUpdate={() => toggleCode(p.ikpu_code)}
                >
                  <Text variant="body-2">{p.package_name || p.ikpu_code}</Text>
                  <Text variant="caption-2" color="secondary" className="num">
                    {p.ikpu_code}
                  </Text>
                </Checkbox>
              ))}
            </Flex>
          </Field>

          {maxPrice && maxPrice > 0 ? (
            <Text variant="caption-2" color="hint">
              В приложении будет «Не более {sums(maxPrice)}».
            </Text>
          ) : null}
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
    </>
  )
}
