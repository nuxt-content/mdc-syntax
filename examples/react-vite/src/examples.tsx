import React from 'react'
import { MDC, MDCRenderer } from 'mdc-syntax/react'
import { parse } from 'mdc-syntax'

/**
 * Example 1: Basic Usage
 * The simplest way to use MDC - just pass markdown as a string
 */
export function BasicExample() {
  const markdown = `# Hello **World**`
  return <MDC markdown={markdown} />
}

/**
 * Example 2: With Custom Components
 * Define custom components for MDC blocks
 */
export function CustomComponentsExample() {
  const Alert = ({ type, children }: any) => (
    <div className={`alert alert-${type}`}>
      {children}
    </div>
  )

  const markdown = `
    # Welcome

    ::alert{type="info"}
    This is a custom alert component!
    ::
  `

  return <MDC markdown={markdown} components={{ alert: Alert }} />
}

/**
 * Example 3: Using MDCRenderer (Lower-level API)
 * Parse markdown yourself and pass the AST to MDCRenderer
 */
export function RendererExample() {
  const markdown = `# Hello **World**`
  const result = parse(markdown)

  return <MDCRenderer body={result.body} />
}

/**
 * Example 4: Interactive Editor
 * Real-time markdown editing with live preview
 */
export function InteractiveExample() {
  const [markdown, setMarkdown] = React.useState(`# Edit me!`)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <textarea
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        style={{ minHeight: '200px' }}
      />
      <MDC markdown={markdown} />
    </div>
  )
}

/**
 * Example 5: Streaming Support
 * Parse markdown incrementally as it arrives
 */
export function StreamingExample() {
  const [markdown, setMarkdown] = React.useState('')

  React.useEffect(() => {
    const fullMarkdown = `# Streaming Demo

This content appears **gradually** as if it's being streamed.

## Features
- Real-time rendering
- Incremental parsing
- Auto-close support
`

    let index = 0
    const interval = setInterval(() => {
      if (index < fullMarkdown.length) {
        setMarkdown(fullMarkdown.slice(0, index + 1))
        index++
      }
      else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return <MDC markdown={markdown} />
}

/**
 * Example 6: Custom Prose Components
 * Override default HTML elements with styled components
 */
export function CustomProseExample() {
  const CustomH1 = (props: any) => (
    <h1 style={{ color: '#8b5cf6', borderBottom: '2px solid #8b5cf6' }} {...props} />
  )

  const CustomLink = (props: any) => (
    <a style={{ color: '#3b82f6', fontWeight: 'bold' }} {...props} />
  )

  const markdown = `
    # Purple Heading

    This is a [custom styled link](https://example.com)
  `

  return (
    <MDC
      markdown={markdown}
      components={{
        h1: CustomH1,
        a: CustomLink,
      }}
    />
  )
}

/**
 * Example 7: GitHub Flavored Markdown
 * Tables, task lists, and strikethrough
 */
export function GFMExample() {
  const markdown = `
    # GitHub Flavored Markdown

    ## Tables

    | Feature | Supported |
    |---------|-----------|
    | Tables  | ✅        |
    | Tasks   | ✅        |
    | Strike  | ✅        |

    ## Task Lists

    - [x] Parse markdown
    - [x] Render to React
    - [ ] Add more features

    ## Strikethrough

    ~~This is wrong~~ This is correct
  `

  return <MDC markdown={markdown} />
}

/**
 * Example 8: Code Blocks
 * Syntax highlighting support
 */
export function CodeBlockExample() {
  const markdown = `
    # Code Example

    Here's some TypeScript code:

    \`\`\`typescript
    import { MDC } from 'mdc-syntax/react'

    export default function App() {
      return <MDC markdown="# Hello" />
    }
    \`\`\`

    And some inline \`code\` too!
  `

  return <MDC markdown={markdown} />
}
