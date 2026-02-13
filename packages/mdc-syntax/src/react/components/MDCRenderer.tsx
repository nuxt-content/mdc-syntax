import type { MinimarkElement, MinimarkNode, MinimarkTree } from 'minimark'
import React, { lazy, Suspense, useMemo } from 'react'
import { standardProseComponents } from '.'
import { camelCase, pascalCase } from 'scule'
import { findLastTextNodeAndAppendNode, getCaret } from '../../utils/caret'

/**
 * Default HTML tag mappings for MDC elements
 */
const defaultTagMap: Record<string, string> = {
  p: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  a: 'a',
  strong: 'strong',
  em: 'em',
  code: 'code',
  pre: 'pre',
  blockquote: 'blockquote',
  hr: 'hr',
  br: 'br',
  img: 'img',
  table: 'table',
  thead: 'thead',
  tbody: 'tbody',
  tr: 'tr',
  th: 'th',
  td: 'td',
  del: 'del',
  div: 'div',
  span: 'span',
}

/**
 * Helper to get tag from a MinimarkNode
 */
function getTag(node: MinimarkNode): string | null {
  if (Array.isArray(node) && node.length >= 1) {
    return node[0] as string
  }
  return null
}

function cssStringToObject(cssString: string): Record<string, string> {
  return cssString
    .split(';')
    .filter(Boolean)
    .reduce((acc, rule) => {
      const [prop, value] = rule.split(':')
      if (!prop || !value) return acc

      let camelProp = prop.trim()

      if (!prop.startsWith('--')) {
        camelProp = camelCase(camelProp)
      }

      acc[camelProp] = value.trim()
      return acc
    }, {} as Record<string, string>)
}

/**
 * Helper to get props from a MinimarkNode
 */
function getProps(node: MinimarkNode): Record<string, any> {
  if (Array.isArray(node) && node.length >= 2) {
    return (node[1] as Record<string, any>) || {}
  }
  return {}
}

function parsePropValue(value: string): any {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  try {
    return JSON.parse(value)
  }
  catch {
    // noop
  }
  return value
}

/**
 * Helper to get children from a MinimarkNode
 */
function getChildren(node: MinimarkNode): MinimarkNode[] {
  if (Array.isArray(node) && node.length > 2) {
    return node.slice(2) as MinimarkNode[]
  }
  return []
}

// Cache for dynamically resolved components
const asyncComponentCache = new Map<string, React.LazyExoticComponent<any>>()

/**
 * Render a single MDC node to React element
 */
function renderNode(
  node: MinimarkNode,
  components: Record<string, any> = {},
  key?: string | number,
  componentsManifest?: (name: string) => Promise<{ default: React.ComponentType<any> }>,
): React.ReactNode {
  // Handle text nodes (strings)
  if (typeof node === 'string') {
    return node
  }

  // Handle element nodes (arrays)
  if (Array.isArray(node)) {
    const tag = getTag(node)
    if (!tag) return null

    const nodeProps = getProps(node)
    const children = getChildren(node)

    // Check if there's a custom component for this tag (exact match or PascalCase)
    let customComponent = components[tag] || components[pascalCase(tag)]

    // If not in components map and manifest is provided, try dynamic resolution
    if (!customComponent && componentsManifest && !defaultTagMap[tag]) {
      const cacheKey = tag
      if (!asyncComponentCache.has(cacheKey)) {
        asyncComponentCache.set(
          cacheKey,
          lazy(() => componentsManifest(tag)),
        )
      }
      customComponent = asyncComponentCache.get(cacheKey)
    }

    const Component = customComponent || defaultTagMap[tag] || tag

    // Prepare props
    const props: Record<string, any> = { ...nodeProps }
    if (typeof Component !== 'string') {
      props.__node = node
    }

    // Parse special prop values (props starting with :)
    for (const [propKey, value] of Object.entries(nodeProps)) {
      if (propKey === 'style') {
        props.style = cssStringToObject(value)
      }
      else if (propKey === 'tabindex') {
        props.tabIndex = value
        Reflect.deleteProperty(props, propKey)
      }
      if (propKey === 'class') {
        props.className = value
        Reflect.deleteProperty(props, propKey)
      }
      else {
        if (propKey.startsWith(':')) {
          props[propKey.substring(1)] = parsePropValue(value)
          Reflect.deleteProperty(props, propKey)
        }
      }
    }
    // Add key if provided
    if (key !== undefined) {
      props.key = key
    }

    // Handle self-closing tags
    if (['hr', 'br', 'img'].includes(tag)) {
      return React.createElement(Component, props)
    }

    // Render children
    const renderedChildren = children
      .map((child, index) => renderNode(child, components, index, componentsManifest))
      .filter(child => child !== null)

    // Wrap lazy components in Suspense
    if (customComponent && asyncComponentCache.has(tag)) {
      return (
        <Suspense key={key} fallback={null}>
          {React.createElement(Component, props, ...renderedChildren)}
        </Suspense>
      )
    }

    return React.createElement(Component, props, ...renderedChildren)
  }

  return null
}

export interface MDCRendererProps {
  /**
   * The Minimark tree to render
   */
  body: MinimarkTree

  /**
   * Custom component mappings for element tags
   * Key: tag name (e.g., 'h1', 'p', 'MyComponent')
   * Value: React component
   */
  components?: Record<string, React.ComponentType<any>>

  /**
   * Dynamic component resolver function
   * Used to resolve components that aren't in the components map
   */
  componentsManifest?: (name: string) => Promise<{ default: React.ComponentType<any> }>

  /**
   * Enable streaming mode with stream-specific components
   */
  streaming?: boolean

  /**
   * If caret is true, a caret will be appended to the last text node in the tree
   * If caret is an object, it will be appended to the last text node in the tree with the given class
   */
  caret?: boolean | { class: string }

  /**
   * Additional className for the wrapper div
   */
  className?: string
}

/**
 * MDCRenderer component
 *
 * Renders a Minimark tree to React components/HTML.
 * Supports custom component mapping for element tags.
 *
 * @example
 * ```tsx
 * import { MDCRenderer } from 'mdc-syntax/react'
 * import CustomHeading from './CustomHeading'
 *
 * const customComponents = {
 *   h1: CustomHeading,
 *   h2: CustomHeading,
 * }
 *
 * export default function App() {
 *   return <MDCRenderer body={mdcAst} components={customComponents} />
 * }
 * ```
 */
export const MDCRenderer: React.FC<MDCRendererProps> = ({
  body,
  components: customComponents = {},
  componentsManifest,
  streaming = false,
  caret: caretProp = false,
  className,
}) => {
  const components = useMemo(() => ({
    ...standardProseComponents,
    ...customComponents,
  }), [customComponents])

  const caret = useMemo(() => getCaret(caretProp), [caretProp])

  const renderedNodes = useMemo(() => {
    const nodes = [...(body.value || [])]

    if (streaming && caret && nodes.length > 0) {
      const hasStreamCaret = findLastTextNodeAndAppendNode(nodes[nodes.length - 1] as MinimarkElement, caret)
      if (!hasStreamCaret) {
        nodes.push(caret)
      }
    }

    return nodes
      .map((node, index) => renderNode(node, components, index, componentsManifest))
      .filter(child => child !== null)
  }, [body, components, componentsManifest, streaming, caret])

  return (
    <div className={`mdc-content ${className || ''}`}>
      {renderedNodes}
    </div>
  )
}
