# Parsing & AST Generation

Complete guide for parsing MDC documents and working with the Minimark AST format.

## Table of Contents

- [String Parsing](#string-parsing)
- [Async Parsing with Syntax Highlighting](#async-parsing-with-syntax-highlighting)
- [Stream Parsing](#stream-parsing)
- [AST Structure](#ast-structure)
- [Rendering AST](#rendering-ast)

---

## String Parsing

The primary way to parse MDC content is using the `parse()` function:

```typescript
import { parse } from 'mdc-syntax'

const content = `---
title: My Document
---

# Hello World

This is **markdown** with :icon-star component.

::alert{type="info"}
Important message here
::
`

const result = parse(content)
```

### Result Structure

```typescript
interface ParseResult {
  body: MinimarkTree        // The parsed AST
  excerpt?: MinimarkTree    // Optional excerpt (before <!-- more -->)
  data: any                 // Frontmatter data
  toc?: any                 // Table of contents
}
```

### Parse Options

```typescript
interface ParseOptions {
  autoUnwrap?: boolean      // Remove unnecessary <p> wrappers (default: true)
  autoClose?: boolean       // Auto-close unclosed syntax (default: true)
  highlight?: boolean | ShikiOptions  // Enable syntax highlighting (async only)
}
```

### Examples

```typescript
// Default parsing
const result = parse(content)

// Disable auto-unwrap
const result = parse(content, { autoUnwrap: false })

// Disable auto-close
const result = parse(content, { autoClose: false })

// Both disabled
const result = parse(content, {
  autoUnwrap: false,
  autoClose: false
})
```

### Auto-Unwrap Feature

Auto-unwrap removes unnecessary paragraph wrappers from container components:

**Without auto-unwrap:**
```json
["alert", {}, ["p", {}, "Text"]]
```

**With auto-unwrap:**
```json
["alert", {}, "Text"]
```

Container components: `alert`, `card`, `callout`, `note`, `warning`, `tip`, `info`

### Auto-Close Feature

Auto-close automatically closes unclosed markdown syntax, essential for streaming:

```typescript
import { autoCloseMarkdown } from 'mdc-syntax'

// Unclosed bold
const partial = '**bold text'
const closed = autoCloseMarkdown(partial)
// Result: '**bold text**'

// Unclosed component
const component = '::alert{type="info"}\nMessage'
const closedComponent = autoCloseMarkdown(component)
// Result: '::alert{type="info"}\nMessage\n::'

// Unclosed properties
const props = 'Text {prop="value'
const closedProps = autoCloseMarkdown(props)
// Result: 'Text {prop="value"}'
```

**Auto-close handles:**
- Inline markers: `*`, `**`, `***`, `~~`, backticks
- Brackets: `[`, `]`, `(`, `)`
- MDC components: `::component`
- Property braces: `{...}`

---

## Async Parsing with Syntax Highlighting

For syntax highlighting support, use `parseAsync()`:

```typescript
import { parseAsync } from 'mdc-syntax'

const content = `
# Code Example

\`\`\`javascript
function hello() {
  console.log("Hello!")
}
\`\`\`
`

// Enable syntax highlighting
const result = await parseAsync(content, {
  highlight: true
})

// With custom Shiki options
const result = await parseAsync(content, {
  highlight: {
    theme: 'github-dark',
    langs: ['javascript', 'typescript', 'python']
  }
})
```

### Shiki Options

```typescript
interface ShikiOptions {
  theme?: string | { light: string, dark: string }
  langs?: string[]
  // ... other Shiki configuration
}
```

### Dual Theme Support

```typescript
const result = await parseAsync(content, {
  highlight: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
```

### Manual Highlighting

```typescript
import { parse, highlightCode } from 'mdc-syntax'

// Parse without highlighting
const result = parse(content)

// Manually apply highlighting
const highlighted = await highlightCode(result.body, {
  theme: 'nord'
})
```

---

## Stream Parsing

MDC Syntax provides powerful streaming APIs for parsing content as it arrives.

### Buffered Streaming

Wait for the complete result:

```typescript
import { createReadStream } from 'node:fs'
import { parseStream } from 'mdc-syntax/stream'

// From file stream
const stream = createReadStream('content.md')
const result = await parseStream(stream)

console.log(result.body)
console.log(result.data)
console.log(result.toc)
```

### Web Streams (Browser/Fetch)

```typescript
import { parseStream } from 'mdc-syntax/stream'

// HTTP fetch
const response = await fetch('https://example.com/article.md')
const result = await parseStream(response.body!)

// Custom Web ReadableStream
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('# Hello\n'))
    controller.enqueue(new TextEncoder().encode('Content here'))
    controller.close()
  }
})
const result = await parseStream(stream)
```

### Incremental Streaming

Real-time updates as chunks arrive:

```typescript
import { parseStreamIncremental } from 'mdc-syntax/stream'

const response = await fetch('https://example.com/large-article.md')

for await (const result of parseStreamIncremental(response.body!)) {
  if (!result.isComplete) {
    // Partial result - update UI progressively
    console.log(`Received ${result.chunk.length} bytes`)
    console.log(`Current elements: ${result.body.value.length}`)

    // Auto-close is automatically applied!
    updateUI(result.body)
  } else {
    // Final result with complete TOC
    console.log('Stream complete!')
    console.log(result.toc)
    finalizeUI(result.body)
  }
}
```

### IncrementalParseResult

```typescript
interface IncrementalParseResult {
  chunk: string             // The chunk just received
  body: MinimarkTree        // Current parsed state
  data: any                 // Frontmatter (once available)
  isComplete: boolean       // Whether stream is finished
  excerpt?: MinimarkTree    // Optional excerpt
  toc?: any                 // TOC (only in final result)
}
```

### Features

- Automatic auto-close on each chunk
- Progressive rendering without syntax errors
- Progress tracking built-in
- Works with both Node.js and Web streams

### Stream from Chunks

```typescript
import { Readable } from 'node:stream'
import { parseStream } from 'mdc-syntax/stream'

const chunks = [
  '# Hello World\n\n',
  'This is **markdown**\n\n',
  '::alert{type="info"}\n',
  'Message here\n',
  '::\n'
]

const stream = Readable.from(chunks)
const result = await parseStream(stream)
```

---

## AST Structure

MDC Syntax uses the **Minimark** format, a lightweight array-based AST structure.

### Minimark Format

```typescript
interface MinimarkTree {
  type: 'minimark'
  value: MinimarkNode[]
}

type MinimarkNode =
  | string                    // Text nodes
  | [tag: string, props?: Record<string, any>, ...children: MinimarkNode[]]
```

### Node Structure

**Text Node:**
```json
"plain text content"
```

**Element Node:**
```json
["tag", { "prop": "value" }, ...children]
```

### Examples

```json
// Paragraph with text
["p", {}, "Simple paragraph"]

// Paragraph with bold text
["p", {}, "Text with ", ["strong", {}, "bold"], " word"]

// Heading with ID
["h1", { "id": "hello-world" }, "Hello World"]

// Link with attributes
["a", { "href": "https://example.com", "target": "_blank" }, "Link"]

// MDC Component
["alert", { "type": "info" }, ["p", {}, "Message"]]

// Component with slots
[
  "card",
  {},
  ["template", { "name": "header" }, ["h2", {}, "Title"]],
  ["template", { "name": "content" }, ["p", {}, "Content"]]
]
```

### Complete AST Example

**Input:**
```markdown
---
title: Example
---

# Hello World

This is **bold** and *italic* text.

::alert{type="warning"}
Warning message
::
```

**AST:**
```json
{
  "type": "minimark",
  "value": [
    [
      "h1",
      { "id": "hello-world" },
      "Hello World"
    ],
    [
      "p",
      {},
      "This is ",
      ["strong", {}, "bold"],
      " and ",
      ["em", {}, "italic"],
      " text."
    ],
    [
      "alert",
      { "type": "warning" },
      ["p", {}, "Warning message"]
    ]
  ]
}
```

**Data (Frontmatter):**
```json
{
  "title": "Example"
}
```

### Property Conventions

- **Boolean props:** `:bool="true"` (props starting with `:`)
- **Standard props:** `key="value"`
- **ID:** `id="value"` (from `{#value}`)
- **Class:** `class="value"` (from `{.value}`)
- **Custom data:** Any attribute name and value

---

## Rendering AST

### Render to HTML

```typescript
import { parse, renderHTML } from 'mdc-syntax'

const content = '# Hello World\n\nThis is **markdown**.'
const result = parse(content)

const html = renderHTML(result.body)
console.log(html)
```

**Output:**
```html
<h1 id="hello-world">Hello World</h1>
<p>This is <strong>markdown</strong>.</p>
```

### Render to Markdown

Convert AST back to MDC markdown:

```typescript
import { parse, renderMarkdown } from 'mdc-syntax'

const content = '# Hello\n\n::alert{type="info"}\nMessage\n::'
const result = parse(content)

const markdown = renderMarkdown(result.body)
console.log(markdown)
```

**Output:**
```markdown
# Hello

::alert{type="info"}
Message
::
```

### Use Cases

- Round-trip parsing (parse → modify AST → render back)
- AST transformation
- Content normalization
- Markdown generation from programmatic AST

---

[← Back to Main Skills Guide](../../SKILLS.md)
