import type { LanguageRegistration, ShikiTransformer, ShikiPrimitive, ThemeRegistration, ThemedToken } from 'shiki'
import type { ElementNode, Node, MarkdownDocument, ElementNodeAttributes } from 'comark'
import { defineComarkPlugin } from '../utils/helpers.ts'
import { createShikiPrimitive } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { codeToHast, codeToTokens, getTokenStyleObject, stringifyTokenStyle } from 'shiki/core'
import comarkLanguages from '../plugins/shiki/language-comark.ts'

/**
 * A pseudo-language: a name authors may write in `{lang="…"}` or a fence info
 * string, mapped onto a real Shiki grammar plus optional seed source that puts
 * that grammar into the right state before the real code is tokenized.
 */
export interface ShikiGrammarContext {
  /** Real Shiki grammar to tokenize with. Must be registered via `languages`. */
  lang: string
  /**
   * Source prepended to the code purely to establish grammar state. It is
   * tokenized and then discarded, so none of its tokens reach the output.
   */
  grammarContextCode?: string
}

/**
 * Pseudo-languages Comark ships out of the box, mirroring the `@nuxtjs/mdc`
 * conventions so `{lang="ts-type"}` and `{lang="vue-html"}` keep working for
 * sites migrating off it. Same class of opinion as the `md`/`markdown`/`comark`
 * to `mdc` and `json-render` to `json` aliases registered on the highlighter
 * (see `langAlias` below). Both target languages are in the standard entry's
 * default set, and this map is data only, so it pulls in no grammar chunk.
 */
export const defaultGrammarContexts: Readonly<Record<string, ShikiGrammarContext>> = {
  'ts-type': { lang: 'typescript', grammarContextCode: 'let a:' },
  'vue-html': { lang: 'vue', grammarContextCode: '<template>' },
}

export interface ShikiCoreOptions {
  /**
   * Languages to register. Required — core has no default language set.
   */
  languages: Array<LanguageRegistration | LanguageRegistration[]>

  /**
   * Themes to register. Required — core has no default themes.
   * Provide at least one of `light` or `dark`.
   */
  themes: {
    light?: ThemeRegistration
    dark?: ThemeRegistration
  }

  /**
   * Transformers to apply to the code blocks
   * @default undefined
   */
  transformers?: ShikiTransformer[]

  /**
   * Whether to add pre styles to the code blocks
   * @default false
   */
  preStyles?: boolean

  /**
   * Whether to highlight inline code that declares a language, e.g.
   * `` `Ref<T>`{lang="ts-type"} `` or `` `x`{language="ts"} ``. `lang` wins
   * over `language`.
   *
   * Inline code uses the fast token path only: `transformers` and `preStyles`
   * are block-only and are not applied. Inline code naming a grammar that is
   * not registered is left exactly as authored, with no class and no spans, so
   * a natural-language `lang="fr"` is never mistaken for code.
   *
   * @default true
   */
  inlineCode?: boolean

  /**
   * Pseudo-languages usable in `{lang="…"}` and in fence info strings, merged
   * on top of {@link defaultGrammarContexts}. Set an entry to `false` to drop
   * a built-in one and treat the name as a plain grammar name.
   *
   * @example
   * grammarContexts: {
   *   'sql-expr': { lang: 'sql', grammarContextCode: 'select ' },
   *   'ts-type': false,
   * }
   */
  grammarContexts?: Record<string, ShikiGrammarContext | false>
}

/**
 * Options for the standard `comark/plugins/shiki` entry.
 * Themes and languages are optional — defaults ship with that entry.
 */
export interface ShikiOptions extends Omit<ShikiCoreOptions, 'languages' | 'themes'> {
  /**
   * Whether to register the built-in default language set.
   * @default true
   */
  registerDefaultLanguages?: boolean

  /**
   * Whether to register the built-in default theme definitions.
   * @default true
   */
  registerDefaultThemes?: boolean

  /**
   * Additional languages to register (merged on top of the default set when
   * `registerDefaultLanguages` is true).
   */
  languages?: Array<LanguageRegistration | LanguageRegistration[]>

