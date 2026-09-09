import { Token } from 'markdown-exit'
import type { CommentNode, ElementNode, ElementNodeAttributes, Node } from 'comark'
import {
  extractAttributes,
  mergeAdjacentTextNodes,
  parseCodeblockInfo,
  processAttributes,
  slugify,
} from './tree-utils.ts'
import { parseHtmlInline } from './utils.ts'
import { textContent } from 'comark/utils'

const inlineTags = new Set(['strong', 'em', 'del', 'code', 'a', 'span', 'sub', 'sup'])
// `::tag` components that should fold into a single same-tagged child.
const WRAPPER_TAGS = new Set(['ul', 'ol', 'table', 'blockquote', 'pre'])

type ProcessorResult = {
  nextIndex: number
  node?: Node
}

export interface ProcessorOptions {
  preservePositions?: boolean
  headingIds?: boolean
  startLine?: number
}

type HtmlOpenFrame = {
  /** Element tag, or `null` for an HTML comment (`<!--` … `-->`). */
  tag: string | null
  attrs: Record<string, unknown>
  children: Node[]
  /** True once this frame has survived past the paragraph that opened it. */
  block: boolean
  /** Bare-inline nodes waiting to be flushed as a single <p> on a block frame. */
  pendingInline: Node[]
}

/** Shared mutable context for a whole document walk. */
interface ProcessState {
  preservePositions: boolean
  headingIds: boolean
  startLine: number
  headingSlugCounts: Map<string, number>
  headingStack: Array<{ level: number; id: string }>
  /** Unclosed HTML open tags, outer → inner. Lives across blocks like headingStack. */
  htmlStack: HtmlOpenFrame[]
  /**
   * > 0 while building a nested markdown container (list, blockquote, table…).
   * Free paragraphs inside those containers keep ownership of their children
   * instead of nesting into the HTML stack; the finished container lands on the
   * stack as a whole unit via deliverBlock.
   */
  insideMarkdownContainer: number
}

type Processor = (tokens: Token[], start: number, state: ProcessState) => ProcessorResult

function makeHtmlAttrs(attrs: Record<string, unknown>, block: boolean): Record<string, unknown> {
  return {
    $: block ? { html: 1, block: 1 } : { html: 1, block: 0 },
    ...attrs,
  }
}

function pushNode(nodes: Node[], node: Node) {
  if (node[0] === 'fragment') nodes.push(...(node.slice(2) as Node[]))
  else nodes.push(node)
}

function isInlineish(node: Node): boolean {
  if (typeof node === 'string') return true
  if (!Array.isArray(node)) return false
  const tag = node[0]
  return tag === null || inlineTags.has(tag as string)
}

function flushPendingInline(frame: HtmlOpenFrame) {
  if (frame.pendingInline.length === 0) return
  const pending = frame.pendingInline
  frame.pendingInline = []
  frame.children.push(['p', {}, ...pending] as ElementNode)
}

/** Flatten nested nodes to text — used when emitting comment frames. */
function flattenText(nodes: Node[]): string {
  let out = ''
  for (const n of nodes) {
    if (typeof n === 'string') out += n
    else if (Array.isArray(n)) out += flattenText(n.slice(2) as Node[])
  }
  return out
}

function frameToNode(frame: HtmlOpenFrame): ElementNode | CommentNode {
  flushPendingInline(frame)
  // Comments (`tag === null`): flatten children to a body string.
  // Blank lines between the source paragraphs become `\n\n` between chunks.
  if (frame.tag === null) {
    const chunks = frame.children.map((c) =>
      typeof c === 'string' ? c : flattenText(Array.isArray(c) && c[0] === 'p' ? (c.slice(2) as Node[]) : [c])
    )
    // Spanned comments always had a blank line after `<!--` and before `-->`
    const body = chunks.length > 0 ? `\n\n${chunks.join('\n\n')}\n\n` : ''
    return [null, {}, body] as CommentNode
  }
  return [frame.tag as string, makeHtmlAttrs(frame.attrs, frame.block), ...frame.children]
}

