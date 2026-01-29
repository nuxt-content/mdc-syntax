import type { BundledLanguage, BundledTheme } from 'shiki'

export interface ShikiOptions {
  /**
   * Theme to use for syntax highlighting
   * @default 'github-dark'
   */
  theme?: BundledTheme | string

  /**
   * Languages to preload. If not specified, languages will be loaded on demand.
   * @default undefined (load on demand)
   */
  languages?: BundledLanguage[]

  /**
   * Additional themes to preload
   * @default []
   */
  themes?: (BundledTheme | string)[]
}

export interface ParseOptions {
  /**
   * Whether to automatically unwrap single paragraphs in container components.
   * When enabled, if a container component (alert, card, callout, note, warning, tip, info)
   * has only a single paragraph child, the paragraph wrapper is removed and its children
   * become direct children of the container. This creates cleaner HTML output.
   *
   * @default true
   * @example
   * // With autoUnwrap: true (default)
   * // <alert><strong>Text</strong></alert>
   *
   * // With autoUnwrap: false
   * // <alert><p><strong>Text</strong></p></alert>
   */
  autoUnwrap?: boolean

  /**
   * Enable syntax highlighting for code blocks using Shiki or provide custom options
   * @default false
   */
  highlight?: boolean | ShikiOptions
}