  /**
   * Themes to use. Defaults to Material light/dark when `registerDefaultThemes` is true.
   */
  themes?: {
    light?: ThemeRegistration
    dark?: ThemeRegistration
  }
}

/**
 * @deprecated Use {@link ShikiOptions}. Kept for the deprecated `highlight` plugin alias.
 */
export type HighlightOptions = ShikiOptions

export interface CodeBlockAttributes {
  language?: string
  class?: string
  highlights?: number[]
  meta?: string
}

export type ShikiThemeLoader = () => Promise<ThemeRegistration>
export type ShikiLanguageLoader = () => Promise<LanguageRegistration | LanguageRegistration[]>

let highlighter: ShikiPrimitive | null = null
let highlighterPromise: Promise<ShikiPrimitive> | null = null
let defaultThemesLoaded = false
let defaultLanguagesLoaded = false
const loadedThemes: Set<string> = new Set()
const loadedLanguages: Set<string> = new Set()

/**
 * Get or create the Shiki highlighter instance
 * Uses a singleton pattern to avoid creating multiple highlighters
 */
export async function getHighlighter(
  options: ShikiOptions = {},
  defaultThemeLoaders: ShikiThemeLoader[] = [],
  defaultLanguageLoaders: ShikiLanguageLoader[] = []
): Promise<ShikiPrimitive> {
  if (highlighter) {
    // Fast path: skip resolveRegistrations() when no custom themes/languages are requested
    if (
      !options.themes &&
      !options.languages &&
      (defaultThemeLoaders.length === 0 || defaultThemesLoaded) &&
      (defaultLanguageLoaders.length === 0 || defaultLanguagesLoaded)
    ) {
      return highlighter
    }
    const { themes, languages } = await resolveRegistrations(options, defaultThemeLoaders, defaultLanguageLoaders)
    await Promise.all(themes.map((theme) => loadTheme(highlighter!, theme)))
    await Promise.all(languages.map((language) => loadLanguage(highlighter!, language)))
    if (defaultThemeLoaders.length > 0 && options.registerDefaultThemes !== false) defaultThemesLoaded = true
    if (defaultLanguageLoaders.length > 0 && options.registerDefaultLanguages !== false) defaultLanguagesLoaded = true

    return highlighter
  }

  if (highlighterPromise) {
    return highlighterPromise
  }

  try {
    highlighterPromise = (async () => {
      const { themes, languages } = await resolveRegistrations(options, defaultThemeLoaders, defaultLanguageLoaders)
      const hl = createShikiPrimitive({
        themes: themes,
        langs: languages,
        langAlias: {
          md: 'mdc',
          markdown: 'mdc',
          comark: 'mdc',
          'json-render': 'json',
          'yaml-render': 'yaml',
        },
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      })

      await Promise.all(themes.map((theme) => loadTheme(hl, theme)))
      await Promise.all(languages.map((language) => loadLanguage(hl, language)))
      if (defaultThemeLoaders.length > 0 && options.registerDefaultThemes !== false) defaultThemesLoaded = true
      if (defaultLanguageLoaders.length > 0 && options.registerDefaultLanguages !== false) defaultLanguagesLoaded = true

      return hl
    })() as Promise<ShikiPrimitive>

    highlighter = await highlighterPromise
    highlighterPromise = null

    return highlighter
  } catch (error) {
    console.error('Failed to create highlighter: make sure `shiki` is installed', error)
    throw error
  }
}

async function resolveRegistrations(
  options: ShikiOptions,
  defaultThemeLoaders: ShikiThemeLoader[],
  defaultLanguageLoaders: ShikiLanguageLoader[]
) {
  const themes = Object.values(options.themes || {}).filter(Boolean) as ThemeRegistration[]
  const languages = [...(options.languages || [])] as Array<LanguageRegistration | LanguageRegistration[]>
  const promises: Array<Promise<{ type: 'theme' | 'lang'; value: any }>> = []

  // Default loaders are only provided by the standard entry; core passes empty arrays.
  if (options.registerDefaultThemes !== false) {
    for (const loadTheme of defaultThemeLoaders) {
      promises.push(loadTheme().then((value) => ({ type: 'theme' as const, value })))
    }
  }
  if (options.registerDefaultLanguages !== false) {
    for (const loadLanguage of defaultLanguageLoaders) {
      promises.push(loadLanguage().then((value) => ({ type: 'lang' as const, value })))
    }
  }

  const results = await Promise.all(promises)
  for (const result of results) {
    if (result.type === 'theme') themes.push(result.value)
    else languages.push(result.value)
  }
  // Built-in Comark grammar (mdc); always registered
  languages.push(comarkLanguages)

  return { themes, languages }
}

