# @mdc-syntax/math

Math formula support for [mdc-syntax](https://github.com/nuxt-content/mdc-syntax) using [KaTeX](https://katex.org/).

## Features

- ✅ Inline math with `$...$` syntax (tokenized at parse time)
- ✅ Display math with `$$...$$` syntax (tokenized at parse time)
- ✅ Math code blocks with ` ```math ` language
- ✅ HTML output via KaTeX
- ✅ Full LaTeX math syntax support
- ✅ Vue and React components
- ✅ TypeScript support
- ✅ Automatic tokenization during parsing for optimal performance

## Installation

```bash
npm install @mdc-syntax/math mdc-syntax katex
# or
pnpm add @mdc-syntax/math mdc-syntax katex
# or
yarn add @mdc-syntax/math mdc-syntax katex
```

**Note:** KaTeX is a peer dependency. Make sure to install it and include its CSS.

## Usage

### Vue

```vue
<script setup>
import { MDC } from 'mdc-syntax/vue'
import mathPlugin from '@mdc-syntax/math'
import { Math } from '@mdc-syntax/math/vue'

const markdown = `
# Math Examples

Inline math: $E = mc^2$

Display math:
$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`

const components = {
  math: Math
}
</script>

<template>
  <Suspense>
    <MDC :markdown="markdown" :components="components" :options="{ plugins: [mathPlugin] }" />
  </Suspense>
</template>
```

**Important:** 
- The `mathPlugin` must be passed to parse and tokenize `$...$` and `$$...$$` expressions
- Include KaTeX CSS: `import 'katex/dist/katex.min.css'` in your app
- MDC component requires `<Suspense>` wrapper (it's async)

### React

```tsx
import { MDC } from 'mdc-syntax/react'
import mathPlugin from '@mdc-syntax/math'
import { Math } from '@mdc-syntax/math/react'

const components = {
  math: Math
}

function App() {
  const markdown = `
# Math Examples

Inline math: $E = mc^2$

Display math:
$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
  `

  return <MDC markdown={markdown} components={components} options={{ plugins: [mathPlugin] }} />
}
```

**Important:** 
- The `mathPlugin` must be passed to parse and tokenize `$...$` and `$$...$$` expressions
- Include KaTeX CSS import

### Core Parsing API

```typescript
import { parse } from 'mdc-syntax'
import mathPlugin from '@mdc-syntax/math'

const result = parse('Inline $x^2$ and display $$E = mc^2$$', {
  plugins: [mathPlugin]
})

// The AST will contain math nodes with LaTeX content
console.log(result.body)
```

## How It Works

The plugin uses a two-stage approach:

1. **Parse Time (markdown-it plugin):**
   - Custom inline rules detect `$...$` and `$$...$$` syntax
   - LaTeX expressions are tokenized and stored in the AST
   - No rendering happens at this stage

2. **Render Time (Vue/React components):**
   - The `Math` component receives LaTeX content via props
   - KaTeX renders the LaTeX to HTML on demand
   - Component determines display mode based on CSS class

This architecture provides optimal performance by separating parsing from rendering.

## Syntax Support

The package supports full LaTeX math syntax via KaTeX:

### Inline vs Display Math

```markdown
Inline math: $E = mc^2$ appears in the text flow

Display math (on its own line):
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

Inline display (same line): Text $$E = mc^2$$ more text
```

### Basic Operations

```markdown
$x + y - z$
$a \times b \div c$
$x^2 + y^2 = z^2$
$x_1, x_2, \ldots, x_n$
```

### Fractions and Roots

```markdown
$\frac{a}{b}$
$\sqrt{x}$
$\sqrt[3]{x}$
```

### Greek Letters

```markdown
$\alpha, \beta, \gamma, \Delta, \Sigma$
```

### Integrals and Sums

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

### Matrices

```markdown
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

### Limits

```markdown
$$
\lim_{x \to \infty} f(x)
$$
```

### Code Blocks

You can also use code blocks for larger expressions:

````markdown
```math
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```
````


## Edge Cases

### Dollar Signs in Text

The plugin intelligently avoids matching dollar signs that aren't math:

```markdown
Prices like $100 or $200 won't be parsed as math
```

The parser requires:
- At least one character between `$` delimiters
- Content that doesn't start with a digit
- Proper closing delimiter

### Math in Headings, Lists, Blockquotes

Math works everywhere:

```markdown
# Formula $E = mc^2$

- Item with $x^2$
- Another with $y^2$

> Quote with $\alpha + \beta$
```

### Code Blocks and Inline Code

Math is **not** parsed inside code:

```markdown
Inline code: `$x^2$` stays as-is

```
Code block $x^2$ also stays as-is
```
```

## Configuration

### Math Component Props

Both Vue and React `Math` components accept:

- `content` (string, required): The LaTeX expression
- `class` (string, optional): CSS classes (determines inline vs display mode)

The component automatically renders in display mode when the class contains "block", otherwise inline mode.

## Troubleshooting

### Math not rendering

1. **Plugin not included**: Make sure to pass `plugins: [mathPlugin]` to the parse/MDC component
2. **KaTeX CSS not loaded**: Import `'katex/dist/katex.min.css'` in your app
3. **Component not registered**: Register the `Math` component in the components map

### Math appearing as plain text

If you see `$x^2$` in the output:
- The plugin might not be loaded
- Check that the plugin is in the `plugins` array

### Invalid LaTeX errors

KaTeX will show an error message for invalid LaTeX. Check your syntax:
- Escape backslashes in JavaScript strings: `\\frac` not `\frac`
- Use double backslashes in template strings

## Performance

The plugin is designed for performance:

1. **Parse-time tokenization**: Math is identified during markdown parsing
2. **Lazy rendering**: KaTeX only renders when components mount
3. **No regex scanning at render time**: All pattern matching happens once during parse
4. **Minimal overhead**: LaTeX stored as plain text in AST until render

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Run tests in watch mode
pnpm test -- --watch
```

## License

MIT
