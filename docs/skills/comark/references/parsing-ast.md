# Parsing & Document Model

Complete guide for parsing Comark content and working with the serializable `MarkdownDocument` model.

## Table of Contents

- [String Parsing](#string-parsing)
- [Async Parsing with Syntax Highlighting](#async-parsing-with-syntax-highlighting)
- [Document Structure](#document-structure)
- [Rendering Documents](#rendering-documents)

---

## String Parsing

The primary way to parse Comark content is using the `parseMarkdown()` function:

```typescript
import { parseMarkdown } from 'comark'

const content = `---
title: My Document
---

# Hello World

This is **markdown** with :icon-star component.

::alert{type="info"}
Important message here
::
`

const result = await parseMarkdown(content)
```

### Result Structure

```typescript
interface MarkdownDocument {
  nodes: Node[]                   // Parsed AST nodes
  frontmatter: Record<string, any>      // YAML frontmatter data
  meta: {
    toc?: any                           // Table of contents (from toc plugin)
    summary?: Node[]              // Summary content (from summary plugin)
    [key: string]: any                  // Other plugin metadata
  }
}
```

### Parse Options

```typescript
interface ParserOptions {
  autoUnwrap?: boolean      // Remove unnecessary <p> wrappers (default: true)
  autoClose?: boolean | 'streaming' | ((markdown: string) => string)  // Auto-close unclosed syntax (default: 'streaming')
  plugins?: ComarkPlugin[]  // Enable plugins (e.g., highlight, emoji, toc)
}
```

### Examples

```typescript
// Default parsing
const result = await parseMarkdown(content)

// Disable auto-unwrap
const result = await parseMarkdown(content, { autoUnwrap: false })

// Disable auto-close
const result = await parseMarkdown(content, { autoClose: false })

// Both disabled
const result = await parseMarkdown(content, {
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

Auto-unwrap applies to any component whose only child is a single paragraph.

### Auto-Close Feature

Auto-close automatically closes unclosed markdown syntax, essential for streaming:

```typescript
import { autoCloseMarkdown } from 'comark'

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
- Comark components: `::component`
- Property braces: `{...}`

---

## Async Parsing with Syntax Highlighting

For syntax highlighting support, use the `highlight` plugin:

```typescript
import { parseMarkdown } from 'comark'
import shiki from 'comark/plugins/shiki'

const content = `
# Code Example

\`\`\`javascript
function hello() {
  console.log("Hello!")
}
\`\`\`
`

// Enable syntax highlighting
const result = await parseMarkdown(content, {
  plugins: [shiki()]
})

// With custom Shiki options
const result = await parseMarkdown(content, {
  plugins: [
    shiki({
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      languages: ['javascript', 'typescript', 'python']
    })
  ]
})
```

### Highlight Plugin Options

```typescript
// Standard entry: comark/plugins/shiki
interface ShikiOptions {
  registerDefaultLanguages?: boolean  // default: true
  registerDefaultThemes?: boolean     // default: true
  themes?: {
    light?: ThemeRegistration         // default: material-theme-lighter
    dark?: ThemeRegistration          // default: material-theme-palenight
  }
  languages?: Array<LanguageRegistration | LanguageRegistration[]>  // merged onto default set
  transformers?: ShikiTransformer[]
  preStyles?: boolean
}

// Core entry: comark/plugins/shiki/core — no defaults / no registerDefault*
interface ShikiCoreOptions {
  themes: {                           // required
    light?: ThemeRegistration
    dark?: ThemeRegistration
  }
  languages: Array<LanguageRegistration | LanguageRegistration[]>  // required
  transformers?: ShikiTransformer[]
  preStyles?: boolean
}
```

### Dual Theme Support

```typescript
import shiki from 'comark/plugins/shiki'

const result = await parseMarkdown(content, {
  plugins: [
    shiki({
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    })
  ]
})
```

---

## Document Structure

Comark returns a serializable `MarkdownDocument` with compact array-based nodes.

### MarkdownDocument Format

```typescript
interface MarkdownDocument {
  nodes: Node[]                   // Parsed AST nodes
  frontmatter: Record<string, any>      // YAML frontmatter data
  meta: {
    toc?: any                           // Table of contents (from toc plugin)
    summary?: Node[]              // Summary content (from summary plugin)
    [key: string]: any                  // Other plugin metadata
  }
}

type Node =
  | string                    // Text nodes
  | [tag: string, props?: Record<string, any>, ...children: Node[]]
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

// Comark Component
["alert", { "type": "info" }, ["p", {}, "Message"]]

// Component with slots
[
  "card",
  {},
  ["template", { "name": "header" }, ["h2", {}, "Title"]],
  ["template", { "name": "content" }, ["p", {}, "Content"]]
]

// Default slot: content without #slot-name becomes direct children
["component", {}, "hello"]

// Explicit #default wraps in a template node (equivalent in rendering)
["component", {}, ["template", { "name": "default" }, "hello"]]
```

### Complete Document Example

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
  "nodes": [
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
  ],
  "frontmatter": {
    "title": "Example"
  },
  "meta": {}
}
```

### Property Conventions

- **Boolean props:** `:bool="true"` (props starting with `:`)
- **Standard props:** `key="value"`
- **ID:** `id="value"` (from `{#value}`)
- **Class:** `class="value"` (from `{.value}`)
- **Custom data:** Any attribute name and value

---

## Rendering Documents

### Render to HTML

```typescript
import { parseMarkdown } from 'comark'
import { renderHtmlFromDocument } from '@comark/html'

const content = '# Hello World\n\nThis is **markdown**.'
const doc = await parseMarkdown(content)

const html = await renderHtmlFromDocument(doc)
console.log(html)
```

**Output:**
```html
<h1 id="hello-world">Hello World</h1>
<p>This is <strong>markdown</strong>.</p>
```

### Render to Markdown

Convert AST back to Comark markdown:

```typescript
import { parseMarkdown } from 'comark'
import { renderMarkdown } from 'comark/render'

const content = '# Hello\n\n::alert{type="info"}\nMessage\n::'
const document = await parseMarkdown(content)

const markdown = await renderMarkdown(document)
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