async function loadTheme(hl: ShikiPrimitive, theme: ThemeRegistration) {
  if (loadedThemes.has(theme.name || '')) {
    return
  }
  await hl.loadTheme(theme)
  loadedThemes.add(theme.name || '')
}

async function loadLanguage(hl: ShikiPrimitive, language: LanguageRegistration | LanguageRegistration[]) {
  if (
    loadedLanguages.has(Array.isArray(language) ? language.map((l) => l.name || '').join(',') : language.name || '')
  ) {
    return
  }
  await hl.loadLanguage(language)
  loadedLanguages.add(Array.isArray(language) ? language.map((l) => l.name || '').join(',') : language.name || '')
}

/**
 * Convert a hast (HTML AST) node into a Node.
 * Uses pre-allocated arrays to avoid spread overhead.
 */
function hastToNode(input: any): Node {
  if (input.type === 'text') return input.value
  if (input.type === 'comment') return [null, {}, input.value]

  const props = input.properties || {}
  if (input.tag === 'code' && props?.className && props.className.length === 0) {
    delete props.className
  }

  const children = input.children
  if (!children || children.length === 0) return [input.tagName, props]
  const len = children.length
  // eslint-disable-next-line unicorn/no-new-array -- pre-allocated for perf
  const result = new Array(len + 2)
  result[0] = input.tagName
  result[1] = props
  for (let i = 0; i < len; i++) {
    result[i + 2] = hastToNode(children[i])
  }
  return result as Node
}

/**
 * Read the language an inline `<code>` declares. `lang` wins over `language`;
 * `lang` is the `@nuxtjs/mdc` convention and what authors type, `language` is
 * what the fence path already uses.
 */
function inlineCodeLanguage(attrs: ElementNodeAttributes): string | undefined {
  const raw = attrs?.lang ?? attrs?.language
  if (typeof raw !== 'string') return undefined
  return raw.trim() || undefined
}

/**
 * Build `<span style=…>` children for one tokenized line.
 * Replicates shiki's `mergeWhitespaceTokens`: a pure-whitespace token merges
 * into the following token unless it is underlined or struck through.
 */
function tokensToSpans(line: ThemedToken[]): Node[] {
  const spanCount = line.length
  let carry = ''
  const spans: Node[] = []
  for (let t = 0; t < spanCount; t++) {
    const tk = line[t]
    const canMerge = !((tk.fontStyle && (tk.fontStyle & 8 /* Strikethrough */ || tk.fontStyle & 4)) /* Underline */)
    if (canMerge && /^\s+$/.test(tk.content) && t + 1 < spanCount) {
      carry += tk.content
    } else if (carry) {
      const style = stringifyTokenStyle(tk.htmlStyle || getTokenStyleObject(tk))
      if (canMerge) {
        spans.push(style ? ['span', { style }, carry + tk.content] : ['span', {}, carry + tk.content])
      } else {
        spans.push(['span', {}, carry])
        spans.push(style ? ['span', { style }, tk.content] : ['span', {}, tk.content])
      }
      carry = ''
    } else {
      const style = stringifyTokenStyle(tk.htmlStyle || getTokenStyleObject(tk))
      spans.push(style ? ['span', { style }, tk.content] : ['span', {}, tk.content])
    }
  }
  // If trailing whitespace wasn't merged, emit it
  if (carry) {
    spans.push(['span', {}, carry])
  }
  return spans
}

/**
 * Apply syntax highlighting to all code blocks in a Comark tree
 * Uses codeToTokens API with batched async operations
 */
