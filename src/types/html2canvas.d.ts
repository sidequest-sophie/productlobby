// Minimal ambient type declaration for the `html2canvas` package.
//
// `html2canvas` is referenced via a dynamic `import('html2canvas')` in
// src/components/campaigns/shareable-infographic.tsx but is not currently
// listed as a dependency in package.json, so no bundled or @types
// declarations are available. This file supplies just enough typing for
// that call site to type-check without resorting to `any`/`@ts-ignore`.
//
// NOTE: until `html2canvas` is added as an actual npm dependency, the
// "Download as Image" feature that relies on it will fail at runtime
// (the dynamic import will reject) even though it now type-checks.
declare module 'html2canvas' {
  interface Html2CanvasOptions {
    backgroundColor?: string
    scale?: number
    logging?: boolean
  }

  export default function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>
}
