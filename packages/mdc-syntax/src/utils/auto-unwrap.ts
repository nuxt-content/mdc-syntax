import type { MinimarkNode } from 'minimark'

/**
 * Applies automatic unwrapping to container components.
 *
 * This utility removes unnecessary paragraph wrappers from container component children.
 * If a container has only a single paragraph child (and no other block elements),
 * the paragraph is unwrapped and its children are hoisted up to be direct children
 * of the container.
 *
 * @param node - The MDC element to process
 * @returns The node with auto-unwrapped children (if applicable)
 *
 * @example
 * // Before:
 * { tag: 'alert', children: [{ type: 'element', tag: 'p', children: [{ type: 'text', value: 'Text' }] }] }
 *
 * // After:
 * { tag: 'alert', children: [{ type: 'text', value: 'Text' }] }
 */
export function applyAutoUnwrap(node: MinimarkNode): MinimarkNode {
  if (typeof node === 'string' || node.length < 2) {
    return node
  }

  const [tag, props, ...children] = node

  // Filter out empty text nodes for checking
  const nonEmptyChildren = children.filter((child: MinimarkNode) =>
    typeof child !== 'string' || (child && child.trim()),
  )

  if (nonEmptyChildren.length === 0) {
    return node
  }

  // Check if we have exactly one paragraph child (and possibly empty text nodes)
  if (nonEmptyChildren.length > 1 || typeof nonEmptyChildren[0] === 'string' || nonEmptyChildren[0][0] !== 'p') {
    return [
      tag,
      props,
      ...children.map((child: MinimarkNode) => applyAutoUnwrap(child as MinimarkNode)),
    ] as MinimarkNode
  }

  return [
    tag,
    props,
    ...nonEmptyChildren[0].slice(2) as MinimarkNode[],
  ] as MinimarkNode
}
