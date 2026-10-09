import { Label } from '@gravity-ui/uikit'
import type { Audience } from '../api/types'
import { platformLabel } from '../lib/constants'
import { plural } from '../lib/format'

interface Props {
  audience: Audience
  targetPlatform?: string
  targetedCount?: number
}

export function AudienceLabel({ audience, targetPlatform, targetedCount }: Props) {
  if (audience === 'broadcast') return <Label theme="warning">Всем</Label>
  if (audience === 'platform') return <Label theme="info">Все на {platformLabel(targetPlatform)}</Label>
  const n = targetedCount ?? 0
  return <Label theme="normal">{n ? plural(n, ['пользователь', 'пользователя', 'пользователей']) : 'Выбранные'}</Label>
}