export async function highlightCodeBlocks(
  tree: MarkdownDocument,
  options: ShikiOptions = {},
  defaultThemeLoaders: ShikiThemeLoader[] = [],
  defaultLanguageLoaders: ShikiLanguageLoader[] = []
): Promise<MarkdownDocument> {
  interface CodeRef {
    node: ElementNode
    path: number[]
    /** Inline `<code>` with no `<pre>` wrapper. Fast token path only. */
    inline: boolean
  }

  const codeBlocks: CodeRef[] = []
  const pathBuf: number[] = []
  const inlineEnabled = options.inlineCode !== false

  /**
   * Collect a node if it is highlightable. Returns true when the subtree must
   * NOT be descended into: a matched `<pre><code>`, whose own `<code>` child is
   * a fenced block rather than inline code.
   */
  const collect = (node: ElementNode, path: number[]): boolean => {
    if (node[0] === 'pre') {
      if (Array.isArray(node[2]) && node[2][0] === 'code' && typeof node[2][2] === 'string') {
        codeBlocks.push({ node, path: path.slice(), inline: false })
        return true
      }
      return false
    }
    // An already-highlighted `<code>` has element children, so `node[2]` is not
    // a string and it is never collected twice.
    if (inlineEnabled && node[0] === 'code' && node.length === 3 && typeof node[2] === 'string') {
      if (inlineCodeLanguage(node[1] as ElementNodeAttributes)) {
        codeBlocks.push({ node, path: path.slice(), inline: true })
      }
    }
    return false
  }

  // Recursively find highlightable nodes, tracking their path via push/pop on a shared buffer
  const walkChildren = (element: ElementNode): void => {
    for (let i = 2; i < element.length; i++) {
      const child = element[i]
      if (typeof child === 'string') continue
      if (!Array.isArray(child) || child.length < 3) continue
      pathBuf.push(i - 2)
      if (!collect(child as ElementNode, pathBuf)) walkChildren(child as ElementNode)
      pathBuf.pop()
    }
  }

  for (let i = 0; i < tree.nodes.length; i++) {
    const node = tree.nodes[i]
    if (typeof node === 'string') continue
    if (!Array.isArray(node) || node.length < 3) continue
    pathBuf.length = 1
    pathBuf[0] = i
    if (!collect(node as ElementNode, pathBuf)) walkChildren(node as ElementNode)
  }

  if (codeBlocks.length === 0) return tree

  const hl = await getHighlighter(options, defaultThemeLoaders, defaultLanguageLoaders)
  const { themes = { light: 'material-theme-lighter', dark: 'material-theme-palenight' } } = options
  const lightTheme = themes.light || themes.dark || 'material-theme-lighter'
  const darkTheme = themes.dark || themes.light || 'material-theme-palenight'
  const themeOptions = {
    light: lightTheme,
    dark: lightTheme !== darkTheme ? darkTheme : undefined,
  }

  const hasTransformers = options.transformers && options.transformers.length > 0
  const darkClassSuffix = options.themes?.dark?.name ? ` dark:${options.themes.dark.name}` : ''

  // Built once per call. `getLoadedLanguages()` includes alias names, so the
  // `langAlias` entries above resolve without touching the registry.
  const loadedLangs = new Set(hl.getLoadedLanguages())

  const grammarContexts: Record<string, ShikiGrammarContext | false> = options.grammarContexts
    ? { ...defaultGrammarContexts, ...options.grammarContexts }
    : defaultGrammarContexts

  /**
   * Resolve a written language name to a real grammar plus optional seed source.
   * Own-property lookup only, so a fence written ```constructor``` cannot resolve
   * through `Object.prototype`. A `false` entry is falsy and falls through to the
   * identity mapping, which is how a built-in context is disabled.
   */
  const resolveGrammar = (language: string | undefined): ShikiGrammarContext => {
    const ctx =
      language && Object.prototype.hasOwnProperty.call(grammarContexts, language)
        ? grammarContexts[language]
        : undefined
    return ctx || { lang: language as string }
  }

  // Build new nodes array, spine-copying only paths to modified nodes
  const newNodes = [...tree.nodes] as Node[]

  /**
   * Replace the node at `path`, copying only the spine from the root down to it
   * so the rest of the tree stays shared. Each level reads back from `newNodes`
   * rather than `tree.nodes`, so several replacements under a shared ancestor
   * compose instead of clobbering each other.
   */
  const replaceAt = (path: number[], replacement: Node): void => {
    if (path.length === 1) {
      newNodes[path[0]] = replacement
      return
    }
    const rootIdx = path[0]
    let current = [...(newNodes[rootIdx] as ElementNode)] as ElementNode
    newNodes[rootIdx] = current
    for (let j = 1; j < path.length - 1; j++) {
      const childSlot = path[j] + 2
      const next = [...(current[childSlot] as ElementNode)] as ElementNode
      current[childSlot] = next
      current = next
    }
    current[path[path.length - 1] + 2] = replacement
  }

  for (let i = 0; i < codeBlocks.length; i++) {
    const { node, path, inline } = codeBlocks[i]

    if (inline) {
      const inlineAttrs = node[1] as ElementNodeAttributes
      const inlineCode = node[2] as string
      const { lang, grammarContextCode } = resolveGrammar(inlineCodeLanguage(inlineAttrs))

      // Unlike a <pre>, an inline <code> is not unambiguously code: `lang` is a
      // real HTML attribute for natural language. When the grammar is not
      // registered, leave the node exactly as it was authored rather than
      // tagging it `.shiki`.
      if (!lang || !loadedLangs.has(lang)) continue

      let spans: Node[]
      let inlineClass: string
      try {
        const result = codeToTokens(hl, inlineCode, { lang, grammarContextCode, themes: themeOptions })
        spans = []
        for (let li = 0; li < result.tokens.length; li++) {
          if (li > 0) spans.push('\n')
          for (const span of tokensToSpans(result.tokens[li])) spans.push(span)
        }
        if (spans.length === 0) spans = [inlineCode]
        inlineClass = `shiki ${result.themeName || ''}${darkClassSuffix}`
      } catch {
        continue
      }

      // Same ` . ` sentinel the <pre> uses, decoded by userBlockAttrs on stringify.
      const inlineUserClass = typeof inlineAttrs.class === 'string' ? inlineAttrs.class.trim() : ''
      // eslint-disable-next-line unicorn/no-new-array -- pre-allocated for perf
      const inlineNode = new Array(spans.length + 2) as ElementNode
      inlineNode[0] = 'code'
      inlineNode[1] = {
        ...inlineAttrs,
        class: inlineUserClass ? `${inlineClass} . ${inlineUserClass}` : inlineClass,
      }
      for (let sp = 0; sp < spans.length; sp++) inlineNode[sp + 2] = spans[sp]

      replaceAt(path, inlineNode as Node)
      continue
    }

    const code = (node[2] as any)[2] as string
    const attrs = node[1] as CodeBlockAttributes
    const preAttrs = attrs as Record<string, any>
    const language: string = (attrs as any)?.language
    const { lang: fenceLang, grammarContextCode: fenceContext } = resolveGrammar(language)

    let classStr: string
    let codeChildren: Node[]

    try {
      if (hasTransformers) {
        // Transformers operate on hast, so we must go through codeToHast
        const result = codeToHast(hl, code, {
          lang: fenceLang,
          grammarContextCode: fenceContext,
          transformers: options.transformers,
          themes: themeOptions,
          meta: { __raw: attrs.meta },
        })
        const preNode = result.children.map(hastToNode)[0] as ElementNode
        const cls = (preNode[1] as ElementNodeAttributes).class
        classStr = Array.isArray(cls) ? cls.join(' ') : String(cls)
        codeChildren = (preNode[2] as ElementNode).slice(2) as Node[]
      } else {
        // Fast path: build Nodes directly from tokens, skipping hast
        const result = codeToTokens(hl, code, {
          lang: fenceLang,
          grammarContextCode: fenceContext,
          themes: themeOptions,
        })
        classStr = `shiki ${result.themeName || ''}`

        // Replicate shiki's mergeWhitespaceTokens: merge pure-whitespace tokens
        // into the following token (unless underline/strikethrough styled)
        const tokenLines = result.tokens
        codeChildren = []
        for (let li = 0; li < tokenLines.length; li++) {
          const spans = tokensToSpans(tokenLines[li])

          // eslint-disable-next-line unicorn/no-new-array -- pre-allocated for perf
          const lineNode = new Array(spans.length + 2) as ElementNode
          lineNode[0] = 'span'
          lineNode[1] = { class: 'line' }
          for (let s = 0; s < spans.length; s++) lineNode[s + 2] = spans[s]

          codeChildren.push(lineNode as Node)
          if (li < tokenLines.length - 1) codeChildren.push('\n')
        }
      }
    } catch {
      classStr = 'shiki'
      codeChildren = [code]
    }

    if (darkClassSuffix) classStr += darkClassSuffix

    // Apply line highlights
    const highlightSet = Array.isArray(preAttrs.highlights) ? new Set<number>(preAttrs.highlights) : null
    let line = 1
    for (const child of codeChildren) {
      if (Array.isArray(child)) {
        if (highlightSet !== null && highlightSet.has(line)) {
          const classes = Array.isArray(child[1].class) ? child[1].class.join(' ') : (child[1].class ?? '')

          child[1].class = `${classes} highlight`.trim()
          // TODO: (enforcing default style) once we unify all ecosystem styles we can remove this
          child[1].style = 'display: inline-block'
        } else {
          // TODO: (enforcing default style) once we unify all ecosystem styles we can remove this
          child[1].style = 'display: inline'
        }

        line += 1
      }
    }

    // Merge highlighter class with any user-supplied class (e.g. from
    // `::pre{.user-class}`) so the wrapper's class isn't lost.
    const userClass = typeof preAttrs.class === 'string' ? preAttrs.class.trim() : ''
    const newPreAttrs: Record<string, any> = {
      ...preAttrs,
      class: userClass ? `${classStr} . ${userClass}` : classStr,
    }

    if (options.preStyles) {
      const lightTheme = options.themes?.light
      const darkTheme = options.themes?.dark
      const styles: string[] = []

      if (lightTheme?.colors?.['editor.background']) {
        styles.push(`background-color:${lightTheme.colors['editor.background']}`)
      }
      if (lightTheme?.colors?.['editor.foreground']) {
        styles.push(`color:${lightTheme.colors['editor.foreground']}`)
      }
      if (lightTheme?.name !== darkTheme?.name) {
        if (darkTheme?.colors?.['editor.background']) {
          styles.push(`--shiki-dark-bg:${darkTheme.colors['editor.background']}`)
        }
        if (darkTheme?.colors?.['editor.foreground']) {
          styles.push(`--shiki-dark:${darkTheme.colors['editor.foreground']}`)
        }
      }
      newPreAttrs.style = styles.join(';')
    }

    const codeEl = node[2] as ElementNode
    const codeAttrs = (codeEl[1] as Record<string, any>) || {}
    // eslint-disable-next-line unicorn/no-new-array -- pre-allocated for perf
    const codeNode = new Array(codeChildren.length + 2) as ElementNode
    codeNode[0] = 'code'
    codeNode[1] = codeAttrs
    for (let j = 0; j < codeChildren.length; j++) codeNode[j + 2] = codeChildren[j]
    const newPreNode: Node = ['pre', newPreAttrs, codeNode]

    replaceAt(path, newPreNode)
  }

  return { ...tree, nodes: newNodes }
}

/**
 * Reset the highlighter instance
 * Useful for testing or when you want to reconfigure
 */
export function resetHighlighter(): void {
  highlighter = null
  highlighterPromise = null
  defaultThemesLoaded = false
  defaultLanguagesLoaded = false
  loadedThemes.clear()
  loadedLanguages.clear()
}

export function createShikiPlugin<TOptions extends ShikiOptions = ShikiOptions>(
  defaultThemeLoaders: ShikiThemeLoader[] = [],
  defaultLanguageLoaders: ShikiLanguageLoader[] = []
) {
  return defineComarkPlugin<TOptions>((options) => ({
    name: 'shiki',
    async post(state) {
      state.tree = await highlightCodeBlocks(
        state.tree,
        (options || {}) as ShikiOptions,
        defaultThemeLoaders,
        defaultLanguageLoaders
      )
    },
  }))
}
