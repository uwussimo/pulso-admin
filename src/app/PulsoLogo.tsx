import { Text } from '@gravity-ui/uikit'

/** Sidebar wordmark. `compact` shows only the mark. */
export function PulsoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <span className="wordmark__mark" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
          <path d="M5 17h5l3-7 5 12 3-7h6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {compact ? null : <Text variant="header-2">Pulso</Text>}
    </>
  )
}
