import type { SVGProps } from 'react'

/*
 * Solid twins for Gravity icons that ship without a Fill variant.
 * Drawn on the same 16px grid from the originals' outer contours, with the
 * inner marks cut out via evenodd so they read like Gravity's own *Fill icons.
 */

/** Solid receipt: Gravity `Receipt` outline filled, with the two text lines cut out. */
export function ReceiptFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.3 2 3.9.5 2 2v13.5l1.5-.776L4.9 14l2.4 1.5L9.7 14l2.4 1.5L14 14V.5l-1.5.776L11.1 2 8.7.5zM5 6.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 6.5m.75 2.25a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5z"
      />
    </svg>
  )
}

/** Solid coin: Gravity `CircleDollar` disc filled, with the dollar sign cut out. */
export function CircleDollarFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0M8.75 4.25a.75.75 0 0 0-1.5 0v.339a2.5 2.5 0 0 0-1.007.47 1.95 1.95 0 0 0-.74 1.546c0 .764.474 1.265.94 1.559.456.287 1.007.448 1.448.547.462.102.843.191 1.118.341.228.125.275.224.275.376 0 .102-.04.217-.248.341-.224.135-.577.229-.982.229-.344 0-.683-.114-.953-.29-.281-.184-.42-.388-.457-.506a.75.75 0 1 0-1.43.452c.171.543.591 1 1.068 1.31.284.185.612.335.968.429v.357a.75.75 0 0 0 1.5 0v-.313c.375-.067.74-.19 1.058-.382.53-.319.976-.864.976-1.627 0-.864-.51-1.394-1.055-1.692-.478-.26-1.056-.389-1.46-.478l-.053-.012c-.386-.086-.736-.202-.973-.352-.227-.142-.24-.236-.24-.29a.45.45 0 0 1 .18-.375c.134-.108.403-.227.87-.227.47 0 .742.11.9.218a.83.83 0 0 1 .316.41.75.75 0 0 0 1.407-.52 2.33 2.33 0 0 0-.878-1.13 2.7 2.7 0 0 0-1.048-.417z"
      />
    </svg>
  )
}

/** Solid list-check: Gravity `ListCheck` with heavier ticks and filled line bars. */
export function ListCheckFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.53 1.97a1 1 0 0 1 0 1.414l-2.25 2.25a1 1 0 0 1-1.414 0l-1-1A1 1 0 0 1 2.28 3.22l.293.293 1.543-1.543a1 1 0 0 1 1.414 0M6.5 3.75c0-.69.56-1.25 1.25-1.25h6.5a1.25 1.25 0 1 1 0 2.5h-6.5c-.69 0-1.25-.56-1.25-1.25m-.97 3.03a1 1 0 0 1 0 1.414l-2.25 2.25a1 1 0 0 1-1.414 0l-1-1A1 1 0 0 1 2.28 8.03l.293.293 1.543-1.543a1 1 0 0 1 1.414 0M7.75 7a1.25 1.25 0 1 0 0 2.5h6.5a1.25 1.25 0 1 0 0-2.5zm-2.22 4.72a1 1 0 0 1 0 1.414l-2.25 2.25a1 1 0 0 1-1.414 0l-1-1a1 1 0 1 1 1.414-1.414l.293.293 1.543-1.543a1 1 0 0 1 1.414 0m2.22-.22a1.25 1.25 0 1 0 0 2.5h6.5a1.25 1.25 0 1 0 0-2.5z"
      />
    </svg>
  )
}
