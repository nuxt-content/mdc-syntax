import type { MinimarkNode } from 'minimark'
import MarkdownIt from 'markdown-it'
// @ts-expect-error - No declaration file
import markdownItSub from 'markdown-it-sub'
import markdownItMDC from 'markdown-it-mdc'

const md = new MarkdownIt()
  .use(markdownItSub)
  .use(markdownItMDC)

// Mapping from token types to tag names
const BLOCK_TAG_MAP: Record<string, string> = {
  blockquote_open: 'blockquote',
  ordered_list_open: 'ol',
  bullet_list_open: 'ul',
  list_item_open: 'li',
  paragraph_open: 'p',
  table_open: 'table',
  thead_open: 'thead',
  tbody_open: 'tbody',
  tr_open: 'tr',
  th_open: 'th',
  td_open: 'td',
}

const INLINE_TAG_MAP: Record<string, string> = {
  strong_open: 'strong',
  em_open: 'em',
  s_open: 'del',
  sub_open: 'del',
}

/**
 * Extract and process attributes from a token's attrs array
 */
function processAttributes(
  attrsArray: any[] | null | undefined,
  options: {
    handleBoolean?: boolean
    handleJSON?: boolean
    filterEmpty?: boolean
  } = {},
): Record<string, unknown> {
  const { handleBoolean = true, handleJSON = true, filterEmpty = false } = options
  const attrs: Record<string, unknown> = {}

  if (!attrsArray || !Array.isArray(attrsArray)) {
    return attrs
  }

  for (const attr of attrsArray) {
    if (Array.isArray(attr) && attr.length >= 2) {
      let [key, value] = attr

      // Filter empty values if requested
      if (filterEmpty && (value === '' || value === null || value === undefined)) {
        continue
      }

      // Handle boolean attributes: {bool} -> {":bool": "true"}
      if (handleBoolean && !key.startsWith(':') && !key.startsWith('#') && !key.startsWith('.') && (!value || value === 'true' || value === '')) {
        key = `:${key}`
        value = 'true'
      }

      // Handle JSON values
      if (handleJSON && typeof value === 'string') {
        if (value.startsWith('{') && value.endsWith('}')) {
          try {
            value = JSON.parse(value)
          }
          catch {
            // Keep original value if parsing fails
          }
        }
        else if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value)
          }
          catch {
            // Keep original value if parsing fails
          }
        }
      }

      attrs[key] = value
    }
  }

  return attrs
}

/**
 * Parse HTML inline content to extract tag and attributes
 * Example: '<input class="foo" checked="" disabled="" type="checkbox">'
 * Returns: { tag: 'input', attrs: { class: 'foo', checked: true, disabled: true, type: 'checkbox' } }
 */
function parseHtmlInline(html: string): { tag: string, attrs: Record<string, unknown>, selfClosing: boolean } | null {
  // Match opening or self-closing tags
  // Use \s[^>]* to ensure attributes start with whitespace, preventing overlap with tag name
  const tagMatch = html.match(/^<(\w+)(\s[^>]*)?(\/?)>/)
  if (!tagMatch) {
    return null
  }

  const tag = tagMatch[1]
  const attrsString = tagMatch[2]
  const selfClosing = tagMatch[3] === '/' || tag === 'input' || tag === 'br' || tag === 'img' || tag === 'hr'

  const attrs: Record<string, unknown> = {}

  // Parse attributes from the string
  // Match: attr="value" or attr='' or attr (boolean)
  const attrRegex = /(\w+)(?:="([^"]*)"|='([^']*)'|=(\S+)|(?=\s|$))/g
  let match

  while ((match = attrRegex.exec(attrsString)) !== null) {
    const attrName = match[1]
    // Get value from whichever capture group matched (quotes or unquoted)
    const attrValue = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] || ''))

    // Handle boolean attributes - if value is empty string, it's a boolean true
    if (attrValue === '') {
      attrs[`:${attrName}`] = 'true'
    }
    else {
      // Regular attribute
      attrs[attrName] = attrValue
    }
  }

  return { tag, attrs, selfClosing }
}

/**
 * Parse codeblock info string to extract language, highlights, filename, and meta
 * Example: "javascript {1-3} [filename.ts] meta=value"
 * Example: "typescript[filename]{1,3-5}meta"
 */
