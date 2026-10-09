import { Text } from '@gravity-ui/uikit'

/**
 * Pulso mark from Figma (Pulso → Variant=Prod), inlined so it follows the theme:
 * both shapes use currentColor, the back shape slightly dimmed to keep the two-tone look.
 */
export function PulsoMark({ size = 32 }: { size?: number }) {
  return (
    <span className="wordmark__mark" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M272 0C342.692 2.06165e-06 400 57.3076 400 128V136C400 206.692 342.692 264 272 264H145.32C145.32 264 156 204.431 194 181.5C232 158.569 245.5 156 245.5 156H268C281.255 156 292 145.255 292 132C292 118.745 281.255 108 268 108H183C127.772 108 83 63.2285 83 8V0H272Z"
          fill="currentColor"
          opacity={0.72}
        />
        <path
          d="M51.6573 227.337C64.323 185.003 103.273 156 147.462 156H173H268C268 156 250.5 155 202.5 182.5C161.5 205.99 151.321 264 151.321 264L130.186 330.351C116.972 371.833 78.4387 400 34.9027 400H0L51.6573 227.337Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

/** Sidebar wordmark. `compact` shows only the mark. */
export function PulsoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <PulsoMark />
      {compact ? null : <Text variant="header-2">Pulso</Text>}
    </>
  )
}
