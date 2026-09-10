import React from 'react'
import { parseMarkdown } from 'comark'
import type { MarkdownDocument as MarkdownDocumentType, ParserOptions } from 'comark'
import { isMarkdownDocument } from 'comark/utils'
import { MarkdownDocument } from './MarkdownDocument.tsx'
import { MarkdownClient } from './MarkdownClient.tsx'

export interface MarkdownProps {
  /**
   * The children content to parse and render
   */
  children?: React.ReactNode

  /**
   * The markdown content to parse and render, or a pre-parsed MarkdownDocument
   */
  value?: string | MarkdownDocumentType

  /**
   * Parser options (excluding plugins)
   */
  options?: Exclude<ParserOptions, 'plugins'>

  /**
   * Additional plugins to use
   */
  plugins?: ParserOptions['plugins']

  /**
   * Custom component mappings for element tags
   * Key: tag name (e.g., 'h1', 'p', 'MyComponent')
   * Value: React component
   */
  components?: Record<string, React.ComponentType<any>>

  /**
   * Dynamic component resolver function
   * Used to resolve components that aren't in the components map
   */
  componentsManifest?: (name: string) => Promise<{ default: React.ComponentType<any> }>

  /**
   * Strip wrapper tags from the top level of the document — shorthand for
   * `options.unwrap`. `true` unwraps `<p>` (single-line rendering); a
   * space-separated string or array unwraps the listed tags. Useful for inline
   * usage like `<button><Markdown value={text} unwrap /></button>`.
   */
  unwrap?: boolean | string | string[]

  /**
   * Enable streaming mode — delegates to MarkdownClient for client-side re-rendering
   * when the value prop changes. Use this for LLM streaming output.
   */
  streaming?: boolean

  /**
   * If caret is true, a caret will be appended to the document's last text node
   * If caret is an object, it will be appended with the given class
   */
  caret?: boolean | { class: string }

  /**
   * Additional data to pass to the renderer — referenced from markdown
   * via `:`-prefixed props using dot paths (e.g. `:foo="data.user.name"`).
   */
  data?: Record<string, unknown>

  /**
   * Additional className for the wrapper div
   */
  className?: string
}

/**
 * Markdown component
 *
 * Async server component that parses raw markdown on the server and renders it.
 * When `streaming` is true, delegates to MarkdownClient for client-side re-rendering.
 *
 * @example
 * ```tsx
 * import { Markdown } from '@comark/react'
 * import CustomHeading from './CustomHeading'
 *
 * const customComponents = {
 *   h1: CustomHeading,
 *   alert: AlertComponent,
 * }
 *
 * export default function App() {
 *   const content = `
 *     # Hello World
 *
 *     This is a **markdown** document with *Comark* components.
 *
 *     ::alert{type="info"}
 *     This is an alert component
 *     ::
 *   `
 *
 *   return <Markdown value={content} components={customComponents} />
 * }
 * ```
 */
export async function Markdown({
  children,
  value,
  options = {},
  plugins = [],
  unwrap = false,
  components: customComponents = {},
  componentsManifest,
  streaming = false,
  caret = false,
  data,
  className,
}: MarkdownProps) {
  // Pre-parsed document — skip parsing and render directly
  if (isMarkdownDocument(value)) {
    return (
      <MarkdownDocument
        value={value}
        components={customComponents}
        componentsManifest={componentsManifest}
        streaming={streaming}
        className={className}
        caret={caret}
        data={data}
      />
    )
  }

  const source = children ? String(children) : ((value as string | undefined) ?? '')
  // `unwrap` prop is a shorthand for the `unwrap` parse option; an explicit
  // `options.unwrap` still wins when the prop is left at its default.
  const parseOptions = unwrap ? { ...options, unwrap } : options

  if (streaming) {
    return (
      <MarkdownClient
        value={source}
        options={parseOptions}
        plugins={plugins}
        components={customComponents}
        componentsManifest={componentsManifest}
        streaming={streaming}
        caret={caret}
        data={data}
        className={className}
      />
    )
  }

  const parsed = await parseMarkdown(source, { ...parseOptions, plugins }, { streaming })

  return (
    <MarkdownDocument
      value={parsed}
      components={customComponents}
      componentsManifest={componentsManifest}
      streaming={streaming}
      className={className}
      caret={caret}
      data={data}
    />
  )
}
