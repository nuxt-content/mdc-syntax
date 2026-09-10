import type { Node, MarkdownDocument, ComarkPlugin, ComponentManifest, ParserOptions, ComarkParseFn } from 'comark'
import type { Component, Snippet } from 'svelte'

export interface ComponentResolverProps {
  promise: Promise<any>
  props?: Record<string, any>
  children?: Snippet
}

export type ComponentResolver = Component<ComponentResolverProps>

export interface MarkdownNodeProps {
  node: Node
  components?: Record<string, any>
  componentsManifest?: ComponentManifest
  resolver?: ComponentResolver
  /** CSS class for the streaming caret, or null if no caret. Threaded recursively to the last child. */
  caretClass?: string | null
}

export interface MarkdownDocumentProps {
  /** The parsed Markdown document to render */
  value?: MarkdownDocument
  components?: Record<string, any>
  componentsManifest?: ComponentManifest
  resolver?: ComponentResolver
  streaming?: boolean
  caret?: boolean | { class: string }
  class?: string
  /**
   * Document key used to subscribe to live updates via `globalThis.comarkContext`.
   * Falls back to the document's own `meta.key` when set by a plugin.
   */
  documentKey?: string
}

export interface MarkdownProps {
  /** The markdown content to parse and render, or a pre-parsed MarkdownDocument */
  value?: string | MarkdownDocument
  options?: Exclude<ParserOptions, 'plugins'>
  plugins?: ComarkPlugin[]

  /**
   * Parser to use instead of one resolved from `options` and `plugins`
   */
  parser?: ComarkParseFn
  /**
   * Strip wrapper tags from the top level of the document — shorthand for
   * `options.unwrap`. `true` unwraps `<p>`; a space-separated string or array
   * unwraps the listed tags.
   */
  unwrap?: boolean | string | string[]
  components?: Record<string, any>
  componentsManifest?: ComponentManifest
  streaming?: boolean
  caret?: boolean | { class: string }
  class?: string
}
