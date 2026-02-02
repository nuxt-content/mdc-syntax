import React, { useState, useEffect } from 'react'
import { parse, parseAsync, type ParseResult } from '../../index'
import type { ParseOptions } from '../../types'
import { MDCRenderer } from './MDCRenderer'

export interface MDCProps {
  /**
   * The markdown content to parse and render
   */
  markdown: string

  /**
   * Parser options
   */
  options?: ParseOptions

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
   * Enable streaming mode with enhanced components (e.g., ShikiCodeBlock)
   */
  stream?: boolean

  /**
   * Additional className for the wrapper div
   */
  className?: string
}

/**
 * MDC component
 *
 * High-level component that accepts markdown as a string prop,
 * parses it, and renders it using MDCRenderer.
 *
 * @example
 * ```tsx
 * import { MDC } from 'mdc-syntax/react'
 * import CustomHeading from './CustomHeading'
 *
 * const customComponents = {
 *   h1: CustomHeading,
 *   alert: AlertComponent,
 * }
 *
 * export default function App() {
 *   const content = `
 *     # Hello World
 *
 *     This is a **markdown** document with *MDC* components.
 *
 *     ::alert{type="info"}
 *     This is an alert component
 *     ::
 *   `
 *
 *   return <MDC markdown={content} components={customComponents} />
 * }
 * ```
 */
export const MDC: React.FC<MDCProps> = ({
  markdown,
  options = {},
  components: customComponents = {},
  componentsManifest,
  stream = false,
  className,
}) => {
  const [parsed, setParsed] = useState<ParseResult | null>(null)

  // Parse the markdown content
  useEffect(() => {
    let isMounted = true

    if (stream) {
      // Use synchronous parse for streaming mode
      const result = parse(markdown, options)
      if (isMounted) {
        setParsed(result)
      }
    }
    else {
      // Use async parse for non-streaming mode (supports code highlighting, etc.)
      parseAsync(markdown, options).then((result) => {
        if (isMounted) {
          setParsed(result)
        }
      }).catch((error) => {
        console.error('Failed to parse markdown:', error)
      })
    }

    return () => {
      isMounted = false
    }
  }, [markdown, stream])

  if (!parsed) {
    return null
  }

  return (
    <MDCRenderer
      body={parsed.body}
      components={customComponents}
      componentsManifest={componentsManifest}
      stream={stream}
      className={className}
    />
  )
}