/** Nest a finished block node into the open HTML frame, or return it free. */
function deliverBlock(state: ProcessState, node: Node | undefined): Node | undefined {
  if (node === undefined) return undefined
  if (state.htmlStack.length === 0) return node
  const top = state.htmlStack[state.htmlStack.length - 1]
  flushPendingInline(top)
  top.children.push(node)
  return undefined
}

/** Nest an inline/finished node into the open HTML frame during processInline. */
function deliverInline(state: ProcessState, node: Node | undefined): Node | undefined {
  if (node === undefined) return undefined
  if (state.htmlStack.length === 0) return node
  const top = state.htmlStack[state.htmlStack.length - 1]
  if (top.block && isInlineish(node)) {
    top.pendingInline.push(node)
  } else {
    flushPendingInline(top)
    top.children.push(node)
  }
  return undefined
}

/**
 * `<!--` / `-->` are just HTML open/close with `tag === null`.
 * When blank lines split them into plain text tokens, map those tokens onto the
 * same push/pop path html_inline uses for elements.
 */
function tryCommentTag(content: string, state: ProcessState): ProcessorResult | null {
  const top = state.htmlStack[state.htmlStack.length - 1]

  // Close comment
  if (top?.tag === null && content.includes('-->')) {
    const i = content.indexOf('-->')
    if (i > 0) deliverInline(state, content.slice(0, i))
    const frame = state.htmlStack.pop()!
    return { nextIndex: -1, node: frameToNode(frame) } // nextIndex filled by caller
  }

  // Open comment (no close in this chunk)
  if (content.startsWith('<!--') && !content.includes('-->')) {
    const body = content.slice(4)
    state.htmlStack.push({ tag: null, attrs: {}, children: body ? [body] : [], block: true, pendingInline: [] })
    return { nextIndex: -1, node: undefined }
  }

  // Complete comment in one chunk
  if (content.startsWith('<!--') && content.includes('-->')) {
    const end = content.indexOf('-->')
    return { nextIndex: -1, node: [null, {}, content.slice(4, end)] as CommentNode }
  }

  return null
}

function processToken(tokens: Token[], i: number, state: ProcessState): ProcessorResult | undefined {
  return processors[tokens[i].type]?.(tokens, i, state)
}

/**
 * Walk inline tokens. HTML open/close tags drive `state.htmlStack`.
 * @param nestHtml When true (free paragraph / top-level), free nodes nest into
 *   the open HTML stack. When false (nested markdown containers like strong/li),
 *   free nodes return to the parent container — the container itself later lands
 *   on the HTML stack as a whole unit via deliverBlock.
 */
function processInline(inlineTokens: Token[], state: ProcessState, nestHtml = true): Node[] {
  const nodes: Node[] = []
  let i = 0

  while (i < inlineTokens.length) {
    const result = processToken(inlineTokens, i, state)
    if (!result) {
      i += 1
      continue
    }
    const node = nestHtml ? deliverInline(state, result.node) : result.node
    if (node !== undefined) pushNode(nodes, node)
    i = result.nextIndex
  }

  return nodes
}

function preserveLineNumber(tokens: Token[], node: Node, start: number, nextIndex: number, state: ProcessState) {
  let endLine = state.startLine
  if (!Array.isArray(node)) return

  for (let j = start; j < nextIndex; j++) {
    if (tokens[j].map && tokens[j].map?.[1]) {
      endLine = (tokens[j].map?.[1] as number) + state.startLine + (tokens[j].type?.endsWith('_close') ? 1 : 0)
    }
  }
  if (!(node[1] as Record<string, unknown>).$) {
    ;(node[1] as Record<string, unknown>).$ = {}
  }
  ;((node[1] as Record<string, unknown>).$ as Record<string, unknown>).line = endLine
}

