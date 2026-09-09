import type { Node, ElementNode, ElementNodeAttributes, MarkdownDocument } from 'comark'
import { decodeHTML, TREE_WALK_MAX_DEPTH } from 'comark/utils'

/** HTML void elements — never have children / closing tags. */
const HTML_VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

export type ParsedHtmlTag =
  | { kind: 'open'; tag: string; attrs: Record<string, unknown>; selfClosing: boolean }
  | { kind: 'close'; tag: string }
  | { kind: 'comment'; content: string }
  | { kind: 'other'; content: string }

/**
 * Applies automatic unwrapping to container components.
 *
 * This utility removes unnecessary paragraph wrappers from container component children.
 * If a container has only a single paragraph child (and no other block elements),
 * the paragraph is unwrapped and its children are hoisted up to be direct children
 * of the container.
 *
 * Recursion is capped at {@link TREE_WALK_MAX_DEPTH} element levels; deeper subtrees are left as-is.
 *
 * @param node - The Comark element to process
 * @returns The node with auto-unwrapped children (if applicable)
 *
 * @example
 * // Before:
 * { tag: 'alert', children: [{ type: 'element', tag: 'p', children: [{ type: 'text', value: 'Text' }] }] }
 *
 * // After:
 * { tag: 'alert', children: [{ type: 'text', value: 'Text' }] }
 */
function isBlankText(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c !== 32 && c !== 10 && c !== 9 && c !== 13 && c !== 12) return false
  }
  return true
}

export function applyAutoUnwrap(node: Node): Node {
  return applyAutoUnwrapAt(node, 0)
}

function applyAutoUnwrapAt(node: Node, depth: number): Node {
  if (depth >= TREE_WALK_MAX_DEPTH || typeof node === 'string' || node[0] === 'p' || node[0] == null) {
    return node
  }

  const length = node.length
  if (length < 3) {
    return node
  }

  let significant: Node | undefined
  let significantCount = 0
  for (let i = 2; i < length; i++) {
    const child = node[i] as Node
    if (typeof child === 'string' && isBlankText(child)) continue
    significant = child
    if (++significantCount > 1) break
  }

  if (significantCount === 0) {
    return node
  }

  if (significantCount === 1 && Array.isArray(significant) && significant[0] === 'p') {
    // Lift the paragraph's attrs onto the parent so trailing `{attr}` survives the unwrap.
    // Parent attrs take precedence so explicit component props aren't overridden.
    const paragraphAttrs = significant[1] as Record<string, unknown> | undefined
    let mergedProps = node[1]
    if (paragraphAttrs) {
      for (const key in paragraphAttrs) {
        if (key !== undefined) {
          mergedProps = { ...paragraphAttrs, ...node[1] }
          break
        }
      }
    }
    const unwrapped = significant.slice() as unknown as ElementNode
    unwrapped[0] = node[0] as string
    unwrapped[1] = mergedProps
    return unwrapped
  }

  let copy: Node[] | undefined
  for (let i = 2; i < length; i++) {
    const child = node[i] as Node
    const next = applyAutoUnwrapAt(child, depth + 1)
    if (copy !== undefined) {
      copy.push(next)
    } else if (next !== child) {
      copy = node.slice(0, i) as unknown as Node[]
      copy.push(next)
    }
  }
  return copy !== undefined ? (copy as Node) : node
}

/**
 * Extracts reusable nodes from the last output tree
 * @param markdown - The markdown to parse
 * @param lastOutput - The last output tree
 * @returns The reusable nodes and the remaining markdown
 */
export function extractReusableNodes(markdown: string, lastOutput: MarkdownDocument) {
  let lastValidNodeIndex = -1
  let i = lastOutput.nodes.length - 1
  let lastNodeIgnored = false
  while (i >= 0) {
    const node = lastOutput.nodes[i] as ElementNode
    if (node[1] && node[1].$?.line) {
      if (lastNodeIgnored) {
        lastValidNodeIndex = i
        break
      } else {
        lastNodeIgnored = true
      }
    }
    i--
  }
  const lastNode = lastValidNodeIndex !== -1 ? lastOutput.nodes[lastValidNodeIndex] : null
  if (lastNode) {
    const remainingMarkdownStartLine = (lastNode[1] as ElementNodeAttributes).$?.line ?? 0
    return {
      remainingMarkdownStartLine,
      reusedNodes: lastOutput.nodes.slice(0, lastValidNodeIndex + 1),
      remainingMarkdown: markdown.split('\n').slice(remainingMarkdownStartLine).join('\n') || '',
    }
  }

  return {
    remainingMarkdownStartLine: 0,
    remainingMarkdown: markdown,
    reusedNodes: [],
  }
}

/**
 * Parse a single html_inline token content into a structured tag description.
 * Handles open tags (with attrs), close tags, self-closing syntax, and comments.
 */
export function parseHtmlInline(content: string): ParsedHtmlTag {
  const trimmed = content.trim()

  if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
    return { kind: 'comment', content: trimmed.slice(4, -3) }
  }

  const closeMatch = trimmed.match(/^<\/\s*([A-Za-z][\w:-]*)\s*>$/)
  if (closeMatch) {
    return { kind: 'close', tag: closeMatch[1] }
  }

  const openMatch = trimmed.match(/^<\s*([A-Za-z][\w:-]*)((?:\s+[\s\S]*?)?)\s*(\/?)>$/)
  if (openMatch) {
    const tag = openMatch[1]
    const attrsStr = openMatch[2] || ''
    const slash = openMatch[3] === '/'
    const selfClosing = slash || HTML_VOID_ELEMENTS.has(tag.toLowerCase())
    return {
      kind: 'open',
      tag,
      attrs: parseHtmlAttributes(attrsStr),
      selfClosing,
    }
  }

  return { kind: 'other', content: trimmed }
}

/**
 * Parse HTML attribute string into a key/value map.
 * Supports `key="value"`, `key='value'`, bare `key=value`, and boolean attributes.
 */
export function parseHtmlAttributes(attrsStr: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {}
  if (!attrsStr || !attrsStr.trim()) return attrs

  const re = /([:\w.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(attrsStr)) !== null) {
    const key = match[1]
    const value = match[2] ?? match[3] ?? match[4]
    attrs[key] = value === undefined ? true : decodeHTML(value)
  }

  return attrs
}
