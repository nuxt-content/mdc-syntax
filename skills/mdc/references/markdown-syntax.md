# Markdown Syntax Guide

Complete guide for writing MDC (Markdown Components) documents.

## Table of Contents

- [Standard Markdown](#standard-markdown)
- [Frontmatter](#frontmatter)
- [MDC Components](#mdc-components)
- [Attributes](#attributes)
- [Code Blocks](#code-blocks)
- [Task Lists](#task-lists)
- [Tables](#tables)

---

## Standard Markdown

MDC Syntax supports all standard CommonMark and GitHub Flavored Markdown (GFM) features:

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

**Note:** All headings automatically get ID attributes generated from their content for linking (e.g., `# Hello World` becomes `<h1 id="hello-world">`).

### Text Formatting

```markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
`Inline code`
```

### Lists

```markdown
<!-- Unordered lists -->
- Item 1
- Item 2
  - Nested item
  - Another nested item

<!-- Ordered lists -->
1. First item
2. Second item
   1. Nested item
   2. Another nested item
```

### Links and Images

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Link title")
![Image alt text](https://example.com/image.png)
```

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
>
> And contain other markdown elements
```

### Horizontal Rules

```markdown
---
***
___
```

### Line Breaks

```markdown
Line with two trailing spaces
Creates a hard line break
```

---

## Frontmatter

MDC Syntax supports YAML frontmatter at the beginning of documents:

```markdown
---
title: My Document Title
author: John Doe
date: 2024-01-15
tags:
  - markdown
  - documentation
depth: 3
searchDepth: 2
custom_field: custom value
---

# Document Content

Your markdown content here...
```

### Features

- Must be at the very beginning of the document
- Enclosed by `---` delimiters
- Parsed as YAML
- Available in the `data` property of ParseResult

### Special Fields

- **title**: Used in table of contents generation
- **depth**: Maximum heading level for TOC (default: 2)
- **searchDepth**: Depth for TOC search (default: 2)

### Example

```typescript
import { parse } from 'mdc-syntax'

const content = `---
title: My Article
depth: 3
---

# Introduction
Content here...
`

const result = parse(content)
console.log(result.data)
// { title: 'My Article', depth: 3 }
```

---

## MDC Components

MDC (Markdown Components) extends standard markdown with custom component syntax.

### Block Components

Block components use the `::component-name` syntax:

```markdown
::component-name{prop1="value1" prop2="value2"}
Content inside the component

Can have **markdown** and other elements
::
```

#### Examples

```markdown
<!-- Alert component -->
::alert{type="info"}
This is an important message!
::

<!-- Card component -->
::card{title="My Card"}
Card content with **markdown** support
::

<!-- Empty component -->
::divider
::
```

### Inline Components

Inline components use the `:component-name` syntax:

```markdown
<!-- Standalone inline component -->
:icon-check

<!-- Inline component with content -->
:badge[New]{color="blue"}

<!-- Inline component with properties -->
:tooltip{text="Hover text"}
```

#### Examples

```markdown
Check out this :icon-star component in the middle of text.

Click the :button[Submit]{type="primary"} to continue.

The status is :badge[Active]{color="green"} right now.
```

### Component Properties

Components support various property syntaxes:

```markdown
::component{prop="value"}
<!-- Standard key-value pair -->
::

::component{bool}
<!-- Boolean property (becomes :bool="true" in AST) -->
::

::component{#custom-id}
<!-- ID attribute -->
::

::component{.class-name}
<!-- CSS class -->
::

::component{obj='{"key": "value"}'}
<!-- Object/JSON value -->
::

::component{arr='["item1", "item2"]'}
<!-- Array/JSON value -->
::

::component{multiple="props" bool #id .class}
<!-- Multiple properties combined -->
::
```

### Component Slots

Block components support named slots using the `#slot-name` syntax:

```markdown
::card
#header
## Card Title

#content
This is the main content of the card

#footer
Footer text here
::
```

#### AST Output

```json
{
  "type": "minimark",
  "value": [
    [
      "card",
      {},
      [
        "template",
        { "name": "header" },
        ["h2", {}, "Card Title"]
      ],
      [
        "template",
        { "name": "content" },
        ["p", {}, "This is the main content of the card"]
      ],
      [
        "template",
        { "name": "footer" },
        ["p", {}, "Footer text here"]
      ]
    ]
  ]
}
```

### Nested Components

Components can be nested within each other:

```markdown
::outer-component
Content in outer

::inner-component{variant="compact"}
Content in inner
::

More content in outer
::
```

---

## Attributes

MDC Syntax allows adding custom attributes to native markdown elements using `{...}` syntax after the element.

### Strong/Bold Attributes

```markdown
**bold text**{.highlight #important}
**bold text**{data-value="custom"}
**bold text**{bool}
```

### Italic/Emphasis Attributes

```markdown
*italic text*{.emphasized}
_italic text_{#custom-id}
```

### Link Attributes

```markdown
[Link text](url){target="_blank" rel="noopener"}
[Link text](url){.button .primary}
[External](https://example.com){target="_blank" .external-link}
```

### Image Attributes

```markdown
![Alt text](image.png){.responsive width="800" height="600"}
![Logo](logo.svg){.logo #site-logo}
```

### Inline Code Attributes

```markdown
`code snippet`{.language-js}
`variable`{data-type="string"}
```

### Span Attributes

```markdown
This is [highlighted text]{.highlight .yellow} in a paragraph.
```

### Attribute Types

- **Boolean:** `{bool}` → `:bool="true"`
- **ID:** `{#my-id}` → `id="my-id"`
- **Class:** `{.my-class}` → `class="my-class"`
- **Key-Value:** `{key="value"}` → `key="value"`
- **JSON Objects:** `{data='{"key": "val"}'}` → `data={"key": "val"}`

---

## Code Blocks

MDC Syntax provides advanced code block features with metadata support.

### Basic Code Block

````markdown
```javascript
function hello() {
  console.log("Hello, World!")
}
```
````

### Language with Syntax Highlighting

````markdown
```typescript
interface User {
  name: string
  age: number
}
```
````

### Filename Metadata

````markdown
```javascript [server.js]
const express = require('express')
const app = express()
```
````

**Note:** Filename is enclosed in `[...]` brackets.

### Line Highlighting

````markdown
```javascript {1-3,5}
function example() {
  const a = 1  // Lines 1-3 highlighted
  const b = 2
  const c = 3
  return a + b + c  // Line 5 highlighted
}
```
````

#### Highlighting Syntax

- Single line: `{3}`
- Range: `{1-5}`
- Multiple: `{1,3,5}`
- Combined: `{1-3,7,10-12}`

### Combined Metadata

````markdown
```javascript {1-3} [utils.ts] meta=value
function hello() {
  console.log("Hello")
}
```
````

**Metadata Order:** Any order is supported:
- `language {highlights} [filename] meta`
- `language [filename] {highlights} meta`
- etc.

### Special Characters in Filename

````markdown
```typescript [@[...slug\].ts]
// Brackets and special chars are supported
// Backslash escapes special characters
```
````

### No Language Specified

````markdown
```
Plain text code block
No syntax highlighting
```
````

### AST Structure

```json
{
  "type": "minimark",
  "value": [
    [
      "pre",
      {
        "language": "javascript",
        "filename": "server.js",
        "highlights": [1, 2, 3],
        "meta": "meta=value"
      },
      [
        "code",
        { "class": "language-javascript" },
        "code content here"
      ]
    ]
  ]
}
```

---

## Task Lists

MDC Syntax supports GitHub Flavored Markdown task lists:

```markdown
- [x] Completed task
- [ ] Pending task
- [x] Another completed task
  - [ ] Nested pending task
  - [x] Nested completed task
```

### Features

- `[x]` or `[X]` for completed tasks
- `[ ]` for pending tasks
- Works in both ordered and unordered lists
- Supports nesting

### HTML Output

```html
<ul class="contains-task-list">
  <li class="task-list-item">
    <input type="checkbox" disabled checked class="task-list-item-checkbox">
    Completed task
  </li>
  <li class="task-list-item">
    <input type="checkbox" disabled class="task-list-item-checkbox">
    Pending task
  </li>
</ul>
```

---

## Tables

MDC Syntax supports GitHub Flavored Markdown tables:

```markdown
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

### Aligned Tables

```markdown
| Left Aligned | Center Aligned | Right Aligned |
| :----------- | :------------: | ------------: |
| Left         | Center         | Right         |
| Text         | Text           | Text          |
```

#### Alignment Syntax

- Left: `:---`
- Center: `:---:`
- Right: `---:`

### Inline Markdown in Tables

```markdown
| Feature      | Status          | Link                    |
| ------------ | --------------- | ----------------------- |
| **Bold**     | *Italic*        | [Link](https://example) |
| `Code`       | ~~Strike~~      | ![Image](img.png)       |
```

### Varying Column Widths

```markdown
| Short | Medium Column | Very Long Column Name Here |
| ----- | ------------- | -------------------------- |
| A     | B             | C                          |
```

**Note:** Column width is determined by the longest content in each column.

---

[← Back to Main Skills Guide](../../SKILLS.md)
