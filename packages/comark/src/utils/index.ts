// #region Tree Utils

import { decodeHTML } from 'entities'
import type { Node, MarkdownDocument } from 'comark'

export { decodeHTML } from 'entities'

type VisitResult = Node | false | undefined | void

/**
 * Check whether a value is a {@link MarkdownDocument} (or a bare `{ nodes }` document-like).
 */
export function isMarkdownDocument(value: unknown): value is MarkdownDocument {
  return !!value && typeof value === 'object' && Array.isArray((value as MarkdownDocument).nodes)
}

/**
 * Get the text content of a Markdown AST node
 *
 * @param node - The node
 * @param options - The options
 * @param options.decodeUnicodeEntities - Whether to decode Unicode entities
 * @returns The text content
 */
export function textContent(node: Node, options: { decodeUnicodeEntities?: boolean } = {}): string {
  if (typeof node === 'string') {
    if (options.decodeUnicodeEntities) {
      return decodeHTML(node)
    }
    return node as string
  }
  let out = ''
  const len = node.length
  for (let i = 2; i < len; i++) {
    out += textContent(node[i] as Node, options)
  }
  return out
}

/** Walk at most this many element levels. Typical markdown trees are much shallower. */
export const TREE_WALK_MAX_DEPTH = 50

function* walkGenerator(
  document: MarkdownDocument,
  checker: (node: Node) => boolean
): Generator<Node, void, VisitResult> {
  function* walk(
    node: Node,
    parent: Node | Node[],
    index: number,
    depth: number
  ): Generator<Node, boolean, VisitResult> {
    if (depth >= TREE_WALK_MAX_DEPTH) return false

    let currentNode = node

    if (checker(node)) {
      const res = yield node

      if (res === false) {
        // remove the node from the parent
        ;(parent as Node[]).splice(index, 1)
        return true // signal that node was removed
      }

      if (res !== undefined) {
        ;(parent as Node[])[index] = res as Node
        currentNode = res as Node
      }
    }

    if (Array.isArray(currentNode) && currentNode.length > 2) {
      // Use a while loop to handle removals correctly - don't increment if node was removed
      let i = 2
      while (i < currentNode.length) {
        const childRemoved = yield* walk(currentNode[i] as Node, currentNode, i, depth + 1)
        if (childRemoved) {
          // If removed, i stays the same (next node is now at this index)
          continue
        }
        i += 1
      }
    }

    return false
  }

  // Use a while loop to handle removals correctly - don't increment if node was removed
  let i = 0
  while (i < document.nodes.length) {
    const removed = yield* walk(document.nodes[i], document.nodes, i, 0)
    if (removed) {
      // If removed, i stays the same (next node is now at this index)
      continue
    }
    i += 1
  }
}

/**
 * Visit a Markdown document and apply a visitor function to each node.
 * Recursion is capped at {@link TREE_WALK_MAX_DEPTH} element levels; deeper subtrees are left as-is.
 *
 * @param document - The Markdown document
 * @param checker - A function that checks if a node should be visited
 * @param visitor - A function that visits a node
 */
export function visit(
  document: MarkdownDocument,
  checker: (node: Node) => boolean,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  visitor: (node: Node) => VisitResult
) {
  const iterator = walkGenerator(document, checker)
  let step = iterator.next()

  while (!step.done) {
    const res = visitor(step.value)
    step = iterator.next(res)
  }
}

/** Recursion is capped at {@link TREE_WALK_MAX_DEPTH} element levels; deeper subtrees are left as-is. */
export async function visitAsync(
  document: MarkdownDocument,
  checker: (node: Node) => boolean,
  visitor: (node: Node) => Promise<VisitResult> | VisitResult
): Promise<void> {
  const iterator = walkGenerator(document, checker)
  let step = iterator.next()

  while (!step.done) {
    const res = await visitor(step.value)
    step = iterator.next(res)
  }
}

// #region String Utils

const HTML_ESCAPE_RE = /[&<>"]/g
const HTML_ESCAPED_RE = /^&[a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;/
export function escapeHtml(value: string, replace?: Record<string, string | undefined>): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }
  if (replace) {
    Object.assign(escapeMap, replace)
  }
  return value.replace(HTML_ESCAPE_RE, (char, index) => {
    switch (char) {
      case '&': {
        if (escapeMap[char] === '&' || value.slice(index).match(HTML_ESCAPED_RE)) {
          return char
        }
        return escapeMap[char] ?? char
      }
      default:
        return escapeMap[char] ?? char
    }
  })
}

export function indent(
  text: string,
  { ignoreFirstLine = false, level = 1, width }: { ignoreFirstLine?: boolean; level?: number; width?: number } = {}
) {
  const pad = width ? ' '.repeat(width) : '  '.repeat(level)
  return text
    .split('\n')
    .map((line, index) => {
      if (ignoreFirstLine && index === 0) {
        return line
      }
      return line ? pad + line : line
    })
    .join('\n')
}

/**
 * Convert a string to pascal case
 * @param str - The string to convert
 * @returns The pascal case string
 */
export function pascalCase(str: string) {
  return str
    ? splitByCase(str)
        .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ''))
        .join('')
    : ''
}

/**
 * Convert a string to kebab case
 * @param str - The string to convert
 * @returns The kebab case string
 */
export function kebabCase(str: string) {
  return str
    ? splitByCase(str)
        .map((p) => p.toLowerCase())
        .join('-')
    : ''
}

/**
 * Convert a string to camel case
 * @param str - The string to convert
 * @returns The camel case string
 */
export function camelCase(str: string) {
  if (!str) {
    return ''
  }
  str = pascalCase(str)
  return str.charAt(0).toLowerCase() + str.slice(1)
}

// split a string by case
function splitByCase(str: string) {
  const parts: string[] = []
  if (!str) {
    return parts
  }
  let buff = ''
  let previousUpper: boolean | undefined
  let previousSplitter: boolean | undefined
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    // Fast splitter check using direct character comparisons
    const isSplitter = char === '-' || char === '_' || char === '/' || char === '.'
    if (isSplitter === true) {
      parts.push(buff)
      buff = ''
      previousUpper = void 0
      continue
    }
    // Fast number check using character codes
    const charCode = char.charCodeAt(0)
    const isNumber = charCode >= 48 && charCode <= 57 // '0' to '9'
    // Fast uppercase check using character codes
    const isUpper = isNumber ? void 0 : charCode >= 65 && charCode <= 90 // 'A' to 'Z'
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff)
        buff = char
        previousUpper = isUpper
        continue
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff[buff.length - 1]
        parts.push(buff.slice(0, buff.length - 1))
        buff = lastChar + char
        previousUpper = isUpper
        continue
      }
    }
    buff += char
    previousUpper = isUpper
    previousSplitter = isSplitter
  }
  parts.push(buff)
  return parts
}

// #endregion

// #region Object Utils
/**
 * Retrieves a value from a nested object using a dot-separated key path.
 * @param data - The object to retrieve the value from.
 * @param key - The dot-separated key path to the value.
 * @returns The value at the specified key path, or `undefined` if the key path does not exist.
 */
export function get(data: unknown, key: string): unknown {
  const keys = key.split('.')
  let value: unknown = data
  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return undefined
    }
  }
  return value
}
// #endregion

// Re-export the shared attribute resolvers so framework renderers can apply the
// same `:prefix` semantics as the HTML/ANSI handlers without duplicating logic.
export { resolveAttributes, resolveAttribute } from '../internal/stringify/attributes.ts'
export type { ResolveAttributesOptions } from '../internal/stringify/attributes.ts'
