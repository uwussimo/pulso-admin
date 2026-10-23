import { Button, Dialog, Flex, Icon, Loader, Text, TextInput, useToaster } from '@gravity-ui/uikit'
import { Magnifier } from '@gravity-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import { nomenclatureApi } from '../../api/promo'
import type { CatalogDrug } from '../../api/types'
import { errorText } from '../../lib/errors'
import { NomenclatureCell } from './NomenclatureCell'
import { sums } from './promo.utils'

interface Props {
  open: boolean
  onClose: () => void
  onPicked: (drug: CatalogDrug) => void
  /** What picking the product is for — the offer and the promo need different wording. */
  description?: string
}

const SEARCH_LIMIT = 20

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/**
 * The product identity is chosen, never typed: the catalog belongs to
 * Dorim.Pharmacy, so a free-form name field would let an operator create a
 * promo for a drug that does not exist.
 */
export function CatalogPickerDialog({ open, onClose, onPicked, description }: Props) {
  const toaster = useToaster()
  const titleId = useId()
  const [term, setTerm] = useState('')
  const debounced = useDebounced(term.trim(), 350)

  const search = useQuery({
    queryKey: ['nomenclatures', 'search', debounced],
    queryFn: ({ signal }) => nomenclatureApi.search({ query: debounced, limit: SEARCH_LIMIT }, signal),
    // An empty box must not fire a full catalog scan.
    enabled: open && debounced.length >= 2,
  })

  function close() {
    setTerm('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby={titleId}
      maxWidth="m"
      fullWidth
      onTransitionOutComplete={() => setTerm('')}
    >
      <Dialog.Header caption="Из каталога препаратов" id={titleId} />
      <Dialog.Body>
        <Flex direction="column" gap={3}>
          <Text variant="body-2" color="secondary">
            {description ?? 'Найдите препарат и выберите его — промо создастся с его ИКПУ-кодами и справочной ценой.'}
          </Text>

          <TextInput
            size="l"
            value={term}
            onUpdate={setTerm}
            placeholder="Название, производитель или ИКПУ — от 2 символов"
            autoFocus
            startContent={
              <Icon data={Magnifier} size={16} style={{ marginInlineStart: 8, color: 'var(--g-color-text-hint)' }} />
            }
            hasClear
            controlProps={{ autoComplete: 'off' }}
          />

          {debounced.length < 2 ? (
            <Text variant="body-2" color="hint">
              Введите хотя бы два символа.
            </Text>
          ) : search.isPending ? (
            <Flex gap={2} alignItems="center">
              <Loader size="s" />
              <Text variant="body-2" color="hint">
                Ищем в каталоге…
              </Text>
            </Flex>
          ) : search.isError ? (
            <Text variant="body-2" color="danger">
              {errorText(search.error)}
            </Text>
          ) : (search.data?.items.length ?? 0) === 0 ? (
            <Text variant="body-2" color="hint">
              Ничего не нашлось. Проверьте запрос или попробуйте часть названия.
            </Text>
          ) : (
            <>
              <Text variant="caption-2" color="hint">
                Найдено {search.data?.count ?? 0}
              </Text>
              <div style={{ maxHeight: 320, overflowY: 'auto', margin: '0 calc(var(--g-spacing-3) * -1)' }}>
                {search.data?.items.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="catalog-row"
                    onClick={() => {
                      onPicked(d)
                      toaster.add({ name: 'catalog-picked', theme: 'info', title: d.full_name || d.name })
                      setTerm('')
                    }}
                  >
                    <NomenclatureCell
                      imageSize={40}
                      titleVariant="body-2"
                      imageUrl={d.image_url}
                      fullName={d.full_name || d.name}
                      makerName={d.maker?.name}
                      makerCountry={d.maker?.country_name}
                    />
                    {d.reference_retail_price_with_vat ? (
                      <Text variant="body-2" color="secondary" className="num">
                        ~ {sums(d.reference_retail_price_with_vat)}
                      </Text>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          )}
        </Flex>
      </Dialog.Body>
      <Dialog.Footer
        renderButtons={() => (
          <Button view="flat" size="l" onClick={close}>
            Отмена
          </Button>
        )}
      />
    </Dialog>
  )
}
