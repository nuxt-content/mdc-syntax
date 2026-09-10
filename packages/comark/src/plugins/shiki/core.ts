import type { MarkdownDocument } from 'comark'
import type { ComarkPlugin } from 'comark'
import type { ShikiPrimitive } from 'shiki'
import type { ShikiCoreOptions } from '../../internal/shiki.ts'
import {
  createShikiPlugin,
  getHighlighter as getCoreHighlighter,
  highlightCodeBlocks as highlightCoreCodeBlocks,
} from '../../internal/shiki.ts'

export type {
  CodeBlockAttributes,
  ShikiGrammarContext,
  HighlightOptions,
  ShikiCoreOptions,
  ShikiLanguageLoader,
  ShikiOptions,
  ShikiThemeLoader,
} from '../../internal/shiki.ts'
export { defaultGrammarContexts, resetHighlighter } from '../../internal/shiki.ts'
export { comarkLanguage, comarkLanguages } from './language-comark.ts'

const shiki = createShikiPlugin<ShikiCoreOptions>()

export function getHighlighter(options: ShikiCoreOptions): Promise<ShikiPrimitive> {
  return getCoreHighlighter(options)
}

export function highlightCodeBlocks(tree: MarkdownDocument, options: ShikiCoreOptions): Promise<MarkdownDocument> {
  return highlightCoreCodeBlocks(tree, options)
}

/**
 * Core Shiki plugin — no default themes or languages.
 * `themes` and `languages` are required.
 */
export default function (options: ShikiCoreOptions): ComarkPlugin {
  return shiki(options)
}
