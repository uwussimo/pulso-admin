import { Button, Checkbox, Flex, Icon, Text, TextInput } from '@gravity-ui/uikit'
import { Plus, Xmark } from '@gravity-ui/icons'
import { useState } from 'react'
import type { CatalogPackage } from '../../api/types'
import { plural } from '../../lib/format'

interface Props {
  /** The catalogue packages of the offer's product — the codes that resolve. */
  packages: CatalogPackage[]
  /** The offer's own code list. */
  codes: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

/**
 * The ИКПУ codes that count toward the goal.
 *
 * The offer carries its own code list, and the operator picks it from the
 * catalogue or types it in. A code the catalogue does not carry is not
 * rejected — it simply never matches a receipt — so the form shows which of
 * the stored codes resolve instead of hiding the rest.
 */
export function CodeListField({ packages, codes, onChange, disabled }: Props) {
  const [typed, setTyped] = useState('')

  const catalogueCodes = new Set(packages.map((p) => p.ikpu_code))
  // A stored code the catalogue does not know about is still a real code the
  // operator typed — it belongs in the manual list, not nowhere.
  const manual = codes.filter((c) => !catalogueCodes.has(c))

  function toggle(code: string) {
    onChange(codes.includes(code) ? codes.filter((c) => c !== code) : [...codes, code])
  }

  function addTyped() {
    const code = typed.trim()
    if (!code || codes.includes(code)) {
      setTyped('')
      return
    }
    onChange([...codes, code])
    setTyped('')
  }

  return (
    <Flex direction="column" gap={3}>
      <Flex gap={2} alignItems="center">
        <TextInput
          size="l"
          value={typed}
          onUpdate={setTyped}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTyped()
            }
          }}
          placeholder="ИКПУ-код, которого нет в каталоге"
          disabled={disabled}
          controlProps={{ autoComplete: 'off' }}
        />
        <Button view="outlined" size="l" onClick={addTyped} disabled={disabled || !typed.trim()}>
          <Icon data={Plus} size={16} />
          Добавить
        </Button>
      </Flex>

      {packages.length > 0 ? (
        <Flex direction="column" gap={2}>
          {packages.map((p) => (
            <Checkbox
              key={p.ikpu_code}
              checked={codes.includes(p.ikpu_code)}
              onUpdate={() => toggle(p.ikpu_code)}
              disabled={disabled}
            >
              <Text variant="body-2">{p.package_name || p.ikpu_code}</Text>
              <Text variant="caption-2" color="secondary" className="num">
                {p.ikpu_code}
              </Text>
            </Checkbox>
          ))}
        </Flex>
      ) : (
        <Text variant="caption-2" color="hint">
          У товара нет ИКПУ-кодов в каталоге — добавьте их вручную.
        </Text>
      )}

      {manual.length > 0 ? (
        <Flex direction="column" gap={2}>
          <Text variant="caption-2" color="secondary">
            Добавленные вручную
          </Text>
          {manual.map((code) => (
            <Flex key={code} gap={2} alignItems="center">
              <Text variant="body-2" className="num" style={{ flex: 1, minWidth: 0 }}>
                {code}
              </Text>
              <Button
                view="flat"
                size="m"
                onClick={() => toggle(code)}
                disabled={disabled}
                aria-label={`Убрать код ${code}`}
              >
                <Icon data={Xmark} size={16} />
              </Button>
            </Flex>
          ))}
        </Flex>
      ) : null}

      <Text variant="caption-2" color="hint">
        Засчитано {plural(codes.length, ['код', 'кода', 'кодов'])}. Покупки по кодам, которых здесь нет, в цель не идут.
      </Text>
    </Flex>
  )
}