/** Walk children of an open/close pair until `closeType`. */
function processChildren(
  tokens: Token[],
  start: number,
  closeType: string,
  state: ProcessState,
  nestHtml = false
): { children: Node[]; nextIndex: number } {
  const children: Node[] = []
  let i = start + 1

  while (i < tokens.length) {
    const token = tokens[i]
    if (token.type === closeType) {
      return { children, nextIndex: i + 1 }
    }

    if (token.type === 'inline') {
      children.push(...processInline(token.children ?? [], state, nestHtml))
      i += 1
      continue
    }

    const result = processToken(tokens, i, state)
    if (result) {
      if (result.node !== undefined) pushNode(children, result.node)
      i = result.nextIndex
    } else {
      i += 1
    }
  }

  return { children, nextIndex: i }
}

function processPossibleAttributesSyntax(tokens: Token[], value: { nextIndex: number; node: Node }) {
  const extractedAttributes = extractAttributes(tokens, value.nextIndex)
  if (value.nextIndex < extractedAttributes.nextIndex) {
    ;(value.node as ElementNode)[1] = Object.assign(value.node[1], extractedAttributes.attrs)
    value.nextIndex = extractedAttributes.nextIndex
  }

  return value
}

function processBlockChildrenWithSlots(
  tokens: Token[],
  start: number,
  closeType: string,
  state: ProcessState
): { children: Node[]; nextIndex: number } {
  const nodes: Node[] = []
  let i = start + 1
  let currentSlot: { tag: string; attrs: Record<string, unknown>; children: Node[] } | null = null

  const flushSlot = () => {
    if (!currentSlot) return
    nodes.push([currentSlot.tag, currentSlot.attrs, ...mergeAdjacentTextNodes(currentSlot.children)] as ElementNode)
    currentSlot = null
  }

  const pushChild = (node: Node | undefined) => {
    if (node === undefined) return

    pushNode(currentSlot ? currentSlot.children : nodes, node)
  }

  while (i < tokens.length) {
    const token = tokens[i]

    if (token.type === closeType) {
      flushSlot()
      return { children: nodes, nextIndex: i + 1 }
    }

    if (token.type === 'mdc_block_slot_open') {
      flushSlot()
      currentSlot = {
        tag: token.tag || 'template',
        attrs: processAttributes(token.attrs),
        children: [],
      }
      i += 1
      continue
    }

    if (token.type === 'mdc_block_slot_close') {
      i += 1
      continue
    }

    if (token.type === 'inline') {
      const free = processInline(token.children ?? [], state)
      if (currentSlot) currentSlot.children.push(...free)
      else nodes.push(...free)
      i += 1
      continue
    }

    const result = processToken(tokens, i, state)
    if (result) {
      pushChild(result.node)
      i = result.nextIndex
    } else {
      i += 1
    }
  }

  flushSlot()
  return { children: nodes, nextIndex: i }
}

function processMdcBlock(tokens: Token[], start: number, state: ProcessState): ProcessorResult {
  const open = tokens[start]
  // Own child paragraphs/inlines so an outer unclosed HTML tag (e.g. `<Hello>`)
  // doesn't steal `::component` body content off the stack.
  state.insideMarkdownContainer += 1
  const { children, nextIndex } = processBlockChildrenWithSlots(tokens, start, 'mdc_block_close', state)
  state.insideMarkdownContainer -= 1
  const attrs = processAttributes(open.attrs)

  let node = [open.tag || 'div', attrs, ...mergeAdjacentTextNodes(children)] as ElementNode
  if (WRAPPER_TAGS.has(node[0])) {
    if (children.length === 1 && children[0][0] === node[0]) {
      node = node[2] as ElementNode
      node[1] = { ...node[1], ...attrs }
    }
  }
  return processPossibleAttributesSyntax(tokens, {
    nextIndex,
    node,
  })
}

