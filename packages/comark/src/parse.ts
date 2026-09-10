import type {
  ComarkParseFn,
  ComarkParsePostState,
  ComarkPlugin,
  MarkdownExitPlugin,
  MergePluginFrontmatter,
  MergePluginMeta,
  ParserOptions,
  ResolvedFrontmatter,
  ResolvedMeta,
  MarkdownDocument,
  Node,
} from './types.ts'
import MarkdownExit from 'markdown-exit'
import components from './plugins/components.ts'
import attributes from './plugins/attributes.ts'
import taskList from './plugins/task-list.ts'
import alert from './plugins/alert.ts'
import html from './plugins/html.ts'
import frontmatterPlugin from './plugins/frontmatter.ts'
import { applyAutoUnwrap } from './internal/parse/auto-unwrap.ts'
import { applyUnwrap, resolveUnwrapTags } from './internal/parse/unwrap.ts'
import { marmdownItTokensToMarkdownDocument } from './internal/parse/token-processor.ts'
import { autoCloseMarkdown } from './internal/parse/auto-close/index.ts'
import { extractReusableNodes } from './internal/parse/incremental.ts'
import { createSerializedTask, dedupePlugins } from './utils/helpers.ts'
import { noopTracer, withSpan } from './utils/trace.ts'

// Re-export frontmatter utilities
export { parseFrontmatter } from './internal/frontmatter.ts'

// Re-export plugin utilities
export { defineComarkPlugin } from './utils/helpers.ts'

/**
 * Creates a parser function for Comark content.
 *
 * Returns an async function that takes a markdown string and returns a Promise resolving to a MarkdownDocument AST.
 * The returned parser applies frontmatter extraction, Comark syntax parsing, token-to-AST conversion,
 * auto-closing of incomplete markdown, optional AST transformations and plugin hooks.
 *
 * @param options - Parser options controlling parsing behavior.
 * @returns An async parser function: (markdown) => Promise<MarkdownDocument>
 *
 * @example
 * ```typescript
 * import { createMarkdownParser } from 'comark'
 *
 * const parseMarkdown = createMarkdownParser({ autoUnwrap: false })
 * const tree = await parseMarkdown('# Hello **World**\n::alert\nhi\n::')
 * console.log(tree.nodes)
 * // → [ ['h1', { id: 'hello-world' }, 'Hello ', ['strong', {}, 'World'] ], ['alert', {}, 'hi'] ]
 *
 * // HTML parsing is on by default via the built-in `html` plugin
 * const tree2 = await parseMarkdown('<strong class="bold">Hello</strong> _world_')
 * console.log(tree2.nodes)
 * // → [ ['strong', { class: 'bold' }, 'Hello'], ' ', ['em', {}, 'world'] ]
 *
 * // Disable default plugins (including HTML) — HTML tags are plain text
 * const parsePlain = createMarkdownParser({ registerDefaultPlugins: false })
 * ```
 */
