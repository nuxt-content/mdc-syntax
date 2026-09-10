import type { MarkdownDocument } from 'comark'
import type { ShikiPrimitive } from 'shiki'
import type { ShikiLanguageLoader, ShikiOptions, ShikiThemeLoader } from '../internal/shiki.ts'
import {
  createShikiPlugin,
  getHighlighter as getCoreHighlighter,
  highlightCodeBlocks as highlightCoreCodeBlocks,
} from '../internal/shiki.ts'

export type {
  CodeBlockAttributes,
  ShikiGrammarContext,
  HighlightOptions,
  ShikiCoreOptions,
  ShikiLanguageLoader,
  ShikiOptions,
  ShikiThemeLoader,
} from '../internal/shiki.ts'
export { defaultGrammarContexts, resetHighlighter } from '../internal/shiki.ts'
export { comarkLanguage, comarkLanguages } from './shiki/language-comark.ts'

const defaultThemeLoaders: ShikiThemeLoader[] = [
  () => import('shiki/dist/themes/material-theme-lighter.mjs').then((module) => module.default),
  () => import('shiki/dist/themes/material-theme-palenight.mjs').then((module) => module.default),
]

const defaultLanguageLoaders: ShikiLanguageLoader[] = [
  () => import('shiki/dist/langs/vue.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/tsx.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/svelte.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/typescript.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/javascript.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/bash.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/json.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/yaml.mjs').then((module) => module.default),
  () => import('shiki/dist/langs/astro.mjs').then((module) => module.default),
]

export function getHighlighter(options: ShikiOptions = {}): Promise<ShikiPrimitive> {
  return getCoreHighlighter(options, defaultThemeLoaders, defaultLanguageLoaders)
}

export function highlightCodeBlocks(tree: MarkdownDocument, options: ShikiOptions = {}): Promise<MarkdownDocument> {
  return highlightCoreCodeBlocks(tree, options, defaultThemeLoaders, defaultLanguageLoaders)
}

export default createShikiPlugin(defaultThemeLoaders, defaultLanguageLoaders)