function codeBlockProcessor(tokens: Token[], start: number, _state: ProcessState): ProcessorResult {
  const token = tokens[start]
  const content = token.content || ''
  const info = token.info || (token as Token & { params?: string }).params || ''

  const parsed = parseCodeblockInfo(info)

  const preAttrs: Record<string, unknown> = parsed
  const codeAttrs: Record<string, unknown> = {}
  if (parsed.language && parsed.language.trim()) {
    preAttrs.language = parsed.language
    codeAttrs['class'] = `language-${parsed.language}`
  }

  const codeContentWithoutLastNewline = content.endsWith('\n') ? content.slice(0, -1) : content
  return {
    nextIndex: start + 1,
    node: ['pre', preAttrs, ['code', codeAttrs, codeContentWithoutLastNewline]],
  }
}

function uniqueSlug(slug: string, level: number, state: ProcessState): string {
  while (state.headingStack.length > 0 && state.headingStack[state.headingStack.length - 1].level >= level) {
    state.headingStack.pop()
  }
  if (state.headingStack.length > 0) {
    const parent = state.headingStack[state.headingStack.length - 1]
    if (parent.level >= 2) {
      slug = parent.id + '-' + slug
    }
  }

  state.headingStack.push({ level, id: slug })

  const count = state.headingSlugCounts.get(slug) ?? 0
  state.headingSlugCounts.set(slug, count + 1)
  return count === 0 ? slug : `${slug}-${count}`
}

function singleToken(fn: (token: Token) => Node) {
  return (tokens: Token[], start: number): ProcessorResult =>
    processPossibleAttributesSyntax(tokens, { nextIndex: start + 1, node: fn(tokens[start]) })
}

function openCloseToken(closeType: string, tag: string = '', nest = false) {
  return (tokens: Token[], start: number, state: ProcessState) => {
    const open = tokens[start]
    if (nest) state.insideMarkdownContainer += 1
    const { children, nextIndex } = processChildren(tokens, start, closeType, state)
    if (nest) state.insideMarkdownContainer -= 1
    const attrs = processAttributes(open.attrs)
    return processPossibleAttributesSyntax(tokens, {
      nextIndex,
      node: [tag || open.tag, attrs, ...mergeAdjacentTextNodes(children)],
    })
  }
}