export function createMarkdownParser<const TPlugins extends readonly ComarkPlugin<any, any>[] = []>(
  options: ParserOptions<TPlugins> = {} as ParserOptions<TPlugins>
): ComarkParseFn<ResolvedMeta<MergePluginMeta<TPlugins>>, ResolvedFrontmatter<MergePluginFrontmatter<TPlugins>>> {
  const { autoUnwrap = true, autoClose = true, tracer = noopTracer } = options
  // Tag set to strip from the top level of the tree (MDC `unwrap`). Resolved once.
  const unwrapTags = resolveUnwrapTags(options.unwrap)

  const userPlugins = options.plugins ?? []

  // `options.html` is deprecated — prefer `registerDefaultPlugins: false` (or
  // omitting the html plugin from an explicit plugins list).
  if (options.html !== undefined) {
    console.warn(
      '[comark] `ParserOptions.html` is deprecated and will be removed in a future major version. ' +
        'Use `registerDefaultPlugins: false` and register `html()` from `comark/plugins/html` only when needed.'
    )
  }

  const defaultPlugins =
    options.registerDefaultPlugins !== false
      ? [
          frontmatterPlugin(),
          // Honor deprecated `html: false` so callers can keep disabling HTML for now.
          ...(options.html !== false ? [html()] : []),
          alert(),
          taskList(),
          components(),
          attributes(),
        ]
      : []

  const plugins = dedupePlugins(defaultPlugins, userPlugins)
  const hasPlugin = (name: string) => plugins.some((plugin) => plugin.name === name)

  const parser = new MarkdownExit({ linkify: options.linkify ?? true }).enable(['table', 'strikethrough'])

  for (const plugin of plugins) {
    for (const markdownItPlugin of plugin.markdownItPlugins || []) {
      parser.use(markdownItPlugin as unknown as MarkdownExitPlugin)
    }
  }

  let lastOutput: MarkdownDocument | null = null
  let lastInput: string | null = null

  const parseFn: ComarkParseFn = async (markdown, opts = {}) => {
    // Root active span for the full parse pipeline. Nested startActiveSpan /
    // startSpan calls become children (OTel active context, or a stack in a
    // simple recorder) → hierarchical trace:
    //   comark:parse → autoclose / pre / tokenize / nodes / post
    return await withSpan(tracer, 'comark:parse', async () => {
      const state = {
        options,
        tokens: [] as unknown[],
        markdown,
        tree: null as MarkdownDocument | null,
        parsedLines: 0,
        reusableNodes: [] as Node[],
        frontmatterText: '',
        frontmatter: {} as Record<string, any>,
      }

      const prevOutput = lastOutput
      const isStartsWithLastInput = markdown.startsWith(lastInput ?? '')
      if (opts.streaming && prevOutput && isStartsWithLastInput && !markdown.includes(']:')) {
        const { remainingMarkdownStartLine, reusedNodes, remainingMarkdown } = extractReusableNodes(
          markdown,
          prevOutput
        )

        // If there is no remaining markdown, return the previous output
        if (!remainingMarkdown) return prevOutput

        // Heading IDs and reference links depend on the full document.
        if (!/#|(?:^|\n)[^\n]*[=-][ \t]*\r?(?:\n|$)/.test(remainingMarkdown)) {
          state.parsedLines = remainingMarkdownStartLine
          state.markdown = remainingMarkdown
          state.reusableNodes = reusedNodes
        }
      }

      if (typeof autoClose === 'function') {
        state.markdown = withSpan(tracer, 'comark:autoclose', () => autoClose(state.markdown))
      } else if (autoClose) {
        state.markdown = withSpan(tracer, 'comark:autoclose', () =>
          autoCloseMarkdown(state.markdown, {
            frontmatter: hasPlugin('frontmatter') && opts.streaming,
            syntax: hasPlugin('components'),
            attributes: hasPlugin('components') || hasPlugin('attributes'),
            math: hasPlugin('math'),
            dropTrailingOpeners: opts.streaming === true,
          })
        )
      }

      for (const plugin of plugins) {
        if (!plugin.pre) continue
        await withSpan(tracer, `comark:pre:${plugin.name}`, () => plugin.pre!(state))
      }

      try {
        state.tokens = withSpan(tracer, 'comark:tokenize', () => parser.parse(state.markdown, {}))
      } catch (e) {
        // in case of streaming, return the previous output if parsing fails
        // This is to avoid resetting the tree to an empty state on failure
        // resetting the tree will re-redner whole tree
        if (opts.streaming && prevOutput) {
          return prevOutput
        }
        throw e
      }

      // Convert tokens to Comark structure
      const nodesSpan = tracer.startSpan('comark:nodes')
      let nodes = marmdownItTokensToMarkdownDocument(state.tokens, {
        startLine: state.parsedLines,
        preservePositions: opts.streaming ?? false,
        headingIds: options.headingIds ?? true,
      })

      if (autoUnwrap) {
        nodes = nodes.map((node: Node) => applyAutoUnwrap(node))
      }

      if (unwrapTags.length > 0) {
        nodes = applyUnwrap(nodes, unwrapTags)
      }
      nodesSpan.end()

      const frontmatterData = (state.frontmatter ?? {}) as Record<string, any>
      const frontmatterText = (state.frontmatterText ?? '') as string

      if (opts.streaming) {
        state.tree = {
          frontmatter:
            frontmatterText || !isStartsWithLastInput ? frontmatterData : (prevOutput?.frontmatter ?? frontmatterData),
          meta: {},
          nodes: [...state.reusableNodes, ...nodes],
        }
        // Set last output and input for streaming mode
        lastOutput = state.tree
        lastInput = markdown
      } else {
        state.tree = {
          frontmatter: frontmatterData,
          meta: {},
          nodes,
        }
        // Reset last output and input for non-streaming mode
        lastOutput = null
        lastInput = null
      }

      for (const plugin of plugins) {
        if (!plugin.post) continue
        await withSpan(tracer, `comark:post:${plugin.name}`, () => plugin.post!(state as ComarkParsePostState))
      }

      return state.tree
    })
  }

  return parseFn as ComarkParseFn<
    ResolvedMeta<MergePluginMeta<TPlugins>>,
    ResolvedFrontmatter<MergePluginFrontmatter<TPlugins>>
  >
}

/**
 * Parse Comark content from a string
 *
 * @param markdown - The markdown/Comark content as a string
 * @param options - Parser options
 * @returns MarkdownDocument - The parsed AST tree
 *
 * @example
 * ```typescript
 * import { parseMarkdown } from 'comark'
 *
 * const content = `---
 * title: Hello World
 * ---
 *
 * # Hello World
 *
 * This is a **markdown** document with *Comark* components.
 *
 * ::alert{type="info"}
 * This is an alert component
 * ::
 * `
 *
 * const tree = await parseMarkdown(content)
 * console.log(tree.nodes)        // Array of AST nodes
 * console.log(tree.frontmatter)  // { title: 'Hello World' }
 * console.log(tree.meta)         // Additional metadata
 *
 * // Disable auto-unwrap
 * const tree2 = await parseMarkdown(content, { autoUnwrap: false })
 * ```
 */
export async function parseMarkdown<const TPlugins extends readonly ComarkPlugin<any, any>[] = []>(
  markdown: string,
  options: ParserOptions<TPlugins> = {} as ParserOptions<TPlugins>
): Promise<
  MarkdownDocument<ResolvedMeta<MergePluginMeta<TPlugins>>, ResolvedFrontmatter<MergePluginFrontmatter<TPlugins>>>
> {
  const parser = createMarkdownParser(options)

  return await parser(markdown)
}

/**
 * Creates a serialized parser function for Comark content.
 * This is useful for parsing large files in a streaming manner.
 *
 * @param options - Parser options
 * @returns ComarkParseFn - The serialized parser function
 *
 * @example
 * ```typescript
 * import { createSerializedMarkdownParser } from 'comark'
 *
 * const parseMarkdown = createSerializedMarkdownParser()
 * const tree = await parseMarkdown(content)
 * console.log(tree.nodes)
 */
export function createSerializedMarkdownParser<const TPlugins extends readonly ComarkPlugin<any, any>[] = []>(
  options: ParserOptions<TPlugins> = {} as ParserOptions<TPlugins>
): ComarkParseFn<ResolvedMeta<MergePluginMeta<TPlugins>>, ResolvedFrontmatter<MergePluginFrontmatter<TPlugins>>> {
  return createSerializedTask(createMarkdownParser(options))
}
