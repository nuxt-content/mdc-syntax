# React Rendering Guide

Complete guide for rendering MDC/Minimark AST in React applications.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Custom Components](#custom-components)
- [Dynamic Component Resolution](#dynamic-component-resolution)
- [Props Conversion](#props-conversion)
- [Streaming Mode](#streaming-mode)
- [High-Level MDC Component](#high-level-mdc-component)
- [Syntax Highlighting](#syntax-highlighting)
- [Prose Components](#prose-components)
- [Custom Props Handling](#custom-props-handling)
- [CSS Class Name](#css-class-name)

---

## Basic Usage

Use the `MDCRenderer` component to render Minimark AST:

```tsx
import { parse } from 'mdc-syntax'
import { MDCRenderer } from 'mdc-syntax/react'

const content = `
# Hello World

This is **markdown** content.

::alert{type="info"}
Important message
::
`

const result = parse(content)

export default function App() {
  return <MDCRenderer body={result.body} />
}
```

---

## Custom Components

Map custom React components to MDC elements:

```tsx
import { MDCRenderer } from 'mdc-syntax/react'
import CustomHeading from './CustomHeading'
import CustomAlert from './CustomAlert'
import CustomCard from './CustomCard'

const customComponents = {
  h1: CustomHeading,
  h2: CustomHeading,
  alert: CustomAlert,
  card: CustomCard,
}

export default function App({ mdcAst }) {
  return (
    <MDCRenderer
      body={mdcAst}
      components={customComponents}
    />
  )
}
```

### Custom Component Example

```tsx
// CustomHeading.tsx
import React from 'react'

interface Props {
  __node: any  // Minimark node
  id?: string
  children: React.ReactNode
}

export default function CustomHeading({ __node, id, children }: Props) {
  const tag = __node[0]  // h1, h2, etc.
  const Component = tag as keyof JSX.IntrinsicElements

  return (
    <Component id={id} className="custom-heading">
      {children}
    </Component>
  )
}
```

**Styled Component:**

```tsx
import styled from 'styled-components'

const StyledHeading = styled.h1<{ level: number }>`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: ${props => 3 - props.level * 0.25}rem;
  margin-bottom: 1rem;
  color: #1a202c;
`

export default function CustomHeading({ __node, children }: Props) {
  const tag = __node[0]
  const level = parseInt(tag[1])  // Extract level from 'h1', 'h2', etc.

  return (
    <StyledHeading as={tag} level={level}>
      {children}
    </StyledHeading>
  )
}
```

### Alert Component Example

```tsx
// CustomAlert.tsx
import React from 'react'
import './Alert.css'

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success'
  children: React.ReactNode
}

export default function CustomAlert({ type = 'info', children }: AlertProps) {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  }

  return (
    <div className={`alert alert-${type}`} role="alert">
      <div className="alert-icon">{icons[type]}</div>
      <div className="alert-content">{children}</div>
    </div>
  )
}
```

---

## Dynamic Component Resolution

Load components dynamically using `componentsManifest`:

```tsx
import { MDCRenderer } from 'mdc-syntax/react'
import { lazy } from 'react'

// Component manifest function
async function loadComponent(name: string) {
  // Dynamic import based on component name
  const module = await import(`./components/${name}`)
  return module
}

// Or with a custom map
const componentMap = {
  'alert': () => import('./Alert'),
  'card': () => import('./Card'),
  'button': () => import('./Button'),
}

async function loadComponent(name: string) {
  if (componentMap[name]) {
    return componentMap[name]()
  }
  throw new Error(`Component ${name} not found`)
}

export default function App({ mdcAst }) {
  return (
    <MDCRenderer
      body={mdcAst}
      componentsManifest={loadComponent}
    />
  )
}
```

**Note:** Components loaded via manifest are automatically wrapped in `React.Suspense`.

### With Fallback

```tsx
import { Suspense } from 'react'

async function loadComponent(name: string) {
  try {
    return await import(`./components/${name}`)
  } catch (error) {
    // Return fallback component
    return {
      default: ({ children }: any) => <div data-component={name}>{children}</div>
    }
  }
}

export default function App({ mdcAst }) {
  return (
    <Suspense fallback={<div>Loading components...</div>}>
      <MDCRenderer
        body={mdcAst}
        componentsManifest={loadComponent}
      />
    </Suspense>
  )
}
```

---

## Props Conversion

React renderer handles HTML attribute conversion automatically:

### Attribute Mapping

```tsx
// Markdown attribute → React prop
{class="foo"}           → className="foo"
{tabindex="0"}          → tabIndex={0}
{style="..."}           → style={{...}}  (converted to object)
{:bool="true"}          → bool={true}    (parsed from string)
{:count="5"}            → count={5}      (parsed as number)
{:data='{"key":"val"}'} → data={{key:"val"}} (parsed as object)
```

### Style Conversion

```tsx
// Input: style="color: red; font-size: 16px"
// Output: style={{ color: 'red', fontSize: '16px' }}

// Custom CSS properties preserved:
// Input: style="--custom-color: blue"
// Output: style={{ '--custom-color': 'blue' }}
```

### Boolean Props

```tsx
// Markdown: **text**{:disabled}
// React prop: disabled={true}

// Markdown: [link](url){:external}
// React prop: external={true}
```

### Number Props

```tsx
// Markdown: ::component{:count="5"}
// React prop: count={5}

// Markdown: ::component{:max="100"}
// React prop: max={100}
```

### Object/Array Props

```tsx
// Markdown: ::component{:config='{"theme":"dark"}'}
// React prop: config={{theme:"dark"}}

// Markdown: ::component{:items='["a","b","c"]'}
// React prop: items={["a","b","c"]}
```

---

## Streaming Mode

Enable streaming-specific components for real-time content:

```tsx
import { useState, useEffect } from 'react'
import { parseStreamIncremental } from 'mdc-syntax/stream'
import { MDCRenderer } from 'mdc-syntax/react'

export default function StreamingContent() {
  const [mdcAst, setMdcAst] = useState({ type: 'minimark', value: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadContent() {
      const response = await fetch('/api/content.md')

      for await (const result of parseStreamIncremental(response.body!)) {
        setMdcAst(result.body)

        if (result.isComplete) {
          setIsLoading(false)
        }
      }
    }

    loadContent()
  }, [])

  return (
    <>
      {isLoading && <div>Loading...</div>}
      <MDCRenderer body={mdcAst} stream={true} />
    </>
  )
}
```

### With Progress Indicator

```tsx
export default function StreamingContent() {
  const [mdcAst, setMdcAst] = useState({ type: 'minimark', value: [] })
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    async function loadContent() {
      const response = await fetch('/api/content.md')
      const contentLength = parseInt(response.headers.get('content-length') || '0')
      let bytesReceived = 0

      for await (const result of parseStreamIncremental(response.body!)) {
        bytesReceived += result.chunk.length
        setProgress(Math.round((bytesReceived / contentLength) * 100))
        setMdcAst(result.body)

        if (result.isComplete) {
          setIsComplete(true)
        }
      }
    }

    loadContent()
  }, [])

  return (
    <div>
      {!isComplete && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}
      <MDCRenderer body={mdcAst} stream={true} />
    </div>
  )
}
```

### Server-Sent Events (SSE)

```tsx
export default function SSEStreamingContent() {
  const [mdcAst, setMdcAst] = useState({ type: 'minimark', value: [] })

  useEffect(() => {
    const eventSource = new EventSource('/api/markdown-stream')

    let accumulated = ''

    eventSource.onmessage = (event) => {
      accumulated += event.data

      // Parse accumulated content with auto-close
      const result = parse(accumulated, { autoClose: true })
      setMdcAst(result.body)
    }

    eventSource.addEventListener('done', () => {
      eventSource.close()
    })

    return () => eventSource.close()
  }, [])

  return <MDCRenderer body={mdcAst} stream={true} />
}
```

---

## High-Level MDC Component

Parse markdown directly:

```tsx
import { MDC } from 'mdc-syntax/react'

const markdownContent = `
# Hello World

This is **markdown** with components.

::alert{type="info"}
Message here
::
`

export default function App() {
  return <MDC content={markdownContent} />
}
```

### With Custom Components

```tsx
import { MDC } from 'mdc-syntax/react'
import CustomAlert from './CustomAlert'

const customComponents = {
  alert: CustomAlert,
}

const markdownContent = `
::alert{type="warning"}
Custom alert component
::
`

export default function App() {
  return <MDC content={markdownContent} components={customComponents} />
}
```

### Reactive Content

```tsx
import { useState } from 'react'
import { MDC } from 'mdc-syntax/react'

export default function MarkdownEditor() {
  const [content, setContent] = useState('# Edit me!\n\nType **markdown** here.')

  return (
    <div className="editor">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="editor-input"
      />
      <div className="editor-preview">
        <MDC content={content} />
      </div>
    </div>
  )
}
```

---

## Syntax Highlighting

Use the built-in Shiki code block component:

```tsx
import { MDCRenderer, ShikiCodeBlock } from 'mdc-syntax/react'

const customComponents = {
  pre: ShikiCodeBlock,
}

export default function App({ mdcAst }) {
  return (
    <MDCRenderer
      body={mdcAst}
      components={customComponents}
    />
  )
}
```

### With Async Parsing

```tsx
import { useState, useEffect } from 'react'
import { parseAsync } from 'mdc-syntax'
import { MDCRenderer } from 'mdc-syntax/react'

export default function App() {
  const [mdcAst, setMdcAst] = useState(null)

  useEffect(() => {
    async function loadContent() {
      const content = `
# Code Example

\`\`\`javascript
function hello() {
  console.log("Hello!")
}
\`\`\`
      `

      const result = await parseAsync(content, {
        highlight: {
          theme: { light: 'github-light', dark: 'github-dark' }
        }
      })

      setMdcAst(result.body)
    }

    loadContent()
  }, [])

  if (!mdcAst) return <div>Loading...</div>

  return <MDCRenderer body={mdcAst} />
}
```

### Custom Code Block Component

```tsx
import { Highlight, themes } from 'prism-react-renderer'

interface CodeBlockProps {
  language?: string
  filename?: string
  highlights?: number[]
  children: React.ReactNode
}

export function CustomCodeBlock({
  language = 'text',
  filename,
  highlights = [],
  children
}: CodeBlockProps) {
  const code = typeof children === 'string' ? children : ''

  return (
    <div className="code-block">
      {filename && <div className="code-filename">{filename}</div>}
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style}>
            {tokens.map((line, i) => (
              <div
                key={i}
                {...getLineProps({ line })}
                className={highlights.includes(i + 1) ? 'highlighted' : ''}
              >
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
```

---

## Prose Components

Use pre-built styled components:

```tsx
import { MDCRenderer } from 'mdc-syntax/react'
import { standardProseComponents } from 'mdc-syntax/react/prose/standard'

export default function App({ mdcAst }) {
  return (
    <MDCRenderer
      body={mdcAst}
      components={standardProseComponents}
    />
  )
}
```

**Prose components include:** h1-h6, p, a, strong, em, del, code, pre, ul, ol, li, blockquote, table, thead, tbody, tr, th, td, hr

### Combining with Custom Components

```tsx
import { standardProseComponents } from 'mdc-syntax/react/prose/standard'
import CustomAlert from './CustomAlert'

const components = {
  ...standardProseComponents,
  alert: CustomAlert,  // Override or add custom components
}

export default function App({ mdcAst }) {
  return <MDCRenderer body={mdcAst} components={components} />
}
```

### Tailwind CSS Prose

```tsx
export default function App({ mdcAst }) {
  return (
    <article className="prose prose-lg dark:prose-dark max-w-none">
      <MDCRenderer body={mdcAst} />
    </article>
  )
}
```

---

## Custom Props Handling

Access props in custom components:

```tsx
// CustomAlert.tsx
interface AlertProps {
  type?: string        // From {type="info"}
  bool?: boolean       // From {bool} → :bool="true"
  count?: number       // From {:count="5"}
  data?: object        // From {:data='{"key":"val"}'}
  __node?: any         // Original Minimark node
  children: React.ReactNode
}

export default function CustomAlert({
  type = 'info',
  bool,
  count,
  data,
  __node,
  children
}: AlertProps) {
  return (
    <div
      className={`alert alert-${type}`}
      data-bool={bool}
      data-count={count}
      data-info={JSON.stringify(data)}
      role="alert"
    >
      {children}
    </div>
  )
}
```

### Property Types

- `:bool="true"` → `bool={true}` (boolean)
- `:count="5"` → `count={5}` (number)
- `:obj='{"key":"val"}'` → `obj={{key:"val"}}` (object)
- `attr="value"` → `attr="value"` (string)

### Accessing Node Structure

```tsx
interface Props {
  __node?: any
  children: React.ReactNode
}

export default function Component({ __node, children }: Props) {
  // Node structure: [tag, props, ...children]
  const tag = __node?.[0]
  const nodeProps = __node?.[1] || {}
  const nodeChildren = __node?.slice(2) || []

  return (
    <div data-tag={tag}>
      {children}
    </div>
  )
}
```

### Working with Complex Props

```tsx
// DataTable.tsx
interface DataTableProps {
  columns?: string[]   // From {:columns='["Name","Age"]'}
  sortable?: boolean   // From {sortable}
  striped?: boolean    // From {striped}
  children: React.ReactNode
}

export default function DataTable({
  columns = [],
  sortable = false,
  striped = false,
  children
}: DataTableProps) {
  return (
    <table className={striped ? 'table-striped' : ''}>
      {columns.length > 0 && (
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>
                {col}
                {sortable && <button>↕</button>}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>{children}</tbody>
    </table>
  )
}
```

**Usage in Markdown:**

```markdown
::data-table{:columns='["Name", "Age", "Email"]' sortable striped}
Table content here
::
```

---

## CSS Class Name

Add custom wrapper class:

```tsx
<MDCRenderer
  body={mdcAst}
  className="prose dark:prose-dark"
/>
```

**Output:**
```html
<div class="mdc-content prose dark:prose-dark">
  <!-- Rendered content -->
</div>
```

### With Tailwind CSS

```tsx
<MDCRenderer
  body={mdcAst}
  className="prose prose-slate lg:prose-xl dark:prose-invert max-w-none"
/>
```

### With CSS Modules

```tsx
import styles from './Content.module.css'

<MDCRenderer
  body={mdcAst}
  className={styles.content}
/>
```

---

[← Back to Main Skills Guide](../../SKILLS.md)