const processors: Record<string, Processor> = {
  // nest=true: containers that own child paragraphs/inlines (so free HTML stack
  // doesn't steal their content while a block-level HTML tag is open above them).
  mdc_block_slot_open: openCloseToken('mdc_block_slot_close'),
  mdc_inline_span_open: openCloseToken('mdc_inline_span_close'),
  mdc_block_shorthand_open: openCloseToken('mdc_block_shorthand_close'),
  mdc_inline_component_open: openCloseToken('mdc_inline_component_close'),
  blockquote_open: openCloseToken('blockquote_close', '', true),
  bullet_list_open: openCloseToken('bullet_list_close', '', true),
  ordered_list_open: openCloseToken('ordered_list_close', '', true),
  list_item_open: openCloseToken('list_item_close', '', true),
  strong_open: openCloseToken('strong_close'),
  link_open: openCloseToken('link_close'),
  em_open: openCloseToken('em_close'),
  table_open: openCloseToken('table_close', '', true),
  thead_open: openCloseToken('thead_close', '', true),
  tbody_open: openCloseToken('tbody_close', '', true),
  tr_open: openCloseToken('tr_close', '', true),
  th_open: openCloseToken('th_close', '', true),
  td_open: openCloseToken('td_close', '', true),
  sub_open: openCloseToken('sub_close'),
  sup_open: openCloseToken('sup_close'),
  s_open: openCloseToken('s_close', 'del'),
  mdc_block_open: processMdcBlock,
  code_inline: singleToken((t) => ['code', {}, t.content]),
  math_inline: singleToken((t) => ['math', { class: 'math inline', content: t.content }, t.content]),
  math_block: singleToken((t) => ['math', { class: 'math block', content: t.content }, t.content]),
  emoji: singleToken((t) => t.content),
  hr: singleToken(() => ['hr', {}]),
  hardbreak: singleToken(() => ['br', {}]),
  // Softbreaks inside open HTML are paragraph separators, not text content
  softbreak: (tokens, start, state) => ({
    nextIndex: start + 1,
    node: state.htmlStack.length > 0 || tokens[start - 1].type === 'html_inline' ? undefined : '\n',
  }),
  code_block: codeBlockProcessor,
  fenced_code_block: codeBlockProcessor,
  fence: codeBlockProcessor,
  mdc_block_shorthand: singleToken((t) => [t.tag, processAttributes(t.attrs)]),
  heading_open(tokens, start, state) {
    const { nextIndex, node } = openCloseToken('heading_close')(tokens, start, state)
    if (node.length === 2) return { node: undefined, nextIndex }

    if (state.headingIds) {
      const level = Number.parseInt((tokens[start].tag || 'h1').replace('h', ''), 10) || 1
      const _textContent = textContent(node)
      const headingId = uniqueSlug(slugify(_textContent), level, state)
      ;(node as ElementNode)[1] = { id: headingId, ...(node[1] as Record<string, unknown>) }
    }

    return { nextIndex, node }
  },

  paragraph_open(tokens, start, state) {
    const inline = tokens[start + 1]
    const depthBefore = state.htmlStack.length
    const nestHtml = state.insideMarkdownContainer === 0
    const { children, nextIndex } = processChildren(tokens, start, 'paragraph_close', state, nestHtml)
    const asParagraph = (): ProcessorResult =>
      children.length === 0
        ? { nextIndex, node: undefined }
        : {
            nextIndex,
            node: ['p', processAttributes(tokens[start].attrs), ...mergeAdjacentTextNodes(children)],
          }

    // Closed HTML root that started before this paragraph.
    if (depthBefore > 0 && state.htmlStack.length === 0) {
      if (children.length === 1 && Array.isArray(children[0])) {
        return { nextIndex, node: children[0] as ElementNode }
      }
      return asParagraph()
    }

    // Stack still open — free content already nested via deliverInline.
    if (state.htmlStack.length > 0) {
      if (nestHtml) {
        for (const frame of state.htmlStack) flushPendingInline(frame)
        return { nextIndex, node: undefined }
      }
      return asParagraph()
    }

    const empty = asParagraph()
    if (empty.node === undefined) return empty

    const result = processPossibleAttributesSyntax(tokens, { nextIndex, node: empty.node })
    const final = result.node
    const canUnwrap =
      Array.isArray(final) &&
      final.length === 3 &&
      inline?.type === 'inline' &&
      inline.children?.[0]?.type === 'html_inline' &&
      (!inlineTags.has((final[2] as ElementNode)?.[0] as string) ||
        Boolean((empty.node[2][1] as ElementNodeAttributes)?.$?.block))

    if (canUnwrap) {
      const unwrapped = final[2] as ElementNode
      if ((unwrapped[1] as ElementNodeAttributes).$) {
        ;(unwrapped[1] as ElementNodeAttributes).$!.block = 1
      }
      return { nextIndex: result.nextIndex, node: unwrapped }
    }

    if ((result.node as ElementNode).every((n, i) => i < 2 || (n?.[1] as ElementNodeAttributes)?.$?.html)) {
      ;(result.node as ElementNode)[0] = 'fragment'
    }

    return result
  },
  mdc_inline_component(tokens, start) {
    const token = tokens[start]
    const tokenAttrs = processAttributes(token.attrs)
    const { attrs, nextIndex } = extractAttributes(tokens, start + 1, false)
    return { node: [token.tag, { ...tokenAttrs, ...attrs }] as Node, nextIndex }
  },

  image(tokens, start) {
    const token = tokens[start]
    const attrs = processAttributes(token.attrs, { handleJSON: false, filterEmpty: true })
    if (token.content) {
      attrs.alt = token.content
    }
    return processPossibleAttributesSyntax(tokens, { node: ['img', attrs] as Node, nextIndex: start + 1 })
  },

  text(tokens, start, state) {
    const content = tokens[start].content
    if (content === '') return { nextIndex: start + 1, node: undefined }

    // `<!--` / `-->` are HTML open/close with tag null (may arrive as plain text
    // when blank lines split a multi-line comment).
    const comment = tryCommentTag(content, state)
    if (comment) return { nextIndex: start + 1, node: comment.node }

    return { nextIndex: start + 1, node: content }
  },
  // html_inline drives the document-wide HTML open stack.
  // - self-closing / void → single element
  // - open → push frame (siblings / later blocks fill children)
  // - matching close → pop frame and emit completed element
  html_inline(tokens, start, state) {
    const raw = tokens[start].content || ''
    const parsed = parseHtmlInline(raw)

    if (parsed.kind === 'comment') {
      return { nextIndex: start + 1, node: [null, {}, parsed.content] }
    }
    if (parsed.kind === 'other') {
      // Bare `<!--` / `-->` fragments use the same stack as elements.
      const comment = tryCommentTag(raw, state)
      if (comment) return { nextIndex: start + 1, node: comment.node }
      return { nextIndex: start + 1, node: [null, {}, raw] }
    }

    if (parsed.kind === 'close') {
      const top = state.htmlStack[state.htmlStack.length - 1]
      if (top && top.tag === parsed.tag) {
        return { nextIndex: start + 1, node: frameToNode(state.htmlStack.pop()!) }
      }
      return { nextIndex: start + 1, node: undefined }
    }

    if (parsed.selfClosing) {
      return {
        nextIndex: start + 1,
        node: [parsed.tag, makeHtmlAttrs(parsed.attrs, false)],
      }
    }

    state.htmlStack.push({
      tag: parsed.tag,
      attrs: parsed.attrs,
      children: [],
      block: false,
      pendingInline: [],
    })
    return { nextIndex: start + 1, node: undefined }
  },
}

