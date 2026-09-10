<script lang="ts">
  import { Markdown } from '@comark/svelte'
  import shiki from '@comark/svelte/plugins/shiki'
  import Alert from '../components/Alert.svelte'
  import python from '@shikijs/langs/python'

  const componentsManifest = (name: string) => {
    if (name === 'lazy-card') {
      return import('../components/LazyCard.svelte')
    }
  }

  const markdown = `
# Comark Syntax Showcase

All syntax features supported by Comark, from standard **CommonMark** to Comark-specific extensions.

---

## Headings

# Heading 1
## Heading 2
### Heading 3

---

## Text Formatting

**Bold** and __also bold__

*Italic* and _also italic_

***Bold and italic*** together

~~Strikethrough~~

\`Inline code\`

---

## Links

A [plain link](https://comark.dev), a [link with title](https://comark.dev "Comark"), and a [link with attributes](https://comark.dev){target="_blank" rel="noopener"}.

---

## Lists

### Unordered

- Item one
- Item two
  - Nested item
  - Another nested item
- Item three

### Ordered

1. First item
2. Second item
   1. Nested ordered
   2. Another nested

### Task list

- [x] Completed task
- [ ] Pending task

---

## Blockquotes

> A simple blockquote.

> Blockquotes support **formatting** and
> can span multiple lines.

---

## Alert Blockquotes

> [!NOTE]
> A note for the reader.

> [!WARNING]
> Something to be cautious about.

---

## Code Blocks

With a language:

~~~javascript
function greet(name) {
  return \`Hello, \${name}!\`
}
~~~

With a filename:

~~~typescript [utils.ts]
export function add(a: number, b: number): number {
  return a + b
}
~~~

With line highlighting:

~~~python {1,3-5}
print("Line 1 — highlighted")
print("Line 2 — not highlighted")
print("Line 3 — highlighted")
print("Line 4 — highlighted")
print("Line 5 — highlighted")
~~~

---

## Tables

| Name           | Type       | Required | Description              |
| :------------- | :--------: | :------: | -----------------------: |
| \`markdown\`     | \`string\`   | Yes      | Content to render        |
| \`components\`   | \`object\`   | No       | Custom component map     |

---

## Block Components

::alert{type="info"}
This is an **info** alert rendered with a custom \`Alert\` component.
::

::alert{type="warning"}
This is a **warning** alert with a [link](https://comark.dev).
::

### Lazy-loaded components

The \`componentsManifest\` prop resolves missing components on demand:

::lazy-card{title="Loaded only when rendered" accent="cyan"}
This card is not part of the static \`components\` map. It is imported by the Svelte renderer from \`componentsManifest\`.
::

### Nested

::alert{type="info"}
Outer info alert.
  :::alert{type="warning"}
  Nested warning inside the info.
  :::
::

---

## Frontmatter

Documents can declare YAML frontmatter at the top (before any content). Access it via \`tree.frontmatter\` when using \`MarkdownDocument\`.

---

## Comments

HTML comments are parsed and ignored by the renderer:

<!-- This comment is invisible in the output -->

Text before the comment and text after the comment both render normally.
`
</script>

<Markdown
  value={markdown}
  plugins={[shiki({ languages: [python] })]}
  components={{ Alert }}
  {componentsManifest}
/>