function parseCodeblockInfo(info: string): {
  language: string
  filename?: string
  highlights?: number[]
  meta?: string
} {
  if (!info) {
    return { language: '' }
  }

  const result: {
    language: string
    filename?: string
    highlights?: number[]
    meta?: string
  } = { language: '' }

  let remaining = info.trim()

  // Extract language (stops at [ or { or whitespace)
  const languageMatch = remaining.match(/^([^\s[{]+)/)
  if (languageMatch) {
    result.language = languageMatch[1]
    remaining = remaining.slice(languageMatch[1].length).trim()
  }

  // Extract highlights and filename in any order
  // They can appear as: {highlights} [filename] or [filename] {highlights}
  while (remaining && (remaining.startsWith('{') || remaining.startsWith('['))) {
    if (remaining.startsWith('{')) {
      // Extract highlights {1-3} or {1,2,3} or {1-3,5,9-11}
      const highlightsMatch = remaining.match(/^\{([^}]+)\}/)
      if (highlightsMatch) {
        const highlightsStr = highlightsMatch[1]
        remaining = remaining.slice(highlightsMatch[0].length).trim()

        // Parse highlight ranges and individual numbers
        const highlights: number[] = []
        const parts = highlightsStr.split(',')
        for (const part of parts) {
          const trimmed = part.trim()
          if (trimmed.includes('-')) {
            // Range like "1-3"
            const [start, end] = trimmed.split('-').map(s => Number.parseInt(s.trim(), 10))
            if (!Number.isNaN(start) && !Number.isNaN(end)) {
              for (let i = start; i <= end; i++) {
                highlights.push(i)
              }
            }
          }
          else {
            // Single number
            const num = Number.parseInt(trimmed, 10)
            if (!Number.isNaN(num)) {
              highlights.push(num)
            }
          }
        }
        if (highlights.length > 0) {
          result.highlights = highlights
        }
      }
      else {
        break
      }
    }
    else if (remaining.startsWith('[')) {
      // Extract filename [filename.ts] - handle nested brackets and escaped backslashes
      let depth = 0
      let i = 0
      for (; i < remaining.length; i++) {
        if (remaining[i] === '[') {
          depth++
        }
        else if (remaining[i] === ']') {
          depth--
          if (depth === 0) {
            // Found the closing bracket
            const filename = remaining.slice(1, i)
            // Unescape backslashes: @[...slug\\\\].ts -> @[...slug].ts
            result.filename = filename.replace(/\\\\/g, '')
            remaining = remaining.slice(i + 1).trim()
            break
          }
        }
      }
      if (depth !== 0) {
        // Unclosed bracket, stop processing
        break
      }
    }
  }

  // Remaining text is meta
  if (remaining) {
    result.meta = remaining
  }

  return result
}

/**
 * Extract MDC attributes from mdc_inline_props token
 * @param tokens - Array of tokens
 * @param startIndex - Index to start searching from (after the element token)
 * @param skipEmptyText - Whether to skip empty text tokens before props token
 * @returns Object with attrs and nextIndex
 */
function extractMDCAttributes(
  tokens: any[],
  startIndex: number,
  skipEmptyText: boolean = true,
): { attrs: Record<string, unknown>, nextIndex: number } {
  let propsIndex = startIndex

  // Skip empty text tokens if requested
  if (skipEmptyText) {
    while (propsIndex < tokens.length && tokens[propsIndex].type === 'text' && !tokens[propsIndex].content?.trim()) {
      propsIndex++
    }
  }

  // Check for props token
  if (propsIndex < tokens.length && tokens[propsIndex].type === 'mdc_inline_props') {
    const propsToken = tokens[propsIndex]
    const attrs = processAttributes(propsToken.attrs)
    return { attrs, nextIndex: propsIndex + 1 }
  }

  return { attrs: {}, nextIndex: startIndex }
}

export function parseTokens(tokens: any[]): MinimarkNode[] {
  const nodes: MinimarkNode[] = []

  let i = 0
  while (i < tokens.length) {
    const result = processBlockToken(tokens, i, false)
    i = result.nextIndex
    if (result.node) {
      nodes.push(result.node)
    }
  }

  return nodes
}

export function getMarkdownIt() {
  return md
}

function processBlockToken(tokens: any[], startIndex: number, insideNestedContext: boolean = false): { node: MinimarkNode | null, nextIndex: number } {
  const token = tokens[startIndex]

  if (token.type === 'hr') {
    return { node: ['hr', {}] as MinimarkNode, nextIndex: startIndex + 1 }
  }

  // Handle MDC block components (e.g., ::component ... ::)
  if (token.type === 'mdc_block_open') {
    const componentName = token.tag || 'component'
    const attrs = processAttributes(token.attrs, { handleBoolean: false })
    // Process children until mdc_block_close, handling slots (#slotname)
    const children = processBlockChildrenWithSlots(tokens, startIndex + 1, 'mdc_block_close')
    // Return the component even if it has no children (empty component like ::component\n::)
    return { node: [componentName, attrs, ...children.nodes] as MinimarkNode, nextIndex: children.nextIndex + 1 }
  }

  // Handle MDC block shorthand components (e.g., standalone :inline-component)
  // These should be wrapped in a paragraph
  if (token.type === 'mdc_block_shorthand') {
    const componentName = token.tag || 'component'
    const attrs = processAttributes(token.attrs, { handleBoolean: false, handleJSON: false })
    const component: MinimarkNode = [componentName, attrs] as MinimarkNode
    const paragraph: MinimarkNode = ['p', {}, component] as MinimarkNode
    return { node: paragraph, nextIndex: startIndex + 1 }
  }

  if (token.type === 'math_block') {
    return { node: ['math', { class: 'math block', content: token.content }, token.content] as MinimarkNode, nextIndex: startIndex + 1 }
  }

  if (token.type === 'fence' || token.type === 'fenced_code_block' || token.type === 'code_block') {
    const content = token.content || ''
    const info = token.info || token.params || ''

    // Parse the info string
    const parsed = parseCodeblockInfo(info)

    // Build pre attributes
    const preAttrs: Record<string, unknown> = {}
    if (parsed.language && parsed.language.trim()) {
      preAttrs.language = parsed.language
    }
    if (parsed.filename) {
      preAttrs.filename = parsed.filename
    }
    if (parsed.highlights) {
      preAttrs.highlights = parsed.highlights
    }
    if (parsed.meta) {
      preAttrs.meta = parsed.meta
    }

    // Build code attributes
    const codeAttrs: Record<string, unknown> = {}
    if (parsed.language && parsed.language.trim()) {
      codeAttrs['class'] = `language-${parsed.language}`
    }

    const codeContentWithoutLastNewline = content.endsWith('\n') ? content.slice(0, -1) : content
    const code: MinimarkNode = ['code', codeAttrs, codeContentWithoutLastNewline] as MinimarkNode
    const pre: MinimarkNode = ['pre', preAttrs, code] as MinimarkNode
    return { node: pre, nextIndex: startIndex + 1 }
  }

  if (token.type === 'heading_open') {
    const level = token.tag.replace('h', '')
    const headingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    // Process heading children with inHeading flag for MDC component handling
    const children = processBlockChildren(tokens, startIndex + 1, 'heading_close', true, true, insideNestedContext)

    if (children.nodes.length > 0) {
      // Always generate ID for all headings, no exceptions
      const textContent = extractTextContent(children.nodes)
      const headingId = slugify(textContent)

      // Always attach ID to the heading element itself
      return { node: [headingTag, { id: headingId }, ...children.nodes] as MinimarkNode, nextIndex: children.nextIndex + 1 }
    }
    return { node: null, nextIndex: children.nextIndex + 1 }
  }

  // Handle list items - paragraphs should be unwrapped
  if (token.type === 'list_item_open') {
    const attrs = processAttributes(token.attrs, { handleBoolean: false, handleJSON: false })
    const children = processBlockChildren(tokens, startIndex + 1, 'list_item_close', false, false, true)
    // Unwrap paragraphs in list items
    const unwrapped: MinimarkNode[] = []
    for (const child of children.nodes) {
      if (Array.isArray(child) && child[0] === 'p') {
        // Unwrap paragraph, add its children directly
        unwrapped.push(...(child.slice(2) as MinimarkNode[]))
      }
      else {
        unwrapped.push(child)
      }
    }
    if (unwrapped.length > 0) {
      return { node: ['li', attrs, ...unwrapped] as MinimarkNode, nextIndex: children.nextIndex + 1 }
    }
    return { node: null, nextIndex: children.nextIndex + 1 }
  }

  // Handle generic block-level open/close pairs (includes blockquote, lists, tables, etc.)
  const tagName = BLOCK_TAG_MAP[token.type]
  if (tagName) {
    const attrs = processAttributes(token.attrs, { handleBoolean: false, handleJSON: false })
    const closeType = token.type.replace('_open', '_close')

    // Special handling for blockquotes
    if (tagName === 'blockquote') {
      // First pass: get children
      const children = processBlockChildren(tokens, startIndex + 1, closeType, false, false, false)

      // Rule: If a heading is the FIRST child AND there are additional children after it,
      // then the heading should NOT have an ID. Otherwise, headings should have IDs.
      if (children.nodes.length > 1) {
        const firstChild = children.nodes[0]
        // Check if first child is a heading (h1-h6)
        const isHeading = Array.isArray(firstChild)
          && typeof firstChild[0] === 'string'
          && /^h[1-6]$/.test(firstChild[0])

        if (isHeading) {
          // Heading is first child with more siblings - reprocess without IDs
          const childrenNoIds = processBlockChildren(tokens, startIndex + 1, closeType, false, false, true)
          if (childrenNoIds.nodes.length > 0) {
            return { node: [tagName, attrs, ...childrenNoIds.nodes] as MinimarkNode, nextIndex: childrenNoIds.nextIndex + 1 }
          }
          return { node: null, nextIndex: childrenNoIds.nextIndex + 1 }
        }
      }

      // All other cases: use original processing (allows IDs)
      if (children.nodes.length > 0) {
        return { node: [tagName, attrs, ...children.nodes] as MinimarkNode, nextIndex: children.nextIndex + 1 }
      }
      return { node: null, nextIndex: children.nextIndex + 1 }
    }

    // For other elements (tables, etc.)
    const isNestedContext = ['td', 'th'].includes(tagName)
    const children = processBlockChildren(tokens, startIndex + 1, closeType, false, false, isNestedContext)
    if (children.nodes.length > 0) {
      return { node: [tagName, attrs, ...children.nodes] as MinimarkNode, nextIndex: children.nextIndex + 1 }
    }
    return { node: null, nextIndex: children.nextIndex + 1 }
  }

  return { node: null, nextIndex: startIndex + 1 }
}

function processBlockChildrenWithSlots(
  tokens: any[],
  startIndex: number,
  closeType: string,
): { nodes: MinimarkNode[], nextIndex: number } {
  const nodes: MinimarkNode[] = []
  let i = startIndex
  let currentSlotName: string | null = null
  let currentSlotChildren: MinimarkNode[] = []

  while (i < tokens.length && tokens[i].type !== closeType) {
    const token = tokens[i]

    // Check for slot marker: #slotname creates mdc_block_slot tokens
    if (token.type === 'mdc_block_slot') {
      // Extract slot name from token.attrs
      // The attrs array contains [["#slotname", ""]] for open, and null/empty for close
      if (token.attrs && Array.isArray(token.attrs) && token.attrs.length > 0) {
        const firstAttr = token.attrs[0]
        if (Array.isArray(firstAttr) && firstAttr.length > 0) {
          const slotKey = firstAttr[0] as string
          // Remove the # prefix to get the slot name
          if (slotKey.startsWith('#')) {
            const slotName = slotKey.substring(1)

            // Save previous slot if any
            if (currentSlotName !== null && currentSlotChildren.length > 0) {
              nodes.push(['template', { name: currentSlotName }, ...currentSlotChildren] as MinimarkNode)
              currentSlotChildren = []
            }

            currentSlotName = slotName
            i++
            continue
          }
        }
      }

      // If attrs is null/empty, this is a slot close token - just skip it
      i++
      continue
    }

    // Process other block tokens
    // MDC components are not nested contexts - headings inside them should get IDs
    const result = processBlockToken(tokens, i, false)
    i = result.nextIndex
    if (result.node) {
      if (currentSlotName !== null) {
        // Add to current slot
        currentSlotChildren.push(result.node)
      }
      else {
        // Add directly to component
        nodes.push(result.node)
      }
    }
  }

  // Save last slot if any
  if (currentSlotName !== null && currentSlotChildren.length > 0) {
    nodes.push(['template', { name: currentSlotName }, ...currentSlotChildren] as MinimarkNode)
  }

  return { nodes, nextIndex: i }
}

function processBlockChildren(
  tokens: any[],
  startIndex: number,
  closeType: string,
  inlineOnly: boolean,
  inHeading: boolean = false,
  insideNestedContext: boolean = false,
): { nodes: MinimarkNode[], nextIndex: number } {
  const nodes: MinimarkNode[] = []
  let i = startIndex

  while (i < tokens.length && tokens[i].type !== closeType) {
    const token = tokens[i]

    if (token.type === 'inline') {
      const inlineNodes = processInlineTokens(token.children || [], inHeading)
      nodes.push(...inlineNodes)
      i++
    }
    else if (token.type === 'hardbreak' || token.type === 'hard_break') {
      nodes.push(['br', {}] as MinimarkNode)
      i++
    }
    else if (token.type === 'softbreak') {
      // Soft breaks are preserved as newlines in the text content
      nodes.push('\n')
      i++
    }
    else if (inlineOnly && (token.type === 'text' || token.type === 'code_inline')) {
      if (token.content) {
        nodes.push(token.content)
      }
      i++
    }
    else {
      const result = processBlockToken(tokens, i, insideNestedContext)
      i = result.nextIndex
      if (result.node) {
        nodes.push(result.node)
      }
    }
  }

  // Merge adjacent text nodes
  return { nodes: mergeAdjacentTextNodes(nodes), nextIndex: i }
}

/**
 * Merge adjacent string nodes in an array of nodes
 */
function mergeAdjacentTextNodes(nodes: MinimarkNode[]): MinimarkNode[] {
  const merged: MinimarkNode[] = []

  for (const node of nodes) {
    const lastNode = merged[merged.length - 1]

    // If both current and last nodes are strings, merge them
    if (typeof node === 'string' && typeof lastNode === 'string') {
      merged[merged.length - 1] = lastNode + node
    }
    else {
      merged.push(node)
    }
  }

  return merged
}

/**
 * Extract text content from nodes for heading ID generation
 */
function extractTextContent(nodes: MinimarkNode[]): string {
  let text = ''

  for (const node of nodes) {
    if (typeof node === 'string') {
      text += node
    }
    else if (Array.isArray(node)) {
      // For array nodes (elements), include the tag name (for inline components)
      const tag = node[0]
      const children = node.slice(2) as MinimarkNode[]

      // Skip 'br' and 'html_inline' tags
      if (tag === 'br' || tag === 'html_inline') {
        continue
      }

      // Include the tag name (e.g., "inline" from :inline component)
      text += ' ' + tag + ' '
      // Also include any text from children
      if (children.length > 0) {
        text += extractTextContent(children)
      }
    }
  }

  return text
}

/**
 * Convert text to a slug for heading IDs
 * Example: "Hello World" -> "hello-world"
 * Example: "1. Introduction" -> "_1-introduction"
 */
function slugify(text: string): string {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-word chars (except hyphens)
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  // Prefix with underscore if starts with a digit (HTML IDs can't start with numbers)
  if (/^\d/.test(slug)) {
    slug = '_' + slug
  }

  return slug
}

function processInlineTokens(tokens: any[], inHeading: boolean = false): MinimarkNode[] {
  const nodes: MinimarkNode[] = []
  let i = 0

  while (i < tokens.length) {
    const token = tokens[i]

    // Skip hidden mdc_inline_props tokens (they're handled by the parent element)
    // These appear after elements like **strong**{attr} and should be attached to the parent
    if (token.type === 'mdc_inline_props' && token.hidden) {
      // Props tokens are handled by the parent element that processes them
      // We should not process them here as separate nodes
      i++
      continue
    }

    const result = processInlineToken(tokens, i, inHeading)
    i = result.nextIndex
    if (result.node) {
      nodes.push(result.node)
    }
  }

  // Merge adjacent text nodes (e.g., "text" + "\n" + "text" → "text\ntext")
  return mergeAdjacentTextNodes(nodes)
}

function processInlineToken(tokens: any[], startIndex: number, inHeading: boolean = false): { node: MinimarkNode | string | null, nextIndex: number } {
  const token = tokens[startIndex]

  if (token.type === 'text') {
    return { node: token.content || null, nextIndex: startIndex + 1 }
  }

  // Handle emoji tokens (e.g., :rocket: -> 🚀)
  if (token.type === 'emoji') {
    return { node: token.content || null, nextIndex: startIndex + 1 }
  }

  // Handle html_inline tokens (e.g., task list checkboxes)
  if (token.type === 'html_inline') {
    const parsed = parseHtmlInline(token.content || '')
    if (parsed && parsed.selfClosing) {
      // Self-closing tags like <input>, <br>, <img>
      return { node: [parsed.tag, parsed.attrs] as MinimarkNode, nextIndex: startIndex + 1 }
    }
    // For non-self-closing HTML or unparseable HTML, return as text
    return { node: token.content || null, nextIndex: startIndex + 1 }
  }

  // Handle MDC inline span (e.g., [text]{attr})
  // markdown-it-mdc creates mdc_inline_span tokens, and props appear AFTER the close token
  if (token.type === 'mdc_inline_span' && token.nesting === 1) {
    const attrs: Record<string, unknown> = {}
    let i = startIndex + 1
    const nodes: MinimarkNode[] = []

    // Process children until span close
    while (i < tokens.length) {
      const childToken = tokens[i]

      // Check for span close
      if (childToken.type === 'mdc_inline_span' && childToken.nesting === -1) {
        break
      }

      // Skip empty text tokens
      if (childToken.type === 'text' && !childToken.content?.trim()) {
        i++
        continue
      }

      // Process other tokens
      const result = processInlineToken(tokens, i, inHeading)
      i = result.nextIndex
      if (result.node) {
        nodes.push(result.node as MinimarkNode)
      }
    }

    // Skip the close token and check for props token after it
    const { attrs: spanAttrs, nextIndex } = extractMDCAttributes(tokens, i + 1)
    Object.assign(attrs, spanAttrs)

    if (nodes.length > 0 || Object.keys(attrs).length > 0) {
      return { node: ['span', attrs, ...nodes] as MinimarkNode, nextIndex }
    }
    return { node: null, nextIndex }
  }

  // Skip mdc_inline_span close tokens
  if (token.type === 'mdc_inline_span' && token.nesting === -1) {
    return { node: null, nextIndex: startIndex + 1 }
  }

  if (token.type === 'code_inline') {
    const { attrs, nextIndex } = extractMDCAttributes(tokens, startIndex + 1)

    if (token.content) {
      return { node: ['code', attrs, token.content] as MinimarkNode, nextIndex }
    }
    return { node: null, nextIndex }
  }

  if (token.type === 'hardbreak' || token.type === 'hard_break') {
    return { node: ['br', {}] as MinimarkNode, nextIndex: startIndex + 1 }
  }

  if (token.type === 'softbreak') {
    // Soft breaks are preserved as newlines in the text content
    return { node: '\n', nextIndex: startIndex + 1 }
  }

  // Handle MDC inline components (e.g., :inline-component or :component[text]{attrs})
  if (token.type === 'mdc_inline_component') {
    const componentName = token.tag || 'component'

    // Check if this is an opening tag (has children) or a self-closing tag
    if (token.nesting === 1) {
      // Opening tag - process children until closing tag
      const children: MinimarkNode[] = []
      let i = startIndex + 1

      while (i < tokens.length) {
        const childToken = tokens[i]

        // Check for closing tag
        if (childToken.type === 'mdc_inline_component' && childToken.nesting === -1) {
          // Found closing tag, now check for props after it
          const { attrs, nextIndex } = extractMDCAttributes(tokens, i + 1, false)
          return { node: [componentName, attrs, ...children] as MinimarkNode, nextIndex }
        }

        // Process child token
        const result = processInlineToken(tokens, i, inHeading)
        i = result.nextIndex
        if (result.node) {
          children.push(result.node as MinimarkNode)
        }
      }

      // No closing tag found, return what we have
      return { node: [componentName, {}, ...children] as MinimarkNode, nextIndex: i }
    }
    else if (token.nesting === -1) {
      // Closing tag - should be handled by the opening tag processing
      return { node: null, nextIndex: startIndex + 1 }
    }
    else {
      // Self-closing component (nesting === 0)
      const attrs: Record<string, unknown> = {}

      // markdown-it-mdc stores attributes in a separate mdc_inline_props token
      // that appears right after the component token
      const { attrs: componentAttrs, nextIndex: propsNextIndex } = extractMDCAttributes(tokens, startIndex + 1, false)
      Object.assign(attrs, componentAttrs)

      // Extract attributes from token.attrs (fallback, though markdown-it-mdc uses mdc_inline_props)
      const fallbackAttrs = processAttributes(token.attrs, { handleBoolean: false })
      Object.assign(attrs, fallbackAttrs)

      // Return the component without any text children
      // Text after the component will be processed as siblings by processInlineChildren
      const nextIndex = Object.keys(componentAttrs).length > 0 ? propsNextIndex : startIndex + 1
      return { node: [componentName, attrs] as MinimarkNode, nextIndex }
    }
  }

  if (token.type === 'image') {
    const attrs = processAttributes(token.attrs, { handleBoolean: false, handleJSON: false, filterEmpty: true })
    // Override alt with token.content if available
    if (token.content) {
      attrs.alt = token.content
    }

    // Check if there's a props token right after the image token
    const { attrs: imageAttrs, nextIndex } = extractMDCAttributes(tokens, startIndex + 1)
    Object.assign(attrs, imageAttrs)

    return { node: ['img', attrs] as MinimarkNode, nextIndex }
  }

  if (token.type === 'link_open') {
    const attrs = processAttributes(token.attrs, { handleBoolean: false, handleJSON: false })
    const children = processInlineChildren(tokens, startIndex + 1, 'link_close', inHeading)

    // Check if there's a props token right after the link_close token
    const { attrs: linkAttrs, nextIndex } = extractMDCAttributes(tokens, children.nextIndex + 1)
    Object.assign(attrs, linkAttrs)

    if (children.nodes.length > 0) {
      return { node: ['a', attrs, ...children.nodes] as MinimarkNode, nextIndex }
    }
    return { node: null, nextIndex }
  }

  if (token.type === 'math_inline') {
    return { node: ['math', { class: 'math inline', content: token.content }, token.content] as MinimarkNode, nextIndex: startIndex + 1 }
  }

  // Handle generic inline open/close pairs
  const tagName = INLINE_TAG_MAP[token.type]
  if (tagName) {
    const closeType = token.type.replace('_open', '_close')
    const children = processInlineChildren(tokens, startIndex + 1, closeType, inHeading)

    // Check if there's a props token right after the close token
    const { attrs, nextIndex } = extractMDCAttributes(tokens, children.nextIndex + 1)

    if (children.nodes.length > 0) {
      return { node: [tagName, attrs, ...children.nodes] as MinimarkNode, nextIndex }
    }
    return { node: null, nextIndex }
  }

  if (token.children) {
    const nestedNodes = processInlineTokens(token.children, inHeading)
    return { node: nestedNodes.length === 1 ? nestedNodes[0] : null, nextIndex: startIndex + 1 }
  }

  return { node: null, nextIndex: startIndex + 1 }
}

function processInlineChildren(
  tokens: any[],
  startIndex: number,
  closeType: string,
  inHeading: boolean = false,
): { nodes: MinimarkNode[], nextIndex: number } {
  const nodes: MinimarkNode[] = []
  let i = startIndex

  while (i < tokens.length) {
    const token = tokens[i]

    // Check for close token (either by type or by nesting for mdc_inline_span)
    if (token.type === closeType) {
      if (closeType === 'mdc_inline_span' && token.nesting === -1) {
        break
      }
      else if (closeType !== 'mdc_inline_span') {
        break
      }
    }

    // Skip hidden mdc_inline_props tokens inside children
    // These should not be processed here - they're handled by the parent
    if (token.type === 'mdc_inline_props' && token.hidden) {
      i++
      continue
    }

    // Special handling for MDC inline components in headings
    // In headings, text after components should be siblings, not children
    if (token.type === 'mdc_inline_component' && inHeading) {
      const componentName = token.tag || 'component'
      const attrs: Record<string, unknown> = {}

      // Check for mdc_inline_props token after the component
      const { attrs: componentAttrs, nextIndex: componentNextIndex } = extractMDCAttributes(tokens, i + 1, false)
      Object.assign(attrs, componentAttrs)
      if (Object.keys(componentAttrs).length > 0) {
        i = componentNextIndex // Skip both component and props tokens
      }
      else {
        i++
      }

      nodes.push([componentName, attrs] as MinimarkNode)
      // Continue processing subsequent tokens as siblings
      continue
    }

    const result = processInlineToken(tokens, i, inHeading)
    i = result.nextIndex
    if (result.node) {
      nodes.push(result.node as MinimarkNode)
    }
  }

  // Merge adjacent text nodes
  return { nodes: mergeAdjacentTextNodes(nodes), nextIndex: i }
}