export function tokenListToTree(tokens: Token[], options: ProcessorOptions = {}): Node[] {
  const state: ProcessState = {
    preservePositions: options.preservePositions ?? false,
    headingIds: options.headingIds ?? true,
    startLine: options.startLine ?? 0,
    headingSlugCounts: new Map(),
    headingStack: [],
    htmlStack: [],
    insideMarkdownContainer: 0,
  }
  const nodes: Node[] = []
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]

    if (token.type === 'inline') {
      const free = processInline(token.children ?? [], state)
      // Free inline at block level (rare) — if stack open, nest; else emit
      if (state.htmlStack.length > 0) {
        for (const n of free) state.htmlStack[state.htmlStack.length - 1].children.push(n)
      } else {
        nodes.push(...free)
      }
      i += 1
      continue
    }

    const result = processToken(tokens, i, state)
    if (result) {
      // Remaining open frames span past this block.
      for (const frame of state.htmlStack) frame.block = true

      if (result.node !== undefined) {
        if (state.preservePositions) {
          preserveLineNumber(tokens, result.node, i, result.nextIndex, state)
        }
        const free = deliverBlock(state, result.node)
        if (free !== undefined) pushNode(nodes, free)
      }
      i = result.nextIndex
    } else {
      nodes.push([token.tag || 'component', processAttributes(token.attrs, { handleJSON: false })])
      i += 1
    }
  }

  // EOF — close remaining unclosed HTML tags (outermost last).
  // Incomplete openers with only text leaves stay block: 0 (inline-like).
  // Anything with element children (markdown, nested HTML, lists) is block: 1.
  while (state.htmlStack.length > 0) {
    const frame = state.htmlStack.pop()!
    frame.block = true
    const node = frameToNode(frame)
    if (state.htmlStack.length > 0) {
      state.htmlStack[state.htmlStack.length - 1].children.push(node)
    } else {
      nodes.push(node)
    }
  }

  return nodes
}
